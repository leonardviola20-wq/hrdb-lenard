import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { toCsv } from "@/lib/csv";

const activeStatuses = ["Regular", "Contractual", "Trainee", "Leave"];
const maxUploadSize = 10 * 1024 * 1024;

type ParsedPunch = { biometricNo: string; date: Date; dateText: string; time: string; deviceNumber: string };

function getDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

async function canAccessAttendance(req: NextRequest) {
  const session = getAuthenticatedSession(req);
  if (!session) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  if (session.role !== "ADMIN") {
    const user = await prisma.user.findUnique({ where: { id: session.id }, select: { accessiblePages: true } });
    if (!user?.accessiblePages.includes("/attendance")) {
      return { error: NextResponse.json({ error: "Attendance access required" }, { status: 403 }) };
    }
  }
  return { session };
}

function splitRow(line: string, delimiter: string) {
  const fields: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      fields.push(field.trim());
      field = "";
    } else {
      field += character;
    }
  }
  fields.push(field.trim());
  return fields;
}

function parseDeviceFile(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  // ZKTeco-style export: "No | Mchn | EnNo | Name | Mode | IOMd | DateTime" (e.g. 005_GLog.txt).
  const glogHeader = (lines[0] ?? "").split(String.fromCharCode(9));
  if (glogHeader[0] === "No" && glogHeader[1] === "Mchn" && glogHeader[2] === "EnNo") {
    return parseGlogFile(lines);
  }

  const sampleLine = lines.find((line) => !/^\s*(biometric|employee|user)/i.test(line)) ?? lines[0] ?? "";
  const delimiter = sampleLine.includes("\t") ? "\t" : sampleLine.includes(",") ? "," : ";";
  const records: ParsedPunch[] = [];
  let skippedRows = 0;

  for (const line of lines) {
    const fields = splitRow(line, delimiter);
    const biometricNo = fields[0]?.trim();
    if (/^(biometric|employee|user)/i.test(biometricNo ?? "")) continue;
    const timestamp = fields[1]?.trim().replace("T", " ");
    const deviceNumber = fields[2]?.trim();
    const timestampMatch = timestamp?.match(/^(\d{4}-\d{2}-\d{2})\s+([0-2]?\d:[0-5]\d(?::[0-5]\d)?)$/);
    if (!biometricNo || !timestampMatch || !deviceNumber) {
      skippedRows += 1;
      continue;
    }
    const date = getDate(timestampMatch[1]);
    const timeParts = timestampMatch[2].split(":").map(Number);
    if (!date || timeParts[0] > 23 || timeParts[1] > 59 || (timeParts[2] ?? 0) > 59) {
      skippedRows += 1;
      continue;
    }
    records.push({
      biometricNo,
      date,
      dateText: timestampMatch[1],
      time: `${String(timeParts[0]).padStart(2, "0")}:${String(timeParts[1]).padStart(2, "0")}:${String(timeParts[2] ?? 0).padStart(2, "0")}`,
      deviceNumber,
    });
  }
  return { records, skippedRows, error: null };
}

// Parses the tab-delimited "No | Mchn | EnNo | Name | Mode | IOMd | DateTime" export.
// Mode/IOMd are device state codes; the pipeline derives in/out from the first/last
// punch, so those columns are intentionally skipped.
function parseGlogFile(lines: string[]) {
  const records: ParsedPunch[] = [];
  let skippedRows = 0;
  for (let index = 1; index < lines.length; index += 1) {
    const fields = lines[index].split("\t");
    const deviceNumber = fields[1]?.trim();
    const biometricNo = fields[2]?.trim();
    const timestamp = fields[6]?.trim();
    const match = timestamp?.match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}:\d{2}:\d{2})$/);
    if (!biometricNo || !deviceNumber || !match) {
      skippedRows += 1;
      continue;
    }
    const dateText = `${match[1]}-${match[2]}-${match[3]}`;
    const date = getDate(dateText);
    const timeParts = match[4].split(":").map(Number);
    if (!date || timeParts[0] > 23 || timeParts[1] > 59 || timeParts[2] > 59) {
      skippedRows += 1;
      continue;
    }
    records.push({
      biometricNo,
      date,
      dateText,
      time: `${String(timeParts[0]).padStart(2, "0")}:${String(timeParts[1]).padStart(2, "0")}:${String(timeParts[2]).padStart(2, "0")}`,
      deviceNumber,
    });
  }
  return { records, skippedRows, error: null };
}

