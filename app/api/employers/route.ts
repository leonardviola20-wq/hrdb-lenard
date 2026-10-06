import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const text = (body: Record<string, unknown>, field: string) => typeof body[field] === "string" ? body[field].trim() || null : null;
const date = (body: Record<string, unknown>, field: string) => {
  const value = text(body, field);
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export async function GET(req: NextRequest) {
  const session = getAuthenticatedSession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "ADMIN") {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { accessiblePages: true },
    });
    if (!user?.accessiblePages.some((page) => page === "/employers" || page === "/employees")) {
      return NextResponse.json({ error: "Employees access required" }, { status: 403 });
    }
  }
  try {
    const employers = await prisma.employer.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { employees: true } } },
    });
    return NextResponse.json({ employers });
  } catch (error) {
    console.error("Load employers error:", error);
    const details = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({
      error: process.env.NODE_ENV === "development" ? details : "Unable to load employers",
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = getAuthenticatedSession(req);
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const body = await req.json();
  if (typeof body.name !== "string" || !body.name.trim()) return NextResponse.json({ error: "Employer name is required" }, { status: 400 });
  const secDti = typeof body.secDti === "string" ? body.secDti.trim().toUpperCase() : "";
  if (!secDti) return NextResponse.json({ error: "SEC / DTI registration number is required" }, { status: 400 });
  try {
    const existingNumbers = await prisma.employer.findMany({ select: { id: true, secDti: true } });
    if (existingNumbers.some((employer) => employer.secDti?.trim().toUpperCase() === secDti)) {
      return NextResponse.json({ error: "An employer with this SEC / DTI registration number already exists" }, { status: 409 });
    }
    const employer = await prisma.employer.create({ data: {
      name: body.name.trim(), company: text(body, "tradeName"), branches: text(body, "branchName"), status: text(body, "status") || "Active",
      email: text(body, "email"), contactNumber: text(body, "contactNumber"), branchStatus: text(body, "branchStatus") || "Open",
      president: text(body, "president"), longAddress: text(body, "longAddress"), shortAddress: text(body, "shortAddress"), logo: text(body, "logo"),
      secDti, tin: text(body, "tin"), sss: text(body, "sss"), hdmf: text(body, "hdmf"), phic: text(body, "phic"),
      secDtiRegistrationDate: date(body, "secDtiRegistrationDate"),
      tinRegistrationDate: date(body, "tinRegistrationDate"),
      sssRegistrationDate: date(body, "sssRegistrationDate"),
      hdmfRegistrationDate: date(body, "hdmfRegistrationDate"),
      phicRegistrationDate: date(body, "phicRegistrationDate"),
    }, include: { _count: { select: { employees: true } } } });
    return NextResponse.json({ employer }, { status: 201 });
  } catch (error) {
    console.error("Create employer error:", error);
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "An employer with this SEC / DTI registration number already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to create employer" }, { status: 500 });
  }
}
