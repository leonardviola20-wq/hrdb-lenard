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
  try {
    const employer = await prisma.employer.update({ where: { id }, data: {
      name: body.name.trim(), company: text("tradeName"), branches: text("branchName"),
      status: text("status") || "Active", email: text("email"), contactNumber: text("contactNumber"),
      branchStatus: text("branchStatus") || "Open", president: text("president"), longAddress: text("longAddress"),
      shortAddress: text("shortAddress"), logo: text("logo"), secDti: text("secDti"), tin: text("tin"),
      sss: text("sss"), hdmf: text("hdmf"), phic: text("phic"),
      secDtiRegistrationDate: body.secDtiRegistrationDate ? new Date(String(body.secDtiRegistrationDate)) : null,
      tinRegistrationDate: body.tinRegistrationDate ? new Date(String(body.tinRegistrationDate)) : null,
      sssRegistrationDate: body.sssRegistrationDate ? new Date(String(body.sssRegistrationDate)) : null,
      hdmfRegistrationDate: body.hdmfRegistrationDate ? new Date(String(body.hdmfRegistrationDate)) : null,
      phicRegistrationDate: body.phicRegistrationDate ? new Date(String(body.phicRegistrationDate)) : null,
    }, include: { _count: { select: { employees: true } } } });
    return NextResponse.json({ employer });
  } catch (error) {
    console.error("Update employer error:", error);
    return NextResponse.json({ error: "Unable to update employer" }, { status: 500 });
  }
}
