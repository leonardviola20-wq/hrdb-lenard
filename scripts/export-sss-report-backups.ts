import { createHash } from "node:crypto";
import { readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "dotenv";
import { PrismaClient } from "../prisma/generated/client/index.js";

type ExportOptions = {
  envFile: string;
  expectedHost: string;
  expectedPort: number;
  expectedDatabase: string;
  outputDirectory: string;
};

function parseOptions(args: string[]): ExportOptions {
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const option = args[index];
    const value = args[index + 1];
    if (!option?.startsWith("--") || !value || values.has(option)) {
      throw new Error("Provide each required option once: --env-file, --expected-host, --expected-port, --expected-database, --output-dir.");
    }
    values.set(option, value);
  }

  const envFile = values.get("--env-file");
  const expectedHost = values.get("--expected-host");
  const expectedPortValue = values.get("--expected-port");
  const expectedDatabase = values.get("--expected-database");
  const outputDirectory = values.get("--output-dir");
  const expectedPort = Number(expectedPortValue);
  if (!envFile || !expectedHost || !expectedPortValue || !Number.isInteger(expectedPort) || expectedPort < 1 || expectedPort > 65535 || !expectedDatabase || !outputDirectory || values.size !== 5) {
    throw new Error("Missing or invalid required backup export options.");
  }

  return { envFile, expectedHost, expectedPort, expectedDatabase, outputDirectory };
}

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function isWithinDirectory(parent: string, candidate: string) {
  const relativePath = path.relative(parent, candidate);
  return relativePath === "" || (!path.isAbsolute(relativePath) && relativePath !== ".." && !relativePath.startsWith(`..${path.sep}`));
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const repositoryRoot = process.cwd();
  const outputDirectory = path.resolve(options.outputDirectory);
  if (isWithinDirectory(repositoryRoot, outputDirectory)) {
    throw new Error("Backup output must be outside the repository.");
  }

  const environment = parse(await readFile(path.resolve(options.envFile), "utf8"));
  const databaseUrl = environment.DATABASE_URL;
  if (!databaseUrl) throw new Error("The selected environment file has no DATABASE_URL.");
  const sourceUrl = new URL(databaseUrl);
  const sourceHost = sourceUrl.hostname;
  const sourcePort = Number(sourceUrl.port || 5432);
  const sourceDatabase = decodeURIComponent(sourceUrl.pathname.split("/").filter(Boolean)[0] ?? "");
  if (sourceHost !== options.expectedHost || sourcePort !== options.expectedPort || sourceDatabase !== options.expectedDatabase) {
    throw new Error("The selected environment file does not match the confirmed source host, port, and database.");
  }

  const outputEntries = await readdir(outputDirectory);
  if (outputEntries.length > 0) throw new Error("Backup directory must be empty; refusing to overwrite existing files.");

  const schemaPath = path.resolve(repositoryRoot, "prisma/schema.prisma");
  const schema = await readFile(schemaPath, "utf8");
  const client = new PrismaClient({ datasources: { db: { url: databaseUrl } }, log: [] });
  const publishedFiles: string[] = [];
  const temporaryFiles: string[] = [];
  let completed = false;

  try {
    const exported = await client.$transaction(async (transaction) => {
      const [
        contributionReports,
        contributionDrafts,
        loanReports,
        loanDrafts,
        sourceSssLoans,
        sssLoans,
        loanMonitorReports,
        importedHistoricalReports,
      ] = await Promise.all([
        transaction.sssReport.findMany({
          where: { kind: "CONTRIBUTION" },
          include: { entries: { orderBy: { id: "asc" } } },
          orderBy: { id: "asc" },
        }),
        transaction.sssReportDraft.findMany({
          where: { kind: "CONTRIBUTION" },
          orderBy: { id: "asc" },
        }),
        transaction.sssReport.findMany({
          where: { kind: "LOAN" },
          include: { entries: { orderBy: { id: "asc" } } },
          orderBy: { id: "asc" },
        }),
        transaction.sssReportDraft.findMany({
          where: { kind: "LOAN" },
          orderBy: { id: "asc" },
        }),
        transaction.sssLoan.findMany({ orderBy: { id: "asc" } }),
        transaction.loan.findMany({
          where: { provider: "SSS" },
          include: { payments: { orderBy: { id: "asc" } } },
          orderBy: { id: "asc" },
        }),
        transaction.loanMonitorReport.findMany({
          where: {
            entries: {
              some: { provider: "SSS" },
              every: { provider: "SSS" },
            },
          },
          include: { entries: { orderBy: { id: "asc" } } },
          orderBy: { id: "asc" },
        }),
        transaction.importedSssLoanReport.findMany({
          include: { entries: { orderBy: { sourceEntryId: "asc" } } },
          orderBy: { sourceReportId: "asc" },
        }),
      ]);

      return {
        contributions: { reports: contributionReports, drafts: contributionDrafts },
        loans: {
          reports: loanReports,
          drafts: loanDrafts,
          sourceAccounts: sourceSssLoans,
          accounts: sssLoans,
          loanMonitorReports,
          importedHistoricalReports,
        },
      };
    }, { isolationLevel: "RepeatableRead" });

    const source = { provider: "postgresql", host: sourceHost, port: sourcePort, database: sourceDatabase };
    const capturedAt = new Date().toISOString();
    const files = [
      {
        name: "sss-contributions-backup.json",
        payload: {
          format: "sss-report-logical-backup/v1",
          dataset: "sss-contributions",
          capturedAt,
          source,
          schema: { file: "sss-reports-source-schema.prisma", sha256: sha256(schema) },
          records: exported.contributions,
        },
        counts: {
          reports: exported.contributions.reports.length,
          entries: exported.contributions.reports.reduce((sum, report) => sum + report.entries.length, 0),
          drafts: exported.contributions.drafts.length,
        },
      },
      {
        name: "sss-loans-backup.json",
        payload: {
          format: "sss-report-logical-backup/v1",
          dataset: "sss-loans",
          capturedAt,
          source,
          schema: { file: "sss-reports-source-schema.prisma", sha256: sha256(schema) },
          records: exported.loans,
        },
        counts: {
          reports: exported.loans.reports.length,
          reportEntries: exported.loans.reports.reduce((sum, report) => sum + report.entries.length, 0),
          drafts: exported.loans.drafts.length,
          sourceAccounts: exported.loans.sourceAccounts.length,
          accounts: exported.loans.accounts.length,
          loanPayments: exported.loans.accounts.reduce((sum, loan) => sum + loan.payments.length, 0),
          sssOnlyMonitorReports: exported.loans.loanMonitorReports.length,
          monitorEntries: exported.loans.loanMonitorReports.reduce((sum, report) => sum + report.entries.length, 0),
          importedHistoricalReports: exported.loans.importedHistoricalReports.length,
          importedHistoricalEntries: exported.loans.importedHistoricalReports.reduce((sum, report) => sum + report.entries.length, 0),
        },
      },
    ];

    const manifestFiles = files.map(({ name, payload, counts }) => {
      const content = `${JSON.stringify(payload, null, 2)}\n`;
      return {
        name,
        content,
        sha256: sha256(content),
        counts,
      };
    });
    const manifest = {
      format: "sss-report-logical-backup-manifest/v1",
      capturedAt,
      source,
      schema: { file: "sss-reports-source-schema.prisma", sha256: sha256(schema) },
      exports: manifestFiles.map(({ name, sha256: checksum, counts }) => ({ file: name, sha256: checksum, counts })),
    };
    const manifestContent = `${JSON.stringify(manifest, null, 2)}\n`;
    const outputs = [
      ...manifestFiles.map(({ name, content }) => ({ name, content })),
      { name: "sss-reports-source-schema.prisma", content: schema },
      { name: "sss-reports-backup-manifest.json", content: manifestContent },
    ];

    for (const output of outputs) {
      const temporaryPath = path.join(outputDirectory, `.${output.name}.${process.pid}.tmp`);
      await writeFile(temporaryPath, output.content, { flag: "wx" });
      temporaryFiles.push(temporaryPath);
      const written = await readFile(temporaryPath, "utf8");
      if (written !== output.content) throw new Error(`Backup verification failed for ${output.name}.`);
      if (output.name.endsWith(".json")) JSON.parse(written);
    }
    for (const output of outputs) {
      const temporaryPath = path.join(outputDirectory, `.${output.name}.${process.pid}.tmp`);
      const finalPath = path.join(outputDirectory, output.name);
      await rename(temporaryPath, finalPath);
      temporaryFiles.splice(temporaryFiles.indexOf(temporaryPath), 1);
      publishedFiles.push(finalPath);
    }
    completed = true;

    console.log("Created logical SSS report backups; database contents were read only.");
    console.log(JSON.stringify({
      source,
      outputDirectory,
      schemaSha256: sha256(schema),
      exports: manifest.exports,
    }, null, 2));
  } finally {
    await client.$disconnect();
    for (const file of temporaryFiles) await rm(file, { force: true });
    if (!completed) {
      for (const file of publishedFiles) await rm(file, { force: true });
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "SSS report backup export failed.");
  process.exitCode = 1;
});
