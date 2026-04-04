import pool from "../../../../lib/db";

export async function POST(req, { params }) {
  const { id } = await params;
  const sales_ID = Number(id);
  const { employee_id, amount, or_number, type, paid_date } = await req.json();

  if (!sales_ID)    return Response.json({ error: "Missing sales_ID." },    { status: 400 });
  const normalizeCurrency = (value) => Math.round((Number(value) || 0) * 100) / 100;
  const paid = normalizeCurrency(amount);
  if (!Number.isFinite(paid) || paid <= 0) return Response.json({ error: "Missing or invalid amount." }, { status: 400 });
  if (!employee_id) return Response.json({ error: "Missing employee_id." }, { status: 400 });

  // ← connection declared FIRST before any query
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Validate OR number uniqueness if provided
    if (or_number) {
      const [existingOR] = await connection.query(
        `SELECT payment_ID FROM tbl_payment_details WHERE payment_ORNumber = ?`,
        [or_number]
      );
      if (existingOR.length > 0) {
        await connection.rollback();
        return Response.json({ error: `OR Number "${or_number}" already exists.` }, { status: 400 });
      }
    }

    // 1. Get sale total
    const [[sale]] = await connection.query(
      `SELECT sales_totalAmount FROM tbl_sales WHERE sales_ID = ?`,
      [sales_ID]
    );
    if (!sale) throw new Error("Sale not found.");

    // 2. Calculate live balance from actual payments
    const [[{ total_paid }]] = await connection.query(
      `SELECT IFNULL(SUM(payment_amount), 0) AS total_paid
       FROM tbl_payment_details WHERE sales_ID = ?`,
      [sales_ID]
    );

    const total          = normalizeCurrency(sale.sales_totalAmount);
    const alreadyPaid    = normalizeCurrency(total_paid);
    const currentBalance = normalizeCurrency(total - alreadyPaid);

    // 3. Overpayment guard
    if (paid > currentBalance) {
      throw new Error(`Payment of ₱${paid.toFixed(2)} exceeds remaining balance of ₱${currentBalance.toFixed(2)}.`);
    }

    const newBalance = normalizeCurrency(Math.max(0, currentBalance - paid));

    // 4. Determine new payment status
    let newStatus;
    if (newBalance <= 0)         newStatus = "Paid";
    else if (newBalance < total) newStatus = "Partial";
    else                         newStatus = "Unpaid";

    // 5. Insert payment record
    await connection.query(
      `INSERT INTO tbl_payment_details
         (sales_ID, employee_ID, payment_amount, payment_ORNumber, payment_type, payment_paidDate)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sales_ID, employee_id, paid, or_number || null, type || "Cash", paid_date || new Date().toISOString().split("T")[0]]
    );

    // 6. Update sale balance and payment status
    await connection.query(
      `UPDATE tbl_sales
       SET sales_Balance = ?,
           sales_paymentStatus = ?
       WHERE sales_ID = ?`,
      [newBalance, newStatus, sales_ID]
    );

    // 7. Update client outstanding balance
    await connection.query(
      `UPDATE tbl_client
       SET client_outstandingbalance = (
         SELECT COALESCE(SUM(sales_Balance), 0)
         FROM tbl_sales
         WHERE client_ID = (SELECT client_ID FROM tbl_sales WHERE sales_ID = ?)
       )
       WHERE client_ID = (SELECT client_ID FROM tbl_sales WHERE sales_ID = ?)`,
      [sales_ID, sales_ID]
    );

    await connection.commit();
    return Response.json({ success: true, newBalance, newStatus });
  } catch (err) {
    await connection.rollback();
    console.error("POST /api/sales/[id]/payment error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  } finally {
    connection.release();
  }
}