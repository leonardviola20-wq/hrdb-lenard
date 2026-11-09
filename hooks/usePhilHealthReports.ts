import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPhilHealthShares } from "@/lib/philHealthReportTotals";
import type { Employee } from "@/components/philhealth-reports/types";

type Report = {
  id: number;
  employerName: string;
  employerPhicNumber: string | null;
  applicableMonth: number;
  applicableYear: number;
  amountDue: string;
  entries: ReportEntry[];
  payment: Payment | null;
};

type ReportEntry = {
  id: number;
  employeeId: number | null;
  employeeName: string;
  employeeCode: string;
  employeePhilHealthNumber: string | null;
  amount: string;
};

type Employer = {
  id: number;
  name: string;
  phic: string | null;
};

type Payment = {
  id: number;
  payorName: string;
  pen: string;
  spa: string | null;
  applicablePeriod: string;
  amountPaid: string;
  accreditedCollectingAgent: string | null;
  transactionConfirmationNumber: string | null;
  transactionDate: string;
  eparNumber: string | null;
  eparDate: string | null;
};

export interface UsePhilHealthReportsReturn {
  employerId: string;
  view: "employees" | "reports";
  setView: (view: "employees" | "reports") => void;
  employer: Employer | null;
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
  reports: Report[];
  setReports: (reports: Report[]) => void;
  canEditPayments: boolean;
  setCanEditPayments: (canEdit: boolean) => void;
  loadedContext: string;
  setLoadedContext: (context: string) => void;
  refreshKey: number;
  setRefreshKey: (key: number) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string;
  setError: (error: string) => void;
}

export function usePhilHealthReports(): UsePhilHealthReportsReturn {
  const router = useRouter();
  const params = useSearchParams();
  const requestedEmployerId = params.get("employerId") ?? "";
  const employerNumber = Number(requestedEmployerId);
  const employerId = Number.isSafeInteger(employerNumber) && employerNumber > 0 ? String(employerNumber) : "";
  const view = params.get("view") === "employees" ? "employees" : "reports";

  const [employer, setEmployer] = useState<Employer | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [canEditPayments, setCanEditPayments] = useState(false);
  const [loadedContext, setLoadedContext] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!employerId) return;
    const context = `${employerId}:${view}`;
    const endpoint = view === "employees"
      ? `/api/reports/philhealth/employees?employerId=${encodeURIComponent(employerId)}`
      : `/api/reports/philhealth/reports?employerId=${encodeURIComponent(employerId)}`;
    const controller = new AbortController();
    fetch(endpoint, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load PhilHealth records");
        return data;
      })
      .then((data) => {
        setError("");
        if (view === "employees") {
          setEmployer(data.employer as Employer);
          setEmployees(data.employees as Employee[]);
        } else {
          setEmployer(data.employer as Employer);
          setReports(data.reports as Report[]);
          setCanEditPayments(data.canEditPayments === true);
        }
        setLoadedContext(context);
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) return;
        setEmployees([]);
        setReports([]);
        setCanEditPayments(false);
        setLoadedContext(context);
        setError(loadError instanceof Error ? loadError.message : "Unable to load PhilHealth records");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [employerId, refreshKey, view]);

  return {
    employerId,
    view,
    setView: (newView: "employees" | "reports") => {
      // Update search params when view changes
      router.push(`/reports/philhealth?view=${newView}&employerId=${encodeURIComponent(employerId)}`);
    },
    employer,
    employees,
    setEmployees,
    reports,
    setReports,
    canEditPayments,
    setCanEditPayments,
    loadedContext,
    setLoadedContext,
    refreshKey,
    setRefreshKey,
    loading,
    setLoading,
    error,
    setError,
  };
}