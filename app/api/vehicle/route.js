import pool from "../../lib/db";

export async function GET() {
    try {
        const [rows] = await pool.query("SELECT * FROM tbl_vehicle");
        return Response.json(rows);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { vehicle_plateNumber, vehicle_model, vehicle_status } = await request.json();
        await pool.query(
            `INSERT INTO tbl_vehicle (vehicle_plateNumber, vehicle_model, vehicle_status) VALUES (?, ?, ?)`,
            [vehicle_plateNumber, vehicle_model, vehicle_status || 'Available']
        );
        return Response.json({ message: "Vehicle added successfully" });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}