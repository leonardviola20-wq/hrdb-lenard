# Iteration 1 — Contacts and Employers UI

- [x] Add a dismissible success confirmation in Contacts.
- [x] Persist optional contact images through OfficeContact schema, migration, API validation, and the add/edit form; display images in contact cards and details.
- [x] Redesign Employers view details into a professional, responsive information layout while preserving all employer fields and existing view/edit actions.
- [x] Update TECHNICAL.md and project memory with the implemented behavior.
- [x] Validate focused lint, TypeScript, Prisma schema/client, and whitespace checks.

# Iteration 2 — SSS Loan Start Date

- [x] For Salary and Calamity loans, always calculate Start Date from Loan Date plus two calendar months; for Emergency loans, calculate it from Loan Date plus seven calendar months. Recalculate whenever Loan Date or loan type changes and do not allow manual override.
- [x] Validate month-end date handling and derive the saved display date from loan date/type so the value refreshes with loan records.
- [x] Update TECHNICAL.md and project memory.
- [x] Run targeted tests, lint, TypeScript, and whitespace validation.

# Iteration 3 — Display Serialized Loan Date

- [x] Normalize API-serialized Loan Date values to a strict date-only string before calculating Start Date in the View Loans list; cover ISO timestamp inputs with tests.
- [x] Run focused loan date tests, lint, TypeScript, and whitespace validation.

# Iteration 4 — Current-Month Active Loan Report

- [x] Add a View Loans action that opens the existing SSS Loan Report form for the current calendar month, prefilled with active employees' ACTIVE loan accounts due this month; exclude future/incoming loans.
- [x] Make past-due ACTIVE loans for active employees available as optional selections, without auto-prefilling them; exclude accounts whose Start Date is in the future.
- [x] Enforce the current and overdue eligibility rules in the API and report form, and keep report details available for review before saving.
- [x] Add focused coverage for current-month eligibility and active employee/loan filtering.
- [x] Update TECHNICAL.md and project memory.
- [x] Run focused tests, lint, TypeScript, and whitespace validation.

# Iteration 5 — Read-Only Current-Month Loan Report

- [x] Change the View Loans report action to a read-only report preview and remove all draft/report editing or saving from this action.
- [x] Restrict the preview to ACTIVE loan accounts for active employees due in the current month; exclude overdue and incoming loans at the API boundary.
- [x] Show employer, applicable month, loan details, monthly amounts due, and report total; preserve return to the View Loans list.
- [x] Update TECHNICAL.md and project memory, and validate tests, lint, TypeScript, and whitespace.

# Iteration 6 — Include Ongoing Active Loans in Current-Month Report

- [x] Include all active employee loans with a scheduled payment in the current month, not only loans whose first payment starts this month.
- [x] Keep future-start loans, inactive loan accounts, and inactive employees excluded.
- [x] Add regression coverage for continuing active accounts and update project documentation.
- [x] Run focused tests, lint, TypeScript, and whitespace validation.

# Iteration 7 — Report All Active Loans

- [x] Rename the report action button to `Report`.
- [x] Show all ACTIVE loans for active employees regardless of current-month payment eligibility or future start date.
- [x] Update report summary labels, documentation, and regression tests.
- [x] Run focused tests, lint, TypeScript, and whitespace validation.

# Iteration 8 — Scope Loans and Report Start Month

- [x] Scope the View Loans list and Report preview to the employer selected on the dashboard and remove the Employer filter.
- [x] Rename `+ Add SSS Loan` to `+ Add`.
- [x] Show only ACTIVE loans linked to active employees whose calculated Start Date is in the current month in the read-only Report preview.
- [x] Update TECHNICAL.md and project memory, and validate focused tests, lint, TypeScript, Problems, and whitespace.

# Iteration 9 — Include Earlier Active Loan Start Dates

- [x] Expand the read-only Report eligibility through the current month to include ACTIVE loans with earlier calculated Start Dates; exclude future Start Dates and inactive loans/employees.
- [x] Update report wording, tests, TECHNICAL.md, and project memory.
- [x] Run focused loan tests, lint, TypeScript, Problems, and whitespace validation.

# Iteration 10 — Filter Report Loan Status

- [x] Add All, Active, Upcoming, and Inactive filters to the read-only loan report using the agreed loan status and Start Date rules.
- [x] Return required employee status details, test report category classification, and update TECHNICAL.md and project memory.
- [x] Run focused tests, lint, TypeScript, Problems, and whitespace validation.

# Iteration 11 — Print and Semi-Monthly Deduction

- [x] Add a Print action that prints only the filtered SSS loan report and show the semi-monthly amortization (monthly amortization divided by two) in the report table.
- [x] Place the report filter and Print action in the title header, rename the amount columns to Monthly and Semi-Monthly, default the filter to Active, and update report documentation.
- [x] Run focused tests, lint, TypeScript, Problems, and whitespace validation.

# Iteration 12 — Surface Employer Save Errors

- [x] Show employer create/update errors inside the open form, including API validation and duplicate-registration responses.
- [x] Preserve the form and entered values on failure, clear stale errors on reopen/close, and update related project notes.
- [x] Run focused validation, lint, TypeScript, Problems, and whitespace checks.

# Iteration 13 — Global SSS Loan Entry Picker (Superseded)

- [x] Load eligible SSS loan accounts across all employers in the Add Entry picker while keeping Add All and the report employer scoped as before.
- [x] Add useful employee/account search and show the loan employer and account details in results.
- [x] Update technical documentation and project memory, then run focused validation.

The user clarified that the requested behavior applies to Contribution Reports. The unintended loan-picker change is reverted in Iteration 14.

# Iteration 14 — Global SSS Contribution Employee Entry

- [x] Load every database employee in the contribution Add Entry picker and Add All action, including employees without an employer; leave loan behavior unchanged.
- [x] Filter the contribution picker by employee name and SS Number, preserving actual employee employer snapshots separately from report employer metadata.
- [x] Keep the Add Entry popup fixed in the viewport while typing, with results scrolling inside its stable layout.
- [x] Update project documentation and run focused validation.

# Iteration 15 — Employee SSS Loan Status Filter

- [x] Add an All/Active/Inactive filter to employee-specific SSS Loan history; Inactive groups Paid, On-Hold, and Not connected while preserving loan-type filtering.
- [x] Update project documentation and validate the focused employee profile page.

# Iteration 16 — Compact Contribution Report Table

- [x] Rename the report-table labels to Emp, Status, and Pay Date.
- [x] Remove the forced minimum table width and make table columns wrap/fit on square and narrow screens.
- [x] Update project documentation and validate the SSS report page.

# Iteration 17 — Inactive Loan Filter Tooltip

- [x] Shorten the Inactive status option and explain its included statuses through an accessible tooltip shown with the selected filter.
- [x] Update project documentation and validate the employee SSS history page.

# Iteration 18 — Contribution Payment Employer

- [x] Show the payment report's employer in the per-employee SSS Contribution history Employer column instead of the employee employer snapshot.
- [x] Update documentation and add/adjust regression coverage; validate the focused history feature.
