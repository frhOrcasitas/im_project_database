import pool from "../../../lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.product_name,
        p.product_stockQty,
        p.product_unitPrice,
        (p.product_stockQty * p.product_unitPrice) AS inventory_value
      FROM tbl_product p
      ORDER BY p.product_stockQty ASC
    `);
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}