import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import type { Session } from "@/lib/auth";
import { canViewPage } from "@/lib/pageAccess";
import {
  getEmployeesLookup,
  getLoanEmployers,
  getLoanReports,
  getLoans,
  getPostedLoanReports,
} from "@/app/actions/loans";

export async function requireAdminSession(): Promise<Session> {
  const token = (await cookies()).get("token")?.value;
  if (!token) redirect("/login");
  let session: Session | null = null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    session = payload && typeof payload !== "string" ? (payload as Session) : null;
  } catch (error) {
    redirect(error instanceof jwt.TokenExpiredError ? "/login?reason=session-expired" : "/login");
  }
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");
  return session;
}

export async function requirePostedLoanReportsSession(): Promise<Session> {
  const token = (await cookies()).get("token")?.value;
  if (!token) redirect("/login");
  let session: Session | null = null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    session = payload && typeof payload !== "string" ? (payload as Session) : null;
  } catch (error) {
    redirect(error instanceof jwt.TokenExpiredError ? "/login?reason=session-expired" : "/login");
  }
  if (!session) redirect("/login");
  if (!canViewPage(session, "/loans/posted-reports")) redirect("/dashboard");
  return session;
}

export async function loadLoansPageData() {
  const [loans, employees, employers, reports, postedReports] = await Promise.all([
    getLoans(),
    getEmployeesLookup(),
    getLoanEmployers(),
    getLoanReports(),
    getPostedLoanReports(),
  ]);
  return { loans, employees, employers, previousReports: [...reports, ...postedReports] };
}
