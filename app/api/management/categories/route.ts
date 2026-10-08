import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const categoryTypes = ["BRANCH", "POSITION", "EMPLOYMENT_STATUS"] as const;
type CategoryType = (typeof categoryTypes)[number];

function isCategoryType(value: unknown): value is CategoryType {
  return typeof value === "string" && categoryTypes.includes(value as CategoryType);
}

function requireAdmin(request: NextRequest) {
  const session = getAuthenticatedSession(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  return null;
}

export async function GET(request: NextRequest) {
  const session = getAuthenticatedSession(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "ADMIN") {
    if (typeof session.id !== "number") return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: session.id }, select: { accessiblePages: true } });
    if (!user?.accessiblePages.includes("/employees")) {
      return NextResponse.json({ error: "Employee access required" }, { status: 403 });
    }
  }

  try {
    const categories = await prisma.employeeCategory.findMany({
      where: session.role === "ADMIN" ? undefined : { active: true },
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Load employee categories error:", error);
    return NextResponse.json({ error: "Unable to load categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null) as { type?: unknown; name?: unknown } | null;
  const type = body?.type;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!isCategoryType(type)) return NextResponse.json({ error: "Select a valid category type" }, { status: 400 });
  if (!name || name.length > 100) return NextResponse.json({ error: "Category name must be between 1 and 100 characters" }, { status: 400 });

  try {
    const existing = await prisma.employeeCategory.findFirst({ where: { type, name } });
    if (existing) {
      if (!existing.active) {
        const category = await prisma.employeeCategory.update({ where: { id: existing.id }, data: { active: true } });
        return NextResponse.json({ category, restored: true });
      }
      return NextResponse.json({ error: "That category already exists" }, { status: 409 });
    }

    const lastCategory = await prisma.employeeCategory.findFirst({ where: { type }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
    const category = await prisma.employeeCategory.create({
      data: { type, name, sortOrder: (lastCategory?.sortOrder ?? -1) + 1 },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Create employee category error:", error);
    return NextResponse.json({ error: "Unable to add category" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null) as { id?: unknown; active?: unknown } | null;
  const id = Number(body?.id);
  if (!Number.isInteger(id) || id < 1 || typeof body?.active !== "boolean") {
    return NextResponse.json({ error: "A valid category and active state are required" }, { status: 400 });
  }

  try {
    const category = await prisma.employeeCategory.update({ where: { id }, data: { active: body.active } });
    return NextResponse.json({ category });
  } catch (error) {
    console.error("Update employee category error:", error);
    return NextResponse.json({ error: "Unable to update category" }, { status: 500 });
  }
}
