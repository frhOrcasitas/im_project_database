import pool from "../../../../lib/db";

export async function GET(req, { params }) {
    try {
        const { id } = await params;

        const [rows] = await pool.query(
            `SELECT s.sales_ID, 
                s.sales_createdAt AS sales_Date, 
                s.sales_totalAmount, 
                s.sales_Balance, 
                s.sales_paymentStatus, 
                s.sales_SINumber
                FROM tbl_sales s WHERE s.client_ID = ?
            ORDER BY sales_createdAt DESC 
             LIMIT 10`,
            [id]
        );

        return Response.json(rows);
    } catch (error) {
        console.error("Database Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
