import pool from "../../lib/db";

export async function GET() {
  
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.*,
        CASE WHEN m.employee_ID IS NOT NULL AND LOWER(m.manager_status) = 'active' THEN 1 ELSE 0 END AS isManager,
        m.manager_ID,
        m.manager_dateStarted,
        m.manager_status,
        e.username,
        e.system_role
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
    const { 
      employee_ID, 
      employee_name, 
      employee_role, 
      employee_email, 
      employee_contactNo, 
      employee_address, 
      employee_gender, 
      employee_dateHired, 
      employee_status, 
      employee_birthdate,
      isManager 
    } = body;

    // 1. Insert into Employee Table
    await pool.query(
      `INSERT INTO tbl_employee (employee_ID, employee_name, employee_role, employee_email, employee_contactNo, employee_address, employee_gender, employee_dateHired, employee_status, employee_birthdate) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_ID, employee_name, employee_role, employee_email, employee_contactNo, employee_address, employee_gender, employee_dateHired, employee_status || 'Active', employee_birthdate]
    );

    // 2. If Manager checkbox was checked, insert into tbl_manager
    if (isManager === 1) {
      await pool.query(
        `INSERT INTO tbl_manager (employee_ID, manager_dateStarted, manager_status) VALUES (?, ?, ?)`,
        [employee_ID, new Date().toISOString().split('T')[0], 'Active']
      );
    }

    return Response.json({ message: "Employee created successfully" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}