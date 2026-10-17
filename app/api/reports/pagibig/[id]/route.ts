import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { serializePagibigReport } from "@/lib/pagibigReportSerialization";
import { authorizeReports } from "@/lib/sssReportAccess";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };
const paymentTypes = ["Cash", "Check", "Bank", "GCash", "Others"];

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const access = await authorizeReports(request);
  if (access.error) return access.error;
  const id = Number((await params).id);
  const employerId = Number(request.nextUrl.searchParams.get("employerId"));
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid Pag-IBIG report id" }, { status: 400 });
  if (!Number.isSafeInteger(employerId) || employerId <= 0) return NextResponse.json({ error: "Select an employer to update Pag-IBIG payment details" }, { status: 400 });

  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid payment details" }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;
  const amount = Number(body.amountPaid);
  const paymentType = typeof body.paymentType === "string" ? body.paymentType : "";
  const payDateText = typeof body.payDate === "string" ? body.payDate : "";
  const transactionReference = typeof body.transactionReference === "string" ? body.transactionReference.trim() : "";
  const payDate = /^\d{4}-\d{2}-\d{2}$/.test(payDateText) ? new Date(`${payDateText}T00:00:00.000Z`) : null;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 999_999_999.99
    || !paymentTypes.includes(paymentType) || !payDate || Number.isNaN(payDate.getTime())
    || payDate.toISOString().slice(0, 10) !== payDateText
    || !transactionReference || transactionReference.length > 120) {
    return NextResponse.json({ error: "Enter a valid amount, payment type, pay date, and transaction reference" }, { status: 400 });
  }

  try {
    const data = {
      amountPaid: new Prisma.Decimal(amount.toFixed(2)),
      paymentType,
      payDate,
      transactionReference,
    };
    let report;
    if (access.session?.role === "ADMIN") {
      const result = await prisma.pagibigReport.updateMany({
        where: { id, employerId },
        data,
      });
      if (result.count === 0) return NextResponse.json({ error: "Pag-IBIG report not found for the selected employer" }, { status: 404 });
      report = await prisma.pagibigReport.findUniqueOrThrow({ where: { id }, include: { PagibigReportEntry: { orderBy: { employeeName: "asc" } } } });
    } else {
      const result = await prisma.pagibigReport.updateMany({ where: { id, employerId, amountPaid: null }, data });
      if (result.count === 0) {
        const exists = await prisma.pagibigReport.findFirst({ where: { id, employerId }, select: { id: true } });
        return NextResponse.json(
          { error: exists ? "Admin access is required to edit recorded payment details" : "Pag-IBIG report not found" },
          { status: exists ? 403 : 404 },
        );
      }
      report = await prisma.pagibigReport.findUniqueOrThrow({ where: { id }, include: { PagibigReportEntry: { orderBy: { employeeName: "asc" } } } });
    }
    return NextResponse.json({ report: serializePagibigReport(report) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Pag-IBIG report not found" }, { status: 404 });
    }
    console.error("Update Pag-IBIG payment error:", error);
    return NextResponse.json({ error: "Unable to record Pag-IBIG payment" }, { status: 500 });
  }
}
