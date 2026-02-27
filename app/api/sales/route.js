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

        // 1. Basic Validation
        if (!items || items.length === 0) {
            return Response.json({ error: "Sale must contain at least one item." }, { status: 400 });
        }

        // 2. Validate Client Existence
        const [client] = await connection.query(
            `SELECT client_ID, client_outstandingbalance FROM tbl_client WHERE client_ID = ?`,
            [client_ID]
        );
        if (client.length === 0) throw new Error("Client not found.");

        // 3. Validate Employee Existence
        const [employee] = await connection.query(
            `SELECT employee_ID FROM tbl_employee WHERE employee_ID = ?`,
            [employee_ID]
        );
        if (employee.length === 0) throw new Error("Employee not found.");

        // 4. Calculate total amount
        let totalAmount = 0;
        for (const item of items) {
            totalAmount += item.quantity * item.unitPrice;
        }

        // 5. Insert into tbl_sales
        const [salesResult] = await connection.query(
            `INSERT INTO tbl_sales 
            (client_ID, employee_ID, sales_notes, sales_totalAmount, sales_status)
            VALUES (?, ?, ?, ?, 'Completed')`,
            [client_ID, employee_ID, sales_notes, totalAmount]
        );

        const sales_ID = salesResult.insertId;

        // 6. Process Items (Stock check + Foreign Key Check + Details)
        for (const item of items) {
            // FIX: Check Foreign Key constraint (must exist in shipment details)
            /*
            const [shipment] = await connection.query(
                `SELECT productLine_ID FROM tbl_shipment_productdetails WHERE product_ID = ? LIMIT 1`,
                [item.productLine_ID] 
            );

            if (shipment.length === 0) {
                throw new Error(`Product Line ID ${item.productLine_ID} not found in shipments. Cannot sell items that haven't been received.`);
            }
                */

            // Check Stock
            const [product] = await connection.query(
                `SELECT product_stockQty FROM tbl_product WHERE product_ID = ?`,
                [item.productLine_ID]
            );
            if (product.length === 0 || product[0].product_stockQty < item.quantity) {
                throw new Error(`Insufficient stock for Product ID ${item.productLine_ID}`);
            }

            const subtotal = item.quantity * item.unitPrice;

            // Insert Sales Detail
            await connection.query(
                `INSERT INTO tbl_sales_details
                (sales_ID, productLine_ID, salesDetail_qty, salesDetail_unitPriceSold, salesDetail_subtotal)
                VALUES (?, ?, ?, ?, ?)`,
                [sales_ID, item.productLine_ID, item.quantity, item.unitPrice, subtotal]
            );

            // Deduct Stock
            await connection.query(
                `UPDATE tbl_product SET product_stockQty = product_stockQty - ? WHERE product_ID = ?`,
                [item.quantity, item.productLine_ID]
            );
        }

        // 7. Handle Payment & Balance Tracking
        let paymentStatus = "Unpaid";
        const amountPaid = payment ? parseFloat(payment.payment_amount) : 0;
        const saleBalance = totalAmount - amountPaid;

        if (amountPaid > 0) {
            await connection.query(
                `INSERT INTO tbl_payment_details
                (sales_ID, payment_type, payment_paidDate, payment_amount, employee_ID)
                VALUES (?, ?, CURDATE(), ?, ?)`,
                [sales_ID, payment.payment_type, amountPaid, payment.employee_ID]
            );

            paymentStatus = amountPaid >= totalAmount ? "Paid" : "Partial";
        }

        // 8. UPDATE CLIENT BALANCE & SALES STATUS
        // This adds the unpaid portion of this sale to the client's total debt
        await connection.query(
            `UPDATE tbl_client 
             SET client_outstandingbalance = client_outstandingbalance + ? 
             WHERE client_ID = ?`,
            [saleBalance, client_ID]
        );

        await connection.query(
            `UPDATE tbl_sales 
             SET sales_paymentStatus = ?, sales_Balance = ?
             WHERE sales_ID = ?`,
            [paymentStatus, saleBalance, sales_ID]
        );

        await connection.commit();
        return Response.json({ message: "Sale created successfully.", sales_ID });

    } catch (error) {
        await connection.rollback();
        return Response.json({ error: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}

// ==========================
// GET - FETCH ALL SALES
// ==========================
export async function GET() {
    try {
        const [rows] = await pool.query(
            `SELECT
                s.sales_ID,
                s.sales_totalAmount,
                s.sales_Balance,
                s.sales_status,
                s.sales_paymentStatus,
                s.sales_createdAt,
                c.client_name,
                e.employee_name
            FROM tbl_sales s
            JOIN tbl_client c ON s.client_ID = c.client_ID
            JOIN tbl_employee e ON s.employee_ID = e.employee_ID
            ORDER BY s.sales_createdAt DESC`
        );
        return Response.json(rows);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}