import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";
import { isPageAccessHref, type PageAccessHref } from "@/lib/pageAccess";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const adminId = getAuthenticatedUserId(req);
  if (adminId === null) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { role: true },
  });
  if (admin?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const userId = Number((await params).id);
  const body = await req.json();
  if (!Number.isInteger(userId) || !body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid user update" }, { status: 400 });
  }

  const hasEmailVerification = typeof body.emailVerified === "boolean";
  const hasPageAccess = Object.prototype.hasOwnProperty.call(body, "accessiblePages");
  if (!hasEmailVerification && !hasPageAccess) {
    return NextResponse.json({ error: "Invalid user update" }, { status: 400 });
  }

  let accessiblePages: PageAccessHref[] | undefined;
  if (hasPageAccess) {
    if (
      !Array.isArray(body.accessiblePages)
      || body.accessiblePages.length === 0
      || body.accessiblePages.some((page: unknown) => !isPageAccessHref(page))
      || new Set(body.accessiblePages).size !== body.accessiblePages.length
    ) {
      return NextResponse.json({ error: "Select at least one valid page access option" }, { status: 400 });
    }
    accessiblePages = body.accessiblePages as PageAccessHref[];
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(hasEmailVerification ? { emailVerified: body.emailVerified } : {}),
      ...(accessiblePages ? {
        accessiblePages,
        canAccessEmployees: accessiblePages.includes("/employees"),
      } : {}),
      ...(body.emailVerified
        ? { verificationTokenHash: null, verificationTokenExpires: null }
        : {}),
    },
    select: { id: true, emailVerified: true, accessiblePages: true, canAccessEmployees: true },
  });

  return NextResponse.json({ user });
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const adminId = getAuthenticatedUserId(req);
  if (adminId === null) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { role: true },
  });
  if (admin?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const userId = Number((await params).id);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }
  if (userId === adminId) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 409 });
  }

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const target = await transaction.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true },
      });
      if (!target) return { error: "User not found", status: 404 } as const;

      if (target.role === "ADMIN") {
        const adminCount = await transaction.user.count({ where: { role: "ADMIN" } });
        if (adminCount <= 1) {
          return { error: "The last administrator account cannot be deleted", status: 409 } as const;
        }
      }

      await transaction.post.deleteMany({ where: { authorId: userId } });
      await transaction.user.delete({ where: { id: userId } });
      return { deletedUserId: userId, email: target.email } as const;
    }, { isolationLevel: "Serializable" });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ user: result });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return NextResponse.json(
        { error: "User or administrator records changed during deletion. Reload and try again." },
        { status: 409 },
      );
    }
    throw error;
  }
}
