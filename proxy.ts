import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

// Named export works
export function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const pathname = req.nextUrl.pathname;
  const isPublicRoute =
    pathname === "/" || pathname === "/login" || pathname === "/register";
  const isNextAsset =
    pathname.startsWith("/_next/") || pathname === "/favicon.ico";

  if (!isPublicRoute && !isNextAsset && !pathname.startsWith("/api/")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
      const session = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload & {
        role?: string;
      };
      const isAdmin = session.role === "ADMIN";
      const isAllowedUserRoute =
        pathname === "/dashboard" ||
        pathname.startsWith("/tasks") ||
        pathname === "/settings";

      if (!isAdmin && !isAllowedUserRoute) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

// OR you can do default export
// export default function proxy(req: NextRequest) { ... }
