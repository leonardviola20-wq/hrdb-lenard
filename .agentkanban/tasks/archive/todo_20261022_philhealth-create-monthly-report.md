# Iteration 1

- [x] Add PhilHealth minimum monthly premium reference table by year and PS/ES share helpers to lib/philHealthReportTotals.ts
- [x] Add unit tests for year-based minimum contribution and PS/ES/Total calculation
- [x] Update Create Monthly Report dialog header: replace subtitle with Employer Name · PHIC Number
- [x] Resize Month selector to compact auto-sizing width; extend Year selector minimum to 2019
- [x] Restructure report employee table: Employee (Name + PHIC Number stacked), PS, ES, Total columns
- [x] Auto-assign PS and ES from selected year's minimum monthly premium ÷ 2 on year change
- [x] Update report creation to send Total (PS + ES) per employee as the entry amount
- [x] Update PhilHealth reports API year validation to allow 2019+
- [x] Run validation: ESLint, TypeScript, tests, git diff --check
- [x] Fix ESLint issues (unused import, setState in effect)
- [x] Verify logic: `?? defaultPs`/`?? defaultEs` for auto-fill, `money(reportAmountDue)` format update
- [x] Confirm final files: tests (5/5 pass), tsc clean, eslint clean
- [x] UI verification: header shows Insurance · PHIC / Employee Name · PHIC, compact month/year selectors, stacked Employee + PHIC column, PS / ES / Total columns, year change auto-fills PS/ES


# Iteration 2

- [x] Normalize minimum PhilHealth peso contributions to stored cent values in lib/philHealthReportTotals.ts (275 -> 27500, etc.)
- [x] Update lib/philHealthReportTotals.test.ts assertions to cents and add regression test
- [x] Add canEditPayments to PhilHealth reports GET response
- [x] Create app/api/reports/philhealth/reports/[id]/route.ts with validated, authorized, transactional PUT (admin edit) and DELETE (admin-only)
- [x] Secure payment PUT route: non-admins cannot edit already-recorded payment details
- [x] Add admin-only Delete button and confirmation dialog to PhilHealthReportsPage.tsx
- [x] Store and reset canEditPayments in UI state
- [x] Run tests (88 pass), TypeScript (clean), ESLint (clean), git diff --check (clean)


# Iteration 3

- [x] Add `viewReport` state and open/close handlers in PhilHealthReportsPage.tsx
- [x] Add a borderless eye "View report" action to the PhilHealth Reports and Payments tables
- [x] Build the report-details modal with employer name/PHIC, period, amount due, amount paid, payment status badge, all `report.entries` (name, code, PhilHealth number, contribution) with total footer, and full payment metadata
- [x] Keep Delete gated by `canEditPayments`; confirm the delete API already returns 403 for non-admins
- [x] Connect the modal's Record/Update Payment button to the existing payment form and sync the modal after a payment save
- [x] Clear the report-details and payment modal state when the viewed report is deleted
- [x] Add the PhilHealth print stylesheet in app/globals.css following the Pag-IBIG `window.print()` pattern
- [x] Update TECHNICAL.md with the new report-details modal behavior
- [x] Run validation: tests (88 pass), TypeScript (clean), ESLint (clean), git diff --check (clean)
