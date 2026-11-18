import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "dotenv";
import { Prisma, PrismaClient } from "../prisma/generated/client/index.js";
import {
  Prisma as SssLoansPrisma,
  PrismaClient as SssLoansPrismaClient,
} from "../prisma/generated/sss-loans/index.js";
import { hasCompleteHistoricalSssPayment } from "../lib/loanReportDisplay.js";
import {
  findHistoricalSssImportDuplicate,
  type HistoricalSssImportMatch,
} from "../lib/historicalSssLoanImport.js";

type ImportMode =
  | {
      sourceEnvFile: string;
      targetEnvFile: string;
    } & (
      | { kind: "dry-run" }
      | { kind: "apply-all" }
      | { kind: "apply-one"; sourceReportId: number }
    )
  | { kind: "copy-to-loans-db"; envFile: string; apply: boolean };

function parseMode(args: string[]): ImportMode {
  let kind: ImportMode["kind"] = "dry-run";
  let sourceReportId: number | undefined;
  let sourceEnvFile: string | undefined;
  let targetEnvFile: string | undefined;
  let envFile: string | undefined;
  let copyToLoansDb = false;
  let applyToLoansDb = false;
  let modeWasSelected = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--copy-to-loans-db") {
      if (modeWasSelected || copyToLoansDb) throw new Error("Choose only one import mode.");
      copyToLoansDb = true;
      kind = "copy-to-loans-db";
    } else if (arg === "--apply") {
      if (!copyToLoansDb || applyToLoansDb) {
        throw new Error("--apply is only valid once with --copy-to-loans-db.");
      }
      applyToLoansDb = true;
    } else if (arg === "--env-file") {
      envFile = args[index + 1];
      if (!envFile) throw new Error("--env-file requires an environment file path.");
      index += 1;
    } else if (arg === "--dry-run") {
      if (modeWasSelected) throw new Error("Choose only one import mode.");
      modeWasSelected = true;
      kind = "dry-run";
    } else if (arg === "--apply-all") {
      if (copyToLoansDb) throw new Error("Use --apply with --copy-to-loans-db.");
      if (modeWasSelected) throw new Error("Choose only one import mode.");
      modeWasSelected = true;
      kind = "apply-all";
    } else if (arg === "--apply-one") {
      if (copyToLoansDb) throw new Error("--apply-one cannot be used with --copy-to-loans-db.");
      if (modeWasSelected) throw new Error("Choose only one import mode.");
      const sourceIdArg = args[index + 1];
      sourceReportId = Number(sourceIdArg);
      if (!Number.isSafeInteger(sourceReportId) || sourceReportId < 1) {
        throw new Error("--apply-one requires a positive integer source report ID.");
      }
      modeWasSelected = true;
      kind = "apply-one";
      index += 1;
    } else if (arg === "--source-env") {
      sourceEnvFile = args[index + 1];
      if (!sourceEnvFile) throw new Error("--source-env requires an environment file path.");
      index += 1;
    } else if (arg === "--target-env") {
      targetEnvFile = args[index + 1];
      if (!targetEnvFile) throw new Error("--target-env requires an environment file path.");
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (copyToLoansDb) {
    if (!envFile || sourceEnvFile || targetEnvFile || modeWasSelected) {
      throw new Error("Use --copy-to-loans-db --env-file <source file>, optionally with --apply.");
    }
    return { kind: "copy-to-loans-db", envFile, apply: applyToLoansDb };
  }

  if (applyToLoansDb || envFile) {
    throw new Error("--apply and --env-file are only valid with --copy-to-loans-db.");
  }

  if (!sourceEnvFile || !targetEnvFile) {
    throw new Error("Specify both --source-env <file> and --target-env <file>.");
  }

  if (kind === "apply-one") {
    if (sourceReportId === undefined) throw new Error("--apply-one requires a positive integer source report ID.");
    return { kind, sourceReportId, sourceEnvFile, targetEnvFile };
  }

  if (kind === "dry-run") return { kind, sourceEnvFile, targetEnvFile };
  if (kind === "apply-all") return { kind, sourceEnvFile, targetEnvFile };
  throw new Error("Unsupported import mode.");
}

