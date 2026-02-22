import pool from "../../lib/db";

export async function GET() {
    try {

        const [warehouse] = await pool.query(
            `SELECT
                'Warehouse' AS damage_type,
                damage_ID,
                product_id,
                damage_quantity,
                damage_subtotal,
                damage_description
             FROM tbl_damage_withinwarehouse`

        );

        const [delivery] = await pool.query(
            `SELECT
                'Delivery' AS damage_type,
                d.damage_ID,
                sp.product_id AS product_id,
                d.damage_quantity,
                d.damage_subtotal,
                d.damage_description
             FROM tbl_damage_during d
             JOIN tbl_shipment_productdetails sp
             ON d.productLine_id = sp.productLine_ID`
        );

        return Response.json({
            warehouse,
            delivery
        });

    } catch (error) {
        return Response.json(
            { error: error.message },
            { status: 500 }
        )
    }
}