"use client";

import {
  AccountFormDialog,
  DeleteReportDialog,
  ManualReportsDialog,
  PaymentDialog,
  ReportDetails,
  ReportGenerationDialog,
} from "../index";
import { monthNames } from '@/components/pagibig-reports/shared/constants';
import type { usePagibigAccountActions } from '@/components/pagibig-reports/hooks/usePagibigAccountActions';
import type { usePagibigAccountForm } from '@/components/pagibig-reports/hooks/usePagibigAccountForm';
import type { usePagibigReportActions } from '@/components/pagibig-reports/hooks/usePagibigReportActions';
import type { usePagibigReportForm } from '@/components/pagibig-reports/hooks/usePagibigReportForm';
import type { usePagibigReportView } from '@/components/pagibig-reports/hooks/usePagibigReportView';
import type { usePagibigPayments } from '@/components/pagibig-reports/hooks/usePagibigPayments';
import type { Member, Report, ReportDraft, ReportEmployer } from '@/components/pagibig-reports/shared/types';

type AccountActions = ReturnType<typeof usePagibigAccountActions>;
type AccountFormControls = ReturnType<typeof usePagibigAccountForm>;
type ReportActions = ReturnType<typeof usePagibigReportActions>;
type ReportFormControls = ReturnType<typeof usePagibigReportForm>;
type PaymentsControls = ReturnType<typeof usePagibigPayments>;
type ViewControls = ReturnType<typeof usePagibigReportView>;

/**
 * Every modal used by the Pag-IBIG reports page, grouped in one place so the
 * page component stays focused on state and workflow wiring.
 */
