import pool from "../../../lib/db";

// Post - record delivery damage

export async function POST(request) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const body = await request.json();
        const { shipment_ID, items } = body;

        if (!items || items.length === 0) {
            return Response.json(
                { error: "Damage must contain at least one product." },
                { status: 400 }
            );
        }

        // Validate shipment
        const [shipment] = await connection.query(
            `SELECT shipment_ID
             FROM tbl_shipment
             WHERE shipment_ID = ?`,
            [shipment_ID]
        );

        if (shipment.length === 0) {
            throw new Error("Shipment not found.");
        }

        const productLineSet = new Set();

        for (const item of items) {
            if (productLineSet.has(item.productLine_ID)) {
                return Response.json(
                    { error: "Duplicate productLine in damage list not allowed."},
                    { status: 400 }
                );
            }
            productLineSet.add(item.productLine_ID);
        }

        for (const item of items) {

            const { productLine_ID, damage_quantity, damage_description } = item;

            if (damage_quantity <= 0) {
                throw new Error("Damage quantity must be greater than zero.");
            }

            // Validate productLine belongs to shipment
            const [shipmentProduct] = await connection.query(
                `SELECT product_ID, product_quantity
                 FROM tbl_shipment_productdetails
                 WHERE shipment_ID = ?
                 AND productLine_ID = ?`,
                [shipment_ID, productLine_ID]
            );

            if (shipmentProduct.length === 0) {
                throw new Error("Product not part of this shipment.");
            }

            const shippedQty = shipmentProduct[0].product_quantity;
            const product_ID = shipmentProduct[0].product_ID;

            if (damage_quantity > shippedQty) {
                throw new Error(
                    `Damage quantity exceeds shipped quantity (${shippedQty}).`
                );
            }

            // Get product unit price
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

            const [existingDamage] = await connection.query(
                `SELECT SUM(damage_quantity) AS total_damaged
                FROM tbl_damage_during
                WHERE shipment_ID = ?
                AND productLine_id = ?`,
                [shipment_ID, productLine_ID]
            );

            const alreadyDamaged = existingDamage[0].total_damaged || 0;

            if (damage_quantity + alreadyDamaged > shippedQty) {
                throw new Error(
                    `Total damage exceeds shipped quantity (${shippedQty}).`
                );
            }

            if (damage_quantity > currentStock) {
                throw new Error(
                    `Damage exceeds available stock (${currentStock}).`
                );
            }

            const subtotal = damage_quantity * unitPrice;

            // Insert damage record
            await connection.query(
                `INSERT INTO tbl_damage_during
                 (shipment_ID, productLine_id, damage_quantity,
                  damage_amount, damage_subtotal,
                  damage_description, damage_date)
                 VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
                [
                    shipment_ID,
                    productLine_ID,
                    damage_quantity,
                    unitPrice,
                    subtotal,
                    damage_description || null
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
            message: "Delivery damage recorded successfully."
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