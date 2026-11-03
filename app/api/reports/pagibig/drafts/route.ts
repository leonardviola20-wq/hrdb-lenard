import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { authorizeReports } from "@/lib/sssReportAccess";
import { validPagibigYear } from "@/lib/pagibigYear";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const access = await authorizeReports(request);
  if (access.error) return access.error;
  const userId = access.session?.id;
  const employerId = Number(request.nextUrl.searchParams.get("employerId"));
  if (typeof userId !== "number" || !Number.isSafeInteger(userId) || !Number.isSafeInteger(employerId) || employerId <= 0) {
    return NextResponse.json({ error: "Select an employer to load Pag-IBIG report drafts" }, { status: 400 });
  }
  try {
    const drafts = await prisma.pagibigReportDraft.findMany({
      where: { createdBy: userId, employerId },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ drafts }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Load Pag-IBIG report drafts error:", error);
    return NextResponse.json({ error: "Unable to load Pag-IBIG report drafts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const access = await authorizeReports(request);
  if (access.error) return access.error;
  const userId = access.session?.id;
  if (typeof userId !== "number" || !Number.isSafeInteger(userId)) return NextResponse.json({ error: "Invalid user session" }, { status: 401 });
  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return NextResponse.json({ error: "Invalid Pag-IBIG report draft" }, { status: 400 });
  const body = payload as Record<string, unknown>;
  const id = body.id === undefined || body.id === null ? null : Number(body.id);
  const employerId = Number(body.employerId);
  const month = Number(body.applicableMonth);
  const year = validPagibigYear(body.applicableYear);
  const pin = typeof body.pin === "string" ? body.pin.trim() : "";
  const kind = body.kind === "LOAN" ? "LOAN" : "CONTRIBUTION";
  const manual = body.manual === true;
  if ((id !== null && (!Number.isSafeInteger(id) || id <= 0)) || !Number.isSafeInteger(employerId) || employerId <= 0
    || !Number.isInteger(month) || month < 1 || month > 12 || !year || pin.length > 120) {
    return NextResponse.json({ error: "Enter a valid report period and PIN before saving the draft" }, { status: 400 });
  }
  try {
    const existingReport = await prisma.pagibigReport.findFirst({
      where: { employerId, applicableMonth: month, applicableYear: year, manual, ...(manual ? { kind } : {}) },
      select: { id: true },
    });
    if (existingReport) {
      return NextResponse.json({ error: "A Pag-IBIG report already exists for this month and year" }, { status: 409 });
    }
    // Enforce a single draft per user/employer/month/year...
    // instead of creating a duplicate when no explicit id is supplied.
    let existingDraftId = id;
    if (existingDraftId === null) {
      const existing = await prisma.pagibigReportDraft.findFirst({
        where: { createdBy: userId, employerId, applicableMonth: month, applicableYear: year, kind },
        select: { id: true },
      });
      if (existing) existingDraftId = existing.id;
    }
    const data = { employerId, applicableMonth: month, applicableYear: year, pin, kind, entries: [] as Prisma.InputJsonArray, updatedAt: new Date() };
    const draft = existingDraftId === null
      ? await prisma.pagibigReportDraft.create({ data: { ...data, createdBy: userId } })
      : await prisma.pagibigReportDraft.updateMany({ where: { id: existingDraftId, createdBy: userId }, data }).then(async (result) => result.count ? prisma.pagibigReportDraft.findUnique({ where: { id: existingDraftId } }) : null);
    if (!draft) return NextResponse.json({ error: "Pag-IBIG report draft not found" }, { status: 404 });
    return NextResponse.json({ draft }, { status: id === null && existingDraftId === null ? 201 : 200, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Save Pag-IBIG report draft error:", error);
    return NextResponse.json({ error: "Unable to save Pag-IBIG report draft" }, { status: 500 });
  }
}
