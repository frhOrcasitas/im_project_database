import pool from "../../lib/db";

export async function GET() {

    try {
        const [rows] = await pool.query(`
            SELECT 
                c.*,
                cust.contactPerson
            FROM tbl_client c
            INNER JOIN tbl_customer cust ON c.client_contactPersonID = cust.client_contactPersonID`);
        return Response.json(rows);

    } catch (error) {
        return Response.json({error: error.message }, {status: 500});
    }
}

// ✅ FIX — create contact person first if not provided
export async function POST(request) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const body = await request.json();
        const { client_name, client_contactNumber, client_email, 
                client_address, TIN_Code, contactPerson } = body;

        // 1. Insert contact person first
        const [personResult] = await connection.query(
            `INSERT INTO tbl_customer (contactPerson) VALUES (?)`,
            [contactPerson]
        );
        const client_contactPersonID = personResult.insertId;

        // 2. Then insert client
        await connection.query(
            `INSERT INTO tbl_client 
             (client_name, client_contactNumber, client_email, client_address, 
              client_contactPersonID, TIN_Code, client_outstandingbalance) 
             VALUES (?, ?, ?, ?, ?, ?, 0)`,
            [client_name, client_contactNumber, client_email, 
             client_address, client_contactPersonID, TIN_Code || null]
        );

        await connection.commit();
        return Response.json({ message: "Client created successfully." });

    } catch (error) {
        await connection.rollback();
        return Response.json({ error: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}