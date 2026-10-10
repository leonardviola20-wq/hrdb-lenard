import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_IMPORT_ROWS = 1000;
const endedStatuses = new Set(["Contractual", "End of contract", "Resigned", "Terminated", "AWOL"]);

type ImportRow = Record<string, unknown>;

type ParsedRow = {
  line: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  dateOfBirth: Date | null;
  age: number | null;
  maritalStatus: string | null;
  gender: string | null;
  mobileNumber: string | null;
  email: string | null;
  address: string | null;
  emergencyName: string | null;
  emergencyNumber: string | null;
  emergencyRelation: string | null;
  emergencyAddress: string | null;
  biometricNo: string | null;
  employerName: string | null;
  status: string | null;
  dateStarted: Date | null;
  endDate: Date | null;
  sssNumber: string | null;
  pagIbigNumber: string | null;
  philHealth: string | null;
  tinNumber: string | null;
  remarks: string | null;
  branch: string | null;
  position: string | null;
};

function readString(row: ImportRow, field: string): string | null {
  const value = row[field];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function readDate(row: ImportRow, field: string): { value: Date | null; invalid: boolean } {
  const text = readString(row, field);
  if (!text) return { value: null, invalid: false };
  const date = new Date(`${text.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return { value: null, invalid: true };
  return { value: date, invalid: false };
}

function duplicateKey(firstName: string, lastName: string, dateOfBirth: Date | null) {
  return `${firstName.toLowerCase()}|${lastName.toLowerCase()}|${dateOfBirth ? dateOfBirth.toISOString().slice(0, 10) : ""}`;
}

export async function POST(req: NextRequest) {
  const session = getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const rows: unknown = body?.employees;
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "CSV must include at least one employee row" }, { status: 400 });
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    return NextResponse.json({ error: `Import up to ${MAX_IMPORT_ROWS} employees at a time` }, { status: 400 });
  }

  const rowErrors: string[] = [];
  const parsedRows: ParsedRow[] = [];

  rows.forEach((raw, index) => {
    const line = index + 2; // Header occupies line 1 of the CSV file.
    if (typeof raw !== "object" || raw === null) {
      rowErrors.push(`Row ${line}: not a valid row.`);
      return;
    }
    const row = raw as ImportRow;
    const firstName = readString(row, "firstName");
    const lastName = readString(row, "lastName");
    if (!firstName || !lastName) {
      rowErrors.push(`Row ${line}: first name and last name are required.`);
      return;
    }

    const dateOfBirth = readDate(row, "dateOfBirth");
    const dateStarted = readDate(row, "dateStarted");
    const endDateInput = readDate(row, "endDate");
    if (dateOfBirth.invalid || dateStarted.invalid || endDateInput.invalid) {
      rowErrors.push(`Row ${line}: enter valid dates in YYYY-MM-DD format.`);
      return;
    }

    const status = readString(row, "status");
    const endDate = endedStatuses.has(status || "") ? endDateInput.value : null;
    const biometricNo = readString(row, "biometricNo");
    if (!biometricNo) {
      rowErrors.push(`Row ${line}: biometric number is required.`);
      return;
    }

    const ageText = readString(row, "age");
    let age: number | null = null;
    if (ageText) {
      const value = Number(ageText);
      if (!Number.isInteger(value) || value < 0 || value > 130) {
        rowErrors.push(`Row ${line}: age must be a whole number between 0 and 130.`);
        return;
      }
      age = value;
    }

    parsedRows.push({
      line,
      firstName,
      middleName: readString(row, "middleName"),
      lastName,
      dateOfBirth: dateOfBirth.value,
      age,
      maritalStatus: readString(row, "maritalStatus"),
      gender: readString(row, "gender"),
      mobileNumber: readString(row, "mobileNumber"),
      email: readString(row, "email"),
      address: readString(row, "address"),
      emergencyName: readString(row, "emergencyName"),
      emergencyNumber: readString(row, "emergencyNumber"),
      emergencyRelation: readString(row, "emergencyRelation"),
      emergencyAddress: readString(row, "emergencyAddress"),
      biometricNo,
      employerName: readString(row, "employer"),
      status,
      dateStarted: dateStarted.value,
      endDate,
      sssNumber: readString(row, "sssNumber"),
      pagIbigNumber: readString(row, "pagIbigNumber"),
      philHealth: readString(row, "philHealth"),
      tinNumber: readString(row, "tinNumber"),
      remarks: readString(row, "remarks"),
      branch: readString(row, "branch"),
      position: readString(row, "position"),
    });
  });

  if (rowErrors.length > 0) {
    return NextResponse.json({ error: "Fix the rows below and try again.", rowErrors }, { status: 400 });
  }

  try {
    const existingEmployees = await prisma.employee.findMany({
      select: { firstName: true, lastName: true, dateOfBirth: true, biometricNo: true },
    });
    const seenNames = new Set(
      existingEmployees.map((employee) => duplicateKey(employee.firstName, employee.lastName, employee.dateOfBirth))
    );
    const seenBiometricNumbers = new Set(
      existingEmployees.map((employee) => employee.biometricNo?.trim() || "").filter(Boolean)
    );

    const employerNames = [...new Set(parsedRows.map((row) => row.employerName).filter((name): name is string => Boolean(name)))];
    const employers = employerNames.length > 0
      ? await prisma.employer.findMany({ where: { name: { in: employerNames } }, select: { id: true, name: true } })
      : [];
    const employerIdByName = new Map(employers.map((employer) => [employer.name, employer.id]));
    const unmatchedEmployers = employerNames.filter((name) => !employerIdByName.has(name));

    let created = 0;
    await prisma.$transaction(
      async (tx) => {
        for (const row of parsedRows) {
          const nameKey = duplicateKey(row.firstName, row.lastName, row.dateOfBirth);
          const biometricKey = row.biometricNo || "";
          if (seenNames.has(nameKey) || (biometricKey && seenBiometricNumbers.has(biometricKey))) continue;

          const employee = await tx.employee.create({
            data: {
              employeeCode: `PENDING-${crypto.randomUUID()}`,
              firstName: row.firstName,
              middleName: row.middleName,
              lastName: row.lastName,
              dateOfBirth: row.dateOfBirth,
              age: row.age,
              maritalStatus: row.maritalStatus,
              gender: row.gender,
              mobileNumber: row.mobileNumber,
              email: row.email,
              address: row.address,
              emergencyName: row.emergencyName,
              emergencyNumber: row.emergencyNumber,
              emergencyRelation: row.emergencyRelation,
              emergencyAddress: row.emergencyAddress,
              biometricNo: row.biometricNo,
              employerId: row.employerName ? employerIdByName.get(row.employerName) ?? null : null,
              status: row.status,
              dateStarted: row.dateStarted,
              endDate: row.endDate,
              sssNumber: row.sssNumber,
              pagIbigNumber: row.pagIbigNumber,
              philHealth: row.philHealth,
              tinNumber: row.tinNumber,
              remarks: row.remarks,
              branch: row.branch,
              position: row.position,
              assignedBy: String(session.id ?? session.email ?? "ADMIN"),
              assignedAt: new Date(),
            },
          });
          await tx.employee.update({
            where: { id: employee.id },
            data: { employeeCode: `EMP-${String(employee.id).padStart(5, "0")}` },
          });
          seenNames.add(nameKey);
          if (biometricKey) seenBiometricNumbers.add(biometricKey);
          created += 1;
        }
      },
      { timeout: 30_000, maxWait: 10_000 }
    );

    return NextResponse.json({ created, skipped: rows.length - created, unmatchedEmployers });
  } catch (error) {
    console.error("Import employees error:", error);
    return NextResponse.json({ error: "Unable to import employees" }, { status: 500 });
  }
}
