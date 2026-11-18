"use client";

import { PaymentDialog } from "../dialogs/ReportDialogs";
import type { Dispatch, SetStateAction } from "react";
import type { PaymentFormState, Report } from "../shared/types";

/** Component: add/edit payment details for a saved report. */
export function PaymentDialogWrapper(props: {
  report: Report;
  paymentForm: PaymentFormState;
  setPaymentForm: Dispatch<SetStateAction<PaymentFormState>>;
  saving: boolean;
  error: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  return (
    <PaymentDialog
      report={props.report}
      paymentForm={props.paymentForm}
      setPaymentForm={props.setPaymentForm}
      saving={props.saving}
      error={props.error}
      onSubmit={props.onSubmit}
      onClose={props.onClose}
    />
  );
}
