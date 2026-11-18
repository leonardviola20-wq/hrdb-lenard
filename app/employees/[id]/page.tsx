"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownTrayIcon, ArrowUpTrayIcon, BriefcaseIcon, BuildingOffice2Icon, CalendarDaysIcon, CheckIcon, ClipboardDocumentListIcon, EyeIcon, EyeSlashIcon, IdentificationIcon, PencilSquareIcon, PlusIcon, TrashIcon, UserCircleIcon, UsersIcon } from "@heroicons/react/24/outline";
import { JOB_LEVELS } from "@/lib/employeePayload";
import { getEmployeeServiceSummary } from "@/lib/employeeServiceDuration";
import { calculateAge, formatDigits, formatMobile, readPhotoAsDataUrl } from "@/components/employee-profile-editor/utils";
import { branchOptions, endedStatuses, positionOptions, statusOptions } from "@/components/employee-profile-editor/types";
import {
  employeeRequirementGroups,
  employeeRequirements,
  getApplicableEmployeeRequirements,
  getEmployeeRequirementCompletion,
  isSingleEmployee,
  type EmployeeRequirementKey,
} from "@/lib/employeeRequirements";
import BackButton from "@/components/BackButton";
import {
  employeeDirectoryHref,
  employeeProfileTabHref,
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
  requirements: {
    requirementKey: EmployeeRequirementKey;
    isComplete: boolean;
    attachments: RequirementAttachment[];
  }[];
  bdoAccountNumbers: BdoAccountNumber[];
  requirementsBypassed: boolean;
};
type EmployeeEditDraft = Employee & { employerId: number | null };
type EmployerOption = { id: number; name: string };
type SupervisorOption = { id: number; firstName: string; middleName: string | null; lastName: string; position: string | null };
type RequirementAttachment = {
  id: number;
  requirementKey: EmployeeRequirementKey;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};
type BdoAccountNumber = { id: number; accountNumber: string; createdAt: string };
type EmployeeProfileResponse = {
  employee: Employee;
  navigationEmployees?: NavigableEmployee[];
};

const profileCacheMaxAge = 30_000;
const profileCacheLimit = 12;
const employeeProfileCache = new Map<string, { employee: Employee; cachedAt: number }>();
const profileRequests = new Map<string, Promise<EmployeeProfileResponse>>();
let profileCacheGeneration = 0;

function clearEmployeeProfileCache() {
  profileCacheGeneration += 1;
  employeeProfileCache.clear();
  profileRequests.clear();
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
      return profile;
    })
    .finally(() => {
      if (profileRequests.get(requestKey) === request) profileRequests.delete(requestKey);
    });

  profileRequests.set(requestKey, request);
  return request;
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
  { label: "Government", icon: IdentificationIcon },
  { label: "Requirements", icon: ClipboardDocumentListIcon },
] as const;

// "Government ID" was renamed to "Government"; keep old shared links opening the renamed tab.
function resolveProfileTabLabel(label: string | null) {
  const requested = label === "Government ID" ? "Government" : label;
  return profileTabs.find((tab) => tab.label === requested)?.label;
}
function dateText(value: string | null) {
  if (!value) return "Not set";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return year && month && day
    ? new Date(year, month - 1, day).toLocaleDateString()
    : "Not set";
}

function dateInputValue(value: string | null) {
  return value?.slice(0, 10) ?? "";
}

function employeeUpdatePayload(employee: EmployeeEditDraft, previous?: Employee) {
  const dateOfBirth = dateInputValue(employee.dateOfBirth);
  return {
    firstName: employee.firstName,
    middleName: employee.middleName,
    lastName: employee.lastName,
    dateOfBirth,
    age: previous && dateOfBirth === dateInputValue(previous.dateOfBirth)
      ? previous.age
      : calculateAge(dateOfBirth),
    maritalStatus: employee.maritalStatus,
    gender: employee.gender,
    mobileNumber: employee.mobileNumber,
    email: employee.email,
    address: employee.address,
    emergencyName: employee.emergencyName,
    emergencyNumber: employee.emergencyNumber,
    emergencyRelation: employee.emergencyRelation,
    emergencyAddress: employee.emergencyAddress,
    biometricNo: employee.biometricNo,
    branch: employee.branch,
    position: employee.position,
    jobLevel: employee.jobLevel,
    supervisorId: employee.supervisorId,
    photoUrl: employee.photoUrl,
    employerId: employee.employerId,
    status: employee.status,
    dateStarted: dateInputValue(employee.dateStarted),
    endDate: dateInputValue(employee.endDate),
    sssNumber: employee.sssNumber,
    pagIbigNumber: employee.pagIbigNumber,
    philHealth: employee.philHealth,
    tinNumber: employee.tinNumber,
    remarks: employee.remarks,
  };
}

function Value({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="min-w-0">
      <span className="text-xs tracking-wide text-gray-500">{label}</span>
      <p className="mt-1 break-words font-semibold text-gray-900">{value || "Not set"}</p>
    </div>
  );
}

