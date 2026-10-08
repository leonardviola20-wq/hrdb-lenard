import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

class TransferConflictError extends Error {}

export async function POST(request: NextRequest) {
  const session = getAuthenticatedSession(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid transfer request" }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;
  const rawEmployeeIds = payload.employeeIds;
  const rawBranch = payload.branch;
  const branch = typeof rawBranch === "string" ? rawBranch.trim() : "";
  const rawEmployerId = payload.employerId;
  if (!Array.isArray(rawEmployeeIds) || rawEmployeeIds.length === 0 || rawEmployeeIds.length > 500) {
    return NextResponse.json({ error: "Select between 1 and 500 unique employees" }, { status: 400 });
  }
  const employeeIds: number[] = [];
  for (const id of rawEmployeeIds as unknown[]) {
    if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Select between 1 and 500 unique employees" }, { status: 400 });
    }
    employeeIds.push(id);
  }
  if (new Set(employeeIds).size !== employeeIds.length) {
    return NextResponse.json({ error: "Select between 1 and 500 unique employees" }, { status: 400 });
  }
  if (rawBranch !== undefined && rawBranch !== null
    && (typeof rawBranch !== "string" || !branch || branch.length > 100)) {
    return NextResponse.json({ error: "A valid destination branch is required" }, { status: 400 });
  }
  if (rawEmployerId !== undefined && rawEmployerId !== null
    && (typeof rawEmployerId !== "number" || !Number.isInteger(rawEmployerId) || rawEmployerId <= 0)) {
    return NextResponse.json({ error: "A valid destination employer is required" }, { status: 400 });
  }
  if (!branch && (rawEmployerId === undefined || rawEmployerId === null)) {
    return NextResponse.json({ error: "Choose a destination branch, employer, or both" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (transaction) => {
      if (typeof rawEmployerId === "number") {
        const employer = await transaction.employer.findUnique({
          where: { id: rawEmployerId },
          select: { id: true },
        });
        if (!employer) return { error: "Destination employer not found", status: 400 as const };
      }

      const existingEmployees = await transaction.employee.findMany({
        where: { id: { in: employeeIds } },
        select: { id: true },
      });
      if (existingEmployees.length !== employeeIds.length) {
        return { error: "One or more selected employees no longer exist", status: 404 as const };
      }

      const assignment: { branch?: string; employerId?: number } = {};
      if (branch) assignment.branch = branch;
      if (typeof rawEmployerId === "number") assignment.employerId = rawEmployerId;
      const update = await transaction.employee.updateMany({
        where: { id: { in: employeeIds } },
        data: assignment,
      });
      if (update.count !== employeeIds.length) throw new TransferConflictError("Selected employees changed during transfer");
      return { updated: update.count };
    }, { isolationLevel: "Serializable" });

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ updated: result.updated });
  } catch (error) {
    if (error instanceof TransferConflictError) {
      return NextResponse.json({ error: "The selected employees changed during transfer. Please try again." }, { status: 409 });
    }
    console.error("Transfer employees error:", error);
    return NextResponse.json({ error: "Unable to transfer employees" }, { status: 500 });
  }
}
