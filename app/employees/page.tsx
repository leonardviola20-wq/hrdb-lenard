"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Employee = {
  id: number;
  employeeCode: string;
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
  photoUrl: string | null;
  assignedBy: string | null;
  assignedAt: string | null;
  employer: { id: number; name: string; company: string | null } | null;
};
type Employer = { id: number; name: string; company: string | null };

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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/employees")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load employees");
        setEmployees(data.employees);
      })
      .catch((error: Error) => setMessage(error.message));
    fetch("/api/employers")
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) setEmployers(data.employers);
      })
      .catch(() => {});
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
                <article key={employee.id} onClick={() => { setSelectedEmployee(employee); setEditing(false); }} className="cursor-pointer rounded-lg bg-white p-5 shadow transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {employee.photoUrl && <img src={employee.photoUrl} alt="" className="mb-3 h-12 w-12 rounded-full object-cover" />}
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
                    {employee.assignedBy && <div className="flex justify-between gap-3"><dt className="text-gray-500">Assigned by</dt><dd className="text-right text-gray-900">{employee.assignedBy}</dd></div>}
                    {employee.assignedAt && <div className="flex justify-between gap-3"><dt className="text-gray-500">Assigned at</dt><dd className="text-right text-gray-900">{new Date(employee.assignedAt).toLocaleDateString()}</dd></div>}
                  </dl>
                </article>
              );
            })}
          </div>
        )}
      </div>
      {selectedEmployee && (
        <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onClick={() => setSelectedEmployee(null)}>
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">{selectedEmployee.employeeCode}</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">{[selectedEmployee.firstName, selectedEmployee.middleName, selectedEmployee.lastName].filter(Boolean).join(" ")}</h2>
              </div>
              <button type="button" onClick={() => setSelectedEmployee(null)} className="text-2xl text-gray-400 hover:text-gray-700" aria-label="Close">×</button>
            </div>
            {editing ? (
              <EmployeeEditForm employee={selectedEmployee} employers={employers} saving={saving} onCancel={() => setEditing(false)} onError={setMessage} onSave={async (changes) => {
                setSaving(true);
                try {
                  const response = await fetch(`/api/employees/${selectedEmployee.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) });
                  const data = await response.json();
                  if (!response.ok) throw new Error(data.error || "Unable to update employee");
                  setEmployees((current) => current.map((item) => item.id === data.employee.id ? data.employee : item));
                  setSelectedEmployee(data.employee);
                  setEditing(false);
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "Unable to update employee");
                } finally { setSaving(false); }
              }} />
            ) : (
              <>
                <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                  <div><dt className="text-gray-500">Employer</dt><dd className="font-medium text-gray-900">{selectedEmployee.employer?.company || selectedEmployee.employer?.name || "Unassigned"}</dd></div>
                  <div><dt className="text-gray-500">Status</dt><dd className="font-medium text-gray-900">{selectedEmployee.status || "Active"}</dd></div>
                  <div><dt className="text-gray-500">Branch</dt><dd className="font-medium text-gray-900">{selectedEmployee.branch || "Not set"}</dd></div>
                  <div><dt className="text-gray-500">Mobile</dt><dd className="font-medium text-gray-900">{selectedEmployee.mobileNumber || "Not set"}</dd></div>
                  <div><dt className="text-gray-500">Email</dt><dd className="font-medium text-gray-900">{selectedEmployee.email || "Not set"}</dd></div>
                  <div><dt className="text-gray-500">Assigned by</dt><dd className="font-medium text-gray-900">{selectedEmployee.assignedBy || "Not set"}</dd></div>
                </dl>
                <button type="button" onClick={() => setEditing(true)} className="mt-6 rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900">Edit employee</button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function EmployeeEditForm({ employee, employers, saving, onCancel, onError, onSave }: { employee: Employee; employers: Employer[]; saving: boolean; onCancel: () => void; onError: (value: string) => void; onSave: (changes: Record<string, string | number | null>) => Promise<void> }) {
  const [form, setForm] = useState({
    firstName: employee.firstName, middleName: employee.middleName || "", lastName: employee.lastName,
    dateOfBirth: employee.dateOfBirth?.slice(0, 10) || "", age: employee.age?.toString() || "",
    maritalStatus: employee.maritalStatus || "", gender: employee.gender || "",
    mobileNumber: employee.mobileNumber || "", email: employee.email || "", address: employee.address || "",
    emergencyName: employee.emergencyName || "", emergencyNumber: employee.emergencyNumber || "",
    emergencyRelation: employee.emergencyRelation || "", emergencyAddress: employee.emergencyAddress || "",
    biometricNo: employee.biometricNo || "", branch: employee.branch || "",
    employerId: employee.employer?.id?.toString() || "", status: employee.status || "Trainee",
    dateStarted: employee.dateStarted?.slice(0, 10) || "", endDate: employee.endDate?.slice(0, 10) || "",
    sssNumber: employee.sssNumber || "", pagIbigNumber: employee.pagIbigNumber || "",
    philHealth: employee.philHealth || "", tinNumber: employee.tinNumber || "", photoUrl: employee.photoUrl || "",
    remarks: employee.remarks || "",
  });
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const textFields = ["firstName", "middleName", "lastName", "mobileNumber", "email", "address", "emergencyName", "emergencyNumber", "emergencyAddress", "biometricNo", "branch"] as const;
  return <form className="mt-6 max-h-[70vh] overflow-y-auto pr-2" onSubmit={(event) => { event.preventDefault(); void onSave({ ...form, age: form.age ? Number(form.age) : null, employerId: form.employerId ? Number(form.employerId) : null }); }}>
    <div className="grid gap-4 sm:grid-cols-2">
      {textFields.map((field) => <label key={field} className="grid gap-1 text-sm font-medium text-gray-700"><span>{field === "mobileNumber" ? "Mobile Number" : field.replace(/([A-Z])/g, " $1")}</span><input value={form[field]} onChange={(event) => update(field, event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>)}
      <div className="grid gap-2 text-sm font-medium text-gray-700 sm:col-span-2">
        <span>Photo</span>
        <div className="flex items-center gap-4 rounded-lg border border-dashed border-gray-300 p-3">
          {form.photoUrl ? <img src={form.photoUrl} alt="Employee preview" className="h-16 w-16 rounded-full object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-400">No photo</div>}
          <div className="grid gap-2">
            <input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) readPhoto(file, (value) => update("photoUrl", value), onError); }} className="text-sm text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700" />
            <button type="button" onClick={() => update("photoUrl", "")} className="text-left text-xs text-gray-500 hover:text-gray-900">Remove photo</button>
          </div>
        </div>
      </div>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Date of Birth</span><input type="date" value={form.dateOfBirth} onChange={(event) => update("dateOfBirth", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Age</span><input type="number" min="0" max="130" value={form.age} onChange={(event) => update("age", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Marital Status</span><input value={form.maritalStatus} onChange={(event) => update("maritalStatus", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Gender</span><input value={form.gender} onChange={(event) => update("gender", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Relation</span><select value={form.emergencyRelation} onChange={(event) => update("emergencyRelation", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"><option value="">Select relation</option><option>Family</option><option>Friend</option><option>Work / Colleague</option><option>Others</option></select></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Employer</span><select value={form.employerId} onChange={(event) => update("employerId", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"><option value="">Unassigned</option>{employers.map((employer) => <option key={employer.id} value={employer.id}>{employer.company || employer.name}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Status</span><select value={form.status} onChange={(event) => update("status", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900">{["Trainee", "Regular", "Contractual", "No Contract", "End of contract", "Resigned", "Terminated", "AWOL", "Leave"].map((status) => <option key={status}>{status}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Date Started</span><input type="date" value={form.dateStarted} onChange={(event) => update("dateStarted", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>
      {["Contractual", "Resigned", "Terminated", "AWOL", "Leave"].includes(form.status) && <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Ended</span><input type="date" value={form.endDate} onChange={(event) => update("endDate", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>}
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>SSS</span><input value={form.sssNumber} onChange={(event) => update("sssNumber", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Pag-IBIG</span><input value={form.pagIbigNumber} onChange={(event) => update("pagIbigNumber", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>PhilHealth</span><input value={form.philHealth} onChange={(event) => update("philHealth", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>TIN</span><input value={form.tinNumber} onChange={(event) => update("tinNumber", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700 sm:col-span-2"><span>Remarks</span><textarea rows={3} value={form.remarks} onChange={(event) => update("remarks", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></label>
    </div>
    <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button></div>
  </form>;
}
