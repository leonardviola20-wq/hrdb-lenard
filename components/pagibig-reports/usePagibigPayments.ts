import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import type { PaymentForm, Report } from "./types";

export function usePagibigPayments({
  selectedEmployerId,
  setReports,
  setSelectedReport,
  setError,
  setNotice,
}: {
  selectedEmployerId: string;
  setReports: Dispatch<SetStateAction<Report[]>>;
  setSelectedReport: Dispatch<SetStateAction<Report | null>>;
  setError: (message: string) => void;
  setNotice: (message: string) => void;
}) {
  const [paymentReport, setPaymentReport] = useState<Report | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({ amountPaid: "", paymentType: "Bank", payDate: "", transactionReference: "", adjustments: "0" });
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [deleteReportTarget, setDeleteReportTarget] = useState<Report | null>(null);
  const [deletingReport, setDeletingReport] = useState(false);

  const openPayment = (report: Report) => {
    setPaymentReport(report);
    setPaymentError("");
    setPaymentForm({
      amountPaid: report.amountPaid ?? report.amountDue,
      paymentType: report.paymentType ?? (report.manual ? "Cash" : "Bank"),
      payDate: report.payDate?.slice(0, 10) ?? "",
      transactionReference: report.transactionReference ?? "",
      adjustments: report.adjustments ? String(report.adjustments) : "0",
    });
  };

  const savePayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!paymentReport) return;
    setSavingPayment(true);
    setPaymentError("");
    try {
      const response = await fetch(`/api/reports/pagibig/${paymentReport.id}?employerId=${encodeURIComponent(selectedEmployerId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...paymentForm, adjustments: paymentForm.adjustments || "0" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save payment details");
      setReports((current) => current.map((report) => report.id === paymentReport.id ? data.report as Report : report));
      setPaymentReport(null);
    } catch (saveError) {
      setPaymentError(saveError instanceof Error ? saveError.message : "Unable to save payment details");
    } finally {
      setSavingPayment(false);
    }
  };

  const deleteReport = async () => {
    if (!deleteReportTarget) return;
    setDeletingReport(true);
    setError("");
    try {
      const response = await fetch(`/api/reports/pagibig/${deleteReportTarget.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          (data as { error?: string } | null)?.error || "Unable to delete Pag-IBIG report",
        );
      }

      const deletedId = deleteReportTarget.id;
      setReports((current) => current.filter((report) => report.id !== deletedId));
      setSelectedReport((current) => (current?.id === deletedId ? null : current));
      setPaymentReport((current) => (current?.id === deletedId ? null : current));
      setDeleteReportTarget(null);
      setNotice("Pag-IBIG report deleted.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Unable to delete Pag-IBIG report",
      );
    } finally {
      setDeletingReport(false);
    }
  };

  return {
    paymentReport, setPaymentReport,
    paymentForm, setPaymentForm,
    savingPayment, setSavingPayment,
    paymentError, setPaymentError,
    deleteReportTarget, setDeleteReportTarget,
    deletingReport, setDeletingReport,
    openPayment, savePayment, deleteReport,
  };
}