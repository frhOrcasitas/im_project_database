import pool from "../../../../lib/db";

export async function GET(req, { params }) {
    try {
        const { id } = await params;

        const [rows] = await pool.query(
            `SELECT 
                sales_ID, 
                sales_createdAt AS sales_Date, 
                sales_totalAmount, 
                sales_Balance, 
                sales_paymentStatus 
             FROM tbl_sales 
             WHERE client_ID = ? 
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
