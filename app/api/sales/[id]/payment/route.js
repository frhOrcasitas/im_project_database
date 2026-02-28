import pool from "../../../../lib/db";

export async function POST(request, { params }) {
    const connection = await pool.getConnection();
    const { id } = await params; 
    const { payment_type, payment_ORNumber, payment_amount, employee_ID } = await request.json();

    try {
        await connection.beginTransaction();

        // 1. Get current balance and client_ID
        const [sale] = await connection.query(
            "SELECT sales_Balance, client_ID, sales_totalAmount FROM tbl_sales WHERE sales_ID = ?", [id]
        );

        if (!sale.length) throw new Error("Sale not found.");
        
        const currentBalance = parseFloat(sale[0].sales_Balance);
        if (payment_amount > currentBalance) {
            throw new Error(`Payment exceeds balance. Remaining: ${currentBalance}`);
        }

        // 2. Record Payment
        await connection.query(
            `INSERT INTO tbl_payment_details 
            (sales_ID, payment_type, payment_ORNumber, payment_paidDate, payment_amount, employee_ID) 
            VALUES (?, ?, ?, CURDATE(), ?, ?)`,
            [id, payment_type, payment_ORNumber, payment_amount, employee_ID]
        );

        // 3. Update Sale Balance & Status
        const newBalance = currentBalance - payment_amount;
        const newStatus = newBalance <= 0 ? "Paid" : "Partial";

        await connection.query(
            "UPDATE tbl_sales SET sales_Balance = ?, sales_paymentStatus = ? WHERE sales_ID = ?",
            [newBalance, newStatus, id]
        );

        // 4. Update Client Debt
        await connection.query(
            "UPDATE tbl_client SET client_outstandingbalance = client_outstandingbalance - ? WHERE client_ID = ?",
            [payment_amount, sale[0].client_ID]
        );

        await connection.commit();
        return Response.json({ message: "Payment recorded successfully", remainingBalance: newBalance });
    } catch (error) {
        await connection.rollback();
        return Response.json({ error: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}