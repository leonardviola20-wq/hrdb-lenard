import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSssLoansPrisma } from "@/lib/sssReportPrisma";
import type { LoanExposure } from "@/components/loans/LoanExposureCards";

export async function GET(request: NextRequest) {
  const session = getAuthenticatedSession(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [sssLoans, pagibigLoans] = await Promise.all([
    getSssLoansPrisma().loan.aggregate({
      where: { status: { in: ["ACTIVE", "INACTIVE"] } },
      _sum: { outstandingBalance: true, monthlyAmortization: true },
      _count: { _all: true },
    }),
    prisma.loan.aggregate({
      where: { provider: "PAGIBIG", status: { in: ["ACTIVE", "INACTIVE"] } },
      _sum: { outstandingBalance: true, monthlyAmortization: true },
      _count: { _all: true },
    }),
  ]);

  const exposure: LoanExposure = {
    sssOutstanding: Number(sssLoans._sum.outstandingBalance ?? 0),
    pagibigOutstanding: Number(pagibigLoans._sum.outstandingBalance ?? 0),
    monthlyProjection: Number(sssLoans._sum.monthlyAmortization ?? 0) + Number(pagibigLoans._sum.monthlyAmortization ?? 0),
    sssMonthly: Number(sssLoans._sum.monthlyAmortization ?? 0),
    pagibigMonthly: Number(pagibigLoans._sum.monthlyAmortization ?? 0),
    activeLoanCount: sssLoans._count._all + pagibigLoans._count._all,
  };

  return NextResponse.json({ exposure }, { headers: { "Cache-Control": "no-store" } });
}
