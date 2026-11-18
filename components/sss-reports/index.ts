// Shared primitives
export { inputClass, labelClass, formatMoney } from "@/components/sss-reports/shared/constants";
export { dateOnly, monthNames, formatMoney as formatMoneyFmt } from "@/components/sss-reports/shared/format";
export type {
  PaymentKind, DraftSaveStatus, Employee, Employer, SssLoan, ActiveLoanReport,
  DraftEntry, SssReportDraft, SavedEntry, Report, LoanFormState, LoanEditStatusState,
  PaymentFormState, DraftFormState,
} from "@/components/sss-reports/shared/types";
export { Modal } from "@/components/sss-reports/shared/Modal";
export { AmountDueInput, AmountPaidInput, Field, Info, MoneyInput, LoanDetail } from "@/components/sss-reports/shared/SmallComponents";
export { CompensationRangePicker } from "@/components/sss-reports/shared/CompensationRangePicker";
export { EmployeeEntryPicker } from "@/components/sss-reports/shared/EmployeeEntryPicker";
export { useDismissableMenu } from "@/components/sss-reports/shared/useDismissableMenu";

// Tables
export { DraftsMenu, EntriesTable, ReportPreview, ReportSavedView, ReportMetaLine, DeleteConfirmDialog } from "@/components/sss-reports/tables/ReportsTables";
export { AnnualReportsTable } from "@/components/sss-reports/tables/AnnualReportsTable";

// Dialogs
export { ReportDeleteDialog, PaymentDialog, ContributionTableDialog } from "@/components/sss-reports/dialogs/ReportDialogs";
export { LoanReportDialog, LoanListDialog, LoanFormModal, LoanDeleteDialog } from "@/components/sss-reports/dialogs/LoanDialogs";
export { CreateReportModal } from "@/components/sss-reports/dialogs/CreateReportModal";
export { CreateReportDialogFooter } from "@/components/sss-reports/dialogs/CreateReportDialogFooter";
export { ReportFields } from "@/components/sss-reports/dialogs/ReportFields";
export { EmployeeEntriesSection } from "@/components/sss-reports/dialogs/EmployeeEntriesSection";
export { ViewReportModal } from "@/components/sss-reports/dialogs/ViewReportModal";

// Page-level pieces
export { ReportsPanelHeading } from "@/components/sss-reports/page/ReportsPanelHeading";
export { ReportsToolbar } from "@/components/sss-reports/page/ReportsToolbar";

// Hooks
export { useSssReportData, useSssDraftPersistence } from "@/components/sss-reports/hooks/useSssReportData";
export { useSssLoanManagement } from "@/components/sss-reports/hooks/useSssLoanManagement";
export { useSssReportForm } from "@/components/sss-reports/hooks/useSssReportForm";
export { useReportDebouncedAutoSave } from "@/components/sss-reports/hooks/useReportDebouncedAutoSave";
export { usePopoverMenu } from "@/components/sss-reports/hooks/usePopoverMenu";

// Routines
export { filterLoanRecords, filterActiveLoanReportLoans } from "@/components/sss-reports/routines/loanFilters";
export { handleLoanMenuAction } from "@/components/sss-reports/routines/loanMenuAction";
export { deleteReport, resumeReportDraft, deleteReportDraft, saveReportRequest, savePaymentRequest } from "@/components/sss-reports/routines/reportCrud";
export { draftHasContent, validateDraftFields } from "@/components/sss-reports/routines/draftGuard";
