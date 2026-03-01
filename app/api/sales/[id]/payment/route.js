import pool from "../../../../lib/db";

export async function POST(req) {
  const connection = await pool.getConnection();
  try {
    const { sales_id, client_id, employee_id, amount, or_number, type } = await req.json();
    await connection.beginTransaction();

    // 1. Record the payment detail
    await connection.query(
      `INSERT INTO tbl_payment_details (sales_ID, payment_amount, payment_ORNumber, payment_paidDate, payment_type, employee_ID) 
       VALUES (?, ?, ?, CURDATE(), ?, ?)`,
      [sales_id, amount, or_number, type, employee_id]
    );

    // 2. Reduce the specific Sale's balance
    await connection.query(
      `UPDATE tbl_sales SET sales_Balance = sales_Balance - ? WHERE sales_ID = ?`,
      [amount, sales_id]
    );

    // 3. Reduce the Client's overall outstanding balance
    await connection.query(
      `UPDATE tbl_client SET client_outstandingbalance = client_outstandingbalance - ? WHERE client_ID = ?`,
      [amount, client_id]
    );

    // 4. If balance is 0, auto-complete the sale
    await connection.query(
      `UPDATE tbl_sales SET sales_paymentStatus = 'Paid', sales_status = 'Completed' 
       WHERE sales_ID = ? AND sales_Balance <= 0`,
      [sales_id]
    );

    await connection.commit();
    return Response.json({ message: "Payment recorded successfully!" });
  } catch (error) {
    await connection.rollback();
    return Response.json({ error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}