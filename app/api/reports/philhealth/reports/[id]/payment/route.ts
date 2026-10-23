import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { authorizeReports } from "@/lib/sssReportAccess";
import { parsePhilHealthMoneyCents } from "@/lib/philHealthReportTotals";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };
const dateFromInput = (value: unknown, optional = false) => {
  if (optional && (value === "" || value === null || value === undefined)) return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? undefined : date;
};
const optionalText = (value: unknown, maxLength: number) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.trim().length > maxLength) return undefined;
  return value.trim() || null;
};

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const access = await authorizeReports(request);
  if (access.error) return access.error;
  const id = Number((await params).id);
  const employerId = Number(request.nextUrl.searchParams.get("employerId"));
  const payload: unknown = await request.json().catch(() => null);
  if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(employerId) || employerId <= 0
    || !payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid PhilHealth payment request" }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;
  const payorName = optionalText(body.payorName, 160);
  const pen = optionalText(body.pen, 80);
  const spa = optionalText(body.spa, 120);
  const applicablePeriod = optionalText(body.applicablePeriod, 80);
  const amountCents = parsePhilHealthMoneyCents(body.amountPaid);
  const transactionDate = dateFromInput(body.transactionDate);
  const accreditedCollectingAgent = optionalText(body.accreditedCollectingAgent, 160);
  const transactionConfirmationNumber = optionalText(body.transactionConfirmationNumber, 120);
  const eparNumber = optionalText(body.eparNumber, 120);
  const eparDate = dateFromInput(body.eparDate, true);
  if (!payorName || pen === undefined || !pen || spa === undefined || !applicablePeriod || amountCents === null || amountCents <= 0
    || !transactionDate || accreditedCollectingAgent === undefined || transactionConfirmationNumber === undefined
    || eparNumber === undefined || eparDate === undefined) {
    return NextResponse.json({ error: "Enter a valid payor, PEN, applicable period, amount paid, and transaction date" }, { status: 400 });
  }

  try {
    const report = await prisma.philHealthReport.findFirst({ where: { id, employerId }, select: { id: true } });
    if (!report) return NextResponse.json({ error: "PhilHealth report not found for the selected employer" }, { status: 404 });
    const existingPayment = await prisma.philHealthPayment.findUnique({ where: { reportId: id }, select: { id: true } });
    if (existingPayment && access.session?.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access is required to edit recorded payment details" }, { status: 403 });
    }
    const payment = await prisma.philHealthPayment.upsert({
      where: { reportId: id },
      create: {
        reportId: id,
        payorName,
        pen,
        spa,
        applicablePeriod,
        amountPaid: new Prisma.Decimal((amountCents / 100).toFixed(2)),
        accreditedCollectingAgent,
        transactionConfirmationNumber,
        transactionDate,
        eparNumber,
        eparDate,
      },
      update: {
        payorName,
        pen,
        spa,
        applicablePeriod,
        amountPaid: new Prisma.Decimal((amountCents / 100).toFixed(2)),
        accreditedCollectingAgent,
        transactionConfirmationNumber,
        transactionDate,
        eparNumber,
        eparDate,
      },
    });
    return NextResponse.json({
      payment: {
        ...payment,
        transactionDate: payment.transactionDate.toISOString().slice(0, 10),
        eparDate: payment.eparDate?.toISOString().slice(0, 10) ?? null,
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Save PhilHealth payment error:", error);
    return NextResponse.json({ error: "Unable to save PhilHealth payment details" }, { status: 500 });
  }
}
