"use client";

import { useEffect, useMemo, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";

type Employer = {
  id: number;
  name: string;
  company: string | null;
  branches: string | null;
  status: string;
  email: string | null;
  contactNumber: string | null;
  branchStatus: string;
  president: string | null;
  longAddress: string | null;
  shortAddress: string | null;
  logo: string | null;
  secDti: string | null;
  secDtiRegistrationDate: string | null;
  tin: string | null;
  tinRegistrationDate: string | null;
  sss: string | null;
  sssRegistrationDate: string | null;
  hdmf: string | null;
  hdmfRegistrationDate: string | null;
  phic: string | null;
  phicRegistrationDate: string | null;
  _count: { employees: number };
};

const emptyForm = {
  name: "", tradeName: "", status: "Active", email: "", contactNumber: "",
  branchName: "", branchStatus: "Open", president: "", longAddress: "",
  shortAddress: "", logo: "", secDti: "", secDtiRegistrationDate: "",
  tin: "", tinRegistrationDate: "", sss: "", sssRegistrationDate: "",
  hdmf: "", hdmfRegistrationDate: "", phic: "", phicRegistrationDate: "",
};

type FormState = typeof emptyForm;

const formatNumber = (value: string, groups: number[]) => {
  const digits = value.replace(/\D/g, "").slice(0, groups.reduce((a, b) => a + b, 0));
  let offset = 0;
  return groups.map((size) => {
    const part = digits.slice(offset, offset + size);
    offset += size;
    return part;
  }).filter(Boolean).join("-");
};

const contact = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  return [digits.slice(0, 2), digits.slice(2, 6), digits.slice(6, 10)].filter(Boolean).join(" ");
};

const dateValue = (value: string | null) => value ? value.slice(0, 10) : "";

