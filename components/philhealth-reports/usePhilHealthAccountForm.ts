"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Employee, Employer } from "@/components/philhealth-reports/types";
import { fullName } from "@/components/philhealth-reports/format";

export function usePhilHealthAccountForm({
  employerId,
  setEmployer,
  setEmployees,
  setError,
  setNotice,
}: {
  employerId: string;
  setEmployer: (e: Employer | null) => void;
  setEmployees: (e: Employee[] | ((prev: Employee[]) => Employee[])) => void;
  setError: (e: string) => void;
  setNotice: (n: string) => void;
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [accountEmployeePickerOpen, setAccountEmployeePickerOpen] = useState(false);
  const [accountEmployeeSearch, setAccountEmployeeSearch] = useState("");
  const accountPickerRef = useRef<HTMLDivElement>(null);
  const [employeeOptions, setEmployeeOptions] = useState<Employee[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accountEmployeePickerOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !accountPickerRef.current?.contains(event.target)) {
        setAccountEmployeePickerOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [accountEmployeePickerOpen]);

  const openAccountForm = useCallback(async () => {
    setAccountOpen(true);
    setSelectedEmployeeId("");
    setAccountEmployeePickerOpen(false);
    setAccountEmployeeSearch("");
    setError("");
    try {
      const response = await fetch(`/api/reports/philhealth/employees?all=1&employerId=${encodeURIComponent(employerId)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load employees");
      setEmployer(data.employer as Employer);
      setEmployeeOptions(data.employees as Employee[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load employees");
    }
  }, [employerId, setEmployer, setError]);

  const saveAccount = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!selectedEmployeeId) return;
      setSaving(true);
      setError("");
      try {
        const response = await fetch("/api/reports/philhealth/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employerId: Number(employerId), employeeId: Number(selectedEmployeeId) }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to save PhilHealth account");
        setAccountOpen(false);
        setNotice("PhilHealth account added to this employer.");
        setEmployees((current) =>
          current.map((employee) =>
            employee.id === Number(selectedEmployeeId)
              ? { ...employee, philHealthAccount: { id: data.accountId ?? employee.philHealthAccount?.id ?? 0, active: true } }
              : employee,
          ),
        );
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Unable to save PhilHealth account");
      } finally {
        setSaving(false);
      }
    },
    [employerId, selectedEmployeeId, setEmployees, setError, setNotice],
  );

  const setAccountActive = useCallback(
    async (accountId: number, active: boolean) => {
      setError("");
      try {
        const response = await fetch(`/api/reports/philhealth/employees/${accountId}?employerId=${encodeURIComponent(employerId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to update account status");
        setEmployees((current) =>
          current.map((employee) =>
            employee.philHealthAccount?.id === accountId
              ? { ...employee, philHealthAccount: { id: accountId, active } }
              : employee,
          ),
        );
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Unable to update account status");
      }
    },
    [employerId, setEmployees, setError],
  );

  const accountEmployeeQuery = accountEmployeeSearch.trim().toLocaleLowerCase();
  const accountEmployeeMatches = (employee: Employee) =>
    !accountEmployeeQuery ||
    [fullName(employee), employee.philHealth, employee.employerName, employee.biometricNo, employee.status].some((value) =>
      value?.toLocaleLowerCase().includes(accountEmployeeQuery),
    );
  const accountAssignedEmployees = employeeOptions.filter(
    (employee) => employee.assignedToSelectedEmployer && !employee.philHealthAccount && accountEmployeeMatches(employee),
  );
  const accountOtherEmployees = employeeOptions.filter(
    (employee) => !employee.assignedToSelectedEmployer && !employee.philHealthAccount && accountEmployeeMatches(employee),
  );
  const selectedAccountEmployee = employeeOptions.find((employee) => String(employee.id) === selectedEmployeeId);

  return {
    accountOpen,
    setAccountOpen,
    selectedEmployeeId,
    setSelectedEmployeeId,
    accountEmployeePickerOpen,
    setAccountEmployeePickerOpen,
    accountEmployeeSearch,
    setAccountEmployeeSearch,
    accountPickerRef,
    employeeOptions,
    setEmployeeOptions,
    saving,
    openAccountForm,
    saveAccount,
    setAccountActive,
    accountAssignedEmployees,
    accountOtherEmployees,
    selectedAccountEmployee,
  };
}
