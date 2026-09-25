"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type Employer = { id: number; name: string; company: string | null };

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
  biometricNo: "", branch: "", employerId: "", status: "Trainee", dateStarted: "", endDate: "",
  sssNumber: "", pagIbigNumber: "", philHealth: "", tinNumber: "", remarks: "",
};

const statuses = ["Trainee", "Regular", "Contractual", "No Contract", "End of contract", "Resigned", "Terminated", "AWOL", "Leave"];
const endedStatuses = new Set(["Contractual", "Resigned", "Terminated", "AWOL", "Leave"]);
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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium text-gray-700"><span>{label}{required && <span className="text-red-600"> *</span>}</span>{children}</label>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="border-b border-gray-100 pb-3 text-lg font-semibold text-gray-900">{title}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div></section>;
}

export default function NewEmployeePage() {
  const router = useRouter();
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/employers").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load employers");
      setEmployers(data.employers);
    }).catch((error: Error) => setMessage(error.message));
  }, []);

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

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create employee");
      router.push("/employees");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create employee");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link href="/employees" className="text-sm font-medium text-blue-600 hover:underline">← Employee Directory</Link>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">Add New Employee</h1>
          <p className="mt-2 text-gray-600">Create an employee profile and record their work information.</p>
        </div>
        {message && <p className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}
        <form onSubmit={submit} className="grid gap-5">
          <Section title="Personal Information">
            <Field label="First Name" required><input required value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className={inputClass} /></Field>
            <Field label="Middle Name"><input value={form.middleName} onChange={(e) => update("middleName", e.target.value)} className={inputClass} /></Field>
            <Field label="Last Name" required><input required value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className={inputClass} /></Field>
            <div />
            <Field label="Photo">
              <div className="flex items-center gap-4 sm:col-span-2">
                {form.photoUrl ? <img src={form.photoUrl} alt="Employee preview" className="h-24 w-24 rounded-lg border border-gray-200 object-cover" /> : <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400">No photo</div>}
                <div className="grid gap-2">
                  <label className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Choose photo
                    <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) readPhoto(file, (value) => update("photoUrl", value), setMessage); }} className="sr-only" />
                  </label>
                  <p className="text-xs text-gray-500">JPG, PNG, or GIF up to 2 MB.</p>
                </div>
              </div>
            </Field>
            <Field label="Date of Birth"><input type="date" value={form.dateOfBirth} onChange={(e) => updateDateOfBirth(e.target.value)} className={inputClass} /></Field>
            <Field label="Age"><input readOnly tabIndex={-1} value={form.age} placeholder="Calculated automatically" className={`${inputClass} cursor-not-allowed bg-gray-100`} /></Field>
            <Field label="Marital Status"><select value={form.maritalStatus} onChange={(e) => update("maritalStatus", e.target.value)} className={inputClass}><option value="">Select status</option><option>Single</option><option>Married</option><option>Widowed</option><option>Separated</option></select></Field>
            <Field label="Gender"><select value={form.gender} onChange={(e) => update("gender", e.target.value)} className={inputClass}><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></select></Field>
          </Section>
          <Section title="Contact Information">
            <Field label="Mobile Number"><input inputMode="numeric" value={form.mobileNumber} onChange={(e) => update("mobileNumber", formatMobile(e.target.value))} placeholder="0000 000 0000" className={inputClass} /></Field>
            <Field label="Email Address"><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} /></Field>
            <Field label="Address"><textarea rows={3} value={form.address} onChange={(e) => update("address", e.target.value)} className={`${inputClass} sm:col-span-2`} /></Field>
          </Section>
          <Section title="Emergency Information">
            <Field label="Contact Person"><input value={form.emergencyName} onChange={(e) => update("emergencyName", e.target.value)} className={inputClass} /></Field>
            <Field label="Contact Number"><input value={form.emergencyNumber} onChange={(e) => update("emergencyNumber", e.target.value)} className={inputClass} /></Field>
            <Field label="Relation"><select value={form.emergencyRelation} onChange={(e) => update("emergencyRelation", e.target.value)} className={inputClass}><option value="">Select relation</option><option>Family</option><option>Friend</option><option>Work / Colleague</option><option>Others</option></select></Field>
            <Field label="Address"><textarea rows={3} value={form.emergencyAddress} onChange={(e) => update("emergencyAddress", e.target.value)} className={inputClass} /></Field>
          </Section>
          <Section title="Job Information">
            <Field label="Biometric ID"><input value={form.biometricNo} onChange={(e) => update("biometricNo", e.target.value)} className={inputClass} /></Field>
            <Field label="Employer"><select value={form.employerId} onChange={(e) => update("employerId", e.target.value)} className={inputClass}><option value="">Select employer</option>{employers.map((employer) => <option key={employer.id} value={employer.id}>{employer.company || employer.name}</option>)}</select></Field>
            <Field label="Status"><select value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value, endDate: endedStatuses.has(e.target.value) ? current.endDate : "" }))} className={inputClass}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></Field>
            <Field label="Branch"><input value={form.branch} onChange={(e) => update("branch", e.target.value)} className={inputClass} /></Field>
            <Field label="Date Started"><input type="date" value={form.dateStarted} onChange={(e) => update("dateStarted", e.target.value)} className={inputClass} /></Field>
            {endedStatuses.has(form.status) && <Field label="Ended"><input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} className={inputClass} /></Field>}
          </Section>
          <Section title="Government Information">
            <Field label="SSS"><input inputMode="numeric" value={form.sssNumber} onChange={(e) => update("sssNumber", formatDigits(e.target.value, [2, 7, 1]))} placeholder="00-0000000-0" className={inputClass} /></Field>
            <Field label="Pag-IBIG"><input inputMode="numeric" value={form.pagIbigNumber} onChange={(e) => update("pagIbigNumber", formatDigits(e.target.value, [4, 4, 4]))} placeholder="0000-0000-0000" className={inputClass} /></Field>
            <Field label="PhilHealth"><input inputMode="numeric" value={form.philHealth} onChange={(e) => update("philHealth", formatDigits(e.target.value, [2, 9, 1]))} placeholder="00-000000000-0" className={inputClass} /></Field>
            <Field label="TIN"><input inputMode="numeric" value={form.tinNumber} onChange={(e) => update("tinNumber", formatDigits(e.target.value, [3, 3, 3, 5]))} placeholder="000-000-000-00000" className={inputClass} /></Field>
          </Section>
          <Section title="Remarks">
            <Field label="Additional notes"><textarea rows={5} value={form.remarks} onChange={(e) => update("remarks", e.target.value)} className={`${inputClass} sm:col-span-2`} /></Field>
          </Section>
          <div className="flex justify-end gap-3 pb-6">
            <Link href="/employees" className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</Link>
            <button type="submit" disabled={saving} className="rounded-lg bg-[#172554] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60">{saving ? "Saving..." : "Create employee"}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
