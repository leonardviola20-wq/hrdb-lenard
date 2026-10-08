import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

const activeEmployeeStatuses = ["Regular", "Contractual", "Trainee", "Leave"];

async function isAdmin(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (userId === null) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

async function canViewContacts(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (userId === null) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, accessiblePages: true },
  });
  return user?.role === "ADMIN" || Boolean(user?.accessiblePages.includes("/contacts"));
}

async function canViewEmployeeContacts(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (userId === null) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, accessiblePages: true },
  });
  return user?.role === "ADMIN" || Boolean(user?.accessiblePages.includes("/employees"));
}

export async function GET(req: NextRequest) {
  if (!(await canViewContacts(req))) {
    return NextResponse.json({ error: "Contacts access required" }, { status: 403 });
  }
  try {
    const officeContacts = await prisma.officeContact.findMany({
      where: { active: true, category: { not: "Employee Contact" } },
      orderBy: [{ companyName: "asc" }, { contactName: "asc" }],
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
    });

    let employeeContacts: {
      id: number;
      employeeId: number;
      employee: { id: number; firstName: string; lastName: string };
      companyName: string;
      contactName: string;
      category: string;
      phone: string | null;
      email: string | null;
      address: string | null;
      services: string | null;
      branch: string | null;
    }[] = [];
    if (await canViewEmployeeContacts(req)) {
      const activeEmployees = await prisma.employee.findMany({
        where: { status: { in: ["Regular", "Contractual", "Trainee", "Leave"] } },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          mobileNumber: true,
          photoUrl: true,
          email: true,
          address: true,
          branch: true,
          position: true,
          employer: { select: { name: true, company: true } },
        },
      });
      employeeContacts = activeEmployees.map((employee) => ({
        id: -employee.id,
        employeeId: employee.id,
        employee: { id: employee.id, firstName: employee.firstName, lastName: employee.lastName },
        companyName: employee.employer?.name || "Internal Team",
        contactName: [employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(" "),
        category: "Employee Contact",
        phone: employee.mobileNumber,
        photoUrl: employee.photoUrl,
        email: employee.email,
        address: employee.address,
        services: employee.position,
        branch: employee.branch,
      }));
    }

    return NextResponse.json({ contacts: [...officeContacts, ...employeeContacts] });
  } catch (error) {
    console.error("Load contacts error:", error);
    return NextResponse.json({ error: "Unable to load contacts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const body = await req.json();
  const companyName = typeof body.companyName === "string" ? body.companyName.trim() : "";
  const contactName = typeof body.contactName === "string" ? body.contactName.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  if (!companyName || !contactName || !category) {
    return NextResponse.json({ error: "Company, contact, and category are required" }, { status: 400 });
  }
  if (companyName.length > 120 || contactName.length > 120 || category.length > 60) {
    return NextResponse.json({ error: "Contact details are too long" }, { status: 400 });
  }
  if (body.employeeId !== undefined && body.employeeId !== null && (!Number.isInteger(body.employeeId) || body.employeeId < 1)) {
    return NextResponse.json({ error: "Choose a valid employee" }, { status: 400 });
  }
  const employeeId = typeof body.employeeId === "number" ? body.employeeId : null;
    if (category === "Employee Contact") {
      return NextResponse.json(
        { error: "Employee contacts are generated automatically from active employee records." },
        { status: 400 },
      );
    }

    if (category === "Employee Contact" && employeeId === null) {
    return NextResponse.json({ error: "Choose the employee this contact belongs to" }, { status: 400 });
  }
  if (employeeId !== null) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true } });
    if (!employee) return NextResponse.json({ error: "Selected employee was not found" }, { status: 400 });
  }
  if (category === "Employee Contact") {
    const linkedEmployee = employeeId !== null
      ? await prisma.employee.findUnique({ where: { id: employeeId }, select: { status: true } })
      : null;
    if (!linkedEmployee || !activeEmployeeStatuses.includes(linkedEmployee.status || "")) {
      return NextResponse.json({ error: "Only active employees can be added as employee contacts" }, { status: 400 });
    }
  }

  const contact = await prisma.officeContact.create({
    data: {
      employeeId,
      companyName,
      contactName,
      category,
      phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
      email: typeof body.email === "string" ? body.email.trim() || null : null,
      address: typeof body.address === "string" ? body.address.trim() || null : null,
      services: typeof body.services === "string" ? body.services.trim() || null : null,
      branch: typeof body.branch === "string" ? body.branch.trim() || null : null,
      notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
    },
    include: { employee: { select: { id: true, firstName: true, lastName: true } } },
  });
  return NextResponse.json({ contact }, { status: 201 });
}
