import pool from "../../../lib/db";

export async function POST(request) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { manager_ID, items, adjustStock } = await request.json();

        if (!items?.length) return Response.json({ error: "No items provided." }, { status: 400 });

        // 1. Header
        const [inventoryResult] = await connection.query(
            `INSERT INTO tbl_inventory (inventory_date, manager_ID, inventory_total) VALUES (CURDATE(), ?, 0)`,
            [manager_ID]
        );
        const inventory_ID = inventoryResult.insertId;

        let totalInventoryValue = 0;

        for (const item of items) {
            // 2. Get current unit price to record the value of stock at this moment
            const [product] = await connection.query(
                `SELECT product_unitPrice FROM tbl_product WHERE product_ID = ?`,
                [item.product_ID]
            );

            if (product.length === 0) throw new Error(`Product ${item.product_ID} not found.`);

            const unitPrice = product[0].product_unitPrice;
            const subtotal = item.actual_quantity * unitPrice;
            totalInventoryValue += subtotal;

            // 3. Record Snapshot
            await connection.query(
                `INSERT INTO tbl_inventory_details (inventory_ID, product_ID, quantity, inventory_cost, inventory_subtotal)
                 VALUES (?, ?, ?, ?, ?)`,
                [inventory_ID, item.product_ID, item.actual_quantity, unitPrice, subtotal]
            );

            // 4. Force Adjustment (Overrides inventory with actual count)
            if (adjustStock === true) {
                await connection.query(
                    `UPDATE tbl_product SET product_stockQty = ? WHERE product_ID = ?`,
                    [item.actual_quantity, item.product_ID]
                );
            }
        }

        // 5. Update Total Value
        await connection.query(`UPDATE tbl_inventory SET inventory_total = ? WHERE inventory_ID = ?`, [totalInventoryValue, inventory_ID]);

        await connection.commit();
        return Response.json({ message: "Inventory audit recorded.", inventory_ID });
    } catch (error) {
        await connection.rollback();
        return Response.json({ error: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}