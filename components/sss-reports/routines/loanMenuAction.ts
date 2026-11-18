import type { SssLoan } from "../shared/types";

export type LoanMenuTarget = { setLoanViewTarget: (loan: SssLoan | null) => void; openLoanEdit: (loan: SssLoan) => void; setLoanDeleteTarget: (loan: SssLoan | null) => void };

/** Routine: route a loan row-menu action to the right handler and close the menu. */
export function handleLoanMenuAction(
  loan: SssLoan,
  action: "menu" | "view" | "update" | "delete",
  openMenuId: number | null,
  setOpenMenuId: (value: number | null) => void,
  loans: LoanMenuTarget,
) {
  if (action === "menu") {
    setOpenMenuId(openMenuId === loan.id ? null : loan.id);
    return;
  }
  setOpenMenuId(null);
  if (action === "view") loans.setLoanViewTarget(loan);
  else if (action === "update") loans.openLoanEdit(loan);
  else loans.setLoanDeleteTarget(loan);
}
