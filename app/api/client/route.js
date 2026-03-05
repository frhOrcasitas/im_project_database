import pool from "../../lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.*,
        CASE WHEN m.employee_ID IS NOT NULL THEN 1 ELSE 0 END AS isManager,
        m.manager_ID,
        m.manager_dateStarted,
        m.manager_status
      FROM tbl_employee e
      LEFT JOIN tbl_manager m ON e.employee_ID = m.employee_ID
      ORDER BY e.employee_name ASC
    `);
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      employee_ID, employee_name, employee_role, employee_email,
      employee_contactNo, employee_address, employee_gender,
      employee_dateHired, employee_birthdate, employee_status, isManager
    } = body;

    const [result] = await pool.query(
      `INSERT INTO tbl_employee 
       (employee_ID, employee_name, employee_role, employee_email, employee_contactNo,
        employee_address, employee_gender, employee_dateHired, employee_birthdate, employee_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_ID, employee_name, employee_role, employee_email, employee_contactNo,
       employee_address, employee_gender, employee_dateHired || null,
       employee_birthdate || null, employee_status || "Active"]
    );

    if (isManager === 1) {
      await pool.query(
        `INSERT INTO tbl_manager (employee_ID, manager_dateStarted, manager_status)
         VALUES (?, ?, ?)`,
        [employee_ID, new Date().toISOString().split("T")[0], employee_status || "Active"]
      );
    }

    return Response.json({ message: "Employee added successfully.", id: result.insertId }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}