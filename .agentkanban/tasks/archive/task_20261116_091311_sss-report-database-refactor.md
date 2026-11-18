---
title: Separate SSS contribution and loan reporting databases
lane: todo
created: 2026-11-16T09:13:11+08:00
updated: 2026-11-16T09:13:11+08:00
description: Separate SSS contribution and loan reporting into distinct physical databases, add Reports sidebar links, back up both datasets, and document a verified migration runbook.
---

## Conversation

Create a new task and TODO for refactoring reports: separate the SSS contribution and loan report databases, add separate Contributions and Loan links under Reports, show the database structures, back up both datasets, and create an `.md` migration reference.

### agent

Scope and decisions recorded:

- This is SSS-only; Pag-IBIG and PhilHealth are out of scope.
- Use two physical reporting databases: SSS Contributions and SSS Loans.
- Keep `User`, `employee`, and `employer` in the central HR database. Reporting databases preserve the source IDs and report snapshots without cross-database foreign keys.
- Loan scope includes SSS loan accounts, legacy SSS loan reports and entries, Loans Monitoring snapshots and entries, and imported historical SSS loan reports.
- Replace the standalone Loans sidebar item with Reports > Contributions and Reports > Loan. Contributions links to the SSS contribution reports, and Loan links to SSS saved Loan Reports (`/reports/sss?kind=LOAN`). Preserve route and API authorization.
- Create separate schema-and-data backups outside the repository. The exact backup folder and source/target database identities must be confirmed before any export or database write.
- Create root `SSS-REPORTS-MIGRATION.md` with verified schema inventory, backup references/checksums, migration and restore steps, integrity checks, and rollback procedure; never include credentials.

No backups, code changes, or database migrations have been started. Continue with the checklist only after the required backup destination and database identities are confirmed, and only implement after the user explicitly requests it.

Can you show me the database structure of the two databases, Contributions and Loans?

### agent

## Database structure

The Prisma schemas are [SSS Contributions](../../prisma/sss-contributions/schema.prisma) and [SSS Loans](../../prisma/sss-loans/schema.prisma). Both databases are PostgreSQL; central `User`, `employee`, and `employer` records are not copied.

### `hrdb_sss_contributions`

| Table | Columns |
|---|---|
| `SssReport` (114 rows) | `id` PK, `kind`, `employerId`, `employerName`, `employerAddress`, `employerSssNumber`, `prn`, `applicableMonth`, `applicableYear`, `amountDue`, `amountPaid`, `paymentType`, `payDate`, `sssBranch`, `transactionReference`, `createdBy`, `createdAt`, `updatedAt` |
| `SssReportEntry` (1,556 rows) | `id` PK, `reportId` FK, `employeeId`, `employeeName`, `employeeCode`, `employeeSssNumber`, `sssLoanId`, `loanAccountNumber`, `employeeEmployerId`, `employeeEmployerName`, `salaryRange`, `monthlySalaryCredit`, `employeeSs`, `employerSs`, `employeeMpf`, `employerMpf`, `ec`, `loanAmount`, `totalAmount` |
| `SssReportDraft` (0 rows) | `id` PK, `createdBy`, `kind`, `employerId`, `prn`, `applicableMonth`, `applicableYear`, `amountDue`, `entries` (JSON), `continuedBy`, `continuedAt`, `createdAt`, `updatedAt` |

`SssReportEntry.reportId` references `SssReport.id` with cascade delete. Employee, employer, and creator IDs are scalar references to central HR, not cross-database foreign keys.

### `hrdb_sss_loans`

| Table | Columns |
|---|---|
| `SssReport` (34 `LOAN` reports) | Same report/header columns as the Contributions database |
| `SssReportEntry` (251 rows) | Same entry columns as Contributions; `reportId` is a local report FK and `sssLoanId` references local `SssLoan.id` with set-null on loan deletion |
| `SssReportDraft` (0 `LOAN` drafts) | Same draft columns as Contributions |
| `SssLoan` (63 rows) | `id` PK, `employerId`, `employeeId`, `employeeName`, `employeeCode`, `biometricNo`, `loanAccountNumber`, `transactionNumber`, `loanType`, `loanDate`, `loanAmount`, `monthlyAmortization`, `status`, `statusReason`, `createdAt`, `updatedAt` |
| `Loan` (43 SSS rows) | `id` UUID PK, `employeeId`, `provider`, `loanType`, `loanAccountNumber` (unique), `loanDate`, `terms`, `statusReason`, `totalAmount`, `monthlyAmortization`, `outstandingBalance`, `status`, `createdAt`, `updatedAt` |
| `LoanPayment` (0 SSS payments) | `id` UUID PK, `loanId` FK, `payrollPeriodId`, `amountPaid`, `paymentDate`, `source`, `createdAt` |
| `LoanMonitorReport` (7 SSS-only snapshots) | `id` UUID PK, `applicableDate`, `employerName`, `employerSssNumber`, `employerAddress`, `totalMonthly`, `totalOutstanding`, `prn`, `paymentDate`, `amountPaid`, `paymentBranch`, `transactionReference`, `createdBy`, `createdAt` |
| `LoanMonitorReportEntry` (47 rows) | `id` UUID PK, `reportId` FK, `loanId`, `provider`, `loanType`, `loanAccountNumber`, `employeeName`, `loanDate`, `terms`, `totalAmount`, `monthlyAmortization`, `outstandingBalance`, `status`, `statusReason`, `employerName`, `employerSssNumber`, `employerAddress` |
| `ImportedSssLoanReport` (32 historical reports) | `sourceReportId` PK, `sourceKind`, `sourceEmployerId`, `employerName`, `employerAddress`, `employerSssNumber`, `prn`, `applicableMonth`, `applicableYear`, `amountDue`, `amountPaid`, `paymentType`, `payDate`, `sssBranch`, `transactionReference`, `sourceCreatedBy`, `sourceCreatedAt`, `sourceUpdatedAt`, `importedAt` |
| `ImportedSssLoanReportEntry` (238 rows) | `sourceEntryId` PK, `sourceReportId` FK, `sourceEmployeeId`, `employeeName`, `employeeCode`, `employeeSssNumber`, `sourceSssLoanId`, `loanAccountNumber`, `sourceEmployeeEmployerId`, `employeeEmployerName`, `salaryRange`, `monthlySalaryCredit`, `employeeSs`, `employerSs`, `employeeMpf`, `employerMpf`, `ec`, `loanAmount`, `totalAmount` |

