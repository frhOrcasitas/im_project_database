import pool from "../../../../lib/db";

// Post - registering unsold products 
export async function POST(request, { params }) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { id } = params;
        const body = await request.json();
        const { manager_id, description_status, items } = body;

        if (!items || items.length === 0) {
            return Response.json(
                { error: "Unsold must contain at least one product." },
                { status: 400 }
            );
        }

        // Validate shipment exists
        const [shipment] = await connection.query(
            `SELECT shipment_ID 
             FROM tbl_shipment 
             WHERE shipment_ID = ?`,
            [id]
        );

        if (shipment.length === 0) {
            throw new Error("Shipment not found.");
        }

        const [existingUnsold] = await connection.query(
            `SELECT shipment_ID
            FROM tbl_unsold_products
            WHERE shipment_ID = ?`,
            [id]
        );

        if (existingUnsold.length > 0) {
            throw new Error("Unsold already recorded for this shipment.");
        }

        // Prevent duplicate product in same unsold request
        const productSet = new Set();
        for (const item of items) {
            if (productSet.has(item.product_ID)) {
                return Response.json(
                    { error: "Duplicate product in unsold list is not allowed." },
                    { status: 400 }
                );
            }
            productSet.add(item.product_ID);

            if (item.quantity <= 0) {
                return Response.json(
                    { error: "Unsold quantity must be greater than zero." },
                    { status: 400 }
                );
            }
        }

        // Insert unsold header
        await connection.query(
            `INSERT INTO tbl_unsold_products
            (shipment_ID, manager_id, approved_date, description_status)
            VALUES (?, ?, CURDATE(), ?)`,
            [id, manager_id, description_status || null]
        );

        // Process each unsold item
        for (const item of items) {

            // Get shipped quantity for this shipment
            const [shipped] = await connection.query(
                `SELECT product_quantity
                 FROM tbl_shipment_productdetails
                 WHERE shipment_ID = ?
                 AND productLine_ID = ?`,
                [id, item.product_ID]
            );

            if (shipped.length === 0) {
                throw new Error("Product was not part of this shipment.");
            }

            const shippedQty = shipped[0].product_quantity;

            if (item.quantity > shippedQty) {
                throw new Error(
                    `Unsold quantity exceeds shipped quantity (${shippedQty}).`
                );
            }

            // Insert unsold detail
            await connection.query(
                `INSERT INTO tbl_unsold_products_details
                (shipment_ID, product_id, product_quantity)
                VALUES (?, ?, ?)`,
                [id, item.product_ID, item.quantity]
            );

            // Restore stock
            await connection.query(
                `UPDATE tbl_product
                 SET product_stockQty = product_stockQty + ?
                 WHERE product_ID = ?`,
                [item.quantity, item.product_ID]
            );
        }

        await connection.commit();

        return Response.json({
            message: "Unsold products recorded successfully."
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

export async function GET(request, { params }) {
    try {
        const { id } = params;

        // Check shipment exists
        const [shipment] = await pool.query(
            `SELECT shipment_ID
             FROM tbl_shipment
             WHERE shipment_ID = ?`,
            [id]
        );

        if (shipment.length === 0) {
            return Response.json(
                { error: "Shipment not found." },
                { status: 404 }
            );
        }

        // Get unsold header
        const [unsoldHeader] = await pool.query(
            `SELECT
                up.shipment_ID,
                up.manager_id,
                up.approved_date,
                up.description_status
             FROM tbl_unsold_products up
             WHERE up.shipment_ID = ?`,
            [id]
        );

        if (unsoldHeader.length === 0) {
            return Response.json(
                { message: "No unsold record found for this shipment." },
                { status: 404 }
            );
        }

        // Get unsold product details
        const [unsoldDetails] = await pool.query(
            `SELECT
                ud.product_id,
                p.product_name,
                ud.product_quantity
             FROM tbl_unsold_products_details ud
             JOIN tbl_product p
                ON ud.product_id = p.product_ID
             WHERE ud.shipment_ID = ?`,
            [id]
        );

        return Response.json({
            unsold: unsoldHeader[0],
            products: unsoldDetails
        });

    } catch (error) {
        return Response.json(
            { error: error.message },
            { status: 500 }
        );
    }
}