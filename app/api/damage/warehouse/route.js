import pool from "../../../lib/db";

export async function POST(request) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const body = await request.json();
        const { manager_id, employee_id, items } = body;

        if (!items || items.length === 0) {
            return Response.json(
                { error: "Damage must contain at least one product." },
                { status: 400 }
            );
        }

        // Validate manager
        const [manager] = await connection.query(
            `SELECT manager_ID FROM tbl_manager WHERE manager_ID = ?`,
            [manager_id]
        );

        if (manager.length === 0) {
            throw new Error("Manager not found.");
        }

        // Validate employee
        const [employee] = await connection.query(
            `SELECT employee_ID FROM tbl_employee WHERE employee_ID = ?`,
            [employee_id]
        );

        if (employee.length === 0) {
            throw new Error("Employee not found.");
        }

        const productSet = new Set();

        for (const item of items) {
            if (productSet.has(item.product_ID)) {
                return Response.json(
                    { error: "Duplicate product in damage list not allowed."},
                    { status: 400 }
                );
            }
            productSet.add(item.product_ID);
        }

        for (const item of items) {

            const { product_ID, damage_quantity, damage_description } = item;

            if (damage_quantity <= 0) {
                throw new Error("Damage quantity must be greater than zero.");
            }

            // Get product info
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

            if (damage_quantity > currentStock) {
                throw new Error(
                    `Damage quantity exceeds available stock (${currentStock}).`
                );
            }

            const subtotal = damage_quantity * unitPrice;

            // Insert damage record
            await connection.query(
                `INSERT INTO tbl_damage_withinwarehouse
                 (product_id, damage_quantity, damage_amount, damage_subtotal,
                  damage_description, employee_id, manager_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    product_ID,
                    damage_quantity,
                    unitPrice,
                    subtotal,
                    damage_description || null,
                    employee_id,
                    manager_id
                ]
            );

            // Deduct stock
            await connection.query(
                `UPDATE tbl_product
                 SET product_stockQty = product_stockQty - ?
                 WHERE product_ID = ?`,
                [damage_quantity, product_ID]
            );
        }

        await connection.commit();

        return Response.json({
            message: "Warehouse damage recorded successfully."
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

export async function GET() {
    try {
        const [rows] = await pool.query(
            `SELECT
                d.damage_ID,
                d.product_id,
                p.product_name,
                d.damage_quantity,
                d.damage_subtotal,
                d.damage_description,
                d.employee_id,
                d.manager_id
             FROM tbl_damage_withinwarehouse d
             JOIN tbl_product p
                ON d.product_id = p.product_ID
             ORDER BY d.damage_ID DESC`
        );

        return Response.json(rows);

    } catch (error) {
        return Response.json(
            { error: error.message },
            { status: 500 }
        );
    }
}