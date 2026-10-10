"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { JOB_LEVELS } from "@/lib/employeePayload";

type Employer = { id: number; name: string; company: string | null };
type SupervisorOption = { id: number; firstName: string; middleName: string | null; lastName: string; position: string | null };
type CategoryType = "BRANCH" | "POSITION" | "EMPLOYMENT_STATUS";
type EmployeeCategory = { type: CategoryType; name: string; active: boolean };
type EmployeeCategoryOptions = { branches: string[]; positions: string[]; statuses: string[] };

type EmployeeForm = {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  age: string;
  maritalStatus: string;
  gender: string;
  mobileNumber: string;
  photoUrl: string;
  email: string;
  address: string;
  emergencyName: string;
  emergencyNumber: string;
  emergencyRelation: string;
  emergencyAddress: string;
  biometricNo: string;
  branch: string;
  position: string;
  jobLevel: string;
  supervisorId: string;
  employerId: string;
  status: string;
  dateStarted: string;
  endDate: string;
  sssNumber: string;
  pagIbigNumber: string;
  philHealth: string;
  tinNumber: string;
  remarks: string;
};

const emptyForm: EmployeeForm = {
  firstName: "", middleName: "", lastName: "", dateOfBirth: "",
  age: "", maritalStatus: "", gender: "", mobileNumber: "", email: "", address: "",
  photoUrl: "",
  emergencyName: "", emergencyNumber: "", emergencyRelation: "", emergencyAddress: "",
  biometricNo: "", branch: "", position: "", jobLevel: "", supervisorId: "", employerId: "", status: "Trainee", dateStarted: "", endDate: "",
  sssNumber: "", pagIbigNumber: "", philHealth: "", tinNumber: "", remarks: "",
};

const defaultCategoryOptions: EmployeeCategoryOptions = {
  statuses: ["Trainee", "Regular", "Contractual", "No Contract", "End of contract", "Resigned", "Terminated", "AWOL", "Leave"],
  branches: ["Arya 1", "Arya 2", "Yasuo", "Shangri-la", "Greenhills", "Magnolia", "MyDay", "Warehouse", "Office", "Vape", "Commissary", "Others"],
  positions: ["President", "Corporate Secretary", "Treasurer", "Accountant", "Purchaser", "IT", "Admin", "Admin Staff", "Office Staff", "Store In-charge", "Commissary Staff", "Driver", "Sales Staff", "Dining Staff", "Cashier", "Kitchen Staff", "Dispatcher", "Receptionist", "Warehouse Staff"],
};
const endedStatuses = new Set(["Contractual", "End of contract", "Resigned", "Terminated", "AWOL"]);
const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";

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