The report, loan-payment, monitoring-snapshot, and imported-history child tables use local foreign keys with cascade behavior to their local parents. The copied monitoring snapshots are SSS-only; complete mixed-provider snapshots remain central. Database counts were verified after restoring both archives into disposable databases.

plan
These analytics take up too much space. Fit all three government analytics side by side on one desktop screen, while keeping them stacked on mobile. Replace the paired-bar graphs with multi-line graphs.

### agent

Conversing in file: task_20261116_091311_sss-report-database-refactor.md

Planning refinement: keep the current prior-full-year versus current-year-to-date totals for SSS, PagIBIG, and PhilHealth, but arrange all three provider panels side by side on desktop and stacked on mobile. Replace each paired-column chart with a compact multi-line chart comparing monthly amounts for the previous year and current year-to-date. Keep visible government accent borders and the already-removed dashboard title/subtitle. Validate that the three panels fit together at a desktop viewport without horizontal overflow, while preserving mobile stacking and chart accessibility. No code or TODO changes yet.

additional
apply it also in the
Contribution page list card (scrolling on listcard only)

Philhealth Contributions ListCard
Report Column
  > replace it with SPA Number

### agent

Additional planning scope: apply bounded vertical scrolling to the PhilHealth Contributions page report list card as well, so scrolling stays within the card. Rename its `Report` column to `SPA Number`. The PhilHealth View popup still gets the screenshot-inspired layout with its employee rows scrolling between the sticky column header and sticky totals footer.

The report list currently has no totals/footer row. Confirm whether to add a totals footer there or keep the existing list summary behavior and make only its table header sticky.

### user

Plan refinement for the Contribution Page only: replace the current employer/provider launcher and government-tab/list layout with a vertically stacked employer/provider card on the left and a selected-provider payments panel on the right. Provider selection should update the right panel without the horizontal government tabs. The right panel shows the latest eight paid contributions with period, payment date, and amount paid. Add a toolbar above it with a “View all reports” action that opens a new provider/employer-filtered page listing all saved reports, paid and unpaid. Keep existing provider routes/redirects unchanged; use a new all-reports route. Preserve the existing APIs and authorization, extending SSS/PagIBIG payment responses to return the recorded amount/date required by the summary list.

### agent

Plan:

- Rework the Contribution Page to a responsive two-column layout: a vertically stacked employer selector and SSS/PagIBIG/PhilHealth buttons in a left card; the selected provider’s latest-payment panel on the right. Stack the panels on narrow screens.
- Keep provider buttons disabled until an employer is selected. Provider buttons select the right-panel provider and preserve provider/employer state in the URL. Remove the horizontal government tabs and the current contribution report-list cards from this landing view.
- Show only paid contribution reports in the right-side summary, limited to the latest eight and displaying contribution period, payment date, and amount paid. Extend the existing SSS and PagIBIG payment API responses with saved payment dates/amounts to match PhilHealth’s payment data. Keep existing authorization and surface loading/error/empty states.
- Add a toolbar above the payment summary with a “View all reports” action. Create a new provider/employer-filtered full-report route showing all saved reports, paid and unpaid. Do not change the existing `/reports/contributions/sss`, `/pagibig`, and `/philhealth` redirects.
- Keep existing report/detail functionality available on the new full-report page using current provider report APIs and authorization; preserve the SSS placeholder only where its report data is not supported.
- Update `ContriPage.md`, `TECHNICAL.md`, project memory, and add a TODO iteration before implementation. Verify query persistence, employer/provider filtering, paid-only latest-eight summaries, all-report navigation/list scope, responsive layout, lint, typecheck, tests, and diff checks.

The user confirmed the payment summary is paid-only, the all-reports destination should use new routes, and the full report page should include both paid and unpaid reports. Planning only; no TODO or implementation changes were made for this refinement.

### user

Additional planning request: left-align the label in the Reports sidebar button. Apply the employer filter and provider buttons planned for the Contribution Page to the Loans page as well.

### agent

Plan refinement:

- In the sidebar Reports control, keep the icon and Reports label grouped and left-aligned; keep the disclosure chevron aligned at the far right. Preserve the existing expand/collapse, active, and collapsed-sidebar behavior.
- Keep the planned employer selector and SSS/PagIBIG/PhilHealth buttons on the Contribution Page. Buttons remain disabled until an employer is selected and carry that employer into the selected provider view.
- Add the same employer-selection and button flow to Loans Monitoring. Since the existing loan system supports only SSS and Pag-IBIG, show medium-sized SSS and Pag-IBIG buttons only. Keep both disabled until an employer is selected.
- Selecting a loan provider opens its existing provider-specific page with the selected employer filter applied: SSS `/loans/sss`, Pag-IBIG `/loans/hdmf`. Preserve existing loan functionality and ensure provider page data/report views respect the selected employer.
- Carry the employer selection in the URL so filtered views can be opened directly and browser navigation remains consistent. Keep existing in-page employer/year filters available where they currently exist.
- Verify Reports label/chevron alignment in expanded and collapsed sidebars, selector loading/error/selection states, disabled/enabled provider controls, employer-specific loan records/reports, provider navigation, responsive behavior, and focused tests/type/lint checks. Update `TECHNICAL.md`, `ContriPage.md`, project memory, and the Kanban TODO/task during the TODO and implementation phases.

Planning only; no TODO checklist or implementation changes were made for this refinement.

### user

Plan refinement: On the Reports > Contribution Page, add an employer selector and medium-sized SSS, PagIBIG, and PhilHealth buttons. Keep all provider buttons disabled until an employer is selected; selecting a provider should open its Contribution Page view filtered to that employer.

