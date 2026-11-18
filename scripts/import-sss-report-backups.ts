import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "dotenv";
import { Prisma, PrismaClient as SourcePrismaClient } from "../prisma/generated/client/index.js";
import {
  Prisma as SssReportsPrisma,
  PrismaClient as SssReportsPrismaClient,
} from "../prisma/generated/sss-reports/index.js";
import {
  Prisma as SssLoansPrisma,
  PrismaClient as SssLoansPrismaClient,
} from "../prisma/generated/sss-loans/index.js";

type Serialized<T> =
  T extends Date ? string :
  T extends Prisma.Decimal ? string :
  T extends readonly (infer U)[] ? Serialized<U>[] :
  T extends object ? { [K in keyof T]: Serialized<T[K]> } :
  T;

type ReportWithEntries = Prisma.SssReportGetPayload<{ include: { entries: true } }>;
type DraftRecord = Prisma.SssReportDraftGetPayload<object>;
type SssLoanRecord = Prisma.SssLoanGetPayload<object>;
type LoanWithPayments = Prisma.LoanGetPayload<{ include: { payments: true } }>;
type MonitorReportWithEntries = Prisma.LoanMonitorReportGetPayload<{ include: { entries: true } }>;
type ImportedReportWithEntries = Prisma.ImportedSssLoanReportGetPayload<{ include: { entries: true } }>;

type ContributionBackup = {
  format: "sss-report-logical-backup/v1";
  dataset: "sss-contributions";
  capturedAt: string;
  source: { provider: string; host: string; port: number; database: string };
  records: {
    reports: Serialized<ReportWithEntries>[];
    drafts: Serialized<DraftRecord>[];
  };
};

type LoansBackup = {
  format: "sss-report-logical-backup/v1";
  dataset: "sss-loans";
  capturedAt: string;
  source: { provider: string; host: string; port: number; database: string };
  records: {
    reports: Serialized<ReportWithEntries>[];
    drafts: Serialized<DraftRecord>[];
    sourceAccounts: Serialized<SssLoanRecord>[];
    accounts: Serialized<LoanWithPayments>[];
    loanMonitorReports: Serialized<MonitorReportWithEntries>[];
    importedHistoricalReports: Serialized<ImportedReportWithEntries>[];
  };
};

type BackupManifest = {
  format: "sss-report-logical-backup-manifest/v1";
  capturedAt: string;
  source: { provider: string; host: string; port: number; database: string };
  schema: { file: string; sha256: string };
  exports: { file: string; sha256: string; counts: Record<string, number> }[];
};

type Options = {
  envFile: string;
  backupDirectory: string;
  expectedHost: string;
  expectedPort: number;
  expectedDatabase: string;
  apply: boolean;
};

const contributionFile = "sss-contributions-backup.json";
const loansFile = "sss-loans-backup.json";

function parseOptions(args: string[]): Options {
  const values = new Map<string, string>();
  let apply = false;
  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    if (option === "--apply") {
      if (apply) throw new Error("Specify --apply only once.");
      apply = true;
      continue;
    }
    const value = args[index + 1];
    if (!option?.startsWith("--") || !value || values.has(option)) {
      throw new Error("Use --env-file, --backup-dir, --expected-host, --expected-port, and --expected-database once each.");
    }
    values.set(option, value);
    index += 1;
  }
  const expectedPortValue = values.get("--expected-port");
  const expectedPort = Number(expectedPortValue);
  const result = {
    envFile: values.get("--env-file") ?? "",
    backupDirectory: values.get("--backup-dir") ?? "",
    expectedHost: values.get("--expected-host") ?? "",
    expectedPort,
    expectedDatabase: values.get("--expected-database") ?? "",
    apply,
  };
  if (!result.envFile || !result.backupDirectory || !result.expectedHost || !expectedPortValue
    || !Number.isInteger(expectedPort) || expectedPort < 1 || expectedPort > 65535
    || !result.expectedDatabase || values.size !== 5) {
    throw new Error("Missing or invalid required backup import options.");
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function checksum(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalize(value: unknown): unknown {
  const jsonValue: unknown = JSON.parse(JSON.stringify(value));
  if (Array.isArray(jsonValue)) return jsonValue.map(canonicalize);
  if (!isRecord(jsonValue)) return jsonValue;
  return Object.fromEntries(Object.keys(jsonValue).sort().map((key) => [key, canonicalize(jsonValue[key])]));
}

function verifyEqual(expected: unknown, actual: unknown, label: string) {
  try {
    assert.deepStrictEqual(canonicalize(actual), canonicalize(expected));
  } catch {
    throw new Error(`${label} does not match the verified source backup.`);
  }
}

function toDate(value: string | null) {
  return value === null ? null : new Date(value);
}

function toDecimal(value: string) {
  return new Prisma.Decimal(value);
}

function toNullableDecimal(value: string | null) {
  return value === null ? null : toDecimal(value);
}

function toInputJson(value: unknown): SssReportsPrisma.InputJsonValue {
  if (value === null) throw new Error("A report draft must contain a non-null entries value.");
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.map((item) => item === null ? null : toInputJson(item));
  }
  if (isRecord(value)) {
    const entries = Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, item === null ? null : toInputJson(item)]);
    return Object.fromEntries(entries) as SssReportsPrisma.InputJsonObject;
  }
  throw new Error("A report draft contains an invalid JSON value.");
}

