import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeSssReports } from "@/lib/sssReportAccess";
import { parseSssLoanDateOnly } from "@/lib/sssLoanBalance";
import { normalizeSssLoanStatus } from "@/lib/sssLoanStatus";
import { isSssLoanType } from "@/lib/sssLoanTypes";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

function parseMoneyCents(value: unknown) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 999_999_999.99) return null;
  return Math.round(amount * 100);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const access = await authorizeSssReports(request);
  if (access.error) return access.error;
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid SSS loan id" }, { status: 400 });
  }
  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid SSS loan status" }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;
  const normalizedStatus = normalizeSssLoanStatus(body.status, body.reason);
  if (!normalizedStatus) return NextResponse.json({ error: "Choose a valid loan status and matching reason" }, { status: 400 });

  try {
    const loan = await prisma.sssLoan.update({
      where: { id },
      data: {
        status: normalizedStatus.status,
        statusReason: normalizedStatus.reason,
      },
    });
    return NextResponse.json({ loan }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "SSS loan not found" }, { status: 404 });
    }
    console.error("Update SSS loan status error:", error);
    return NextResponse.json({ error: "Unable to update SSS loan status" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const access = await authorizeSssReports(request);
  if (access.error) return access.error;
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid SSS loan id" }, { status: 400 });
  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid SSS loan details" }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const loanAccountNumber = typeof body.loanAccountNumber === "string" ? body.loanAccountNumber.trim() : "";
  const loanAccountNumberKey = loanAccountNumber.toUpperCase();
  const transactionNumber = typeof body.transactionNumber === "string" ? body.transactionNumber.trim() : "";
  const loanType = body.loanType;
  const loanDate = parseSssLoanDateOnly(body.loanDate);
  const hasLoanAmount = body.loanAmount !== undefined && body.loanAmount !== null && body.loanAmount !== "";
  const loanAmountCents = hasLoanAmount ? parseMoneyCents(body.loanAmount) : null;
  const monthlyAmortizationCents = parseMoneyCents(body.monthlyAmortization);
  const normalizedStatus = normalizeSssLoanStatus(body.status, body.reason);
  if (!loanAccountNumber || loanAccountNumber.length > 80
    || transactionNumber.length > 80
    || (body.transactionNumber !== undefined && body.transactionNumber !== null && typeof body.transactionNumber !== "string")
    || !isSssLoanType(loanType)
    || !loanDate
    || (hasLoanAmount && loanAmountCents === null)
    || monthlyAmortizationCents === null
    || !normalizedStatus) {
    return NextResponse.json({ error: "Complete the required loan details with valid values" }, { status: 400 });
  }

  try {
    const loan = await prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`WITH loan_account_lock AS MATERIALIZED (SELECT pg_advisory_xact_lock(hashtext(${loanAccountNumberKey})::bigint)) SELECT TRUE FROM loan_account_lock`;
      const duplicate = await transaction.sssLoan.findFirst({
        where: {
          loanAccountNumber: { equals: loanAccountNumber, mode: "insensitive" },
          id: { not: id },
        },
        select: { id: true },
      });
      if (duplicate) return null;
      return transaction.sssLoan.update({
        where: { id },
        data: {
          loanAccountNumber,
          transactionNumber: transactionNumber || null,
          loanType,
          loanDate,
          loanAmount: loanAmountCents === null ? null : (loanAmountCents / 100).toFixed(2),
          monthlyAmortization: (monthlyAmortizationCents / 100).toFixed(2),
          status: normalizedStatus.status,
          statusReason: normalizedStatus.reason,
        },
        include: { employer: { select: { name: true } } },
      });
    });
    if (!loan) return NextResponse.json({ error: "This Loan Account Number already exists" }, { status: 409 });
    return NextResponse.json({ loan }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "SSS loan not found" }, { status: 404 });
    }
    console.error("Update SSS loan error:", error);
    return NextResponse.json({ error: "Unable to update SSS loan" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const access = await authorizeSssReports(request);
  if (access.error) return access.error;
  if (access.session?.role !== "ADMIN" && access.session?.role !== "SUPER_USER") {
    return NextResponse.json({ error: "Admin or super-user access is required to delete SSS loans" }, { status: 403 });
  }

  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid SSS loan id" }, { status: 400 });
  try {
    await prisma.sssLoan.delete({ where: { id } });
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "SSS loan not found" }, { status: 404 });
    }
    console.error("Delete SSS loan error:", error);
    return NextResponse.json({ error: "Unable to delete SSS loan" }, { status: 500 });
  }
}
