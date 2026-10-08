"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { EyeIcon, PencilSquareIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

type Contact = {
  id: number;
  employeeId: number | null;
  employee: { id: number; firstName: string; lastName: string } | null;
  companyName: string;
  contactName: string;
  category: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  services: string | null;
  branch: string | null;
  photoUrl?: string | null;
};

type ContactDraft = Omit<Contact, "id" | "employee">;
const primaryCategories = [
  "Food & Beverages",
  "Kitchen Supplies",
  "Repairs and Maintenance",
  "Services & Safety",
  "Internal Team",
  "Employee Contact",
];

const emptyContactDraft: ContactDraft = {
  companyName: "",
  contactName: "",
  category: "",
  phone: "",
  email: "",
  address: "",
  services: "",
  branch: "",
  employeeId: null,
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("contact");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [updatingEmployee, setUpdatingEmployee] = useState<Contact | null>(null);
  const [employeePhoneDraft, setEmployeePhoneDraft] = useState("");
  const [draft, setDraft] = useState<ContactDraft>(emptyContactDraft);

  useEffect(() => {
    fetch("/api/contacts")
      .then(async (res) => {
        const responseText = await res.text();
        let data: { contacts?: Contact[]; error?: string };
        try {
          data = responseText ? JSON.parse(responseText) : {};
        } catch {
          throw new Error(`Unable to load contacts (server returned ${res.status} without valid JSON).`);
        }
        if (!res.ok) throw new Error(data.error || `Unable to load contacts (${res.status})`);
        setContacts(Array.isArray(data.contacts) ? data.contacts : []);
      })
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  const additionalCategories = [...new Set(contacts.map((contact) => contact.category))]
    .filter((item) => !primaryCategories.includes(item))
    .sort((a, b) => a.localeCompare(b));
  const categories = [...primaryCategories, ...additionalCategories];
  const filteredContacts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return contacts.filter((contact) => {
      const matchesCategory = category === "ALL" || contact.category === category;
      const matchesSearch =
        !search ||
        contact.companyName.toLowerCase().includes(search) ||
        contact.contactName.toLowerCase().includes(search) ||
        (contact.services || "").toLowerCase().includes(search) ||
        (contact.email || "").toLowerCase().includes(search) ||
        (contact.phone || "").toLowerCase().includes(search) ||
        (contact.address || "").toLowerCase().includes(search) ||
        (contact.branch || "").toLowerCase().includes(search) ||
        `${contact.employee?.firstName || ""} ${contact.employee?.lastName || ""}`.toLowerCase().includes(search);
      return matchesCategory && matchesSearch;
    });
  }, [category, contacts, query]);
  const sortedContacts = useMemo(() => [...filteredContacts].sort((a, b) => {
    const left = sortBy === "contact" ? a.contactName : a.companyName;
    const right = sortBy === "contact" ? b.contactName : b.companyName;
    return left.localeCompare(right);
  }), [filteredContacts, sortBy]);
  const hasFilters = Boolean(query || category !== "ALL");

  const saveContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isUpdating = editingContactId !== null;
    setAdding(true);
    setMessage("");
    setNotice("");
    try {
      const response = await fetch(isUpdating ? `/api/contacts/${editingContactId}` : "/api/contacts", {
        method: isUpdating ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Unable to ${isUpdating ? "update" : "add"} contact`);
      setContacts((current) => isUpdating
        ? current.map((contact) => contact.id === editingContactId ? data.contact as Contact : contact)
        : [...current, data.contact as Contact]);
      setCategory("ALL");
      setQuery("");
      setDraft(emptyContactDraft);
      setAddOpen(false);
      setEditingContactId(null);
      setNotice(isUpdating ? "Contact updated successfully." : "Contact added successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Unable to ${isUpdating ? "update" : "add"} contact`);
    } finally {
      setAdding(false);
    }
  };

  const editContact = (contact: Contact) => {
    setMessage("");
    setNotice("");
    setEditingContactId(contact.id);
    setDraft({
      companyName: contact.companyName,
      contactName: contact.contactName,
      category: contact.category,
      phone: contact.phone,
      email: contact.email,
      address: contact.address,
      services: contact.services,
      branch: contact.branch,
      employeeId: contact.employeeId,
    });
    setAddOpen(true);
  };

  const updateEmployeePhone = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!updatingEmployee?.employeeId) return;
    setAdding(true);
    setMessage("");
    setNotice("");
    try {
      const response = await fetch(`/api/employees/${updatingEmployee.employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: employeePhoneDraft.trim() || null }),
      });
      const responseText = await response.text();
      let data: { error?: string } = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(`Unable to update phone number (server returned ${response.status} without valid JSON).`);
      }
      if (!response.ok) throw new Error(data.error || "Unable to update phone number");
      setContacts((current) => current.map((contact) => contact.employeeId === updatingEmployee.employeeId
        ? { ...contact, phone: employeePhoneDraft.trim() || null }
        : contact));
      setUpdatingEmployee(null);
      setNotice("Employee phone number updated successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update phone number");
    } finally {
      setAdding(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-gray-50 p-4 sm:p-6 [&>div]:!max-w-none">
      <div className="w-full max-w-6xl">
        <section aria-label="Contact directory tools" className="relative top-0 mb-4 grid grid-cols-1 items-center gap-2 sm:relative sm:-top-16 sm:-mb-12 sm:grid-cols-2 lg:grid-cols-[77px_auto_minmax(180px,1fr)_minmax(150px,180px)_minmax(150px,180px)]">
          <span aria-hidden="true" className="hidden lg:block" />
          <button type="button" onClick={() => { setMessage(""); setNotice(""); setEditingContactId(null); setDraft(emptyContactDraft); setAddOpen(true); }} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#172554] px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900">
            <PlusIcon className="h-4 w-4" /> Add contact
          </button>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search contacts..." aria-label="Search contacts" className="col-span-1 h-10 min-w-0 rounded-lg border border-gray-300 bg-white px-3 text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 sm:col-span-2 lg:col-span-1" />
          <select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 min-w-0 rounded-lg border border-gray-300 bg-white px-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
            <option value="ALL">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select aria-label="Sort contacts" value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-10 min-w-0 rounded-lg border border-gray-300 bg-white px-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
            <option value="company">Company A–Z</option>
            <option value="contact">Contact name A–Z</option>
          </select>
        </section>
        {message && !addOpen && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</p>}
        {notice && <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
        <div className="mb-4 hidden flex-wrap items-center gap-2 lg:flex">
          <span className="mr-1 text-sm font-medium text-slate-500">Quick filters:</span>
          {[{ value: "ALL", label: "All categories" }, ...categories.map((item) => ({ value: item, label: item }))].map((quickFilter) => (
            <button
              key={quickFilter.value}
              type="button"
              onClick={() => setCategory(quickFilter.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${category === quickFilter.value ? "border-blue-200 bg-blue-100 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
            >
              {quickFilter.label}
            </button>
          ))}
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
          <span>Showing <strong className="text-gray-900">{sortedContacts.length}</strong> of <strong className="text-gray-900">{contacts.length}</strong> contacts</span>
          {hasFilters && <button type="button" onClick={() => { setQuery(""); setCategory("ALL"); }} className="font-semibold text-blue-700 hover:underline">Clear filters</button>}
        </div>
        {loading ? <p role="status" className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600 shadow-sm">Loading contacts...</p>
          : sortedContacts.length === 0 ? <p className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600 shadow-sm">{contacts.length === 0 ? "No contacts have been added yet." : "No contacts match these filters."}</p> : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {sortedContacts.map((contact) => (
              <article key={contact.id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md sm:p-5">
                <div className="-mx-3 -mt-3 mb-3 flex min-h-12 items-center justify-between gap-2 border-b border-gray-200 bg-slate-50 px-3 py-2.5 sm:-mx-5 sm:-mt-5 sm:px-5">
                  <span className="min-w-0 truncate text-sm font-semibold uppercase tracking-wide text-blue-900">{contact.category}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => setViewingContact(contact)} title={`View ${contact.contactName}`} aria-label={`View ${contact.contactName}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    {contact.employeeId !== null ? (
                      <button type="button" onClick={() => { setEmployeePhoneDraft(contact.phone || ""); setUpdatingEmployee(contact); }} title={`Update phone for ${contact.contactName}`} aria-label={`Update phone for ${contact.contactName}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                    ) : (
                      <button type="button" onClick={() => editContact(contact)} title={`Update ${contact.contactName}`} aria-label={`Update ${contact.contactName}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex min-w-0 gap-3 sm:gap-4">
                  <div className="w-16 shrink-0 sm:w-20">
                    {contact.photoUrl ? (
                      <img src={contact.photoUrl} alt={`${contact.contactName} profile`} className="h-20 w-16 rounded-lg border border-gray-200 object-cover sm:h-24 sm:w-20" />
                    ) : (
                      <div aria-label={`${contact.contactName} photo placeholder`} className="flex h-20 w-16 items-center justify-center rounded-lg border border-gray-200 bg-slate-100 text-xl font-bold text-slate-400 sm:h-24 sm:w-20 sm:text-2xl">
                        {contact.contactName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="min-w-0">
                      <h2 className="break-words text-sm font-semibold leading-5 text-gray-900 sm:text-base">{contact.contactName}</h2>
                      <p className="mt-1 break-words text-xs leading-5 text-gray-700 sm:text-sm">{contact.companyName}</p>
                    </div>
                    <p className="mt-2 break-words text-xs font-medium leading-5 text-gray-800 sm:text-sm">{contact.phone || "Phone not set"}</p>
                    {contact.category === "Employee Contact" && <p className="mt-1 break-words text-xs leading-5 text-gray-600 sm:text-sm">{contact.services || "Position not set"}</p>}
                  </div>
                </div>
                {contact.category !== "Employee Contact" && contact.services && <p className="mt-4 line-clamp-2 text-sm text-gray-600">{contact.services}</p>}
              </article>
            ))}
          </div>
        )}
      </div>
      {viewingContact && (
        <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4" onClick={() => setViewingContact(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="view-contact-title" onClick={(event) => event.stopPropagation()} className="my-auto w-full max-w-lg rounded-xl bg-white p-5 shadow-xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2 id="view-contact-title" className="text-xl font-bold text-slate-900">Contact information</h2>
              <button type="button" onClick={() => setViewingContact(null)} aria-label="Close contact details" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <dl className="grid gap-4 text-sm">
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone Number</dt><dd className="mt-1 text-slate-900">{viewingContact.phone || "Not set"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</dt><dd className="mt-1 break-all text-slate-900">{viewingContact.email || "Not set"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Address</dt><dd className="mt-1 whitespace-pre-wrap text-slate-900">{viewingContact.address || "Not set"}</dd></div>
            </dl>
          </section>
        </div>
      )}
      {updatingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4" onClick={() => { if (!adding) setUpdatingEmployee(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="update-employee-phone-title" onClick={(event) => event.stopPropagation()} className="my-auto w-full max-w-md rounded-xl bg-white p-5 shadow-xl sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="update-employee-phone-title" className="text-xl font-bold text-slate-900">Update phone number</h2>
              <button type="button" onClick={() => setUpdatingEmployee(null)} disabled={adding} aria-label="Close update form" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <p className="mb-4 text-sm text-slate-600">{updatingEmployee.contactName}</p>
            {message && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</p>}
            <form onSubmit={updateEmployeePhone} className="grid gap-4">
              <label className="grid gap-1 text-sm font-medium text-slate-700">Phone Number<input type="tel" value={employeePhoneDraft} onChange={(event) => setEmployeePhoneDraft(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setUpdatingEmployee(null)} disabled={adding} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={adding} className="rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50">{adding ? "Saving..." : "Save phone number"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4" onClick={() => { if (!adding) setAddOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="add-contact-title" onClick={(event) => event.stopPropagation()} className="my-auto w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="add-contact-title" className="text-xl font-bold text-slate-900">{editingContactId === null ? "Add contact" : "Update contact"}</h2>
              <button type="button" onClick={() => setAddOpen(false)} disabled={adding} aria-label="Close add contact form" className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50">×</button>
            </div>
            {message && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</p>}
            <form onSubmit={saveContact} className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-medium text-slate-700 sm:col-span-2">Category<select required value={draft.category ?? ""} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value, employeeId: null }))} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"><option value="" disabled>Select category</option>{categories.filter((item) => item !== "Employee Contact").map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700">Company name<input required maxLength={120} value={draft.companyName} onChange={(event) => setDraft((current) => ({ ...current, companyName: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700">Contact name<input required maxLength={120} value={draft.contactName} onChange={(event) => setDraft((current) => ({ ...current, contactName: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700">Phone<input type="tel" value={draft.phone ?? ""} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700">Email<input type="email" value={draft.email ?? ""} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700 sm:col-span-2">Service<textarea rows={2} value={draft.services ?? ""} onChange={(event) => setDraft((current) => ({ ...current, services: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700 sm:col-span-2">Address<textarea rows={2} value={draft.address ?? ""} onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700 sm:col-span-2">Branch<input value={draft.branch ?? ""} onChange={(event) => setDraft((current) => ({ ...current, branch: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <button type="button" onClick={() => setAddOpen(false)} disabled={adding} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Back to contacts</button>
                <button type="submit" disabled={adding} className="rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50">{adding ? (editingContactId === null ? "Adding..." : "Updating...") : (editingContactId === null ? "Add contact" : "Update contact")}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
