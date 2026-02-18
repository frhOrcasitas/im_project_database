import pool from "../../../lib/db";


// call like this: GET /api/reports/daily?date=yyyy-mm-dd

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get("date");

        if (!date) {
            return Response.json(
                { error: "Date is required (YYYY-MM-DD)" },
                { status: 400 }
            );
        }

        const [rows] = await pool.query(
            `SELECT
                DATE(sales_date) as sale_date,
                COUNT(*) as total_transactions,
                SUM(sales_totalAmount) as total_sales
            FROM tbl_sales
            WHERE DATE(sales_date) = ?
            GROUP BY DATE (sales_date)`,
            [date]
        );

        return Response.json(rows[0] || {
            sale_date: date,
            total_transactions: 0,
            total_sales: 0
        });
    } catch (error) {
        return Response.json({error: error.message }, { status: 500});
    }
}