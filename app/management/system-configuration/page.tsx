"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";

type CategoryType = "BRANCH" | "POSITION" | "EMPLOYMENT_STATUS";
type EmployeeCategory = { id: number; type: CategoryType; name: string; active: boolean };

const categoryGroups: { type: CategoryType; title: string; description: string }[] = [
  { type: "BRANCH", title: "Branches", description: "Work locations available on employee profiles." },
  { type: "POSITION", title: "Positions", description: "Job titles available on employee profiles." },
  { type: "EMPLOYMENT_STATUS", title: "Employment Status", description: "Statuses available on employee profiles." },
];

const fieldClass = "min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

export default function SystemConfigurationPage() {
  const [categories, setCategories] = useState<EmployeeCategory[]>([]);
  const [drafts, setDrafts] = useState<Record<CategoryType, string>>({ BRANCH: "", POSITION: "", EMPLOYMENT_STATUS: "" });
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [busyType, setBusyType] = useState<CategoryType | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");

  const loadCategories = useCallback(async () => {
    const response = await fetch("/api/management/categories");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load categories");
    setCategories(Array.isArray(data.categories) ? data.categories : []);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/me")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to verify access");
        if (data.user?.role !== "ADMIN") {
          if (active) {
            setAuthorized(false);
            setMessage("Administrator access required.");
          }
          return;
        }
        if (active) setAuthorized(true);
        try {
          await loadCategories();
        } catch (error) {
          if (active) setMessage(error instanceof Error ? error.message : "Unable to load categories");
        }
      })
      .catch((error: Error) => {
        if (active) {
          setAuthorized(false);
          setMessage(error.message);
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadCategories]);

  const addCategory = async (event: FormEvent<HTMLFormElement>, type: CategoryType) => {
    event.preventDefault();
    setBusyType(type);
    setMessage("");
    setNotice("");
    try {
      const response = await fetch("/api/management/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name: drafts[type] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to add category");
      await loadCategories();
      setDrafts((current) => ({ ...current, [type]: "" }));
      setNotice(data.restored ? "Category restored." : "Category added.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add category");
    } finally {
      setBusyType(null);
    }
  };

  const setCategoryActive = async (category: EmployeeCategory) => {
    setBusyId(category.id);
    setMessage("");
    setNotice("");
    try {
      const response = await fetch("/api/management/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: category.id, active: !category.active }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update category");
      setCategories((current) => current.map((item) => item.id === category.id ? data.category : item));
      setNotice(category.active ? "Category deactivated. Existing employee records are unchanged." : "Category activated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update category");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen w-full bg-slate-50 p-4 sm:p-6">
      <div className="w-full max-w-6xl">
        {authorized === false && <section className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Access restricted</h2>
          <p role="alert" className="mt-2 text-sm text-red-700">{message || "Administrator access is required to manage employee categories."}</p>
        </section>}
        {authorized === null && <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">Checking administrator access...</p>}
        {authorized === true && <>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Employee categories</h2>
          <p className="mt-1 text-sm text-slate-600">Add and manage the choices used in employee profiles.</p>
        </div>

        {message && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</p>}
        {notice && <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}

        <div className="grid gap-4 lg:grid-cols-3">
          {categoryGroups.map((group) => {
            const groupCategories = categories.filter((item) => item.type === group.type);
            return <section key={group.type} aria-labelledby={`category-heading-${group.type}`} className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 border-b border-slate-100 pb-3">
                <h3 id={`category-heading-${group.type}`} className="text-base font-semibold text-slate-900">{group.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{group.description}</p>
              </div>
              <form onSubmit={(event) => addCategory(event, group.type)} className="mb-4 flex min-w-0 gap-2">
                <label className="sr-only" htmlFor={`new-category-${group.type}`}>New {group.title.toLowerCase()} category</label>
                <input id={`new-category-${group.type}`} required maxLength={100} value={drafts[group.type]} onChange={(event) => setDrafts((current) => ({ ...current, [group.type]: event.target.value }))} placeholder={`Add ${group.title.toLowerCase()}`} className={fieldClass} />
                <button type="submit" disabled={busyType !== null} aria-label={`Add ${group.title.toLowerCase()}`} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#172554] text-white transition hover:bg-blue-900 disabled:opacity-50">
                  <PlusIcon className="h-5 w-5" />
                </button>
              </form>
              {loading ? <p className="py-5 text-center text-sm text-slate-500">Loading...</p> : groupCategories.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">No categories yet.</p> : (
                <ul className="max-h-[min(60vh,32rem)] space-y-2 overflow-y-auto overscroll-contain pr-1">
                  {groupCategories.map((item) => <li key={item.id} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                    <span className={`min-w-0 break-words text-sm ${item.active ? "text-slate-800" : "text-slate-400 line-through"}`}>{item.name}</span>
                    <button type="button" onClick={() => setCategoryActive(item)} disabled={busyId === item.id} className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${item.active ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                      {busyId === item.id ? "Saving..." : item.active ? "Active" : "Inactive"}
                    </button>
                  </li>)}
                </ul>
              )}
            </section>;
          })}
        </div>
        <p className="mt-4 text-xs text-slate-500">Inactive categories are hidden from new selections. Existing employee records are kept as-is.</p>
        </>}
      </div>
    </main>
  );
}
