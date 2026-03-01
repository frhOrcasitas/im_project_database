import pool from "../../../lib/db";

export async function PATCH(req) {
  const connection = await pool.getConnection();
  try {
    const { product_id, quantity, cost } = await req.json();
    
    await connection.beginTransaction();

    // 1. Update the main product table's stock count
    await connection.query(
      "UPDATE tbl_product SET product_stockQty = product_stockQty + ? WHERE product_ID = ?",
      [quantity, product_id]
    );

    // 2. Log this batch in inventory details (for cost tracking/total value)
    // Note: We leave inventory_ID to be handled by the DB if it's auto-increment
    await connection.query(
      `INSERT INTO tbl_inventory_details 
      (product_ID, quantity, inventory_cost, inventory_subtotal) 
      VALUES (?, ?, ?, ?)`,
      [product_id, quantity, cost, quantity * cost]
    );

    await connection.commit();
    return Response.json({ message: "Restock successful" });
  } catch (error) {
    await connection.rollback();
    return Response.json({ error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}