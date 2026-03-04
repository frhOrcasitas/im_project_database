import pool from "../../../../lib/db";


export async function POST(req, { params }) {
  const connection = await pool.getConnection();
  try {
    // Get the ID from the URL [id]
    const { id } = await params; 
    
    // Get the rest from the body
    const { client_id, employee_id, amount, or_number, type } = await req.json();
    
    // Safety check: If body sales_id is missing, use the URL id
    const targetSalesID = id;

    if (!targetSalesID || targetSalesID === "0") {
        throw new Error("Invalid Sales ID provided.");
    }

    await connection.beginTransaction();

    // 1. Record payment
    await connection.query(
      `INSERT INTO tbl_payment_details (sales_ID, payment_amount, payment_ORNumber, payment_paidDate, payment_type, employee_ID) 
       VALUES (?, ?, ?, CURDATE(), ?, ?)`,
      [targetSalesID, amount, or_number, type, employee_id || null]
    );

    // 2. Reduce Sale balance
    await connection.query(
      `UPDATE tbl_sales SET sales_Balance = sales_Balance - ? WHERE sales_ID = ?`,
      [amount, targetSalesID]
    );

    // 3. Reduce Client overall balance
    await connection.query(
      `UPDATE tbl_client SET client_outstandingbalance = client_outstandingbalance - ? WHERE client_ID = ?`,
      [amount, client_id]
    );

    // 4. Update status if fully paid
    await connection.query(
      `UPDATE tbl_sales SET sales_paymentStatus = 'Paid' 
       WHERE sales_ID = ? AND sales_Balance <= 0`,
      [targetSalesID]
    );

    await connection.commit();
    return Response.json({ message: "Payment recorded successfully!" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Payment API Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}