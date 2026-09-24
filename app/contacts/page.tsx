"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/contacts")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to load contacts");
        setContacts(data.contacts);
      })
      .catch((error: Error) => setMessage(error.message));
  }, []);

  const categories = Array.from(new Set(contacts.map((contact) => contact.category))).sort();
  const filteredContacts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return contacts.filter((contact) => {
      const matchesCategory = category === "ALL" || contact.category === category;
      const matchesSearch =
        !search ||
        contact.companyName.toLowerCase().includes(search) ||
        contact.contactName.toLowerCase().includes(search) ||
        contact.services?.toLowerCase().includes(search);
      return matchesCategory && matchesSearch;
    });
  }, [category, contacts, query]);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">Back to dashboard</Link>
        <div className="mb-6 mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Office contacts</h1>
            <p className="mt-2 text-gray-600">Suppliers, contractors, and office service providers.</p>
          </div>
          <Link href="/admin/contacts" className="rounded border border-gray-500 bg-white px-4 py-2 font-medium text-gray-900 hover:bg-gray-100">Manage contacts</Link>
        </div>
        {message && <p className="mb-4 text-red-600">{message}</p>}
        <section className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company, contact, or service..." className="w-full rounded border border-gray-400 bg-white p-2 text-gray-900 placeholder:text-gray-500" />
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded border border-gray-400 bg-white p-2 text-gray-900">
            <option value="ALL">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </section>
        {filteredContacts.length === 0 ? <p className="rounded-lg bg-white p-6 text-gray-600 shadow">No office contacts found.</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredContacts.map((contact) => (
              <article key={contact.id} className="rounded-lg bg-white p-5 shadow">
                <div className="flex items-start justify-between gap-3">
                  <div><h2 className="text-lg font-semibold text-gray-900">{contact.companyName}</h2><p className="text-gray-700">{contact.contactName}</p></div>
                  <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">{contact.category}</span>
                </div>
                {contact.services && <p className="mt-3 text-sm text-gray-600">{contact.services}</p>}
                <div className="mt-4 space-y-2 text-sm">
                  {contact.phone && <a href={`tel:${contact.phone}`} className="block font-medium text-blue-700 underline">Call {contact.phone}</a>}
                  {contact.email && <a href={`mailto:${contact.email}`} className="block font-medium text-blue-700 underline break-all">Email {contact.email}</a>}
                  {contact.address && <p className="text-gray-600">{contact.address}</p>}
                  {contact.branch && <p className="text-gray-600">Branch: {contact.branch}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
