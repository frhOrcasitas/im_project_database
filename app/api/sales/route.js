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
            return Response.json({ error: "Sale must contain at least one item." }, { status: 400 });
        }

        // 1. Calculate totals based on the price sent by frontend (handles location-based surcharges)
        let totalAmount = 0;
        for (const item of items) {
            totalAmount += item.quantity * item.unitPrice;
        }

        // 2. Insert into tbl_sales
        // We set sales_Balance = totalAmount initially, then subtract payment if any.
        const [salesResult] = await connection.query(
            `INSERT INTO tbl_sales 
            (client_ID, employee_ID, sales_notes, sales_totalAmount, sales_Balance, sales_status, sales_paymentStatus)
            VALUES (?, ?, ?, ?, ?, 'Pending', 'Unpaid')`,
            [client_ID, employee_ID, sales_notes, totalAmount, totalAmount]
        );

        const sales_ID = salesResult.insertId;

        // 3. Process Items & Lock Price
        for (const item of items) {
            // Check Stock using productLine_ID (assuming productLine_ID maps to product_ID in tbl_product)
            const [product] = await connection.query(
                `SELECT product_stockQty FROM tbl_product WHERE product_ID = ?`,
                [item.productLine_ID]
            );
            
            if (product.length === 0 || product[0].product_stockQty < item.quantity) {
                throw new Error(`Insufficient stock for Product ID ${item.productLine_ID}`);
            }

            const subtotal = item.quantity * item.unitPrice;

            // Lock the price here. Even if tbl_product price changes later, this record stays same.
            await connection.query(
                `INSERT INTO tbl_sales_details
                (sales_ID, productLine_ID, salesDetail_qty, salesDetail_unitPriceSold, salesDetail_subtotal)
                VALUES (?, ?, ?, ?, ?)`,
                [sales_ID, item.productLine_ID, item.quantity, item.unitPrice, subtotal]
            );

            await connection.query(
                `UPDATE tbl_product SET product_stockQty = product_stockQty - ? WHERE product_ID = ?`,
                [item.quantity, item.productLine_ID]
            );
        }

        // 4. Handle Optional Initial Payment
        let amountPaid = payment ? parseFloat(payment.payment_amount) : 0;
        
        if (amountPaid > 0) {
            await connection.query(
                `INSERT INTO tbl_payment_details
                (sales_ID, payment_type, payment_ORNumber, payment_paidDate, payment_amount, employee_ID)
                VALUES (?, ?, ?, CURDATE(), ?, ?)`,
                [sales_ID, payment.payment_type, payment.payment_ORNumber, amountPaid, employee_ID]
            );

            // Update Sale Balance and Status
            const newBalance = totalAmount - amountPaid;
            const pStatus = amountPaid >= totalAmount ? "Paid" : "Partial";
            
            await connection.query(
                `UPDATE tbl_sales SET sales_Balance = ?, sales_paymentStatus = ? WHERE sales_ID = ?`,
                [newBalance, pStatus, sales_ID]
            );
        }

        // 5. Update Client Outstanding Balance (The "Thank You" prevention)
        // We add only the UNPAID portion to the client's running debt
        const unpaidPortion = totalAmount - amountPaid;
        await connection.query(
            `UPDATE tbl_client 
             SET client_outstandingbalance = IFNULL(client_outstandingbalance, 0) + ? 
             WHERE client_ID = ?`,
            [unpaidPortion, client_ID]
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
    const [rows] = await pool.query(`
      SELECT 
        s.sales_ID, 
        s.sales_createdAt, 
        s.sales_totalAmount, 
        s.sales_Balance, 
        s.sales_paymentStatus,
        c.client_name 
      FROM tbl_sales s
      JOIN tbl_client c ON s.client_ID = c.client_ID
      WHERE s.sales_paymentStatus != 'Paid'
      ORDER BY s.sales_createdAt DESC
    `);
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}