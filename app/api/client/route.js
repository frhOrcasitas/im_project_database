import pool from "../../lib/db";

// GET all clients
export async function GET() {
    try {
        const [rows] = await pool.query(`
            SELECT 
                c.*, 
                p.contactPerson 
            FROM tbl_client c
            LEFT JOIN tbl_customer p ON c.client_contactPersonID = p.client_contactPersonID
            ORDER BY c.client_name ASC
        `);
        return Response.json(rows);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// POST new client
export async function POST(req) {
    try {
        const body = await req.json();
        const { name, contact, phone, email, address, tin } = body;

        // 1. Create the contact person first
        const [contactResult] = await pool.query(
            "INSERT INTO tbl_customer (contactPerson) VALUES (?)",
            [contact]
        );
        const newContactID = contactResult.insertId;

        // 2. Use that ID for the client
        const [result] = await pool.query(
            `INSERT INTO tbl_client (client_name, client_contactNumber, client_email, client_address, client_contactPersonID, TIN_Code, client_outstandingbalance) 
             VALUES (?, ?, ?, ?, ?, ?, 0)`,
            [name, phone, email, address, newContactID, tin]
        );

        return Response.json({ id: result.insertId });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// PUT update client
export async function PUT(req) {
    try {
        const body = await req.json();
        const { client_ID, name, contact, phone, email, address, tin } = body;

        // 1. Get the contact ID first
        const [client] = await pool.query("SELECT client_contactPersonID FROM tbl_client WHERE client_ID = ?", [client_ID]);
        const contactID = client[0].client_contactPersonID;

        // 2. Update the name in tbl_customer
        await pool.query("UPDATE tbl_customer SET contactPerson = ? WHERE client_contactPersonID = ?", [contact, contactID]);

        // 3. Update the rest in tbl_client
        await pool.query(
            `UPDATE tbl_client SET client_name=?, client_contactNumber=?, client_email=?, client_address=?, TIN_Code=? WHERE client_ID=?`,
            [name, phone, email, address, tin, client_ID]
        );

        return Response.json({ message: "Updated" });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}