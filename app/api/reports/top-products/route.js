import pool from "../../../lib/db";

export async function GET() {
    try {
        const [rows] = await pool.query(
            `SELECT 
                p.product_name,
                SUM(d.salesDetail_qty) as total_sold,
                SUM(d.salesDetail_subtotal) as total_revenue
             FROM tbl_sales_details d
             JOIN tbl_product p ON d.productLine_ID = p.product_ID
             GROUP BY d.productLine_ID
             ORDER BY total_sold DESC`
        );

        return Response.json(rows);

    } catch(error) {
        return Response.json({ error: error.message }, { status: 500});
    }
}