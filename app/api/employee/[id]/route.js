import pool from "../../../lib/db";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log("PUT /api/employee/", id, "body:", body);

    const { 
      employee_name, employee_role, employee_email, employee_contactNo, 
      employee_address, employee_gender, employee_dateHired, 
      employee_status, employee_birthdate, isManager,
      username, password_hash, system_role  
    } = body;

    const safeHired     = employee_dateHired  || null;
    const safeBirthdate = employee_birthdate  || null;
    const safeEmail     = employee_email      || null;
    const safeContact   = employee_contactNo  || null;
    const safeAddress   = employee_address    || null;
    const safeGender    = employee_gender     || null;
    const isManagerNum  = Number(isManager);

    const [result] = await pool.query(
      `UPDATE tbl_employee
       SET employee_name = ?, employee_role = ?, employee_email = ?,
           employee_contactNo = ?, employee_address = ?, employee_gender = ?,
           employee_dateHired = ?, employee_status = ?, employee_birthdate = ?,
           username = ?,
           password_hash = CASE WHEN ? != '' AND ? IS NOT NULL THEN ? ELSE password_hash END,
           system_role = ?
       WHERE employee_ID = ?`,
      [
        employee_name, employee_role, safeEmail, safeContact,
        safeAddress, safeGender, safeHired, employee_status, safeBirthdate,
        username || null,
        password_hash || '', password_hash || null, password_hash || null,
        system_role || null,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return Response.json({ error: "Employee not found" }, { status: 404 });
    }

    if (isManagerNum === 1) {
      await pool.query(
        `INSERT INTO tbl_manager (employee_ID, manager_dateStarted, manager_status) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE manager_status = ?`,
        [id, new Date().toISOString().split("T")[0], employee_status, employee_status]
      );
    } else {
      await pool.query(
        `UPDATE tbl_manager SET manager_status = 'Inactive' WHERE employee_ID = ?`,
        [id]
      );
    }

    return Response.json({ message: "Employee profile updated successfully." });
  } catch (error) {
    console.error("PUT employee error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { employee_status } = await request.json();

    // Update main table
    await pool.query(
      `UPDATE tbl_employee SET employee_status = ? WHERE employee_ID = ?`,
      [employee_status, id]
    );

    // Update manager table if they exist there
    await pool.query(
      `UPDATE tbl_manager SET manager_status = ? WHERE employee_ID = ?`,
      [employee_status, id]
    );

    return Response.json({ message: "Status updated" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        const [result] = await pool.query("DELETE FROM tbl_employee WHERE employee_ID = ?", [id]);
        
        if (result.affectedRows === 0) {
            return Response.json({ error: "Employee not found" }, { status: 404 });
        }

        return Response.json({message: "Employee deleted successfully"});

    } catch (error) {
        return Response.json({error: error.message }, {status: 500});
    }
}
