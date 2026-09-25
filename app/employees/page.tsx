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
  position: string | null;
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

function ViewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border border-gray-200 bg-gray-50 p-4"><h3 className="mb-3 border-b border-gray-200 pb-2 text-sm font-semibold text-gray-900">{title}</h3><dl className="grid gap-3 text-sm sm:grid-cols-2">{children}</dl></section>;
}

function ViewField({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt><dd className="mt-1 break-words font-medium text-gray-900">{value || "Not set"}</dd></div>;
}

const branches = ["Arya 1", "Arya 2", "Yasuo", "Shangri-la", "Greenhills", "Magnolia", "MyDay", "Warehouse", "Office", "Vape", "Commissary", "Others"];
const positions = ["President", "Corporate Secretary", "Treasurer", "Accountant", "Purchaser", "IT", "Admin", "Admin Staff", "Office Staff", "Store In-charge", "Commissary Staff", "Driver", "Sales Staff", "Dining Staff", "Cashier", "Kitchen Staff", "Dispatcher", "Receptionist", "Warehouse Staff"];
const statuses = ["Trainee", "Regular", "Contractual", "No Contract", "End of contract", "Resigned", "Terminated", "AWOL", "Leave"];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
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
                <article key={employee.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {employee.photoUrl ? <img src={employee.photoUrl} alt="" className="mb-4 h-24 w-24 rounded-full object-cover" /> : <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-400">No photo</div>}
                      <h2 className="truncate text-base font-semibold text-gray-900">{fullName}</h2>
                    </div>
                    <div className="relative shrink-0">
                      <button type="button" onClick={() => setOpenMenuId(openMenuId === employee.id ? null : employee.id)} className="rounded p-1 text-xl leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label={`Actions for ${fullName}`}>•••</button>
                      {openMenuId === employee.id && <div className="absolute right-0 top-8 z-10 w-28 rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg">
                        <button type="button" onClick={() => { setSelectedEmployee(employee); setEditing(false); setOpenMenuId(null); }} className="block w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50">View</button>
                        <button type="button" onClick={() => { setSelectedEmployee(employee); setEditing(true); setOpenMenuId(null); }} className="block w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50">Update</button>
                      </div>}
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="grid content-start gap-1">
                      <span className="font-semibold text-green-600">{["Regular", "Contractual", "Trainee", "Leave"].includes(employee.status || "") ? "Active" : employee.status || "Active"}</span>
                      <span className="font-medium text-gray-700">{employee.status || "Not set"}</span>
                    </div>
                    <div className="grid min-w-0 content-start gap-1">
                      <span className="truncate text-gray-900">{employee.branch || "Branch not set"}</span>
                      <span className="truncate text-gray-900">{employee.position || "Position not set"}</span>
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-gray-100 pt-4 text-sm">
                    <div><dt className="text-gray-500">Biometric ID</dt><dd className="mt-1 truncate text-gray-900">{employee.biometricNo || "Not set"}</dd></div>
                    <div><dt className="text-gray-500">Employer</dt><dd className="mt-1 truncate text-gray-900">{employee.employer?.company || employee.employer?.name || "Unassigned"}</dd></div>
                    <div><dt className="text-gray-500">Phone</dt><dd className="mt-1 text-gray-900">{displayMobile(employee.mobileNumber)}</dd></div>
                    <div><dt className="text-gray-500">Email</dt><dd className="mt-1 truncate text-gray-900">{employee.email || "Not set"}</dd></div>
                  </dl>
                </article>
              );
            })}
          </div>
        )}
      </div>
      {selectedEmployee && (
        <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onClick={() => setSelectedEmployee(null)}>
          <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
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
                    <ViewField label="Biometric ID" value={selectedEmployee.biometricNo} />
                    <ViewField label="Employer" value={selectedEmployee.employer?.company || selectedEmployee.employer?.name} />
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

function EmployeeEditForm({ employee, employers, saving, onCancel, onError, onSave }: { employee: Employee; employers: Employer[]; saving: boolean; onCancel: () => void; onError: (value: string) => void; onSave: (changes: Record<string, string | number | null>) => Promise<void> }) {
  const [form, setForm] = useState({
    firstName: employee.firstName, middleName: employee.middleName || "", lastName: employee.lastName,
    dateOfBirth: employee.dateOfBirth?.slice(0, 10) || "", age: calculateAge(employee.dateOfBirth)?.toString() || "",
    maritalStatus: employee.maritalStatus || "", gender: employee.gender || "",
    mobileNumber: formatMobile(employee.mobileNumber || ""), email: employee.email || "", address: employee.address || "",
    emergencyName: employee.emergencyName || "", emergencyNumber: formatMobile(employee.emergencyNumber || ""),
    emergencyRelation: employee.emergencyRelation || "", emergencyAddress: employee.emergencyAddress || "",
    biometricNo: employee.biometricNo || "", branch: employee.branch || "", position: employee.position || "",
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
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Employer</span><select value={form.employerId} onChange={(event) => update("employerId", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"><option value="">Unassigned</option>{employers.map((employer) => <option key={employer.id} value={employer.id}>{employer.company || employer.name}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Status</span><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value, endDate: ["Contractual", "End of contract", "Resigned", "Terminated", "AWOL"].includes(event.target.value) ? current.endDate : "" }))} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900">{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Branch</span><select value={form.branch} onChange={(event) => update("branch", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"><option value="">Select branch</option>{branches.map((branch) => <option key={branch}>{branch}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium text-gray-700"><span>Position</span><select value={form.position} onChange={(event) => update("position", event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"><option value="">Select position</option>{positions.map((position) => <option key={position}>{position}</option>)}</select></label>
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
