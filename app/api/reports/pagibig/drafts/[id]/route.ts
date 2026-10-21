import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeReports } from "@/lib/sssReportAccess";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const access = await authorizeReports(request);
  if (access.error) return access.error;
  const userId = access.session?.id;
  const id = Number((await params).id);
  if (!Number.isSafeInteger(userId) || !Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid Pag-IBIG report draft" }, { status: 400 });
  try {
    const deleted = await prisma.pagibigReportDraft.deleteMany({ where: { id, createdBy: userId } });
    if (!deleted.count) return NextResponse.json({ error: "Pag-IBIG report draft not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Pag-IBIG report draft error:", error);
    return NextResponse.json({ error: "Unable to delete Pag-IBIG report draft" }, { status: 500 });
  }
}
