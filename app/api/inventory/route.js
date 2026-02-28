import pool from "../../lib/db";

export async function POST(request) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { manager_ID, items, adjustStock } = await request.json();

        // 1. Header: Capture the audit timestamp and the person responsible
        const [inventoryResult] = await connection.query(
            `INSERT INTO tbl_inventory (inventory_date, manager_ID, inventory_total) 
             VALUES (CURDATE(), ?, 0)`,
            [manager_ID]
        );
        const inventory_ID = inventoryResult.insertId;

        let totalInventoryValue = 0;

        for (const item of items) {
            // 2. Fetch current unit price (Rule #2: Prices change, so we snapshot the cost now)
            const [product] = await connection.query(
                `SELECT product_unitPrice FROM tbl_product WHERE product_ID = ?`,
                [item.product_ID]
            );

            if (product.length === 0) throw new Error(`Product ${item.product_ID} not found.`);

            const unitPrice = product[0].product_unitPrice;
            const subtotal = item.actual_quantity * unitPrice;
            totalInventoryValue += subtotal;

            // 3. Insert Details: Record exactly what was counted
            await connection.query(
                `INSERT INTO tbl_inventory_details 
                 (inventory_ID, product_ID, quantity, inventory_cost, inventory_subtotal)
                 VALUES (?, ?, ?, ?, ?)`,
                [inventory_ID, item.product_ID, item.actual_quantity, unitPrice, subtotal]
            );

            // 4. Synchronization (Rule #4: Returned/Unsold items go back to inventory)
            // This 'adjustStock' allows the office clerk to fix discrepancies
            if (adjustStock === true) {
                await connection.query(
                    `UPDATE tbl_product SET product_stockQty = ? WHERE product_ID = ?`,
                    [item.actual_quantity, item.product_ID]
                );
            }
        }

        // Update the header with the total calculated value of the warehouse
        await connection.query(
            `UPDATE tbl_inventory SET inventory_total = ? WHERE inventory_ID = ?`, 
            [totalInventoryValue, inventory_ID]
        );

        await connection.commit();
        return Response.json({ message: "Inventory count finalized.", inventory_ID });
    } catch (error) {
        await connection.rollback();
        return Response.json({ error: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}

// GET - Lists all inventories
export async function GET() {
    try {
        const [rows] = await pool.query(
            `SELECT
                i.inventory_ID,
                i.inventory_date,
                i.inventory_total,
                m.manager_ID,
                e.employee_name AS manager_name
            FROM tbl_inventory i
            JOIN tbl_manager m ON i.manager_ID = m.manager_ID
            JOIN tbl_employee e ON m.employee_ID = e.employee_ID
            ORDER BY i.inventory_date DESC`
        );

        return Response.json(rows);

    } catch (error) {
        return Response.json(
            { error: error.message },
            { status: 500 }
        );
    }
}