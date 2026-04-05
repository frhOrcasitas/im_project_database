import pool from "../../../../lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const client_ID = searchParams.get("client_ID");
  if (!client_ID) return Response.json({ error: "client_ID required" }, { status: 400 });

  try {
    const [rows] = await pool.query(`
      SELECT
        pd.payment_ORNumber,
        pd.payment_paidDate,
        pd.payment_type,
        pd.payment_amount,
        s.sales_ID,
        s.sales_SINumber,
        s.sales_totalAmount,
        (s.sales_totalAmount - IFNULL((
          SELECT SUM(p2.payment_amount) FROM tbl_payment_details p2 WHERE p2.sales_ID = s.sales_ID
        ), 0)) AS remaining_balance
      FROM tbl_payment_details pd
      JOIN tbl_sales s ON pd.sales_ID = s.sales_ID
      WHERE s.client_ID = ?
        AND s.sales_status != 'Cancelled'
      ORDER BY pd.payment_paidDate DESC
    `, [client_ID]);
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}