The selector belongs on the Contribution Page landing area. Once an employer is selected, enable all provider buttons for the user to choose from. Keep the SSS button enabled and pass the employer through even though the current SSS tab remains a placeholder without filtered report data.

### agent

Plan:

- Add an employer selector to the Contribution Page landing area, using the existing employer-list source. Start with no employer selected so the user must choose one; keep loading and error states explicit.
- Show medium-sized SSS, PagIBIG, and PhilHealth provider buttons. Disable all three until an employer is selected.
- When a provider button is activated, navigate to the existing Contribution Page with that provider selected and the employer ID in the URL. Initialize the provider view from those URL parameters so PagIBIG and PhilHealth reports load for the chosen employer; keep their existing employer selectors available for changing the filter.
- Keep SSS enabled and carry the selected employer into the SSS tab, but retain its current placeholder content because employer-filtered SSS report data is not implemented.
- Preserve existing report APIs and authorization. Add focused coverage for disabled/enabled button behavior, provider navigation, and employer-filtered results, then update the related Contribution Page documentation and Kanban checklist during the TODO/implementation phases.

Planning only; no TODO checklist or implementation changes were made.

### user

plan

Use the attached PhilHealth Contribution Report as the View popup style reference. Keep the report list card scrolling, with its header and footer fixed.

Clarification: apply this to the PhilHealth View popup; only the table column header and totals footer stay fixed while employee rows scroll.

### agent

Conversing in file: task_20261116_091311_sss-report-database-refactor.md

Plan refinement:

- Restyle the PhilHealth View popup to follow the screenshot’s report hierarchy: report/employer heading, compact shaded payment details, then the contribution list card.
- Make the employee rows the list card’s scrollable area. Keep the table column header and PS/ES/grand-total footer sticky and visible as rows scroll.
- Preserve existing payment/report values, the current PS/ES half split, responsive horizontal table scrolling, and modal close/focus accessibility. No API, schema, or report page changes.
- After approval and implementation, update Technical Notes, Contribution Page documentation, project memory, and the active Kanban task/TODO; verify desktop/mobile scrolling and totals.

The user confirmed the popup scope and sticky table header/footer. The implementation is not started.

### user

full_previous

### agent

Plan finalized for the Reports Dashboard analytics refinement:

- Keep the dashboard’s Employer selector removed and aggregate SSS across all employers.
- Add an SSS Contributions analytic card comparing paid amounts for the current calendar year-to-date against the full previous calendar year. Use each report’s applicable year; include only saved CONTRIBUTION reports with a non-null `amountPaid`. Show both years’ totals and the difference/percentage where meaningful, with clear year labels.
- Add a Reports-authorized aggregate API that queries `getSssContributionsPrisma()` directly so the dashboard can use the dedicated SSS Contributions database without downloading all report entries. Add a dashboard card that handles loading, empty, and error states.
- Omit the Loans comparison from this iteration entirely; do not add a placeholder or change the separate Loans navigation/pages. Loans database integration is deferred.
- Update `ContriPage.md`, `TECHNICAL.md`, and project memory; verify using focused tests/type-check/lint/build.

Planning only; no code or TODO checklist changed. Next workflow step is `todo`, then `implement`.

### user

amount_paid, loans omit

### agent

Confirmed: use paid contribution amounts only and omit Loans from the first dashboard card entirely (no placeholder), preserving the existing separate Loans navigation for later work. One remaining comparison detail: because the current calendar year is incomplete, I recommend comparing paid amounts for the same year-to-date period (through the current month) in both years rather than comparing the partial current year against the full previous year. Please confirm this period rule; the dashboard will continue aggregating all employers without restoring an Employer selector.

### user

plan on reports dash board
create an analytic card comparing the the previous year and current year for contributions and loans

if SSS contribution can be link with the database please do, we will just fix the loans later

### agent

Planning analysis: `/reports` currently renders only the Reports Dashboard heading; the Employer selector was intentionally removed and should stay absent. SSS report read APIs are authorized and already read Contributions from the separate `SSS_CONTRIBUTIONS_DATABASE_URL` Prisma client, but they require a specific employer and return full reports. For an all-employer dashboard comparison, plan a small authorized aggregate endpoint that queries the SSS contributions database directly and groups saved reports by `applicableYear`, rather than having the client download every report. The proposed first phase is SSS Contributions only, comparing current calendar year with the preceding year across all employers, while leaving loans unconnected for the later database/data pass. To finalize the plan, confirm whether annual contribution totals should sum report `amountDue` by applicable year (includes unpaid reports) or paid amounts only, and whether to show a visibly pending Loans comparison card or omit it until loan data is connected. Planning only; no implementation or TODO changes made.

### user

Both

### agent

Plan finalized: remove the in-page Loans tab from both the SSS and PagIBIG Contribution provider pages. The shared `ContributionProviderContent` will present the Contributions content directly with no provider tabs; its contribution API calls, employer selectors, and report details remain unchanged. Remove the now-unreachable placeholder Loans section from this provider component. Keep the separate Loans button/navigation, `/loans` pages, and employee loan views unchanged. Update `ContriPage.md`, `TECHNICAL.md`, and project memory when implemented, then run TypeScript, focused lint, tests as applicable, and a production build (using the direct Next.js build if Prisma generation hits the known Windows EPERM issue). Planning only; no code or TODO checklist changed.

### user

plan
refinement
remove the loans tab since we have the Loans button

### agent

Plan refinement: remove the in-page Loans tab from the provider page(s), since Loans already has a separate navigation button. Keep the Contributions display and its existing data wiring unchanged; do not remove or alter the separate Loans navigation or existing loan pages. The shared provider component currently renders this tab for both SSS and PagIBIG, so confirm whether the removal should apply to both providers or PagIBIG only before finalizing the scope. No implementation or TODO changes in this planning step.

### user

Update?

### agent

