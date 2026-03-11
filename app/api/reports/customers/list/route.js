import pool from "../../../../lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT client_ID, client_name FROM tbl_client ORDER BY client_name ASC`
    );
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}