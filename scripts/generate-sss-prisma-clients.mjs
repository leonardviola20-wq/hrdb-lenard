import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "dotenv";

const root = process.cwd();
const fileEnvironment = [".env", ".env.local"]
  .filter((file) => existsSync(path.join(root, file)))
  .map((file) => parse(readFileSync(path.join(root, file), "utf8")))
  .reduce((environment, current) => ({ ...environment, ...current }), {});
const environment = { ...fileEnvironment, ...process.env };
const sourceUrl = environment.DATABASE_URL;
if (!sourceUrl) throw new Error("DATABASE_URL must be configured before generating Prisma clients.");

function targetUrl(variable, databaseName) {
  const configuredUrl = environment[variable];
  if (configuredUrl) {
    const configuredDatabase = decodeURIComponent(new URL(configuredUrl).pathname.slice(1));
    if (configuredDatabase !== databaseName) {
      throw new Error(`${variable} must point to the ${databaseName} database.`);
    }
    return configuredUrl;
  }
  const url = new URL(sourceUrl);
  url.pathname = `/${databaseName}`;
  return url.toString();
}

const contributionsUrl = targetUrl("SSS_CONTRIBUTIONS_DATABASE_URL", "hrdb_sss_contributions");
const loansUrl = targetUrl("SSS_LOANS_DATABASE_URL", "hrdb_sss_loans");
const prismaCli = path.join(root, "node_modules", "prisma", "build", "index.js");

for (const [schema, variables] of [
  ["prisma/sss-reports/schema.prisma", { SSS_REPORTS_DATABASE_URL: contributionsUrl }],
  ["prisma/sss-loans/schema.prisma", { SSS_LOANS_DATABASE_URL: loansUrl }],
]) {
  execFileSync(process.execPath, [prismaCli, "generate", "--schema", schema], {
    cwd: root,
    env: { ...environment, ...variables },
    stdio: "inherit",
  });
}
