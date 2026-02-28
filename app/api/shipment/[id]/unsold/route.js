import pool from "../../../../lib/db";

export async function POST(request, { params }) {
    const connection = await pool.getConnection();
    const { id } = await params; // shipment_ID
    const { manager_id, description_status, items } = await request.json();

    try {
        await connection.beginTransaction();

        // 1. Create the Unsold Header
        await connection.query(
            `INSERT INTO tbl_unsold_products (shipment_ID, manager_id, approved_date, description_status) 
             VALUES (?, ?, CURDATE(), ?)`,
            [id, manager_id, description_status]
        );

        for (const item of items) {
            // 2. Fetch the SOLD price to ensure we deduct the correct amount from their debt
            // Prices change over time (your rule #1), so we look at tbl_sales_details
            const [soldInfo] = await connection.query(
                `SELECT sd.salesDetail_unitPriceSold, s.sales_ID, s.client_ID 
                 FROM tbl_sales_details sd
                 JOIN tbl_sales s ON sd.sales_ID = s.sales_ID
                 JOIN tbl_shipment sh ON s.sales_ID = sh.sales_ID
                 WHERE sh.shipment_ID = ? AND sd.productLine_ID = ?`,
                [id, item.productLine_ID]
            );

            if (soldInfo.length > 0) {
                const { salesDetail_unitPriceSold, sales_ID, client_ID } = soldInfo[0];
                const refundValue = salesDetail_unitPriceSold * item.product_quantity;

                // 3. Log details
                await connection.query(
                    `INSERT INTO tbl_unsold_products_details (shipment_ID, product_id, product_quantity, product_subtotal) 
                     VALUES (?, ?, ?, ?)`,
                    [id, item.product_id, item.product_quantity, refundValue]
                );

                // 4. Return to Inventory (Rule: "It’s returned and back to the inventory")
                await connection.query(
                    "UPDATE tbl_product SET product_stockQty = product_stockQty + ? WHERE product_ID = ?",
                    [item.product_quantity, item.product_id]
                );

                // 5. Adjust Sales Balance (Rule: "Closely monitor balance")
                // We reduce the total amount and the remaining balance
                await connection.query(
                    `UPDATE tbl_sales 
                     SET sales_totalAmount = sales_totalAmount - ?, 
                         sales_Balance = sales_Balance - ? 
                     WHERE sales_ID = ?`,
                    [refundValue, refundValue, sales_ID]
                );

                // 6. Adjust Client Outstanding Debt
                await connection.query(
                    "UPDATE tbl_client SET client_outstandingbalance = client_outstandingbalance - ? WHERE client_ID = ?",
                    [refundValue, client_ID]
                );
            }
        }

        await connection.commit();
        return Response.json({ message: "Unsold items processed. Inventory and Client balance updated." });
    } catch (error) {
        await connection.rollback();
        return Response.json({ error: error.message }, { status: 500 });
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