async function loadBackups(directory: string, options: Options) {
  const contributionText = await readFile(path.join(directory, contributionFile), "utf8");
  const loansText = await readFile(path.join(directory, loansFile), "utf8");
  const manifestText = await readFile(path.join(directory, "sss-reports-backup-manifest.json"), "utf8");
  const schemaText = await readFile(path.join(directory, "sss-reports-source-schema.prisma"), "utf8");
  const manifest = JSON.parse(manifestText) as BackupManifest;
  const contributions = JSON.parse(contributionText) as ContributionBackup;
  const loans = JSON.parse(loansText) as LoansBackup;
  const expectedSource = {
    provider: "postgresql",
    host: options.expectedHost,
    port: options.expectedPort,
    database: options.expectedDatabase,
  };

  if (manifest.format !== "sss-report-logical-backup-manifest/v1"
    || contributions.format !== "sss-report-logical-backup/v1"
    || contributions.dataset !== "sss-contributions"
    || loans.format !== "sss-report-logical-backup/v1"
    || loans.dataset !== "sss-loans") {
    throw new Error("The backup directory contains an unsupported export format.");
  }
  verifyEqual(expectedSource, manifest.source, "Backup manifest source identity");
  verifyEqual(expectedSource, contributions.source, "Contribution export source identity");
  verifyEqual(expectedSource, loans.source, "Loan export source identity");
  if (manifest.capturedAt !== contributions.capturedAt || manifest.capturedAt !== loans.capturedAt) {
    throw new Error("Backup files do not share the same capture timestamp.");
  }
  const manifestFiles = new Map(manifest.exports.map((entry) => [entry.file, entry]));
  const contributionManifest = manifestFiles.get(contributionFile);
  const loansManifest = manifestFiles.get(loansFile);
  if (!contributionManifest || !loansManifest
    || contributionManifest.sha256 !== checksum(contributionText)
    || loansManifest.sha256 !== checksum(loansText)
    || manifest.schema.file !== "sss-reports-source-schema.prisma"
    || manifest.schema.sha256 !== checksum(schemaText)) {
    throw new Error("Backup file checksums do not match the manifest.");
  }
  if (!Array.isArray(contributions.records?.reports) || !Array.isArray(contributions.records?.drafts)
    || !Array.isArray(loans.records?.reports) || !Array.isArray(loans.records?.drafts)
    || !Array.isArray(loans.records?.sourceAccounts) || !Array.isArray(loans.records?.accounts)
    || !Array.isArray(loans.records?.loanMonitorReports) || !Array.isArray(loans.records?.importedHistoricalReports)) {
    throw new Error("Backup record collections are missing or invalid.");
  }
  return { manifest, contributions, loans };
}

function contributionSourceSnapshot(transaction: Prisma.TransactionClient) {
  return Promise.all([
    transaction.sssReport.findMany({
      where: { kind: "CONTRIBUTION" },
      include: { entries: { orderBy: { id: "asc" } } },
      orderBy: { id: "asc" },
    }),
    transaction.sssReportDraft.findMany({ where: { kind: "CONTRIBUTION" }, orderBy: { id: "asc" } }),
  ]);
}

