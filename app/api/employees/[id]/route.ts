import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = getAuthenticatedSession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid employee id" }, { status: 400 });

  const body = await req.json();
  if (typeof body.firstName !== "string" || !body.firstName.trim() || typeof body.lastName !== "string" || !body.lastName.trim()) {
    return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });
  }

  const text = (field: string) => typeof body[field] === "string" ? body[field].trim() || null : null;
  const date = (field: string) => {
    const value = text(field);
    if (!value) return null;
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };
  const status = text("status");
  const endedStatuses = new Set(["Contractual", "Resigned", "Terminated", "AWOL", "Leave"]);
  const employerId = body.employerId === "" || body.employerId === null || body.employerId === undefined
    ? null
    : Number(body.employerId);
  if (employerId !== null && !Number.isInteger(employerId)) {
    return NextResponse.json({ error: "Select a valid employer" }, { status: 400 });
  }
  const dateOfBirth = date("dateOfBirth");
  const dateStarted = date("dateStarted");
  const endDate = endedStatuses.has(status || "") ? date("endDate") : null;
  if (dateOfBirth === undefined || dateStarted === undefined || endDate === undefined) {
    return NextResponse.json({ error: "Enter valid dates" }, { status: 400 });
  }
  const age = body.age === "" || body.age === null || body.age === undefined ? null : Number(body.age);
  if (age !== null && (!Number.isInteger(age) || age < 0 || age > 130)) {
    return NextResponse.json({ error: "Enter a valid age" }, { status: 400 });
  }

  try {
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        firstName: body.firstName.trim(),
        middleName: text("middleName"),
        lastName: body.lastName.trim(),
        dateOfBirth,
        age,
        maritalStatus: text("maritalStatus"),
        gender: text("gender"),
        mobileNumber: text("mobileNumber"),
        email: text("email"),
        address: text("address"),
        emergencyName: text("emergencyName"),
        emergencyNumber: text("emergencyNumber"),
        emergencyRelation: text("emergencyRelation"),
        emergencyAddress: text("emergencyAddress"),
        biometricNo: text("biometricNo"),
        branch: text("branch"),
        photoUrl: text("photoUrl"),
        employerId,
        status,
        dateStarted,
        endDate,
        sssNumber: text("sssNumber"),
        pagIbigNumber: text("pagIbigNumber"),
        philHealth: text("philHealth"),
        tinNumber: text("tinNumber"),
        remarks: text("remarks"),
      },
      include: { employer: { select: { id: true, name: true, company: true } } },
    });
    return NextResponse.json({ employee });
  } catch (error) {
    console.error("Update employee error:", error);
    return NextResponse.json({ error: "Unable to update employee" }, { status: 500 });
  }
}
