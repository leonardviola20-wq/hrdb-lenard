"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { BriefcaseIcon, BuildingOffice2Icon, CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, ClipboardDocumentListIcon, IdentificationIcon, UserCircleIcon, UsersIcon } from "@heroicons/react/24/outline";
import { getEmployeeServiceSummary } from "@/lib/employeeServiceDuration";
import { employeeRequirements, type EmployeeRequirementKey } from "@/lib/employeeRequirements";
import { useAppHeaderActions } from "@/components/Sidebar";
import {
  employeeDirectoryHref,
  employeeProfileHref,
  getFirstMatchingEmployee,
  getEmployeeNavigation,
  navigationFilterLabel,
  type EmployeeNavigationFilters,
  type NavigableEmployee,
} from "@/lib/employeeNavigation";

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
  supervisor: { id: number; firstName: string; middleName: string | null; lastName: string } | null;
  photoUrl: string | null;
  assignedBy: string | null;
  assignedAt: string | null;
  employer: { id: number; name: string; company: string | null } | null;
  officeContacts: {
    id: number;
    companyName: string;
    contactName: string;
    category: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    services: string | null;
    branch: string | null;
  }[];
  requirements: { requirementKey: EmployeeRequirementKey; isComplete: boolean }[];
};
type EmployeeProfileResponse = {
  employee: Employee;
  navigationEmployees?: NavigableEmployee[];
};

const profileCacheMaxAge = 30_000;
const profileCacheLimit = 12;
const employeeProfileCache = new Map<string, { employee: Employee; cachedAt: number }>();
const profileRequests = new Map<string, Promise<EmployeeProfileResponse>>();
let employeeNavigationCache: NavigableEmployee[] = [];
let profileCacheGeneration = 0;

function clearEmployeeProfileCache() {
  profileCacheGeneration += 1;
  employeeProfileCache.clear();
  profileRequests.clear();
  employeeNavigationCache = [];
}

if (typeof window !== "undefined") {
  window.addEventListener("hrdb-clear-employee-profile-cache", clearEmployeeProfileCache);
}

function cacheEmployeeProfile(id: string, employee: Employee) {
  employeeProfileCache.delete(id);
  employeeProfileCache.set(id, { employee, cachedAt: Date.now() });
  while (employeeProfileCache.size > profileCacheLimit) {
    const oldestId = employeeProfileCache.keys().next().value;
    if (oldestId === undefined) break;
    employeeProfileCache.delete(oldestId);
  }
}

function fetchEmployeeProfile(id: string, includeNavigation: boolean) {
  const requestKey = `${id}:${includeNavigation}`;
  const inFlight = profileRequests.get(requestKey);
  if (inFlight) return inFlight;

  const query = includeNavigation ? "" : "?includeNavigation=false";
  const generation = profileCacheGeneration;
  const request = fetch(`/api/employees/${id}${query}`, { cache: "no-store" })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load employee");
      const profile = data as EmployeeProfileResponse;
      if (generation === profileCacheGeneration) {
        cacheEmployeeProfile(id, profile.employee);
      }
      if (generation === profileCacheGeneration && Array.isArray(profile.navigationEmployees)) {
        employeeNavigationCache = profile.navigationEmployees;
      }
      return profile;
    })
    .finally(() => {
      if (profileRequests.get(requestKey) === request) profileRequests.delete(requestKey);
    });

  profileRequests.set(requestKey, request);
  return request;
}

function prefetchEmployeeProfile(id: number) {
  const cached = employeeProfileCache.get(String(id));
  if (cached && Date.now() - cached.cachedAt < profileCacheMaxAge) return;
  void fetchEmployeeProfile(String(id), false).catch((error: unknown) => {
    console.warn(`Unable to prefetch employee ${id}:`, error);
  });
}

function readNavigationFilters(searchParams: { get(name: string): string | null }): EmployeeNavigationFilters {
  return {
    status: searchParams.get("status") || "ACTIVE",
    branch: searchParams.get("branch") || "",
    employer: searchParams.get("employer") || "",
  };
}

