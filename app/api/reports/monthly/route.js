import pool from "../../../lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // format: YYYY-MM (optional)

    let query = `
      SELECT
        YEAR(sales_createdAt)  AS year,
        MONTH(sales_createdAt) AS month,
        COUNT(*)               AS total_transactions,
        SUM(sales_totalAmount) AS total_sales,
        SUM(sales_totalAmount - sales_Balance) AS total_collected,
        SUM(sales_Balance)     AS total_outstanding
      FROM tbl_sales
    `;
    const params = [];

    if (month) {
      query += ` WHERE DATE_FORMAT(sales_createdAt, '%Y-%m') = ? `;
      params.push(month);
    }

    query += ` GROUP BY YEAR(sales_createdAt), MONTH(sales_createdAt)
               ORDER BY year DESC, month DESC`;

    const [rows] = await pool.query(query, params);
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}