Status: the refinement is documented in [ContriPage.md](../../ContriPage.md) and tracked in Iteration 6, but its UI/data wiring has not started yet. The shared Back button is already implemented, but moving it left of page headings is pending. The current visible provider page remains a placeholder, and PagIBIG/PhilHealth report data still uses the central database. I need confirmation on the intended contribution-page content before wiring the existing APIs.

### user

Approved disposable archive restore testing.

### agent

Both native archives were restored successfully into the approved disposable databases. Restored counts matched the migration manifest: Contributions 114 reports/1,556 entries/0 drafts; Loans 34 legacy reports/251 entries, 63 source accounts, 43 SSS current loans, 0 SSS payments, 7 monitor reports/47 entries with 0 non-SSS entries, and 32 imported historical reports/238 entries/0 drafts. Both disposable databases were removed. The central source and populated targets were not modified by the restore test.

Production URL configuration, deployment smoke testing, and cutover approval remain outside this completed implementation; retain the central source until those are approved.

### user

implement

### agent

Continued the SSS database refactor and verified the populated targets:

- Generated dedicated Prisma clients automatically through the `predev` and `prebuild` hooks.
- Confirmed target counts: Contributions 114 reports/1,556 entries; Loans 34 legacy reports/251 entries, 63 `SssLoan` accounts, 43 SSS `Loan` accounts, 7 SSS-only monitoring reports/47 entries, and 32 imported historical reports/238 entries. Both targets have zero drafts; the loans target has zero SSS payments and zero non-SSS monitor entries.
- Created native PostgreSQL archives outside the repository and recorded their SHA-256 checksums in `SSS-REPORTS-MIGRATION.md`. `pg_restore --list` succeeded for both.
- Updated the migration guide, `TECHNICAL.md`, and Kanban memory. Source records remain intact; no production cutover was performed.
- `npx tsc --noEmit` passed; `npm test` passed all 171 tests; focused ESLint completed with 0 errors (11 existing warnings). The Next.js production build passed with npm lifecycle scripts skipped. Standard `npm run build` was blocked during the prebuild Prisma generation by a Windows `EPERM` rename of the central query-engine DLL.
- Independent restore validation remains pending because it requires creating a disposable database; production URL configuration, smoke testing, and cutover approval also remain pending.

### user

Plan approved. Create the task and TODO checklist.

### agent

Created the new Kanban task and TODO checklist for the agreed SSS-only physical database split. The checklist records the schema inventory, unconfirmed backup-folder/database-target blocker, separate verified backups, database migration, Reports sidebar links, and `SSS-REPORTS-MIGRATION.md`. Updated Kanban memory. No backup, code change, or database write was performed.

### user

implement

### agent

Implemented the safe application/documentation portion:

- The Reports sidebar now expands to Contributions and Loan links for the existing SSS report route. The standalone `/loans` shortcut is removed; the `/loans` route and its authorization remain unchanged.
- Added `SSS-REPORTS-MIGRATION.md` with the checked-in model/field inventory, relationship boundaries, backup/migration/restore procedure, rollback outline, and an explicitly pending backup manifest.
- Updated `TECHNICAL.md` and Kanban memory.
- Validation: targeted ESLint passed, `npx tsc --noEmit` passed, and `npm test` passed all 171 tests.

The physical database split, live row counts, and backups are not complete. They are blocked because the source/target identities and secure external backup path are not confirmed. Additionally, one `LoanMonitorReport` may contain both SSS and Pag-IBIG entries and shared totals; filtering or copying those rows changes scope or integrity. No database connection, export, or write was performed.

### user

Source is local PostgreSQL but without the exact database name; both targets are not provisioned yet; the backup-directory response was “yes” without a path. Selected policy: keep complete mixed-provider snapshots central and migrate only SSS-only snapshots.

### agent

Recorded the mixed-provider policy in the migration reference and checklist. The exact source identity, target database names/provisioning approval, and secure backup folder still need confirmation. No database was accessed or changed.

### user

Can you show me the database structure of the two databases, Contributions and Loans?

### agent

The schema and column inventory are shown above. The source definitions are [SSS Contributions](../../prisma/sss-contributions/schema.prisma) and [SSS Loans](../../prisma/sss-loans/schema.prisma); verified table counts and relationships are listed with them.

### user

Great now lets create a new .md for the Contribution Page named `ContriPage.md`. First remove all cards in the Reports Page Dashboard, including the Employer Selector. Then use the current `SSS Reports` / `Monitor SSS employer contributions and loan payments.` header as a starting point for the Contribution Page, rename it `Contribution Page`, and add SSS, PagIBIG, and Philhealth buttons. Create the page header; we will continue after creation.

### agent

Created the requested starter brief in [ContriPage.md](../../ContriPage.md), recording the dashboard cleanup, replacement page title/header direction, and three provider buttons. The buttons' destinations and displayed content were not specified, so no UI or routing changes were made in this documentation step.

### user

Revision: mark the dashboard-card removal and Employer selector removal checked. On the Contribution button page, use the title `Contribution Page`, add SSS, PagIBIG, and Philhealth buttons, and create three provider pages with clear headers.

### agent

Revised [ContriPage.md](../../ContriPage.md) to record the landing page and three provider-page requirements. The user marked the dashboard cleanup items checked, but the current `app/reports/page.tsx` still contains the cards and Employer selector; the brief records that they are not yet implemented. Clarification needed before implementation: should the three buttons reuse existing provider report screens, or lead to new dedicated pages? No UI or routing changes were made.

### user

The user selected three new dedicated provider pages, confirmed they should not reuse the existing report screens, and approved implementation.

### agent

Implemented the Contribution Page flow:

- Removed provider cards, the Employer selector, and employer-loading states from `/reports`.
- Added `/reports/contributions` with the `Contribution Page` header and SSS, PagIBIG, and Philhealth navigation buttons.
- Added dedicated header-only pages at `/reports/contributions/sss`, `/reports/contributions/pagibig`, and `/reports/contributions/philhealth`. Each has a provider-specific header and Back to Contributions link. Existing provider report screens remain unchanged.
- Updated the Reports > Contributions sidebar link, [ContriPage.md](../../ContriPage.md), `TECHNICAL.md`, and the Kanban checklist.
- Validation passed: `npx tsc --noEmit`, focused ESLint, all 171 tests, and `npx next build`.

