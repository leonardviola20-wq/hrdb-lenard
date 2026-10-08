import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { getAssignedByLabel, parseAssignedByUserId } from "@/lib/assignedBy";
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
        supervisor: { select: { id: true, firstName: true, middleName: true, lastName: true } },
        requirements: { select: { requirementKey: true, isComplete: true } },
        officeContacts: {
          where: { active: true },
          orderBy: [{ companyName: "asc" }, { contactName: "asc" }],
          select: { id: true, companyName: true, contactName: true, category: true, phone: true, email: true, address: true, services: true, branch: true },
        },
      },
    });
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    const assignedByUserId = parseAssignedByUserId(employee.assignedBy);
    const assignedByUser = assignedByUserId === null
      ? null
      : await prisma.user.findUnique({
        where: { id: assignedByUserId },
        select: { id: true, name: true, username: true, email: true },
      });
    const usersById = new Map(
      assignedByUser ? [[assignedByUser.id, assignedByUser] as const] : [],
    );
    const responseEmployee = {
      ...employee,
      assignedBy: getAssignedByLabel(employee.assignedBy, usersById),
    };
    if (req.nextUrl.searchParams.get("includeNavigation") === "false") {
      return NextResponse.json({ employee: responseEmployee }, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    const employeeRecords = await prisma.employee.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        status: true,
        branch: true,
        employerId: true,
        employer: { select: { name: true } },
      },
    });
    const orderedRecords = employeeRecords.sort((left, right) => {
      const leftName = [left.firstName, left.middleName, left.lastName].filter(Boolean).join(" ");
      const rightName = [right.firstName, right.middleName, right.lastName].filter(Boolean).join(" ");
      return leftName.localeCompare(rightName, undefined, { numeric: true, sensitivity: "base" });
    });
    const employeeIndex = orderedRecords.findIndex((record) => record.id === employee.id);
    const previousEmployeeId = employeeIndex > 0 ? orderedRecords[employeeIndex - 1].id : null;
    const nextEmployeeId = employeeIndex >= 0 && employeeIndex < orderedRecords.length - 1
      ? orderedRecords[employeeIndex + 1].id
      : null;
    return NextResponse.json({
      employee: responseEmployee,
      previousEmployeeId,
      nextEmployeeId,
      navigationEmployees: orderedRecords.map((record) => ({
        id: record.id,
        firstName: record.firstName,
        middleName: record.middleName,
        lastName: record.lastName,
        status: record.status,
        branch: record.branch,
        employerId: record.employerId,
        employerName: record.employer?.name ?? null,
      })),
    }, {
      headers: { "Cache-Control": "private, no-store" },
    });
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
    if (fields.supervisorId !== null) {
      if (fields.supervisorId === id) {
        return NextResponse.json({ error: "An employee cannot be their own supervisor" }, { status: 400 });
      }
      const supervisor = await prisma.employee.findUnique({
        where: { id: fields.supervisorId },
        select: { position: true },
      });
      if (supervisor?.position !== "Store In-charge") {
        return NextResponse.json({ error: "Select an employee with the Store In-charge position as supervisor" }, { status: 400 });
      }
    }
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...fields,
        dateOfBirth,
        employerId,
      },
      include: {
        employer: { select: { id: true, name: true, company: true } },
        supervisor: { select: { id: true, firstName: true, middleName: true, lastName: true } },
      },
    });
    return NextResponse.json({ employee });
  } catch (error) {
    console.error("Update employee error:", error);
    return NextResponse.json({ error: "Unable to update employee" }, { status: 500 });
  }
}
