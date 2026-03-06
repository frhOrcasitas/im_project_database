import pool from "../../lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.*,
        cust.contactPerson
      FROM tbl_client c
      LEFT JOIN tbl_customer cust ON c.client_contactPersonID = cust.client_contactPersonID
      ORDER BY c.client_name ASC
    `);
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { client_name, contactPerson, client_contactNumber, client_email, client_address, TIN_Code } = body;

    // 1. Create contact person first
    const [contactResult] = await pool.query(
      "INSERT INTO tbl_customer (contactPerson) VALUES (?)",
      [contactPerson]
    );
    const newContactID = contactResult.insertId;

    // 2. Create client with that contact ID
    const [result] = await pool.query(
      `INSERT INTO tbl_client 
       (client_name, client_contactNumber, client_email, client_address, client_contactPersonID, TIN_Code, client_outstandingbalance) 
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [client_name, client_contactNumber, client_email, client_address, newContactID, TIN_Code]
    );

    return Response.json({ id: result.insertId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { client_ID, name, contact, phone, email, address, tin } = body;

    // 1. Get existing contact ID
    const [client] = await pool.query(
      "SELECT client_contactPersonID FROM tbl_client WHERE client_ID = ?",
      [client_ID]
    );
    const contactID = client[0].client_contactPersonID;

    // 2. Update contact person name
    await pool.query(
      "UPDATE tbl_customer SET contactPerson = ? WHERE client_contactPersonID = ?",
      [contact, contactID]
    );

    // 3. Update client details
    await pool.query(
      `UPDATE tbl_client 
       SET client_name=?, client_contactNumber=?, client_email=?, client_address=?, TIN_Code=? 
       WHERE client_ID=?`,
      [name, phone, email, address, tin, client_ID]
    );

    return Response.json({ message: "Updated" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}