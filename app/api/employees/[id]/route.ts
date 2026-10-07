import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { validateEmployeePayload } from "@/lib/employeePayload";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = getAuthenticatedSession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "ADMIN") {
    const user = await prisma.user.findUnique({ where: { id: session.id }, select: { accessiblePages: true } });
    if (!user?.accessiblePages.includes("/employees")) return NextResponse.json({ error: "Employees access required" }, { status: 403 });
  }
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid employee id" }, { status: 400 });

  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { employer: { select: { id: true, name: true, company: true } } },
    });
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    return NextResponse.json({ employee });
  } catch (error) {
    console.error("Load employee error:", error);
    return NextResponse.json({ error: "Unable to load employee" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = getAuthenticatedSession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "ADMIN") {
    const user = await prisma.user.findUnique({ where: { id: session.id }, select: { accessiblePages: true } });
    if (!user?.accessiblePages.includes("/employees")) return NextResponse.json({ error: "Employees access required" }, { status: 403 });
  }
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid employee id" }, { status: 400 });

  const parsed = validateEmployeePayload(await req.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { employerId, ...fields } = parsed.data;

  try {
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...fields,
        employerId,
      },
      include: { employer: { select: { id: true, name: true, company: true } } },
    });
    return NextResponse.json({ employee });
  } catch (error) {
    console.error("Update employee error:", error);
    return NextResponse.json({ error: "Unable to update employee" }, { status: 500 });
  }
}