function loansSourceSnapshot(transaction: Prisma.TransactionClient) {
  return Promise.all([
    transaction.sssReport.findMany({
      where: { kind: "LOAN" },
      include: { entries: { orderBy: { id: "asc" } } },
      orderBy: { id: "asc" },
    }),
    transaction.sssReportDraft.findMany({ where: { kind: "LOAN" }, orderBy: { id: "asc" } }),
    transaction.sssLoan.findMany({ orderBy: { id: "asc" } }),
    transaction.loan.findMany({
      where: { provider: "SSS" },
      include: { payments: { orderBy: { id: "asc" } } },
      orderBy: { id: "asc" },
    }),
    transaction.loanMonitorReport.findMany({
      where: { entries: { some: { provider: "SSS" }, every: { provider: "SSS" } } },
      include: { entries: { orderBy: { id: "asc" } } },
      orderBy: { id: "asc" },
    }),
    transaction.importedSssLoanReport.findMany({
      include: { entries: { orderBy: { sourceEntryId: "asc" } } },
      orderBy: { sourceReportId: "asc" },
    }),
  ]);
}

function verifyContributionTarget(client: SssReportsPrismaClient, backup: ContributionBackup) {
  return Promise.all([
    client.sssReport.findMany({
      where: { kind: "CONTRIBUTION" },
      include: { entries: { orderBy: { id: "asc" } } },
      orderBy: { id: "asc" },
    }).then((rows) => verifyEqual(backup.records.reports, rows, "Contribution reports and entries")),
    client.sssReportDraft.findMany({ where: { kind: "CONTRIBUTION" }, orderBy: { id: "asc" } })
      .then((rows) => verifyEqual(backup.records.drafts, rows, "Contribution drafts")),
  ]);
}

function verifyLoansTarget(client: SssLoansPrismaClient, backup: LoansBackup) {
  return Promise.all([
    client.sssReport.findMany({
      where: { kind: "LOAN" },
      include: { entries: { orderBy: { id: "asc" } } },
      orderBy: { id: "asc" },
    }).then((rows) => verifyEqual(backup.records.reports, rows, "SSS loan reports and entries")),
    client.sssReportDraft.findMany({ where: { kind: "LOAN" }, orderBy: { id: "asc" } })
      .then((rows) => verifyEqual(backup.records.drafts, rows, "SSS loan drafts")),
    client.sssLoan.findMany({ orderBy: { id: "asc" } })
      .then((rows) => verifyEqual(backup.records.sourceAccounts, rows, "SSS source loan accounts")),
    client.loan.findMany({ where: { provider: "SSS" }, include: { payments: { orderBy: { id: "asc" } } }, orderBy: { id: "asc" } })
      .then((rows) => verifyEqual(backup.records.accounts, rows, "SSS loan accounts and payments")),
    client.loanMonitorReport.findMany({
      where: { entries: { some: { provider: "SSS" }, every: { provider: "SSS" } } },
      include: { entries: { orderBy: { id: "asc" } } },
      orderBy: { id: "asc" },
    }).then((rows) => verifyEqual(backup.records.loanMonitorReports, rows, "SSS-only monitoring reports and entries")),
    client.importedSssLoanReport.findMany({
      include: { entries: { orderBy: { sourceEntryId: "asc" } } },
      orderBy: { sourceReportId: "asc" },
    }).then((rows) => verifyEqual(backup.records.importedHistoricalReports, rows, "Imported historical reports and entries")),
  ]);
}

async function contributionTargetIsEmpty(client: SssReportsPrismaClient) {
  const counts = await Promise.all([
    client.sssReport.count(),
    client.sssReportEntry.count(),
    client.sssReportDraft.count(),
  ]);
  return counts.every((count) => count === 0);
}

async function loansTargetIsEmpty(client: SssLoansPrismaClient) {
  const counts = await Promise.all([
    client.sssReport.count(),
    client.sssReportEntry.count(),
    client.sssReportDraft.count(),
    client.sssLoan.count(),
    client.loan.count(),
    client.loanPayment.count(),
    client.loanMonitorReport.count(),
    client.loanMonitorReportEntry.count(),
    client.importedSssLoanReport.count(),
    client.importedSssLoanReportEntry.count(),
  ]);
  return counts.every((count) => count === 0);
}

