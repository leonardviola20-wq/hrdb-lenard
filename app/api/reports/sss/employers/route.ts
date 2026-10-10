import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeSssReports } from "@/lib/sssReportAccess";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const access = await authorizeSssReports(request);
  if (access.error) return access.error;

  try {
    const employers = await prisma.employer.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        shortAddress: true,
        longAddress: true,
        sss: true,
        employees: {
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          select: { id: true, employeeCode: true, firstName: true, middleName: true, lastName: true, sssNumber: true, biometricNo: true, status: true },
        },
      },
    });
    return NextResponse.json({ employers }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Load SSS report employers error:", error);
    return NextResponse.json({ error: "Unable to load employers for SSS reports" }, { status: 500 });
  }
}
