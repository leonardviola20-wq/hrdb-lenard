"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getPagibigAccountSetupHref, getPagibigReturnContext } from "@/lib/pagibigEmployeeWorkflow";
import { emptyForm, type EditorForm, type Employer, type SupervisorOption } from "../types";
import { calculateAge } from "../utils";

/** Return context captured when the editor was opened from the Pag-IBIG workflow. */
export type PagibigReturnContext = NonNullable<ReturnType<typeof getPagibigReturnContext>>;

type EmployeeApiResponse = {
  employee: {
    supervisorId: number | null;
    employer?: { id: number | null } | null;
    [field: string]: string | number | null | { id: number | null } | undefined;
  };
};

const isoDate = (value: string | null) => (value ? value.slice(0, 10) : "");

/** Shared payload shape for the create/update and per-card PATCH calls. */
function buildPayload(form: EditorForm, age: number | null) {
  return {
    ...form,
    age: age ?? "",
    supervisorId: form.supervisorId || null,
    employerId: form.employerId || null,
  };
}

/**
 * Owns the employee editor form: field updates, option/employee loading, and the
 * full-record save used both by the footer button and the per-card saves.
 */
export function useEmployeeEditorForm(employeeId: number | null) {
  const router = useRouter();
  const [form, setForm] = useState<EditorForm>(emptyForm);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [supervisors, setSupervisors] = useState<SupervisorOption[]>([]);
  const [loadingEmployee, setLoadingEmployee] = useState(employeeId !== null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pagibigReturnContext] = useState<PagibigReturnContext | null>(() =>
    typeof window === "undefined" ? null : getPagibigReturnContext(window.location.search, employeeId === null),
  );

  const update = useCallback((field: keyof EditorForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  }, []);

  const updateStatus = useCallback((value: string) => {
    setForm((current) => ({ ...current, status: value }));
  }, []);

  useEffect(() => {
    let active = true;
    const employerRequest = fetch("/api/employers").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load employers");
      if (active) setEmployers(data.employers);
    });
    const supervisorRequest = fetch("/api/employees", { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load supervisors");
      if (active) {
        setSupervisors(
          (data.employees as SupervisorOption[])
            .filter((employee) => employee.position === "Store In-charge"),
        );
      }
    });
    void Promise.all([employerRequest, supervisorRequest]).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load form options");
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (employeeId === null) return; // create mode: nothing to load
    let active = true;
    fetch(`/api/employees/${employeeId}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load employee");
        if (!active) return;
        const employee = (data as EmployeeApiResponse).employee;
        setForm({
          firstName: employee.firstName as string ?? "",
          middleName: employee.middleName as string ?? "",
          lastName: employee.lastName as string ?? "",
          dateOfBirth: isoDate(employee.dateOfBirth as string | null),
          maritalStatus: employee.maritalStatus as string ?? "",
          gender: employee.gender as string ?? "",
          mobileNumber: employee.mobileNumber as string ?? "",
          photoUrl: employee.photoUrl as string ?? "",
          email: employee.email as string ?? "",
          address: employee.address as string ?? "",
          emergencyName: employee.emergencyName as string ?? "",
          emergencyNumber: employee.emergencyNumber as string ?? "",
          emergencyRelation: employee.emergencyRelation as string ?? "",
          emergencyAddress: employee.emergencyAddress as string ?? "",
          biometricNo: employee.biometricNo as string ?? "",
          branch: employee.branch as string ?? "",
          position: employee.position as string ?? "",
          jobLevel: employee.jobLevel as string ?? "",
          supervisorId: employee.supervisorId !== null ? String(employee.supervisorId) : "",
          employerId: employee.employer?.id !== null && employee.employer?.id !== undefined ? String(employee.employer.id) : "",
          status: employee.status as string ?? "",
          dateStarted: isoDate(employee.dateStarted as string | null),
          endDate: isoDate(employee.endDate as string | null),
          sssNumber: employee.sssNumber as string ?? "",
          pagIbigNumber: employee.pagIbigNumber as string ?? "",
          philHealth: employee.philHealth as string ?? "",
          tinNumber: employee.tinNumber as string ?? "",
          remarks: employee.remarks as string ?? "",
        });
        setError("");
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load employee");
      })
      .finally(() => {
        if (active) setLoadingEmployee(false);
      });
    return () => { active = false; };
  }, [employeeId]);

  const age = useMemo(() => calculateAge(form.dateOfBirth), [form.dateOfBirth]);

  /** Submits the full record (the API validates the whole entity).
   *  `redirectToResult` controls navigation on success; per-card saves stay on the page. */
  const submit = useCallback(async (redirectToResult = true): Promise<"redirected" | "saved" | "failed"> => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(employeeId === null ? "/api/employees" : `/api/employees/${employeeId}`, {
        method: employeeId === null ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(form, age)),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save the employee");
      if (redirectToResult) {
        const savedId: number = employeeId ?? data.employee?.id;
        if (pagibigReturnContext) {
          const returnHref = getPagibigAccountSetupHref(pagibigReturnContext.employerId, pagibigReturnContext.year, savedId);
          if (returnHref) {
            router.push(returnHref);
            return "redirected";
          }
        }
        router.push(`/employees/${savedId}`);
        return "redirected";
      }
      return "saved";
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the employee");
      return "failed";
    } finally {
      setSaving(false);
    }
  }, [age, employeeId, form, pagibigReturnContext, router]);

  return {
    employeeId,
    form,
    setForm,
    update,
    updateStatus,
    updateDateOfBirth: update,
    employers,
    supervisors,
    loadingEmployee,
    saving,
    error,
    setError,
    age,
    submit,
    pagibigReturnContext,
  };
}
