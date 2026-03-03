import pool from "../../../lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.client_name,
        COUNT(s.sales_ID)                          AS total_orders,
        SUM(s.sales_totalAmount)                   AS total_purchased,
        SUM(s.sales_totalAmount - s.sales_Balance) AS total_paid,
        SUM(s.sales_Balance)                       AS outstanding_balance,
        MAX(s.sales_createdAt)                     AS last_transaction
      FROM tbl_client c
      LEFT JOIN tbl_sales s ON c.client_ID = s.client_ID
      GROUP BY c.client_ID, c.client_name
      ORDER BY total_purchased DESC
    `);
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}