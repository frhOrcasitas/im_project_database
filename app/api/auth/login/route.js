import { supabase } from "../../../lib/db"; // Import your new client
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required." }, { status: 400 });
    }

    // 1. Query Supabase using your exact schema column names
    const { data: user, error } = await supabase
      .from("tbl_employee")
      .select("employee_id, employee_name, username, password_hash, system_role, employee_status")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      console.error("Supabase query error:", error);
      throw error;
    }

    // 2. Check if user exists
    if (!user) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    // 3. Password Verification (Bcrypt)
    // We try to compare the hashed password first.
    // Fallback: If your migration is fresh and you have plain text passwords, 
    // we also check for a direct match.
    const isMatch = await bcrypt.compare(password, user.password_hash);
    const isPlainTextMatch = password === user.password_hash;

    if (!isMatch && !isPlainTextMatch) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    // 4. Check status
    if (user.employee_status !== "Active") {
      return NextResponse.json({ error: "Account is inactive." }, { status: 403 });
    }

    // 5. Session Logic
    const session = {
      employee_ID: user.employee_id,
      username: user.username,
      name: user.employee_name,
      role: user.system_role,
    };

    const cookieStore = await cookies();
    cookieStore.set("session", JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    return NextResponse.json({ 
        success: true, 
        role: user.system_role, 
        name: user.employee_name 
    });

  } catch (error) {
    console.error("Login error: ", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}