export default function EmployersPage() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [showFirstEmployerPrompt, setShowFirstEmployerPrompt] = useState(false);
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [editing, setEditing] = useState<Employer | null>(null);
  const [selectedEmployer, setSelectedEmployer] = useState<Employer | null>(null);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => fetch("/api/employers").then(async (response) => {
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load employers");
    setEmployers(data.employers);
    setShowFirstEmployerPrompt(data.employers.length === 0);
  }).catch((error: Error) => setMessage(error.message));

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const search = query.toLowerCase().trim();
    return employers.filter((employer) =>
      !search || [employer.name, employer.company, employer.branches, employer.email]
        .some((value) => value?.toLowerCase().includes(search)));
  }, [employers, query]);

  const openForm = (employer?: Employer) => {
    setEditing(employer || null);
    setForm(employer ? {
      name: employer.name, tradeName: employer.company || "", status: employer.status,
      email: employer.email || "", contactNumber: employer.contactNumber || "",
      branchName: employer.branches || "", branchStatus: employer.branchStatus,
      president: employer.president || "", longAddress: employer.longAddress || "",
      shortAddress: employer.shortAddress || "", logo: employer.logo || "",
      secDti: employer.secDti || "", secDtiRegistrationDate: dateValue(employer.secDtiRegistrationDate),
      tin: employer.tin || "", tinRegistrationDate: dateValue(employer.tinRegistrationDate),
      sss: employer.sss || "", sssRegistrationDate: dateValue(employer.sssRegistrationDate),
      hdmf: employer.hdmf || "", hdmfRegistrationDate: dateValue(employer.hdmfRegistrationDate),
      phic: employer.phic || "", phicRegistrationDate: dateValue(employer.phicRegistrationDate),
    } : { ...emptyForm });
    setModalOpen(true);
  };

  const update = (key: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const uploadLogo = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Logo must be an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage("Logo must be 2 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update("logo", String(reader.result));
    reader.onerror = () => setMessage("Unable to read the logo file.");
    reader.readAsDataURL(file);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(editing ? `/api/employers/${editing.id}` : "/api/employers", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save employer");
      setForm({ ...emptyForm });
      setEditing(null);
      setModalOpen(false);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save employer");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100";
  const field = (label: string, key: keyof FormState, type = "text") => (
    <label className="grid gap-1.5 text-sm">
      <span className="font-semibold text-gray-900">{label}</span>
      <input type={type} value={form[key]} onChange={(event) => update(key, event.target.value)} className={inputClass} />
    </label>
  );
  const agencyField = (label: string, valueKey: keyof FormState, dateKey: keyof FormState, groups?: number[], required = false) => (
    <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:col-span-2 sm:grid-cols-2">
      <label className="grid gap-1.5 text-sm">
        <span className="font-semibold text-gray-900">{label}{required ? " *" : ""}</span>
        <input required={required} value={form[valueKey]} onChange={(event) => update(valueKey, groups ? formatNumber(event.target.value, groups) : event.target.value)} className={inputClass} />
      </label>
      {field("Registration Date", dateKey, "date")}
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="w-full">
        <header className="mb-6 flex items-center justify-between gap-4">
          <button type="button" onClick={() => openForm()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#172554] px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900"><PlusIcon className="h-4 w-4" />Add employer</button>
        </header>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employers..." className={`${inputClass} mb-6`} />
        {message && <p className="mb-4 font-medium text-red-700">{message}</p>}
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((employer) => (
            <article
              key={employer.id}
              role="button"
              tabIndex={0}
              aria-label={`View details for ${employer.name}`}
              onClick={() => setSelectedEmployer(employer)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedEmployer(employer);
                }
              }}
              className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <div className="flex justify-between gap-3">
                <div className="flex gap-3">
                  {employer.logo ? <img src={employer.logo} alt={`${employer.name} logo`} className="h-14 w-14 rounded-lg object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-500">Logo</div>}
                  <div><h2 className="font-semibold text-gray-950">{employer.name}</h2><p className="text-sm text-gray-700">{employer.company || "No trade name"}</p></div>
                </div>
                <div className="relative">
                  <button type="button" aria-label={`Actions for ${employer.name}`} onClick={(event) => { event.stopPropagation(); setOpenMenu(openMenu === employer.id ? null : employer.id); }} className="text-xl text-gray-500">•••</button>
                  {openMenu === employer.id && <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedEmployer(null); openForm(employer); setOpenMenu(null); }} className="absolute right-0 top-7 z-10 rounded border bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow">Update</button>}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
                <p><span className="font-medium text-gray-600">Status</span><br /><strong className="font-semibold text-gray-950">{employer.status}</strong></p>
                <p><span className="font-medium text-gray-600">Branch</span><br /><strong className="font-semibold text-gray-950">{employer.branches || "Not set"}</strong></p>
                <p><span className="font-medium text-gray-600">Contact</span><br /><strong className="font-semibold text-gray-950">{employer.contactNumber || "Not set"}</strong></p>
                <p><span className="font-medium text-gray-600">Employees</span><br /><strong className="font-semibold text-gray-950">{employer._count.employees}</strong></p>
              </div>
            </article>
          ))}
        </div>
        {showFirstEmployerPrompt && !message && employers.length === 0 && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="first-employer-title" className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <span className="text-2xl font-semibold">+</span>
            </div>
            <h2 id="first-employer-title" className="mt-4 text-xl font-bold text-gray-900">No employers yet</h2>
            <p className="mt-2 text-sm text-gray-600">Add your first employer to start organizing employers and branches.</p>
            <div className="mt-6 flex justify-center gap-2">
              <button type="button" onClick={() => setShowFirstEmployerPrompt(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Maybe later</button>
              <button type="button" onClick={() => { setShowFirstEmployerPrompt(false); openForm(); }} className="rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900">Add first employer</button>
            </div>
          </section>
        </div>}
        {selectedEmployer && (
          <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onClick={() => setSelectedEmployer(null)}>
            <section role="dialog" aria-modal="true" aria-labelledby="employer-details-title" onClick={(event) => event.stopPropagation()} className="my-auto w-full max-w-3xl rounded-xl bg-white p-5 shadow-xl sm:p-6">
              <header className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
                <div className="flex min-w-0 items-center gap-3">
                  {selectedEmployer.logo ? <img src={selectedEmployer.logo} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-gray-200 object-cover" /> : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-500">Logo</div>}
                  <div className="min-w-0">
                    <h2 id="employer-details-title" className="truncate text-xl font-bold text-gray-950">{selectedEmployer.name}</h2>
                    <p className="truncate text-sm text-gray-600">{selectedEmployer.company || "No trade name"}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedEmployer(null)} aria-label="Close employer details" className="rounded-md p-1 text-2xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-900">×</button>
              </header>
              <div className="mt-5 max-h-[65vh] overflow-y-auto pr-2">
                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  {[
                    ["Status", selectedEmployer.status],
                    ["Branch status", selectedEmployer.branchStatus],
                    ["Branch", selectedEmployer.branches],
                    ["President", selectedEmployer.president],
                    ["Email", selectedEmployer.email],
                    ["Contact number", selectedEmployer.contactNumber],
                    ["Short address", selectedEmployer.shortAddress],
                    ["Full address", selectedEmployer.longAddress],
                    ["Employees", String(selectedEmployer._count.employees)],
                    ["SEC / DTI", selectedEmployer.secDti],
                    ["SEC / DTI registration", selectedEmployer.secDtiRegistrationDate ? new Date(selectedEmployer.secDtiRegistrationDate).toLocaleDateString() : null],
                    ["TIN", selectedEmployer.tin],
                    ["TIN registration", selectedEmployer.tinRegistrationDate ? new Date(selectedEmployer.tinRegistrationDate).toLocaleDateString() : null],
                    ["SSS", selectedEmployer.sss],
                    ["SSS registration", selectedEmployer.sssRegistrationDate ? new Date(selectedEmployer.sssRegistrationDate).toLocaleDateString() : null],
                    ["HDMF", selectedEmployer.hdmf],
                    ["HDMF registration", selectedEmployer.hdmfRegistrationDate ? new Date(selectedEmployer.hdmfRegistrationDate).toLocaleDateString() : null],
                    ["PHIC", selectedEmployer.phic],
                    ["PHIC registration", selectedEmployer.phicRegistrationDate ? new Date(selectedEmployer.phicRegistrationDate).toLocaleDateString() : null],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0 border-b border-gray-100 pb-3">
                      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
                      <dd className="mt-1 break-words text-sm font-medium text-gray-900">{value || "Not set"}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <footer className="mt-5 flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button type="button" onClick={() => setSelectedEmployer(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Close</button>
                <button type="button" onClick={() => { openForm(selectedEmployer); setSelectedEmployer(null); }} className="rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900">Edit employer</button>
              </footer>
            </section>
          </div>
        )}
        {modalOpen && (
          <div className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/40 p-3 sm:items-center sm:p-4">
            <form onSubmit={submit} className="my-2 max-h-[calc(100vh-1rem)] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:my-4 sm:max-h-[calc(100vh-2rem)] sm:p-6">
              <div className="sticky top-0 z-10 mb-5 flex justify-between bg-white pb-2"><h2 className="text-xl font-bold text-gray-950">{editing ? "Update employer" : "Add employer"}</h2><button type="button" onClick={() => { setEditing(null); setForm({ ...emptyForm }); setModalOpen(false); }} className="text-2xl text-gray-500" aria-label="Close">×</button></div>
              <div className="grid gap-4 sm:grid-cols-2">
                {field("Employer Name", "name")}{field("Trade Name", "tradeName")}{field("Email Address", "email", "email")}
                <label className="grid gap-1.5 text-sm"><span className="font-semibold text-gray-900">Contact Number</span><input value={form.contactNumber} onChange={(event) => update("contactNumber", contact(event.target.value))} placeholder="00 0000 0000" className={inputClass} /></label>
                {field("Branch Name", "branchName")}{field("President", "president")}
                <label className="grid gap-1.5 text-sm"><span className="font-semibold text-gray-900">Status</span><select value={form.status} onChange={(event) => update("status", event.target.value)} className={inputClass}><option>Active</option><option>Inactive</option></select></label>
                <label className="grid gap-1.5 text-sm"><span className="font-semibold text-gray-900">Branch Status</span><select value={form.branchStatus} onChange={(event) => update("branchStatus", event.target.value)} className={inputClass}><option>Open</option><option>Close</option></select></label>
                <label className="grid gap-1.5 text-sm sm:col-span-2"><span className="font-semibold text-gray-900">Long Address</span><textarea value={form.longAddress} onChange={(event) => update("longAddress", event.target.value)} rows={3} className={inputClass} /></label>
                <label className="grid gap-1.5 text-sm sm:col-span-2"><span className="font-semibold text-gray-900">Short Address</span><textarea value={form.shortAddress} onChange={(event) => update("shortAddress", event.target.value)} rows={3} className={inputClass} /></label>
                <div className="grid gap-2 text-sm sm:col-span-2"><span className="font-semibold text-gray-900">Logo</span><div className="flex items-center gap-3"><label className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 font-semibold text-gray-800 hover:bg-gray-50"><span>Upload logo</span><input type="file" accept="image/*" onChange={(event) => uploadLogo(event.target.files?.[0])} className="sr-only" /></label>{form.logo && <img src={form.logo} alt="Logo preview" className="h-14 w-14 rounded-lg border border-gray-300 object-cover" />} {form.logo && <button type="button" onClick={() => update("logo", "")} className="text-sm font-medium text-red-700">Remove</button>}</div></div>
                <h3 className="border-b pb-2 pt-2 text-base font-bold text-gray-950 sm:col-span-2">Government Agencies</h3>
                {agencyField("SEC / DTI Registration Number", "secDti", "secDtiRegistrationDate", undefined, true)}
                {agencyField("TIN", "tin", "tinRegistrationDate", [3, 3, 3, 5])}
                {agencyField("SSS", "sss", "sssRegistrationDate", [2, 7, 1])}
                {agencyField("HDMF", "hdmf", "hdmfRegistrationDate", [4, 4, 4])}
                {agencyField("PHIC", "phic", "phicRegistrationDate", [2, 9, 1])}
              </div>
              <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => { setEditing(null); setForm({ ...emptyForm }); setModalOpen(false); }} className="rounded-lg border px-4 py-2 font-medium text-gray-800">Cancel</button><button disabled={saving} className="rounded-lg bg-[#172554] px-4 py-2 font-semibold text-white">{saving ? "Saving..." : "Save employer"}</button></div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
