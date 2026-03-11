import pool from "../../../lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // We use the existing pool to stay consistent with your other routes
    // Querying tbl_employee as per your logic
    const [rows] = await pool.execute(
      `SELECT 
        employee_ID, 
        employee_name, 
        employee_role 
      FROM tbl_employee 
      WHERE employee_email = ? 
        AND employee_contactNo = ? 
        AND employee_status = "Active"`,
      [username, password]
    );

    if (rows.length > 0) {
      const user = rows[0];
      return NextResponse.json({
        success: true,
        user: {
          id: user.employee_ID,
          name: user.employee_name,
          role: user.employee_role
        }
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid credentials or inactive account." },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}