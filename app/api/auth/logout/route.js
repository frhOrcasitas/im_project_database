import { cookies } from "next/headers";

export async function GET() {
  try {
    const session = cookies().get("session")?.value;
    if (!session) return Response.json({ user: null });
    return Response.json({ user: JSON.parse(session) });
  } catch {
    return Response.json({ user: null });
  }
}