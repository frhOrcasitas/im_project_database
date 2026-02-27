export async function POST(request, { params }) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Next.js 15 Fix: Await params
        const { id } = await params; 
        const { payment_type, payment_amount, employee_ID } = await request.json();

        if (payment_amount <= 0) {
            throw new Error("Payment amount must be greater than zero.");
        }

        // 2. Get current sale data
        const [sale] = await connection.query(
            `SELECT sales_totalAmount, sales_status FROM tbl_sales WHERE sales_ID = ?`,
            [id]
        );

        if (sale.length === 0) throw new Error("Sale not found.");
        if (sale[0].sales_status === "Cancelled") throw new Error("Cannot add payment to cancelled sale.");

        // 3. Get existing payment totals
        const [payments] = await connection.query(
            `SELECT IFNULL(SUM(payment_amount), 0) as total_paid FROM tbl_payment_details WHERE sales_ID = ?`,
            [id]
        );

        const totalPaidBefore = Number(payments[0].total_paid);
        const totalAmount = Number(sale[0].sales_totalAmount);
        const newTotalPaid = totalPaidBefore + Number(payment_amount);

        if (totalPaidBefore === totalAmount) throw new Error("Sale is already fully paid.");
        if (newTotalPaid > totalAmount) throw new Error("Payment exceeds remaining balance.");

        // 4. Record the payment
        await connection.query(
            `INSERT INTO tbl_payment_details (sales_ID, payment_type, payment_paidDate, payment_amount, employee_ID)
             VALUES (?, ?, CURDATE(), ?, ?)`,
            [id, payment_type, payment_amount, employee_ID]
        );

        // 5. Calculate final status and balance
        const newBalance = totalAmount - newTotalPaid;
        let status = newBalance <= 0 ? "Paid" : "Partial";

        // 6. Update tbl_sales with both Status AND Balance
        await connection.query(
            `UPDATE tbl_sales SET sales_paymentStatus = ?, sales_Balance = ? WHERE sales_ID = ?`,
            [status, newBalance, id]
        );

        await connection.query(
            `UPDATE tbl_client c
             JOIN tbl_sales s ON c.client_ID = s.client_ID
             SET c.client_outstandingbalance = c.client_outstandingbalance - ?
             WHERE s.sales_ID = ?`,
            [payment_amount, id]
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