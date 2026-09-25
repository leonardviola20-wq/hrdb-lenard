"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Employee = {
  id: number;
  employeeCode: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  status: string | null;
  email: string | null;
  mobileNumber: string | null;
  branch: string | null;
  employer: { name: string; company: string | null } | null;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/employees")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load employees");
        setEmployees(data.employees);
      })
      .catch((error: Error) => setMessage(error.message));
  }, []);

  const filteredEmployees = useMemo(() => {
    const search = query.trim().toLowerCase();
    return employees.filter((employee) => {
      const fullName = `${employee.firstName} ${employee.middleName || ""} ${employee.lastName}`.toLowerCase();
      const employer = employee.employer
        ? `${employee.employer.name} ${employee.employer.company || ""}`.toLowerCase()
        : "";
      return !search || fullName.includes(search) || employee.employeeCode.toLowerCase().includes(search) || employer.includes(search);
    });
  }, [employees, query]);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-600">HRDB-Lenard</p>
              <h1 className="mt-1 text-3xl font-bold text-gray-900">Employee Directory</h1>
              <p className="mt-2 text-gray-600">Employee directory and assignment details.</p>
            </div>
            <Link href="/employees/new" className="shrink-0 rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900">
              Add employee
            </Link>
          </div>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, employee code, or employer..."
          className="mb-6 w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder:text-gray-500"
        />

        {message && <p className="mb-4 text-red-600">{message}</p>}
        {filteredEmployees.length === 0 ? (
          <p className="rounded-lg bg-white p-6 text-gray-600 shadow">No employees found.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredEmployees.map((employee) => {
              const fullName = [employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(" ");
              return (
                <article key={employee.id} className="rounded-lg bg-white p-5 shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-gray-900">{fullName}</h2>
                      <p className="mt-1 text-sm text-gray-500">{employee.employeeCode}</p>
                    </div>
                    <span className={`rounded px-2 py-1 text-xs font-medium ${employee.status?.toLowerCase() === "inactive" ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700"}`}>
                      {employee.status || "Active"}
                    </span>
                  </div>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500">Employer</dt>
                      <dd className="text-right text-gray-900">{employee.employer?.company || employee.employer?.name || "Unassigned"}</dd>
                    </div>
                    {employee.branch && <div className="flex justify-between gap-3"><dt className="text-gray-500">Branch</dt><dd className="text-right text-gray-900">{employee.branch}</dd></div>}
                    {employee.email && <div className="flex justify-between gap-3"><dt className="text-gray-500">Email</dt><dd className="truncate text-right text-gray-900">{employee.email}</dd></div>}
                    {employee.mobileNumber && <div className="flex justify-between gap-3"><dt className="text-gray-500">Mobile</dt><dd className="text-right text-gray-900">{employee.mobileNumber}</dd></div>}
                  </dl>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
