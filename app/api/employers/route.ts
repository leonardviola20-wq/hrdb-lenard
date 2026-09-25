import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const text = (body: Record<string, unknown>, field: string) => typeof body[field] === "string" ? body[field].trim() || null : null;

export async function GET(req: NextRequest) {
  const session = getAuthenticatedSession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const employers = await prisma.employer.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { employees: true } } } });
  return NextResponse.json({ employers });
}

export async function POST(req: NextRequest) {
  const session = getAuthenticatedSession(req);
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const body = await req.json();
  if (typeof body.name !== "string" || !body.name.trim()) return NextResponse.json({ error: "Employer name is required" }, { status: 400 });
  try {
    const employer = await prisma.employer.create({ data: {
      name: body.name.trim(), company: text(body, "tradeName"), branches: text(body, "branchName"), status: text(body, "status") || "Active",
      email: text(body, "email"), contactNumber: text(body, "contactNumber"), branchStatus: text(body, "branchStatus") || "Open",
      president: text(body, "president"), longAddress: text(body, "longAddress"), shortAddress: text(body, "shortAddress"), logo: text(body, "logo"),
      secDti: text(body, "secDti"), tin: text(body, "tin"), sss: text(body, "sss"), hdmf: text(body, "hdmf"), phic: text(body, "phic"),
    }, include: { _count: { select: { employees: true } } } });
    return NextResponse.json({ employer }, { status: 201 });
  } catch (error) {
    console.error("Create employer error:", error);
    return NextResponse.json({ error: "Unable to create employer" }, { status: 500 });
  }
}
