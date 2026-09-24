import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

async function requireAdmin(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (userId === null) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid contact id" }, { status: 400 });
  }
  const body = await req.json();
  const data: Record<string, string | boolean | null> = {};
  for (const field of ["companyName", "contactName", "category", "phone", "email", "address", "services", "branch", "notes"]) {
    if (body[field] !== undefined) {
      if (body[field] !== null && typeof body[field] !== "string") {
        return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 });
      }
      data[field] = typeof body[field] === "string" ? body[field].trim() || null : null;
    }
  }
  if (typeof body.active === "boolean") data.active = body.active;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No contact changes provided" }, { status: 400 });
  }
  const contact = await prisma.officeContact.update({ where: { id }, data, });
  return NextResponse.json({ contact });
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid contact id" }, { status: 400 });
  }
  await prisma.officeContact.delete({ where: { id } });
  return NextResponse.json({ message: "Contact deleted" });
}
