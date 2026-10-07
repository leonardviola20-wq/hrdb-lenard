import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { validateEmployeePayload } from "@/lib/employeePayload";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    const user = await prisma.user.findUnique({ where: { id: session.id }, select: { accessiblePages: true } });
    if (!user?.accessiblePages.includes("/employees")) return NextResponse.json({ error: "Employees access required" }, { status: 403 });
  }
  try {
    const employees = await prisma.employee.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
      id: true,
      employeeCode: true,
      firstName: true,
      middleName: true,
      lastName: true,
      dateOfBirth: true,
      age: true,
      maritalStatus: true,
      gender: true,
      address: true,
      emergencyName: true,
      emergencyNumber: true,
      emergencyRelation: true,
      emergencyAddress: true,
      biometricNo: true,
      dateStarted: true,
      endDate: true,
      sssNumber: true,
      pagIbigNumber: true,
      philHealth: true,
      tinNumber: true,
      remarks: true,
      status: true,
      email: true,
      mobileNumber: true,
      branch: true,
      position: true,
      photoUrl: true,
      assignedBy: true,
      assignedAt: true,
      employer: { select: { id: true, name: true, company: true } },
      },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error("Load employees error:", error);
    const details = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({
      error: process.env.NODE_ENV === "development" ? details : "Unable to load employees",
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    const user = await prisma.user.findUnique({ where: { id: session.id }, select: { accessiblePages: true } });
    if (!user?.accessiblePages.includes("/employees")) return NextResponse.json({ error: "Employees access required" }, { status: 403 });
  }
  const parsed = validateEmployeePayload(await req.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { employerId, ...fields } = parsed.data;

  try {
    const employee = await prisma.$transaction(async (tx) => {
      const created = await tx.employee.create({
        data: {
          employeeCode: `PENDING-${crypto.randomUUID()}`,
          ...fields,
          employerId,
          assignedBy: String(session.id ?? session.email ?? "ADMIN"),
          assignedAt: new Date(),
        },
      });
      return tx.employee.update({
        where: { id: created.id },
        data: { employeeCode: `EMP-${String(created.id).padStart(5, "0")}` },
        include: { employer: { select: { name: true, company: true } } },
      });
    });
    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    console.error("Create employee error:", error);
    return NextResponse.json({ error: "Unable to create employee" }, { status: 500 });
  }
}
