import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeReports } from "@/lib/sssReportAccess";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const access = await authorizeReports(request);
  if (access.error) return access.error;
  const id = Number((await params).id);
  const employerIdParam = request.nextUrl.searchParams.get("employerId");
  const employerId = employerIdParam ? Number(employerIdParam) : null;
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid loan id" }, { status: 400 });
  if (employerIdParam && (!Number.isSafeInteger(employerId as number) || (employerId as number) <= 0)) return NextResponse.json({ error: "Invalid employer" }, { status: 400 });
  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid loan update" }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;
  const status = typeof body.status === "string" ? body.status.trim().toUpperCase() : undefined;
  if (status !== undefined && status !== "ACTIVE" && status !== "INACTIVE") {
    return NextResponse.json({ error: "Status must be ACTIVE or INACTIVE" }, { status: 400 });
  }
  const applicationNo = body.applicationNo !== undefined ? String(body.applicationNo).trim() : undefined;
  const loanTermDateText = body.loanTermDate !== undefined ? String(body.loanTermDate).trim() : undefined;
  const termYears = body.termYears !== undefined ? Number(body.termYears) : undefined;
  const amount = body.amount !== undefined ? Number(body.amount) : undefined;
  const certifyingEmployer = body.certifyingEmployer !== undefined ? (body.certifyingEmployer === null ? null : String(body.certifyingEmployer).trim() || null) : undefined;

  if (applicationNo !== undefined && (applicationNo.length === 0 || applicationNo.length > 120)) {
    return NextResponse.json({ error: "Application number is required" }, { status: 400 });
  }
  let loanTermDate: Date | undefined;
  if (loanTermDateText !== undefined) {
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(loanTermDateText) ? new Date(`${loanTermDateText}T00:00:00.000Z`) : null;
    if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== loanTermDateText) {
      return NextResponse.json({ error: "Invalid loan term date" }, { status: 400 });
    }
    loanTermDate = parsed;
  }
  if (termYears !== undefined && (!Number.isInteger(termYears) || termYears < 1 || termYears > 50)) {
    return NextResponse.json({ error: "Term years must be 1-50" }, { status: 400 });
  }
  if (amount !== undefined && (!Number.isFinite(amount) || amount < 0 || amount > 999999999.99)) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  try {
    const existing = await prisma.pagibigEmployeeLoan.findFirst({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Loan not found for the selected employer" }, { status: 404 });
    const data: Record<string, unknown> = { updatedAt: new Date() };
    if (status !== undefined) data.status = status;
    if (applicationNo !== undefined) data.applicationNo = applicationNo;
    if (loanTermDate !== undefined) {
      data.loanTermDate = loanTermDate;
      const ty = termYears !== undefined ? termYears : existing.termYears;
      const end = new Date(loanTermDate);
      end.setUTCFullYear(end.getUTCFullYear() + ty);
      data.termEndDate = end;
    }
    if (termYears !== undefined) data.termYears = termYears;
    if (amount !== undefined) data.amount = amount;
    if (certifyingEmployer !== undefined) data.certifyingEmployer = certifyingEmployer;
    const updated = await prisma.pagibigEmployeeLoan.update({ where: { id }, data });
    return NextResponse.json({ loan: { id: updated.id, status: updated.status } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Update Pag-IBIG loan error:", error);
    return NextResponse.json({ error: "Unable to update Pag-IBIG loan" }, { status: 500 });
  }
}
