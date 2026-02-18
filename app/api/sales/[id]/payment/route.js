import pool from "../../../../lib/db";

export async function POST(request, { params }) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { id } = params;
        const { payment_type, payment_amount, employee_ID } = await request.json();

        if (payment_amount <= 0) {
            throw new Error("Payment amount must be greater than zero.");
        }

        // Get sale
        const [sale] = await connection.query(
            `SELECT sales_totalAmount 
             FROM tbl_sales 
             WHERE sales_ID = ?`,
            [id]
        );

        if (sale.length === 0) {
            throw new Error("Sale not found.");
        }

        if (sale[0].sales_status === "Cancelled") {
            throw new Error("Cannot add payment to cancelled sale.");
        }

        if (saleStatus[0].sales_status === "Cancelled") {
            throw new Error("Cannot add payment to cancelled sale.");
        }

        if (sale.length === 0) {
            throw new Error("Sale not found.");
        }


        // Get total already paid
        const [payments] = await connection.query(
            `SELECT IFNULL(SUM(payment_amount), 0) as total_paid
             FROM tbl_payment_details
             WHERE sales_ID = ?`,
            [id]
        );

        const totalPaid = payments[0].total_paid;
        const totalAmount = sale[0].sales_totalAmount;

        if (totalPaid === totalAmount) {
            throw new Error("Sale is already fully paid.");
        }

        if (totalPaid + payment_amount > totalAmount) {
            throw new Error("Payment exceeds remaining balance.");
        }

        // Insert payment
        await connection.query(
            `INSERT INTO tbl_payment_details
             (sales_ID, payment_type, payment_paidDate, payment_amount, employee_ID)
             VALUES (?, ?, CURDATE(), ?, ?)`,
            [id, payment_type, payment_amount, employee_ID]
        );

        // Update payment status
        let status = "Partial";

        if (totalPaid + payment_amount === totalAmount) {
            status = "Paid";
        }

        await connection.query(
            `UPDATE tbl_sales
             SET sales_paymentStatus = ?
             WHERE sales_ID = ?`,
            [status, id]
        );

        await connection.commit();

        return Response.json({ message: "Payment added successfully." });

    } catch (error) {
        await connection.rollback();
        return Response.json({ error: error.message }, { status: 500 });

    } finally {
        connection.release();
    }
}