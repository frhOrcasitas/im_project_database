import pool from "../../../lib/db";

export async function GET(request, { params }) {
    try {
        const {id} = params;

        const [inventory] = await pool.query(
            `SELECT *
             FROM tbl_inventory
             WHERE inventory_ID = ?`,
            [id]
        );

        if (inventory.length === 0) {
            return Response.json(
                { error: "Inventory not found. "},
                { status: 404 }
            );
        }

        const [details] = await pool.query(
            `SELECT
                d.product_ID,
                p.product_name,
                d.quantity,
                d.inventory_cost,
                d.inventory_subtotal
             FROM tbl_inventory_details d
             JOIN tbl_product p
                ON d.product_ID = p.product_ID
             WHERE d.inventory_ID = ?`,
            [id]
        );

        return Response.json({
            inventory: inventory[0],
            products: details
        });

    } catch (error) {
        return Response.json(
            { error: error.message },
            { status: 500}
        );
    }
}