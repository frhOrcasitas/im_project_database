import pool from "../../../lib/db";

export async function PUT(request, { params }) {
    try {
        const {id} = await params;
        const clientId = Number(id);

        if (!id || isNaN(id)) {
            return Response.json(
                { error: "Invalid client ID" }, 
                { status: 400 });
        }
        
        const body = await request.json();
        const { 
            client_name, 
            client_contactNumber, 
            client_email, 
            client_address, 
            client_contactPersonID, 
            TIN_Code, 
            client_outstandingbalance
        } = body;

        const [result] =await pool.query(
            `UPDATE tbl_client
            SET client_name = ?, 
                client_contactNumber = ?, 
                client_email = ?,
                client_address = ?,
                client_contactPersonID = ?,
                TIN_Code = ?,
                client_outstandingbalance = ?
            WHERE client_ID = ?`,
            
            [
                client_name, 
                client_contactNumber, 
                client_email, 
                client_address, 
                client_contactPersonID, 
                TIN_Code, 
                client_outstandingbalance,
                id
            ]
        );
        return Response.json({message: "Client updated successfully"});

    } catch (error) {
        return Response.json({error: error.message }, {status: 500});   
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        const [result] = await pool.query("DELETE FROM tbl_client WHERE client_ID = ?", [id]);
        
        if (result.affectedRows === 0) {
            return Response.json({ error: "Client not found" }, { status: 404 });
        }

        return Response.json({message: "Client deleted successfully"});

    } catch (error) {
        return Response.json({error: error.message }, {status: 500});
    }
}