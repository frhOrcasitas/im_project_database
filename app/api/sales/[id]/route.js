import pool from "../../../lib/db";

export async function GET(request, { params }) {
    try {
        const { id } = params;

        const [sale] = await pool.query (
            `SELECT 
                s.sales_ID,
                s.sales_totalAmount,
                s.sales_status,
                s.sales_paymentStatus,
                s.sales_date,
                c.client_name,
                e.employee_name
             FROM tbl_sales s
             JOIN tbl_client c ON s.client_ID = c.client_ID
             JOIN tbl_employee e ON s.employee_ID = e.employee_ID
             WHERE s.sales_ID = ?`,
            [id]
        );

        if (sale.length === 0) {
            return Response.json(
                { error: "Sale not found" },
                { status: 404 }
            );
        }

        const [saleStatus] = await pool.query(
            `SELECT sales_status FROM tbl_sales WHERE sales_ID = ?`,
            [id]
        );

        const [details] = await pool.query(
            `SELECT 
                d.productLine_ID,
                p.product_name,
                d.salesDetail_qty,
                d.salesDetail_unitPriceSold,
                d.salesDetail_subtotal
             FROM tbl_sales_details d
             JOIN tbl_product p ON d.productLine_ID = p.product_ID
             WHERE d.sales_ID = ?`,
            [id]
        );


        const [payment] = await pool.query(
            `SELECT
                payment_type,
                payment_amount,
                payment_paidDate
            FROM tbl_payment_details
            WHERE sales_ID = ?`,
            [id]
        );

        return Response.json({
            sale:sale[0],
            details,
            payment
        });

    } catch (error) {
        return Response.json({ error: error.message }, {status: 500});
    }
}

export async function PATCH(request, { params }) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { id } = params;
        const { status } = await request.json();

        const allowedStatuses = ["Completed", "Cancelled", "Pending"];

        if (!allowedStatuses.includes(status)) {
            return Response.json(
                { error: "Invalid status value." },
                { status: 400 }
            );
        }

        // If cancelling, restore stock
        if (status === "Cancelled") {

            const [details] = await connection.query(
                `SELECT productLine_ID, salesDetail_qty
                 FROM tbl_sales_details
                 WHERE sales_ID = ?`,
                [id]
            );

            for (const item of details) {
                await connection.query(
                    `UPDATE tbl_product
                     SET product_stockQty = product_stockQty + ?
                     WHERE product_ID = ?`,
                    [item.salesDetail_qty, item.productLine_ID]
                );
            }
        }

        await connection.query(
            `UPDATE tbl_sales
             SET sales_status = ?
             WHERE sales_ID = ?`,
            [status, id]
        );

        await connection.commit();

        return Response.json({ message: "Sale status updated." });

    } catch (error) {
        await connection.rollback();
        return Response.json({ error: error.message }, { status: 500 });

    } finally {
        connection.release();
    }
}
