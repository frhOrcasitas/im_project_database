import pool from "../../lib/db";
import { NextResponse } from "next/server";

// ==========================
// POST - CREATE SALE
// ==========================
export async function POST(request) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const body = await request.json();
    const { 
      client_ID, 
      employee_ID, 
      sales_notes, 
      items, 
      payment,
      sales_SINumber, 
      sales_DRNumber, 
      sales_SWSNumber 
    } = body;

    // 1. Validate items
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Sale must contain at least one item." }, { status: 400 });
    }

    // 2. Calculate total
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += (item.quantity || item.qty) * (item.unitPrice || item.price);
    }

    // 3. Insert into tbl_sales
    const [saleResult] = await connection.query(
      `INSERT INTO tbl_sales 
       (client_ID, employee_ID, sales_notes, sales_totalAmount, sales_status,
        sales_paymentStatus, sales_Balance, sales_SINumber, sales_DRNumber, sales_SWSNumber)
       VALUES (?, ?, ?, ?, 'Pending', 'Unpaid', ?, ?, ?, ?)`,
      [
        client_ID, 
        employee_ID || null, 
        sales_notes || null,
        totalAmount, 
        totalAmount, // sales_Balance starts as totalAmount
        sales_SINumber || null, 
        sales_DRNumber || null, 
        sales_SWSNumber || null
      ]
    );

    const sales_ID = saleResult.insertId;

    // 4. Insert items + deduct stock
    for (const item of items) {
      const qty = item.quantity || item.qty;
      const price = item.unitPrice || item.price;
      const subtotal = qty * price;
      const prod_ID = item.productLine_ID || item.product_ID;

      // Deduct stock but only if sufficient quantity exists
      const [updateResult] = await connection.query(
        `UPDATE tbl_product
         SET product_stockQty = product_stockQty - ?
         WHERE product_ID = ? AND product_stockQty >= ?`,
        [qty, prod_ID, qty]
      );

      if (updateResult.affectedRows === 0) {
        throw new Error(`Insufficient stock for product ID: ${prod_ID}`);
      }

      await connection.query(
        `INSERT INTO tbl_sales_details
         (sales_ID, productLine_ID, salesDetail_qty, salesDetail_unitPriceSold, salesDetail_subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [sales_ID, prod_ID, qty, price, subtotal]
      );
    }

    // 5. Handle initial payment if provided
    const amountPaid = payment ? parseFloat(payment.payment_amount || 0) : 0;
    if (amountPaid > 0) {
      await connection.query(
        `INSERT INTO tbl_payment_details
         (sales_ID, payment_type, payment_paidDate, payment_amount, employee_ID)
         VALUES (?, ?, CURDATE(), ?, ?)`,
        [sales_ID, payment.payment_type, amountPaid, employee_ID || null]
      );

      const newBalance = totalAmount - amountPaid;
      const paymentStatus = newBalance <= 0 ? "Paid" : "Partial";

      await connection.query(
        `UPDATE tbl_sales
         SET sales_Balance = ?, sales_paymentStatus = ?
         WHERE sales_ID = ?`,
        [Math.max(0, newBalance), paymentStatus, sales_ID]
      );

      // Refresh client outstanding balance based on all unpaid/partial sales
      await connection.query(
        `UPDATE tbl_client c
         SET c.client_outstandingbalance = (
            SELECT COALESCE(SUM(s.sales_Balance), 0)
            FROM tbl_sales s
            WHERE s.client_ID = ?
            AND s.sales_paymentStatus != 'Paid'
            AND s.sales_status != 'Cancelled'
         )
         WHERE c.client_ID = ?`,
        [client_ID, client_ID]
      );
    } else {
      // No payment provided - add full amount to client outstanding balance
      await connection.query(
        `UPDATE tbl_client
         SET client_outstandingbalance = COALESCE(client_outstandingbalance, 0) + ?
         WHERE client_ID = ?`,
        [totalAmount, client_ID]
      );
    }

    await connection.commit();
    return NextResponse.json({ message: "Sale created successfully.", sales_ID }, { status: 201 });

  } catch (error) {
    await connection.rollback();
    console.error("Sale POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}

// ==========================
// GET - FETCH ALL SALES
// ==========================
export async function GET() {
  try {
    
    const [rows] = await pool.query(
      `SELECT 
          s.sales_ID, 
          s.client_ID,
          c.client_name, 
          s.sales_createdAt, 
          s.sales_totalAmount, 
          s.sales_Balance, 
          s.sales_status,
          s.sales_paymentStatus,
          s.sales_SINumber,
          s.sales_DRNumber
       FROM tbl_sales s
       LEFT JOIN tbl_client c ON s.client_ID = c.client_ID
       ORDER BY s.sales_ID DESC` 
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Fetch Sales Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales records." },
      { status: 500 }
    );
  }
}