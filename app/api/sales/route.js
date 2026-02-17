import pool from "../../lib/db";

export async function POST(request) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const body = await request.json();
        const { client_ID, employee_ID, sales_notes, items, payment } = body;

        if (!items || items.length === 0) {
            return Response.json(
                { error: "Sale must contain at least one item." },
                { status: 400 }
            );
        }

        let totalAmount = 0;
        for (const item of items) {
            totalAmount += item.quantity * item.unitPrice;
        }

        const [salesResult] = await connection.query (
            `INSERT INTO tbl_sales 
            (client_ID, employee_ID, sales_notes, sales_totalAmount)
            VALUES (?, ?, ?, ?)`,
            [client_ID, employee_ID, sales_notes, totalAmount]
        );

        const sales_ID = salesResult.insertId;

        for (const item of items) {
            const subtotal = item.quantity * item.unitPrice;

            await connection.query(
                `INSERT INTO tbl_sales_details
                (sales_ID, productLine_ID, salesDetail_qty, salesDetail_unitPriceSold, salesDetail_subtotal)
                VALUES (?, ?, ?, ?, ?)`,
                [
                    sales_ID,
                    item.productLine_ID,
                    item.quantity,
                    item.unitPrice,
                    subtotal
                ]
            );

            await connection.query(
                `UPDATE tbl_product
                 SET product_stockQty = product_stockQty - ?
                 WHERE product_ID = ?`,
                 [item.quantity, item.productLine_ID]
            );
        }

        if (payment) {
            await connection.query(
                `INSERT INTO tbl_payment_details
                (sales_ID, payment_type, payment_paidDate, payment_amount, employee_ID)
                VALUES (?, ?, CURDATE(), ?, ?)`,
                [
                    sales_ID,
                    payment.payment_type,
                    payment.payment_amount,
                    payment.employee_ID
                ]
            );
        }
        await connection.commit();


        return Response.json({
            message:"Sale created successfully.",
            sales_ID
        });

    } catch (error) {
        await connection.rollback();
        return Response.json({ error: error.message}, {status: 500});

    } finally {
        connection.release();
    }
}