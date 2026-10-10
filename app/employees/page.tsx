"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownTrayIcon, ArrowPathIcon, ArrowUpTrayIcon, CheckCircleIcon, ChevronLeftIcon, EyeIcon, ListBulletIcon, MagnifyingGlassIcon, PencilSquareIcon, PlusIcon, Squares2X2Icon, TrashIcon } from "@heroicons/react/24/outline";
import { parseCsv, toCsv } from "@/lib/csv";
import { JOB_LEVELS } from "@/lib/employeePayload";
import { employeeProfileHref, matchesEmployeeStatus, sortNavigableEmployees } from "@/lib/employeeNavigation";
import { countEmployeesMissingRequirements } from "@/lib/employeeRequirements";

type Employee = {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  dateOfBirth: string | null;
  age: number | null;
  maritalStatus: string | null;
  gender: string | null;
  address: string | null;
  emergencyName: string | null;
  emergencyNumber: string | null;
  emergencyRelation: string | null;
  emergencyAddress: string | null;
  biometricNo: string | null;
  dateStarted: string | null;
  endDate: string | null;
  sssNumber: string | null;
  pagIbigNumber: string | null;
  philHealth: string | null;
  tinNumber: string | null;
  remarks: string | null;
  status: string | null;
  email: string | null;
  mobileNumber: string | null;
  branch: string | null;
  position: string | null;
  jobLevel: string | null;
  supervisorId: number | null;
  photoUrl: string | null;
  requirementsBypassed: boolean;
  requirements: { requirementKey: string }[];
  bdoAccountNumbers: { id: number }[];
  assignedBy: string | null;
  assignedAt: string | null;
  employer: { id: number; name: string; company: string | null } | null;
};
type Employer = { id: number; name: string; company: string | null };
type CsvSaveFilePicker = (this: Window, options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
}>;

let employeeDirectoryCache: Employee[] | null = null;

type EmployeeDirectoryFilters = {
  query: string;
  statusFilter: string;
  employerFilter: string;
  branchFilter: string;
};

// Survives client-side navigation so returning from add/update keeps the user's filters.
let employeeDirectoryFilters: EmployeeDirectoryFilters = {
  query: "",
  statusFilter: "ACTIVE",
  employerFilter: "",
  branchFilter: "",
};

function readPhoto(file: File, onPhoto: (value: string) => void, onError: (value: string) => void) {
  if (!file.type.startsWith("image/")) {
    onError("Please select an image file.");
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    onError("Photo must be 2 MB or smaller.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") onPhoto(reader.result);
  };
  reader.onerror = () => onError("Unable to read the selected photo.");
  reader.readAsDataURL(file);
}

function formatDigits(value: string, groups: number[]) {
  const digits = value.replace(/\D/g, "").slice(0, groups.reduce((sum, size) => sum + size, 0));
  let offset = 0;
  return groups.map((size) => {
    const part = digits.slice(offset, offset + size);
    offset += size;
    return part;
  }).filter(Boolean).join("-");
}

function formatMobile(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 11)].filter(Boolean).join(" ");
}

function displayMobile(value: string | null) {
  return value ? formatMobile(value) : "Not set";
}

