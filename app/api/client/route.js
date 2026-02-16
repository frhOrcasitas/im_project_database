import pool from "../../lib/db";

export async function GET() {

    try {
        const [rows] = await pool.query("SELECT * FROM tbl_client");
        return Response.json(rows);

    } catch (error) {
        return Response.json({error: error.message }, {status: 500});
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { client_name, client_contactNumber, client_email, client_address, client_contactPersonID, TIN_Code, client_outstandingbalance} = body;

        const [result] = await pool.query(
            `INSERT INTO tbl_client (client_name, client_contactNumber, client_email, client_address, client_contactPersonID, TIN_Code, client_outstandingbalance) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [client_name, client_contactNumber, client_email, client_address, client_contactPersonID, TIN_Code, client_outstandingbalance]
        );
        return Response.json({message: "Client created successfully"});

    } catch (error) {
        return Response.json({error: error.message }, {status: 500});
    }
}