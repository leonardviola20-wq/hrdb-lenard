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
      status: true,
      email: true,
      mobileNumber: true,
      branch: true,
      employer: { select: { name: true, company: true } },
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
  const requiredFields = ["employeeCode", "firstName", "lastName"];
  if (requiredFields.some((field) => typeof body[field] !== "string" || !body[field].trim())) {
    return NextResponse.json(
      { error: "Employee code, first name, and last name are required" },
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
  const endDate = optionalDate("endDate");
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
    const employee = await prisma.employee.create({
      data: {
        employeeCode: body.employeeCode.trim(),
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
        status: optionalString("status"),
        dateStarted,
        endDate,
        sssNumber: optionalString("sssNumber"),
        pagIbigNumber: optionalString("pagIbigNumber"),
        philHealth: optionalString("philHealth"),
        tinNumber: optionalString("tinNumber"),
        remarks: optionalString("remarks"),
      },
      include: { employer: { select: { name: true, company: true } } },
    });
    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    console.error("Create employee error:", error);
    return NextResponse.json({ error: "Unable to create employee" }, { status: 500 });
  }
}
