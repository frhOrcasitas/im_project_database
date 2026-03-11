import { NextResponse } from "next/server";

const ROLE_ACCESS = {
  Owner:    ["/dashboard", "/sales", "/orders", "/inventory", "/reports", "/customers", "/payments", "/receivables", "/employees"],
  Manager:  ["/dashboard", "/sales", "/orders", "/inventory", "/reports", "/customers", "/payments", "/receivables"],
  Employee: ["/dashboard", "/sales"],
};

export function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/login") || pathname.startsWith("/api") || pathname === "/") {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get("session")?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    const session = JSON.parse(sessionCookie);
    const allowed = ROLE_ACCESS[session.role] || [];
    const hasAccess = allowed.some(path => pathname.startsWith(path));
    if (!hasAccess) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};