The new provider routes are header shells; their report content can be added in the next step.

### user

Plan refinement: change the back button to a circular button with no arrow tail, and make this the universal pattern whenever adding a back button.

### agent

Updated [ContriPage.md](../../ContriPage.md) to specify a universal, reusable circular icon-only back button with a left chevron (no arrow shaft/tail), accessible label, and visible tooltip. Added the implementation work as pending Iteration 5 in the task checklist; no application code was changed.

### user

Additional plan: adjust the Contribution Page provider button widths so that on mobile they fill the available width and appear vertically stacked.

### agent

Updated [ContriPage.md](../../ContriPage.md) to specify full-width, vertically stacked provider buttons on mobile and natural-width horizontal buttons on larger screens. Added this as pending Iteration 5 work; no application code was changed.

### user

Additional plan: add Contributions and Loans tabs to the provider pages and organize each page under its tab. Philhealth has no loans, so show its page directly without a Loans tab.

### agent

Updated [ContriPage.md](../../ContriPage.md) and Iteration 5 to specify Contributions and Loans tabs on the SSS and PagIBIG pages, with page content organized under each tab; Philhealth remains a direct contributions page without a Loans tab. No application code was changed.

### user

Did you add the tab option for the SSS and PagIBIG pages?

### agent

Yes. The plan in [ContriPage.md](../../ContriPage.md) specifies `Contributions` and `Loans` tabs on both the SSS and PagIBIG pages, with their content organized under the corresponding tab. This is documented as planned work; the tabs have not been implemented in the app yet.

### user

Implement the planned Back button refinement, mobile provider-button layout, and provider-page tabs.

### agent

Implemented the Contribution Page refinements:

- Added the shared [BackButton](../../components/BackButton.tsx), a circular icon-only control with a chevron-only icon, descriptive accessible label, tooltip, app-history-aware fallback, and callback support. Reused it across existing route and workflow back controls.
- Made provider buttons full-width and vertically stacked on mobile, then naturally sized in a horizontal row on larger screens.
- Added accessible Contributions and Loans tabs to SSS and PagIBIG provider pages. Philhealth displays contributions directly without tabs. Report content in these sections remains placeholder text; existing provider report routes were not reused or changed.
- Updated [ContriPage.md](../../ContriPage.md), `TECHNICAL.md`, and project memory.

Validation: `npx tsc --noEmit`, focused ESLint, all 171 unit tests, `npx next build` (67/67 static pages), and `git diff --check` passed. The broad lint run still reports two existing `react-hooks/set-state-in-effect` errors in employee pages; the focused UI lint passes.

### user

Plan refinement: move the Back button beside page headers on the left side, always; connect PagIBIG and PhilHealth contribution data to their respective pages, Contributions only for now.

### agent

Recorded the refinement in [ContriPage.md](../../ContriPage.md) and added pending Iteration 6 work. The current schema uses the central `DATABASE_URL` for PagIBIG and PhilHealth; no separate provider-specific database clients are configured. Clarification is needed to confirm whether left-of-header placement is app-wide and whether the contribution pages should use the existing provider report APIs/UI.

### user

continue

### agent

Completed Iteration 6. Route-level Back buttons now sit to the left of page headings across the employee, SSS Reports, configuration, and Contribution provider pages; modal and multi-step workflow Back controls remain in their workflow layouts. PagIBIG Contributions now displays saved contribution-kind reports from `/api/reports/pagibig`, and Philhealth Contributions uses `/api/reports/philhealth/reports`; both have provider-page employer selectors and expandable employee entries. SSS contributions and SSS/PagIBIG Loans remain placeholders, and no separate PagIBIG or Philhealth database was added.

Verification passed: TypeScript, all 171 tests, focused ESLint outside the known employee-profile hook lint error, `npx next build`, and `git diff --check`. Standard `npm run build` could not regenerate the Prisma query engine because Windows returned `EPERM` during rename; the direct Next.js build passed with existing generated clients. Updated `ContriPage.md`, `TECHNICAL.md`, and project memory.

### user

implement

### agent

Completed Iterations 7 and 8. Removed the in-page Loans tabs from SSS and PagIBIG Contribution provider pages; the separate Loan sidebar destination remains. Added the SSS Contributions analytics card to Reports Dashboard with current Philippine calendar year through the current applicable month compared against the previous full calendar year. It sums reports with both payment amount and pay date, across all employers, and shows totals, report counts, difference, and percentage when a previous-year baseline exists. Loans analytics remain omitted as planned; the Reports Employer selector remains removed.

The new Reports-authorized `/api/reports/sss/analytics` endpoint returns aggregates only. The first browser check found a Next.js dev runtime `__dirname` failure when importing the dedicated generated SSS Prisma client. The analytics now uses the central generated Prisma client pointed at the validated SSS Contributions datasource, reusing a shared SSS database URL helper. Verified the authenticated endpoint returns 200 with the two year totals and the dashboard displays the comparison; also verified the PagIBIG provider page has no tabs and the separate Loan navigation remains.

Updated [ContriPage.md](../../ContriPage.md), `TECHNICAL.md`, and project memory. Validation passed: `npx tsc --noEmit`, focused ESLint, all 171 tests, `npx next build` (68/68 static pages), and `git diff --check`.

### user

plan
Can you make the Reports Dashboard analytics a digital visual graph and include PagIBIG and PhilHealth? Use the attached image as inspiration, not as an exact design. Ask me which type so I can choose.

### agent

Plan choices confirmed: provider summary cards plus a grouped-column chart; paid amounts only; latest 12 months grouped by applicable contribution month; replace the SSS-only annual comparison; include SSS, PagIBIG, and PhilHealth and leave Loans analytics deferred.

