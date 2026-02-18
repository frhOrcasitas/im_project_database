import pool from "../../../lib/db";

export async function GET() {
    try {
        const [rows] = await pool.query(
            `SELECT 
                YEAR(sales_date) as year,
                MONTH(sales_date) as month,
                COUNT(*) as total_transactions,
                SUM(sales_totalAmount) as total_sales
             FROM tbl_sales
             GROUP BY YEAR(sales_date), MONTH(sales_date)
             ORDER BY year DESC, month DESC`
        );

        return Response.json(rows);
    } catch (error) {
        return Response.json({error: error.message}, { status: 500});
    }
}