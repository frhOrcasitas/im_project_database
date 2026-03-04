import pool from "../../lib/db";

// ==========================
// POST - CREATE SALE
// ==========================

export async function POST(request) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { client_ID, employee_ID, sales_notes, items, payment,
                sales_SINumber, sales_DRNumber, sales_SWSNumber } = await request.json();

        // 1. Validate items
        if (!items || items.length === 0) {
            return Response.json({ error: "Sale must contain at least one item." }, { status: 400 });
        }

        // 2. Calculate total
        let totalAmount = 0;
        for (const item of items) {
            totalAmount += (item.quantity || item.qty) * (item.unitPrice || item.price);
        }

        // 3. Insert into tbl_sales — using actual schema columns
        const [saleResult] = await connection.query(
            `INSERT INTO tbl_sales 
             (client_ID, employee_ID, sales_notes, sales_totalAmount, sales_status,
              sales_paymentStatus, sales_Balance, sales_SINumber, sales_DRNumber, sales_SWSNumber)
             VALUES (?, ?, ?, ?, 'Pending', 'Unpaid', ?, ?, ?, ?)`,
            [client_ID, employee_ID || null, sales_notes || null,
             totalAmount, totalAmount,
             sales_SINumber || null, sales_DRNumber || null, sales_SWSNumber || null]
        );

        const sales_ID = saleResult.insertId;

        // 4. Insert items + deduct stock
        for (const item of items) {
            const qty      = item.quantity || item.qty;
            const price    = item.unitPrice || item.price;
            const subtotal = qty * price;
            const prod_ID  = item.productLine_ID || item.product_ID;

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

            const newBalance      = totalAmount - amountPaid;
            const paymentStatus   = newBalance <= 0 ? "Paid" : "Partial";

            await connection.query(
                `UPDATE tbl_sales
                 SET sales_Balance = ?, sales_paymentStatus = ?
                 WHERE sales_ID = ?`,
                [Math.max(0, newBalance), paymentStatus, sales_ID]
            );

            // Update client outstanding balance
            await connection.query(
                `UPDATE tbl_client
                 SET client_outstandingbalance = client_outstandingbalance + ?
                 WHERE client_ID = ?`,
                [Math.max(0, newBalance), client_ID]
            );
        } else {
            // Fully unpaid — add full amount to client outstanding balance
            await connection.query(
                `UPDATE tbl_client
                 SET client_outstandingbalance = client_outstandingbalance + ?
                 WHERE client_ID = ?`,
                [totalAmount, client_ID]
            );
        }

        await connection.commit();
        return Response.json({ message: "Sale created successfully.", sales_ID }, { status: 201 });

    } catch (error) {
        await connection.rollback();
        return Response.json({ error: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}

// ==========================
// GET - FETCH ALL SALES
// ==========================
export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.sales_ID,
        s.sales_createdAt, 
        s.sales_totalAmount, 
        s.sales_Balance, 
        s.sales_status,
        s.sales_paymentStatus,
        c.client_name 
      FROM tbl_sales s
      JOIN tbl_client c ON s.client_ID = c.client_ID
      WHERE s.sales_paymentStatus != 'Paid'
      ORDER BY s.sales_createdAt DESC
    `);
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}