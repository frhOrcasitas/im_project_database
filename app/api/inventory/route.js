import pool from "../../lib/db";

export async function POST(request) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const body = await request.json();
        const { manager_ID,  items, adjustStock } = body;

        if (!items || items.length === 0) {
            return Response.json(
                { error: "Inventory must contain at least one product."},
                { status: 400 }
            );
        }

        const [manager] = await connection.query(
            `SELECT manager_ID FROM tbl_manager WHERE manager_ID = ?`,
            [manager_ID]
        );

        if (manager.length === 0) {
            throw new Error("Manager not found.");
        }

        // Insert inventory header
        const [inventoryResult] = await connection.query(
            `INSERT INTO tbl_inventory
             (inventory_date, manager_ID)
             VALUES (CURDATE(), ?)`,
            [manager_ID]
        );

        const inventory_ID = inventoryResult.insertId;

        let totalInventoryValue = 0;

        for (const item of items) {
            const { product_ID, actual_quantity } = item;

            if (actual_quantity < 0) {
                throw new Error("Quantity cannot be negative.");
            }

            // Get product
            const [product] = await connection.query(
                `SELECT product_stockQty, product_unitPrice
                 FROM tbl_product
                 WHERE product_ID = ?`,
                [product_ID]
            );

            if (product.length === 0) {
                throw new Error("Product not found.");
            }

            const currentStock = product[0].product_stockQty;
            const unitPrice = product[0].product_unitPrice;

            const subtotal = actual_quantity * unitPrice;

            totalInventory += subtotal;

            // Insert Inventory Detail
            await connection.query(
                `INSERT INTO tbl_inventory_details
                 (inventory_ID, product_ID, quantity, inventory_cost, inventory_subtotal)
                 VALUES (?, ?, ?, ?, ?)`,
                [inventory_ID, product_ID, actual_quantity, unitPrice, subtotal]
            );

            // Adjust stock if allowed
            if (adjustStock === true) {
                await connection.query(
                    `UPDATE tbl_product
                     SET product_stockQty = ?
                     WHERE product_ID = ?`,
                    [actual_quantity, product_ID]
                );
            }
        }

        // Update total
        await connection.query(
            `UPDATE tbl_inventory
             SET inventory_total = ?
             WHERE inventory_ID = ?`,
            [totalInventoryValue, inventory_ID]
        );
        
        await connection.commit();

        return Response.json({
            message: "Inventory recorded successfully.",
            inventory_ID
        });

    } catch (error) {
        await connection.rollback();
        return Response.json(
            { error: error.message },
            { status: 500 }
        );

    } finally {
        connection.release();
    }
}

// GET - Lists all inventories
export async function GET() {
    try {
        const [rows] = await pool.query(
            `SELECT
                inventory_ID,
                inventory_date,
                manager_ID,
                inventory_total
             FROM tbl_inventory
             ORDER BY inventory_date DESC`
        );

        return Response.json(rows);

    } catch (error) {
        return Response.json(
            { error: error.message },
            { status: 500 }
        );
    }
}