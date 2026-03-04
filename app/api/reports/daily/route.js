import pool from "../../../lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end   = searchParams.get("end");

    if (!start || !end) {
      return Response.json(
        { error: "Both start and end dates are required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

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
      WHERE DATE(s.sales_createdAt) BETWEEN ? AND ?
      GROUP BY DATE(s.sales_createdAt)
      ORDER BY sale_date DESC`,
      [start, end]
    );

    return Response.json(rows.length ? rows : []);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}