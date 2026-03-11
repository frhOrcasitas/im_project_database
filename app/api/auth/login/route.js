import pool from "../../../lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    if (!username || !password)
      return Response.json({ error: "Username and password required." }, { status: 400 });

    const [[user]] = await pool.query(
      `SELECT employee_ID, employee_name, username, password_hash, system_role, employee_status
       FROM tbl_employee
       WHERE username = ? AND system_role IS NOT NULL`,
      [username]
    );

    if (!user || user.password_hash !== password)
      return Response.json({ error: "Invalid username or password." }, { status: 401 });

    if (user.employee_status !== "Active")
      return Response.json({ error: "Account is inactive." }, { status: 403 });

    const session = {
      employee_ID: user.employee_ID,
      username:    user.username,
      name:        user.employee_name,
      role:        user.system_role,
    };

    const cookieStore = await cookies();
    cookieStore.set("session", JSON.stringify(session), {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 8,
      path:     "/",
    });

    return Response.json({ success: true, role: user.system_role, name: user.employee_name });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}