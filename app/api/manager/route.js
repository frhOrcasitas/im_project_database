import pool from "../../lib/db";

export async function GET() {
    try {
        const [rows] = await pool.query(`
            SELECT m.manager_ID, e.employee_name 
            FROM tbl_manager m
            JOIN tbl_employee e ON m.employee_ID = e.employee_ID
        `);
        return Response.json(rows);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}