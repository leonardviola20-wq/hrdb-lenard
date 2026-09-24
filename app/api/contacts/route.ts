import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

async function isAdmin(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (userId === null) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function GET(req: NextRequest) {
  if (getAuthenticatedUserId(req) === null) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const contacts = await prisma.officeContact.findMany({
    where: { active: true },
    orderBy: [{ companyName: "asc" }, { contactName: "asc" }],
  });
  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const body = await req.json();
  const companyName = typeof body.companyName === "string" ? body.companyName.trim() : "";
  const contactName = typeof body.contactName === "string" ? body.contactName.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  if (!companyName || !contactName || !category) {
    return NextResponse.json({ error: "Company, contact, and category are required" }, { status: 400 });
  }
  if (companyName.length > 120 || contactName.length > 120 || category.length > 60) {
    return NextResponse.json({ error: "Contact details are too long" }, { status: 400 });
  }
  const contact = await prisma.officeContact.create({
    data: {
      companyName,
      contactName,
      category,
      phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
      email: typeof body.email === "string" ? body.email.trim() || null : null,
      address: typeof body.address === "string" ? body.address.trim() || null : null,
      services: typeof body.services === "string" ? body.services.trim() || null : null,
      branch: typeof body.branch === "string" ? body.branch.trim() || null : null,
      notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
    },
  });
  return NextResponse.json({ contact }, { status: 201 });
}
