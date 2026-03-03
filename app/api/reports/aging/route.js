import pool from "../../../lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.client_name,
        s.sales_ID,
        s.sales_createdAt,
        s.sales_totalAmount,
        s.sales_Balance AS outstanding_balance,
        s.sales_paymentStatus,
        DATEDIFF(CURDATE(), s.sales_createdAt) AS days_overdue
      FROM tbl_sales s
      JOIN tbl_client c ON s.client_ID = c.client_ID
      WHERE s.sales_Balance > 0
        AND s.sales_paymentStatus != 'Paid'
      ORDER BY days_overdue DESC
    `);
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}