async function importContributions(client: SssReportsPrismaClient, backup: ContributionBackup) {
  await client.$transaction(async (transaction) => {
    const reports = backup.records.reports.map(({ entries: _entries, ...report }) => ({
      ...report,
      amountDue: toDecimal(report.amountDue),
      amountPaid: toNullableDecimal(report.amountPaid),
      payDate: toDate(report.payDate),
      createdAt: new Date(report.createdAt),
      updatedAt: new Date(report.updatedAt),
    }));
    const entries = backup.records.reports.flatMap((report) => report.entries.map((entry) => ({
      ...entry,
      monthlySalaryCredit: toNullableDecimal(entry.monthlySalaryCredit),
      employeeSs: toDecimal(entry.employeeSs),
      employerSs: toDecimal(entry.employerSs),
      employeeMpf: toDecimal(entry.employeeMpf),
      employerMpf: toDecimal(entry.employerMpf),
      ec: toDecimal(entry.ec),
      loanAmount: toDecimal(entry.loanAmount),
      totalAmount: toDecimal(entry.totalAmount),
    })));
    const drafts = backup.records.drafts.map((draft) => ({
      ...draft,
      entries: toInputJson(draft.entries),
      continuedAt: toDate(draft.continuedAt),
      createdAt: new Date(draft.createdAt),
      updatedAt: new Date(draft.updatedAt),
    }));
    if (reports.length) await transaction.sssReport.createMany({ data: reports });
    if (entries.length) await transaction.sssReportEntry.createMany({ data: entries });
    if (drafts.length) await transaction.sssReportDraft.createMany({ data: drafts });
    await transaction.$queryRaw`SELECT setval(pg_get_serial_sequence('"SssReportEntry"', 'id'), COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "SssReportEntry"`;
  }, { isolationLevel: SssReportsPrisma.TransactionIsolationLevel.Serializable, timeout: 120_000 });
}