function formatLabel(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function calculateAge(dateOfBirth: string | null) {
  if (!dateOfBirth) return null;
  const birthDate = new Date(`${dateOfBirth.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())) age -= 1;
  return Math.max(0, age);
}

function displayDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Not set";
}

function displayJoinedDate(value: string | null) {
  if (!value) return "Not set";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(date);
}

function ViewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-gray-200 bg-gray-50 p-4"><h3 className="mb-3 border-b border-gray-200 pb-2 text-sm font-semibold text-gray-900">{title}</h3><dl className="grid gap-3 text-sm sm:grid-cols-2">{children}</dl></section>;
}

function ViewField({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt><dd className="mt-1 break-words font-medium text-gray-900">{value ?? "Not set"}</dd></div>;
}

const branches = ["Arya 1", "Arya 2", "Yasuo", "Shangri-la", "Greenhills", "Magnolia", "MyDay", "Warehouse", "Office", "Vape", "Commissary", "Others"];
const positions = ["President", "Corporate Secretary", "Treasurer", "Accountant", "Purchaser", "IT", "Admin", "Admin Staff", "Office Staff", "Store In-charge", "Commissary Staff", "Driver", "Sales Staff", "Dining Staff", "Cashier", "Kitchen Staff", "Dispatcher", "Receptionist", "Warehouse Staff"];
const statuses = ["Trainee", "Regular", "Contractual", "No Contract", "End of contract", "Resigned", "Terminated", "AWOL", "Leave"];
const activeEmployeeStatuses = ["Regular", "Contractual", "Trainee", "Leave"];

const employeeCsvHeaders = ["firstName", "middleName", "lastName", "dateOfBirth", "age", "maritalStatus", "gender", "mobileNumber", "email", "address", "emergencyName", "emergencyNumber", "emergencyRelation", "emergencyAddress", "biometricNo", "employer", "status", "dateStarted", "endDate", "sssNumber", "pagIbigNumber", "philHealth", "tinNumber", "remarks", "branch", "position"];

function csvDate(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function EmployeesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clearSearchOnLoad = searchParams.get("clearSearch") === "1";
  const [employees, setEmployees] = useState<Employee[]>(() => employeeDirectoryCache ?? []);
  const [loading, setLoading] = useState(() => employeeDirectoryCache === null);
  const [query, setQuery] = useState(clearSearchOnLoad ? "" : employeeDirectoryFilters.query);
  const clearAdvancedFiltersRef = useRef(false);
  const statusFilter = searchParams.get("status") || "ACTIVE";
  const employerFilter = searchParams.get("employer") || "";
  const branchFilter = searchParams.get("branch") || "";
  const hiredWithinDays = Number(searchParams.get("hiredWithin")) || 0;
  const requirementsFilter = searchParams.get("requirements") || "";
  const [employeeView, setEmployeeView] = useState<"cards" | "list">("cards");
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<number>>(() => new Set());
  const [employeeSelectionMode, setEmployeeSelectionMode] = useState(false);
  const [transferBranch, setTransferBranch] = useState("");
  const [transferEmployerId, setTransferEmployerId] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [message, setMessage] = useState("");
  const [showFirstEmployeePrompt, setShowFirstEmployeePrompt] = useState(false);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [configuredBranches, setConfiguredBranches] = useState<string[]>(branches);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canDeleteEmployees, setCanDeleteEmployees] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    employeeDirectoryFilters = { query, statusFilter, employerFilter, branchFilter };
    const params = new URLSearchParams(searchParams.toString());
    params.delete("clearSearch");
    if (clearAdvancedFiltersRef.current) {
      params.delete("hiredWithin");
      params.delete("requirements");
      clearAdvancedFiltersRef.current = false;
    }
    params.set("status", statusFilter);
    if (branchFilter) params.set("branch", branchFilter);
    else params.delete("branch");
    if (employerFilter) params.set("employer", employerFilter);
    else params.delete("employer");
    const nextUrl = `/employees?${params.toString()}`;
    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [query, statusFilter, employerFilter, branchFilter, router, searchParams]);

  useEffect(() => {
    let active = true;
    const loadingStartedAt = Date.now();

    fetch("/api/employees")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load employees");
        if (active) {
          employeeDirectoryCache = data.employees;
          setEmployees(data.employees);
          setShowFirstEmployeePrompt(data.employees.length === 0);
        }
      })
      .catch((error: Error) => {
        if (active && employeeDirectoryCache === null) setMessage(error.message);
      })
      .finally(() => {
        const remainingLoadingTime = employeeDirectoryCache === null
          ? Math.max(0, 600 - (Date.now() - loadingStartedAt))
          : 0;
        window.setTimeout(() => {
          if (active) setLoading(false);
        }, remainingLoadingTime);
      });
    fetch("/api/employers")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load employers");
        if (active) setEmployers(data.employers);
      })
      .catch((error: Error) => {
        if (active) setMessage(error.message);
      });
    fetch("/api/management/categories")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load employee categories");
        const categories = Array.isArray(data.categories) ? data.categories : [];
        const branchNames = categories
          .filter((category: { type?: unknown; name?: unknown; active?: unknown }) => category.type === "BRANCH" && category.active === true && typeof category.name === "string")
          .map((category: { name: string }) => category.name);
        if (active) setConfiguredBranches(branchNames.length > 0 ? branchNames : branches);
      })
      .catch((error: Error) => {
        console.warn("Unable to load employee branch categories:", error);
        if (active) setMessage(error.message);
      });
    fetch("/api/me")
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        setIsAdmin(data.user?.role === "ADMIN");
        setCanDeleteEmployees(data.user?.role === "ADMIN" || data.user?.role === "SUPER_USER");
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const updateNavigationFilters = (next: Partial<Pick<EmployeeDirectoryFilters, "statusFilter" | "employerFilter" | "branchFilter">>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next.statusFilter !== undefined) params.set("status", next.statusFilter);
    if (next.employerFilter !== undefined) {
      if (next.employerFilter) params.set("employer", next.employerFilter);
      else params.delete("employer");
    }
    if (next.branchFilter !== undefined) {
      if (next.branchFilter) params.set("branch", next.branchFilter);
      else params.delete("branch");
    }
    const nextUrl = `/employees?${params.toString()}`;
    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  };

  const filteredEmployees = useMemo(() => {
    const search = query.trim().toLowerCase();
    return employees.filter((employee) => {
      const fullName = `${employee.firstName} ${employee.middleName || ""} ${employee.lastName}`.toLowerCase();
      const employer = employee.employer
        ? `${employee.employer.name} ${employee.employer.company || ""}`.toLowerCase()
        : "";
      return (!search || fullName.includes(search) || (employee.biometricNo || "").toLowerCase().includes(search) || employer.includes(search))
        && (statusFilter === "ALL"
          || matchesEmployeeStatus(employee.status, statusFilter))
        && (!employerFilter || employee.employer?.id.toString() === employerFilter)
        && (!branchFilter || employee.branch === branchFilter)
        && (!hiredWithinDays || (employee.dateStarted
          && new Date(employee.dateStarted).getTime() >= Date.now() - hiredWithinDays * 24 * 60 * 60 * 1000))
        && (requirementsFilter !== "missing" || countEmployeesMissingRequirements([employee]) > 0);
    });
  }, [employees, query, statusFilter, employerFilter, branchFilter, hiredWithinDays, requirementsFilter]);

  const sortedEmployees = useMemo(() => {
    return sortNavigableEmployees(filteredEmployees);
  }, [filteredEmployees]);
  const allVisibleEmployeesSelected = sortedEmployees.length > 0
    && sortedEmployees.every((employee) => selectedEmployeeIds.has(employee.id));

  const employeeBranches = useMemo(
    () => [...new Set(employees.map((employee) => employee.branch).filter((value): value is string => Boolean(value)))].sort(),
    [employees]
  );
  const hasFilters = Boolean(query || statusFilter !== "ACTIVE" || employerFilter || branchFilter || hiredWithinDays || requirementsFilter);
  const profileHref = (employeeId: number) => employeeProfileHref(employeeId, {
    status: statusFilter,
    branch: branchFilter,
    employer: employerFilter,
  });
  const clearFilters = () => {
    clearAdvancedFiltersRef.current = true;
    setQuery("");
    updateNavigationFilters({ statusFilter: "ACTIVE", employerFilter: "", branchFilter: "" });
  };

  const toggleEmployeeSelection = (employeeId: number) => {
    setSelectedEmployeeIds((current) => {
      const next = new Set(current);
      if (next.has(employeeId)) next.delete(employeeId);
      else next.add(employeeId);
      return next;
    });
  };

  const toggleVisibleEmployeeSelection = () => {
    setSelectedEmployeeIds((current) => {
      const next = new Set(current);
      const shouldSelect = !sortedEmployees.every((employee) => next.has(employee.id));
      for (const employee of sortedEmployees) {
        if (shouldSelect) next.add(employee.id);
        else next.delete(employee.id);
      }
      return next;
    });
  };

  const clearEmployeeSelection = () => {
    setSelectedEmployeeIds(new Set());
    setTransferBranch("");
    setTransferEmployerId("");
  };

  const toggleEmployeeSelectionMode = () => {
    if (employeeSelectionMode) {
      setEmployeeSelectionMode(false);
      clearEmployeeSelection();
      return;
    }
    setEmployeeSelectionMode(true);
  };

  const deleteEmployee = async (employee: Employee) => {
    const fullName = [employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(" ");
    if (!window.confirm(`Permanently delete ${fullName}? This also deletes their attendance records, punches, requirements, and attached documents. Saved SSS reports and loan history retain their employee snapshots. This cannot be undone.`)) return;

    setDeletingEmployeeId(employee.id);
    setMessage("");
    setNotice("");
    try {
      const response = await fetch(`/api/employees/${employee.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete employee");
      setEmployees((current) => {
        const remaining = current.filter((item) => item.id !== employee.id);
        employeeDirectoryCache = remaining;
        return remaining;
      });
      setSelectedCardId(null);
      if (selectedEmployee?.id === employee.id) setSelectedEmployee(null);
      setNotice(`${fullName} was deleted.`);
    } catch (deleteError) {
      setMessage(deleteError instanceof Error ? deleteError.message : "Unable to delete employee");
    } finally {
      setDeletingEmployeeId(null);
    }
  };

  const transferSelectedEmployees = async () => {
    if (selectedEmployeeIds.size === 0 || (!transferBranch && !transferEmployerId)) return;
    setIsTransferring(true);
    setMessage("");
    setNotice("");
    let transferredCount = 0;
    try {
      const response = await fetch("/api/employees/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeIds: Array.from(selectedEmployeeIds),
          branch: transferBranch || null,
          employerId: transferEmployerId ? Number(transferEmployerId) : null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to transfer employees");
      transferredCount = data.updated;

      const refreshed = await fetch("/api/employees");
      const refreshedData = await refreshed.json();
      if (!refreshed.ok) throw new Error(refreshedData.error || "Unable to reload employees");
      employeeDirectoryCache = refreshedData.employees;
      setEmployees(refreshedData.employees);
      setSelectedEmployeeIds(new Set());
      setEmployeeSelectionMode(false);
      setTransferBranch("");
      setTransferEmployerId("");
      setNotice(`Transferred ${transferredCount} employee${transferredCount === 1 ? "" : "s"}.`);
    } catch (error) {
      if (transferredCount > 0) employeeDirectoryCache = null;
      setMessage(transferredCount > 0
        ? `Transferred ${transferredCount} employees, but the directory could not be refreshed. Reload the page to see the updated assignments.`
        : error instanceof Error ? error.message : "Unable to transfer employees");
    } finally {
      setIsTransferring(false);
    }
  };

  const exportEmployees = async () => {
    if (filteredEmployees.length === 0 || exporting) return;
    setExporting(true);
    const rows: (string | number)[][] = [employeeCsvHeaders];
    for (const employee of filteredEmployees) {
      rows.push([
        employee.firstName,
        employee.middleName ?? "",
        employee.lastName,
        csvDate(employee.dateOfBirth),
        employee.age ?? "",
        employee.maritalStatus ?? "",
        employee.gender ?? "",
        employee.mobileNumber ?? "",
        employee.email ?? "",
        employee.address ?? "",
        employee.emergencyName ?? "",
        employee.emergencyNumber ?? "",
        employee.emergencyRelation ?? "",
        employee.emergencyAddress ?? "",
        employee.biometricNo ?? "",
        employee.employer?.name ?? "",
        employee.status ?? "",
        csvDate(employee.dateStarted),
        csvDate(employee.endDate),
        employee.sssNumber ?? "",
        employee.pagIbigNumber ?? "",
        employee.philHealth ?? "",
        employee.tinNumber ?? "",
        employee.remarks ?? "",
        employee.branch ?? "",
        employee.position ?? "",
      ]);
    }
    const blob = new Blob([`\uFEFF${toCsv(rows)}`], { type: "text/csv;charset=utf-8" });
    const filename = `employees-${new Date().toISOString().slice(0, 10)}.csv`;
    const picker = (window as Window & { showSaveFilePicker?: CsvSaveFilePicker }).showSaveFilePicker;
    const downloadCsv = () => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    try {
      if (picker) {
        try {
          const file = await picker.call(window, {
            suggestedName: filename,
            types: [{ description: "CSV file", accept: { "text/csv": [".csv"] } }],
          });
          const writable = await file.createWritable();
          await writable.write(blob);
          await writable.close();
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          // Some browsers close the picker stream unexpectedly. Preserve the export
          // by falling back to a normal download instead of reusing that stream.
          downloadCsv();
        }
      } else {
        downloadCsv();
      }
      setMessage("");
      setNotice(`Exported ${filteredEmployees.length} employee(s) to CSV.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to export employees.");
    } finally {
      setExporting(false);
    }
  };

  const importEmployees = async (file: File) => {
    setImporting(true);
    setNotice("");
    setMessage("");
    try {
      const rows = parseCsv(await file.text());
      if (rows.length < 2) throw new Error("The CSV must include a header row and at least one employee row.");
      const [header, ...dataRows] = rows;
      const records = dataRows
        .filter((row) => row.some((value) => value.trim()))
        .map((row) => Object.fromEntries(header.map((column, index) => [column.trim(), (row[index] ?? "").trim()])));
      if (records.length === 0) throw new Error("The CSV must include at least one employee row.");

      const response = await fetch("/api/employees/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employees: records }),
      });
      const data = await response.json();
      if (!response.ok) {
        const details = Array.isArray(data.rowErrors) && data.rowErrors.length > 0
          ? `${data.error} ${data.rowErrors.slice(0, 3).join(" ")}${data.rowErrors.length > 3 ? " ..." : ""}`
          : data.error || "Unable to import employees";
        throw new Error(details);
      }

      const refreshed = await fetch("/api/employees");
      if (refreshed.ok) {
        const refreshedData = await refreshed.json();
        employeeDirectoryCache = refreshedData.employees;
        setEmployees(refreshedData.employees);
        setShowFirstEmployeePrompt(refreshedData.employees.length === 0);
      }

      const parts = [`Imported ${data.created} employee(s)`];
      if (data.skipped > 0) parts.push(`${data.skipped} duplicate(s) skipped`);
      if (Array.isArray(data.unmatchedEmployers) && data.unmatchedEmployers.length > 0) {
        parts.push(`employer name not found: ${data.unmatchedEmployers.join(", ")}`);
      }
      setNotice(`${parts.join(" · ")}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to import employees");
    } finally {
      setImporting(false);
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void importEmployees(file);
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-5 sm:p-6">
      <div className="w-full">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard"
            onClick={(event) => {
              if (window.matchMedia("(max-width: 767px)").matches) {
                event.preventDefault();
                window.dispatchEvent(new Event("hrdb-open-sidebar"));
              }
            }}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            <ChevronLeftIcon className="h-4 w-4" /> Back
          </Link>
          <Link href="/employees/new" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#172554] px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900">
            <PlusIcon className="h-4 w-4" /> Add
          </Link>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search employees..."
            aria-label="Search employees"
            className="hidden h-10 min-w-[140px] flex-[1_1_178px] rounded-lg border border-gray-300 bg-white px-3 text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 lg:block"
          />
          <select aria-label="Filter by employee status" value={statusFilter} onChange={(event) => updateNavigationFilters({ statusFilter: event.target.value })} className="hidden h-10 w-[180px] shrink-0 rounded-lg border border-gray-300 bg-white px-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 lg:block">
            <option value="ALL">All employees</option>
            <option value="ACTIVE">Active employees</option>
            <option value="INACTIVE">Inactive employees</option>
            <option value="Trainee">Trainee</option>
          </select>
          <select aria-label="Filter by employer" value={employerFilter} onChange={(event) => updateNavigationFilters({ employerFilter: event.target.value })} className="hidden h-10 w-[180px] shrink-0 rounded-lg border border-gray-300 bg-white px-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 lg:block">
            <option value="">All employers</option>
            {employers.map((employer) => <option key={employer.id} value={employer.id}>{employer.name}</option>)}
          </select>
            <select aria-label="Filter by branch" value={branchFilter} onChange={(event) => updateNavigationFilters({ branchFilter: event.target.value })} className="hidden h-10 w-[230px] shrink-0 rounded-lg border border-gray-300 bg-white px-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 lg:block">
              <option value="">All branches</option>
              {employeeBranches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
            </select>
          <button
            type="button"
            aria-label="View first employee matching filters"
            title={sortedEmployees.length > 0 ? "View first employee matching filters" : "No employees match the filters"}
            onClick={() => {
              const firstEmployee = sortedEmployees[0];
              if (firstEmployee) router.push(profileHref(firstEmployee.id));
            }}
            disabled={sortedEmployees.length === 0}
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 lg:inline-flex"
          >
            <EyeIcon aria-hidden="true" className="h-5 w-5" />
          </button>
          <div className="contents">
              <button
                type="button"
                aria-label={`Current view: ${employeeView}. Switch to ${employeeView === "cards" ? "list" : "card"} view`}
                title={`Current view: ${employeeView === "cards" ? "Cards" : "List"}. Switch to ${employeeView === "cards" ? "list" : "card"} view`}
                onClick={() => setEmployeeView((currentView) => currentView === "cards" ? "list" : "cards")}
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 md:inline-flex"
              >
                {employeeView === "cards" ? <Squares2X2Icon aria-hidden="true" className="h-5 w-5" /> : <ListBulletIcon aria-hidden="true" className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasFilters}
                aria-label="Clear all filters"
                title="Clear all filters"
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 md:inline-flex"
              >
                <ArrowPathIcon aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={toggleEmployeeSelectionMode}
                disabled={isTransferring}
                aria-pressed={employeeSelectionMode}
                aria-expanded={employeeSelectionMode}
                aria-controls="employee-transfer-panel"
                className={`hidden h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border px-3 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 md:inline-flex ${employeeSelectionMode ? "border-blue-300 bg-blue-50 text-blue-900" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                Transfer
              </button>
              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={exportEmployees}
                    disabled={filteredEmployees.length === 0 || exporting}
                    className="hidden h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 md:inline-flex"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" /> {exporting ? "Exporting..." : "Export"}
                  </button>
                  <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleImportFile} className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                    className="hidden h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#172554] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900 disabled:opacity-50 md:inline-flex"
                  >
                    <ArrowUpTrayIcon className="h-4 w-4" /> {importing ? "Importing..." : "Import"}
                  </button>
                </>
              )}
          </div>
        </div>
        <div className={`md:hidden ${mobileFiltersOpen ? "mb-4" : "mb-2"}`}>
          <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((isOpen) => !isOpen)}
            aria-label={mobileFiltersOpen ? "Hide search and filters" : "Show search and filters"}
            aria-expanded={mobileFiltersOpen}
            aria-controls="mobile-employee-filters"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <MagnifyingGlassIcon aria-hidden="true" className="h-5 w-5" />
          </button>
            <span className="whitespace-nowrap text-xs text-gray-600">
              {loading ? "Loading..." : <>Showing <span className="font-semibold text-gray-900">{filteredEmployees.length}</span> of <span className="font-semibold text-gray-900">{employees.length}</span></>}
            </span>
          </div>
          {mobileFiltersOpen && (
            <div id="mobile-employee-filters" className="mt-3 flex flex-col gap-3">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search employees..."
                aria-label="Search employees"
                className="h-10 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              <select aria-label="Filter by employee status" value={statusFilter} onChange={(event) => updateNavigationFilters({ statusFilter: event.target.value })} className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
                <option value="ALL">All employees</option>
                <option value="ACTIVE">Active employees</option>
                <option value="INACTIVE">Inactive employees</option>
                <option value="Trainee">Trainee</option>
              </select>
              <select aria-label="Filter by employer" value={employerFilter} onChange={(event) => updateNavigationFilters({ employerFilter: event.target.value })} className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
                <option value="">All employers</option>
                {employers.map((employer) => <option key={employer.id} value={employer.id}>{employer.name}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <select aria-label="Filter by branch" value={branchFilter} onChange={(event) => updateNavigationFilters({ branchFilter: event.target.value })} className="h-10 min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
                  <option value="">All branches</option>
                  {employeeBranches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
                </select>
                <button
                  type="button"
                  aria-label="View first employee matching filters"
                  title={sortedEmployees.length > 0 ? "View first employee matching filters" : "No employees match the filters"}
                  onClick={() => {
                    const firstEmployee = sortedEmployees[0];
                    if (firstEmployee) router.push(profileHref(firstEmployee.id));
                  }}
                  disabled={sortedEmployees.length === 0}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 lg:hidden"
                >
                  <EyeIcon aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="mb-4 hidden flex-wrap items-center gap-2 md:flex">
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            <span className="mr-1 text-sm font-medium text-slate-500">Quick filters:</span>
            {[
              { value: "ACTIVE", label: "Active employees" },
              { value: "Trainee", label: "Trainee" },
              { value: "Contractual", label: "Contractual" },
              { value: "ALL", label: "All employees" },
              { value: "INACTIVE", label: "Inactive employees" },
            ].map((quickFilter) => (
              <button
                key={quickFilter.value}
                type="button"
                onClick={() => updateNavigationFilters({ statusFilter: quickFilter.value })}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${statusFilter === quickFilter.value ? "border-blue-200 bg-blue-100 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
              >
                {quickFilter.label}
              </button>
            ))}
          </div>
          <span className="ml-auto hidden whitespace-nowrap text-xs text-gray-600 md:inline">
            {loading ? "Loading..." : <>Showing <span className="font-semibold text-gray-900">{filteredEmployees.length}</span> of <span className="font-semibold text-gray-900">{employees.length}</span></>}
          </span>
        </div>
        <section
            id="employee-transfer-panel"
            aria-label="Transfer selected employees"
            aria-hidden={!employeeSelectionMode}
            className={`overflow-hidden rounded-xl border border-blue-100 bg-blue-50 transition-all duration-200 ease-out ${employeeSelectionMode ? "visible mb-4 max-h-96 translate-y-0 p-3 opacity-100" : "invisible max-h-0 -translate-y-2 border-transparent p-0 opacity-0"}`}
          >
            {employeeSelectionMode && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="whitespace-nowrap text-sm font-semibold text-blue-950">
                  {selectedEmployeeIds.size} selected
                </span>
                <button
                  type="button"
                  onClick={clearEmployeeSelection}
                  disabled={selectedEmployeeIds.size === 0 || isTransferring}
                  className="rounded px-2 py-1 text-sm font-semibold text-blue-700 hover:bg-white disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  Clear
                </button>
                {selectedEmployeeIds.size === 0 ? (
                  <p className="text-sm text-gray-600">Select employees using the checkboxes to choose transfer destinations.</p>
                ) : (
                  <>
                    <select
                      aria-label="Destination branch"
                      value={transferBranch}
                      onChange={(event) => setTransferBranch(event.target.value)}
                      className="h-10 w-56 max-w-full flex-none rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900"
                    >
                      <option value="">Keep current branch</option>
                      {[...new Set([...configuredBranches, ...employeeBranches])].sort().map((branch) => <option key={branch} value={branch}>{branch}</option>)}
                    </select>
                    <select
                      aria-label="Destination employer"
                      value={transferEmployerId}
                      onChange={(event) => setTransferEmployerId(event.target.value)}
                      className="h-10 w-56 max-w-full flex-none rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900"
                    >
                      <option value="">Keep current employer</option>
                      {employers.map((employer) => <option key={employer.id} value={employer.id}>{employer.name}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => void transferSelectedEmployees()}
                      disabled={isTransferring || (!transferBranch && !transferEmployerId)}
                      className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isTransferring ? "Transferring..." : "Transfer"}
                    </button>
                  </>
                )}
              </div>
            )}
          </section>
        {notice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setNotice("")}>
            <section role="alertdialog" aria-modal="true" aria-labelledby="employee-notice-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-xl bg-white p-6 text-left shadow-xl">
              <div className="flex items-center gap-2">
                <CheckCircleIcon aria-hidden="true" className="h-6 w-6 text-emerald-600" />
                <h2 id="employee-notice-title" className="text-lg font-semibold text-gray-900">Success</h2>
              </div>
              <p role="status" className="mt-3 text-sm text-gray-700">{notice}</p>
              <div className="mt-5 flex justify-end">
                <button type="button" autoFocus onClick={() => setNotice("")} className="rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">OK</button>
              </div>
            </section>
          </div>
        )}
        {message && <p role="alert" className="mb-4 mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{message}</p>}
        {loading ? (
          <div role="status" aria-label="Loading employees" className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <span className="sr-only">Loading employees</span>
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 h-24 w-24 rounded-full bg-gray-200" />
                <div className="h-4 w-2/3 rounded bg-gray-200" />
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="h-3 rounded bg-gray-100" />
                  <div className="h-3 rounded bg-gray-100" />
                  <div className="h-3 rounded bg-gray-100" />
                  <div className="h-3 rounded bg-gray-100" />
                </div>
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-3 rounded bg-gray-100" />
                    <div className="h-3 rounded bg-gray-100" />
                    <div className="h-3 rounded bg-gray-100" />
                    <div className="h-3 rounded bg-gray-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEmployees.length === 0 ? (
          <p className="mt-4 rounded-xl border border-gray-200 bg-white p-6 text-gray-600 shadow-sm">No employees found.</p>
        ) : (
          employeeView === "cards" ? (
            <div className="mt-4 grid w-full min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {sortedEmployees.map((employee) => {
                const fullName = [employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(" ");
                const isCardSelected = selectedCardId === employee.id;
                return (
                  <article key={employee.id} className={`relative isolate w-full min-w-0 rounded-xl border p-4 shadow-sm transition sm:p-5 ${isCardSelected ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100 shadow-md" : "border-gray-200 bg-white hover:shadow-md"}`}>
                    <button
                      type="button"
                      aria-label={`${isCardSelected ? "Unselect" : "Select"} ${fullName}`}
                      aria-pressed={isCardSelected}
                      onClick={() => setSelectedCardId(isCardSelected ? null : employee.id)}
                      className="absolute inset-0 z-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    />
                    <div className="pointer-events-none relative z-10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          {employee.photoUrl
                            ? <img src={employee.photoUrl} alt="" className="h-24 w-24 rounded-full border-2 border-gray-200 object-cover" />
                            : <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-100 text-xs text-gray-400">No photo</div>}
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-gray-500">Date Joined</div>
                            <div className="mt-1 text-sm font-bold text-gray-900">{displayJoinedDate(employee.dateStarted)}</div>
                          </div>
                        </div>
                        <h2 className="truncate text-base font-semibold text-gray-900">{fullName}</h2>
                      </div>
                      <div className="pointer-events-auto flex shrink-0 items-start gap-1">
                        {employeeSelectionMode && <input
                          type="checkbox"
                          checked={selectedEmployeeIds.has(employee.id)}
                          onChange={() => toggleEmployeeSelection(employee.id)}
                          aria-label={`Select ${fullName} for transfer`}
                          className="mt-2 h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-600"
                        />}
                        {isCardSelected && <Link
                          href={profileHref(employee.id)}
                          aria-label={`View ${fullName}`}
                          title={`View ${fullName}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <EyeIcon aria-hidden="true" className="h-5 w-5" />
                        </Link>}
                        {isCardSelected && <Link
                          href={`/employees/new/${employee.id}`}
                          aria-label={`Edit ${fullName}`}
                          title={`Edit ${fullName}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <PencilSquareIcon aria-hidden="true" className="h-5 w-5" />
                        </Link>}
                        {isCardSelected && canDeleteEmployees && <button
                          type="button"
                          onClick={() => void deleteEmployee(employee)}
                          disabled={deletingEmployeeId === employee.id}
                          aria-label={`Delete ${fullName}`}
                          title={`Delete ${fullName}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-700 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:cursor-wait disabled:opacity-50"
                        >
                          <TrashIcon aria-hidden="true" className="h-5 w-5" />
                        </button>}
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
                      <div className="grid content-start gap-1">
                        {(() => {
                          const isActive = activeEmployeeStatuses.includes(employee.status || "");
                          return (
                            <>
                              <span className={`font-semibold ${isActive ? "text-green-600" : "text-red-600"}`}>{isActive ? "Active" : "Inactive"}</span>
                              <span className={`font-medium ${isActive ? "text-gray-700" : "text-red-700"}`}>{employee.status || "Not set"}</span>
                            </>
                          );
                        })()}
                      </div>
                      <div className="grid min-w-0 content-start gap-1">
                        <span className="truncate text-gray-900">{employee.branch || "Branch not set"}</span>
                        <span className="truncate text-gray-900">{employee.position || "Position not set"}</span>
                      </div>
                    </div>
                    <dl className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-3 border-t border-gray-100 pt-4 text-sm">
                      <div className="min-w-0"><dt className="text-gray-500">Biometric No.</dt><dd className="mt-1 truncate text-gray-900">{employee.biometricNo || "Not set"}</dd></div>
                      <div className="min-w-0"><dt className="text-gray-500">Employer</dt><dd className="mt-1 truncate text-gray-900">{employee.employer?.name || "Unassigned"}</dd></div>
                      <div className="min-w-0"><dt className="text-gray-500">Phone</dt><dd className="mt-1 break-words text-gray-900">{displayMobile(employee.mobileNumber)}</dd></div>
                      <div className="min-w-0"><dt className="text-gray-500">Email</dt><dd className="mt-1 truncate text-gray-900">{employee.email || "Not set"}</dd></div>
                    </dl>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="min-w-[1320px] w-full table-auto divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  <tr>
                    {employeeSelectionMode && (
                      <th scope="col" className="w-10 px-3 py-3">
                        <input
                          type="checkbox"
                          checked={allVisibleEmployeesSelected}
                          onChange={toggleVisibleEmployeeSelection}
                          aria-label={allVisibleEmployeesSelected ? "Deselect all visible employees" : "Select all visible employees"}
                          className="h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-600"
                        />
                      </th>
                    )}
                    <th scope="col" className="w-16 px-4 py-3">Photo</th>
                    <th scope="col" className="min-w-48 px-4 py-3">Name</th>
                    <th scope="col" className="px-4 py-3">Position</th>
                    <th scope="col" className="px-4 py-3">Branch</th>
                    <th scope="col" className="px-4 py-3">Employer</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3">Phone</th>
                    <th scope="col" className="px-4 py-3">Email</th>
                    <th scope="col" className="px-4 py-3 whitespace-nowrap">Date Joined</th>
                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedEmployees.map((employee) => {
                    const fullName = [employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(" ");
                    const isActive = activeEmployeeStatuses.includes(employee.status || "");
                    return (
                      <tr key={employee.id} className="text-gray-700 hover:bg-gray-50">
                        {employeeSelectionMode && (
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={selectedEmployeeIds.has(employee.id)}
                              onChange={() => toggleEmployeeSelection(employee.id)}
                              aria-label={`Select ${fullName} for transfer`}
                              className="h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-600"
                            />
                          </td>
                        )}
                        <td className="px-4 py-3">
                          {employee.photoUrl
                            ? <img src={employee.photoUrl} alt="" className="h-11 w-11 rounded-full border border-gray-200 object-cover" />
                            : <span aria-hidden="true" className="block h-11 w-11 rounded-full border border-gray-200 bg-gray-100" />}
                        </td>
                        <th scope="row" className="px-4 py-3 font-medium text-gray-900">
                          <div className="min-w-0">
                            <div className="whitespace-nowrap text-base font-semibold">{fullName}</div>
                            <div className="mt-0.5 text-xs font-normal text-gray-500">{employee.biometricNo || "Not set"}</div>
                          </div>
                        </th>
                        <td className="px-4 py-3">{employee.position || "Not set"}</td>
                        <td className="px-4 py-3">{employee.branch || "Not set"}</td>
                        <td className="px-4 py-3">{employee.employer?.name || "Unassigned"}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><span className={`font-semibold ${isActive ? "text-green-700" : "text-red-700"}`}>{isActive ? "Active" : "Inactive"}</span></td>
                        <td className="px-4 py-3 whitespace-nowrap">{displayMobile(employee.mobileNumber)}</td>
                        <td className="px-4 py-3">{employee.email || "Not set"}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-bold">{displayJoinedDate(employee.dateStarted)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Link
                              href={profileHref(employee.id)}
                              aria-label={`View ${fullName}`}
                              title={`View ${fullName}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <EyeIcon aria-hidden="true" className="h-5 w-5" />
                            </Link>
                            <Link
                              href={`/employees/new/${employee.id}`}
                              aria-label={`Edit ${fullName}`}
                              title={`Edit ${fullName}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <PencilSquareIcon aria-hidden="true" className="h-5 w-5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
      {showFirstEmployeePrompt && !loading && !message && employees.length === 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="first-employee-title" className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <PlusIcon className="h-7 w-7" />
            </div>
            <h2 id="first-employee-title" className="mt-4 text-xl font-bold text-gray-900">No employees yet</h2>
            <p className="mt-2 text-sm text-gray-600">Add your first employee to start building the employee directory.</p>
            <div className="mt-6 flex justify-center gap-2">
              <button type="button" onClick={() => setShowFirstEmployeePrompt(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Maybe later</button>
              <Link href="/employees/new" className="rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900">Add first employee</Link>
            </div>
          </section>
        </div>
      )}
      {selectedEmployee && (
        <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onClick={() => setSelectedEmployee(null)}>
          <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">{[selectedEmployee.firstName, selectedEmployee.middleName, selectedEmployee.lastName].filter(Boolean).join(" ")}</h2>
                <p className="mt-1 text-sm text-gray-500">Biometric No.: {selectedEmployee.biometricNo || "Not set"}</p>
              </div>
              <button type="button" onClick={() => setSelectedEmployee(null)} className="text-2xl text-gray-400 hover:text-gray-700" aria-label="Close">×</button>
            </div>
            {editing ? (
              <EmployeeEditForm employee={selectedEmployee} employers={employers} supervisors={employees.filter((candidate) => candidate.id !== selectedEmployee.id && candidate.position === "Store In-charge")} saving={saving} onCancel={() => { setSelectedEmployee(null); setEditing(false); }} onError={setMessage} onSave={async (changes) => {
                setSaving(true);
                try {
                  const response = await fetch(`/api/employees/${selectedEmployee.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) });
                  const data = await response.json();
                  if (!response.ok) throw new Error(data.error || "Unable to update employee");
                  setEmployees((current) => {
                    const updatedEmployees = current.map((item) => item.id === data.employee.id ? data.employee : item);
                    employeeDirectoryCache = updatedEmployees;
                    return updatedEmployees;
                  });
                  setSelectedEmployee(null);
                  setEditing(false);
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "Unable to update employee");
                } finally { setSaving(false); }
              }} />
            ) : (
              <>
                <div className="mt-6 max-h-[70vh] space-y-4 overflow-y-auto pr-2">
                  <ViewSection title="Personal Information">
                    <div className="sm:col-span-2">{selectedEmployee.photoUrl ? <img src={selectedEmployee.photoUrl} alt="Employee" className="h-28 w-28 rounded-full object-cover" /> : <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500">No photo</div>}</div>
                    <ViewField label="First Name" value={selectedEmployee.firstName} />
                    <ViewField label="Middle Name" value={selectedEmployee.middleName} />
                    <ViewField label="Last Name" value={selectedEmployee.lastName} />
                    <ViewField label="Date of Birth" value={displayDate(selectedEmployee.dateOfBirth)} />
                    <ViewField label="Age" value={calculateAge(selectedEmployee.dateOfBirth) ?? selectedEmployee.age} />
                    <ViewField label="Marital Status" value={selectedEmployee.maritalStatus} />
                    <ViewField label="Gender" value={selectedEmployee.gender} />
                  </ViewSection>
                  <ViewSection title="Contact Information">
                    <ViewField label="Mobile Number" value={displayMobile(selectedEmployee.mobileNumber)} />
                    <ViewField label="Email" value={selectedEmployee.email} />
                    <div className="sm:col-span-2"><ViewField label="Address" value={selectedEmployee.address} /></div>
                  </ViewSection>
                  <ViewSection title="Emergency Information">
                    <ViewField label="Contact Person" value={selectedEmployee.emergencyName} />
                    <ViewField label="Contact Number" value={displayMobile(selectedEmployee.emergencyNumber)} />
                    <ViewField label="Relation" value={selectedEmployee.emergencyRelation} />
                    <div className="sm:col-span-2"><ViewField label="Address" value={selectedEmployee.emergencyAddress} /></div>
                  </ViewSection>
                  <ViewSection title="Job Information">
                    <ViewField label="Biometric No." value={selectedEmployee.biometricNo} />
                    <ViewField label="Employer" value={selectedEmployee.employer?.name} />
                    <ViewField label="Status" value={selectedEmployee.status} />
                    <ViewField label="Branch" value={selectedEmployee.branch} />
                    <ViewField label="Position" value={selectedEmployee.position} />
                    <ViewField label="Date Started" value={displayDate(selectedEmployee.dateStarted)} />
                    <ViewField label="Ended" value={displayDate(selectedEmployee.endDate)} />
                  </ViewSection>
                  <ViewSection title="Government Information">
                    <ViewField label="SSS" value={selectedEmployee.sssNumber} />
                    <ViewField label="Pag-IBIG" value={selectedEmployee.pagIbigNumber} />
                    <ViewField label="PhilHealth" value={selectedEmployee.philHealth} />
                    <ViewField label="TIN" value={selectedEmployee.tinNumber} />
                  </ViewSection>
                  <ViewSection title="Assignment and Remarks">
                    <ViewField label="Assigned By" value={selectedEmployee.assignedBy} />
                    <ViewField label="Assigned At" value={displayDate(selectedEmployee.assignedAt)} />
                    <div className="sm:col-span-2"><ViewField label="Remarks" value={selectedEmployee.remarks} /></div>
                  </ViewSection>
                </div>
                <div className="mt-6 flex justify-end"><button type="button" onClick={() => setEditing(true)} className="rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900">Update employee</button></div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={<main className="flex min-h-0 flex-1 flex-col bg-gray-50 p-4 sm:p-6" />}>
      <EmployeesPageContent />
    </Suspense>
  );
}

function EmployeeEditForm({ employee, employers, supervisors, saving, onCancel, onError, onSave }: { employee: Employee; employers: Employer[]; supervisors: Employee[]; saving: boolean; onCancel: () => void; onError: (value: string) => void; onSave: (changes: Record<string, string | number | null>) => Promise<void> }) {
  const [form, setForm] = useState({
    firstName: employee.firstName, middleName: employee.middleName || "", lastName: employee.lastName,
    dateOfBirth: employee.dateOfBirth?.slice(0, 10) || "", age: calculateAge(employee.dateOfBirth)?.toString() || "",
    maritalStatus: employee.maritalStatus || "", gender: employee.gender || "",
    mobileNumber: formatMobile(employee.mobileNumber || ""), email: employee.email || "", address: employee.address || "",
    emergencyName: employee.emergencyName || "", emergencyNumber: formatMobile(employee.emergencyNumber || ""),
    emergencyRelation: employee.emergencyRelation || "", emergencyAddress: employee.emergencyAddress || "",
    biometricNo: employee.biometricNo || "", branch: employee.branch || "", position: employee.position || "",
    jobLevel: employee.jobLevel || "", supervisorId: employee.supervisorId == null ? "" : String(employee.supervisorId),
    employerId: employee.employer?.id?.toString() || "", status: employee.status || "Trainee",
    dateStarted: employee.dateStarted?.slice(0, 10) || "", endDate: employee.endDate?.slice(0, 10) || "",
    sssNumber: formatDigits(employee.sssNumber || "", [2, 7, 1]), pagIbigNumber: formatDigits(employee.pagIbigNumber || "", [4, 4, 4]),
    philHealth: formatDigits(employee.philHealth || "", [2, 9, 1]), tinNumber: formatDigits(employee.tinNumber || "", [3, 3, 3, 5]), photoUrl: employee.photoUrl || "",
    remarks: employee.remarks || "",
  });
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const updateDateOfBirth = (value: string) => {
    if (!value) {
      setForm((current) => ({ ...current, dateOfBirth: "", age: "" }));
      return;
    }
    setForm((current) => ({ ...current, dateOfBirth: value, age: String(calculateAge(value) ?? "") }));
  };
  const textFields = ["firstName", "middleName", "lastName"] as const;
  return <form className="mt-6 max-h-[70vh] overflow-y-auto pr-2" onSubmit={(event) => { event.preventDefault(); void onSave({ ...form, age: form.age ? Number(form.age) : null, employerId: form.employerId ? Number(form.employerId) : null }); }}>
    <div className="grid gap-4 sm:grid-cols-2">
      <h3 className="border-b border-gray-100 pb-2 text-base font-semibold text-gray-900 sm:col-span-2">Personal Information</h3>
      {textFields.map((field) => <label key={field} className="grid gap-1 text-sm font-medium text-gray-700"><span>{formatLabel(field)}</span><input value={form[field]} onChange={(event) => update(field, event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>)}
      <div className="grid gap-2 text-sm font-medium text-gray-700 sm:col-span-2">
        <span>Photo</span>
        <div className="flex items-center gap-4">
          {form.photoUrl ? <img src={form.photoUrl} alt="Employee preview" className="h-24 w-24 rounded-lg border border-gray-200 object-cover" /> : <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400">No photo</div>}
          <div className="grid gap-2">
            <label className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Choose photo
              <input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) readPhoto(file, (value) => update("photoUrl", value), onError); }} className="sr-only" />
            </label>
            <button type="button" onClick={() => update("photoUrl", "")} className="text-left text-xs text-gray-500 hover:text-gray-900">Remove photo</button>
          </div>
        </div>
      </div>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Date of Birth</span><input type="date" value={form.dateOfBirth} onChange={(event) => updateDateOfBirth(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Age</span><input readOnly tabIndex={-1} value={form.age} className="cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-900" /></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Marital Status</span><select value={form.maritalStatus} onChange={(event) => update("maritalStatus", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"><option value="">Select status</option><option>Single</option><option>Married</option><option>Widowed</option><option>Separated</option></select></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Gender</span><select value={form.gender} onChange={(event) => update("gender", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></select></label>
      <h3 className="mt-2 border-b border-gray-100 pb-2 text-base font-semibold text-gray-900 sm:col-span-2">Contact Information</h3>
      {(["mobileNumber", "email", "address"] as const).map((field) => <label key={field} className={`grid gap-1 text-sm font-medium text-gray-700 ${field === "address" ? "sm:col-span-2" : ""}`}><span>{field === "mobileNumber" ? "Mobile Number" : formatLabel(field)}</span>{field === "address" ? <textarea rows={2} value={form[field]} onChange={(event) => update(field, event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /> : <input value={form[field]} onChange={(event) => update(field, field === "mobileNumber" ? formatMobile(event.target.value) : event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" />}</label>)}
      <h3 className="mt-2 border-b border-gray-100 pb-2 text-base font-semibold text-gray-900 sm:col-span-2">Emergency Information</h3>
      {(["emergencyName", "emergencyNumber"] as const).map((field) => <label key={field} className="grid gap-1 text-sm font-medium text-gray-700"><span>{field === "emergencyNumber" ? "Emergency Number" : formatLabel(field)}</span><input inputMode={field === "emergencyNumber" ? "numeric" : undefined} value={form[field]} onChange={(event) => update(field, field === "emergencyNumber" ? formatMobile(event.target.value) : event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>)}
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Relation</span><select value={form.emergencyRelation} onChange={(event) => update("emergencyRelation", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"><option value="">Select relation</option><option>Family</option><option>Friend</option><option>Work / Colleague</option><option>Others</option></select></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700 sm:col-span-2"><span>Emergency Address</span><textarea rows={2} value={form.emergencyAddress} onChange={(event) => update("emergencyAddress", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>
      <h3 className="mt-2 border-b border-gray-100 pb-2 text-base font-semibold text-gray-900 sm:col-span-2">Job Information</h3>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Biometric No.</span><input value={form.biometricNo} onChange={(event) => update("biometricNo", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Employer</span><select value={form.employerId} onChange={(event) => update("employerId", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"><option value="">Unassigned</option>{employers.map((employer) => <option key={employer.id} value={employer.id}>{employer.name}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Status</span><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value, endDate: ["Contractual", "End of contract", "Resigned", "Terminated", "AWOL"].includes(event.target.value) ? current.endDate : "" }))} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900">{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Branch</span><select value={form.branch} onChange={(event) => update("branch", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"><option value="">Select branch</option>{branches.map((branch) => <option key={branch}>{branch}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Position</span><select value={form.position} onChange={(event) => update("position", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"><option value="">Select position</option>{positions.map((position) => <option key={position}>{position}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Job Level</span><select value={form.jobLevel} onChange={(event) => update("jobLevel", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"><option value="">Select job level</option>{JOB_LEVELS.map((jobLevel) => <option key={jobLevel}>{jobLevel}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Supervisor</span><select value={form.supervisorId} onChange={(event) => update("supervisorId", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"><option value="">No supervisor assigned</option>{supervisors.map((supervisor) => <option key={supervisor.id} value={supervisor.id}>{[supervisor.firstName, supervisor.middleName, supervisor.lastName].filter(Boolean).join(" ")}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Date Started</span><input type="date" value={form.dateStarted} onChange={(event) => update("dateStarted", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>
      {["Contractual", "End of contract", "Resigned", "Terminated", "AWOL"].includes(form.status) && <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Ended</span><input type="date" value={form.endDate} onChange={(event) => update("endDate", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>}
      <h3 className="mt-2 border-b border-gray-100 pb-2 text-base font-semibold text-gray-900 sm:col-span-2">Government Information</h3>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>SSS</span><input inputMode="numeric" placeholder="00-0000000-0" value={form.sssNumber} onChange={(event) => update("sssNumber", formatDigits(event.target.value, [2, 7, 1]))} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Pag-IBIG</span><input inputMode="numeric" placeholder="0000-0000-0000" value={form.pagIbigNumber} onChange={(event) => update("pagIbigNumber", formatDigits(event.target.value, [4, 4, 4]))} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>PhilHealth</span><input inputMode="numeric" placeholder="00-000000000-0" value={form.philHealth} onChange={(event) => update("philHealth", formatDigits(event.target.value, [2, 9, 1]))} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>TIN</span><input inputMode="numeric" placeholder="000-000-000-00000" value={form.tinNumber} onChange={(event) => update("tinNumber", formatDigits(event.target.value, [3, 3, 3, 5]))} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700 sm:col-span-2"><span>Remarks</span><textarea rows={3} value={form.remarks} onChange={(event) => update("remarks", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>
    </div>
    <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button></div>
  </form>;
}
