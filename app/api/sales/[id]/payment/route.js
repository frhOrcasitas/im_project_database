import pool from "../../../../lib/db";

export async function POST(request, { params }) {
    const connection = await pool.getConnection();
    const { id } = await params; // sales_ID
    const { payment_type, payment_ORNumber, payment_amount, employee_ID } = await request.json();

    try {
        await connection.beginTransaction();

        // 1. Get current balance and client_ID
        const [sale] = await connection.query(
            "SELECT sales_Balance, client_ID FROM tbl_sales WHERE sales_ID = ?", [id]
        );

        if (payment_amount > sale[0].sales_Balance) {
            throw new Error("Payment exceeds balance.");
        }

        // 2. Insert into tbl_payment_details (Match your schema exactly)
        await connection.query(
            `INSERT INTO tbl_payment_details 
            (sales_ID, payment_type, payment_ORNumber, payment_paidDate, payment_amount, employee_ID) 
            VALUES (?, ?, ?, CURDATE(), ?, ?)`,
            [id, payment_type, payment_ORNumber, payment_amount, employee_ID]
        );

        // 3. Update Sale Balance
        await connection.query(
            "UPDATE tbl_sales SET sales_Balance = sales_Balance - ? WHERE sales_ID = ?",
            [payment_amount, id]
        );

        // 4. Update Client Total Debt (tbl_client.client_outstandingbalance)
        await connection.query(
            "UPDATE tbl_client SET client_outstandingbalance = client_outstandingbalance - ? WHERE client_ID = ?",
            [payment_amount, sale[0].client_ID]
        );

        await connection.commit();
        return Response.json({ message: "Payment recorded successfully" });
    } catch (error) {
        await connection.rollback();
        return Response.json({ error: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}