### user

implement

### agent

Implemented the all-provider contribution analytics dashboard. Replaced the SSS annual card and `/api/reports/sss/analytics` with the Reports-authorized `/api/reports/contributions/analytics` endpoint. It returns monthly paid amounts and paid-report counts for the latest 12 applicable months, including the current `Asia/Manila` month. SSS queries the dedicated SSS Contributions database; PagIBIG and PhilHealth use the central database. The response includes only aggregate amounts/counts and period bounds, with no report entries or employer data.

Added responsive summary cards and an accessible grouped-column chart with a screen-reader data table, monthly amount labels, loading/error/invalid-data/empty states, and a scrollable chart on mobile. Updated [ContriPage.md](../../ContriPage.md), [TECHNICAL.md](../../TECHNICAL.md), and project memory.

Verification passed: all 174 tests, focused ESLint, `npx next build` (68/68 static pages), post-build `npx tsc --noEmit`, and scoped `git diff --check`. Browser checks confirmed a 200 analytics response, 12 monthly buckets whose totals reconcile, no employer data, stacked provider summaries on mobile, and no page-level horizontal overflow. The first type check encountered stale generated Next.js route types referencing the replaced route; the successful production build regenerated route types before the passing type check.

### user

plan
Update the Reports dashboard: restore visible government accent borders on the SSS and PagIBIG summary cards; remove the “Reports Dashboard” heading and subtitle; show a separate analytics graph for each government directly beneath its summary cards; and compare the previous full calendar year (January–December) with the current year. Each government card should show the previous-year total versus the current-year total. Use the attached images as design references.

### agent

Confirmed the comparison uses the previous full calendar year versus the current year through the current applicable month (YTD). Use paired monthly columns, with each government's two total cards directly above its own graph. Remove the Reports Dashboard title/subtitle and use a clearly visible government accent border on its total cards.

### user

implement

### agent

Implemented separate SSS, PagIBIG, and PhilHealth annual comparison sections. Removed the Reports Dashboard heading/subtitle. Each section now has provider-accent-bordered total cards for the previous full year and current-year-to-date total, followed directly by its own paired-column chart comparing monthly paid amounts by applicable month. Previous year includes January–December; current year includes January through the current applicable month. Existing Reports authorization and aggregate-only data behavior remain.

Updated the contribution analytics API/validation, dashboard components, [ContriPage.md](../../ContriPage.md), [TECHNICAL.md](../../TECHNICAL.md), and project memory. Loans analytics remain deferred.

Validation passed: `npx tsc --noEmit`, focused ESLint, all 173 tests, direct `npx next build` (68/68 pages), and scoped `git diff --check`. Browser checks confirmed each provider’s annual total matches the graph’s applicable monthly values, all three panels fit side by side on desktop, and the 390px mobile layout stacks without page-level horizontal overflow.

### agent

Implemented the compact Reports dashboard layout. SSS, PagIBIG, and PhilHealth now appear as three provider panels side by side on desktop and stack on mobile. Each keeps its accent-bordered previous full-year and current year-to-date totals, with a compact monthly two-line graph beneath them. The current-year series is dashed and the legend matches; accessible chart descriptions, point tooltips, and screen-reader monthly tables are retained. Updated `TECHNICAL.md`, `ContriPage.md`, and project memory. Loans analytics remain unchanged.

Verification passed: TypeScript, focused ESLint, all 173 tests, direct Next production build (68/68 pages), scoped diff check, and browser layout checks at desktop/mobile sizes. `npm run build`'s Prisma generation hook could not rename a locked engine DLL; running `npx next build` directly succeeded.

### user

plan
Reports button > when pressed again close the drop down

# Contribution Page
Monitor SSS employer contributions and loan payments.

replace the buttons with tabs then move the the pages there

### agent

Planning refinement: the Reports submenu currently opens by default on report routes; its chevron can toggle it, but clicking the Reports link itself resets it to the open state. The Contribution Page currently has provider buttons that navigate to separate routes. Proposed changes:

- Make the Reports control's expanded/collapsed behavior toggle on repeated activation, while preserving access to the Reports dashboard.
- Replace provider navigation buttons with accessible SSS, PagIBIG, and PhilHealth tabs on `/reports/contributions`, rendering each provider's existing page content in its tab panel.
- Keep each provider's existing data and report behavior; preserve existing direct provider URLs by redirecting them to the matching tab.
- Preserve the Contribution Page heading/subtitle and keep Loans behavior unchanged.
- Update technical documentation and verify menu toggling, tab/keyboard behavior, redirects, permissions/data wiring, and responsive layout.

### user

Reports row should toggle the menu and the dashboard should remain a submenu link. Redirect existing provider URLs to their matching tabs.

### agent

Plan finalized: the Reports row toggles the submenu, which includes the Reports Dashboard link. The Contribution Page uses URL-backed accessible tabs for SSS, PagIBIG, and Philhealth, with SSS as the default. The former provider routes redirect to the corresponding tab. Existing provider content and data wiring remain unchanged; Loans remain separate.

### user

implement

### agent

Implemented the Reports submenu toggle, adding Reports Dashboard as a submenu destination. Replaced the Contribution Page provider links with accessible SSS, PagIBIG, and PhilHealth tabs. The selected provider is URL-backed (`?provider=...`), SSS is the default, and left/right arrow, Home, and End keys switch tabs. Legacy SSS, PagIBIG, and PhilHealth provider routes now redirect to their matching tabs. The provider views keep their existing API and report behavior.

Updated `TECHNICAL.md`, `ContriPage.md`, and project memory.

Verification passed: TypeScript, focused ESLint, all 173 tests, scoped diff check, and browser checks for menu toggling, tab selection, keyboard navigation, all three redirects, and mobile overflow. A production build was not run because the workspace's Next.js development server was already running against the shared `.next` directory.

### user

follow-up plan
pressing Reports should open the Reports Dashboard - dont create a button for the Dashboard
then pressing it again closes the dropdown (align the text to the left)

