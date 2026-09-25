"use client";

import { useEffect, useMemo, useState } from "react";

type Employer = {
  id: number;
  name: string;
  company: string | null;
  branches: string | null;
  _count: { employees: number };
};

export default function EmployersPage() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/employers")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load employers");
        setEmployers(data.employers);
      })
      .catch((error: Error) => setMessage(error.message));
  }, []);

  const filteredEmployers = useMemo(() => {
    const search = query.trim().toLowerCase();
    return employers.filter(
      (employer) =>
        !search ||
        employer.name.toLowerCase().includes(search) ||
        employer.company?.toLowerCase().includes(search) ||
        employer.branches?.toLowerCase().includes(search)
    );
  }, [employers, query]);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-600">HRDB-Lenard</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Employers</h1>
          <p className="mt-2 text-gray-600">Organizations and the employees assigned to them.</p>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search employers..."
          className="mb-6 w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder:text-gray-500"
        />
        {message && <p className="mb-4 text-red-600">{message}</p>}
        {filteredEmployers.length === 0 ? (
          <p className="rounded-lg bg-white p-6 text-gray-600 shadow">No employers found.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredEmployers.map((employer) => (
              <article key={employer.id} className="rounded-lg bg-white p-5 shadow">
                <h2 className="text-lg font-semibold text-gray-900">{employer.name}</h2>
                {employer.company && <p className="mt-1 text-gray-600">{employer.company}</p>}
                {employer.branches && <p className="mt-3 text-sm text-gray-600">Branches: {employer.branches}</p>}
                <p className="mt-4 text-sm font-medium text-blue-700">
                  {employer._count.employees} employee{employer._count.employees === 1 ? "" : "s"}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
