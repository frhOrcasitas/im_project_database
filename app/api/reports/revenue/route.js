import pool from "../../../lib/db";

export async function GET() {
    try {
        const [rows] = await pool.query(
            `SELECT 
                COUNT(DISTINCT d.sales_ID) as total_transactions,
                SUM(d.salesDetail_qty) as total_units_sold,
                SUM(d.salesDetail_subtotal) as gross_revenue
             FROM tbl_sales_details d
             JOIN tbl_sales s ON d.sales_ID = s.sales_ID
             WHERE s.sales_status != 'Cancelled'`
        );
        return Response.json(rows[0]); // Now this returns a summary of the whole company
    } catch(error) {
        return Response.json({error: error.message}, {status: 500});
    }
}