import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { canViewPage } from "@/lib/pageAccess";
import { countEmployeesMissingRequirements } from "@/lib/employeeRequirements";
import { prisma } from "@/lib/prisma";

const activeStatuses = ["Regular", "Contractual", "Trainee", "Leave"];

export async function GET(req: NextRequest) {
  const session = getAuthenticatedSession(req);
  if (!session || typeof session.id !== "number") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { role: true, accessiblePages: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const canViewEmployees = canViewPage(user, "/employees");
  const canViewEmployers = canViewPage(user, "/employers");
  const canCreateTasks = canViewPage(user, "/tasks");
  const canViewAttendance = canViewPage(user, "/attendance");
  const canViewContacts = canViewPage(user, "/contacts");
  const canViewReports = canViewPage(user, "/reports/sss");

  try {
    const [totalEmployees, activeEmployees, traineeEmployees, newlyHired, branches, employers, recentEmployees, requirementEmployees] = await Promise.all([
      canViewEmployees ? prisma.employee.count() : Promise.resolve(null),
      canViewEmployees ? prisma.employee.count({ where: { status: { in: activeStatuses } } }) : Promise.resolve(null),
      canViewEmployees ? prisma.employee.count({ where: { status: "Trainee" } }) : Promise.resolve(null),
      canViewEmployees
        ? prisma.employee.count({ where: { dateStarted: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } })
        : Promise.resolve(null),
      canViewEmployees ? prisma.employee.findMany({ where: { branch: { not: null } }, distinct: ["branch"], select: { branch: true } }) : Promise.resolve(null),
      canViewEmployers ? prisma.employer.count() : Promise.resolve(null),
      canViewEmployees ? prisma.employee.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, firstName: true, lastName: true, branch: true },
      }) : Promise.resolve(null),
      canViewEmployees ? prisma.employee.findMany({
        select: {
          maritalStatus: true,
          requirementsBypassed: true,
          bdoAccountNumbers: { select: { id: true } },
          requirements: {
            where: { isComplete: true },
            select: { requirementKey: true },
          },
        },
      }) : Promise.resolve(null),
    ]);

    return NextResponse.json({
      totalEmployees,
      activeEmployees,
      inactiveEmployees: totalEmployees === null || activeEmployees === null ? null : totalEmployees - activeEmployees,
      traineeEmployees,
      newlyHired,
      branches: branches === null ? null : branches.filter((item) => item.branch?.trim()).length,
      employers,
      recentEmployees,
      employeesMissingRequirements: requirementEmployees === null
        ? null
        : countEmployeesMissingRequirements(requirementEmployees),
      canViewEmployees,
      canCreateTasks,
      canViewAttendance,
      canViewContacts,
      canViewEmployers,
      canViewReports,
      canAddContact: user.role === "ADMIN",
    });
  } catch (error) {
    console.error("Load dashboard stats error:", error);
    return NextResponse.json({ error: "Unable to load dashboard statistics" }, { status: 500 });
  }
}