function Field({ label, required, className = "", children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return <label className={`grid gap-1.5 text-sm font-medium text-gray-700 ${className}`}><span>{label}{required && <span className="text-red-600"> *</span>}</span>{children}</label>;
}

function Section({ title, columns = 2, children }: { title: string; columns?: 2 | 3 | 4; children: React.ReactNode }) {
  const columnClass = columns === 4 ? "sm:grid-cols-4" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="border-b border-gray-100 pb-3 text-lg font-semibold uppercase tracking-wide text-gray-900">{title}</h2><div className={`mt-5 grid gap-4 ${columnClass}`}>{children}</div></section>;
}

export default function NewEmployeePage() {
  const router = useRouter();
  const { id } = useParams<{ id?: string }>();
  const employeeId = id ?? null;
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [supervisors, setSupervisors] = useState<SupervisorOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<EmployeeCategoryOptions>(defaultCategoryOptions);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadedEmployeeId, setLoadedEmployeeId] = useState<string | null>(null);
  const loadingEmployee = Boolean(employeeId && loadedEmployeeId !== employeeId);

  useEffect(() => {
    let active = true;
    const employerRequest = fetch("/api/employers").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load employers");
      if (active) setEmployers(data.employers);
    });
    const supervisorRequest = fetch("/api/employees").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load supervisor options");
      const eligibleSupervisors = data.employees.filter((candidate: SupervisorOption) =>
        candidate.position === "Store In-charge" && String(candidate.id) !== employeeId
      );
      if (active) setSupervisors(eligibleSupervisors);
    });
    const categoryRequest = fetch("/api/management/categories").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load employee categories");
      const categories = (Array.isArray(data.categories) ? data.categories : []) as EmployeeCategory[];
      const statuses = categories.filter((item) => item.type === "EMPLOYMENT_STATUS" && item.active).map((item) => item.name);
      if (active) setCategoryOptions({
        branches: categories.filter((item) => item.type === "BRANCH" && item.active).map((item) => item.name),
        positions: categories.filter((item) => item.type === "POSITION" && item.active).map((item) => item.name),
        statuses,
      });
      if (active && !employeeId) setForm((current) => ({ ...current, status: statuses.includes(current.status) ? current.status : statuses[0] || "" }));
    }).catch((error: Error) => {
      console.warn("Unable to load employee categories; using the built-in options.", error);
    });
    const employeeRequest = employeeId
      ? fetch(`/api/employees/${employeeId}`).then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Unable to load employee");
          const employee = data.employee;
          if (active) setForm({
            firstName: employee.firstName || "",
            middleName: employee.middleName || "",
            lastName: employee.lastName || "",
            dateOfBirth: employee.dateOfBirth?.slice(0, 10) || "",
            age: employee.age == null ? "" : String(employee.age),
            maritalStatus: employee.maritalStatus || "",
            gender: employee.gender || "",
            mobileNumber: formatMobile(employee.mobileNumber || ""),
            photoUrl: employee.photoUrl || "",
            email: employee.email || "",
            address: employee.address || "",
            emergencyName: employee.emergencyName || "",
            emergencyNumber: formatMobile(employee.emergencyNumber || ""),
            emergencyRelation: employee.emergencyRelation || "",
            emergencyAddress: employee.emergencyAddress || "",
            biometricNo: employee.biometricNo || "",
            branch: employee.branch || "",
            position: employee.position || "",
            jobLevel: employee.jobLevel || "",
            supervisorId: employee.supervisorId == null ? "" : String(employee.supervisorId),
            employerId: employee.employer?.id == null ? "" : String(employee.employer.id),
            status: employee.status || "Trainee",
            dateStarted: employee.dateStarted?.slice(0, 10) || "",
            endDate: employee.endDate?.slice(0, 10) || "",
            sssNumber: formatDigits(employee.sssNumber || "", [2, 7, 1]),
            pagIbigNumber: formatDigits(employee.pagIbigNumber || "", [4, 4, 4]),
            philHealth: formatDigits(employee.philHealth || "", [2, 9, 1]),
            tinNumber: formatDigits(employee.tinNumber || "", [3, 3, 3, 5]),
            remarks: employee.remarks || "",
          });
        })
      : Promise.resolve().then(() => {
          if (active) setForm(emptyForm);
        });
    Promise.all([employerRequest, supervisorRequest, categoryRequest, employeeRequest])
      .then(() => { if (active) setMessage(""); })
      .catch((error: Error) => { if (active) setMessage(error.message); })
      .finally(() => { if (active) setLoadedEmployeeId(employeeId); });
    return () => { active = false; };
  }, [employeeId]);

  const update = (field: keyof EmployeeForm, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const updateDateOfBirth = (value: string) => {
    if (!value) {
      setForm((current) => ({ ...current, dateOfBirth: "", age: "" }));
      return;
    }
    const birthDate = new Date(`${value}T00:00:00`);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())) age -= 1;
    setForm((current) => ({ ...current, dateOfBirth: value, age: String(Math.max(0, age)) }));
  };

  const statusOptions = [...new Set([form.status, ...categoryOptions.statuses].filter(Boolean))];
  const branchOptions = [...new Set([form.branch, ...categoryOptions.branches].filter(Boolean))];
  const positionOptions = [...new Set([form.position, ...categoryOptions.positions].filter(Boolean))];

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(employeeId ? `/api/employees/${employeeId}` : "/api/employees", {
        method: employeeId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || (employeeId ? "Unable to update employee" : "Unable to create employee"));
      router.push("/employees");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (employeeId ? "Unable to update employee" : "Unable to create employee"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="w-full">
        {message && <p className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}
        {employeeId && message ? null : loadingEmployee ? <p role="status" className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600">Loading employee details...</p> : <form onSubmit={submit} className="grid gap-5">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              {form.photoUrl ? <img src={form.photoUrl} alt="Employee preview" className="h-24 w-24 shrink-0 rounded-lg border border-gray-200 object-cover" /> : <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400">No photo</div>}
              <div className="grid justify-items-start gap-2">
                <label className="inline-flex cursor-pointer items-center whitespace-nowrap rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Upload Photo
                  <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) readPhoto(file, (value) => update("photoUrl", value), setMessage); }} className="sr-only" />
                </label>
                <p className="text-xs text-gray-500">JPG, PNG, or GIF up to 2 MB.</p>
              </div>
            </div>
          </section>
          <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Personal Information">
            <Field label="First Name" required><input required value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className={inputClass} /></Field>
            <Field label="Middle Name"><input value={form.middleName} onChange={(e) => update("middleName", e.target.value)} className={inputClass} /></Field>
            <Field label="Last Name" required><input required value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className={inputClass} /></Field>
            <Field label="Date of Birth"><input type="date" value={form.dateOfBirth} onChange={(e) => updateDateOfBirth(e.target.value)} className={inputClass} /></Field>
            <Field label="Age"><input readOnly tabIndex={-1} value={form.age} placeholder="Calculated automatically" className={`${inputClass} cursor-not-allowed bg-gray-100`} /></Field>
            <Field label="Marital Status"><select value={form.maritalStatus} onChange={(e) => update("maritalStatus", e.target.value)} className={inputClass}><option value="">Select status</option><option>Single</option><option>Married</option><option>Widowed</option><option>Separated</option></select></Field>
            <Field label="Gender"><select value={form.gender} onChange={(e) => update("gender", e.target.value)} className={inputClass}><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></select></Field>
          </Section>
          <Section title="Job Information">
            <Field label="Biometric Number" required={!employeeId}><input required={!employeeId} value={form.biometricNo} onChange={(e) => update("biometricNo", e.target.value)} className={inputClass} /></Field>
            <Field label="Employer"><select value={form.employerId} onChange={(e) => update("employerId", e.target.value)} className={inputClass}><option value="">Select employer</option>{employers.map((employer) => <option key={employer.id} value={employer.id}>{employer.name}</option>)}</select></Field>
            <Field label="Status"><select value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value, endDate: endedStatuses.has(e.target.value) ? current.endDate : "" }))} className={inputClass}><option value="">Select status</option>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></Field>
            <Field label="Branch"><select value={form.branch} onChange={(e) => update("branch", e.target.value)} className={inputClass}><option value="">Select branch</option>{branchOptions.map((branch) => <option key={branch}>{branch}</option>)}</select></Field>
            <Field label="Position"><select value={form.position} onChange={(e) => update("position", e.target.value)} className={inputClass}><option value="">Select position</option>{positionOptions.map((position) => <option key={position}>{position}</option>)}</select></Field>
            <Field label="Job Level"><select value={form.jobLevel} onChange={(e) => update("jobLevel", e.target.value)} className={inputClass}><option value="">Select job level</option>{JOB_LEVELS.map((jobLevel) => <option key={jobLevel}>{jobLevel}</option>)}</select></Field>
            <Field label="Supervisor"><select value={form.supervisorId} onChange={(e) => update("supervisorId", e.target.value)} className={inputClass}><option value="">No supervisor assigned</option>{supervisors.map((supervisor) => <option key={supervisor.id} value={supervisor.id}>{[supervisor.firstName, supervisor.middleName, supervisor.lastName].filter(Boolean).join(" ")}</option>)}</select></Field>
            <Field label="Date Started"><input type="date" value={form.dateStarted} onChange={(e) => update("dateStarted", e.target.value)} className={inputClass} /></Field>
            {endedStatuses.has(form.status) && <Field label="Ended"><input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} className={inputClass} /></Field>}
          </Section>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Contact Information">
            <Field label="Mobile Number"><input inputMode="numeric" value={form.mobileNumber} onChange={(e) => update("mobileNumber", formatMobile(e.target.value))} placeholder="0000 000 0000" className={inputClass} /></Field>
            <Field label="Email Address"><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} /></Field>
            <Field label="Address" className="sm:col-span-2"><textarea rows={3} value={form.address} onChange={(e) => update("address", e.target.value)} className={inputClass} /></Field>
          </Section>
          <Section title="Emergency Information" columns={4}>
            <Field label="Contact Person" className="sm:col-span-2"><input value={form.emergencyName} onChange={(e) => update("emergencyName", e.target.value)} className={inputClass} /></Field>
            <Field label="Contact Number"><input inputMode="numeric" value={form.emergencyNumber} onChange={(e) => update("emergencyNumber", formatMobile(e.target.value))} placeholder="0000 000 0000" className={inputClass} /></Field>
            <Field label="Relation"><select value={form.emergencyRelation} onChange={(e) => update("emergencyRelation", e.target.value)} className={inputClass}><option value="">Select relation</option><option>Family</option><option>Friend</option><option>Work / Colleague</option><option>Others</option></select></Field>
            <Field label="Address" className="sm:col-span-4"><textarea rows={3} value={form.emergencyAddress} onChange={(e) => update("emergencyAddress", e.target.value)} className={inputClass} /></Field>
          </Section>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Government Information">
            <Field label="SSS"><input inputMode="numeric" value={form.sssNumber} onChange={(e) => update("sssNumber", formatDigits(e.target.value, [2, 7, 1]))} placeholder="00-0000000-0" className={inputClass} /></Field>
            <Field label="Pag-IBIG"><input inputMode="numeric" value={form.pagIbigNumber} onChange={(e) => update("pagIbigNumber", formatDigits(e.target.value, [4, 4, 4]))} placeholder="0000-0000-0000" className={inputClass} /></Field>
            <Field label="PhilHealth"><input inputMode="numeric" value={form.philHealth} onChange={(e) => update("philHealth", formatDigits(e.target.value, [2, 9, 1]))} placeholder="00-000000000-0" className={inputClass} /></Field>
            <Field label="TIN"><input inputMode="numeric" value={form.tinNumber} onChange={(e) => update("tinNumber", formatDigits(e.target.value, [3, 3, 3, 5]))} placeholder="000-000-000-00000" className={inputClass} /></Field>
          </Section>
          <Section title="Remarks">
            <Field label="Additional notes" className="sm:col-span-2"><textarea rows={5} value={form.remarks} onChange={(e) => update("remarks", e.target.value)} className={inputClass} /></Field>
          </Section>
          </div>
          <div className="flex justify-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <Link href="/employees" className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</Link>
            <button type="submit" disabled={saving} className="rounded-lg bg-[#172554] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60">{saving ? (employeeId ? "Saving changes..." : "Creating...") : (employeeId ? "Save changes" : "Create employee")}</button>
          </div>
        </form>}
      </div>
    </main>
  );
}
