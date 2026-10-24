import { prisma } from "./lib/prisma";
async function main() {
  const reports = await prisma.philHealthReport.findMany({ select: { id: true, applicableMonth: true, applicableYear: true, amountDue: true }, orderBy: { id: "asc" } });
  console.log("reports:", JSON.stringify(reports));
  const entries = await prisma.philHealthReportEntry.findMany({ select: { id: true, reportId: true, employeeName: true, employeeCode: true, amount: true } });
  console.log("entries:", JSON.stringify(entries));
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
