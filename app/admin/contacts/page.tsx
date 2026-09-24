"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Contact = {
  id: number;
  companyName: string;
  contactName: string;
  category: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  services: string | null;
  branch: string | null;
  notes: string | null;
  active: boolean;
};

type ContactForm = {
  companyName: string;
  contactName: string;
  category: string;
  phone: string;
  email: string;
  address: string;
  services: string;
  branch: string;
  notes: string;
};

const emptyContact: ContactForm = {
  companyName: "",
  contactName: "",
  category: "",
  phone: "",
  email: "",
  address: "",
  services: "",
  branch: "",
  notes: "",
};

const inputClass = "w-full rounded border border-gray-400 bg-white p-2 text-gray-900 placeholder:text-gray-500";

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [form, setForm] = useState(emptyContact);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [editingForm, setEditingForm] = useState<ContactForm>(emptyContact);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const loadContacts = async () => {
    const res = await fetch("/api/contacts");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unable to load contacts");
    setContacts(data.contacts);
  };

  useEffect(() => {
    let cancelled = false;
    const fetchContacts = async () => {
      try {
        await loadContacts();
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "Unable to load contacts");
        }
      }
    };
    void fetchContacts();
    return () => {
      cancelled = true;
    };
  }, []);

  const addContact = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to add contact");
      setContacts((current) => [...current, data.contact].sort((a, b) => a.companyName.localeCompare(b.companyName)));
      setForm(emptyContact);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add contact");
    } finally {
      setSaving(false);
    }
  };

  const archiveContact = async (contact: Contact) => {
    if (!window.confirm(`Archive ${contact.companyName}?`)) return;
    const res = await fetch(`/api/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: false }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Unable to archive contact");
      return;
    }
    setContacts((current) => current.filter((item) => item.id !== contact.id));
  };

  const beginEdit = (contact: Contact) => {
    setEditing(contact);
    setEditingForm({
      companyName: contact.companyName,
      contactName: contact.contactName,
      category: contact.category,
      phone: contact.phone || "",
      email: contact.email || "",
      address: contact.address || "",
      services: contact.services || "",
      branch: contact.branch || "",
      notes: "",
    });
    setMessage("");
  };

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/contacts/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to update contact");
      setContacts((current) =>
        current
          .map((item) => (item.id === editing.id ? data.contact : item))
          .sort((a, b) => a.companyName.localeCompare(b.companyName))
      );
      setEditing(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update contact");
    } finally {
      setSaving(false);
    }
  };

  const renderContactFields = (
    values: ContactForm,
    setValues: (value: ContactForm) => void
  ) => (
    <>
      <input required value={values.companyName} onChange={(e) => setValues({ ...values, companyName: e.target.value })} placeholder="Company name" className={inputClass} />
      <input required value={values.contactName} onChange={(e) => setValues({ ...values, contactName: e.target.value })} placeholder="Contact person" className={inputClass} />
      <input required value={values.category} onChange={(e) => setValues({ ...values, category: e.target.value })} placeholder="Category (e.g. Maintenance)" className={inputClass} />
      <input value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} placeholder="Phone number" className={inputClass} />
      <input type="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} placeholder="Email" className={inputClass} />
      <input value={values.branch} onChange={(e) => setValues({ ...values, branch: e.target.value })} placeholder="Branch or office" className={inputClass} />
      <input value={values.address} onChange={(e) => setValues({ ...values, address: e.target.value })} placeholder="Address" className={`${inputClass} md:col-span-2`} />
      <input value={values.services} onChange={(e) => setValues({ ...values, services: e.target.value })} placeholder="Services provided" className={`${inputClass} md:col-span-2`} />
      <textarea value={values.notes} onChange={(e) => setValues({ ...values, notes: e.target.value })} placeholder="Notes (optional)" rows={3} className={`${inputClass} md:col-span-2`} />
    </>
  );

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="text-sm text-blue-600 hover:underline">Back to admin dashboard</Link>
        <h1 className="mb-6 mt-2 text-3xl font-bold text-gray-900">Manage office contacts</h1>
        {message && <p className="mb-4 text-red-600">{message}</p>}
        <form onSubmit={addContact} className="mb-8 grid gap-3 rounded-lg bg-white p-5 shadow md:grid-cols-2">
          <h2 className="text-lg font-semibold text-gray-900 md:col-span-2">Add contact</h2>
          {renderContactFields(form, setForm)}
          <button disabled={saving} className="w-fit rounded border border-gray-500 bg-white px-4 py-2 font-medium text-gray-900 hover:bg-gray-100 disabled:opacity-50">{saving ? "Saving..." : "Add contact"}</button>
        </form>
        <section className="space-y-3">
          {contacts.map((contact) => (
            <article key={contact.id} className="flex flex-col justify-between gap-3 rounded-lg bg-white p-4 shadow sm:flex-row sm:items-center">
              <div><h2 className="font-semibold text-gray-900">{contact.companyName}</h2><p className="text-sm text-gray-600">{contact.contactName} · {contact.category}</p>{contact.phone && <p className="text-sm text-gray-600">{contact.phone}</p>}</div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => beginEdit(contact)} className="w-fit rounded border border-gray-600 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100">Edit</button>
                <button type="button" onClick={() => archiveContact(contact)} className="w-fit rounded border border-gray-500 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100">Archive</button>
              </div>
            </article>
          ))}
        </section>
      </div>
      {editing && (
        <div className="fixed inset-0 z-10 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <form onSubmit={saveEdit} className="grid w-full max-w-2xl gap-3 rounded-lg bg-white p-6 shadow-xl md:grid-cols-2">
            <h2 className="text-xl font-semibold text-gray-900 md:col-span-2">Edit contact</h2>
            {renderContactFields(editingForm, setEditingForm)}
            <div className="flex justify-end gap-2 md:col-span-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded border border-gray-500 bg-white px-4 py-2 font-medium text-gray-900 hover:bg-gray-100">Cancel</button>
              <button type="submit" disabled={saving} className="rounded border border-gray-500 bg-white px-4 py-2 font-medium text-gray-900 hover:bg-gray-100 disabled:opacity-50">{saving ? "Saving..." : "Save changes"}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
