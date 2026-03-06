import pool from "../../../lib/db";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // 1. Fetch Sales Header
    const [saleRows] = await pool.query(
      `SELECT s.*, c.client_name 
       FROM tbl_sales s 
       JOIN tbl_client c ON s.client_ID = c.client_ID 
       WHERE s.sales_ID = ?`, [id]
    );

    // 2. Fetch Sales Details (Joining with tbl_product to get the product name)
    const [itemRows] = await pool.query(
      `SELECT sd.*, p.product_name 
       FROM tbl_sales_details sd 
       JOIN tbl_product p ON sd.productLine_ID = p.product_ID
       WHERE sd.sales_ID = ?`, [id]
    );

    // 3. Fetch Payment History (JOINING WITH tbl_employee FOR THE NAME)
    const [paymentRows] = await pool.query(
      `SELECT pd.*, e.employee_name 
       FROM tbl_payment_details pd
       LEFT JOIN tbl_employee e ON pd.employee_ID = e.employee_ID
       WHERE pd.sales_ID = ? 
       ORDER BY pd.payment_paidDate DESC`, [id]
    );

    if (saleRows.length === 0) return Response.json({ error: "Sale not found" }, { status: 404 });

    return Response.json({
      sale: saleRows[0],
      items: itemRows,
      payments: paymentRows
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { id } = await params;
        const { status } = await request.json();

        const allowedStatuses = ["Completed", "Cancelled", "Pending"];

        if (!allowedStatuses.includes(status)) {
            return Response.json(
                { error: "Invalid status value." },
                { status: 400 }
            );
        }

        // If cancelling, restore stock
        if (status === "Cancelled") {

            const [currentSale] = await connection.query(
                `SELECT sales_status FROM tbl_sales WHERE sales_ID = ?`,
                [id]
            );

            if (currentSale.length === 0) {
                throw new Error("Sale not found.");
            }

            if (currentSale[0].sales_status === "Cancelled") {
                throw new Error("Sale is already cancelled.");
            }

            const [details] = await connection.query(
                `SELECT productLine_ID, salesDetail_qty
                 FROM tbl_sales_details
                 WHERE sales_ID = ?`,
                [id]
            );

            for (const item of details) {
                await connection.query(
                    `UPDATE tbl_product
                     SET product_stockQty = product_stockQty + ?
                     WHERE product_ID = ?`,
                    [item.salesDetail_qty, item.productLine_ID]
                );
            }
        }

        await connection.query(
            `UPDATE tbl_sales
             SET sales_status = ?
             WHERE sales_ID = ?`,
            [status, id]
        );

        await connection.commit();

        return Response.json({ message: "Sale status updated." });

    } catch (error) {
        await connection.rollback();
        return Response.json({ error: error.message }, { status: 500 });

    } finally {
        connection.release();
    }
}
