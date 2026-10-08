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
      include: {
        employer: { select: { id: true, name: true, company: true } },
        officeContacts: {
          where: { active: true },
          orderBy: [{ companyName: "asc" }, { contactName: "asc" }],
          select: { id: true, companyName: true, contactName: true, category: true, phone: true, email: true, address: true, services: true, branch: true },
        },
      },
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

  const payload: unknown = await req.json().catch(() => null);
  const parsed = validateEmployeePayload(payload);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { employerId, ...fields } = parsed.data;
  const rawDateOfBirth = payload && typeof payload === "object" && !Array.isArray(payload)
    ? (payload as Record<string, unknown>).dateOfBirth
    : undefined;
  const dateOfBirth = typeof rawDateOfBirth === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDateOfBirth)
    ? new Date(`${rawDateOfBirth}T00:00:00.000Z`)
    : fields.dateOfBirth;

  try {
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...fields,
        dateOfBirth,
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
