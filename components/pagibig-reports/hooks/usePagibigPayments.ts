import { useState } from "react";
import type { PaymentForm, Report } from '@/components/pagibig-reports/shared/types';

export function usePagibigPayments(selectedEmployerId: string, setReports: (updater: (current: Report[]) => Report[]) => void) {
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

  const savePayment = async (event: React.FormEvent<HTMLFormElement>) => {
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

  return {
    paymentReport, setPaymentReport,
    paymentForm, setPaymentForm,
    savingPayment, setSavingPayment,
    paymentError, setPaymentError,
    deleteReportTarget, setDeleteReportTarget,
    deletingReport, setDeletingReport,
    openPayment, savePayment,
  };
}