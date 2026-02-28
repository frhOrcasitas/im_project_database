import pool from "../../lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.*,
        m.manager_ID,
        m.manager_dateStarted,
        m.manager_status,
        IF(m.manager_ID IS NOT NULL, 1, 0) as isManager
      FROM tbl_employee e
      LEFT JOIN tbl_manager m ON e.employee_ID = m.employee_ID
      ORDER BY e.employee_name ASC
    `);
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { employee_name, 
                employee_role, 
                employee_email, 
                employee_contactNo, 
                employee_address, 
                employee_gender, 
                employee_dateHired, 
                employee_status, 
                employee_birthdate} = body;

        const [result] = await pool.query(
            `INSERT INTO tbl_employee (employee_name, employee_role, employee_email, employee_contactNo, employee_address, employee_gender, employee_dateHired, employee_status, employee_birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [employee_name, employee_role, employee_email, employee_contactNo, employee_address, employee_gender, employee_dateHired, employee_status, employee_birthdate]
        );
        return Response.json({message: "Employee created successfully"});

    } catch (error) {
        return Response.json({error: error.message }, {status: 500});
    }
}