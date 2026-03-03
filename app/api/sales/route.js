import pool from "../../lib/db";

// ==========================
// POST - CREATE SALE
// ==========================

export async function POST(request) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { client_ID, items, totalAmount, amountPaid } = await request.json();

        // 1. Insert into tbl_sales
        const [saleResult] = await connection.query(
            `INSERT INTO tbl_sales (client_ID, sales_totalAmount, sales_amountPaid, sales_status, sales_createdAt) 
             VALUES (?, ?, ?, 'Pending', NOW())`,
            [client_ID, totalAmount, amountPaid]
        );

        const newSaleID = saleResult.insertId;

        // 2. Loop through items to insert details and update stock
        for (const item of items) {
            // Insert Detail
            await connection.query(
                `INSERT INTO tbl_sales_details (sales_ID, productLine_ID, salesDetail_qty, salesDetail_unitPriceSold, salesDetail_subtotal) 
                 VALUES (?, ?, ?, ?, ?)`,
                [newSaleID, item.product_ID, item.qty, item.price, item.qty * item.price]
            );

            // Subtract Stock
            const [updateResult] = await connection.query(
                `UPDATE tbl_product 
                 SET product_stockQty = product_stockQty - ? 
                 WHERE product_ID = ? AND product_stockQty >= ?`,
                [item.qty, item.product_ID, item.qty]
            );

            if (updateResult.affectedRows === 0) {
                throw new Error(`Insufficient stock for product ID: ${item.product_ID}`);
            }
        }

        await connection.commit();
        return Response.json({ message: "Order created successfully", sales_ID: newSaleID }, { status: 201 });

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