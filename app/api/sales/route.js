import pool from "../../lib/db";
import { NextResponse } from "next/server";

function parsePcsPerCase(unitStr) {
  if (!unitStr) return null;
  const match = unitStr.match(/x\s*(\d+)/i);
  return match ? parseInt(match[1]) : null;
}

function calcPiecesToDeduct(qty, unitType, remainder, pcsPerCase) {
  if (unitType === "Pieces") return qty;
  if (unitType === "Cases") {
    if (!pcsPerCase) return qty;
    return (qty * pcsPerCase) + (remainder || 0);
  }
  return qty;
}

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
      sales_SWSNumber,
      // DR removed — DR now belongs on shipment, not sale creation
    } = body;

    if (!items || items.length === 0) {
      throw new Error("Sale must contain at least one item.");
    }

    if (!client_ID) throw new Error("Client is required.");
    if (!employee_ID) throw new Error("Employee is required.");

    // SI uniqueness check
    if (sales_SINumber) {
      const [existingSI] = await connection.query(
        `SELECT sales_ID FROM tbl_sales WHERE sales_SINumber = ?`,
        [sales_SINumber]
      );
      if (existingSI.length > 0) {
        throw new Error(`SI Number "${sales_SINumber}" already exists.`);
      }
    }

    // SWS uniqueness check
    if (sales_SWSNumber) {
      const [existingSWS] = await connection.query(
        `SELECT sales_ID FROM tbl_sales WHERE sales_SWSNumber = ?`,
        [sales_SWSNumber]
      );
      if (existingSWS.length > 0) {
        throw new Error(`SWS Number "${sales_SWSNumber}" already exists.`);
      }
    }

    // 1. Calculate total
    let totalAmount = 0;
    for (const item of items) {
      const qty   = item.quantity || item.qty;
      const price = item.unitPrice || item.price;
      totalAmount += qty * price;
    }

    // 2. Insert into tbl_sales (no DR column — DR is on shipment)
    const [saleResult] = await connection.query(
      `INSERT INTO tbl_sales 
       (client_ID, employee_ID, sales_notes, sales_totalAmount, sales_status,
        sales_paymentStatus, sales_Balance, sales_SINumber, sales_SWSNumber)
       VALUES (?, ?, ?, ?, 'Pending', 'Unpaid', ?, ?, ?)`,
      [
        client_ID,
        employee_ID || null,
        sales_notes || null,
        totalAmount,
        totalAmount,
        sales_SINumber  || null,
        sales_SWSNumber || null,
      ]
    );

    const sales_ID = saleResult.insertId;

    // 3. Insert items + deduct stock
    for (const item of items) {
      const qty       = item.quantity || item.qty;
      const price     = item.unitPrice || item.price;
      const subtotal  = qty * price;
      const prod_ID   = item.productLine_ID || item.product_ID;
      const unitType  = item.unitType  || "Cases";
      const remainder = item.remainder || 0;

      const [[product]] = await connection.query(
        `SELECT product_unitOfMeasure, product_stockQty FROM tbl_product WHERE product_ID = ?`,
        [prod_ID]
      );
      if (!product) throw new Error(`Product ID ${prod_ID} not found.`);

      const pcsPerCase     = parsePcsPerCase(product.product_unitOfMeasure);
      const piecesToDeduct = calcPiecesToDeduct(qty, unitType, remainder, pcsPerCase);

      if (piecesToDeduct > product.product_stockQty) {
        throw new Error(
          `Insufficient stock for product ID ${prod_ID}. ` +
          `Need ${piecesToDeduct} pcs, have ${product.product_stockQty} pcs.`
        );
      }

      await connection.query(
        `UPDATE tbl_product SET product_stockQty = product_stockQty - ? WHERE product_ID = ?`,
        [piecesToDeduct, prod_ID]
      );

      await connection.query(
        `INSERT INTO tbl_sales_details
         (sales_ID, productLine_ID, salesDetail_qty, salesDetail_unitPriceSold,
          salesDetail_subtotal, salesDetail_unitType, salesDetail_remainder)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [sales_ID, prod_ID, qty, price, subtotal, unitType, remainder]
      );
    }

    // 4. Handle initial payment
    const amountPaid = payment ? parseFloat(payment.payment_amount || 0) : 0;
    if (amountPaid > 0) {
      await connection.query(
        `INSERT INTO tbl_payment_details
         (sales_ID, payment_type, payment_paidDate, payment_amount, employee_ID)
         VALUES (?, ?, CURDATE(), ?, ?)`,
        [sales_ID, payment.payment_type, amountPaid, employee_ID || null]
      );

      const newBalance    = totalAmount - amountPaid;
      const paymentStatus = newBalance <= 0 ? "Paid" : "Partial";

      await connection.query(
        `UPDATE tbl_sales SET sales_Balance = ?, sales_paymentStatus = ? WHERE sales_ID = ?`,
        [Math.max(0, newBalance), paymentStatus, sales_ID]
      );

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
          s.sales_SWSNumber
       FROM tbl_sales s
       LEFT JOIN tbl_client c ON s.client_ID = c.client_ID
       ORDER BY s.sales_ID DESC`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Fetch Sales Error:", error);
    return NextResponse.json({ error: "Failed to fetch sales records." }, { status: 500 });
  }
}