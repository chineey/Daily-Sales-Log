import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname.startsWith("/login");
  const sessionToken = req.cookies.get("session")?.value;
  const isValid = await verifySession(sessionToken);

  if (isLoginPage) {
    if (isValid) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (!isValid) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next|favicon.ico).*)"] };
