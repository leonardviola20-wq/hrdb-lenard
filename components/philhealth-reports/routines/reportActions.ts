import type { Payment, PaymentForm, Report } from "../shared/types";

export type PhilHealthMessageSetters = { setError: (message: string) => void; setNotice: (message: string) => void };

/** Routine: PUT payment details for a PhilHealth report. Returns the saved payment or null. */
export async function savePaymentRequest(
  report: Report,
  paymentForm: PaymentForm,
  employerId: string,
  deps: PhilHealthMessageSetters,
): Promise<Payment | null> {
  const amountPaid = Number(paymentForm.amountPaid || 0) + Number(paymentForm.adjustments || 0);
  try {
    const response = await fetch(`/api/reports/philhealth/reports/${report.id}/payment?employerId=${encodeURIComponent(employerId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...paymentForm, amountPaid: amountPaid.toFixed(2) }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to save payment details");
    return data.payment as Payment;
  } catch (saveError) {
    deps.setError(saveError instanceof Error ? saveError.message : "Unable to save payment details");
    return null;
  }
}

/** Routine: DELETE a PhilHealth report. Returns true on success. */
export async function deleteReportRequest(
  report: Report,
  employerId: string,
  deps: PhilHealthMessageSetters,
): Promise<boolean> {
  try {
    const response = await fetch(`/api/reports/philhealth/reports/${report.id}?employerId=${encodeURIComponent(employerId)}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Unable to delete PhilHealth report");
    }
    return true;
  } catch (deleteError) {
    deps.setError(deleteError instanceof Error ? deleteError.message : "Unable to delete PhilHealth report");
    return false;
  }
}

/** Routine: create the monthly contribution report entries from active employees and default PS/ES shares. */
export function buildReportEntries(
  activeEmployees: Array<{ id: number }>,
  defaultPs: string,
  defaultEs: string,
): Array<{ employeeId: number; amount: string }> {
  return activeEmployees
    .map((employee) => {
      const total = Number(defaultPs) + Number(defaultEs);
      return { employeeId: employee.id, amount: total > 0 ? total.toFixed(2) : "" };
    })
    .filter((entry) => entry.amount.trim() !== "");
}

/** Routine: update the payment of a report in an in-memory list. */
export const setReportPayment = (reports: Report[], reportId: number, payment: Payment): Report[] =>
  reports.map((report) => (report.id === reportId ? { ...report, payment } : report));
