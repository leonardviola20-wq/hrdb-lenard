import { PrismaClient as SssReportsPrismaClient } from "@/prisma/generated/sss-reports";
import { PrismaClient as SssLoansPrismaClient } from "@/prisma/generated/sss-loans";
import { getSssReportDatabaseUrl } from "@/lib/sssReportDatabaseUrl";

type GlobalSssPrisma = typeof globalThis & {
  sssContributionsPrisma?: SssReportsPrismaClient;
  sssLoanReportsPrisma?: SssReportsPrismaClient;
  sssLoansPrisma?: SssLoansPrismaClient;
  centralSssLoansPrisma?: SssLoansPrismaClient;
};

const globalForSssPrisma = globalThis as GlobalSssPrisma;

export function getSssContributionsPrisma() {
  if (!globalForSssPrisma.sssContributionsPrisma) {
    globalForSssPrisma.sssContributionsPrisma = new SssReportsPrismaClient({
      datasources: { db: { url: getSssReportDatabaseUrl("SSS_CONTRIBUTIONS_DATABASE_URL", "hrdb_sss_contributions") } },
      log: ["error"],
    });
  }
  return globalForSssPrisma.sssContributionsPrisma;
}

export function getSssLoanReportsPrisma() {
  if (!globalForSssPrisma.sssLoanReportsPrisma) {
    globalForSssPrisma.sssLoanReportsPrisma = new SssReportsPrismaClient({
      datasources: { db: { url: getSssReportDatabaseUrl("SSS_LOANS_DATABASE_URL", "hrdb_sss_loans") } },
      log: ["error"],
    });
  }
  return globalForSssPrisma.sssLoanReportsPrisma;
}

export function getSssLoansPrisma() {
  if (!globalForSssPrisma.sssLoansPrisma) {
    globalForSssPrisma.sssLoansPrisma = new SssLoansPrismaClient({
      datasources: { db: { url: getSssReportDatabaseUrl("SSS_LOANS_DATABASE_URL", "hrdb_sss_loans") } },
      log: ["error"],
    });
  }
  return globalForSssPrisma.sssLoansPrisma;
}

export function getCentralSssLoansPrisma() {
  if (!globalForSssPrisma.centralSssLoansPrisma) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL must be configured for the central HR database.");
    globalForSssPrisma.centralSssLoansPrisma = new SssLoansPrismaClient({
      datasources: { db: { url } },
      log: ["error"],
    });
  }
  return globalForSssPrisma.centralSssLoansPrisma;
}

export async function findSssReportDatabase(id: number) {
  const [contribution, loan] = await Promise.all([
    getSssContributionsPrisma().sssReport.findUnique({ where: { id }, select: { id: true } }),
    getSssLoanReportsPrisma().sssReport.findUnique({ where: { id }, select: { id: true } }),
  ]);
  if (contribution && loan) throw new Error(`SSS report ID ${id} exists in both reporting databases.`);
  return contribution ? getSssContributionsPrisma() : loan ? getSssLoanReportsPrisma() : null;
}

export async function findSssDraftDatabase(id: number) {
  const [contribution, loan] = await Promise.all([
    getSssContributionsPrisma().sssReportDraft.findUnique({ where: { id }, select: { id: true } }),
    getSssLoanReportsPrisma().sssReportDraft.findUnique({ where: { id }, select: { id: true } }),
  ]);
  if (contribution && loan) throw new Error(`SSS report draft ID ${id} exists in both reporting databases.`);
  return contribution ? getSssContributionsPrisma() : loan ? getSssLoanReportsPrisma() : null;
}

export async function findLoanMonitorReportDatabase(id: string) {
  const [central, loan] = await Promise.all([
    getCentralSssLoansPrisma().loanMonitorReport.findUnique({ where: { id }, select: { id: true } }),
    getSssLoansPrisma().loanMonitorReport.findUnique({ where: { id }, select: { id: true } }),
  ]);
  if (central && loan) throw new Error(`Loan monitoring report ID ${id} exists in both databases.`);
  if (loan) return getSssLoansPrisma();
  if (central) return getCentralSssLoansPrisma();
  return null;
}