function getDatabaseUrl(fileName: string): string {
  const filePath = path.resolve(process.cwd(), fileName);
  let contents: string;
  try {
    contents = readFileSync(filePath, "utf8");
  } catch (error) {
    throw new Error(`Unable to read ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
  }

  const url = parse(contents).DATABASE_URL;
  if (!url) throw new Error(`${fileName} must define DATABASE_URL.`);
  return url;
}

function getTargetDatabaseUrl(fileName: string): string {
  const filePath = path.resolve(process.cwd(), fileName);
  let contents: string;
  try {
    contents = readFileSync(filePath, "utf8");
  } catch (error) {
    throw new Error(`Unable to read ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
  }
  const url = parse(contents).SSS_LOANS_DATABASE_URL;
  if (!url) throw new Error(`${fileName} must define SSS_LOANS_DATABASE_URL for the SSS loans database.`);
  const database = decodeURIComponent(new URL(url).pathname.replace(/^\//, ""));
  if (database !== "hrdb_sss_loans") {
    throw new Error("SSS_LOANS_DATABASE_URL must point to hrdb_sss_loans.");
  }
  return url;
}

function getDerivedLoansDatabaseUrl(sourceUrl: string): string {
  const url = new URL(sourceUrl);
  url.pathname = "/hrdb_sss_loans";
  return url.toString();
}

function getDatabaseIdentity(rawUrl: string): string {
  const url = new URL(rawUrl);
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("Both import databases must use PostgreSQL connection URLs.");
  }

  return [
    url.hostname.toLocaleLowerCase(),
    url.port || "5432",
    decodeURIComponent(url.pathname.replace(/^\//, "")),
    url.searchParams.get("schema") || "public",
  ].join("|");
}

function toDateOnly(value: Date | null): string | null {
  return value?.toISOString().slice(0, 10) ?? null;
}

function getSourceComparable(report: {
  id: number;
  kind: string;
  employerId: number;
  employerName: string;
  employerAddress: string | null;
  employerSssNumber: string | null;
  prn: string;
  applicableMonth: number;
  applicableYear: number;
  amountDue: Prisma.Decimal;
  amountPaid: Prisma.Decimal | null;
  paymentType: string | null;
  payDate: Date | null;
  sssBranch: string | null;
  transactionReference: string | null;
  createdBy: number | null;
  createdAt: Date;
  updatedAt: Date;
  entries: {
    id: number;
    employeeId: number | null;
    employeeName: string;
    employeeCode: string;
    employeeSssNumber: string | null;
    sssLoanId: number | null;
    loanAccountNumber: string | null;
    employeeEmployerId: number | null;
    employeeEmployerName: string | null;
    salaryRange: string | null;
    monthlySalaryCredit: Prisma.Decimal | null;
    employeeSs: Prisma.Decimal;
    employerSs: Prisma.Decimal;
    employeeMpf: Prisma.Decimal;
    employerMpf: Prisma.Decimal;
    ec: Prisma.Decimal;
    loanAmount: Prisma.Decimal;
    totalAmount: Prisma.Decimal;
  }[];
}) {
  return {
    sourceReportId: report.id,
    sourceKind: report.kind,
    sourceEmployerId: report.employerId,
    employerName: report.employerName,
    employerAddress: report.employerAddress,
    employerSssNumber: report.employerSssNumber,
    prn: report.prn,
    applicableMonth: report.applicableMonth,
    applicableYear: report.applicableYear,
    amountDue: String(report.amountDue),
    amountPaid: report.amountPaid === null ? null : String(report.amountPaid),
    paymentType: report.paymentType,
    payDate: toDateOnly(report.payDate),
    sssBranch: report.sssBranch,
    transactionReference: report.transactionReference,
    sourceCreatedBy: report.createdBy,
    sourceCreatedAt: report.createdAt.toISOString(),
    sourceUpdatedAt: report.updatedAt.toISOString(),
    entries: report.entries
      .map((entry) => ({
        sourceEntryId: entry.id,
        sourceEmployeeId: entry.employeeId,
        employeeName: entry.employeeName,
        employeeCode: entry.employeeCode,
        employeeSssNumber: entry.employeeSssNumber,
        sourceSssLoanId: entry.sssLoanId,
        loanAccountNumber: entry.loanAccountNumber,
        sourceEmployeeEmployerId: entry.employeeEmployerId,
        employeeEmployerName: entry.employeeEmployerName,
        salaryRange: entry.salaryRange,
        monthlySalaryCredit: entry.monthlySalaryCredit === null ? null : String(entry.monthlySalaryCredit),
        employeeSs: String(entry.employeeSs),
        employerSs: String(entry.employerSs),
        employeeMpf: String(entry.employeeMpf),
        employerMpf: String(entry.employerMpf),
        ec: String(entry.ec),
        loanAmount: String(entry.loanAmount),
        totalAmount: String(entry.totalAmount),
      }))
      .sort((a, b) => a.sourceEntryId - b.sourceEntryId),
  };
}

function getImportedComparable(report: {
  sourceReportId: number;
  sourceKind: string;
  sourceEmployerId: number;
  employerName: string;
  employerAddress: string | null;
  employerSssNumber: string | null;
  prn: string;
  applicableMonth: number;
  applicableYear: number;
  amountDue: Prisma.Decimal;
  amountPaid: Prisma.Decimal | null;
  paymentType: string | null;
  payDate: Date | null;
  sssBranch: string | null;
  transactionReference: string | null;
  sourceCreatedBy: number | null;
  sourceCreatedAt: Date;
  sourceUpdatedAt: Date;
  entries: {
    sourceEntryId: number;
    sourceEmployeeId: number | null;
    employeeName: string;
    employeeCode: string;
    employeeSssNumber: string | null;
    sourceSssLoanId: number | null;
    loanAccountNumber: string | null;
    sourceEmployeeEmployerId: number | null;
    employeeEmployerName: string | null;
    salaryRange: string | null;
    monthlySalaryCredit: Prisma.Decimal | null;
    employeeSs: Prisma.Decimal;
    employerSs: Prisma.Decimal;
    employeeMpf: Prisma.Decimal;
    employerMpf: Prisma.Decimal;
    ec: Prisma.Decimal;
    loanAmount: Prisma.Decimal;
    totalAmount: Prisma.Decimal;
  }[];
}) {
  return {
    sourceReportId: report.sourceReportId,
    sourceKind: report.sourceKind,
    sourceEmployerId: report.sourceEmployerId,
    employerName: report.employerName,
    employerAddress: report.employerAddress,
    employerSssNumber: report.employerSssNumber,
    prn: report.prn,
    applicableMonth: report.applicableMonth,
    applicableYear: report.applicableYear,
    amountDue: String(report.amountDue),
    amountPaid: report.amountPaid === null ? null : String(report.amountPaid),
    paymentType: report.paymentType,
    payDate: toDateOnly(report.payDate),
    sssBranch: report.sssBranch,
    transactionReference: report.transactionReference,
    sourceCreatedBy: report.sourceCreatedBy,
    sourceCreatedAt: report.sourceCreatedAt.toISOString(),
    sourceUpdatedAt: report.sourceUpdatedAt.toISOString(),
    entries: report.entries
      .map((entry) => ({
        sourceEntryId: entry.sourceEntryId,
        sourceEmployeeId: entry.sourceEmployeeId,
        employeeName: entry.employeeName,
        employeeCode: entry.employeeCode,
        employeeSssNumber: entry.employeeSssNumber,
        sourceSssLoanId: entry.sourceSssLoanId,
        loanAccountNumber: entry.loanAccountNumber,
        sourceEmployeeEmployerId: entry.sourceEmployeeEmployerId,
        employeeEmployerName: entry.employeeEmployerName,
        salaryRange: entry.salaryRange,
        monthlySalaryCredit: entry.monthlySalaryCredit === null ? null : String(entry.monthlySalaryCredit),
        employeeSs: String(entry.employeeSs),
        employerSs: String(entry.employerSs),
        employeeMpf: String(entry.employeeMpf),
        employerMpf: String(entry.employerMpf),
        ec: String(entry.ec),
        loanAmount: String(entry.loanAmount),
        totalAmount: String(entry.totalAmount),
      }))
      .sort((a, b) => a.sourceEntryId - b.sourceEntryId),
  };
}

function toImportMatch(
  report: {
    id: number;
    employerName: string;
    applicableMonth: number;
    applicableYear: number;
    prn: string | null;
    entries: { loanAccountNumber: string | null }[];
  },
): HistoricalSssImportMatch & { sourceReportId: number } {
  return {
    sourceReportId: report.id,
    employerName: report.employerName,
    applicableMonth: report.applicableMonth,
    applicableYear: report.applicableYear,
    prn: report.prn,
    loanAccountNumbers: report.entries.map((entry) => entry.loanAccountNumber),
  };
}

async function loadExistingReports(
  client: SssLoansPrismaClient | SssLoansPrisma.TransactionClient,
  source: PrismaClient,
  includeLegacy = true,
): Promise<HistoricalSssImportMatch[]> {
  const [imported, legacy, snapshots, centralSnapshots] = await Promise.all([
    client.importedSssLoanReport.findMany({
      include: { entries: { select: { loanAccountNumber: true } } },
    }),
    client.sssReport.findMany({
      where: { kind: "LOAN" },
      include: { entries: { select: { loanAccountNumber: true } } },
    }),
    client.loanMonitorReport.findMany({
      include: {
        entries: {
          where: { provider: "SSS" },
          select: { loanAccountNumber: true },
        },
      },
    }),
    source.loanMonitorReport.findMany({
      where: { entries: { some: { provider: "SSS" } } },
      select: {
        employerName: true,
        applicableDate: true,
        prn: true,
        entries: { select: { provider: true, loanAccountNumber: true } },
      },
    }),
  ]);

  return [
    ...imported.map((report) => ({
      sourceReportId: report.sourceReportId,
      employerName: report.employerName,
      applicableMonth: report.applicableMonth,
      applicableYear: report.applicableYear,
      prn: report.prn,
      loanAccountNumbers: report.entries.map((entry) => entry.loanAccountNumber),
    })),
    ...(includeLegacy ? legacy.map((report) => ({
      sourceReportId: report.id,
      employerName: report.employerName,
      applicableMonth: report.applicableMonth,
      applicableYear: report.applicableYear,
      prn: report.prn,
      loanAccountNumbers: report.entries.map((entry) => entry.loanAccountNumber),
    })) : []),
    ...snapshots.map((report) => ({
      employerName: report.employerName,
      applicableMonth: report.applicableDate.getUTCMonth() + 1,
      applicableYear: report.applicableDate.getUTCFullYear(),
      prn: report.prn,
      loanAccountNumbers: report.entries.map((entry) => entry.loanAccountNumber),
    })),
    ...centralSnapshots
      .filter((report) => report.entries.some((entry) => entry.provider !== "SSS"))
      .map((report) => ({
        employerName: report.employerName,
        applicableMonth: report.applicableDate.getUTCMonth() + 1,
        applicableYear: report.applicableDate.getUTCFullYear(),
        prn: report.prn,
        loanAccountNumbers: report.entries
          .filter((entry) => entry.provider === "SSS")
          .map((entry) => entry.loanAccountNumber),
      })),
  ];
}

async function main() {
  const mode = parseMode(process.argv.slice(2));
  const sourceEnvFile = mode.kind === "copy-to-loans-db" ? mode.envFile : mode.sourceEnvFile;
  const sourceUrl = getDatabaseUrl(sourceEnvFile);
  const targetUrl = mode.kind === "copy-to-loans-db"
    ? getDerivedLoansDatabaseUrl(sourceUrl)
    : getTargetDatabaseUrl(mode.targetEnvFile);
  if (getDatabaseIdentity(sourceUrl) === getDatabaseIdentity(targetUrl)) {
    throw new Error("The SSS loans destination must be separate from the source database.");
  }

  const source = new PrismaClient({ datasources: { db: { url: sourceUrl } } });
  const target = new SssLoansPrismaClient({ datasources: { db: { url: targetUrl } } });

  try {
    const sourceReports = await source.sssReport.findMany({
      where: { kind: "LOAN" },
      include: { entries: { orderBy: { id: "asc" } } },
      orderBy: [{ applicableYear: "asc" }, { applicableMonth: "asc" }, { id: "asc" }],
    });
    const completeReports = sourceReports.filter((report) =>
      report.entries.length > 0 &&
      hasCompleteHistoricalSssPayment({
        amountPaid: report.amountPaid === null ? null : String(report.amountPaid),
        paymentBranch: report.sssBranch,
        paymentDate: toDateOnly(report.payDate),
        transactionReference: report.transactionReference,
        prn: report.prn,
      }),
    );
    const existingReports = await loadExistingReports(target, source);
    const decisions = completeReports.map((report) => {
      const match = toImportMatch(report);
      return {
        report,
        duplicateReason: findHistoricalSssImportDuplicate(match, existingReports),
      };
    });
    const eligible = decisions.filter((decision) => decision.duplicateReason === null);

    if (mode.kind === "dry-run" || (mode.kind === "copy-to-loans-db" && !mode.apply)) {
      console.log(mode.kind === "copy-to-loans-db"
        ? "Separate SSS loans database import dry run"
        : "Historical SSS payment import dry run");
      console.log(mode.kind === "copy-to-loans-db"
        ? `Source: ${mode.envFile}; destination database: hrdb_sss_loans`
        : `Source: ${mode.sourceEnvFile}; destination: ${mode.targetEnvFile}`);
      console.log(`Complete source payment reports with entries: ${completeReports.length}`);
      console.log(`Already represented or overlapping: ${decisions.length - eligible.length}`);
      console.log(`Eligible for import: ${eligible.length}`);
      const pilot = eligible[0]?.report;
      if (pilot) {
        console.log("Earliest eligible pilot (no records written):");
        console.log(JSON.stringify({
          sourceReportId: pilot.id,
          employerName: pilot.employerName,
          applicableMonth: pilot.applicableMonth,
          applicableYear: pilot.applicableYear,
          amountPaid: String(pilot.amountPaid),
          entryCount: pilot.entries.length,
        }, null, 2));
      }
      return;
    }

    const persistReport = async (
      transaction: SssLoansPrisma.TransactionClient,
      sourceReport: (typeof sourceReports)[number],
    ) => {
      const imported = await transaction.importedSssLoanReport.create({
        data: {
          sourceReportId: sourceReport.id,
          sourceKind: sourceReport.kind,
          sourceEmployerId: sourceReport.employerId,
          employerName: sourceReport.employerName,
          employerAddress: sourceReport.employerAddress,
          employerSssNumber: sourceReport.employerSssNumber,
          prn: sourceReport.prn,
          applicableMonth: sourceReport.applicableMonth,
          applicableYear: sourceReport.applicableYear,
          amountDue: sourceReport.amountDue,
          amountPaid: sourceReport.amountPaid,
          paymentType: sourceReport.paymentType,
          payDate: sourceReport.payDate,
          sssBranch: sourceReport.sssBranch,
          transactionReference: sourceReport.transactionReference,
          sourceCreatedBy: sourceReport.createdBy,
          sourceCreatedAt: sourceReport.createdAt,
          sourceUpdatedAt: sourceReport.updatedAt,
          entries: {
            create: sourceReport.entries.map((entry) => ({
              sourceEntryId: entry.id,
              sourceEmployeeId: entry.employeeId,
              employeeName: entry.employeeName,
              employeeCode: entry.employeeCode,
              employeeSssNumber: entry.employeeSssNumber,
              sourceSssLoanId: entry.sssLoanId,
              loanAccountNumber: entry.loanAccountNumber,
              sourceEmployeeEmployerId: entry.employeeEmployerId,
              employeeEmployerName: entry.employeeEmployerName,
              salaryRange: entry.salaryRange,
              monthlySalaryCredit: entry.monthlySalaryCredit,
              employeeSs: entry.employeeSs,
              employerSs: entry.employerSs,
              employeeMpf: entry.employeeMpf,
              employerMpf: entry.employerMpf,
              ec: entry.ec,
              loanAmount: entry.loanAmount,
              totalAmount: entry.totalAmount,
            })),
          },
        },
        include: { entries: { orderBy: { sourceEntryId: "asc" } } },
      });

      assert.deepStrictEqual(getImportedComparable(imported), getSourceComparable(sourceReport));
      return imported;
    };

    if (mode.kind === "apply-all" || mode.kind === "copy-to-loans-db") {
      const importedBeforeTransaction = await target.importedSssLoanReport.findMany({
        where: { sourceReportId: { in: completeReports.map((report) => report.id) } },
        include: { entries: { orderBy: { sourceEntryId: "asc" } } },
      });
      for (const imported of importedBeforeTransaction) {
        const sourceReport = completeReports.find((report) => report.id === imported.sourceReportId);
        if (!sourceReport) {
          throw new Error(`Imported source report ${imported.sourceReportId} is no longer a complete payment report.`);
        }
        assert.deepStrictEqual(getImportedComparable(imported), getSourceComparable(sourceReport));
      }

      const result = await target.$transaction(async (transaction) => {
        const latestExistingReports = await loadExistingReports(transaction, source);
        let importedReportCount = 0;
        let importedEntryCount = 0;
        const alreadyImportedCount = importedBeforeTransaction.length;

        for (const { report } of eligible) {
          let reportToPersist = report;
          if (mode.kind === "copy-to-loans-db") {
            const currentSourceReport = await source.sssReport.findUnique({
              where: { id: report.id },
              include: { entries: { orderBy: { id: "asc" } } },
            });
            if (!currentSourceReport) {
              throw new Error(`Source report ${report.id} disappeared before it could be copied.`);
            }
            assert.deepStrictEqual(getSourceComparable(currentSourceReport), getSourceComparable(report));
            reportToPersist = currentSourceReport;
          }

          const duplicateReason = findHistoricalSssImportDuplicate(
            toImportMatch(reportToPersist),
            latestExistingReports,
          );
          if (duplicateReason) {
            throw new Error(`Source report ${reportToPersist.id} was not imported: ${duplicateReason}.`);
          }

          const imported = await persistReport(transaction, reportToPersist);
          importedReportCount += 1;
          importedEntryCount += imported.entries.length;
          latestExistingReports.push(toImportMatch(reportToPersist));
        }

        return { importedReportCount, importedEntryCount, alreadyImportedCount };
      }, {
        isolationLevel: SssLoansPrisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 30_000,
      });

      console.log(mode.kind === "copy-to-loans-db"
        ? `Copied and verified ${result.importedReportCount} reports with ${result.importedEntryCount} entries into hrdb_sss_loans; ${result.alreadyImportedCount} reports were already copied and verified.`
        : `Imported and verified ${result.importedReportCount} reports with ${result.importedEntryCount} entries; ${result.alreadyImportedCount} reports were already imported and verified.`);
      return;
    }

    const selected = decisions.find(({ report }) => report.id === mode.sourceReportId);
    if (!selected) {
      throw new Error(`Source report ${mode.sourceReportId} is not a complete payment report with entries.`);
    }

    const sourceReport = selected.report;
    const existingImport = await target.importedSssLoanReport.findUnique({
      where: { sourceReportId: sourceReport.id },
      include: { entries: { orderBy: { sourceEntryId: "asc" } } },
    });
    if (existingImport) {
      assert.deepStrictEqual(getImportedComparable(existingImport), getSourceComparable(sourceReport));
      console.log(`Already imported and verified source report ${sourceReport.id} with ${existingImport.entries.length} entries.`);
      return;
    }
    if (selected.duplicateReason) {
      throw new Error(`Source report ${sourceReport.id} was not imported: ${selected.duplicateReason}.`);
    }

    const created = await target.$transaction(async (transaction) => {
      const existing = await transaction.importedSssLoanReport.findUnique({
        where: { sourceReportId: sourceReport.id },
        include: { entries: { orderBy: { sourceEntryId: "asc" } } },
      });
      if (existing) {
        assert.deepStrictEqual(getImportedComparable(existing), getSourceComparable(sourceReport));
        return { alreadyImported: true, entryCount: existing.entries.length };
      }

      const latestExistingReports = await loadExistingReports(transaction, source);
      const duplicateReason = findHistoricalSssImportDuplicate(
        toImportMatch(sourceReport),
        latestExistingReports,
      );
      if (duplicateReason) {
        throw new Error(`Source report ${sourceReport.id} was not imported: ${duplicateReason}.`);
      }

      const imported = await persistReport(transaction, sourceReport);
      return { alreadyImported: false, entryCount: imported.entries.length };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    console.log(
      `${created.alreadyImported ? "Already imported and verified" : "Imported and verified"} source report ${sourceReport.id} with ${created.entryCount} entries.`,
    );
  } finally {
    await Promise.all([source.$disconnect(), target.$disconnect()]);
  }
}

main().catch((error: unknown) => {
  console.error("Historical SSS import failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
