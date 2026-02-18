import pool from "../../lib/db";

// ==========================
// POST - CREATE SALE
// ==========================
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

        const productSet = new Set();

        for (const item of items) {
            if (productSet.has(item.productLine_ID)) {
                return Response.json(
                    { error: "Duplicate product in sale is not allowed."},
                    { status: 400 }
                );
            }
            productSet.add(item.productLine_ID);
        }

        // Validate client
        const [client] = await connection.query(
            `SELECT client_ID FROM tbl_client WHERE client_ID = ?`,
            [client_ID]
        );

        if (client.length === 0) {
            throw new Error("Client not found.");
        }

        // Validate employee
        const [employee] = await connection.query(
            `SELECT employee_ID FROM tbl_employee WHERE employee_ID = ?`,
            [employee_ID]
        );

        if (employee.length === 0) {
            throw new Error("Employee not found.");
        }

        for (const item of items) {
            if (productSet.has(item.productLine_ID)) {
                return Response.json(
                    { error: "Duplicate product in sale is not allowed."},
                    { status: 400 }
                );
            }

            if (item.quantity <= 0) {
                return Response.json(
                    { error: "Quantity must be greater than zero." },
                    { status: 400 }
                );
            }

            if (item.unitPrice < 0) {
                return Response.json(
                    { error: "Unit price cannot be negative." },
                    { status: 400 }
                );
            }

            productSet.add(item.productLine_ID);
        }


        // Calculate total
        let totalAmount = 0;
        for (const item of items) {
            totalAmount += item.quantity * item.unitPrice;
        }

        // Insert into tbl_sales
        const [salesResult] = await connection.query(
            `INSERT INTO tbl_sales 
            (client_ID, employee_ID, sales_notes, sales_totalAmount)
            VALUES (?, ?, ?, ?)`,
            [client_ID, employee_ID, sales_notes, totalAmount]
        );

        const sales_ID = salesResult.insertId;

        // Insert sales details + update stock
        for (const item of items) {

            // Check stock first
            const [product] = await connection.query(
                `SELECT product_stockQty 
                 FROM tbl_product 
                 WHERE product_ID = ?`,
                [item.productLine_ID]
            );

            if (product.length === 0) {
                throw new Error("Product not found.");
            }

            if (product[0].product_stockQty < item.quantity) {
                throw new Error("Not enough stock available.");
            }

            const subtotal = item.quantity * item.unitPrice;

            // Insert detail
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

            // Update stock
            await connection.query(
                `UPDATE tbl_product
                 SET product_stockQty = product_stockQty - ?
                 WHERE product_ID = ?`,
                [item.quantity, item.productLine_ID]
            );
        }

        // Handle payment
        let paymentStatus = "Unpaid";

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

            if (payment.payment_amount >= totalAmount) {
                paymentStatus = "Paid";
            } else if (payment.payment_amount > 0) {
                paymentStatus = "Partial";
            }
        }

        // Update payment status
        await connection.query(
            `UPDATE tbl_sales 
             SET sales_paymentStatus = ?
             WHERE sales_ID = ?`,
            [paymentStatus, sales_ID]
        );

        await connection.commit();

        return Response.json({
            message: "Sale created successfully.",
            sales_ID
        });

    } catch (error) {
        await connection.rollback();
        return Response.json({ error: error.message }, { status: 500 });

    } finally {
        connection.release();
    }
}

export async function GET() {
    try {
        const [rows] = await pool.query(
            `SELECT
                s.sales_ID,
                s.sales_totalAmount,
                s.sales_status,
                s.sales_paymentStatus,
                s.sales_createdAt,
                c.client_name,
                e.employee_name
            FROM tbl_sales s
            JOIN tbl_client c ON s.client_ID = c.client_ID
            JOIN tbl_employee e ON s.employee_ID = e. employee_ID
            ORDER BY s.sales_createdAt DESC`
        );

        return Response.json(rows);

    } catch (error) {
        return Response.json({error: error.message}, { status: 500});
    }
}