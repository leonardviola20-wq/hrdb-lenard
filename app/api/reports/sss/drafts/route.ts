import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { authorizeSssReports } from "@/lib/sssReportAccess";
import { getSssContributionBracket } from "@/lib/sssContributionTable";
import { prisma } from "@/lib/prisma";

function employeeName(employee: { firstName: string; middleName: string | null; lastName: string }) {
  const middleInitial = employee.middleName?.trim().charAt(0);
  return `${employee.lastName}, ${employee.firstName}${middleInitial ? ` ${middleInitial.toLocaleUpperCase()}.` : ""}`;
}

export async function GET(request: NextRequest) {
  const access = await authorizeSssReports(request);
  if (access.error) return access.error;
  const userId = access.session?.id;
  if (typeof userId !== "number" || !Number.isSafeInteger(userId)) return NextResponse.json({ error: "Invalid user session" }, { status: 401 });
  try {
    const claimExpiry = new Date(Date.now() - 60 * 60 * 1000);
    const drafts = await prisma.sssReportDraft.findMany({
      where: { OR: [{ continuedBy: null }, { continuedAt: { lt: claimExpiry } }, { continuedBy: userId }] },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ drafts }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Load SSS report drafts error:", error);
    return NextResponse.json({ error: "Unable to load SSS report drafts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const access = await authorizeSssReports(request);
  if (access.error) return access.error;
  const userId = access.session?.id;
  if (typeof userId !== "number" || !Number.isSafeInteger(userId)) return NextResponse.json({ error: "Invalid user session" }, { status: 401 });

  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return NextResponse.json({ error: "Invalid SSS report draft" }, { status: 400 });
  const body = payload as Record<string, unknown>;
  const kind = body.kind === "CONTRIBUTION" || body.kind === "LOAN" ? body.kind : null;
  const draftId = body.id === undefined || body.id === null ? null : Number(body.id);
  const employerId = body.employerId === undefined || body.employerId === null || body.employerId === "" ? null : Number(body.employerId);
  const month = Number(body.applicableMonth);
  const year = Number(body.applicableYear);
  const prn = typeof body.prn === "string" ? body.prn.trim().slice(0, 80) : "";
  const amountDue = typeof body.amountDue === "string" ? body.amountDue.slice(0, 32) : "";
  const rawEntries = Array.isArray(body.entries) ? body.entries : [];
  const release = body.release === true;

  if (!kind || (draftId !== null && (!Number.isSafeInteger(draftId) || draftId <= 0))
    || (employerId !== null && (!Number.isSafeInteger(employerId) || employerId <= 0))
    || !Number.isInteger(month) || month < 1 || month > 12
    || !Number.isInteger(year) || year < 2025 || year > 2200
    || prn.length > 80 || rawEntries.length > 3000) {
    return NextResponse.json({ error: "Invalid SSS report draft details" }, { status: 400 });
  }

  const parsedEntries = rawEntries.map((entry) => entry && typeof entry === "object" ? entry as Record<string, unknown> : {});
  const employeeIds = parsedEntries.map((entry) => Number(entry.employeeId));
  const uniqueEmployeeIds = [...new Set(employeeIds)];
  const loanIds = parsedEntries.map((entry) => entry.sssLoanId === undefined || entry.sssLoanId === null ? null : Number(entry.sssLoanId));
  const hasAccountRows = kind === "LOAN" && loanIds.some((id) => id !== null);
  if (employeeIds.some((id) => !Number.isSafeInteger(id) || id <= 0)
    || (kind === "CONTRIBUTION" && new Set(employeeIds).size !== employeeIds.length)
    || (kind === "LOAN" && (hasAccountRows
      ? loanIds.some((id) => !Number.isSafeInteger(id) || (id as number) <= 0) || new Set(loanIds).size !== loanIds.length
      : new Set(employeeIds).size !== employeeIds.length))) {
    return NextResponse.json({ error: "Draft entries must reference valid unique employees or loan accounts" }, { status: 400 });
  }
  if (employeeIds.length > 0 && !employerId) return NextResponse.json({ error: "Select an employer before saving employee entries" }, { status: 400 });

  try {
    const [employees, loans] = await Promise.all([
      employeeIds.length
        ? prisma.employee.findMany({
        where: { id: { in: uniqueEmployeeIds } },
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          middleName: true,
          lastName: true,
          sssNumber: true,
          employerId: true,
          employer: { select: { name: true } },
        },
      })
        : Promise.resolve([]),
      hasAccountRows
        ? prisma.sssLoan.findMany({
          where: { id: { in: loanIds as number[] } },
          select: { id: true, employeeId: true, employerId: true, loanAccountNumber: true },
        })
        : Promise.resolve([]),
    ]);
    if (employees.length !== uniqueEmployeeIds.length) return NextResponse.json({ error: "Each draft employee must still exist" }, { status: 400 });
    if (hasAccountRows && loans.length !== loanIds.length) return NextResponse.json({ error: "Each draft loan account must still exist" }, { status: 400 });
    const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
    const loanById = new Map(loans.map((loan) => [loan.id, loan]));
    const normalizedEntries = parsedEntries.map((entry, index) => {
      const employee = employeeById.get(employeeIds[index])!;
      const selectedMsc = Number(entry.monthlySalaryCredit);
      const monthlySalaryCredit = kind === "CONTRIBUTION" && Number.isFinite(selectedMsc) && getSssContributionBracket(selectedMsc)
        ? selectedMsc
        : null;
      const loanAmount = typeof entry.loanAmount === "string" && /^[\d.]{0,32}$/.test(entry.loanAmount) ? entry.loanAmount : "";
      const sssLoanId = loanIds[index];
      const loan = sssLoanId === null ? null : loanById.get(sssLoanId);
      if (loan && (loan.employeeId !== employee.id || (employerId !== null && loan.employerId !== employerId))) {
        throw new Error("Draft loan account must belong to the selected employee and employer");
      }
      return {
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        employeeName: employeeName(employee),
        employeeSssNumber: employee.sssNumber,
        employeeEmployerId: employee.employerId,
        employeeEmployerName: employee.employer?.name ?? null,
        sssLoanId: loan?.id ?? null,
        loanAccountNumber: loan?.loanAccountNumber ?? (typeof entry.loanAccountNumber === "string" ? entry.loanAccountNumber : null),
        monthlySalaryCredit,
        loanAmount: kind === "LOAN" ? loanAmount : "",
      };
    });
    const data = {
      kind,
      employerId,
      prn,
      applicableMonth: month,
      applicableYear: year,
      amountDue,
      entries: normalizedEntries as Prisma.InputJsonArray,
    };
    const continuation = release
      ? { continuedBy: null, continuedAt: null }
      : { continuedBy: userId, continuedAt: new Date() };
    const draft = draftId === null
      ? await prisma.sssReportDraft.create({ data: { ...data, ...continuation, createdBy: userId } })
      : await prisma.sssReportDraft.updateMany({
        where: { id: draftId, continuedBy: userId },
        data: { ...data, ...continuation },
      }).then(async (result) => {
        if (result.count === 0) return null;
        return prisma.sssReportDraft.findUnique({ where: { id: draftId } });
      });
    if (!draft) return NextResponse.json({ error: "SSS report draft not found" }, { status: 404 });
    return NextResponse.json({ draft }, { status: draftId === null ? 201 : 200, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Draft loan account")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Save SSS report draft error:", error);
    return NextResponse.json({ error: "Unable to save SSS report draft" }, { status: 500 });
  }
}
