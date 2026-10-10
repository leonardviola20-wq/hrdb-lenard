import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function nextBirthday(dateOfBirth: Date, today: Date, endDate: Date) {
  const month = dateOfBirth.getUTCMonth();
  const day = dateOfBirth.getUTCDate();
  const currentYear = today.getUTCFullYear();
  const dateForYear = (year: number) => {
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return new Date(Date.UTC(year, month, Math.min(day, lastDay)));
  };
  let year = currentYear;
  let date = dateForYear(year);

  if (date < today) {
    year += 1;
    date = dateForYear(year);
  }

  return date <= endDate ? date : null;
}

export async function GET(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (userId === null) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, accessiblePages: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const endDate = new Date(today);
    endDate.setUTCDate(endDate.getUTCDate() + 30);
    const endOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));

    const upcomingTasks = await prisma.task.findMany({
      where: {
        userId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        dueDate: { gte: today, lte: endDate },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: { id: true, title: true, dueDate: true, status: true, isFlagged: true },
    });

    const canViewBirthdays = user.role === "ADMIN" || user.accessiblePages.includes("/employees");
    const birthdayReminders = canViewBirthdays
      ? await prisma.employee.findMany({
          where: {
            dateOfBirth: { not: null },
            status: { in: ["Regular", "Contractual", "Trainee", "Leave"] },
          },
          select: { firstName: true, lastName: true, branch: true, photoUrl: true, dateOfBirth: true },
        }).then((employees) => employees.flatMap((employee) => {
          if (!employee.dateOfBirth) return [];
          const date = nextBirthday(employee.dateOfBirth, today, endOfMonth);
          return date
            ? [{
                firstName: employee.firstName,
                lastName: employee.lastName,
                photoUrl: employee.photoUrl,
                birthDate: employee.dateOfBirth.toISOString(),
                daysUntil: Math.round((date.getTime() - today.getTime()) / 86_400_000),
                date: date.toISOString(),
              }]
            : [];
        }).sort((a, b) => a.date.localeCompare(b.date)))
      : [];

    return NextResponse.json(
      { upcomingTasks, birthdayReminders, canViewBirthdays },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Load dashboard reminders error:", error);
    return NextResponse.json({ error: "Unable to load dashboard reminders" }, { status: 500 });
  }
}
