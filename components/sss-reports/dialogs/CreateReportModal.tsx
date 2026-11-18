"use client";

import { Modal } from "../shared/Modal";
import type { ReactNode } from "react";
import type { PaymentKind, Report } from "../shared/types";

/** Component: the create/edit SSS report modal shell with title and review subtitle. */
export function CreateReportModal(props: {
  kind: PaymentKind;
  editReport: Report | null;
  preview: boolean;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  const title = props.preview ? "Review SSS Report" : props.editReport ? "Edit SSS Report" : `Generate ${props.kind === "CONTRIBUTION" ? "Contribution" : "Loan"} Report`;
  const subtitle = props.preview
    ? "Check the totals and employer details before saving."
    : props.editReport ? "Correct the report information and employee breakdown." : "Build the report first. Payment details are recorded after payment.";
  return (
    <Modal title={title} subtitle={subtitle} onClose={props.onClose} wide fullHeight footer={props.footer}>
      {props.children}
    </Modal>
  );
}
