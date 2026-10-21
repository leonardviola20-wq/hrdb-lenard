import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeReports } from "@/lib/sssReportAccess";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const access = await authorizeReports(request);
  if (access.error) return access.error;

  const allEmployees = request.nextUrl.searchParams.get("all") === "1";
  const employerId = Number(request.nextUrl.searchParams.get("employerId"));
  if (!Number.isSafeInteger(employerId) || employerId <= 0) {
    return NextResponse.json({ error: "Select an employer to load PhilHealth accounts" }, { status: 400 });
  }

  try {
    const [employer, employees] = await Promise.all([
      prisma.employer.findUnique({
        where: { id: employerId },
        select: { id: true, name: true, phic: true },
      }),
      prisma.employee.findMany({
        where: allEmployees ? undefined : {
          OR: [
            { employerId },
            { philHealthEmployeeRecords: { some: { employerId } } },
          ],
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { employeeCode: "asc" }],
        select: {
          id: true,
          employerId: true,
          employeeCode: true,
          biometricNo: true,
          firstName: true,
          middleName: true,
          lastName: true,
          status: true,
          philHealth: true,
          employer: { select: { name: true } },
          ...(allEmployees ? {} : {
            philHealthEmployeeRecords: {
              where: { employerId },
              select: { id: true, active: true },
            },
          }),
        },
      }),
    ]);

    if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    if (allEmployees) {
      return NextResponse.json({
        employer: { id: employer.id, name: employer.name, phic: employer.phic },
        employees: employees
          .map(({ employer: currentEmployer, ...employee }) => ({
            ...employee,
            employerName: currentEmployer?.name ?? null,
            assignedToSelectedEmployer: employee.employerId === employerId,
          }))
          .sort((first, second) => Number(second.assignedToSelectedEmployer) - Number(first.assignedToSelectedEmployer)
            || first.lastName.localeCompare(second.lastName)
            || first.firstName.localeCompare(second.firstName)
            || first.employeeCode.localeCompare(second.employeeCode)),
      }, { headers: { "Cache-Control": "private, no-store" } });
    }

    return NextResponse.json({
      employer,
      employees: employees.map(({ employer: currentEmployer, philHealthEmployeeRecords, ...employee }) => ({
        ...employee,
        employerName: currentEmployer?.name ?? null,
        philHealthAccount: philHealthEmployeeRecords[0] ?? null,
      })),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2021") {
      return NextResponse.json({ error: "PhilHealth account storage is not set up yet. Apply the pending PhilHealth database migration, then try again." }, { status: 503 });
    }
    console.error("Load PhilHealth employee accounts error:", error);
    return NextResponse.json({ error: "Unable to load PhilHealth employee accounts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const access = await authorizeReports(request);
  if (access.error) return access.error;
  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid PhilHealth account" }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;
  const employerId = Number(body.employerId);
  const employeeId = Number(body.employeeId);
  if (!Number.isSafeInteger(employerId) || employerId <= 0 || !Number.isSafeInteger(employeeId) || employeeId <= 0) {
    return NextResponse.json({ error: "Select a valid employer and employee" }, { status: 400 });
  }

  try {
    const [employer, employee] = await Promise.all([
      prisma.employer.findUnique({ where: { id: employerId }, select: { id: true } }),
      prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true } }),
    ]);
    if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    const record = await prisma.philHealthEmployeeRecord.upsert({
      where: { employeeId_employerId: { employeeId, employerId } },
      create: { employeeId, employerId, active: true },
      update: { active: true },
    });
    return NextResponse.json({ account: record }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2021") {
      return NextResponse.json({ error: "PhilHealth account storage is not set up yet. Apply the pending PhilHealth database migration, then try again." }, { status: 503 });
    }
    console.error("Save PhilHealth employee account error:", error);
    return NextResponse.json({ error: "Unable to save PhilHealth employee account" }, { status: 500 });
  }
}
