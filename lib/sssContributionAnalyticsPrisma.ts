import { PrismaClient } from "@/prisma/generated/client";
import { getSssReportDatabaseUrl } from "@/lib/sssReportDatabaseUrl";

type GlobalSssAnalyticsPrisma = typeof globalThis & {
  sssContributionAnalyticsPrisma?: PrismaClient;
};

const globalForSssAnalyticsPrisma = globalThis as GlobalSssAnalyticsPrisma;

export function getSssContributionAnalyticsPrisma() {
  if (!globalForSssAnalyticsPrisma.sssContributionAnalyticsPrisma) {
    globalForSssAnalyticsPrisma.sssContributionAnalyticsPrisma = new PrismaClient({
      datasources: {
        db: {
          url: getSssReportDatabaseUrl("SSS_CONTRIBUTIONS_DATABASE_URL", "hrdb_sss_contributions"),
        },
      },
      log: ["error"],
    });
  }
  return globalForSssAnalyticsPrisma.sssContributionAnalyticsPrisma;
}
