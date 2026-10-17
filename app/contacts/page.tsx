"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowPathIcon, EyeIcon, PencilSquareIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

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
  photoUrl: null,
  employeeId: null,
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [updatingEmployee, setUpdatingEmployee] = useState<Contact | null>(null);
  const [employeePhoneDraft, setEmployeePhoneDraft] = useState("");
  const [phones, setPhones] = useState<string[]>([""]);
  const [draft, setDraft] = useState<ContactDraft>(emptyContactDraft);

  const uploadContactImage = (file: File | undefined) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      setMessage("Choose a PNG, JPEG, WebP, or GIF image.");
      return;
    }
    if (file.size === 0) {
      setMessage("The selected image file is empty.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage("Contact image must be 2 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result;
      if (typeof imageUrl !== "string") {
        setMessage("Unable to read the contact image.");
        return;
      }
      setDraft((current) => ({ ...current, photoUrl: imageUrl }));
      setMessage("");
    };
    reader.onerror = () => setMessage("Unable to read the contact image.");
    reader.readAsDataURL(file);
  };

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
      const matchesCategory = !selectedCategory || contact.category === selectedCategory;
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
  }, [contacts, query, selectedCategory]);
  const sortedContacts = useMemo(() => [...filteredContacts].sort((a, b) => {
    return a.contactName.localeCompare(b.contactName);
  }), [filteredContacts]);

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
        body: JSON.stringify({ ...draft, phone: phones.map((p) => p.trim()).filter(Boolean).join(", ") || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Unable to ${isUpdating ? "update" : "add"} contact`);
      setContacts((current) => isUpdating
        ? current.map((contact) => contact.id === editingContactId ? data.contact as Contact : contact)
        : [...current, data.contact as Contact]);
      setQuery("");
      setSelectedCategory("");
      setDraft(emptyContactDraft);
      setPhones([""]);
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
    setPhones(contact.phone ? contact.phone.split(",").map((p) => p.trim()).filter(Boolean) : [""]);
    setDraft({
      companyName: contact.companyName,
      contactName: contact.contactName,
      category: contact.category,
      phone: contact.phone,
      email: contact.email,
      address: contact.address,
      services: contact.services,
      branch: contact.branch,
      photoUrl: contact.photoUrl || null,
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
        <section aria-label="Contact directory tools" className="mb-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => { setMessage(""); setNotice(""); setEditingContactId(null); setDraft(emptyContactDraft); setPhones([""]); setAddOpen(true); }} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#172554] px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900">
            <PlusIcon className="h-4 w-4" /> Add contact
          </button>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search contacts..." aria-label="Search contacts" className="h-10 min-w-[180px] flex-1 rounded-lg border border-gray-300 bg-white px-3 text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
          <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} aria-label="Filter contacts by category" className="h-10 w-[190px] shrink-0 rounded-lg border border-gray-300 bg-white px-3 text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
            <option value="">All categories</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <button type="button" onClick={() => { setQuery(""); setSelectedCategory(""); }} disabled={!query && !selectedCategory} aria-label="Clear contact filters" title="Clear filters" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
            <ArrowPathIcon className="h-4 w-4" />
          </button>
          <span className="ml-auto whitespace-nowrap text-sm text-gray-600">Showing <strong className="text-gray-900">{sortedContacts.length}</strong> of <strong className="text-gray-900">{contacts.length}</strong> contacts</span>
        </section>
        {message && !addOpen && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</p>}
        {notice && <div role="status" className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><p>{notice}</p><button type="button" onClick={() => setNotice("")} className="shrink-0 rounded-md px-3 py-1.5 font-semibold text-emerald-900 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-600">OK</button></div>}
        {loading ? <p role="status" className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600 shadow-sm">Loading contacts...</p>
          : sortedContacts.length === 0 ? <p className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600 shadow-sm">{contacts.length === 0 ? "No contacts have been added yet." : "No contacts match your search."}</p> : (
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
                    <p className="mt-1 break-words whitespace-pre-wrap text-xs leading-5 text-gray-600">{contact.address || "Address not set"}</p>
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
            <div className="mb-5 flex items-center gap-4 border-b border-slate-100 pb-5">
              {viewingContact.photoUrl ? (
                <img src={viewingContact.photoUrl} alt={`${viewingContact.contactName} profile`} className="h-20 w-20 shrink-0 rounded-xl border border-slate-200 object-cover" />
              ) : (
                <div aria-label={`${viewingContact.contactName} photo placeholder`} className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl font-bold text-slate-400">
                  {viewingContact.contactName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?"}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">{viewingContact.category}</p>
                <h3 className="mt-1 break-words text-lg font-bold text-slate-900">{viewingContact.contactName}</h3>
                <p className="mt-1 break-words text-sm text-slate-600">{viewingContact.companyName}</p>
              </div>
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
              <div className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">Contact photo or logo</span>
                <div className="flex flex-wrap items-center gap-3">
                  {draft.photoUrl ? <img src={draft.photoUrl} alt="Contact image preview" className="h-20 w-20 rounded-xl border border-slate-200 object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">No image</div>}
                  <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    <span>{draft.photoUrl ? "Change image" : "Upload image"}</span>
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => { uploadContactImage(event.target.files?.[0]); event.currentTarget.value = ""; }} className="sr-only" />
                  </label>
                  {draft.photoUrl && <button type="button" onClick={() => setDraft((current) => ({ ...current, photoUrl: null }))} className="text-sm font-medium text-red-700 hover:text-red-800">Remove image</button>}
                  <span className="text-xs text-slate-500">PNG, JPEG, WebP, or GIF · 2 MB max</span>
                </div>
              </div>
                  <label className="grid gap-1 text-sm font-medium text-slate-700">Company name<input required maxLength={120} value={draft.companyName} onChange={(event) => setDraft((current) => ({ ...current, companyName: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700">Contact name<input required maxLength={120} value={draft.contactName} onChange={(event) => setDraft((current) => ({ ...current, contactName: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700">Email<input type="email" value={draft.email ?? ""} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700 sm:col-span-2">Service<textarea rows={2} value={draft.services ?? ""} onChange={(event) => setDraft((current) => ({ ...current, services: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
                  <label className="grid gap-1 text-sm font-medium text-slate-700 sm:col-span-2">Address<textarea rows={2} value={draft.address ?? ""} onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
                  <div className="sm:col-span-2">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-700">Phone numbers</span>
                      <button type="button" onClick={() => setPhones((current) => [...current, ""])} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
                        <PlusIcon className="h-3.5 w-3.5" /> Add phone number
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {phones.map((phone, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input type="tel" value={phone} onChange={(event) => setPhones((current) => current.map((p, i) => (i === index ? event.target.value : p)))} placeholder="Phone number" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
                          {phones.length > 1 && (
                            <button type="button" onClick={() => setPhones((current) => current.filter((_, i) => i !== index))} aria-label="Remove phone number" title="Remove phone number" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
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
