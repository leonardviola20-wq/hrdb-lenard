import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeReports } from "@/lib/sssReportAccess";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const access = await authorizeReports(request);
  if (access.error) return access.error;
  const id = Number((await params).id);
  const employerId = Number(request.nextUrl.searchParams.get("employerId"));
  const payload: unknown = await request.json().catch(() => null);
  if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(employerId) || employerId <= 0
    || !payload || typeof payload !== "object" || Array.isArray(payload)
    || typeof (payload as Record<string, unknown>).active !== "boolean") {
    return NextResponse.json({ error: "Enter a valid employer and account status" }, { status: 400 });
  }
  try {
    const updated = await prisma.philHealthEmployeeRecord.updateMany({
      where: { id, employerId },
      data: { active: (payload as { active: boolean }).active },
    });
    if (!updated.count) return NextResponse.json({ error: "PhilHealth account not found for the selected employer" }, { status: 404 });
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Update PhilHealth employee account error:", error);
    return NextResponse.json({ error: "Unable to update PhilHealth employee account" }, { status: 500 });
  }
}
