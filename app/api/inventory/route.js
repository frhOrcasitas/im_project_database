import pool from "../../lib/db";

// Helper: parse pcs_per_case from unit string e.g. "3.8kgx4" → 4, "200gx36" → 36
function parsePcsPerCase(unitStr) {
  if (!unitStr) return null;
  const match = unitStr.match(/x(\d+)/i);
  return match ? parseInt(match[1]) : null;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, stock, unit, reorder, price, description, pricePerCase, plantPrice } = body;

    const [result] = await pool.query(
      `INSERT INTO tbl_product 
      (product_name, product_stockQty, product_unitOfMeasure, product_reorderLevel, 
       product_unitPrice, product_description, product_pricePerCase, product_plantPrice) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, stock, unit, reorder, price, description || null,
       pricePerCase || null, plantPrice || null]
    );

    return Response.json({ message: "Product added!", id: result.insertId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT
          p.product_ID,
          p.product_name,
          p.product_stockQty,
          p.product_unitOfMeasure AS product_unit,
          p.product_reorderLevel  AS product_reorderPoint,
          p.product_unitPrice     AS product_sellingPrice,
          p.product_unitPrice,
          p.product_pricePerCase,
          p.product_plantPrice,
          p.product_description,
          (SELECT inventory_cost FROM tbl_inventory_details
           WHERE product_ID = p.product_ID
           ORDER BY inventory_ID DESC LIMIT 1) AS product_costPrice
      FROM tbl_product p`
    );
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const {
      product_ID, product_name, product_sellingPrice, product_unitPrice,
      product_reorderPoint, product_unit, product_pricePerCase, product_plantPrice
    } = body;

    await pool.query(
      `UPDATE tbl_product 
       SET product_name = ?, product_unitPrice = ?, product_reorderLevel = ?,
           product_unitOfMeasure = ?, product_pricePerCase = ?, product_plantPrice = ?
       WHERE product_ID = ?`,
      [
        product_name,
        product_unitPrice ?? product_sellingPrice,
        product_reorderPoint,
        product_unit,
        product_pricePerCase || null,
        product_plantPrice   || null,
        product_ID
      ]
    );

    return Response.json({ message: "Product updated successfully" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}