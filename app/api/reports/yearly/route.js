import pool from "../../../lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    let query = `
      SELECT
        YEAR(sales_createdAt)  AS year,
        COUNT(*)               AS total_transactions,
        SUM(sales_totalAmount) AS total_sales,
        SUM(sales_totalAmount - sales_Balance) AS total_collected,
        SUM(sales_Balance)     AS total_outstanding
      FROM tbl_sales
    `;
    const params = [];

    if (year) {
      query += ` WHERE YEAR(sales_createdAt) = ? `;
      params.push(year);
    }

    query += ` GROUP BY YEAR(sales_createdAt) ORDER BY year DESC`;

    const [rows] = await pool.query(query, params);
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}