Philhealth
Employer Selector shows only what the screen can handle maximum list in the list card to avoid scrolling down the screen

clicking view opens a pop up showing the following

Header
Payor Name: Employer Name
SPA No: SPA Number
Applicable Period:
Actual Amount Paid:
Accredited Collecting Agent:
Transaction Confirmation No.:
Transaction Dat:
ePar No.:
ePar Date:

List Card (remove EMPLOYEE CODE)
Columns:
Employee
Employees PhilHealth Number
PS
ES
Total: PS+ES

Totals in the bottom
PS Total and ES Total with Grand Total

### agent

Planning refinement:

- Make the Reports row navigate to `/reports` and toggle the submenu: opening it from another route lands on Reports Dashboard and expands it; activating it again while on `/reports` collapses the submenu. Remove the Reports Dashboard submenu item. Keep the Reports label left-aligned while placing any disclosure icon at the far edge.
- Keep the Contribution Page provider tabs and provider-route redirects already implemented.
- On the PhilHealth tab, constrain the employer picker options/list to the available viewport height and scroll within the picker instead of forcing the page to grow.
- Change the PhilHealth contribution report View action to open a details dialog. Show the requested payment header fields, report entries without Employee Code and with Employee, PhilHealth number, PS, ES, and combined total, then PS/ES/grand-total footers. Retain responsive behavior, accessible close/focus behavior, and existing report data authorization.
- Existing PhilHealth payment storage contains the requested header fields. However, persisted report entries currently store only a combined amount per employee; the existing PhilHealth detail dialog displays PS and ES as an even split. Confirm whether the new view should preserve that existing 50/50 split or whether the underlying report data should be expanded to store actual employee/employer shares.
- “Transaction Dat” is interpreted as “Transaction Date”; use the saved transaction date unless corrected.

### user

Use the existing half split for PS and ES, and use a bounded-height employer picker with its own scrolling list.

### agent

Plan finalized:

- Make the Reports row navigate to `/reports` and toggle the submenu. From another route, activating it opens the dashboard and expands the submenu; activating it again on the dashboard collapses the submenu. Remove the Dashboard submenu entry and align the Reports label left.
- Keep the existing URL-backed Contribution Page tabs and legacy route redirects.
- On the PhilHealth tab, use a viewport-bounded, internally scrollable employer picker.
- Make PhilHealth report View open an accessible popup with the saved payment header fields (including Transaction Date), then an employee table with Employee, PhilHealth Number, PS, ES, and combined total, omitting Employee Code. Keep the existing even split of each saved entry amount for PS/ES and display PS Total, ES Total, and Grand Total.
- Reuse existing saved payment values and report data; no schema change is needed for this plan.
- Update `TECHNICAL.md`, `ContriPage.md`, and project memory. Add a TODO iteration before implementation and verify navigation, picker scrolling, modal accessibility/content, responsive layout, and tests.

Planning only. No TODO checklist or implementation changes were made for this follow-up.

### user

### agent

Implemented the Reports and PhilHealth follow-up. Reports now opens `/reports` and toggles its submenu; the Dashboard submenu link is removed, with Contributions and Loan remaining. The PhilHealth employer picker is bounded with internal scrolling, and View opens an accessible details dialog with the requested payment information and employee contribution totals using the existing PS/ES half split. Extracted the reports table into `components/contribution-provider/ContributionReportsTable.tsx` to keep components under the 150-line limit.

Updated the relevant Technical Notes, Contribution Page documentation, project memory, and Iteration 13 checklist.

Verification passed: TypeScript, focused ESLint, all 173 tests, scoped diff check, and browser validation of Reports navigation/toggle behavior, picker bounds, requested dialog fields/columns, cent-level total reconciliation, Escape/focus behavior, and mobile dialog scrolling. A production build was not run because the active Next.js development server shares the `.next` directory.

### user

The PhilHealth Contributions page list should keep its existing content, use an internally scrolling card with a sticky table header, and have no new totals footer. Rename the `Report` column to `SPA Number`.

### agent

Updated the plan to cover both the PhilHealth View popup and the Contributions page list card. The popup will keep its table header and totals footer sticky while employee rows scroll. The page list will scroll within its own card, keep its table header sticky, and show `SPA Number` in place of `Report`; no totals footer will be added. Existing data, calculations, and APIs remain unchanged.

The revised plan is saved in the session plan and queryable todo records. Planning only; implementation has not started.

### user

implement

### agent

Implemented the PhilHealth report list and View popup refinements. The View popup now follows a compact report layout with saved payment details above an independently scrollable employee table; its column header and totals footer remain sticky. The Contributions page list scrolls within a 60dvh-bounded card, keeps its header sticky, and displays the saved SPA value under **SPA Number** without adding a footer. Existing amounts and PS/ES split calculations are unchanged.

Updated `TECHNICAL.md`, `ContriPage.md`, project memory, and Iteration 14.

Verification passed: TypeScript, focused ESLint, all 173 tests, scoped diff checks, and desktop/mobile browser checks. The 38-row sample reconciled to PS ₱9,500.00, ES ₱9,500.00, and ₱19,000.00 grand total. Escape dismissal and focus restoration passed. A production build was skipped because the dev server shares `.next`.

### user
implement

### agent

Implemented the Contribution and Loans employer-filtered provider launchers. The Contribution Page now requires an employer selection before its SSS, PagIBIG, and PhilHealth buttons activate; each button carries both provider and employer ID into the existing URL-backed tab. The selected employer persists when switching tabs, and SSS retains its placeholder view. Loans Monitoring now has employer-gated SSS and Pag-IBIG buttons that open the existing provider routes with the employer ID. Those routes validate the employer, initialize the loan-table and report-generation filters, and scope historical SSS reports. The Reports sidebar label is left-aligned beside its icon, with the chevron at the far right.

Updated `TECHNICAL.md`, `ContriPage.md`, project memory, and Iteration 15.

Verification passed: `npx tsc --noEmit`, focused ESLint, `npm test`, and scoped `git diff --check`. Browser validation was not run because no local app server was listening on ports 3000–3002.

