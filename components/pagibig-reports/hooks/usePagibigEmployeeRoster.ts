"use client";

import { useCallback, useRef, useState } from "react";
import type { Member } from '@/components/pagibig-reports/shared/types';

/**
 * Loads the full employee roster used by the account form and the
 * report-generation employee picker. Keeps track of whether the roster
 * has already been fetched so dialogs can avoid redundant requests.
 */
export function usePagibigEmployeeRoster({ onError }: { onError: (message: string) => void }) {
  const [allEmployees, setAllEmployees] = useState<Member[]>([]);
  const [allEmployeesError, setAllEmployeesError] = useState("");
  const [allEmployeesLoading, setAllEmployeesLoading] = useState(false);
  const rosterLoadedRef = useRef(false);

  const fetchRoster = async (): Promise<Member[]> => {
    const response = await fetch("/api/reports/pagibig/employees", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load employees");
    return data.employees as Member[];
  };

  const loadReportEmployeeOptions = useCallback(async () => {
    setAllEmployeesLoading(true);
    setAllEmployeesError("");
    try {
      setAllEmployees(await fetchRoster());
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load employees";
      setAllEmployeesError(message);
      onError(message);
    } finally {
      setAllEmployeesLoading(false);
      rosterLoadedRef.current = true;
    }
  }, [onError]);

  /** Loads the roster and, when `employeeId` is given, selects that employee in the account form. */
  const handleAddAccountRoster = useCallback((employeeId: string, selectEmployee: (employee: Member | null) => void) => {
    setAllEmployeesError("");
    setAllEmployees([]);
    setAllEmployeesLoading(true);
    fetchRoster()
      .then((employees) => {
        setAllEmployees(employees);
        selectEmployee(employees.find((item) => String(item.id) === employeeId) ?? null);
      })
      .catch((loadError: unknown) => {
        setAllEmployeesError(loadError instanceof Error ? loadError.message : "Unable to load employees");
      })
      .finally(() => {
        setAllEmployeesLoading(false);
        rosterLoadedRef.current = true;
      });
  }, []);

  const clearRosterError = useCallback(() => setAllEmployeesError(""), []);

  return {
    allEmployees,
    setAllEmployees,
    allEmployeesError,
    clearRosterError,
    allEmployeesLoading,
    setAllEmployeesLoading,
    rosterLoadedRef,
    loadReportEmployeeOptions,
    handleAddAccountRoster,
  };
}