async function importLoans(client: SssLoansPrismaClient, backup: LoansBackup) {
  await client.$transaction(async (transaction) => {
    const sourceAccounts = backup.records.sourceAccounts.map((loan) => ({
      ...loan,
      loanDate: new Date(loan.loanDate),
      loanAmount: toNullableDecimal(loan.loanAmount),
      monthlyAmortization: toDecimal(loan.monthlyAmortization),
      createdAt: new Date(loan.createdAt),
      updatedAt: new Date(loan.updatedAt),
    }));
    const accounts = backup.records.accounts.map(({ payments: _payments, ...loan }) => ({
      ...loan,
      provider: "SSS" as const,
      loanDate: toDate(loan.loanDate),
      totalAmount: toNullableDecimal(loan.totalAmount),
      monthlyAmortization: toDecimal(loan.monthlyAmortization),
      outstandingBalance: toNullableDecimal(loan.outstandingBalance),
      createdAt: new Date(loan.createdAt),
      updatedAt: new Date(loan.updatedAt),
    }));
    const payments = backup.records.accounts.flatMap((loan) => loan.payments.map((payment) => ({
      ...payment,
      amountPaid: toDecimal(payment.amountPaid),
      paymentDate: new Date(payment.paymentDate),
      createdAt: new Date(payment.createdAt),
    })));
    const reports = backup.records.reports.map(({ entries: _entries, ...report }) => ({
      ...report,
      amountDue: toDecimal(report.amountDue),
      amountPaid: toNullableDecimal(report.amountPaid),
      payDate: toDate(report.payDate),
      createdAt: new Date(report.createdAt),
      updatedAt: new Date(report.updatedAt),
    }));
    const entries = backup.records.reports.flatMap((report) => report.entries.map((entry) => ({
      ...entry,
      monthlySalaryCredit: toNullableDecimal(entry.monthlySalaryCredit),
      employeeSs: toDecimal(entry.employeeSs),
      employerSs: toDecimal(entry.employerSs),
      employeeMpf: toDecimal(entry.employeeMpf),
      employerMpf: toDecimal(entry.employerMpf),
      ec: toDecimal(entry.ec),
      loanAmount: toDecimal(entry.loanAmount),
      totalAmount: toDecimal(entry.totalAmount),
    })));
    const drafts = backup.records.drafts.map((draft) => ({
      ...draft,
      entries: toInputJson(draft.entries),
      continuedAt: toDate(draft.continuedAt),
      createdAt: new Date(draft.createdAt),
      updatedAt: new Date(draft.updatedAt),
    }));
    const monitorReports = backup.records.loanMonitorReports.map(({ entries: _entries, ...report }) => ({
      ...report,
      applicableDate: new Date(report.applicableDate),
      paymentDate: toDate(report.paymentDate),
      amountPaid: toNullableDecimal(report.amountPaid),
      totalMonthly: toDecimal(report.totalMonthly),
      totalOutstanding: toDecimal(report.totalOutstanding),
      createdAt: new Date(report.createdAt),
    }));
    const monitorEntries = backup.records.loanMonitorReports.flatMap((report) => report.entries.map((entry) => ({
      ...entry,
      loanDate: toDate(entry.loanDate),
      totalAmount: toDecimal(entry.totalAmount),
      monthlyAmortization: toDecimal(entry.monthlyAmortization),
      outstandingBalance: toDecimal(entry.outstandingBalance),
    })));
    const importedReports = backup.records.importedHistoricalReports.map(({ entries: _entries, ...report }) => ({
      ...report,
      amountDue: toDecimal(report.amountDue),
      amountPaid: toNullableDecimal(report.amountPaid),
      payDate: toDate(report.payDate),
      sourceCreatedAt: new Date(report.sourceCreatedAt),
      sourceUpdatedAt: new Date(report.sourceUpdatedAt),
      importedAt: new Date(report.importedAt),
    }));
    const importedEntries = backup.records.importedHistoricalReports.flatMap((report) => report.entries.map((entry) => ({
      ...entry,
      monthlySalaryCredit: toNullableDecimal(entry.monthlySalaryCredit),
      employeeSs: toDecimal(entry.employeeSs),
      employerSs: toDecimal(entry.employerSs),
      employeeMpf: toDecimal(entry.employeeMpf),
      employerMpf: toDecimal(entry.employerMpf),
      ec: toDecimal(entry.ec),
      loanAmount: toDecimal(entry.loanAmount),
      totalAmount: toDecimal(entry.totalAmount),
    })));

    if (sourceAccounts.length) await transaction.sssLoan.createMany({ data: sourceAccounts });
    if (accounts.length) await transaction.loan.createMany({ data: accounts });
    if (payments.length) await transaction.loanPayment.createMany({ data: payments });
    if (reports.length) await transaction.sssReport.createMany({ data: reports });
    if (entries.length) await transaction.sssReportEntry.createMany({ data: entries });
    if (drafts.length) await transaction.sssReportDraft.createMany({ data: drafts });
    if (monitorReports.length) await transaction.loanMonitorReport.createMany({ data: monitorReports });
    if (monitorEntries.length) await transaction.loanMonitorReportEntry.createMany({ data: monitorEntries });
    if (importedReports.length) await transaction.importedSssLoanReport.createMany({ data: importedReports });
    if (importedEntries.length) await transaction.importedSssLoanReportEntry.createMany({ data: importedEntries });
    await transaction.$queryRaw`SELECT setval(pg_get_serial_sequence('"SssLoan"', 'id'), COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "SssLoan"`;
    await transaction.$queryRaw`SELECT setval(pg_get_serial_sequence('"SssReportEntry"', 'id'), COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "SssReportEntry"`;
  }, { isolationLevel: SssLoansPrisma.TransactionIsolationLevel.Serializable, timeout: 120_000 });
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const backupDirectory = path.resolve(options.backupDirectory);
  const repositoryRoot = process.cwd();
  const relativeBackupPath = path.relative(repositoryRoot, backupDirectory);
  if (relativeBackupPath === "" || (!path.isAbsolute(relativeBackupPath)
    && relativeBackupPath !== ".." && !relativeBackupPath.startsWith(`..${path.sep}`))) {
    throw new Error("Backup directory must be outside the repository.");
  }

  const { manifest, contributions, loans } = await loadBackups(backupDirectory, options);
  const env = parse(await readFile(path.resolve(options.envFile), "utf8"));
  if (!env.DATABASE_URL) throw new Error("The selected environment file has no DATABASE_URL.");
  const sourceUrl = new URL(env.DATABASE_URL);
  if (sourceUrl.hostname !== options.expectedHost
    || Number(sourceUrl.port || 5432) !== options.expectedPort
    || decodeURIComponent(sourceUrl.pathname.split("/").filter(Boolean)[0] ?? "") !== options.expectedDatabase) {
    throw new Error("The selected environment file does not match the confirmed source identity.");
  }
  const contributionsUrl = new URL(sourceUrl.toString());
  contributionsUrl.pathname = "/hrdb_sss_contributions";
  const loansUrl = new URL(sourceUrl.toString());
  loansUrl.pathname = "/hrdb_sss_loans";
  const source = new SourcePrismaClient({ datasources: { db: { url: sourceUrl.toString() } }, log: [] });
  const contributionTarget = new SssReportsPrismaClient({ datasources: { db: { url: contributionsUrl.toString() } }, log: ["error"] });
  const loansTarget = new SssLoansPrismaClient({ datasources: { db: { url: loansUrl.toString() } }, log: ["error"] });

  try {
    const [sourceContributionSnapshot, sourceLoanSnapshot] = await source.$transaction(async (transaction) =>
      Promise.all([contributionSourceSnapshot(transaction), loansSourceSnapshot(transaction)]),
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 120_000 });
    verifyEqual(
      { reports: contributions.records.reports, drafts: contributions.records.drafts },
      { reports: sourceContributionSnapshot[0], drafts: sourceContributionSnapshot[1] },
      "Live source contributions",
    );
    verifyEqual(
      {
        reports: loans.records.reports,
        drafts: loans.records.drafts,
        sourceAccounts: loans.records.sourceAccounts,
        accounts: loans.records.accounts,
        loanMonitorReports: loans.records.loanMonitorReports,
        importedHistoricalReports: loans.records.importedHistoricalReports,
      },
      {
        reports: sourceLoanSnapshot[0],
        drafts: sourceLoanSnapshot[1],
        sourceAccounts: sourceLoanSnapshot[2],
        accounts: sourceLoanSnapshot[3],
        loanMonitorReports: sourceLoanSnapshot[4],
        importedHistoricalReports: sourceLoanSnapshot[5],
      },
      "Live source SSS loans",
    );

    const contributionCounts = {
      reports: contributions.records.reports.length,
      entries: contributions.records.reports.reduce((sum, report) => sum + report.entries.length, 0),
      drafts: contributions.records.drafts.length,
    };
    const loansCounts = {
      reports: loans.records.reports.length,
      reportEntries: loans.records.reports.reduce((sum, report) => sum + report.entries.length, 0),
      drafts: loans.records.drafts.length,
      sourceAccounts: loans.records.sourceAccounts.length,
      accounts: loans.records.accounts.length,
      loanPayments: loans.records.accounts.reduce((sum, loan) => sum + loan.payments.length, 0),
      sssOnlyMonitorReports: loans.records.loanMonitorReports.length,
      monitorEntries: loans.records.loanMonitorReports.reduce((sum, report) => sum + report.entries.length, 0),
      importedHistoricalReports: loans.records.importedHistoricalReports.length,
      importedHistoricalEntries: loans.records.importedHistoricalReports.reduce((sum, report) => sum + report.entries.length, 0),
    };
    const manifestCounts = new Map(manifest.exports.map((entry) => [entry.file, entry.counts]));
    verifyEqual(manifestCounts.get(contributionFile), contributionCounts, "Contribution manifest counts");
    verifyEqual(manifestCounts.get(loansFile), loansCounts, "Loan manifest counts");

    if (!options.apply) {
      console.log("Validated both logical backups and confirmed they still match the live source. No target data was written.");
      console.log(JSON.stringify({ capturedAt: manifest.capturedAt, contributionCounts, loansCounts }, null, 2));
      return;
    }

    if (await contributionTargetIsEmpty(contributionTarget)) {
      await importContributions(contributionTarget, contributions);
    }
    await verifyContributionTarget(contributionTarget, contributions);
    if (await loansTargetIsEmpty(loansTarget)) {
      await importLoans(loansTarget, loans);
    }
    await verifyLoansTarget(loansTarget, loans);

    console.log("Imported and verified both SSS datasets. The source database was read only.");
    console.log(JSON.stringify({
      capturedAt: manifest.capturedAt,
      contributionCounts,
      loansCounts,
      contributionTarget: "hrdb_sss_contributions",
      loansTarget: "hrdb_sss_loans",
    }, null, 2));
  } finally {
    await Promise.all([source.$disconnect(), contributionTarget.$disconnect(), loansTarget.$disconnect()]);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "SSS report backup import failed.");
  process.exitCode = 1;
});
