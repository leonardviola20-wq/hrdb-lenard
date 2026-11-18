import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { authorizeReports } from "@/lib/sssReportAccess";
import { getSssContributionAnalyticsPrisma } from "@/lib/sssContributionAnalyticsPrisma";
import { prisma } from "@/lib/prisma";

type ProviderAggregate = {
  paid: Prisma.Decimal;
  reportCount: number;
};

type ProviderYearComparison = {
  previousYear: ProviderAggregate;
  currentYear: ProviderAggregate;
};

type MonthlyAggregate = {
  month: number;
  providers: {
    sss: ProviderYearComparison;
    pagibig: ProviderYearComparison;
    philhealth: ProviderYearComparison;
  };
};

const providerKeys = ["sss", "pagibig", "philhealth"] as const;
const emptyAggregate = (): ProviderAggregate => ({ paid: new Prisma.Decimal(0), reportCount: 0 });
const emptyYearComparison = (): ProviderYearComparison => ({
  previousYear: emptyAggregate(),
  currentYear: emptyAggregate(),
});

function getApplicablePeriodWhere(previousYear: number, currentYear: number, currentMonth: number) {
  return {
    OR: [
      { applicableYear: previousYear },
      { applicableYear: currentYear, applicableMonth: { lte: currentMonth } },
    ],
  };
}

export async function GET(request: NextRequest) {
  const access = await authorizeReports(request);
  if (access.error) return access.error;

  const dateParts = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  const currentYear = Number(dateParts.find((part) => part.type === "year")?.value);
  const currentMonth = Number(dateParts.find((part) => part.type === "month")?.value);
  const previousYear = currentYear - 1;
  const periodWhere = getApplicablePeriodWhere(previousYear, currentYear, currentMonth);

  try {
    const [sssGroups, pagibigGroups, philhealthGroups] = await Promise.all([
      getSssContributionAnalyticsPrisma().sssReport.groupBy({
        by: ["applicableYear", "applicableMonth"],
        where: {
          ...periodWhere,
          kind: "CONTRIBUTION",
          amountPaid: { not: null },
          payDate: { not: null },
        },
        _sum: { amountPaid: true },
        _count: { _all: true },
      }),
      prisma.pagibigReport.groupBy({
        by: ["applicableYear", "applicableMonth"],
        where: {
          ...periodWhere,
          kind: "CONTRIBUTION",
          amountPaid: { not: null },
          payDate: { not: null },
        },
        _sum: { amountPaid: true },
        _count: { _all: true },
      }),
      prisma.$queryRaw<Array<{
        applicableYear: number;
        applicableMonth: number;
        paid: Prisma.Decimal;
        reportCount: number;
      }>>(Prisma.sql`
        SELECT report."applicableYear", report."applicableMonth",
          SUM(payment."amountPaid") AS "paid",
          COUNT(*)::int AS "reportCount"
        FROM "PhilHealthReport" AS report
        INNER JOIN "PhilHealthPayment" AS payment ON payment."reportId" = report."id"
        WHERE report."applicableYear" = ${previousYear}
          OR (report."applicableYear" = ${currentYear} AND report."applicableMonth" <= ${currentMonth})
        GROUP BY report."applicableYear", report."applicableMonth"
      `),
    ]);

    const monthMap = new Map<number, MonthlyAggregate>();
    for (let month = 1; month <= 12; month += 1) {
      monthMap.set(month, {
        month,
        providers: {
          sss: emptyYearComparison(),
          pagibig: emptyYearComparison(),
          philhealth: emptyYearComparison(),
        },
      });
    }

    const assignYearAggregate = (
      comparison: ProviderYearComparison,
      applicableYear: number,
      aggregate: ProviderAggregate,
    ) => {
      if (applicableYear === previousYear) comparison.previousYear = aggregate;
      if (applicableYear === currentYear) comparison.currentYear = aggregate;
    };

    for (const group of sssGroups) {
      const month = monthMap.get(group.applicableMonth);
      if (month) {
        assignYearAggregate(month.providers.sss, group.applicableYear, {
          paid: group._sum.amountPaid ?? new Prisma.Decimal(0),
          reportCount: group._count._all,
        });
      }
    }
    for (const group of pagibigGroups) {
      const month = monthMap.get(group.applicableMonth);
      if (month) {
        assignYearAggregate(month.providers.pagibig, group.applicableYear, {
          paid: group._sum.amountPaid ?? new Prisma.Decimal(0),
          reportCount: group._count._all,
        });
      }
    }
    for (const group of philhealthGroups) {
      const month = monthMap.get(group.applicableMonth);
      if (month) {
        assignYearAggregate(month.providers.philhealth, group.applicableYear, {
          paid: group.paid,
          reportCount: group.reportCount,
        });
      }
    }

    const months = [...monthMap.values()];
    const totals = {
      sss: emptyYearComparison(),
      pagibig: emptyYearComparison(),
      philhealth: emptyYearComparison(),
    };
    for (const month of months) {
      for (const provider of providerKeys) {
        totals[provider].previousYear.paid = totals[provider].previousYear.paid.plus(month.providers[provider].previousYear.paid);
        totals[provider].previousYear.reportCount += month.providers[provider].previousYear.reportCount;
        totals[provider].currentYear.paid = totals[provider].currentYear.paid.plus(month.providers[provider].currentYear.paid);
        totals[provider].currentYear.reportCount += month.providers[provider].currentYear.reportCount;
      }
    }

    const serializeAggregate = (aggregate: ProviderAggregate) => ({
      paid: aggregate.paid.toFixed(2),
      reportCount: aggregate.reportCount,
    });
    const serializeYearComparison = (comparison: ProviderYearComparison) => ({
      previousYear: serializeAggregate(comparison.previousYear),
      currentYear: serializeAggregate(comparison.currentYear),
    });

    return NextResponse.json({
      previousYear,
      currentYear,
      currentMonth,
      months: months.map((month) => ({
        month: month.month,
        providers: {
          sss: serializeYearComparison(month.providers.sss),
          pagibig: serializeYearComparison(month.providers.pagibig),
          philhealth: serializeYearComparison(month.providers.philhealth),
        },
      })),
      totals: {
        sss: serializeYearComparison(totals.sss),
        pagibig: serializeYearComparison(totals.pagibig),
        philhealth: serializeYearComparison(totals.philhealth),
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Load contribution analytics error:", error);
    return NextResponse.json({ error: "Unable to load contribution analytics" }, { status: 500 });
  }
}