function ProfileInput({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="grid min-w-0 gap-1.5">
      <span className="text-xs tracking-wide text-gray-500">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function ProfileSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <label className="grid min-w-0 gap-1.5">
      <span className="text-xs tracking-wide text-gray-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function ProfileSection({
  title,
  icon: Icon,
  cardKey,
  editingCard,
  saving,
  onStartEdit,
  onSave,
  children,
}: {
  title: string;
  icon: React.ElementType;
  cardKey?: string;
  editingCard?: string | null;
  saving?: boolean;
  onStartEdit?: (cardKey: string) => void;
  onSave?: (cardKey: string) => void;
  children: React.ReactNode;
}) {
  const isEditing = cardKey !== undefined && editingCard === cardKey;
  return (
    <section className="h-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="flex items-center gap-2 border-b border-gray-100 pb-3 text-base font-semibold text-gray-900">
        <Icon aria-hidden="true" className="h-5 w-5 text-blue-700" />
        {title}
        {cardKey && (
          <button
            type="button"
            onClick={() => isEditing ? onSave?.(cardKey) : onStartEdit?.(cardKey)}
            disabled={saving || (editingCard != null && !isEditing)}
            aria-label={isEditing ? `Save ${title}; press Escape to cancel` : `Edit ${title}`}
            title={isEditing ? "Save changes (press Escape to cancel)" : `Edit ${title}`}
            className={`ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${isEditing ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"}`}
          >
            {isEditing
              ? <CheckIcon aria-hidden="true" className={`h-4 w-4 ${saving ? "animate-pulse" : ""}`} />
              : <PencilSquareIcon aria-hidden="true" className="h-4 w-4" />}
          </button>
        )}
      </h2>
      <div className="mt-4 grid min-w-0 gap-x-6 gap-y-4 sm:grid-cols-2">{children}</div>
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const filters = useMemo(() => readNavigationFilters(searchParams), [searchParams]);
  const [loadedEmployeeId, setLoadedEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requirementsError, setRequirementsError] = useState("");
  const [savingRequirementKeys, setSavingRequirementKeys] = useState<Set<EmployeeRequirementKey>>(() => new Set());
  const [markingAllRequirements, setMarkingAllRequirements] = useState(false);
  const [bulkRequirementsToggle, setBulkRequirementsToggle] = useState<boolean | null>(null);
  const [togglingRequirementsBypass, setTogglingRequirementsBypass] = useState(false);
  const [requirementsBaseline, setRequirementsBaseline] = useState<{ employeeId: number; keys: Set<EmployeeRequirementKey> } | null>(null);
  const [uploadingRequirementKeys, setUploadingRequirementKeys] = useState<Set<EmployeeRequirementKey>>(() => new Set());
  const [revealedAccountNumbers, setRevealedAccountNumbers] = useState<Set<number>>(() => new Set());
  const [accountNumberDraft, setAccountNumberDraft] = useState("");
  const [savingAccountNumber, setSavingAccountNumber] = useState(false);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EmployeeEditDraft | null>(null);
  const [savingCard, setSavingCard] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editError, setEditError] = useState("");
  const [editOptionsLoading, setEditOptionsLoading] = useState(false);
  const [employerOptions, setEmployerOptions] = useState<EmployerOption[]>([]);
  const [supervisorOptions, setSupervisorOptions] = useState<SupervisorOption[]>([]);
  const editOptionsRequest = useRef(0);
  const [activeTab, setActiveTab] = useState<(typeof profileTabs)[number]["label"]>(
    () => resolveProfileTabLabel(searchParams.get("tab")) ?? profileTabs[0].label,
  );

  useEffect(() => {
    const requestedTab = resolveProfileTabLabel(searchParams.get("tab"));
    if (requestedTab) setActiveTab(requestedTab);
  }, [searchParams]);

  // The active tab lives in the URL, so browser Back/Forward — and any return from a
  // deeper page such as SSS Contributions — reopens the tab the user was reading.
  const selectProfileTab = useCallback((label: (typeof profileTabs)[number]["label"]) => {
    setActiveTab(label);
    const href = employeeProfileTabHref(id, searchParams.toString(), label);
    if (`${window.location.pathname}${window.location.search}` !== href) {
      router.replace(href, { scroll: false });
    }
  }, [id, router, searchParams]);

  useEffect(() => {
    if (!id) return;

    let active = true;
    const cachedProfile = employeeProfileCache.get(id);
    if (cachedProfile) {
      employeeProfileCache.delete(id);
      employeeProfileCache.set(id, cachedProfile);
    }

    const isFresh = cachedProfile !== undefined && Date.now() - cachedProfile.cachedAt < profileCacheMaxAge;
    if (isFresh) return () => { active = false; };

    fetchEmployeeProfile(id, false)
      .then((data) => {
        if (active) {
          setEmployee(data.employee);
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
  const profileDraft = editDraft ?? (displayedEmployee
    ? { ...displayedEmployee, employerId: displayedEmployee.employer?.id ?? null }
    : null);
  const fullName = displayedEmployee
    ? [displayedEmployee.firstName, displayedEmployee.middleName, displayedEmployee.lastName].filter(Boolean).join(" ")
    : "Employee Profile";
  const isProfileLoading = loading && !displayedEmployee || loadedEmployeeId !== id && !displayedEmployee;
  const activeTabIndex = profileTabs.findIndex((tab) => tab.label === activeTab);
  const serviceSummary = getEmployeeServiceSummary(displayedEmployee?.status ?? null, displayedEmployee?.dateStarted ?? null, displayedEmployee?.endDate ?? null);
  const serviceDurationText = serviceSummary.years !== null
    ? `${serviceSummary.years} ${serviceSummary.years === 1 ? "year" : "years"} in service`
    : serviceSummary.durationState === "not-set"
      ? "Not set"
      : serviceSummary.durationState === "not-active"
        ? "Not active"
        : "Invalid date range";

  const requirementCompletion = displayedEmployee
    ? getEmployeeRequirementCompletion(
      displayedEmployee.requirements,
      displayedEmployee.maritalStatus,
      displayedEmployee.bdoAccountNumbers.length,
    )
    : { completed: 0, total: employeeRequirements.length };
  const requirementsAllMarkableComplete = displayedEmployee
    ? getApplicableEmployeeRequirements(displayedEmployee.maritalStatus).every((requirement) => {
      // The BDO item cannot be marked without an account number and the bulk
      // toggle skips it, so it must not pull the switch back to off.
      if (requirement.key === "bdoSavingsAccount" && displayedEmployee.bdoAccountNumbers.length === 0) return true;
      return displayedEmployee.requirements.some((item) => item.requirementKey === requirement.key && item.isComplete);
    })
    : false;
  const requirementsToggleOn = bulkRequirementsToggle ?? requirementsAllMarkableComplete;
  const updateDisplayedEmployee = useCallback((employeeId: number, update: (current: Employee) => Employee) => {
    const source = employee?.id === employeeId
      ? employee
      : employeeProfileCache.get(String(employeeId))?.employee;
    if (!source) return;
    const updated = update(source);
    cacheEmployeeProfile(String(employeeId), updated);
    setEmployee(updated);
  }, [employee]);

  const updateEditDraft = useCallback(<K extends keyof EmployeeEditDraft>(field: K, value: EmployeeEditDraft[K]) => {
    setEditDraft((current) => current ? { ...current, [field]: value } : current);
  }, []);

  const cancelCardEdit = useCallback(() => {
    if (savingCard) return;
    editOptionsRequest.current += 1;
    setEditOptionsLoading(false);
    setEditingCard(null);
    setEditDraft(null);
    setEditError("");
  }, [savingCard]);

  useEffect(() => {
    if (!editingCard) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !savingCard) {
        event.preventDefault();
        cancelCardEdit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cancelCardEdit, editingCard, savingCard]);

  const startCardEdit = useCallback(async (cardKey: string) => {
    if (!displayedEmployee || editingCard !== null || uploadingPhoto || savingCard !== null) return;
    setEditingCard(cardKey);
    setEditDraft({ ...displayedEmployee, employerId: displayedEmployee.employer?.id ?? null });
    setEditError("");

    if (cardKey !== "position" && cardKey !== "contract") return;
    const requestId = ++editOptionsRequest.current;
    setEditOptionsLoading(true);
    try {
      if (cardKey === "position") {
        const response = await fetch("/api/employees", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load supervisor options");
        if (editOptionsRequest.current === requestId) {
          setSupervisorOptions(
            (data.employees as SupervisorOption[])
              .filter((employee) => employee.position === "Store In-charge" && employee.id !== displayedEmployee.id),
          );
        }
      } else {
        const response = await fetch("/api/employers", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load employer options");
        if (editOptionsRequest.current === requestId) setEmployerOptions(data.employers as EmployerOption[]);
      }
    } catch (optionsError) {
      if (editOptionsRequest.current === requestId) {
        setEditError(optionsError instanceof Error ? optionsError.message : "Unable to load edit options");
      }
    } finally {
      if (editOptionsRequest.current === requestId) setEditOptionsLoading(false);
    }
  }, [displayedEmployee, editingCard, savingCard, uploadingPhoto]);

  const saveCardEdit = useCallback(async (cardKey: string) => {
    if (!displayedEmployee || !editDraft || editingCard !== cardKey || savingCard) return;
    const employeeId = displayedEmployee.id;
    setSavingCard(cardKey);
    setEditError("");
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employeeUpdatePayload(editDraft, displayedEmployee)),
      });
      const data: { employee?: Partial<Employee>; error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save employee changes");
      if (!data.employee) throw new Error("The employee update response was incomplete");

      updateDisplayedEmployee(employeeId, (current) => ({
        ...current,
        ...data.employee,
        officeContacts: current.officeContacts,
        requirements: current.requirements,
        bdoAccountNumbers: current.bdoAccountNumbers,
      }));
      setEditingCard(null);
      setEditDraft(null);
    } catch (saveError) {
      setEditError(saveError instanceof Error ? saveError.message : "Unable to save employee changes");
    } finally {
      setSavingCard(null);
    }
  }, [displayedEmployee, editDraft, editingCard, savingCard, updateDisplayedEmployee]);

  const uploadEmployeePhoto = useCallback(async (file: File) => {
    if (!displayedEmployee || uploadingPhoto || savingCard || editingCard !== null) return;
    setUploadingPhoto(true);
    setEditError("");
    try {
      const photoUrl = await readPhotoAsDataUrl(file);
      const updatedEmployee = { ...displayedEmployee, photoUrl };
      const response = await fetch(`/api/employees/${displayedEmployee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employeeUpdatePayload(
          { ...updatedEmployee, employerId: displayedEmployee.employer?.id ?? null },
          displayedEmployee,
        )),
      });
      const data: { employee?: Partial<Employee>; error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update employee photo");
      if (!data.employee) throw new Error("The employee photo update response was incomplete");

      updateDisplayedEmployee(displayedEmployee.id, (current) => ({
        ...current,
        ...data.employee,
        officeContacts: current.officeContacts,
        requirements: current.requirements,
        bdoAccountNumbers: current.bdoAccountNumbers,
      }));
    } catch (uploadError) {
      setEditError(uploadError instanceof Error ? uploadError.message : "Unable to update employee photo");
    } finally {
      setUploadingPhoto(false);
    }
  }, [displayedEmployee, editingCard, savingCard, updateDisplayedEmployee, uploadingPhoto]);

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

      updateDisplayedEmployee(employeeId, (current) => {
        const requirements = current.requirements.filter((item) => item.requirementKey !== requirementKey);
        requirements.push({ ...savedRequirement, attachments: current.requirements.find((item) => item.requirementKey === requirementKey)?.attachments ?? [] });
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
  }, [displayedEmployee, updateDisplayedEmployee]);

  const toggleAllRequirementsComplete = useCallback(async (isComplete: boolean) => {
    if (!displayedEmployee || markingAllRequirements) return;
    const employeeId = displayedEmployee.id;
    setRequirementsError("");
    setMarkingAllRequirements(true);
    setBulkRequirementsToggle(isComplete);
    try {
      const applicable = getApplicableEmployeeRequirements(displayedEmployee.maritalStatus);
      const completedKeys = new Set(
        displayedEmployee.requirements
          .filter((item) => item.isComplete)
          .map((item) => item.requirementKey),
      );
      const hasBdoAccount = displayedEmployee.bdoAccountNumbers.length > 0;

      let pending: typeof applicable;
      if (isComplete) {
        // Save the already-checked items first so restoring later keeps them checked.
        setRequirementsBaseline({ employeeId, keys: new Set(completedKeys) });
        pending = applicable.filter((requirement) => (
          !completedKeys.has(requirement.key)
          && (requirement.key !== "bdoSavingsAccount" || hasBdoAccount)
        ));
      } else {
        // Restore the saved state: only clear items the bulk action checked.
        const baseline = requirementsBaseline?.employeeId === employeeId ? requirementsBaseline.keys : null;
        pending = applicable.filter((requirement) => (
          completedKeys.has(requirement.key) && !baseline?.has(requirement.key)
        ));
        setRequirementsBaseline(null);
      }

      for (const requirement of pending) {
        const response = await fetch(`/api/employees/${employeeId}/requirements`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requirementKey: requirement.key, isComplete }),
        });
        const data: {
          requirement?: { requirementKey: EmployeeRequirementKey; isComplete: boolean };
          error?: string;
        } = await response.json();
        if (!response.ok) throw new Error(data.error || `Unable to update ${requirement.label}`);
        if (!data.requirement) throw new Error("The requirement update response was incomplete");
        const savedRequirement = data.requirement;
        updateDisplayedEmployee(employeeId, (current) => {
          const requirements = current.requirements.filter((item) => item.requirementKey !== requirement.key);
          requirements.push({ ...savedRequirement, attachments: current.requirements.find((item) => item.requirementKey === requirement.key)?.attachments ?? [] });
          return { ...current, requirements };
        });
      }
    } catch (saveError) {
      setRequirementsError(saveError instanceof Error ? saveError.message : "Unable to update requirements");
    } finally {
      setBulkRequirementsToggle(null);
      setMarkingAllRequirements(false);
    }
  }, [displayedEmployee, markingAllRequirements, requirementsBaseline, updateDisplayedEmployee]);

  const toggleRequirementsBypass = useCallback(async (bypassed: boolean) => {
    if (!displayedEmployee || togglingRequirementsBypass) return;
    const employeeId = displayedEmployee.id;
    setRequirementsError("");
    setTogglingRequirementsBypass(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}/requirements/bypass`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bypassed }),
      });
      const data: {
        bypassed?: boolean;
        requirements?: { requirementKey: EmployeeRequirementKey; isComplete: boolean }[];
        error?: string;
      } = await response.json();
      if (!response.ok || typeof data.bypassed !== "boolean") {
        throw new Error(data.error || "Unable to update requirement bypass");
      }
      updateDisplayedEmployee(employeeId, (current) => ({
        ...current,
        requirementsBypassed: data.bypassed!,
        requirements: bypassed && data.requirements
          ? data.requirements.map((saved) => ({
            ...saved,
            attachments: current.requirements.find((item) => item.requirementKey === saved.requirementKey)?.attachments ?? [],
          }))
          : current.requirements,
      }));
    } catch (bypassError) {
      setRequirementsError(bypassError instanceof Error ? bypassError.message : "Unable to update requirement bypass");
    } finally {
      setTogglingRequirementsBypass(false);
    }
  }, [displayedEmployee, togglingRequirementsBypass, updateDisplayedEmployee]);

  const uploadRequirementAttachments = useCallback(async (requirementKey: EmployeeRequirementKey, files: File[]) => {
    if (!displayedEmployee || files.length === 0) return;
    const employeeId = displayedEmployee.id;
    setRequirementsError("");
    setUploadingRequirementKeys((current) => new Set(current).add(requirementKey));
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.set("file", file);
        const response = await fetch(`/api/employees/${employeeId}/requirements/${requirementKey}/attachments`, {
          method: "POST",
          body: formData,
        });
        const data: { attachment?: RequirementAttachment; error?: string } = await response.json();
        if (!response.ok) throw new Error(data.error || `Unable to upload ${file.name}`);
        if (!data.attachment) throw new Error("The attachment upload response was incomplete");
        updateDisplayedEmployee(employeeId, (current) => {
          const requirement = current.requirements.find((item) => item.requirementKey === requirementKey);
          const nextRequirement = {
            requirementKey,
            isComplete: requirement?.isComplete ?? false,
            attachments: [...(requirement?.attachments ?? []), data.attachment!],
          };
          return {
            ...current,
            requirements: [
              ...current.requirements.filter((item) => item.requirementKey !== requirementKey),
              nextRequirement,
            ],
          };
        });
      }
    } catch (uploadError) {
      setRequirementsError(uploadError instanceof Error ? uploadError.message : "Unable to upload requirement attachment");
    } finally {
      setUploadingRequirementKeys((current) => {
        const next = new Set(current);
        next.delete(requirementKey);
        return next;
      });
    }
  }, [displayedEmployee, updateDisplayedEmployee]);

  const deleteRequirementAttachment = useCallback(async (attachment: RequirementAttachment) => {
    if (!displayedEmployee) return;
    const employeeId = displayedEmployee.id;
    setRequirementsError("");
    setUploadingRequirementKeys((current) => new Set(current).add(attachment.requirementKey));
    try {
      const response = await fetch(
        `/api/employees/${employeeId}/requirements/${attachment.requirementKey}/attachments/${attachment.id}`,
        { method: "DELETE" },
      );
      const data: { error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to remove attachment");
      updateDisplayedEmployee(employeeId, (current) => ({
        ...current,
        requirements: current.requirements.map((item) => item.requirementKey === attachment.requirementKey
          ? { ...item, attachments: item.attachments.filter((saved) => saved.id !== attachment.id) }
          : item),
      }));
    } catch (deleteError) {
      setRequirementsError(deleteError instanceof Error ? deleteError.message : "Unable to remove attachment");
    } finally {
      setUploadingRequirementKeys((current) => {
        const next = new Set(current);
        next.delete(attachment.requirementKey);
        return next;
      });
    }
  }, [displayedEmployee, updateDisplayedEmployee]);

  const addBdoAccountNumber = useCallback(async () => {
    if (!displayedEmployee || savingAccountNumber) return;
    const employeeId = displayedEmployee.id;
    setRequirementsError("");
    setSavingAccountNumber(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}/bdo-account-numbers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber: accountNumberDraft }),
      });
      const data: { account?: BdoAccountNumber; error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to add BDO account number");
      if (!data.account) throw new Error("The account number response was incomplete");
      updateDisplayedEmployee(employeeId, (current) => ({
        ...current,
        bdoAccountNumbers: [...current.bdoAccountNumbers, data.account!],
      }));
      setAccountNumberDraft("");
    } catch (saveError) {
      setRequirementsError(saveError instanceof Error ? saveError.message : "Unable to add BDO account number");
    } finally {
      setSavingAccountNumber(false);
    }
  }, [accountNumberDraft, displayedEmployee, savingAccountNumber, updateDisplayedEmployee]);

  const removeBdoAccountNumber = useCallback(async (account: BdoAccountNumber) => {
    if (!displayedEmployee) return;
    const employeeId = displayedEmployee.id;
    setRequirementsError("");
    setSavingAccountNumber(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}/bdo-account-numbers/${account.id}`, { method: "DELETE" });
      const data: {
        requirement?: { requirementKey: EmployeeRequirementKey; isComplete: boolean } | null;
        error?: string;
      } = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to remove BDO account number");
      updateDisplayedEmployee(employeeId, (current) => ({
        ...current,
        bdoAccountNumbers: current.bdoAccountNumbers.filter((saved) => saved.id !== account.id),
        requirements: data.requirement
          ? current.requirements.map((item) => item.requirementKey === "bdoSavingsAccount"
            ? { ...item, isComplete: false }
            : item)
          : current.requirements,
      }));
      setRevealedAccountNumbers((current) => {
        const next = new Set(current);
        next.delete(account.id);
        return next;
      });
    } catch (deleteError) {
      setRequirementsError(deleteError instanceof Error ? deleteError.message : "Unable to remove BDO account number");
    } finally {
      setSavingAccountNumber(false);
    }
  }, [displayedEmployee, updateDisplayedEmployee]);

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-gray-50 p-4 sm:p-6">
      <div className="flex w-full flex-1 flex-col">
        {isProfileLoading ? (
          <p role="status" className="mt-5 text-sm text-gray-600">Loading employee profile...</p>
        ) : error ? (
          <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
        ) : displayedEmployee ? (
          <>
            <header className="page-header-surface mt-1 flex flex-wrap items-center gap-4">
              <div className="group relative flex shrink-0 flex-col items-center">
                <label
                  aria-label="Upload employee photo (JPG, PNG, or GIF, up to 2 MB)"
                  title="JPG, PNG, GIF. 2 MB."
                  className={`absolute bottom-2 right-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 opacity-0 shadow-sm transition-opacity hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 group-hover:opacity-100 group-focus-within:opacity-100 ${uploadingPhoto || savingCard || editingCard !== null ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <ArrowUpTrayIcon aria-hidden="true" className={`h-4 w-4 ${uploadingPhoto ? "animate-pulse" : ""}`} />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    aria-label="Choose employee photo"
                    disabled={uploadingPhoto || savingCard !== null || editingCard !== null}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = "";
                      if (file) void uploadEmployeePhoto(file);
                    }}
                    className="sr-only"
                  />
                </label>
                {displayedEmployee.photoUrl ? (
                  <img src={displayedEmployee.photoUrl} alt={`${fullName} profile`} className="h-36 w-28 rounded-xl border-2 border-gray-200 object-cover" />
                ) : (
                  <div className="flex h-36 w-28 items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-500">No photo</div>
                )}
                {uploadingPhoto && <span role="status" className="text-xs text-gray-600">Uploading...</span>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <BackButton fallbackHref={employeeDirectoryHref(filters)} label="Back to employee directory" />
                  <h1 className="break-words text-xl font-bold text-gray-950 sm:text-2xl">{fullName}</h1>
                </div>
                <p className="mt-1 text-sm font-medium text-gray-700">{displayedEmployee.position || "Position not set"} <span className="px-1 text-gray-400">•</span> {displayedEmployee.branch || "Branch not set"}</p>
                <p className="mt-1 text-sm text-gray-600">{displayedEmployee.biometricNo || "Not set"}</p>
                <p className={`mt-1 text-sm font-semibold ${["Regular", "Contractual", "Trainee", "Leave"].includes(displayedEmployee.status || "") ? "text-green-700" : "text-gray-700"}`}>
                  {displayedEmployee.status || "Status not set"}
                </p>
              </div>
              <aside aria-label="Assignment" className="ml-auto flex w-full max-w-sm items-center gap-x-5 self-end pb-1 sm:w-auto sm:shrink-0">
                <div className="min-w-0"><p className="text-[10px] uppercase tracking-wide text-gray-500">Assigned By</p><p className="mt-0.5 break-words text-xs font-medium leading-snug text-gray-700">{displayedEmployee.assignedBy || "Not set"}</p></div>
                <div className="min-w-0"><p className="text-[10px] uppercase tracking-wide text-gray-500">Assigned At</p><p className="mt-0.5 break-words text-xs font-medium leading-snug text-gray-700">{dateText(displayedEmployee.assignedAt)}</p></div>
              </aside>
            </header>

            <div className="mt-5 flex flex-1 flex-col">
              <div className="flex shrink-0 items-center gap-1 border-b border-gray-200">
                <div role="tablist" aria-label="Employee profile sections" className="min-w-0 overflow-x-auto">
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
                      onClick={() => selectProfileTab(tab.label)}
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
                          selectProfileTab(profileTabs[nextIndex].label);
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
              </div>

              {editError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{editError}</p>}
              {editOptionsLoading && <p role="status" className="mt-3 text-sm text-gray-600">Loading edit options...</p>}

              <div id="employee-profile-panel" role="tabpanel" aria-labelledby={`employee-profile-tab-${activeTabIndex}`} className="mt-4 flex flex-1">
              {activeTab === "Personal Information" && <div className="grid flex-1 gap-5 xl:grid-cols-2">
                <ProfileSection title="Personal Information" icon={UserCircleIcon} cardKey="personal" editingCard={editingCard} saving={savingCard === "personal" || editOptionsLoading || uploadingPhoto} onStartEdit={startCardEdit} onSave={saveCardEdit}>
                  <div className="grid gap-5 sm:col-span-2">
                    <div className="grid gap-4 sm:grid-cols-3">
                      {editingCard === "personal" && profileDraft
                        ? <>
                          <ProfileInput label="First Name" value={profileDraft.firstName} onChange={(value) => updateEditDraft("firstName", value)} />
                          <ProfileInput label="Middle Name" value={profileDraft.middleName ?? ""} onChange={(value) => updateEditDraft("middleName", value || null)} />
                          <ProfileInput label="Last Name" value={profileDraft.lastName} onChange={(value) => updateEditDraft("lastName", value)} />
                        </>
                        : <>
                          <Value label="First Name" value={displayedEmployee.firstName} />
                          <Value label="Middle Name" value={displayedEmployee.middleName} />
                          <Value label="Last Name" value={displayedEmployee.lastName} />
                        </>}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      {editingCard === "personal" && profileDraft
                        ? <>
                          <ProfileInput label="Date of Birth" type="date" value={dateInputValue(profileDraft.dateOfBirth)} onChange={(value) => updateEditDraft("dateOfBirth", value || null)} />
                          <Value
                            label="Age"
                            value={dateInputValue(profileDraft.dateOfBirth) === dateInputValue(displayedEmployee.dateOfBirth)
                              ? displayedEmployee.age
                              : calculateAge(dateInputValue(profileDraft.dateOfBirth))}
                          />
                        </>
                        : <>
                          <Value label="Date of Birth" value={dateText(displayedEmployee.dateOfBirth)} />
                          <Value label="Age" value={displayedEmployee.age} />
                        </>}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      {editingCard === "personal" && profileDraft
                        ? <>
                          <ProfileSelect label="Gender" value={profileDraft.gender ?? ""} onChange={(value) => updateEditDraft("gender", value || null)} options={[...new Set(["Male", "Female", "Other", ...(profileDraft.gender ? [profileDraft.gender] : [])])]} placeholder="Select gender" />
                          <ProfileSelect label="Marital Status" value={profileDraft.maritalStatus ?? ""} onChange={(value) => updateEditDraft("maritalStatus", value || null)} options={[...new Set(["Single", "Married", "Widowed", "Separated", ...(profileDraft.maritalStatus ? [profileDraft.maritalStatus] : [])])]} placeholder="Select status" />
                        </>
                        : <>
                          <Value label="Gender" value={displayedEmployee.gender} />
                          <Value label="Marital Status" value={displayedEmployee.maritalStatus} />
                        </>}
                    </div>
                  </div>
                </ProfileSection>
                <ProfileSection title="Contact Information" icon={IdentificationIcon} cardKey="contact" editingCard={editingCard} saving={savingCard === "contact" || editOptionsLoading || uploadingPhoto} onStartEdit={startCardEdit} onSave={saveCardEdit}>
                  {editingCard === "contact" && profileDraft
                    ? <>
                      <ProfileInput label="Mobile Number" inputMode="numeric" value={profileDraft.mobileNumber ?? ""} onChange={(value) => updateEditDraft("mobileNumber", formatMobile(value) || null)} />
                      <ProfileInput label="Email" type="email" value={profileDraft.email ?? ""} onChange={(value) => updateEditDraft("email", value || null)} />
                      <label className="grid min-w-0 gap-1.5 sm:col-span-2">
                        <span className="text-xs tracking-wide text-gray-500">Address</span>
                        <textarea rows={3} value={profileDraft.address ?? ""} onChange={(event) => updateEditDraft("address", event.target.value || null)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
                      </label>
                    </>
                    : <>
                      <Value label="Mobile Number" value={displayedEmployee.mobileNumber} />
                      <Value label="Email" value={displayedEmployee.email} />
                      <div className="sm:col-span-2"><Value label="Address" value={displayedEmployee.address} /></div>
                    </>}
                </ProfileSection>
                <ProfileSection title="Emergency Information" icon={UsersIcon} cardKey="emergency" editingCard={editingCard} saving={savingCard === "emergency" || editOptionsLoading || uploadingPhoto} onStartEdit={startCardEdit} onSave={saveCardEdit}>
                  {editingCard === "emergency" && profileDraft
                    ? <>
                      <ProfileInput label="Contact Person" value={profileDraft.emergencyName ?? ""} onChange={(value) => updateEditDraft("emergencyName", value || null)} />
                      <ProfileInput label="Contact Number" inputMode="numeric" value={profileDraft.emergencyNumber ?? ""} onChange={(value) => updateEditDraft("emergencyNumber", formatMobile(value) || null)} />
                      <ProfileSelect label="Relation" value={profileDraft.emergencyRelation ?? ""} onChange={(value) => updateEditDraft("emergencyRelation", value || null)} options={[...new Set(["Family", "Friend", "Work / Colleague", "Others", ...(profileDraft.emergencyRelation ? [profileDraft.emergencyRelation] : [])])]} placeholder="Select relation" />
                      <label className="grid min-w-0 gap-1.5 sm:col-span-2">
                        <span className="text-xs tracking-wide text-gray-500">Address</span>
                        <textarea rows={3} value={profileDraft.emergencyAddress ?? ""} onChange={(event) => updateEditDraft("emergencyAddress", event.target.value || null)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
                      </label>
                    </>
                    : <>
                      <Value label="Contact Person" value={displayedEmployee.emergencyName} />
                      <Value label="Contact Number" value={displayedEmployee.emergencyNumber} />
                      <Value label="Relation" value={displayedEmployee.emergencyRelation} />
                      <div className="sm:col-span-2"><Value label="Address" value={displayedEmployee.emergencyAddress} /></div>
                    </>}
                </ProfileSection>
                <ProfileSection title="Remarks" icon={ClipboardDocumentListIcon} cardKey="remarks" editingCard={editingCard} saving={savingCard === "remarks" || editOptionsLoading || uploadingPhoto} onStartEdit={startCardEdit} onSave={saveCardEdit}>
                  <div className="sm:col-span-2">
                    {editingCard === "remarks" && profileDraft
                      ? <label className="grid min-w-0 gap-1.5">
                        <span className="text-xs tracking-wide text-gray-500">Remarks</span>
                        <textarea rows={5} value={profileDraft.remarks ?? ""} onChange={(event) => updateEditDraft("remarks", event.target.value || null)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
                      </label>
                      : <Value label="Remarks" value={displayedEmployee.remarks} />}
                  </div>
                </ProfileSection>
              </div>}

              {activeTab === "Employment" && <div className="grid flex-1 gap-5 xl:grid-cols-2">
                <ProfileSection title="Contract Duration" icon={CalendarDaysIcon} cardKey="duration" editingCard={editingCard} saving={savingCard === "duration" || editOptionsLoading || uploadingPhoto} onStartEdit={startCardEdit} onSave={saveCardEdit}>
                  {editingCard === "duration" && profileDraft
                    ? <>
                      <ProfileSelect label="Status" value={profileDraft.status ?? ""} onChange={(value) => {
                        updateEditDraft("status", value || null);
                        if (!endedStatuses.has(value)) updateEditDraft("endDate", null);
                      }} options={[...new Set([...statusOptions, ...(profileDraft.status ? [profileDraft.status] : [])])]} placeholder="Select status" />
                      <ProfileInput label="Date Started" type="date" value={dateInputValue(profileDraft.dateStarted)} onChange={(value) => updateEditDraft("dateStarted", value || null)} />
                      {endedStatuses.has(profileDraft.status ?? "") && <ProfileInput label="End Date" type="date" value={dateInputValue(profileDraft.endDate)} onChange={(value) => updateEditDraft("endDate", value || null)} />}
                    </>
                    : <>
                      <Value label="Date Started" value={dateText(displayedEmployee.dateStarted)} />
                      <Value label="End Date" value={dateText(displayedEmployee.endDate)} />
                    </>}
                  <Value label="Service Duration" value={serviceDurationText} />
                  {serviceSummary.expiryDaysRemaining !== null && <Value label="Contract Expiry" value={serviceSummary.expiryDaysRemaining > 0 ? `${serviceSummary.expiryDaysRemaining} days remaining` : serviceSummary.expiryDaysRemaining === 0 ? "Expires today" : `Expired ${Math.abs(serviceSummary.expiryDaysRemaining)} days ago`} />}
                  {editingCard !== "duration" && <Value label="Status" value={displayedEmployee.status} />}
                </ProfileSection>
                <ProfileSection title="Contract Position Details" icon={BriefcaseIcon} cardKey="position" editingCard={editingCard} saving={savingCard === "position" || editOptionsLoading || uploadingPhoto} onStartEdit={startCardEdit} onSave={saveCardEdit}>
                  {editingCard === "position" && profileDraft
                    ? <>
                      <ProfileInput label="Biometric Number" inputMode="numeric" value={profileDraft.biometricNo ?? ""} onChange={(value) => updateEditDraft("biometricNo", value || null)} />
                      <ProfileSelect label="Job Role" value={profileDraft.position ?? ""} onChange={(value) => updateEditDraft("position", value || null)} options={[...new Set([...positionOptions, ...(profileDraft.position ? [profileDraft.position] : [])])]} placeholder="Select position" />
                      <ProfileSelect label="Job Level" value={profileDraft.jobLevel ?? ""} onChange={(value) => updateEditDraft("jobLevel", value || null)} options={[...new Set([...JOB_LEVELS, ...(profileDraft.jobLevel ? [profileDraft.jobLevel] : [])])]} placeholder="Select job level" />
                      <label className="grid min-w-0 gap-1.5">
                        <span className="text-xs tracking-wide text-gray-500">Supervisor</span>
                        <select value={profileDraft.supervisorId ? String(profileDraft.supervisorId) : ""} onChange={(event) => updateEditDraft("supervisorId", event.target.value ? Number(event.target.value) : null)} className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
                          <option value="">No supervisor assigned</option>
                          {supervisorOptions.map((supervisor) => <option key={supervisor.id} value={supervisor.id}>{[supervisor.firstName, supervisor.middleName, supervisor.lastName].filter(Boolean).join(" ")}</option>)}
                        </select>
                      </label>
                    </>
                    : <>
                      <Value label="Biometric Number" value={displayedEmployee.biometricNo} />
                      <Value label="Job Role" value={displayedEmployee.position} />
                      <Value label="Job Level" value={displayedEmployee.jobLevel} />
                    </>}
                  <Value label="Expected Work Hours per Week" value="48 hours" />
                  {editingCard !== "position" && <Value label="Supervisor" value={displayedEmployee.supervisor ? [displayedEmployee.supervisor.firstName, displayedEmployee.supervisor.middleName, displayedEmployee.supervisor.lastName].filter(Boolean).join(" ") : "Not assigned"} />}
                </ProfileSection>
                <ProfileSection title="Contract Details" icon={BuildingOffice2Icon} cardKey="contract" editingCard={editingCard} saving={savingCard === "contract" || editOptionsLoading || uploadingPhoto} onStartEdit={startCardEdit} onSave={saveCardEdit}>
                  {editingCard === "contract" && profileDraft
                    ? <>
                      <label className="grid min-w-0 gap-1.5">
                        <span className="text-xs tracking-wide text-gray-500">Employer</span>
                        <select value={profileDraft.employerId ? String(profileDraft.employerId) : ""} onChange={(event) => updateEditDraft("employerId", event.target.value ? Number(event.target.value) : null)} className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
                          <option value="">Select employer</option>
                          {displayedEmployee.employer && !employerOptions.some((employer) => employer.id === displayedEmployee.employer?.id) && <option value={displayedEmployee.employer.id}>{displayedEmployee.employer.name}</option>}
                          {employerOptions.map((employer) => <option key={employer.id} value={employer.id}>{employer.name}</option>)}
                        </select>
                      </label>
                      <ProfileSelect label="Branch" value={profileDraft.branch ?? ""} onChange={(value) => updateEditDraft("branch", value || null)} options={[...new Set([...branchOptions, ...(profileDraft.branch ? [profileDraft.branch] : [])])]} placeholder="Select branch" />
                      <ProfileInput label="Date Started" type="date" value={dateInputValue(profileDraft.dateStarted)} onChange={(value) => updateEditDraft("dateStarted", value || null)} />
                    </>
                    : <>
                      <Value label="Employer" value={displayedEmployee.employer?.name} />
                      <Value label="Branch" value={displayedEmployee.branch} />
                      <Value label="Date Started" value={dateText(displayedEmployee.dateStarted)} />
                    </>}
                </ProfileSection>
              </div>}

              {activeTab === "Government" && <div className="grid flex-1 gap-5 xl:grid-cols-2">
                <ProfileSection title="Government ID" icon={IdentificationIcon} cardKey="government" editingCard={editingCard} saving={savingCard === "government" || editOptionsLoading || uploadingPhoto} onStartEdit={startCardEdit} onSave={saveCardEdit}>
                  <div className="flex min-w-0 flex-wrap items-end justify-between gap-2">
                    {editingCard === "government" && profileDraft
                      ? <ProfileInput label="SSS" inputMode="numeric" value={profileDraft.sssNumber ?? ""} onChange={(value) => updateEditDraft("sssNumber", formatDigits(value, [2, 7, 1]) || null)} />
                      : <Value label="SSS" value={displayedEmployee.sssNumber} />}
                    <Link
                      href={`/employees/${displayedEmployee.id}/sss-contributions`}
                      aria-label="View SSS contributions"
                      title="View SSS contributions"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                    >
                      <EyeIcon aria-hidden="true" className="h-5 w-5" />
                    </Link>
                  </div>
                  <div className="flex min-w-0 flex-wrap items-end justify-between gap-2">
                    {editingCard === "government" && profileDraft
                      ? <ProfileInput label="Pag-IBIG" inputMode="numeric" value={profileDraft.pagIbigNumber ?? ""} onChange={(value) => updateEditDraft("pagIbigNumber", formatDigits(value, [4, 4, 4]) || null)} />
                      : <Value label="Pag-IBIG" value={displayedEmployee.pagIbigNumber} />}
                    <Link
                      href={displayedEmployee.employer?.id ? `/reports/pagibig?view=members&employerId=${displayedEmployee.employer.id}` : "/reports/pagibig?view=members"}
                      aria-label="View Pag-IBIG records"
                      title="View Pag-IBIG records"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                    >
                      <EyeIcon aria-hidden="true" className="h-5 w-5" />
                    </Link>
                  </div>
                  <div className="flex min-w-0 flex-wrap items-end justify-between gap-2">
                    {editingCard === "government" && profileDraft
                      ? <ProfileInput label="PhilHealth" inputMode="numeric" value={profileDraft.philHealth ?? ""} onChange={(value) => updateEditDraft("philHealth", formatDigits(value, [2, 9, 1]) || null)} />
                      : <Value label="PhilHealth" value={displayedEmployee.philHealth} />}
                    <Link
                      href={displayedEmployee.employer?.id ? `/reports/philhealth?view=employees&employerId=${displayedEmployee.employer.id}` : "/reports/philhealth?view=employees"}
                      aria-label="View PhilHealth records"
                      title="View PhilHealth records"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                    >
                      <EyeIcon aria-hidden="true" className="h-5 w-5" />
                    </Link>
                  </div>
                  {editingCard === "government" && profileDraft
                    ? <ProfileInput label="TIN" inputMode="numeric" value={profileDraft.tinNumber ?? ""} onChange={(value) => updateEditDraft("tinNumber", formatDigits(value, [3, 3, 3, 5]) || null)} />
                    : <Value label="TIN" value={displayedEmployee.tinNumber} />}
                </ProfileSection>
              </div>}

              {activeTab === "Requirements" && <div className="grid flex-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2 xl:col-span-3">
                  <p className="text-sm text-gray-600">Check each item after it has been submitted and verified.</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className={`inline-flex items-center gap-2 text-sm font-medium text-gray-700 ${markingAllRequirements ? "opacity-60" : ""}`}>
                      Check all
                      <button
                        type="button"
                        role="switch"
                        aria-checked={requirementsToggleOn}
                        aria-label="Check all requirements"
                        disabled={markingAllRequirements}
                        onClick={() => void toggleAllRequirementsComplete(!requirementsToggleOn)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed ${requirementsToggleOn ? "bg-blue-600 hover:bg-blue-500" : "bg-gray-300 hover:bg-gray-400"}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`inline-block h-5 w-5 transform-gpu rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${requirementsToggleOn ? "translate-x-5" : "translate-x-0"}`}
                        />
                      </button>
                    </label>
                    <label className={`inline-flex items-center gap-2 text-sm font-medium text-gray-700 ${togglingRequirementsBypass ? "opacity-60" : ""}`}>
                      Mark as Complete
                      <button
                        type="button"
                        role="switch"
                        aria-checked={displayedEmployee.requirementsBypassed}
                        aria-label="Mark requirements as complete"
                        disabled={togglingRequirementsBypass}
                        onClick={() => void toggleRequirementsBypass(!displayedEmployee.requirementsBypassed)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:cursor-not-allowed ${displayedEmployee.requirementsBypassed ? "bg-rose-600 hover:bg-rose-500" : "bg-gray-300 hover:bg-gray-400"}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`inline-block h-5 w-5 transform-gpu rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${displayedEmployee.requirementsBypassed ? "translate-x-5" : "translate-x-0"}`}
                        />
                      </button>
                    </label>
                  </div>
                </div>
                {requirementsError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 md:col-span-2 xl:col-span-3">{requirementsError}</p>}
                {employeeRequirementGroups.map((group) => (
                  <ProfileSection key={group.label} title={group.label} icon={ClipboardDocumentListIcon}>
                    <ul className="mt-4 w-full min-w-0 space-y-2 sm:col-span-2">
                      {employeeRequirements.filter((requirement) => group.keys.includes(requirement.key)).map((requirement) => {
                        const savedRequirement = displayedEmployee.requirements.find((item) => item.requirementKey === requirement.key);
                        const attachments = savedRequirement?.attachments ?? [];
                        const isNotApplicable = requirement.key === "marriageContract" && isSingleEmployee(displayedEmployee.maritalStatus);
                        const isComplete = savedRequirement?.isComplete ?? false;
                        const isSaving = savingRequirementKeys.has(requirement.key);
                        const isUploading = uploadingRequirementKeys.has(requirement.key);
                        const accountNumbers = requirement.key === "bdoSavingsAccount" ? displayedEmployee.bdoAccountNumbers : [];
                        const canComplete = !isNotApplicable && (requirement.key !== "bdoSavingsAccount" || accountNumbers.length > 0);
                        return (
                          <li key={requirement.key} className="rounded-lg border border-gray-100 p-3">
                            <div className={`flex items-start gap-3 text-sm text-gray-800 ${isSaving ? "opacity-60" : ""}`}>
                              <input
                                type="checkbox"
                                aria-label={`Mark ${requirement.label} complete`}
                                checked={!isNotApplicable && isComplete && canComplete}
                                disabled={isSaving || !canComplete}
                                onChange={(event) => void updateRequirement(requirement.key, event.target.checked)}
                                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-700 focus:ring-blue-600"
                              />
                              <span className={`min-w-0 flex-1 ${isNotApplicable ? "text-gray-400 line-through" : ""}`}>{requirement.label}</span>
                              {isNotApplicable && <span className="shrink-0 text-xs text-gray-500">Not applicable</span>}
                              {isSaving && <span className="shrink-0 text-xs text-gray-500">Saving…</span>}
                              <span className="inline-flex shrink-0 items-center gap-0.5">
                                <label
                                  htmlFor={`requirement-upload-${displayedEmployee.id}-${requirement.key}`}
                                  aria-label={`Upload attachment for ${requirement.label}`}
                                  title="Upload attachment"
                                  className={`inline-flex cursor-pointer rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 ${isUploading ? "pointer-events-none opacity-50" : ""}`}
                                >
                                  <ArrowUpTrayIcon aria-hidden="true" className="h-4 w-4" />
                                </label>
                                <input
                                  id={`requirement-upload-${displayedEmployee.id}-${requirement.key}`}
                                  type="file"
                                  multiple
                                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                  disabled={isUploading}
                                  onChange={(event) => {
                                    const files = Array.from(event.currentTarget.files ?? []);
                                    event.currentTarget.value = "";
                                    void uploadRequirementAttachments(requirement.key, files);
                                  }}
                                  className="sr-only"
                                />
                                {attachments.length > 0 ? (
                                  <a
                                    href={`/api/employees/${displayedEmployee.id}/requirements/${requirement.key}/attachments/${attachments[attachments.length - 1].id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`View uploaded document for ${requirement.label}`}
                                    title="View uploaded document"
                                    className="inline-flex rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                  >
                                    <EyeIcon aria-hidden="true" className="h-4 w-4" />
                                  </a>
                                ) : (
                                  <span
                                    aria-hidden="true"
                                    title="No uploaded document yet"
                                    className="inline-flex cursor-not-allowed rounded p-1 text-gray-300"
                                  >
                                    <EyeIcon aria-hidden="true" className="h-4 w-4" />
                                  </span>
                                )}
                              </span>
                            </div>

                            {requirement.key === "bdoSavingsAccount" && <div className="mt-3 space-y-2">
                              {accountNumbers.length === 0 && <p className="text-xs text-gray-500">Add an account number before marking this requirement complete.</p>}
                              {accountNumbers.map((account) => {
                                const isRevealed = revealedAccountNumbers.has(account.id);
                                const shownNumber = isRevealed ? account.accountNumber : `••••••••${account.accountNumber.slice(-4)}`;
                                return (
                                  <div key={account.id} className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm">
                                    <span className="min-w-0 flex-1 font-mono text-gray-900">{shownNumber}</span>
                                    <button
                                      type="button"
                                      aria-label={`${isRevealed ? "Hide" : "Reveal"} BDO account number`}
                                      onClick={() => setRevealedAccountNumbers((current) => {
                                        const next = new Set(current);
                                        if (isRevealed) next.delete(account.id);
                                        else next.add(account.id);
                                        return next;
                                      })}
                                      className="rounded p-1 text-gray-600 hover:bg-gray-200"
                                    >
                                      {isRevealed
                                        ? <EyeSlashIcon aria-hidden="true" className="h-4 w-4" />
                                        : <EyeIcon aria-hidden="true" className="h-4 w-4" />}
                                    </button>
                                    <button
                                      type="button"
                                      aria-label="Remove BDO account number"
                                      disabled={savingAccountNumber}
                                      onClick={() => void removeBdoAccountNumber(account)}
                                      className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    >
                                      <TrashIcon aria-hidden="true" className="h-4 w-4" />
                                    </button>
                                  </div>
                                );
                              })}
                              <div className="flex flex-wrap gap-2">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={64}
                                  value={accountNumberDraft}
                                  onChange={(event) => setAccountNumberDraft(event.target.value)}
                                  aria-label="BDO savings account number"
                                  placeholder="Enter account number"
                                  className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                                <button
                                  type="button"
                                  disabled={savingAccountNumber || !accountNumberDraft}
                                  onClick={() => void addBdoAccountNumber()}
                                  className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100 disabled:opacity-50"
                                >
                                  <PlusIcon aria-hidden="true" className="h-4 w-4" />
                                  Add Account Number
                                </button>
                              </div>
                            </div>}

                            {attachments.length > 0 && <ul className="mt-2 space-y-1.5">
                              {attachments.map((attachment) => (
                                <li key={attachment.id} className="flex min-w-0 items-center gap-2 text-xs">
                                  <a
                                    href={`/api/employees/${displayedEmployee.id}/requirements/${requirement.key}/attachments/${attachment.id}`}
                                    className="inline-flex min-w-0 flex-1 items-center gap-1 truncate text-blue-700 hover:underline"
                                  >
                                    <ArrowDownTrayIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{attachment.fileName}</span>
                                  </a>
                                  <span className="shrink-0 text-gray-500">{(attachment.size / (1024 * 1024)).toFixed(1)} MB</span>
                                  <button
                                    type="button"
                                    aria-label={`Remove ${attachment.fileName}`}
                                    disabled={isUploading}
                                    onClick={() => void deleteRequirementAttachment(attachment)}
                                    className="shrink-0 rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                  >
                                    <TrashIcon aria-hidden="true" className="h-4 w-4" />
                                  </button>
                                </li>
                              ))}
                            </ul>}
                          </li>
                        );
                      })}
                    </ul>
                  </ProfileSection>
                ))}
                <p className="text-sm font-medium text-gray-700 md:col-span-2 xl:col-span-3">
                  {requirementCompletion.completed} of {requirementCompletion.total} complete
                </p>
              </div>}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
