import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

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
      photoUrl: true,
      assignedBy: true,
      assignedAt: true,
      employer: { select: { id: true, name: true, company: true } },
    },
  });

  return NextResponse.json({ employees });
}

export async function POST(req: NextRequest) {
  const session = getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const requiredFields = ["firstName", "lastName"];
  if (requiredFields.some((field) => typeof body[field] !== "string" || !body[field].trim())) {
    return NextResponse.json(
      { error: "First name and last name are required" },
      { status: 400 }
    );
  }

  const optionalString = (field: string) =>
    typeof body[field] === "string" ? body[field].trim() || null : null;
  const optionalDate = (field: string) => {
    const value = optionalString(field);
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? undefined : date;
  };

  const dateOfBirth = optionalDate("dateOfBirth");
  const dateStarted = optionalDate("dateStarted");
  const status = optionalString("status");
  const endedStatuses = new Set(["Contractual", "Resigned", "Terminated", "AWOL", "Leave"]);
  const endDate = endedStatuses.has(status || "") ? optionalDate("endDate") : null;
  if (dateOfBirth === undefined || dateStarted === undefined || endDate === undefined) {
    return NextResponse.json({ error: "Enter valid dates" }, { status: 400 });
  }

  const ageValue = body.age === "" || body.age === null || body.age === undefined
    ? null
    : Number(body.age);
  if (ageValue !== null && (!Number.isInteger(ageValue) || ageValue < 0 || ageValue > 130)) {
    return NextResponse.json({ error: "Enter a valid age" }, { status: 400 });
  }

  const employerId = body.employerId ? Number(body.employerId) : null;
  if (employerId !== null && !Number.isInteger(employerId)) {
    return NextResponse.json({ error: "Select a valid employer" }, { status: 400 });
  }

  try {
    const employee = await prisma.$transaction(async (tx) => {
      const created = await tx.employee.create({
      data: {
        employeeCode: `PENDING-${crypto.randomUUID()}`,
        firstName: body.firstName.trim(),
        middleName: optionalString("middleName"),
        lastName: body.lastName.trim(),
        dateOfBirth,
        age: ageValue,
        maritalStatus: optionalString("maritalStatus"),
        gender: optionalString("gender"),
        mobileNumber: optionalString("mobileNumber"),
        email: optionalString("email"),
        address: optionalString("address"),
        emergencyName: optionalString("emergencyName"),
        emergencyNumber: optionalString("emergencyNumber"),
        emergencyRelation: optionalString("emergencyRelation"),
        emergencyAddress: optionalString("emergencyAddress"),
        biometricNo: optionalString("biometricNo"),
        employerId,
        status,
        dateStarted,
        endDate,
        sssNumber: optionalString("sssNumber"),
        pagIbigNumber: optionalString("pagIbigNumber"),
        philHealth: optionalString("philHealth"),
        tinNumber: optionalString("tinNumber"),
        remarks: optionalString("remarks"),
        photoUrl: optionalString("photoUrl"),
        branch: optionalString("branch"),
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
