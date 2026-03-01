import pool from "../../lib/db";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, stock, unit, reorder, price, description } = body;

    const [result] = await pool.query(
      `INSERT INTO tbl_product 
      (product_name, product_stockQty, product_unitOfMeasure, product_reorderLevel, product_unitPrice, product_description) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [name, stock, unit, reorder, price, description]
    );

    return Response.json({ message: "Product added!", id: result.insertId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// GET - Lists all inventories
export async function GET() {
    try {
        const [rows] = await pool.query(
            `SELECT
                p.product_ID,
                p.product_name,
                p.product_stockQty,
                p.product_unitOfMeasure AS product_unit,
                p.product_reorderLevel AS product_reorderPoint,
                p.product_unitPrice AS product_sellingPrice,
                p.product_description,
                (SELECT inventory_cost FROM tbl_inventory_details
                WHERE product_ID = p.product_ID
                ORDER BY inventory_ID DESC LIMIT 1) AS product_costPrice
            FROM tbl_product p`
        );

        return Response.json(rows);

    } catch (error) {
        return Response.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { product_ID, product_name, product_sellingPrice, product_reorderPoint, product_unit } = body;

    await pool.query(
      `UPDATE tbl_product 
       SET product_name = ?, product_unitPrice = ?, product_reorderLevel = ?, product_unitOfMeasure = ? 
       WHERE product_ID = ?`,
      [product_name, product_sellingPrice, product_reorderPoint, product_unit, product_ID]
    );

    return Response.json({ message: "Product updated successfully" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}