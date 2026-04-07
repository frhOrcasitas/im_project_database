import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ user: null });
    }

    const userData = JSON.parse(sessionCookie.value);
    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error("Session parse error:", error);
    return NextResponse.json({ user: null });
  }
}