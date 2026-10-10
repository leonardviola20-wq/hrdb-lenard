import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeSssReports } from "@/lib/sssReportAccess";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const access = await authorizeSssReports(request);
  if (access.error) return access.error;

  const includeAllEmployees = request.nextUrl.searchParams.get("all") === "true";
  const query = request.nextUrl.searchParams.get("ssNumber")?.trim() ?? "";
  const digits = query.replace(/\D/g, "");
  if (!includeAllEmployees && digits.length < 2) return NextResponse.json({ employees: [] }, { headers: { "Cache-Control": "private, no-store" } });

  const formattedDigits = digits.length <= 2
    ? digits
    : `${digits.slice(0, 2)}-${digits.slice(2, 9)}${digits.length > 9 ? `-${digits.slice(9, 10)}` : ""}`;
  const patterns = [...new Set([query, formattedDigits])].filter(Boolean);

  try {
    const employees = await prisma.employee.findMany({
      where: includeAllEmployees
        ? undefined
        : { OR: patterns.map((pattern) => ({ sssNumber: { contains: pattern, mode: "insensitive" as const } })) },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: includeAllEmployees ? undefined : 25,
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        middleName: true,
        lastName: true,
        sssNumber: true,
        biometricNo: true,
        status: true,
        employerId: true,
        employer: { select: { name: true } },
      },
    });
    return NextResponse.json({
      employees: employees.map(({ employer, ...employee }) => ({ ...employee, employerName: employer?.name ?? null })),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error(includeAllEmployees ? "Load all SSS report employees error:" : "Search SSS report employees error:", error);
    return NextResponse.json({ error: includeAllEmployees ? "Unable to load employees for SSS loans" : "Unable to search employees by SS Number" }, { status: 500 });
  }
}
