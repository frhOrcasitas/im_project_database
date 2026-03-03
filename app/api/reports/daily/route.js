import pool from "../../../lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) return Response.json({ error: "Date is required (YYYY-MM-DD)" }, { status: 400 });

    const [rows] = await pool.query(`
      SELECT
        DATE(s.sales_createdAt) AS sale_date,
        COUNT(*) AS total_transactions,
        SUM(s.sales_totalAmount) AS total_sales,
        SUM(CASE WHEN s.sales_paymentStatus = 'Paid' THEN s.sales_totalAmount ELSE 0 END) AS total_collected,
        SUM(s.sales_Balance) AS total_outstanding,
        COUNT(CASE WHEN s.sales_paymentStatus = 'Unpaid'  THEN 1 END) AS unpaid_count,
        COUNT(CASE WHEN s.sales_paymentStatus = 'Partial' THEN 1 END) AS partial_count
      FROM tbl_sales s
      WHERE DATE(s.sales_createdAt) = ?
      GROUP BY DATE(s.sales_createdAt)`,
      [date]
    );

    return Response.json(rows[0] || {
      sale_date: date, total_transactions: 0, total_sales: 0,
      total_collected: 0, total_outstanding: 0, unpaid_count: 0, partial_count: 0,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}