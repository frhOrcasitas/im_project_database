import pool from "../../../lib/db";

export async function GET() {
    try {
        const [rows] = await pool.query(
            `SELECT 
                YEAR(sales_createdAt) as year, 
                COUNT(*) as total_transactions, 
                SUM(sales_totalAmount) as total_sales,
                SUM(sales_Balance) as total_outstanding_balance
             FROM tbl_sales
             GROUP BY YEAR(sales_createdAt)
             ORDER BY year DESC`
        );

        return Response.json(rows);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}