import pool from "../../../lib/db";

export async function PATCH(req) {
  const connection = await pool.getConnection();
  try {
    const { product_id, quantity, cost, manager_id } = await req.json();
    
    await connection.beginTransaction();

    // 1. Create the Header in tbl_inventory
    const [invHeader] = await connection.query(
      `INSERT INTO tbl_inventory (inventory_date, manager_ID, inventory_total) 
       VALUES (CURDATE(), ?, ?)`,
      [manager_id || 1, quantity * cost] 
    );
    const newInventoryID = invHeader.insertId;

    // 2. Update the main product stock
    await connection.query(
      "UPDATE tbl_product SET product_stockQty = product_stockQty + ? WHERE product_ID = ?",
      [quantity, product_id]
    );

    // 3. Log specifics in tbl_inventory_details
    await connection.query(
      `INSERT INTO tbl_inventory_details 
      (inventory_ID, product_ID, quantity, inventory_cost, inventory_subtotal) 
      VALUES (?, ?, ?, ?, ?)`,
      [newInventoryID, product_id, quantity, cost, quantity * cost]
    );

    await connection.commit();
    return Response.json({ message: "Restock successful", inventoryId: newInventoryID });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Restock Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}
