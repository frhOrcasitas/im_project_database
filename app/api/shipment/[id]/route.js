export async function POST(request, { params }) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = await params; 
        const { manager_id, description_status, items } = await request.json();

        // 1. Get Sale ID and Client ID first to update balances later
        const [shipmentData] = await connection.query(
            `SELECT s.sales_ID, s.client_ID 
             FROM tbl_shipment sh 
             JOIN tbl_sales s ON sh.sales_ID = s.sales_ID 
             WHERE sh.shipment_ID = ?`, [id]
        );
        const { sales_ID, client_ID } = shipmentData[0];

        let totalValueToDeduct = 0;

        for (const item of items) {
            // Get unit price from original sales details to calculate refund value
            const [priceData] = await connection.query(
                `SELECT salesDetail_unitPriceSold FROM tbl_sales_details 
                 WHERE sales_ID = ? AND productLine_ID = ?`, [sales_ID, item.product_ID]
            );
            
            const unitPrice = priceData[0].salesDetail_unitPriceSold;
            totalValueToDeduct += (unitPrice * item.quantity);

            // Restore Stock
            await connection.query(
                `UPDATE tbl_product SET product_stockQty = product_stockQty + ? WHERE product_ID = ?`,
                [item.quantity, item.product_ID]
            );

            // Insert Unsold Detail
            await connection.query(
                `INSERT INTO tbl_unsold_products_details (shipment_ID, product_id, product_quantity) VALUES (?, ?, ?)`,
                [id, item.product_ID, item.quantity]
            );
        }

        // 2. FINANCIAL ADJUSTMENT: Deduct the returned value from Sale and Client Balance
        await connection.query(
            `UPDATE tbl_sales SET sales_totalAmount = sales_totalAmount - ?, sales_Balance = sales_Balance - ? WHERE sales_ID = ?`,
            [totalValueToDeduct, totalValueToDeduct, sales_ID]
        );

        await connection.query(
            `UPDATE tbl_client SET client_outstandingbalance = client_outstandingbalance - ? WHERE client_ID = ?`,
            [totalValueToDeduct, client_ID]
        );

        await connection.commit();
        return Response.json({ message: "Unsold recorded and balances adjusted." });
    } catch (error) {
        await connection.rollback();
        return Response.json({ error: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}