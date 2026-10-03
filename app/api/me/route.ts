import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (userId === null) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, name: true, email: true, role: true, accessiblePages: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Load profile error:", error);
    return NextResponse.json({ error: "Unable to load profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (userId === null) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "A display name is required" }, { status: 400 });
  }

  const requestedName = (body as { name?: unknown }).name;
  if (typeof requestedName !== "string") {
    return NextResponse.json({ error: "A display name is required" }, { status: 400 });
  }

  const name = requestedName.trim();
  if (!name || name.length > 80) {
    return NextResponse.json({ error: "Display name must be between 1 and 80 characters" }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name },
      select: { username: true, name: true, email: true, role: true, accessiblePages: true },
    });
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Unable to update profile" }, { status: 500 });
  }
}
