import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getAuthenticatedSession(req);
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const id = Number((await params).id);
  const body = await req.json();
  if (!Number.isInteger(id) || typeof body.name !== "string" || !body.name.trim()) return NextResponse.json({ error: "Invalid employer update" }, { status: 400 });
  const text = (field: string) => typeof body[field] === "string" ? body[field].trim() || null : null;
  const date = (field: string) => {
    const value = text(field);
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  const secDti = typeof body.secDti === "string" ? body.secDti.trim().toUpperCase() : "";
  if (!secDti) return NextResponse.json({ error: "SEC / DTI registration number is required" }, { status: 400 });
  try {
    const existingNumbers = await prisma.employer.findMany({ where: { id: { not: id } }, select: { id: true, secDti: true } });
    if (existingNumbers.some((employer) => employer.secDti?.trim().toUpperCase() === secDti)) {
      return NextResponse.json({ error: "An employer with this SEC / DTI registration number already exists" }, { status: 409 });
    }
    const employer = await prisma.employer.update({ where: { id }, data: {
      name: body.name.trim(), company: text("tradeName"), branches: text("branchName"),
      status: text("status") || "Active", email: text("email"), contactNumber: text("contactNumber"),
      branchStatus: text("branchStatus") || "Open", president: text("president"), longAddress: text("longAddress"),
      shortAddress: text("shortAddress"), logo: text("logo"), secDti, tin: text("tin"),
      sss: text("sss"), hdmf: text("hdmf"), phic: text("phic"),
      secDtiRegistrationDate: date("secDtiRegistrationDate"),
      tinRegistrationDate: date("tinRegistrationDate"),
      sssRegistrationDate: date("sssRegistrationDate"),
      hdmfRegistrationDate: date("hdmfRegistrationDate"),
      phicRegistrationDate: date("phicRegistrationDate"),
    }, include: { _count: { select: { employees: true } } } });
    return NextResponse.json({ employer });
  } catch (error) {
    console.error("Update employer error:", error);
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "An employer with this SEC / DTI registration number already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to update employer" }, { status: 500 });
  }
}