function isExcelFile(data: Uint8Array, fileName: string) {
  const oleBinary = data[0] === 0xd0 && data[1] === 0xcf && data[2] === 0x11 && data[3] === 0xe0;
  const zipBinary = data[0] === 0x50 && data[1] === 0x4b;
  return oleBinary || zipBinary || /\.xlsx?$/i.test(fileName);
}

// Parses the "Attendance Record" Excel layout: rows of Employee ID / Name / Department
// followed by day-of-month columns (period read from the "Made Date:" row) whose cells
// contain one punch time (HH:MM) per line.
function parseExcelPunchFile(data: Uint8Array): { records: ParsedPunch[]; skippedRows: number; error: string | null } {
  try {
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.SheetNames.length > 0 ? workbook.Sheets[workbook.SheetNames[0]] : undefined;
    if (!sheet || !sheet["!ref"]) {
      return { records: [], skippedRows: 0, error: "The Excel file has no readable sheet." };
    }

    const range = XLSX.utils.decode_range(sheet["!ref"]);
    const cellText = (row: number, column: number) => {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })];
      if (!cell) return "";
      if (cell.w !== undefined) return String(cell.w).trim();
      return cell.v === undefined || cell.v === null ? "" : String(cell.v).trim();
    };

    let headerRow = -1;
    let madeDate = "";
    for (let row = range.s.r; row <= range.e.r; row += 1) {
      const first = cellText(row, 0);
      if (/^made date:/i.test(first)) madeDate = first;
      if (/^employee id$/i.test(first)) {
        headerRow = row;
        break;
      }
    }
    if (headerRow === -1) {
      return { records: [], skippedRows: 0, error: "Expected an \"Employee ID\" header row in the Excel file." };
    }

    const periodMatch = madeDate.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})-(\d{4})\/(\d{1,2})\/(\d{1,2})/);
    if (!periodMatch) {
      return { records: [], skippedRows: 0, error: "Expected a \"Made Date:\" period row above the header in the Excel file." };
    }
    const year = Number(periodMatch[1]);
    const month = Number(periodMatch[2]);

    const dayColumns: { column: number; dateText: string; date: Date | null }[] = [];
    for (let column = 3; column <= range.e.c; column += 1) {
      const header = cellText(headerRow, column);
      if (!/^\d{1,2}$/.test(header)) continue;
      const day = Number(header);
      if (day < 1 || day > 31) continue;
      const dateText = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      dayColumns.push({ column, dateText, date: getDate(dateText) });
    }

    const records: ParsedPunch[] = [];
    let skippedRows = 0;
    for (let row = headerRow + 1; row <= range.e.r; row += 1) {
      const biometricNo = cellText(row, 0);
      if (!biometricNo || /^employee id$/i.test(biometricNo)) continue;
      for (const dayColumn of dayColumns) {
        const cell = cellText(row, dayColumn.column);
        if (!cell) continue;
        for (const token of cell.split(/[\r\n]+/).map((value) => value.trim()).filter(Boolean)) {
          const timeMatch = token.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
          const hour = timeMatch ? Number(timeMatch[1]) : -1;
          const minute = timeMatch ? Number(timeMatch[2]) : -1;
          if (!dayColumn.date || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
            skippedRows += 1;
            continue;
          }
          records.push({
            biometricNo,
            date: dayColumn.date,
            dateText: dayColumn.dateText,
            time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
            deviceNumber: "1",
          });
        }
      }
    }
    return { records, skippedRows, error: null };
  } catch {
    return { records: [], skippedRows: 0, error: "Unable to read the Excel file. Upload a valid .xls or .xlsx file." };
  }
}