### user

### agent

Implemented Contribution Page Iteration 16:

- Replaced the provider tabs/report lists on `/reports/contributions` with a responsive two-column layout: vertical employer/provider launcher at left and the selected provider's latest payments at right. Changing employers refreshes the payment panel.
- Added paid-only, latest-eight payment summaries with period, payment date, and amount paid. The SSS/PagIBIG payment views return saved date/amount fields, and PhilHealth's existing payment response is normalized with explicit invalid-response handling.
- Added “View all reports” and `/reports/contributions/all?provider=...&employerId=...`, showing paid and unpaid contribution reports for the selected provider/employer. Existing provider redirects remain unchanged; SSS report entries are adapted from saved SSS contribution components for the shared details table.
- Updated `ContriPage.md`, `TECHNICAL.md`, Kanban memory, and the Iteration 16 checklist.

Validation passed: TypeScript, focused ESLint, all 173 tests, and scoped diff checks. `npx next build` compiled but stopped during static generation because the installed Next.js version is flagged by its security check. Browser validation was not run because no local app server was listening on ports 3000–3002.

### user

plan
refinement

buttons are moving along with the list card when expandin
lock the buttons on desktop view
on mobile view show only months and total

Latest 8 paid contribution reports. - remove this
show 12 list

Back button is a word - replace it with the circle button with no tail arrow
remove this
View all saved contribution reports for the selected employer.

remove this
## SSS Contributions
View saved contribution reports for an employer.

Add the Employer Header since its filtered before opening
Employer Name
Employer Provider Number
Address

then add toolbar with filters
List Card show maximum of 8

### agent

Plan refinement for Iteration 17 (planning only):

- Keep the landing-page provider/employer launcher fixed in place on desktop while the payment list scrolls or changes height; let it return to normal document flow on mobile.
- Change the payment summary from eight to twelve paid contributions and remove the “Latest 8 paid contribution reports.” helper line. On narrow screens, show only the applicable month/period and amount total; retain payment date on desktop.
- On the all-reports page, replace the text Back link with the shared circular, icon-only chevron `BackButton`. Remove the generic `PageHeader` subtitle, provider panel heading (`SSS Contributions`, with the equivalent headings for other providers), and “View saved contribution reports for an employer.” copy.
- Show an employer header above the all-reports toolbar, using the employer already selected in the incoming URL: employer name, address, and the provider-appropriate number (`sss`, `hdmf`, or `phic`) labeled as the provider number.
- Add report filters to the toolbar, retaining the already-applied provider/employer scope; proposed filters are payment status (All/Paid/Unpaid) and applicable year.
- Bound the full report list card to approximately eight visible rows and scroll internally. On mobile, show only applicable month/period and total amount columns.
- Update the relevant route/API response fields, documentation, Kanban memory, and add Iteration 17 TODOs after the plan is confirmed. Validate desktop sticky behavior, mobile columns, both list limits, filters, type/lint/tests, and diff checks.

No code or TODO checklist changes were made. Please confirm that the mobile table should retain only period and amount (paid amount in the summary, amount due in all reports), and that the all-reports toolbar should filter by payment status and applicable year.

### user

Confirmed: mobile lists show period/month and amount only; the all-reports toolbar filters by payment status and applicable year.

### agent

Plan refinement confirmed for Iteration 17. The mobile columns will be period/month plus amount in both lists, and the all-reports filters will be payment status and applicable year. All other layout, header, button, copy-removal, and list-height requirements are captured above. Planning is complete; no implementation or TODO changes have been made.

### user

implement

### agent

Implemented Contribution Page Iteration 17:

- The Contribution Page employer/provider launcher stays sticky on desktop and returns to normal flow on mobile.
- Payment summaries now show up to twelve paid contributions. Payment date remains on desktop and is hidden on mobile; the latest-eight helper sentence is removed. Existing payment API callers retain the eight-row default; the landing page opts into twelve.
- The all-reports route now uses the shared circular BackButton and removes generic/provider subtitle copy. Its employer header shows the selected employer name, provider number, and address.
- Added payment-status and applicable-year filters, an internally scrolling list card sized for about eight rows, and mobile period/amount columns with report details still available from the period control.
- Updated the SSS/PhilHealth employer response data and relevant documentation and project memory.

Verification passed: TypeScript, focused ESLint, all 173 tests, and scoped diff checks. Browser checks at desktop/mobile sizes confirmed sticky behavior, the twelve-payment limit, responsive columns, filters, employer headers for SSS/PagIBIG/PhilHealth, internal scrolling, and mobile report-detail access.

### user

plan

Remove the SSS, PagIBIG, and PhilHealth provider-number lines from the selected-employer header on the contribution all-reports page. Remove “Previous” from the payment-summary heading for each provider, using these requested labels: “PhilHealth Payment”, “PagIBIG Payment”, and “SSS Payments”. Keep the employer name/address and existing data behavior unchanged. The tagged `HistoricalSssLoanReports.tsx` currently says “Historical SSS Payments” and has no “Previous” text or provider-number line, so the proposed scope leaves that separate loans-history component unchanged unless you intended it to change too.

Planning only; no code or TODO checklist changes. Should the attached Historical SSS Loan Payments title also be renamed, or is this refinement limited to the Contribution Page and its all-reports employer header?

### agent

Plan recorded. Please clarify whether to include the separate Historical SSS Loan Payments title; its current wording contains no “Previous” label.

### user

implement

### agent

Implemented Contribution Page Iteration 18:

- Removed the selected employer's provider-number line from the all-reports header; employer name and address remain.
- Changed the payment summary headings to “SSS Payments”, “PagIBIG Payment”, and “PhilHealth Payment”.
- Kept payment data behavior and the separate historical-loans title unchanged. Updated `ContriPage.md`, `TECHNICAL.md`, and project memory.

Verification passed: `npx tsc --noEmit`, focused ESLint on the updated components, and `git diff --check`.

### user
