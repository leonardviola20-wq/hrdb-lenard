import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { DEFAULT_PAGE_ACCESS, hasPageAccess, isPageAccessHref, PAGE_ACCESS_OPTIONS } from "@/lib/pageAccess";

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
        accessiblePages?: unknown;
      };
      const isAdmin = session.role === "ADMIN";
      if (!isAdmin && !Array.isArray(session.accessiblePages)) {
        // Legacy or malformed token without an explicit page list: force a fresh sign-in.
        return NextResponse.redirect(new URL("/login", req.url));
      }
      const accessiblePages = Array.isArray(session.accessiblePages)
        ? session.accessiblePages.filter(isPageAccessHref)
        : DEFAULT_PAGE_ACCESS;

      if (!isAdmin && !hasPageAccess(pathname, accessiblePages)) {
        const fallback = PAGE_ACCESS_OPTIONS.find((page) => accessiblePages.includes(page.href))?.href || "/login";
        return NextResponse.redirect(new URL(fallback, req.url));
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
