import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeSssReports } from "@/lib/sssReportAccess";
import { parseSssLoanDateOnly } from "@/lib/sssLoanBalance";
import { isSssLoanType } from "@/lib/sssLoanTypes";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };
type LoanStatus = "ACTIVE" | "PAID" | "NOT_CONNECTED";
type LoanStatusReason = "APPLIED_FOR_NEW_LOAN" | "FULLY_PAID" | "RESIGNED";

function parseMoneyCents(value: unknown) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 999_999_999.99) return null;
  return Math.round(amount * 100);
}

function normalizeStatus(status: unknown, reason: unknown): { status: LoanStatus; reason: LoanStatusReason | null } | null {
  if (status === "ACTIVE" && (reason === null || reason === undefined || reason === "")) {
    return { status, reason: null };
  }
  if (status === "PAID" && (reason === "APPLIED_FOR_NEW_LOAN" || reason === "FULLY_PAID")) {
    return { status, reason };
  }
  if (status === "NOT_CONNECTED" && (reason === "RESIGNED" || reason === undefined || reason === null || reason === "")) {
    return { status, reason: "RESIGNED" };
  }
  return null;
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
  const normalizedStatus = normalizeStatus(body.status, body.reason);
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
  const transactionNumber = typeof body.transactionNumber === "string" ? body.transactionNumber.trim() : "";
  const loanType = body.loanType;
  const loanDate = parseSssLoanDateOnly(body.loanDate);
  const hasLoanAmount = body.loanAmount !== undefined && body.loanAmount !== null && body.loanAmount !== "";
  const loanAmountCents = hasLoanAmount ? parseMoneyCents(body.loanAmount) : null;
  const monthlyAmortizationCents = parseMoneyCents(body.monthlyAmortization);
  const normalizedStatus = normalizeStatus(body.status, body.reason);
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
    const loan = await prisma.sssLoan.update({
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
