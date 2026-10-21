import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { authorizeReports } from "@/lib/sssReportAccess";
import { prisma } from "@/lib/prisma";

const validYear = (value: unknown) => {
  const year = Number(value);
  return Number.isInteger(year) && year >= 2020 && year <= 2200 ? year : null;
};

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
      where: { createdBy: userId, employerId, kind: "CONTRIBUTION" },
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
  const year = validYear(body.applicableYear);
  const pin = typeof body.pin === "string" ? body.pin.trim() : "";
  if ((id !== null && (!Number.isSafeInteger(id) || id <= 0)) || !Number.isSafeInteger(employerId) || employerId <= 0
    || !Number.isInteger(month) || month < 1 || month > 12 || !year || pin.length > 120) {
    return NextResponse.json({ error: "Enter a valid report period and PIN before saving the draft" }, { status: 400 });
  }
  try {
    const data = { employerId, applicableMonth: month, applicableYear: year, pin, kind: "CONTRIBUTION", entries: [] as Prisma.InputJsonArray, updatedAt: new Date() };
    const draft = id === null
      ? await prisma.pagibigReportDraft.create({ data: { ...data, createdBy: userId } })
      : await prisma.pagibigReportDraft.updateMany({ where: { id, createdBy: userId }, data }).then(async (result) => result.count ? prisma.pagibigReportDraft.findUnique({ where: { id } }) : null);
    if (!draft) return NextResponse.json({ error: "Pag-IBIG report draft not found" }, { status: 404 });
    return NextResponse.json({ draft }, { status: id === null ? 201 : 200, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Save Pag-IBIG report draft error:", error);
    return NextResponse.json({ error: "Unable to save Pag-IBIG report draft" }, { status: 500 });
  }
}
