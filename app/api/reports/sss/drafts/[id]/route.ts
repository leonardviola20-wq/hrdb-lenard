import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeSssReports } from "@/lib/sssReportAccess";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const access = await authorizeSssReports(request);
  if (access.error) return access.error;
  const userId = access.session?.id;
  const id = Number((await params).id);
  if (typeof userId !== "number" || !Number.isSafeInteger(userId) || !Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid SSS report draft" }, { status: 400 });
  }
  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || !("action" in payload)) {
    return NextResponse.json({ error: "Invalid SSS report draft action" }, { status: 400 });
  }
  const action = (payload as { action: unknown }).action;
  try {
    if (action === "continue") {
      const claimExpiry = new Date(Date.now() - 60 * 60 * 1000);
      const claimed = await prisma.sssReportDraft.updateMany({
        where: { id, OR: [{ continuedBy: null }, { continuedAt: { lt: claimExpiry } }] },
        data: { continuedBy: userId, continuedAt: new Date() },
      });
      if (claimed.count > 0) return NextResponse.json({ success: true });
      const existing = await prisma.sssReportDraft.findUnique({ where: { id }, select: { continuedBy: true } });
      if (!existing) return NextResponse.json({ error: "SSS report draft not found" }, { status: 404 });
      if (existing.continuedBy === userId) return NextResponse.json({ success: true });
      return NextResponse.json({ error: "Another user is currently continuing this draft" }, { status: 409 });
    }
    if (action === "release") {
      const released = await prisma.sssReportDraft.updateMany({
        where: { id, continuedBy: userId },
        data: { continuedBy: null, continuedAt: null },
      });
      if (released.count > 0) return NextResponse.json({ success: true });
      const existing = await prisma.sssReportDraft.findUnique({ where: { id }, select: { id: true, continuedBy: true } });
      if (!existing || existing.continuedBy === null) return NextResponse.json({ success: true });
      return NextResponse.json({ error: "This draft is being continued by another user" }, { status: 409 });
    }
    return NextResponse.json({ error: "Unknown SSS report draft action" }, { status: 400 });
  } catch (error) {
    console.error("Update SSS report draft continuation error:", error);
    return NextResponse.json({ error: "Unable to update SSS report draft" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const access = await authorizeSssReports(request);
  if (access.error) return access.error;
  const userId = access.session?.id;
  const id = Number((await params).id);
  if (typeof userId !== "number" || !Number.isSafeInteger(userId) || !Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid SSS report draft" }, { status: 400 });
  }
  try {
    const claimExpiry = new Date(Date.now() - 60 * 60 * 1000);
    const deleted = await prisma.sssReportDraft.deleteMany({
      where: { id, OR: [{ continuedBy: null }, { continuedAt: { lt: claimExpiry } }, { continuedBy: userId }] },
    });
    if (deleted.count === 0) return NextResponse.json({ error: "This draft is being continued by another user" }, { status: 409 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete SSS report draft error:", error);
    return NextResponse.json({ error: "Unable to delete SSS report draft" }, { status: 500 });
  }
}
