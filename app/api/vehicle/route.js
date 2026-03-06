import pool from "../../lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM tbl_vehicle ORDER BY vehicle_number ASC");
    return Response.json(rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { vehicle_ID, vehicle_number, vehicle_model, vehicle_description } = await request.json();
    await pool.query(
      `INSERT INTO tbl_vehicle (vehicle_ID, vehicle_number, vehicle_model, vehicle_description) 
       VALUES (?, ?, ?, ?)`,
      [vehicle_ID, vehicle_number, vehicle_model || null, vehicle_description || null]
    );
    return Response.json({ message: "Vehicle added successfully." }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { vehicle_ID, vehicle_number, vehicle_model, vehicle_description } = await request.json();
    await pool.query(
      `UPDATE tbl_vehicle SET vehicle_number=?, vehicle_model=?, vehicle_description=? WHERE vehicle_ID=?`,
      [vehicle_number, vehicle_model || null, vehicle_description || null, vehicle_ID]
    );
    return Response.json({ message: "Vehicle updated." });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { vehicle_ID } = await request.json();
    await pool.query("DELETE FROM tbl_vehicle WHERE vehicle_ID = ?", [vehicle_ID]);
    return Response.json({ message: "Vehicle deleted." });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}