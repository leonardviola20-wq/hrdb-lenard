import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

const activeEmployeeStatuses = ["Regular", "Contractual", "Trainee", "Leave"];

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
  const data: Record<string, string | number | boolean | null> = {};
  for (const field of ["companyName", "contactName", "category", "phone", "email", "address", "services", "branch", "notes"]) {
    if (body[field] !== undefined) {
      if (body[field] !== null && typeof body[field] !== "string") {
        return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 });
      }
      data[field] = typeof body[field] === "string" ? body[field].trim() || null : null;
    }
  }
  if (typeof body.active === "boolean") data.active = body.active;
  if (body.employeeId !== undefined) {
    if (body.employeeId !== null && (!Number.isInteger(body.employeeId) || body.employeeId < 1)) {
      return NextResponse.json({ error: "Choose a valid employee" }, { status: 400 });
    }
    if (typeof body.employeeId === "number") {
      const employee = await prisma.employee.findUnique({ where: { id: body.employeeId }, select: { id: true } });
      if (!employee) return NextResponse.json({ error: "Selected employee was not found" }, { status: 400 });
    }
    data.employeeId = body.employeeId;
  }
  const current = await prisma.officeContact.findUnique({ where: { id }, select: { category: true, employeeId: true } });
  if (!current) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  const nextCategory = typeof data.category === "string" ? data.category : current.category;
  const nextEmployeeId = data.employeeId === undefined ? current.employeeId : data.employeeId;
  if (nextCategory === "Employee Contact" && nextEmployeeId === null) {
    return NextResponse.json({ error: "Choose the employee this contact belongs to" }, { status: 400 });
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No contact changes provided" }, { status: 400 });
  }
  const contactForEmployeeValidation = await prisma.officeContact.findUnique({
    where: { id },
    select: { category: true, employeeId: true },
  });
  if (!contactForEmployeeValidation) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }
  const nextCategory = typeof data.category === "string" ? data.category : contactForEmployeeValidation.category;
  const nextEmployeeId = typeof data.employeeId === "number" || data.employeeId === null
    ? data.employeeId
    : contactForEmployeeValidation.employeeId;
  if (nextCategory === "Employee Contact") {
    const linkedEmployee = nextEmployeeId !== null
      ? await prisma.employee.findUnique({ where: { id: nextEmployeeId }, select: { status: true } })
      : null;
    if (!linkedEmployee || !activeEmployeeStatuses.includes(linkedEmployee.status || "")) {
      return NextResponse.json({ error: "Only active employees can be added as employee contacts" }, { status: 400 });
    }
  }

  const contact = await prisma.officeContact.update({
    where: { id },
    data,
    include: { employee: { select: { id: true, firstName: true, lastName: true } } },
  });
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