export function ReportsDialogs(props: {
  // Account form dialog
  account: AccountFormControls;
  accountActions: AccountActions;
  accountFormOpen: boolean;
  accountError: string;
  savingAccount: boolean;
  allEmployees: Member[];
  allEmployeesError: string;
  allEmployeesLoading: boolean;
  createEmployeeHref: string | null;
  onSaveAccount: (event: React.FormEvent<HTMLFormElement>) => void;
  // Report generation dialog
  form: ReportFormControls;
  reportActions: ReportActions;
  employer: ReportEmployer | null;
  selectedEmployerId: string;
  reports: Report[];
  reportDrafts: ReportDraft[];
  reportEmployeeOptions: Member[];
  currentDraftId: number | null;
  savingDraft: boolean;
  closeReportForm: () => void;
  onToggleEmployeePicker: () => void;
  // Details / manual reports / delete
  view: ViewControls;
  canEditPayments: boolean;
  selectedReport: Report | null;
  onCloseReportDetails: () => void;
  onPayFromDetails: (report: Report) => void;
  selectedManualReports: Report[] | null;
  onCloseManualReports: () => void;
  onViewManualReport: (report: Report) => void;
  onPayFromManualReports: (report: Report) => void;
  deleteReportTarget: Report | null;
  deletingReport: boolean;
  onDeleteReport: () => void;
  onDeleteReportCancel: () => void;
  // Payment dialog
  payments: PaymentsControls;
  onClosePayment: () => void;
}) {
  const {
    account, accountActions, accountFormOpen, accountError, savingAccount,
    allEmployees, allEmployeesError, allEmployeesLoading, createEmployeeHref, onSaveAccount,
    form: reportForm, reportActions, employer, selectedEmployerId, reports, reportDrafts,
    reportEmployeeOptions, currentDraftId, savingDraft, closeReportForm, onToggleEmployeePicker,
    view, canEditPayments, selectedReport, onCloseReportDetails, onPayFromDetails,
    selectedManualReports, onCloseManualReports, onViewManualReport, onPayFromManualReports,
    deleteReportTarget, deletingReport, onDeleteReport, onDeleteReportCancel,
    payments, onClosePayment,
  } = props;

  const { openLoanEditor, saveLoanDetail, deleteLoanDetail, onSelectEmployeeForAccount, closeAccountForm, openEditAccount } = accountActions;
  const { editingMember } = account.state;
  const { state, setReportFormOpen } = reportForm;
  const { reportFormOpen } = state;
  const {
    manualReport, reportKind, reportPin, reportMonth, reportYear, updatingReportId, reportEmployeePickerOpen, reportEmployeeId,
    previewLoading, previewError, previewYear, previewFilter, generating,
  } = state;
  const {
    generateReport, addReportEmployee, addAllReportEmployees, saveReportDraft, removeReportEmployee,
    resetReportYearPreview,
  } = reportActions;
  const { paymentReport, paymentForm, setPaymentForm, savingPayment, paymentError, savePayment, openPayment } = payments;

  return (
    <>
      <AccountFormDialog
        open={accountFormOpen}
        editingMember={editingMember}
        accountForm={account.state.accountForm}
        setAccountForm={account.setAccountForm}
        allEmployees={allEmployees}
        allEmployeesError={allEmployeesError}
        allEmployeesLoading={allEmployeesLoading}
        accountError={accountError}
        savingAccount={savingAccount}
        createEmployeeHref={createEmployeeHref}
        loanEditorType={account.state.loanEditorType}
        setLoanEditorType={account.setLoanEditorType}
        loanEditorDetail={account.state.loanEditorDetail}
        setLoanEditorDetail={account.setLoanEditorDetail}
        loanEditorReason={account.state.loanEditorReason}
        setLoanEditorReason={account.setLoanEditorReason}
        loanEditorSourceType={account.state.loanEditorSourceType}
        setLoanEditorSourceType={account.setLoanEditorSourceType}
        loanEditorBackup={account.state.loanEditorBackup}
        setLoanEditorBackup={account.setLoanEditorBackup}
        loanStatusFilter={account.state.loanStatusFilter}
        setLoanStatusFilter={account.setLoanStatusFilter}
        onClose={closeAccountForm}
        onSubmit={onSaveAccount}
        onSelectEmployee={(employeeId) => onSelectEmployeeForAccount(employeeId, allEmployees)}
        onOpenLoanEditor={openLoanEditor}
        onSaveLoanDetail={saveLoanDetail}
        onDeleteLoanDetail={deleteLoanDetail}
      />

      <ReportGenerationDialog
        open={reportFormOpen}
        form={{
          manual: manualReport,
          kind: reportKind,
          pin: reportPin,
          month: reportMonth,
          year: reportYear,
          draftId: currentDraftId,
          updatingReportId,
          pickerOpen: reportEmployeePickerOpen,
          employeeId: reportEmployeeId,
        }}
        employer={employer}
        selectedEmployerId={selectedEmployerId}
        reports={reports}
        reportDrafts={reportDrafts}
        monthNames={monthNames}
        employees={{ loading: allEmployeesLoading, error: allEmployeesError, options: reportEmployeeOptions }}
        preview={{
          loading: previewLoading,
          error: previewError,
          year: previewYear,
          filter: previewFilter,
          filteredMembers: view.filteredPreviewMembers,
          entryCount: view.previewEntries.length,
          showSavingsColumns: view.showSavingsColumns,
          showLoanColumns: view.showLoanColumns,
          columnCount: view.previewColumnCount,
          total: view.previewTotal,
          overall: view.previewOverall,
        }}
        savingDraft={savingDraft}
        generating={generating}
        onClose={closeReportForm}
        onCancel={() => setReportFormOpen(false)}
        onSubmit={generateReport}
        onSetKind={reportForm.setReportKind}
        onSetPin={reportForm.setReportPin}
        onSetMonth={reportForm.setReportMonth}
        onSetEmployeePickerOpen={reportForm.setReportEmployeePickerOpen}
        onSetEmployeeId={reportForm.setReportEmployeeId}
        onYearChange={(year) => { reportForm.setReportYear(year); resetReportYearPreview(); }}
        onAddAllEmployees={() => void addAllReportEmployees()}
        onToggleEmployeePicker={onToggleEmployeePicker}
        onAddEmployee={(employeeId) => void addReportEmployee(employeeId)}
        onSaveDraft={() => void saveReportDraft()}
        onGenerateReport={() => void generateReport()}
        onEditAccount={(member, fromPreview) => openEditAccount(member, fromPreview)}
        onRemoveEmployee={removeReportEmployee}
      />

      {selectedReport && <ReportDetails report={selectedReport} onClose={onCloseReportDetails} onPayment={onPayFromDetails} employerAddress={employer?.address ?? null} />}

      {selectedManualReports && (
        <ManualReportsDialog
          reports={selectedManualReports}
          canEditPayments={canEditPayments}
          onClose={onCloseManualReports}
          onViewDetails={onViewManualReport}
          onOpenPayment={onPayFromManualReports}
        />
      )}

      {deleteReportTarget && <DeleteReportDialog report={deleteReportTarget} deleting={deletingReport} onCancel={onDeleteReportCancel} onDelete={onDeleteReport} />}

      <PaymentDialog
        report={paymentReport}
        reports={reports}
        paymentForm={paymentForm}
        setPaymentForm={setPaymentForm}
        savingPayment={savingPayment}
        paymentError={paymentError}
        onClose={onClosePayment}
        onSave={savePayment}
        openPayment={openPayment}
      />
    </>
  );
}
