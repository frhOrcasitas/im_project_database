import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Delete the session cookie by setting its expiry to the past
    cookieStore.set("session", "", { 
      path: "/", 
      expires: new Date(0),
      httpOnly: true 
    });

    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    
    if (res.ok) {
      // Clear local state if you have any, then redirect
      router.push("/login");
      router.refresh(); // Forces Next.js to clear the cache
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
    >
      Logout
    </button>
  );
}

export async function GET() {
  const cookieStore = await cookies(); // Use await here
  const session = cookieStore.get("session")?.value;
  // ... rest of your code
}