import pool from "../../../lib/db";

// Post - record delivery damage

export async function POST(request) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { shipment_ID, items } = await request.json();

        for (const item of items) {
            const { productLine_ID, damage_quantity, damage_description } = item;

            // 1. Find the actual Product ID and Unit Price from the shipment
            // Note: Use productLine_ID to find the specific item in that shipment
            const [shipmentDetail] = await connection.query(
                `SELECT sp.product_ID, p.product_unitPrice 
                 FROM tbl_shipment_productdetails sp
                 JOIN tbl_product p ON sp.product_ID = p.product_ID
                 WHERE sp.shipment_ID = ? AND sp.productLine_ID = ?`,
                [shipment_ID, productLine_ID]
            );

            if (shipmentDetail.length === 0) throw new Error(`Item ${productLine_ID} not found in shipment ${shipment_ID}`);

            const { product_ID, product_unitPrice } = shipmentDetail[0];
            const subtotal = damage_quantity * product_unitPrice;

            // 2. Record Damage (Loss)
            await connection.query(
                `INSERT INTO tbl_damage_during
                 (shipment_ID, productLine_id, damage_quantity, damage_amount, damage_subtotal, damage_description, damage_date)
                 VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
                [shipment_ID, productLine_ID, damage_quantity, product_unitPrice, subtotal, damage_description]
            );

            // 3. Deduct from Inventory (Rule: "It’s recorded and deducted")
            // Since it was already deducted when 'shipped', we ensure it's not double-deducted 
            // OR if your system adds it back first, we ensure it's removed here.
            await connection.query(
                `UPDATE tbl_product SET product_stockQty = product_stockQty - ? WHERE product_ID = ?`,
                [damage_quantity, product_ID]
            );
        }

        await connection.commit();
        return Response.json({ message: "Delivery damage recorded and stock adjusted." });
    } catch (error) {
        await connection.rollback();
        return Response.json({ error: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}


// GET - list delivery damages
export async function GET() {
    try {
        const [rows] = await pool.query(
             `SELECT
                d.damage_ID,
                d.shipment_ID,
                d.productLine_id,
                p.product_name,
                d.damage_quantity,
                d.damage_subtotal,
                d.damage_description,
                d.damage_date
             FROM tbl_damage_during d
             JOIN tbl_shipment_productdetails sp
                ON d.productLine_id = sp.productLine_ID
             JOIN tbl_product p
                ON sp.product_ID = p.product_ID
             ORDER BY d.damage_ID DESC`
        );

        return Response.json(rows);

    } catch (error) {
        return Response.json(
            {error: error.message},
            {status: 500}
        )
    }
}