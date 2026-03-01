import pool from "../../lib/db";

// ==========================
// POST - CREATE SALE
// ==========================

export async function POST(req) {
  const connection = await pool.getConnection(); // Get a connection for the transaction
  try {
    const body = await req.json();
    const { client_id, employee_id, items, totalAmount, notes } = body;

    await connection.beginTransaction();

    // 1. Insert the main Sales record
    const [saleResult] = await connection.query(
      `INSERT INTO tbl_sales 
      (client_id, employee_id, sales_totalAmount, sales_Balance, sales_status, sales_notes) 
      VALUES (?, ?, ?, ?, 'Pending', ?)`,
      [client_id, employee_id, totalAmount, totalAmount, notes]
    );

    const salesId = saleResult.insertId;

    // 2. Loop through items to record details AND reduce stock
    for (const item of items) {
      // Record the specific item sold
      await connection.query(
        `INSERT INTO tbl_sales_details 
        (sales_ID, productLine_ID, salesDetail_qty, salesDetail_unitPriceSold, salesDetail_subtotal) 
        VALUES (?, ?, ?, ?, ?)`,
        [salesId, item.product_id, item.qty, item.unitPrice, item.qty * item.unitPrice]
      );

      // THE "STOCK OUT" LOGIC: Reduce quantity in tbl_product
      const [updateResult] = await connection.query(
        `UPDATE tbl_product 
         SET product_stockQty = product_stockQty - ? 
         WHERE product_ID = ? AND product_stockQty >= ?`,
        [item.qty, item.product_id, item.qty]
      );

      // Check if we actually had enough stock
      if (updateResult.affectedRows === 0) {
        throw new Error(`Insufficient stock for product ID: ${item.product_id}`);
      }
    }

    await connection.commit();
    return Response.json({ message: "Sale completed and stock updated!", salesId });

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