const profileTabs = [
  { label: "Personal Information", icon: UserCircleIcon },
  { label: "Employment", icon: BriefcaseIcon },
  { label: "Government ID", icon: IdentificationIcon },
  { label: "Assignment and Remarks", icon: ClipboardDocumentListIcon },
  { label: "Requirements", icon: ClipboardDocumentListIcon },
] as const;
function dateText(value: string | null) {
  if (!value) return "Not set";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return year && month && day
    ? new Date(year, month - 1, day).toLocaleDateString()
    : "Not set";
}

function Value({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-gray-900">{value || "Not set"}</dd>
    </div>
  );
}

function ProfileSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="h-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="flex items-center gap-2 border-b border-gray-100 pb-3 text-base font-semibold text-gray-900"><Icon aria-hidden="true" className="h-5 w-5 text-blue-700" />{title}</h2>
      <dl className="mt-4 grid min-w-0 gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

export default function EmployeeProfilePage() {
  return (
    <Suspense fallback={<main className="flex min-h-0 flex-1 flex-col bg-gray-50 p-4 sm:p-6" />}>
      <EmployeeProfileContent />
    </Suspense>
  );
}

function EmployeeProfileContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAppHeaderActions = useAppHeaderActions();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [navigationEmployees, setNavigationEmployees] = useState<NavigableEmployee[]>(() => employeeNavigationCache);
  const filters = useMemo(() => readNavigationFilters(searchParams), [searchParams]);
  const [loadedEmployeeId, setLoadedEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingFilters, setRefreshingFilters] = useState(false);
  const [error, setError] = useState("");
  const [requirementsError, setRequirementsError] = useState("");
  const [savingRequirementKeys, setSavingRequirementKeys] = useState<Set<EmployeeRequirementKey>>(() => new Set());
  const [activeTab, setActiveTab] = useState<(typeof profileTabs)[number]["label"]>(profileTabs[0].label);

  useEffect(() => {
    if (!id) return;

    let active = true;
    const cachedProfile = employeeProfileCache.get(id);
    if (cachedProfile) {
      employeeProfileCache.delete(id);
      employeeProfileCache.set(id, cachedProfile);
    }

    const hasNavigationCache = employeeNavigationCache.length > 0;
    const isFresh = cachedProfile !== undefined && Date.now() - cachedProfile.cachedAt < profileCacheMaxAge;
    if (isFresh) return () => { active = false; };

    fetchEmployeeProfile(id, !hasNavigationCache)
      .then((data) => {
        if (active) {
          setEmployee(data.employee);
          if (Array.isArray(data.navigationEmployees)) {
            setNavigationEmployees(data.navigationEmployees);
          }
          setError("");
          setLoadedEmployeeId(id);
        }
      })
      .catch((loadError: Error) => {
        if (active && !cachedProfile) {
          setError(loadError.message);
          setLoadedEmployeeId(id);
        } else {
          console.error(`Unable to refresh employee ${id}:`, loadError);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  const displayedEmployee = loadedEmployeeId === id
    ? employee
    : employeeProfileCache.get(id)?.employee ?? null;
  const fullName = displayedEmployee
    ? [displayedEmployee.firstName, displayedEmployee.middleName, displayedEmployee.lastName].filter(Boolean).join(" ")
    : "Employee Profile";
  const isProfileLoading = loading && !displayedEmployee || loadedEmployeeId !== id && !displayedEmployee;
  const activeTabIndex = profileTabs.findIndex((tab) => tab.label === activeTab);
  const serviceSummary = getEmployeeServiceSummary(displayedEmployee?.status ?? null, displayedEmployee?.dateStarted ?? null, displayedEmployee?.endDate ?? null);
  const serviceDurationText = serviceSummary.duration
    ? `${serviceSummary.duration} in service`
    : serviceSummary.durationState === "not-set"
      ? "Not set"
      : serviceSummary.durationState === "not-active"
        ? "Not active"
        : "Invalid date range";

  const employerOptions = useMemo(() => {
    const options = new Map<number, string>();
    navigationEmployees.forEach((record) => {
      if (record.employerId !== null && record.employerName) {
        options.set(record.employerId, record.employerName);
      }
    });
    return [...options.entries()]
      .map(([employerId, name]) => ({ id: employerId, name }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [navigationEmployees]);
  const branchOptions = useMemo(
    () => [...new Set(navigationEmployees.map((record) => record.branch).filter((branch): branch is string => Boolean(branch)))].sort(),
    [navigationEmployees],
  );
  const currentNavigationEmployee = displayedEmployee
    ? navigationEmployees.find((record) => record.id === displayedEmployee.id) ?? null
    : null;
  const navigation = useMemo(
    () => currentNavigationEmployee
      ? getEmployeeNavigation(navigationEmployees, currentNavigationEmployee, filters)
      : { matching: [], currentIndex: -1, position: 0, previous: null, next: null },
    [currentNavigationEmployee, filters, navigationEmployees],
  );
  const selectedEmployerName = employerOptions.find((option) => String(option.id) === filters.employer)?.name ?? null;
  const previousEmployeeId = navigation.previous?.id ?? null;
  const nextEmployeeId = navigation.next?.id ?? null;

  const applyNavigationFilters = useCallback(async (nextFilters: EmployeeNavigationFilters) => {
    setRefreshingFilters(true);
    setError("");
    try {
      const data = await fetchEmployeeProfile(id, true);
      if (Array.isArray(data.navigationEmployees)) {
        setNavigationEmployees(data.navigationEmployees);
      }
      setEmployee(data.employee);
      setLoadedEmployeeId(id);
      const refreshedNavigationEmployees = data.navigationEmployees ?? navigationEmployees;
      const firstMatchingEmployee = getFirstMatchingEmployee(refreshedNavigationEmployees, nextFilters);
      router.replace(
        employeeProfileHref(firstMatchingEmployee?.id ?? Number(id), nextFilters),
        { scroll: false },
      );
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to refresh employee filters");
    } finally {
      setRefreshingFilters(false);
    }
  }, [id, navigationEmployees, router]);

  const updateRequirement = useCallback(async (requirementKey: EmployeeRequirementKey, isComplete: boolean) => {
    if (!displayedEmployee) return;
    const employeeId = displayedEmployee.id;
    setRequirementsError("");
    setSavingRequirementKeys((current) => new Set(current).add(requirementKey));
    try {
      const response = await fetch(`/api/employees/${employeeId}/requirements`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementKey, isComplete }),
      });
      const data: {
        requirement?: { requirementKey: EmployeeRequirementKey; isComplete: boolean };
        error?: string;
      } = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update employee requirement");
      if (!data.requirement) throw new Error("The requirement update response was incomplete");
      const savedRequirement = data.requirement;

      const cachedEmployee = employeeProfileCache.get(String(employeeId))?.employee;
      const currentEmployee = cachedEmployee ?? (displayedEmployee.id === employeeId ? displayedEmployee : null);
      if (currentEmployee) {
        const requirements = currentEmployee.requirements.filter((item) => item.requirementKey !== requirementKey);
        requirements.push(savedRequirement);
        cacheEmployeeProfile(String(employeeId), { ...currentEmployee, requirements });
      }
      setEmployee((current) => {
        if (!current || current.id !== employeeId) return current;
        const requirements = current.requirements.filter((item) => item.requirementKey !== requirementKey);
        requirements.push(savedRequirement);
        return { ...current, requirements };
      });
    } catch (saveError) {
      setRequirementsError(saveError instanceof Error ? saveError.message : "Unable to update employee requirement");
    } finally {
      setSavingRequirementKeys((current) => {
        const next = new Set(current);
        next.delete(requirementKey);
        return next;
      });
    }
  }, [displayedEmployee]);

  useEffect(() => {
    if (previousEmployeeId !== null) prefetchEmployeeProfile(previousEmployeeId);
    if (nextEmployeeId !== null) prefetchEmployeeProfile(nextEmployeeId);
  }, [nextEmployeeId, previousEmployeeId]);

  useEffect(() => {
    if (!displayedEmployee || error) {
      setAppHeaderActions(null);
      return;
    }
    setAppHeaderActions(
      {
        backHref: employeeDirectoryHref(filters),
        actions: <>
        {navigation.previous ? (
          <Link
            href={employeeProfileHref(navigation.previous.id, filters)}
            aria-label="Previous employee record"
            title="Previous employee record"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <ChevronLeftIcon aria-hidden="true" className="h-5 w-5" />
          </Link>
        ) : (
          <button
            type="button"
            disabled
            aria-label="No previous employee record"
            title="No previous employee record"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <ChevronLeftIcon aria-hidden="true" className="h-5 w-5" />
          </button>
        )}
        {navigation.next ? (
          <Link
            href={employeeProfileHref(navigation.next.id, filters)}
            aria-label="Next employee record"
            title="Next employee record"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <ChevronRightIcon aria-hidden="true" className="h-5 w-5" />
          </Link>
        ) : (
          <button
            type="button"
            disabled
            aria-label="No next employee record"
            title="No next employee record"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <ChevronRightIcon aria-hidden="true" className="h-5 w-5" />
          </button>
        )}
        <div className="ml-auto flex min-w-0 flex-wrap items-end gap-2">
          <select
            aria-label="Filter by branch"
            value={filters.branch}
            disabled={refreshingFilters}
            onChange={(event) => applyNavigationFilters({ ...filters, branch: event.target.value })}
            className="h-10 w-36 rounded-lg border border-gray-300 bg-white px-3 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All branches</option>
            {branchOptions.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
          </select>
          <select
            aria-label="Filter by employer"
            value={filters.employer}
            disabled={refreshingFilters}
            onChange={(event) => applyNavigationFilters({ ...filters, employer: event.target.value })}
            className="h-10 w-40 rounded-lg border border-gray-300 bg-white px-3 text-base text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All employers</option>
            {employerOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
          </select>
          <div className="min-w-fit pb-1 text-xs text-gray-600" aria-live="polite">
            <div className="font-medium text-gray-700">{navigationFilterLabel(filters, selectedEmployerName)}</div>
            <div>Showing <span className="font-semibold text-gray-900">{String(navigation.position).padStart(2, "0")}</span> of <span className="font-semibold text-gray-900">{String(navigation.matching.length).padStart(2, "0")}</span></div>
          </div>
        </div>
      </>,
      },
    );
    return () => setAppHeaderActions(null);
  }, [applyNavigationFilters, branchOptions, displayedEmployee, employerOptions, error, filters, id, navigation.matching.length, navigation.next, navigation.position, navigation.previous, refreshingFilters, router, selectedEmployerName, setAppHeaderActions]);

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-gray-50 p-4 sm:p-6">
      <div className="flex w-full flex-1 flex-col">
        {isProfileLoading ? (
          <p role="status" className="mt-5 text-sm text-gray-600">Loading employee profile...</p>
        ) : error ? (
          <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
        ) : displayedEmployee ? (
          <>
            <header className="mt-1 flex flex-wrap items-center gap-4">
              {displayedEmployee.photoUrl ? (
                <img src={displayedEmployee.photoUrl} alt={`${fullName} profile`} className="h-24 w-24 shrink-0 rounded-full border-2 border-gray-200 object-cover" />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-500">No photo</div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-xl font-bold text-gray-950 sm:text-2xl">{fullName}</h2>
                <p className="mt-1 text-sm font-medium text-gray-700">{displayedEmployee.position || "Position not set"} <span className="px-1 text-gray-400">•</span> {displayedEmployee.branch || "Branch not set"}</p>
                <p className="mt-1 text-sm text-gray-600">{displayedEmployee.biometricNo || "Not set"}</p>
                <p className={`mt-1 text-sm font-semibold ${["Regular", "Contractual", "Trainee", "Leave"].includes(displayedEmployee.status || "") ? "text-green-700" : "text-gray-700"}`}>
                  {displayedEmployee.status || "Status not set"}
                </p>
              </div>
            </header>

            <div className="mt-5 flex flex-1 flex-col">
              <div role="tablist" aria-label="Employee profile sections" className="shrink-0 overflow-x-auto border-b border-gray-200">
                <div className="flex min-w-max">
                  {profileTabs.map((tab, index) => {
                    const Icon = tab.icon;
                    return (
                    <button
                      key={tab.label}
                      id={`employee-profile-tab-${index}`}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === tab.label}
                      aria-controls="employee-profile-panel"
                      tabIndex={activeTab === tab.label ? 0 : -1}
                      onClick={() => setActiveTab(tab.label)}
                      onKeyDown={(event) => {
                        const nextIndex = event.key === "ArrowRight" || event.key === "ArrowDown"
                          ? (index + 1) % profileTabs.length
                          : event.key === "ArrowLeft" || event.key === "ArrowUp"
                            ? (index - 1 + profileTabs.length) % profileTabs.length
                            : event.key === "Home"
                              ? 0
                              : event.key === "End"
                                ? profileTabs.length - 1
                                : index;
                        if (nextIndex !== index) {
                          event.preventDefault();
                          setActiveTab(profileTabs[nextIndex].label);
                          document.getElementById(`employee-profile-tab-${nextIndex}`)?.focus();
                        }
                      }}
                      className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${activeTab === tab.label ? "border-blue-700 text-blue-800" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800"}`}
                    >
                      <Icon aria-hidden="true" className="h-4 w-4" />
                      {tab.label}
                    </button>
                    );
                  })}
                </div>
              </div>

              <div id="employee-profile-panel" role="tabpanel" aria-labelledby={`employee-profile-tab-${activeTabIndex}`} className="mt-4 flex flex-1">
              {activeTab === "Personal Information" && <div className="grid flex-1 gap-5 xl:grid-cols-2">
                <ProfileSection title="Personal Information" icon={UserCircleIcon}>
                  <div className="grid gap-5 sm:col-span-2">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Value label="First Name" value={displayedEmployee.firstName} />
                      <Value label="Middle Name" value={displayedEmployee.middleName} />
                      <Value label="Last Name" value={displayedEmployee.lastName} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Value label="Date of Birth" value={dateText(displayedEmployee.dateOfBirth)} />
                      <Value label="Age" value={displayedEmployee.age} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Value label="Gender" value={displayedEmployee.gender} />
                      <Value label="Marital Status" value={displayedEmployee.maritalStatus} />
                    </div>
                  </div>
                </ProfileSection>
                <ProfileSection title="Contact Information" icon={IdentificationIcon}>
                  <Value label="Mobile Number" value={displayedEmployee.mobileNumber} />
                  <Value label="Email" value={displayedEmployee.email} />
                  <div className="sm:col-span-2"><Value label="Address" value={displayedEmployee.address} /></div>
                </ProfileSection>
                <ProfileSection title="Emergency Information" icon={UsersIcon}>
                  <Value label="Contact Person" value={displayedEmployee.emergencyName} />
                  <Value label="Contact Number" value={displayedEmployee.emergencyNumber} />
                  <Value label="Relation" value={displayedEmployee.emergencyRelation} />
                  <div className="sm:col-span-2"><Value label="Address" value={displayedEmployee.emergencyAddress} /></div>
                </ProfileSection>
              </div>}

              {activeTab === "Employment" && <div className="grid flex-1 gap-5 xl:grid-cols-2">
                <ProfileSection title="Contract Duration" icon={CalendarDaysIcon}>
                  <Value label="Date Started" value={dateText(displayedEmployee.dateStarted)} />
                  <Value label="End Date" value={dateText(displayedEmployee.endDate)} />
                  <Value label="Service Duration" value={serviceDurationText} />
                  {serviceSummary.expiryDaysRemaining !== null && <Value label="Contract Expiry" value={serviceSummary.expiryDaysRemaining > 0 ? `${serviceSummary.expiryDaysRemaining} days remaining` : serviceSummary.expiryDaysRemaining === 0 ? "Expires today" : `Expired ${Math.abs(serviceSummary.expiryDaysRemaining)} days ago`} />}
                  <Value label="Status" value={displayedEmployee.status} />
                </ProfileSection>
                <ProfileSection title="Contract Position Details" icon={BriefcaseIcon}>
                  <Value label="Job Role" value={displayedEmployee.position} />
                  <Value label="Job Level" value={displayedEmployee.jobLevel} />
                  <Value label="Expected Work Hours per Week" value="48 hours" />
                  <Value label="Supervisor" value={displayedEmployee.supervisor ? [displayedEmployee.supervisor.firstName, displayedEmployee.supervisor.middleName, displayedEmployee.supervisor.lastName].filter(Boolean).join(" ") : "Not assigned"} />
                </ProfileSection>
                <ProfileSection title="Contract Details" icon={BuildingOffice2Icon}>
                  <Value label="Employer" value={displayedEmployee.employer?.name} />
                  <Value label="Branch" value={displayedEmployee.branch} />
                  <Value label="Date Started" value={dateText(displayedEmployee.dateStarted)} />
                </ProfileSection>
              </div>}

              {activeTab === "Government ID" && <div className="grid flex-1 gap-5 xl:grid-cols-2">
                <ProfileSection title="Government ID" icon={IdentificationIcon}>
                  <Value label="SSS" value={displayedEmployee.sssNumber} />
                  <Value label="Pag-IBIG" value={displayedEmployee.pagIbigNumber} />
                  <Value label="PhilHealth" value={displayedEmployee.philHealth} />
                  <Value label="TIN" value={displayedEmployee.tinNumber} />
                </ProfileSection>
              </div>}

              {activeTab === "Assignment and Remarks" && <div className="grid flex-1 gap-5 xl:grid-cols-2">
                <ProfileSection title="Assignment and Remarks" icon={ClipboardDocumentListIcon}>
                  <Value label="Assigned By" value={displayedEmployee.assignedBy} />
                  <Value label="Assigned At" value={dateText(displayedEmployee.assignedAt)} />
                  <div className="sm:col-span-2"><Value label="Remarks" value={displayedEmployee.remarks} /></div>
                </ProfileSection>
              </div>}

              {activeTab === "Requirements" && <div className="grid flex-1 gap-5 xl:grid-cols-2">
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="flex items-center gap-2 border-b border-gray-100 pb-3 text-base font-semibold text-gray-900">
                    <ClipboardDocumentListIcon aria-hidden="true" className="h-5 w-5 text-blue-700" />
                    Employee Requirements
                  </h2>
                  <div className="mt-4">
                    <p className="mb-4 text-sm text-gray-600">Check each item after it has been submitted and verified.</p>
                    {requirementsError && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{requirementsError}</p>}
                    <ul className="space-y-2">
                      {employeeRequirements.map((requirement) => {
                        const isComplete = displayedEmployee.requirements.some((item) => item.requirementKey === requirement.key && item.isComplete);
                        const isSaving = savingRequirementKeys.has(requirement.key);
                        return (
                          <li key={requirement.key}>
                            <label className={`flex min-h-11 items-start gap-3 rounded-lg border border-gray-100 px-3 py-2.5 text-sm text-gray-800 transition hover:bg-gray-50 ${isSaving ? "opacity-60" : ""}`}>
                              <input
                                type="checkbox"
                                checked={isComplete}
                                disabled={isSaving}
                                onChange={(event) => void updateRequirement(requirement.key, event.target.checked)}
                                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-700 focus:ring-blue-600"
                              />
                              <span className="min-w-0 flex-1">{requirement.label}</span>
                              {isSaving && <span className="shrink-0 text-xs text-gray-500">Saving…</span>}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-4 text-sm font-medium text-gray-700">
                      {displayedEmployee.requirements.filter((item) => item.isComplete && employeeRequirements.some((requirement) => requirement.key === item.requirementKey)).length} of {employeeRequirements.length} complete
                    </p>
                  </div>
                </section>
              </div>}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
