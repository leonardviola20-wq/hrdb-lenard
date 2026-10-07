import type { NextRequest } from "next/server";
import jwt, { type JwtPayload } from "jsonwebtoken";

export type Session = JwtPayload & {
  id?: number;
  email?: string;
  username?: string | null;
  role?: string;
  accessiblePages?: string[];
};

/**
 * Verifies the auth cookie and returns the decoded session, or null when the
 * token is missing, malformed or expired.
 */
export function getAuthenticatedSession(req: NextRequest): Session | null {
  const token: string | undefined = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    return typeof payload === "string" ? null : (payload as Session);
  } catch {
    return null;
  }
}

/**
 * Convenience wrapper returning only the authenticated user id, or null when
 * the request carries no valid numeric subject.
 */
export function getAuthenticatedUserId(req: NextRequest): number | null {
  const session: Session | null = getAuthenticatedSession(req);
  return typeof session?.id === "number" ? session.id : null;
}
