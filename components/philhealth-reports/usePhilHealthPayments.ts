"use client";

import { useCallback, useState } from "react";
import type { Employer, Payment, PaymentForm, Report } from "@/components/philhealth-reports/types";
import { period } from "@/components/philhealth-reports/format";

const emptyPaymentForm = (report: Report, employer: Employer | null): PaymentForm => ({
  payorName: report.payment?.payorName ?? employer?.name ?? "",
  pen: report.payment?.pen ?? report.employerPhicNumber ?? employer?.phic ?? "",
  spa: report.payment?.spa ?? "",
  applicablePeriod: report.payment?.applicablePeriod ?? period(report),
  amountPaid: report.payment?.amountPaid ?? report.amountDue,
  accreditedCollectingAgent: report.payment?.accreditedCollectingAgent ?? "",
  transactionConfirmationNumber: report.payment?.transactionConfirmationNumber ?? "",
  transactionDate: report.payment?.transactionDate ?? "",
  eparNumber: report.payment?.eparNumber ?? "",
  eparDate: report.payment?.eparDate ?? "",
  adjustments: "",
});

export function usePhilHealthPayments({
  employerId,
  employer,
  setViewReport,
  setPaymentSavedOpen,
  setError,
  requestRefresh,
}: {
  employerId: string;
  employer: Employer | null;
  setViewReport: (r: Report | null | ((prev: Report | null) => Report | null)) => void;
  setPaymentSavedOpen: (o: boolean) => void;
  setError: (e: string) => void;
  requestRefresh: () => void;
}) {
  const [paymentReport, setPaymentReport] = useState<Report | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentForm | null>(null);
  const [saving, setSaving] = useState(false);

  const openPaymentForm = useCallback((report: Report) => {
    setPaymentReport(report);
    setPaymentForm(emptyPaymentForm(report, employer));
  }, [employer]);

  const savePayment = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!paymentReport || !paymentForm) return;
      setSaving(true);
      setError("");
      try {
        const amountPaid = Number(paymentForm.amountPaid || 0) + Number(paymentForm.adjustments || 0);
        const response = await fetch(`/api/reports/philhealth/reports/${paymentReport.id}/payment?employerId=${encodeURIComponent(employerId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...paymentForm, amountPaid: amountPaid.toFixed(2) }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to save payment details");
        setPaymentReport(null);
        setPaymentForm(null);
        setViewReport((current) => (current && current.id === paymentReport.id ? { ...current, payment: data.payment as Payment } : current));
        setPaymentSavedOpen(true);
        requestRefresh();
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Unable to save payment details");
      } finally {
        setSaving(false);
      }
    },
    [paymentReport, paymentForm, employerId, setViewReport, setPaymentSavedOpen, setError, requestRefresh],
  );

  return {
    paymentReport,
    setPaymentReport,
    paymentForm,
    setPaymentForm,
    saving,
    openPaymentForm,
    savePayment,
  };
}
