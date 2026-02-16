import pool from "../../../lib/db";

export async function PUT(request, { params }) {
    try {
        const {id} = await params;
        const employeeId = Number(id);

        if (!id || isNaN(id)) {
            return Response.json(
                { error: "Invalid employee ID" }, 
                { status: 400 });
        }
        
        const body = await request.json();
        const { 
            employee_name, 
            employee_role, 
            employee_email,
            employee_contactNo, 
            employee_address, 
            employee_gender,
            employee_dateHired,
            employee_status,
            employee_birthdate
        } = body;

        const [result] =await pool.query(
            `UPDATE tbl_client
            SET employee_name = ?, 
                employee_role = ?, 
                employee_email = ?,
                employee_contactNo = ?,
                employee_address = ?,
                employee_gender = ?,
                employee_dateHired = ?,
                employee_status = ?,
                employee_birthdate = ?
            WHERE employee_ID = ?`,
            
            [
                employee_name, 
                employee_role, 
                employee_email, 
                employee_contactNo, 
                employee_address, 
                employee_gender,
                employee_dateHired,
                employee_status,
                employee_birthdate,
                id
            ]
        );
        return Response.json({message: "Employee updated successfully"});

    } catch (error) {
        return Response.json({error: error.message }, {status: 500});   
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