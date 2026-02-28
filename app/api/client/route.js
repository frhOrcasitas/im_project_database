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
        const { client_name, client_contactNumber, client_email, client_address, TIN_Code, contactPerson } = await request.json();

        // 1. Create the Contact Person in tbl_customer first
        const [personResult] = await connection.query(
            `INSERT INTO tbl_customer (contactPerson) VALUES (?)`,
            [contactPerson]
        );
        const contactPersonID = personResult.insertId;

        // 2. Create the Client (Rule #6: Balance monitoring starts at 0)
        await connection.query(
            `INSERT INTO tbl_client (client_name, client_contactNumber, client_email, client_address, 
             client_contactPersonID, TIN_Code, client_outstandingbalance) 
             VALUES (?, ?, ?, ?, ?, ?, 0)`,
            [client_name, client_contactNumber, client_email, client_address, contactPersonID, TIN_Code || null]
        );

        await connection.commit();
        return Response.json({ message: "Client and Contact Person successfully linked." });
    } catch (error) {
        await connection.rollback();
        return Response.json({ error: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}