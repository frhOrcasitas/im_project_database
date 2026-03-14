import pool from "../../../../lib/db";

export async function GET(req, { params }) {
  const { id } = await params;
  try {
    const [rows] = await pool.query(
      `SELECT 
          sd.productLine_ID,
          sd.salesDetail_qty,
          sd.salesDetail_unitPriceSold,
          sd.salesDetail_subtotal,
          sd.salesDetail_unitType,
          sd.salesDetail_remainder,
          p.product_name,
          p.product_ID         AS product_code,
          p.product_unitOfMeasure AS product_unit
       FROM tbl_sales_details sd
       JOIN tbl_product p ON sd.productLine_ID = p.product_ID
       WHERE sd.sales_ID = ?`,
      [id]
    );
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}