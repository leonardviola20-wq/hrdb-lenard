"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { HistoryBackLink } from "@/components/HistoryBackLink";

interface Loan {
  id: number;
  recordId: number;
  employerId: number;
  employerName: string;
  recordYear: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  pagIbigNumber: string | null;
  loanType: string;
  applicationNo: string;
  loanDate: string;
  termYears: number;
  amount: string;
  status: string;
  createdAt: string;
}

const LOAN_TYPES = [
  { value: "CAL", label: "Calamity" },
  { value: "MPL", label: "Multi-Purpose" },
  { value: "EMER", label: "Emergency" },
  { value: "SAFE", label: "SAFE" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "PAID", label: "Paid" },
  { value: "NEW_LOAN", label: "Applied for New Loan" },
  { value: "HOLD", label: "Hold" },
  { value: "CLOSE", label: "Close" },
];

export default function PagIbigLoansPage() {
  const params = useParams();
  const rawId = params?.id;
  const employeeId = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] ?? "" : "";

  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [employee, setEmployee] = useState<{
    firstName: string;
    middleName: string;
    lastName: string;
    pagIbigNumber: string | null;
  } | null>(null);

  const [nameFilter, setNameFilter] = useState("");
  const [loanTypeFilter, setLoanTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [openDialog, setOpenDialog] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [form, setForm] = useState({
    loanType: "CAL",
    applicationNo: "",
    loanDate: new Date().toISOString().slice(0, 10),
    termYears: "1",
    amount: "0",
    status: "ACTIVE",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const loadLoans = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/employees/${encodeURIComponent(employeeId)}/pagibig-loans`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to load loans");
      setLoans(data.loans as Loan[]);
      setEmployee(data.employee ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load loans");
      setLoans([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLoans();
  }, [employeeId, loadLoans]);

  const filteredLoans = loans.filter((l) => {
    const typeOk = loanTypeFilter === "ALL" || l.loanType === loanTypeFilter;
    const statusOk = statusFilter === "ALL" || l.status === statusFilter;
    const nameOk =
      !nameFilter ||
      l.employeeName.toLowerCase().includes(nameFilter.toLowerCase()) ||
      (l.applicationNo || "").toLowerCase().includes(nameFilter.toLowerCase());
    return typeOk && statusOk && nameOk;
  });

  const openAdd = () => {
    setEditingLoan(null);
    setForm({
      loanType: "CAL",
      applicationNo: "",
      loanDate: new Date().toISOString().slice(0, 10),
      termYears: "1",
      amount: "0",
      status: "ACTIVE",
    });
    setSaveError("");
    setOpenDialog(true);
  };

  const openEdit = (loan: Loan) => {
    setEditingLoan(loan);
    setForm({
      loanType: loan.loanType,
      applicationNo: loan.applicationNo,
      loanDate: loan.loanDate,
      termYears: String(loan.termYears),
      amount: loan.amount,
      status: loan.status,
    });
    setSaveError("");
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!editingLoan) {
      setSaveError("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        loanType: form.loanType,
        applicationNo: form.applicationNo.trim(),
        loanDate: form.loanDate,
        termYears: Number(form.termYears),
        amount: Number(form.amount),
        status: form.status,
      };
      const method = editingLoan ? "PATCH" : "POST";
      const url = editingLoan
        ? `/api/employees/${encodeURIComponent(employeeId)}/pagibig-loans/${editingLoan.id}`
        : `/api/employees/${encodeURIComponent(employeeId)}/pagibig-loans`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Unable to save loan");
      setOpenDialog(false);
      setEditingLoan(null);
      await loadLoans();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Unable to save loan");
    } finally {
      setSaving(false);
    }
  };

  const formatMoney = (v: string | number | null | undefined) =>
    `\\u20B1${(Number(v) || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-[24rem] w-full flex-col gap-3 overflow-hidden bg-gray-50 p-4 sm:p-6 md:h-[calc(100dvh-7.75rem)]">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex items-center gap-3">
          <HistoryBackLink fallbackHref={`/employees/${employeeId}?tab=Government`} aria-label="Back to employee profile" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
          </HistoryBackLink>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pag-IBIG Loans</h1>
            {employee && (
              <p className="text-sm text-gray-600">
                {employee.firstName} {employee.middleName && employee.middleName + " "} {employee.lastName}
                {employee.pagIbigNumber ? ` · MID ${employee.pagIbigNumber}` : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={openAdd}
            disabled={loading}
            className="no-print inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
            Add
          </button>
        </div>
        <div className="no-print flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            Name / App. No.
            <input value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} placeholder="Search employee or application no." className="h-10 w-80 rounded-lg border border-gray-300 bg-white px-3 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            Loan Type
            <select value={loanTypeFilter} onChange={(e) => setLoanTypeFilter(e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm">
              <option value="ALL">All types</option>
              {LOAN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            Status
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm">
              <option value="ALL">All statuses</option>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
        </div>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-1 text-sm text-rose-700">{error}</p>}
        {loading && <p className="text-sm text-gray-600">Loading...</p>}
        {!loading && loans.length === 0 && (
          <p className="text-sm text-gray-600">No Pag-IBIG loans found for this employee.</p>
        )}
        {filteredLoans.length > 0 && (
          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-100 text-left font-bold text-gray-800">
                <tr>
                  <th className="px-3 py-1">Employee</th>
                  <th className="px-3 py-1">Loan Type</th>
                  <th className="px-3 py-1">Application No.</th>
                  <th className="px-3 py-1">Loan Date</th>
                  <th className="px-3 py-1">Term (Yrs)</th>
                  <th className="px-3 py-1 text-right">Amount</th>
                  <th className="px-3 py-1">Status</th>
                  <th className="px-3 py-1 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-3 py-1 font-semibold text-gray-900">{loan.employeeName}</td>
                    <td className="px-3 py-1 text-gray-700">{loan.loanType}</td>
                    <td className="px-3 py-1 text-gray-700">{loan.applicationNo || "-"}</td>
                    <td className="px-3 py-1 text-gray-700">{loan.loanDate}</td>
                    <td className="px-3 py-1 text-gray-700">{loan.termYears}</td>
                    <td className="px-3 py-1 text-right tabular-nums text-gray-900">{formatMoney(loan.amount)}</td>
                    <td className="px-3 py-1">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${loan.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : loan.status === "PAID" ? "bg-sky-100 text-sky-800" : loan.status === "INACTIVE" ? "bg-gray-100 text-gray-700" : "bg-amber-100 text-amber-800"}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-3 py-1 text-center">
                      <button onClick={() => openEdit(loan)} className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-300 bg-white px-2 text-xs font-semibold text-gray-700 hover:bg-gray-100">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {openDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editingLoan ? "Edit Loan" : "Add Loan"}</h2>
              <button onClick={() => setOpenDialog(false)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Loan Type</label>
                <select value={form.loanType} onChange={(e) => setForm({ ...form, loanType: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm">
                  {LOAN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Application Number *</label>
                <input value={form.applicationNo} onChange={(e) => setForm({ ...form, applicationNo: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" placeholder="Loan reference number" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Loan Date *</label>
                  <input type="date" value={form.loanDate} onChange={(e) => setForm({ ...form, loanDate: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Term (Yrs) *</label>
                  <select value={form.termYears} onChange={(e) => setForm({ ...form, termYears: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm">
                    {[1, 2, 3].map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Amount *</label>
                <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm">
                  {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              {saveError && <p className="text-sm text-rose-700">{saveError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setOpenDialog(false)} className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handleSubmit} disabled={saving} className="h-10 rounded-lg bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50">
                  {saving ? "Saving..." : editingLoan ? "Save Changes" : "Add Loan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
