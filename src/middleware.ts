import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page through
  if (pathname === "/console") return NextResponse.next();

  // Check for api_key cookie
  const apiKey = request.cookies.get("api_key")?.value;

  if (!apiKey) {
    return NextResponse.redirect(new URL("/console", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};