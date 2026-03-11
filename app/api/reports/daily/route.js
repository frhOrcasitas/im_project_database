import pool from "../../../lib/db";

const balanceExpr = `(s.sales_totalAmount - IFNULL((SELECT SUM(payment_amount) FROM tbl_payment_details WHERE sales_ID = s.sales_ID), 0))`;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return Response.json({ error: "Start and end dates required" }, { status: 400 });
    }

    const [summary] = await pool.query(`
      SELECT
        DATE(s.sales_createdAt) AS sale_date,
        COUNT(*) AS total_transactions,
        SUM(s.sales_totalAmount) AS total_sales,
        SUM(IFNULL((SELECT SUM(payment_amount) FROM tbl_payment_details WHERE sales_ID = s.sales_ID), 0)) AS total_collected,
        SUM(${balanceExpr}) AS total_outstanding,
        COUNT(CASE WHEN s.sales_paymentStatus = 'Unpaid' THEN 1 END) AS unpaid_count,
        COUNT(CASE WHEN s.sales_paymentStatus = 'Partial' THEN 1 END) AS partial_count
      FROM tbl_sales s
      WHERE DATE(s.sales_createdAt) BETWEEN ? AND ?
      GROUP BY DATE(s.sales_createdAt)
      ORDER BY sale_date DESC`,
      [start, end]
    );

    const [transactions] = await pool.query(`
      SELECT 
        s.sales_ID, 
        c.client_name, 
        s.sales_createdAt, 
        s.sales_totalAmount,
        ${balanceExpr} AS sales_Balance,
        s.sales_paymentStatus,
        s.sales_SINumber
      FROM tbl_sales s
      LEFT JOIN tbl_client c ON s.client_ID = c.client_ID
      WHERE DATE(s.sales_createdAt) BETWEEN ? AND ?
      ORDER BY s.sales_createdAt DESC`,
      [start, end]
    );

    return Response.json({ summary, transactions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}