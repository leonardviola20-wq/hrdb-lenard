"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type Employer = { id: number; name: string; company: string | null };

type EmployeeForm = {
  employeeCode: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  age: string;
  maritalStatus: string;
  gender: string;
  mobileNumber: string;
  email: string;
  address: string;
  emergencyName: string;
  emergencyNumber: string;
  emergencyRelation: string;
  emergencyAddress: string;
  biometricNo: string;
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
  employeeCode: "", firstName: "", middleName: "", lastName: "", dateOfBirth: "",
  age: "", maritalStatus: "", gender: "", mobileNumber: "", email: "", address: "",
  emergencyName: "", emergencyNumber: "", emergencyRelation: "", emergencyAddress: "",
  biometricNo: "", employerId: "", status: "Trainee", dateStarted: "", endDate: "",
  sssNumber: "", pagIbigNumber: "", philHealth: "", tinNumber: "", remarks: "",
};

const statuses = ["Trainee", "Regular", "Contractual", "No Contract", "End of contract", "Resigned", "Terminated", "AWOL", "Leave"];
const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";

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
            <Field label="Employee Code" required><input required value={form.employeeCode} onChange={(e) => update("employeeCode", e.target.value)} className={inputClass} /></Field>
            <div />
            <Field label="First Name" required><input required value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className={inputClass} /></Field>
            <Field label="Middle Name"><input value={form.middleName} onChange={(e) => update("middleName", e.target.value)} className={inputClass} /></Field>
            <Field label="Last Name" required><input required value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className={inputClass} /></Field>
            <div />
            <Field label="Date of Birth"><input type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} className={inputClass} /></Field>
            <Field label="Age"><input type="number" min="0" max="130" value={form.age} onChange={(e) => update("age", e.target.value)} className={inputClass} /></Field>
            <Field label="Marital Status"><select value={form.maritalStatus} onChange={(e) => update("maritalStatus", e.target.value)} className={inputClass}><option value="">Select status</option><option>Single</option><option>Married</option><option>Widowed</option><option>Separated</option></select></Field>
            <Field label="Gender"><select value={form.gender} onChange={(e) => update("gender", e.target.value)} className={inputClass}><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></select></Field>
          </Section>
          <Section title="Contact Information">
            <Field label="Mobile Number"><input value={form.mobileNumber} onChange={(e) => update("mobileNumber", e.target.value)} className={inputClass} /></Field>
            <Field label="Email Address"><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} /></Field>
            <Field label="Address"><textarea rows={3} value={form.address} onChange={(e) => update("address", e.target.value)} className={`${inputClass} sm:col-span-2`} /></Field>
          </Section>
          <Section title="Emergency Information">
            <Field label="Contact Person"><input value={form.emergencyName} onChange={(e) => update("emergencyName", e.target.value)} className={inputClass} /></Field>
            <Field label="Contact Number"><input value={form.emergencyNumber} onChange={(e) => update("emergencyNumber", e.target.value)} className={inputClass} /></Field>
            <Field label="Relation"><input value={form.emergencyRelation} onChange={(e) => update("emergencyRelation", e.target.value)} className={inputClass} /></Field>
            <Field label="Address"><textarea rows={3} value={form.emergencyAddress} onChange={(e) => update("emergencyAddress", e.target.value)} className={inputClass} /></Field>
          </Section>
          <Section title="Job Information">
            <Field label="Biometric ID"><input value={form.biometricNo} onChange={(e) => update("biometricNo", e.target.value)} className={inputClass} /></Field>
            <Field label="Employer"><select value={form.employerId} onChange={(e) => update("employerId", e.target.value)} className={inputClass}><option value="">Select employer</option>{employers.map((employer) => <option key={employer.id} value={employer.id}>{employer.company || employer.name}</option>)}</select></Field>
            <Field label="Status"><select value={form.status} onChange={(e) => update("status", e.target.value)} className={inputClass}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></Field>
            <div />
            <Field label="Date Started"><input type="date" value={form.dateStarted} onChange={(e) => update("dateStarted", e.target.value)} className={inputClass} /></Field>
            <Field label="Ended"><input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} className={inputClass} /></Field>
          </Section>
          <Section title="Government Information">
            <Field label="SSS"><input value={form.sssNumber} onChange={(e) => update("sssNumber", e.target.value)} className={inputClass} /></Field>
            <Field label="Pag-IBIG"><input value={form.pagIbigNumber} onChange={(e) => update("pagIbigNumber", e.target.value)} className={inputClass} /></Field>
            <Field label="PhilHealth"><input value={form.philHealth} onChange={(e) => update("philHealth", e.target.value)} className={inputClass} /></Field>
            <Field label="TIN"><input value={form.tinNumber} onChange={(e) => update("tinNumber", e.target.value)} className={inputClass} /></Field>
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
