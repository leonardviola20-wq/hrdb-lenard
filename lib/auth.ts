import type { NextRequest } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";

type Session = JwtPayload & { id?: number };

export function getAuthenticatedSession(req: NextRequest): Session | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as Session;
  } catch {
    return null;
  }
}

export function getAuthenticatedUserId(req: NextRequest): number | null {
  const session = getAuthenticatedSession(req);
  return typeof session?.id === "number" ? session.id : null;
}
