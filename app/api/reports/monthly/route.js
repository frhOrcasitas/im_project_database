import pool from "../../../lib/db";

const balanceExpr = `(s.sales_totalAmount - IFNULL((SELECT SUM(payment_amount) FROM tbl_payment_details WHERE sales_ID = s.sales_ID), 0))`;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    let summaryQuery = `
      SELECT
        YEAR(s.sales_createdAt) AS year,
        MONTH(s.sales_createdAt) AS month,
        COUNT(*) AS total_transactions,
        SUM(s.sales_totalAmount) AS total_sales,
        SUM(IFNULL((SELECT SUM(payment_amount) FROM tbl_payment_details WHERE sales_ID = s.sales_ID), 0)) AS total_collected,
        SUM(${balanceExpr}) AS total_outstanding
      FROM tbl_sales s
    `;

    let transQuery = `
      SELECT 
        s.sales_ID, c.client_name, s.sales_createdAt, s.sales_totalAmount,
        ${balanceExpr} AS sales_Balance,
        s.sales_paymentStatus,
        s.sales_SINumber
      FROM tbl_sales s
      LEFT JOIN tbl_client c ON s.client_ID = c.client_ID
    `;

    const params = [];
    if (month) {
      summaryQuery += ` WHERE DATE_FORMAT(s.sales_createdAt, '%Y-%m') = ? `;
      transQuery   += ` WHERE DATE_FORMAT(s.sales_createdAt, '%Y-%m') = ? `;
      params.push(month);
    }

    summaryQuery += ` GROUP BY YEAR(s.sales_createdAt), MONTH(s.sales_createdAt) ORDER BY year DESC, month DESC`;
    transQuery   += ` ORDER BY s.sales_createdAt DESC`;

    const [summary]      = await pool.query(summaryQuery, params);
    const [transactions] = await pool.query(transQuery, params);

    return Response.json({ summary, transactions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}