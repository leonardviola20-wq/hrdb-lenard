import type { NextRequest } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";

type Session = JwtPayload & { id?: number };

export function getAuthenticatedUserId(req: NextRequest): number | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const session = jwt.verify(token, process.env.JWT_SECRET!) as Session;
    return typeof session.id === "number" ? session.id : null;
  } catch {
    return null;
  }
}
