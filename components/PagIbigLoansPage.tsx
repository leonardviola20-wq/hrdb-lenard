"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HistoryBackLink } from "@/components/HistoryBackLink";

interface Loan {
  id: number;
  recordId: number;
  employerId: number;
  employerName: string;
  year: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  pagIbigNumber: string | null;
  loanType: string;
  applicationNo: string;
  loanTermDate: string;
  termYears: number;
  termEndDate: string;
  amount: string;
  status: string;
  certifyingEmployer: string | null;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 2024 + 1 }, (_, i) => currentYear - i);

export default function PagIbigLoansPage() {
  const searchParams = useSearchParams();
  const employerId = searchParams.get("employerId") ?? "";
  const [year, setYear] = useState(String(currentYear));
  const [nameFilter, setNameFilter] = useState("");
  const [loanTypeFilter, setLoanTypeFilter] = useState("ALL");
  const [employerFilter, setEmployerFilter] = useState("ALL");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [editAppNo, setEditAppNo] = useState("");
  const [editTermDate, setEditTermDate] = useState("");
  const [editTermYears, setEditTermYears] = useState("1");
  const [editAmount, setEditAmount] = useState("0");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editCertifyingEmployer, setEditCertifyingEmployer] = useState("");
  const [certifyingEmployerMode, setCertifyingEmployerMode] = useState<string>("employer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [page, setPage] = useState(1);

  const loadLoans = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/reports/pagibig/loans?employerId=${encodeURIComponent(employerId)}&year=${encodeURIComponent(year)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to load loans");
      setLoans(data.loans as Loan[]);
      if (data.employer) {
        setEmployerName(data.employer.name ?? "");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load loans");
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLoans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employerId, year]);
  const formatMoney = (v: string | number | null | undefined) =>
    `\u20B1${(Number(v) || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const filteredLoans = loans.filter((l) =>
    (employerFilter === "ALL" || String(l.employerId) === employerFilter) &&
    (loanTypeFilter === "ALL" || l.loanType === loanTypeFilter) &&
    (!nameFilter ||
      l.employeeName.toLowerCase().includes(nameFilter.toLowerCase()) ||
      l.employeeCode.toLowerCase().includes(nameFilter.toLowerCase()) ||
      (l.pagIbigNumber || "").toLowerCase().includes(nameFilter.toLowerCase())),
  );

  const employerOptions = Array.from(new Map(loans.map((l) => [l.employerId, l.employerName])).entries());

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredLoans.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedLoans = filteredLoans.slice((safePage - 1) * pageSize, safePage * pageSize);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1); }, [year, employerFilter, loanTypeFilter, nameFilter]);

  return (
    <div className="pagibig-loans-print-root flex h-[calc(100dvh-7.5rem)] min-h-[24rem] w-full flex-col gap-3 overflow-hidden bg-gray-50 p-4 sm:p-6 md:h-[calc(100dvh-7.75rem)]">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex items-center gap-3">
          <HistoryBackLink fallbackHref="/reports/pagibig" aria-label="Back" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
          </HistoryBackLink>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pag-IBIG Employee Loans</h1>
          </div>
          <button onClick={() => window.print()} className="no-print ml-auto h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50">Print</button>
        </div>

        <div className="no-print flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            Name
            <input value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} placeholder="Search employee" className="h-10 w-64 rounded-lg border border-gray-300 bg-white px-3 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            Employer
            <select value={employerFilter} onChange={(e) => setEmployerFilter(e.target.value)} className="h-10 w-48 rounded-lg border border-gray-300 bg-white px-3 text-sm">
              <option value="ALL">All employers</option>
              {employerOptions.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            Year
            <select value={year} onChange={(e) => setYear(e.target.value)} className="h-10 w-28 rounded-lg border border-gray-300 bg-white px-3 text-sm">
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
            Loan Type
            <select value={loanTypeFilter} onChange={(e) => setLoanTypeFilter(e.target.value)} className="h-10 w-40 rounded-lg border border-gray-300 bg-white px-3 text-sm">
              <option value="ALL">All types</option>
              <option value="CAL">Calamity</option>
              <option value="MPL">Multi-Purpose</option>
              <option value="EMER">Emergency</option>
              <option value="SAFE">SAFE</option>
            </select>
          </label>
          <button type="button" onClick={() => { setNameFilter(""); setEmployerFilter("ALL"); setLoanTypeFilter("ALL"); setYear(String(currentYear)); void loadLoans(); }} className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50">Reset</button>
          </div>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-1 text-sm text-rose-700">{error}</p>}

        {loading && <p className="text-sm text-gray-600">Loading...</p>}

        {!loading && employerId && filteredLoans.length === 0 && (
          <p className="text-sm text-gray-600">No Pag-IBIG loans found for this employer/year.</p>
        )}

        {filteredLoans.length > 0 && (<>
          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-100 text-left font-bold text-gray-800">
                <tr>
                  <th className="px-3 py-1">Employee</th>
                  <th className="px-3 py-1">Loan Type</th>
                  <th className="px-3 py-1">Account No.</th>
                  <th className="px-3 py-1">Start Term</th>
                  <th className="px-3 py-1">End Term</th>
                  <th className="px-3 py-1 text-right">Amount</th>
                  <th className="px-3 py-1">Certified by</th>
                  <th className="px-3 py-1 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-3 py-1 font-semibold text-gray-900">{loan.employeeName}<div className="text-xs text-gray-500">{loan.pagIbigNumber || "-"}</div></td>
                    <td className="px-3 py-1 text-gray-700">{loan.loanType}</td>
                    <td className="px-3 py-1 text-gray-700">{loan.applicationNo || "-"}</td>
                    <td className="px-3 py-1 text-gray-700">{loan.loanTermDate}</td>
                    <td className="px-3 py-1 text-gray-700">{loan.termEndDate}</td>
                    <td className="px-3 py-1 text-right tabular-nums text-gray-900">{formatMoney(loan.amount)}</td>
                    <td className="px-3 py-1 text-gray-700">{loan.certifyingEmployer || "-"}</td>
                    <td className="px-3 py-1 text-center">
                      <button onClick={() => { setEditingLoan(loan); setEditAppNo(loan.applicationNo); setEditTermDate(loan.loanTermDate); setEditTermYears(String(loan.termYears)); setEditAmount(loan.amount); setEditCertifyingEmployer(loan.certifyingEmployer ?? ""); setCertifyingEmployerMode(loan.certifyingEmployer && loan.certifyingEmployer !== employerName ? (["Mizan Food OPC","Basirat OPC","Imarak OPC"].includes(loan.certifyingEmployer) ? loan.certifyingEmployer : "other") : "employer"); setEditError(""); setEditOpen(true); }} className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-300 bg-white px-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600">
              <span>Showing {(safePage - 1) * pageSize + 1}-{Math.min(safePage * pageSize, filteredLoans.length)} of {filteredLoans.length}</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="h-8 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40">Prev</button>
                <span className="text-xs font-semibold text-gray-700">Page {safePage} of {totalPages}</span>
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="h-8 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40">Next</button>
              </div>
            </div>
        </>)}
      </div>

      {editOpen && editingLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl space-y-3">
            <h2 className="text-lg font-bold text-gray-900">Edit Pag-IBIG Loan</h2>
            <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
              Application No.
              <input value={editAppNo} onChange={(e) => setEditAppNo(e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
              Loan Term Date
              <input type="date" value={editTermDate} onChange={(e) => setEditTermDate(e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
              Term (years)
              <input type="number" min="1" value={editTermYears} onChange={(e) => setEditTermYears(e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
              Certifying Employer
              <select value={certifyingEmployerMode} onChange={(e) => { const m = e.target.value; setCertifyingEmployerMode(m); if (m === "employer") setEditCertifyingEmployer(employerName); else if (m === "other") setEditCertifyingEmployer(""); else setEditCertifyingEmployer(m); }} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm">
                <option value="employer">{employerName || "Active employer"}</option>
                <option value="Mizan Food OPC">Mizan Food OPC</option>
                <option value="Basirat OPC">Basirat OPC</option>
                <option value="Imarak OPC">Imarak OPC</option>
                <option value="other">Others</option>
              </select>
            </label>
            {certifyingEmployerMode === "other" && (
              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                Certifying Employer (Others)
                <input value={editCertifyingEmployer} onChange={(e) => setEditCertifyingEmployer(e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm" />
              </label>
            )}
            <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
              Amount
              <input type="number" min="0" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm" />
            </label>
            {editError && <p className="text-sm text-rose-700">{editError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditOpen(false)} className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="button" disabled={editSaving} onClick={() => {
                if (!editAppNo.trim() || !editTermDate || !editAmount) { setEditError("Please fill in all required fields."); return; }
                setEditSaving(true);
                setEditError("");
                (async () => {
                  try {
                    const patchUrl = employerId ? `/api/reports/pagibig/loans/${editingLoan.id}?employerId=${encodeURIComponent(employerId)}` : `/api/reports/pagibig/loans/${editingLoan.id}`;
                    const res = await fetch(patchUrl, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ applicationNo: editAppNo.trim(), loanTermDate: editTermDate, termYears: Number(editTermYears), amount: editAmount, certifyingEmployer: certifyingEmployerMode === "employer" ? employerName : editCertifyingEmployer }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(data.error || "Unable to update loan");
                    setEditOpen(false);
                    setEditingLoan(null);
                    await loadLoans();
                  } catch (e) {
                    setEditError(e instanceof Error ? e.message : "Unable to update loan");
                  } finally {
                    setEditSaving(false);
                  }
                })();
              }} className="h-10 rounded-lg bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50">
                {editSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>)}

    </div>
  );
}