export async function GET(req: NextRequest) {
  const access = await canAccessAttendance(req);
  if ("error" in access) return access.error;

  if (req.nextUrl.searchParams.get("format") === "csv") {
    try {
      const days = await prisma.attendance.findMany({
        orderBy: [{ date: "asc" }, { employeeId: "asc" }],
        select: {
          date: true,
          timeIn: true,
          timeOut: true,
          status: true,
          branch: true,
          punches: { select: { time: true }, orderBy: { time: "asc" } },
          employee: { select: { biometricNo: true, firstName: true, middleName: true, lastName: true, branch: true, position: true } },
        },
      });
      const rows = [["biometricNo", "firstName", "middleName", "lastName", "branch", "position", "date", "timeIn", "timeOut", "status", "punches"]];
      for (const day of days) {
        rows.push([
          day.employee.biometricNo ?? "",
          day.employee.firstName,
          day.employee.middleName ?? "",
          day.employee.lastName,
          day.employee.branch ?? day.branch ?? "",
          day.employee.position ?? "",
          day.date.toISOString().slice(0, 10),
          day.timeIn ?? "",
          day.timeOut ?? "",
          day.status,
          day.punches.map((punch) => punch.time).join(";"),
        ]);
      }
      const csv = "\uFEFF" + toCsv(rows);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="attendance-backup-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    } catch (error) {
      console.error("Backup attendance error:", error);
      return NextResponse.json({ error: "Unable to back up attendance records" }, { status: 500 });
    }
  }

  const fromValue = req.nextUrl.searchParams.get("from");
  const toValue = req.nextUrl.searchParams.get("to");
  if (fromValue || toValue) {
    const from = getDate(fromValue);
    const to = getDate(toValue);
    if (!from || !to || from > to) {
      return NextResponse.json({ error: "Choose a valid date range. The start date must be on or before the end date." }, { status: 400 });
    }
    try {
      const records = await prisma.attendance.findMany({
        where: { date: { gte: from, lte: to } },
        orderBy: [{ date: "desc" }, { employee: { lastName: "asc" } }, { employee: { firstName: "asc" } }],
        select: {
          date: true,
          timeIn: true,
          timeOut: true,
          status: true,
          branch: true,
          punches: { select: { time: true, deviceNumber: true, branch: true }, orderBy: { time: "asc" } },
          employee: { select: { id: true, firstName: true, middleName: true, lastName: true, biometricNo: true, branch: true, position: true, status: true, employer: { select: { name: true, company: true } } } },
        },
      });
      return NextResponse.json({ records: records.map(({ employee, ...attendance }) => ({ ...employee, attendance })) });
    } catch (error) {
      console.error("Load attendance date range error:", error);
      return NextResponse.json({ error: "Unable to load attendance report" }, { status: 500 });
    }
  }

  const date = getDate(req.nextUrl.searchParams.get("date"));
  if (!date) return NextResponse.json({ error: "Choose a valid attendance date" }, { status: 400 });

  try {
    const [employees, imports, importTotals] = await Promise.all([
      prisma.employee.findMany({
        where: {
          OR: [
            { status: { in: activeStatuses } },
            { attendanceRecords: { some: { date } } },
          ],
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          biometricNo: true,
          branch: true,
          position: true,
          employer: { select: { name: true, company: true } },
          status: true,
          attendanceRecords: {
            where: { date },
            select: {
              id: true,
              date: true,
              timeIn: true,
              timeOut: true,
              status: true,
              branch: true,
              punches: { select: { time: true, deviceNumber: true, branch: true }, orderBy: { time: "asc" } },
            },
            take: 1,
          },
        },
      }),
      prisma.attendanceImport.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, branch: true, fileName: true, totalRows: true, importedRows: true, duplicateRows: true, unmatchedRows: true, createdAt: true },
      }),
      prisma.attendanceImport.aggregate({ _sum: { importedRows: true } }),
    ]);

    return NextResponse.json({
      employees: employees.map(({ attendanceRecords, ...employee }) => ({
        ...employee,
        attendance: attendanceRecords[0] ?? null,
      })),
      imports,
      totalImported: importTotals._sum.importedRows ?? 0,
    });
  } catch (error) {
    console.error("Load attendance error:", error);
    return NextResponse.json({ error: "Unable to load attendance records" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const access = await canAccessAttendance(req);
  if ("error" in access) return access.error;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Choose an attendance export file" }, { status: 400 });
  }
  const file = formData.get("file");
  if (!file || typeof file === "string" || !file.name) {
    return NextResponse.json({ error: "Choose an attendance export file" }, { status: 400 });
  }
  if (file.size > maxUploadSize) {
    return NextResponse.json({ error: "Attendance export must be 10 MB or smaller" }, { status: 413 });
  }

  const fileName = file.name.slice(0, 255);
  const data = new Uint8Array(await file.arrayBuffer());
  const excel = isExcelFile(data, fileName);
  const parsed = excel
    ? parseExcelPunchFile(data)
    : parseDeviceFile(new TextDecoder().decode(data));
  if (parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { records, skippedRows } = parsed;
  if (records.length === 0) {
    return NextResponse.json({
      error: excel
        ? "No punch rows found in the Excel file. Expected an Attendance Record sheet with an Employee ID header and day columns."
        : "No valid punch rows found. Expected biometric number, date and time, and device number.",
    }, { status: 400 });
  }

  try {
    const biometricNos = [...new Set(records.map((record) => record.biometricNo))];
    const candidateBiometricNos = [...new Set([...biometricNos, ...biometricNos.map((biometricNo) => biometricNo.padStart(9, "0"))])];
    const employees = await prisma.employee.findMany({
      where: { biometricNo: { in: candidateBiometricNos } },
      select: { id: true, biometricNo: true, branch: true },
    });
    // Match on the stored value or its 9-digit padded form (Excel strips leading zeros).
    const employeesByBiometric = new Map<string, (typeof employees)[number]>();
    for (const employee of employees) {
      if (employee.biometricNo) {
        employeesByBiometric.set(employee.biometricNo, employee);
        employeesByBiometric.set(employee.biometricNo.padStart(9, "0"), employee);
      }
    }
    const resolveEmployee = (biometricNo: string) =>
      employeesByBiometric.get(biometricNo) ?? employeesByBiometric.get(biometricNo.padStart(9, "0"));
    const noBranchRecords = records.filter((record) => {
      const employee = resolveEmployee(record.biometricNo);
      return Boolean(employee && !employee.branch?.trim());
    });
    const noBranchBiometricNos = [...new Set(noBranchRecords.map((record) => record.biometricNo))];
    if (noBranchBiometricNos.length > 0) {
      return NextResponse.json({
        error: `Assign a branch to these employees before uploading: ${noBranchBiometricNos.slice(0, 20).join(", ")}`,
        noBranchBiometricNos,
      }, { status: 400 });
    }
    const matched = records.flatMap((record) => {
      const employee = resolveEmployee(record.biometricNo);
      return employee?.branch ? [{ ...record, employeeId: employee.id, branch: employee.branch.trim() }] : [];
    });
    const unmatchedRecords = records.filter((record) => !resolveEmployee(record.biometricNo));
    const unmatchedBiometricNos = [...new Set(unmatchedRecords.map((record) => record.biometricNo))];
    const groups = new Map<string, typeof matched>();
    for (const record of matched) {
      const key = `${record.employeeId}:${record.dateText}`;
      groups.set(key, [...(groups.get(key) ?? []), record]);
    }

    const result = await prisma.$transaction(async (tx) => {
      const importBatch = await tx.attendanceImport.create({
        data: {
          branch: [...new Set(matched.map((record) => record.branch))].sort().join(", ") || "No matched employees",
          fileName,
          totalRows: records.length + skippedRows,
          importedRows: 0,
          duplicateRows: 0,
          unmatchedRows: unmatchedRecords.length,
        },
      });
      const batchRows = [...groups.values()].flat();
      const attendanceByGroup = new Map<string, number>();

      for (const [key, group] of groups) {
        const first = group[0];
        const times = group.map((record) => record.time).sort();
        const groupBranches = [...new Set(group.map((record) => record.branch))].sort().join(", ");
        const attendance = await tx.attendance.upsert({
          where: { employeeId_date: { employeeId: first.employeeId, date: first.date } },
          create: {
            employeeId: first.employeeId,
            date: first.date,
            timeIn: times[0],
            timeOut: times.length > 1 ? times[times.length - 1] : null,
            status: "PRESENT",
            branch: groupBranches,
          },
          update: { timeIn: times[0], timeOut: times.length > 1 ? times[times.length - 1] : null, status: "PRESENT", branch: groupBranches },
          select: { id: true },
        });
        attendanceByGroup.set(key, attendance.id);
      }

      const inserted = await tx.attendancePunch.createMany({
        data: batchRows.map((record) => ({
          employeeId: record.employeeId,
          attendanceId: attendanceByGroup.get(`${record.employeeId}:${record.dateText}`)!,
          importId: importBatch.id,
          date: record.date,
          time: record.time,
          deviceNumber: record.deviceNumber,
          branch: record.branch,
        })),
        skipDuplicates: true,
      });

      for (const [key, group] of groups) {
        const first = group[0];
        const storedPunches = await tx.attendancePunch.findMany({
          where: { employeeId: first.employeeId, date: first.date },
          select: { time: true, branch: true },
          orderBy: { time: "asc" },
        });
        if (storedPunches.length > 0) {
          await tx.attendance.update({
            where: { id: attendanceByGroup.get(key)! },
            data: {
              timeIn: storedPunches[0].time,
              timeOut: storedPunches.length > 1 ? storedPunches[storedPunches.length - 1].time : null,
              branch: [...new Set(storedPunches.map((punch) => punch.branch))].sort().join(", "),
            },
          });
        }
      }

      const duplicateRows = batchRows.length - inserted.count;
      const importRecord = await tx.attendanceImport.update({
        where: { id: importBatch.id },
        data: { importedRows: inserted.count, duplicateRows },
      });
      return { importRecord, importedRows: inserted.count, duplicateRows };
    }, { timeout: 60_000, maxWait: 10_000 });

    return NextResponse.json({
      import: result.importRecord,
      importedRows: result.importedRows,
      duplicateRows: result.duplicateRows,
      unmatchedRows: unmatchedRecords.length,
      unmatchedBiometricNos: unmatchedBiometricNos.slice(0, 50),
      skippedRows,
    }, { status: 201 });
  } catch (error) {
    console.error("Import attendance error:", error);
    return NextResponse.json({ error: "Unable to import attendance records" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const access = await canAccessAttendance(req);
  if ("error" in access) return access.error;

  try {
    // Punches reference attendance days and import batches, so delete them first.
    const [punches, days, imports] = await prisma.$transaction([
      prisma.attendancePunch.deleteMany(),
      prisma.attendance.deleteMany(),
      prisma.attendanceImport.deleteMany(),
    ]);
    return NextResponse.json({
      deletedPunches: punches.count,
      deletedDays: days.count,
      deletedImports: imports.count,
      message: `Deleted ${punches.count} uploaded attendance records across ${days.count} day(s).`,
    });
  } catch (error) {
    console.error("Delete attendance error:", error);
    return NextResponse.json({ error: "Unable to delete attendance records" }, { status: 500 });
  }
}
