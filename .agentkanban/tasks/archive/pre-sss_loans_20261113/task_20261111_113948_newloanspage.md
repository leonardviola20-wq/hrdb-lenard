---
title: New Loans Page Toolbar
lane: done
created: 2026-11-11T11:39:48+08:00
updated: 2026-11-11T11:39:48+08:00
description: Consolidate SSS and Pag-IBIG provider loan page actions and filters into one top toolbar.
---

## Conversation

Let's just drop those cards for now.

### agent

The Agent Kanban workflow requires the `implement` command before I make code changes. Planned scope: remove the overview cards from both dedicated provider loan pages while preserving the toolbar and loan table.

Remove the Generated Reports section from beneath the Loans dashboard/provider content. Move access to a standalone page from the report button outside the list, rename that button to `Generated Reports`, and show saved reports for both SSS and Pag-IBIG on that page. Do not code yet; let me review first.

### agent

No code changes made. Proposed plan for review:

- Add a shared `/loans/reports` page using the existing `getLoanReports()` loader and `LoanReportsSection`/`LoanReportList` view and delete behavior.
- Remove the Generated Reports sections from the `/loans`, `/loans/sss`, and `/loans/hdmf` content.
- Rename the dedicated provider toolbar's `Reports` button to `Generated Reports` and navigate to the shared page. Keep the existing inline Generate Report actions for creating new reports.
- Show all saved SSS and Pag-IBIG reports together on the new page, with the existing view/delete actions.

Please review this scope before implementation; I have not changed application code.

Follow-up: when saved reports exist, hide the `Generated Reports List` heading and its description, then show the report list as a standalone list card like the SSS Employee Loans List.

### agent

When reports are populated, the explanatory heading/description is now hidden and the report table appears as a standalone card with a compact `Generated Reports` title and report count. Constrained the dashboard card/grid widths so the table scrolls within its own area on narrow screens instead of widening the page. Verified the populated state with an existing saved report in the authenticated browser, including its View/Delete actions. Targeted ESLint, TypeScript, and whitespace checks passed.

Follow-up: add All Employers and All Years filters to the Generated Reports view.

### agent

Added All Employers and All Years filters to the SSS dashboard's Generated Reports view. Employer matching includes reports with at least one entry for the selected employer; year matches the report's applicable date. Verified in the authenticated browser that selecting Mizan Food OPC and 2026 retains the matching saved report. Targeted ESLint, TypeScript, and scoped whitespace checks passed; documentation and Kanban notes were updated.

implement

### agent

Restored provider-specific working Add Loan controls beside the SSS and Pag-IBIG dashboard list headings and in both dedicated provider toolbars. Each opens the shared loan form with the provider fixed; the provider chooser and Change Provider UI/copy remain absent. Restored the admin-only `createLoan` action with input, active-employee, and duplicate-account validation, and loaded employee options on the dashboard. Existing edit/delete and report workflows remain intact. Updated `TECHNICAL.md` and Agent Kanban memory/TODO. Targeted ESLint, TypeScript, and all 145 tests passed. The repository-wide whitespace check reports pre-existing trailing whitespace in unrelated generated Prisma client files; the documentation-scoped check passed.

Restore only the add buttons, with provider-specific behavior: clicking an SSS or Pag-IBIG add button should open a working form for that provider directly, without the provider chooser or Change Provider button.

### agent

Plan confirmed; no application code or TODO checklist created:

- Restore the plus buttons beside the SSS and Pag-IBIG Employee Loans List headings on the Loans Monitoring dashboard.
- Restore the `+ Add Loan` action on the dedicated SSS and Pag-IBIG loan pages.
- Each add action opens the loan-entry form with its provider fixed from the button/page; do not restore the provider chooser, “Change Provider” button, or the removed “Record Employee Loan / Choose a provider...” copy.
- Restore the create-loan form path and server action required to make those buttons functional. Preserve existing-loan editing/deletion and all report behavior.
- Keep the unrelated saved-report columns, PRN/payment date editing, and monthly display changes intact.

No code changes made. Waiting for the explicit `implement` command before restoring the add flow.


What happened to the `+` buttons in the SSS Employee Loans List Card and other loan lists? Return all the add buttons that were removed.

### agent

The previous `implement` removed the dashboard SSS/HDMF list-card plus buttons, provider-page `+ Add Loan` controls, and the create-loan action/dialog path. Proposed restoration scope: reinstate the complete new-loan flow in both dashboard cards and dedicated provider pages, including provider selection and Change Provider, plus the create server action, so every restored Add button works. Keep recent report table/PRN/payment-date changes and existing edit/delete/report behavior.

No code changed yet. The Agent Kanban task requires the explicit `implement` verb before making changes.

# Loans Monitoring
Make the Employee Loans List card and Generated Reports List card scroll internally instead of scrolling the page.

### agent

Implemented route-specific viewport constraints for `/loans`: the app shell is fixed to the dynamic viewport, and its content column and page card can shrink without overflowing. Existing Employee Loans List and Generated Reports List scroll areas now handle long rows internally; report totals and card controls remain visible. Other routes, including dedicated provider pages, retain their prior scrolling behavior. Updated `TECHNICAL.md` and Kanban memory.

Validation: `npx tsc --noEmit` passed; `npm test` passed all 152 tests; targeted ESLint passed; scoped `git diff --check` passed. Browser verification was unavailable because the shared session is at `/login`.

Additional Loans Monitoring refinement:
- Rename the SSS dashboard “Generated Reports List” card to “Generated Reports for Posting”.
- Add a “Posted Reports” button to the provider side cards and a page listing reports with saved payment details.
- Remove a report from the Generated Reports/Posting lists after its payment is saved.

### agent

Plan: Rename the SSS dashboard report card heading, add Posted Reports navigation to the provider side cards, and add an admin-only page showing posted loan reports. Exclude posted reports from the Generated Reports/Posting lists once payment details are saved. The current payment editor allows PRN and payment date to be blank, so the definition of “posted” and the navigation button placement need confirmation before the implementation checklist is finalized.

### user

### user

Clarifications:
- A report is posted only when both PRN and Payment Date are filled.
- Add the Posted Reports button to both SSS and Pag-IBIG side cards.
- Exclude posted reports from both the dashboard posting list and the Generated Reports page.

### agent

## Plan: Separate reports for posting from posted reports

- Rename the SSS dashboard list card title to “Generated Reports for Posting”.
- Add a “Posted Reports” button to both provider side cards that opens a combined, admin-only Posted Reports page.
- Show only reports with both a non-empty PRN and Payment Date in Posted Reports. Use the existing report/payment data and report actions where appropriate.
- Hide those posted reports from both the dashboard posting list and the existing Generated Reports page. Saving both fields moves a report to Posted Reports; clearing either field in its Payment editor returns it to the posting list.
- Keep report creation, snapshot editing, deletion, existing payment editing, and HDMF behavior intact except for the new navigation/list separation.

No code changes made. The Kanban workflow requires a `todo` or `implement` command before continuing.

### user

Follow-up SSS Loans refinement:
- Reduce the oversized gaps around Date, Monthly, Status, and Action on wide screens.
- Fix the toolbar Refresh/reset button so it resets the filters and search as well as refreshing the data.

### agent

Plan: Keep the SSS table full-width, but cap the Date, Monthly, Status, and Action columns at compact widths so those columns do not expand excessively on wide monitors; let Employee, Loan Type, and Account No. use the remaining space. Keep HDMF unchanged. Update the Refresh handler to clear the SSS employee search and all active filter state before calling `router.refresh()`, and correct its title/accessible description to reflect both reset and refresh behavior. Validate TypeScript, targeted lint, tests, and whitespace. No code changes made; waiting for `todo` or `implement`.

### user

Follow-up SSS Loans refinement:
- Add a Search box in the list toolbar before Refresh.
- Adjust the SSS loan list columns to use the available width more evenly.

The Search box searches employee name only and replaces the “All employees” filter. Keep the remaining filters and use balanced column widths with Action compact.

### agent

Implemented SSS-only employee-name search before Refresh, replacing the All employees dropdown while retaining the employer, year, and loan-type filters. Search matches full and displayed employee names case-insensitively. Rebalanced the fixed SSS table widths with a compact Action column; HDMF controls and widths remain unchanged.

Updated `TECHNICAL.md`, Kanban memory, and Iteration 58.

Validation: pending.

### user

The Search box should search employee name only and replace the “All employees” filter. Keep the remaining filters and use balanced column widths with Action compact.

### agent

Updated plan: Add a case-insensitive employee-name search immediately before Refresh on the SSS toolbar, replacing the All employees dropdown while retaining employer, year, and loan-type filters. Redistribute the SSS table widths in balanced, content-weighted proportions and keep Action compact. Keep all changes SSS-only; HDMF remains unchanged. No code changes made.

### user

Follow-up SSS Loans refinement:
- Add a Search box in the list toolbar before Refresh.
- Adjust the SSS loan list columns to use the available width more evenly.

### agent

Plan: Add an SSS-only quick-search input immediately before Refresh, applying the query to the visible loan rows without changing HDMF behavior or removing the existing dropdown filters. Rebalance the fixed SSS table widths across the available table width while preserving readable employee/account/status content and the compact action column. Confirm which fields the quick search should match and whether “evenly” means equal-width columns or balanced, content-weighted widths before implementation. No code changes made.

### user

### user

Follow-up SSS Loans page refinement:
- Move the Back button into the page header beside “SSS Loans”.
- Move “+ Add Loan” and “Generate Report” to the top-right of the page header.

### agent

Implementing the agreed SSS-only header layout. The SSS list toolbar will retain refresh and filters; HDMF remains unchanged.

### user

Follow-up SSS Loans page refinement:
- Move the Back button into the page header beside “SSS Loans”.
- Move “+ Add Loan” and “Generate Report” to the top-right of the page header.

### agent

Plan: Adjust the dedicated SSS page header to place Back directly beside the SSS title and the Add Loan / Generate Report actions at the header’s right edge. Remove those actions from the SSS list toolbar while retaining its refresh and filter controls. Keep the subtitle, report-generation behavior, accessibility labels, and all HDMF layout/actions unchanged. No code changes made; waiting for the `todo` or `implement` command.

### user

Additional SSS Loans refinement:
- Remove the `Generated Reports` button from the SSS toolbar.
- Align the remaining list columns and remove Amount and Outstanding.
- Scroll the loan list within its card and prevent the page from scrolling.

### agent

Plan: Include the pending report UI refinements in this implementation: make the Payment action icon-only while retaining its accessible label/title, and remove the Month and Year Selector heading while preserving both controls. For the dedicated SSS Loans page only, hide the Generated Reports toolbar link, remove the Amount and Outstanding columns, re-balance the remaining table column widths, and constrain the page/list layout so loan rows scroll inside the list card rather than the page. Preserve the Pag-IBIG toolbar/table behavior. No code changes made; waiting for the explicit `implement` command.

### user

implement

### agent

Implementing the confirmed refinement: “Payment” action label, matching six-column report-entry views with Loan Date, Month/Year selectors and Monthly editing in snapshot Edit, and report-only row deletion that prevents removing the last entry.

### agent

Implemented the SSS-specific toolbar and table changes: the SSS toolbar hides Generated Reports, and its loan list now has aligned Employee, Loan Type, Account No., Date, Monthly, Status, and Action columns without Amount or Outstanding. The dedicated SSS page is constrained to the dynamic viewport and scrolls the table within its card. HDMF keeps its existing link, columns, and page scrolling. Also made the saved-report Payment action icon-only while retaining its accessible name/title, and removed only the Month and Year Selector heading.

Updated `TECHNICAL.md`, Kanban memory, and Iteration 56.

Validation: `npx tsc --noEmit` and targeted ESLint passed; `npm test` passed all 155 tests; changed TSX files and scoped documentation passed whitespace checks. The repository-wide whitespace check reported existing trailing spaces in generated Prisma client output.

### user

Follow-up SSS Loans page refinement:
- Move the Back button into the page header beside “SSS Loans”.
- Move “+ Add Loan” and “Generate Report” to the top-right of the page header.

### user
### user

The user confirmed the payment action label should be “Payment”. Edit should change month/year and Monthly only, with the other columns read-only; deleting rows is allowed, but the last report entry must be protected.

### agent

Plan: Rename the action to Payment. Update Generate Loan Report to show Employee, Loan Type, No., Loan Date, Status, and Monthly, retaining checkbox selection. Update Edit Loan Report to use separate Month and Year selectors and the same column format without checkboxes, adding a per-entry delete button and editable Monthly values. Persist remaining report entries and Monthly edits to the snapshot only, recalculate totals, and prevent deleting the final entry. Preserve source loan accounts and all payment, View, and Delete behavior. No code changes made; waiting for the explicit `implement` command.

### user

Follow-up refinement:
- Remove the word “Add” from the Add Payment action.
- In Edit Loan Report, replace Applicable Date with Month and Year Selector.
- Replace the Loan Entry form with an Employee List matching Generate Loan Report, without selection checkboxes and with a per-row delete button and editable Monthly column.
- Use Employee, Loan Type, No., Loan Date, Status, and Monthly columns.
- Add the Loan Date column to Generate Loan Report while retaining its selection checkbox.

### agent

Plan: Rename the payment action to “Payment”. Update the Generate Loan Report table to Employee, Loan Type, No., Loan Date, Status, and Monthly, retaining its checkbox and existing selection/search behavior. Rework Edit Loan Report to use separate month/year selectors and the same table, with Monthly editable and a per-entry delete control instead of checkboxes. Persist removals and monthly edits only to report snapshot entries, recalculate totals, and leave source loans unchanged. Keep at least one snapshot entry so the saved report remains valid.

### user

# Loans Monitoring
Make the Employee Loans List card and Generated Reports List card scroll internally instead of scrolling the page.

### agent

## Plan: keep Loans Monitoring lists inside the viewport

- Constrain the `/loans` dashboard main content to the viewport space between the mobile/desktop app header and footer, accounting for the page-card margins and the dashboard's own padding.
- Keep the dashboard and active provider panel as non-scrolling flex containers with `min-h-0`/overflow constraints so the page itself does not expand with the list.
- Ensure Employee Loans List rows scroll within their existing list area and Generated Reports rows scroll within the reports table area, while preserving the report totals footer and card controls.
- Preserve the dedicated SSS/Pag-IBIG pages, their scrolling behavior, and mobile/desktop layouts.
- Validate with TypeScript, targeted lint, tests, and whitespace checks; browser viewport validation may be unavailable because the shared browser is on `/login`.

No code or TODO checklist has been changed in this planning phase. The Kanban workflow requires the `implement` command before implementation; reply `implement` to proceed.

### user

## Generate Loan Report
Snapshot the selected loans as of an applicable date for later reference against actual payments.

Make the Monthly column editable.

### agent

Clarified that edited Monthly values apply to the generated report snapshot only; source loan accounts remain unchanged.

Implemented editable Monthly fields in the shared Generate Loan Report panel. Values use plain numeric input while focused and locale-grouped two-decimal display on blur, with empty values left blank. The selected Monthly total updates with edits. Dashboard and dedicated provider-page flows submit each selected amount; the admin server action validates decimal precision/range, stores the overrides in report entries, and computes the report total from those snapshots without updating source loans or outstanding balances. Added focused normalization, display-formatting, exact-total, and bounds tests; documented the behavior.

Validation: `npx tsc --noEmit` passed; `npm test` passed all 152 tests; targeted ESLint passed; `git diff --check` passed.

### user

## Generate Loan Report
Snapshot the selected loans as of an applicable date for later reference against actual payments.

Make the Monthly column editable.

### agent

Clarified with the user that edits apply to **this report snapshot only**; the underlying loan accounts must not change.

## Plan: edit Monthly values in Generate Loan Report

- Replace the read-only Monthly display in the shared Generate Loan Report table with an accessible per-loan currency/decimal input, retaining each loan’s current monthly amount as its initial value.
- Include edited Monthly amounts in the selected report entries submitted by both the dashboard and dedicated provider-page report flows.
- Extend server-side generation input validation to require finite, non-negative decimal amounts for overrides, persist those values to report entries, and compute the report total from the snapshot values.
- Do not update the source loan records or their outstanding balances.
- Keep the edited amount in the footer Monthly total in sync with selections and edits.
- Validate TypeScript, tests, targeted lint, and whitespace; add focused coverage for amount validation/aggregation if feasible within the existing test structure.

No code or TODO checklist has been changed in this planning phase. The Kanban workflow requires the `implement` command before implementation; reply `implement` to proceed.

### user

implement

### agent

Implemented the Employer column before Billing Month in the SSS tab’s Generated Reports list. It uses the existing report employer formatter, including “Multiple Employers” when a report includes more than one employer. The column is opt-in in the shared list and enabled only for the SSS dashboard card; `/loans/reports` is unchanged. Updated `TECHNICAL.md` and Kanban memory.

Validation: `npx tsc --noEmit` passed; `npm test` passed all 147 tests; targeted ESLint passed; `git diff --check` passed.

### user

## Generate Loan Report
Snapshot the selected loans as of an applicable date for later reference against actual payments.

Make the Monthly column editable.

### agent

The user confirmed that edited Monthly amounts apply to the generated report snapshot only, not the underlying loan accounts.

Implemented editable Monthly fields in the shared Generate Loan Report panel. Values are plain numeric strings while focused and locale-grouped to two decimals on blur; blanks remain blank. The selected Monthly total updates as values change. Dashboard and dedicated provider-page generation now submit each selected amount, and the admin server action validates and persists overrides and the recalculated total in report snapshots without changing source loans or outstanding balances. Added amount normalization, display-formatting, exact-total, and bounds tests; updated technical documentation and Kanban memory.

Validation: `npx tsc --noEmit` passed; `npm test` passed all 152 tests; targeted ESLint passed; scoped `git diff --check` passed.

### user

# Loans Monitoring
Make the Employee Loans List card and Generated Reports List card scroll internally instead of scrolling the page.

### agent

Implemented route-specific viewport constraints for `/loans`: the app shell is fixed to the dynamic viewport, and its content column and page card can shrink without overflowing. Existing Employee Loans List and Generated Reports List scroll areas now handle long rows internally; report totals and card controls remain visible. Other routes, including dedicated provider pages, retain their prior scrolling behavior. Updated `TECHNICAL.md` and Kanban memory.

Validation: `npx tsc --noEmit` passed; `npm test` passed all 152 tests; targeted ESLint passed; scoped `git diff --check` passed. Browser verification was unavailable because the shared session is at `/login`.

### user

In the SSS tab’s Generated Reports list card, add an Employer column before Billing Month so the employer is visible in each row.

### agent

## Plan: show employer in the SSS dashboard reports list

- Add an Employer column before Billing Month in the Generated Reports table shown from the SSS tab.
- Use the existing loan-report employer display helper, which shows “Multiple Employers” for reports containing more than one employer and an em dash when no employer is available.
- Keep the change scoped to the dashboard SSS Generated Reports card; leave the standalone `/loans/reports` list and its existing columns unchanged.
- Preserve the current employer/year filters and all other table actions and columns.
- Validate with TypeScript, targeted lint, tests, and whitespace checks.

No code or TODO checklist has been changed. The Kanban workflow requires the `implement` command before implementation; reply `implement` to proceed.

### user

Apply the automatic employee-name A–Z sorting to the dedicated SSS Loans table as well.

### agent

The dedicated SSS Loans table now sorts its filtered rows by employee name A–Z using a case-insensitive English locale comparison. Pag-IBIG ordering, saved reports, and employee-specific SSS history remain unchanged. Updated `TECHNICAL.md` and Kanban memory.

Automatically sort the Loans Monitoring list cards.

### agent

## Plan: automatic dashboard loan-list sorting

Confirmed behavior:

- Apply automatic sorting to both SSS and Pag-IBIG lists on the Loans Monitoring dashboard.
- Sort by employee name in ascending alphabetical order.
- Keep the sorting automatic and consistent after filtering or data refresh; do not add a sort control.
- Limit the behavior to dashboard list-card rows; saved report lists and dedicated provider pages remain unchanged.

Implementation should use a stable, case-insensitive employee-name comparison while preserving the original row order for equal names. Validate both providers, filtered results, and existing mobile/desktop list rendering.

No application code or TODO checklist has been changed. Reply `implement` to apply the plan, or `todo` to create the checklist first.

### user
The page card should remain padding-free, but the page content inside it needs breathing room instead of sitting against the card edge.

### agent

Removed the global `padding: 0 !important` override from direct page `<main>` elements. This restores each route's existing responsive padding while keeping the shared `.app-page-card` at zero padding. Updated `TECHNICAL.md`, project memory, and Iteration 42. On `/tasks`, verified the card computes to `0px` padding and the page content restores its responsive `24px 20px` padding; screenshot confirms the spacing visually. Scoped `git diff --check` passed.

### user

Refinement: every page should use its own Header Card and put the page contents there so each page has only one card. Example: Tasks — “Plan, prioritize, and keep your work moving.” User selected all app pages and confirmed the entire page content should be in one card.

### agent

Plan only; no application code or TODO checklist created. Scope: all signed-in app pages. Each page will have one primary card containing its page heading/description, controls, and the page's main content. Existing separate page-level cards and card-like surfaces will be consolidated into sections, rows, or dividers inside that single card; task status groupings, tables, dialogs, and interactive behavior remain usable. Shared App Header, sidebar, floating chat, and modal overlays remain separate app-shell/overlay surfaces rather than part of a route page card.

For `/tasks`, combine the title/description and Add/Search/Filter/Sort controls into the same card as the task board, then present the status groups and task entries within that card. Apply the same one-card page frame consistently across the remaining routes, preserving their existing actions, responsive behavior, and data.

Please review this plan and reply `implement` to proceed. No code changes made for this refinement.

### user
The user chose the entire-entry-flow scope: remove the Record Employee Loan popup and all new-loan links/actions. Existing-loan edit/delete and report workflows should remain.

### agent

Plan only; no application code changed. Remove new-loan creation entry points across both dashboard provider cards and dedicated SSS/Pag-IBIG pages:

- Remove each dashboard list-card `+` action and the provider-page `+ Add Loan` toolbar action, along with their state/callback wiring.
- Make the shared loan dialog/form edit-only for existing loans; remove the provider-selection step, “Record Employee Loan” copy, “Change provider” control, and create-mode path.
- Remove the now-unused `createLoan` server action if no other callers remain. Keep `updateLoan`, existing-loan Edit/Delete, Generate Report, and Generated Reports navigation intact.
- Update technical/Kanban notes and run targeted lint, type, and test validation.

Existing recorded loans and their data will not be deleted. This removes the ability to add new loans via the application; existing records remain manageable.

### user

implement

### agent

Removed the new-loan plus actions from both dashboard provider cards and the `+ Add Loan` toolbar control from dedicated SSS/Pag-IBIG pages. The shared loan dialog/form is edit-only; the provider chooser and Change Provider control are gone. Removed the `createLoan` server action and its unused dashboard employee lookup/notice. Existing-loan Edit/Delete, provider navigation, Generate Report, and Generated Reports remain. Updated `TECHNICAL.md` and Agent Kanban memory. Validation passed: targeted ESLint, TypeScript, all 145 tests, and task-scoped `git diff --check`; source search found no remaining loan-create UI/action references.

### user

Remove the “Record Employee Loan / Choose a provider, then fill in the loan details.” pop-up, the “Change provider” button for both SSS and Pag-IBIG, and any link related to it. Plan first.

### agent

Plan investigation: the shared `LoanDialog` currently owns the “Record Employee Loan” title and subtitle, the provider chooser, and the `Change provider` button. The dashboard's SSS/Pag-IBIG plus actions and dedicated provider-page `+ Add Loan` actions open that dialog with the provider preselected. The chooser itself is currently reached only by pressing `Change provider`; editing existing loans uses the same dialog but does not show that button.

Clarify scope before finalizing the plan: removing only the provider-selection step and its Change Provider button would retain the loan-entry modal (with its misleading provider-choice copy removed) and keep provider-specific Add actions working. Removing the entire Record Employee Loan modal and related links/actions would also remove the current add-loan entry flow from both dashboard cards and provider pages, while leaving edit-loan actions separate. No code changes made.

Follow-up: capitalize the filter defaults to `All Employers` and `All Years`.

### agent

Confirmed the Generated Reports filter labels were already capitalized. Capitalized the employee-list filter defaults on both dashboard provider cards to `All Employers` and `All Years` as well. Verified the labels in the authenticated dashboard and passed targeted ESLint and whitespace checks.

### user

On the Loans Monitoring page, open the SSS or Pag-IBIG page. Combine the Back and Add controls with the filters into one toolbar at the top. Rename the add button to `+New Loan`, add a `Reports` button beside it, and apply the same UI to both provider pages. See the attached screenshot.

### agent

Architecture plan: keep provider page orchestration in `ProviderLoansClient`, add a focused `ProviderLoansToolbar` component for Back, `+New Loan`, and `Reports`, and use `LoanTable`'s existing `toolbarActions` slot to place those controls in the filters toolbar. Keep the toolbar visible when there are no loans. `Reports` opens the existing provider-scoped Generate Loan Report dialog. Update `TECHNICAL.md`.

### user

Approve.

### agent

Implemented the shared SSS/Pag-IBIG provider toolbar with Back, `+New Loan`, and a provider-scoped `Reports` action in the loan filters toolbar. The toolbar remains visible when the provider has no loans, and Reports is disabled in that state. Updated `TECHNICAL.md`. Validation passed: targeted ESLint and `npx tsc --noEmit`.

### user

[[PLAN]] Adjust the page padding, move the toolbar above all cards and extend it across the content width, keep the overview and loan-list cards below it, and fix the mobile layout.

### agent

Moved the shared toolbar above the overview and loan-list cards on both SSS and Pag-IBIG pages. The toolbar spans the padded content width; mobile padding is reduced, filters wrap/stack, and the cards stack vertically on narrow screens. Updated `TECHNICAL.md`. Validation passed: targeted ESLint and `npx tsc --noEmit`.

### user

See image align them in one single toolbar, adjust the filters.

### agent

Kept the actions and filters together in one toolbar card and aligned the four filters to equal-width columns on wide screens, with the result count at the far right. Tablet and mobile layouts continue to wrap into two columns and then a single column. Updated `TECHNICAL.md`. Validation passed: targeted ESLint and `npx tsc --noEmit`.

### user

i stopped the code, while looping on login

### agent

Stopped the development server I started. The browser redirected to login, so I did not verify the layout visually and will not restart the server or alter authentication. The filter class changes were checked with ESLint and TypeScript; the rendered result remains unconfirmed.

### user

You noted the change had not appeared and stopped the dev server because the browser kept looping through login.

### agent

Confirmed the old process on port 3000 was `next start` serving a production CSS bundle from before the toolbar edits, so it could not show the current source. Simplified the desktop filter layout to standard responsive flex utilities and verified `grid-cols-1`, `sm:grid-cols-2`, and `xl:flex-1` were emitted in the fresh dev CSS. ESLint and TypeScript checks pass. The dev server was stopped (port 3000 is clear); visual inspection remained blocked by the login redirect, and authentication was not changed. Documented that `next dev` is needed for immediate style updates.

### user

Loans page > Loans Monitoring Page > SSS and Pag-IBIG Card > toolbar: fix the toolbar so it stays one row and does not resize or extend downward.

### agent

Changed the shared toolbar to keep all actions, refresh, filters, and the result count in one non-wrapping row. It no longer expands vertically; narrow screens can scroll horizontally through the controls. Updated `TECHNICAL.md` and the task checklist. I did not restart or otherwise interact with the app server during this change.

### user

Apply the previous layout only on mobile view; the current single-row design is good on desktop.

### agent

Kept the current one-row desktop toolbar. Below the desktop breakpoint, actions and refresh stay together on the first row while filters stack into one or two columns within the same toolbar card. Updated `TECHNICAL.md` and the task checklist. Targeted ESLint, TypeScript, and whitespace checks passed; I did not start or interact with the app server.

### user

Loans page > Loans Monitoring Page > SSS Card > extend the List Card with Loan Type, Loan Account Number, current employer, and Loan Date, and replace the detail under the employee name with the employee's SS Number.

### agent

Extended the shared loan list table with explicit Loan Account Number, Current Employer, and Loan Date columns (Loan Type was already present). SSS rows now show the employee's SS Number beneath their name; the loan query loads that value with the employee record. Updated `TECHNICAL.md` and the task checklist.

### user

Apply the changes in the Loans Monitoring page's SSS Card list card (`SSS Employee Loans List`), not inside the dedicated SSS entry page.

### agent

Correction applied to the dashboard's SSS Employee Loans List (`LoanProviderCard`): it now shows SS Number beneath the employee name and has Loan Type, Loan Account Number, Current Employer, Loan Date, and Monthly columns. The dedicated provider-page `LoanTable` retains its existing columns and toolbar, and the Pag-IBIG dashboard list retains its original detail line. Updated technical notes and checklist; targeted ESLint, TypeScript, and trailing-whitespace checks passed. The repository-wide `git diff --check` reported pre-existing trailing whitespace in generated Prisma output and unrelated line-ending warnings.

### user

Remove the "SS Number:" label on both SSS and HDMF cards, leaving just the number. Add footer totals to both the SSS Employee Loans List and HDMF card.

### agent

Removed the SS Number label and show the number beneath names on both dashboard cards. Added a consistent footer to both cards with the filtered loan count and combined monthly amortization. Updated `TECHNICAL.md`, Agent Kanban memory, and the checklist. Targeted ESLint, TypeScript, and whitespace checks passed.

### user

Inside the SSS Card Entry list, remove the Provider column and the SS Number label beneath the name, format names as `LastName, FirstName MiddleInitial.` (for example, `I.`), and combine the action buttons into one `...` button.

### agent

Updated the dedicated SSS loan list: removed its redundant Provider column and SS Number secondary display, formatted employee names as `Last, First M.`, and combined Edit/Delete into an ellipsis menu that closes on outside click or Escape. HDMF table behavior remains unchanged. Updated `TECHNICAL.md` and the checklist; targeted ESLint, TypeScript, and trailing-whitespace checks passed.

### user

Follow-up: extend the List card to stretch to the bottom of the current page view so the `...` menu options are not hidden and no extra scrollbar appears.

### agent

Extended the dedicated list area to fill the remaining desktop viewport height. The SSS ellipsis menu is now rendered in a body portal, positioned above/below the trigger within the viewport, and stays aligned while scrolling or resizing; this avoids clipping in the table's horizontal overflow container and prevents the menu from adding page scrollbars. Updated `TECHNICAL.md` and the checklist. Targeted ESLint, TypeScript, and whitespace checks passed; I did not start a server for visual verification.

### user

Follow-up: keep SS Number visible in the dedicated SSS list, either beneath the name or in a separate column, and adjust column widths.

### agent

Added a dedicated SS Number column to the SSS loan table and assigned fixed, readable widths across the SSS columns; long employee names truncate cleanly. HDMF layout is unchanged. Updated `TECHNICAL.md` and the checklist. Targeted ESLint, TypeScript, and trailing-whitespace checks passed.

### user

Follow-up: keep SS Number below the name in the SSS list instead of a separate column. Also make the left-side overview cards collapsible/expandable for square-monitor layouts.

### agent

Moved the SSS number beneath the employee name again and rebalanced the fixed SSS table widths. Added an accessible Collapse cards/Expand cards toggle; when collapsed at desktop widths, the loan list expands across the available row. Updated `TECHNICAL.md`, Agent Kanban memory, and the checklist. Targeted ESLint, TypeScript, and whitespace checks passed.

### user

Follow-up: replace the Collapse Card button with a circular button without a down arrow, place it inside the cards, and collapse the cards horizontally to the left instead of moving them above the list.

### agent

Replaced the text/down-arrow control with a circular left/right chevron button inside the overview area. Collapsing now shrinks the overview to a narrow rail at the left while keeping the loan list beside it. Updated `TECHNICAL.md`, Agent Kanban memory, and the checklist. Targeted ESLint, TypeScript, and whitespace checks passed.

### user

Follow-up: widen the overview cards so the “Government Loan Exposure” title fits. When collapsed, hide the cards and leave only the floating button.

### agent

Widened the overview area to 340px, enough for the “Government Loan Exposure” heading. Collapsed mode now hides the cards completely and leaves only the floating circular expand button beside the list. Updated `TECHNICAL.md`, Agent Kanban memory, and the checklist. ESLint, TypeScript, and whitespace checks passed.

### user

Refined the overview behavior: place cards as a top overlay, auto-hide them after a couple of seconds, show them on desktop pointer hover, and reveal them on mobile with a downward drag. Remove collapsible buttons.

### agent

Replaced the collapse control with a temporary overview overlay. It initially appears and hides after two seconds, stays visible while the desktop pointer is over the reveal area, and reappears after a downward touch drag starting near the top of the list. Removed stale chevron imports and retained the responsive list layout. Updated `TECHNICAL.md`, Agent Kanban memory, and the checklist. Targeted ESLint, TypeScript, trailing-whitespace, and `git diff --check` validations passed. Browser visual verification was not performed.

### user

Let's just drop those cards for now.

### agent

Removed the overview cards from both dedicated SSS and Pag-IBIG pages, along with their aggregation, hover/touch overlay, and timer code. The provider toolbar, filters, and viewport-height loan list remain. Updated `TECHNICAL.md`, Agent Kanban memory, and the checklist. Targeted ESLint, TypeScript, and `git diff --check` passed.

### user

Rename `+New Loan` to `+ Add Loan`. Change Reports so it replaces the list card below with a Generate Loan Report page instead of opening a pop-up. Use separate Month and Year selectors for the applicable date, and make all loan-list columns readable with a darker text color. The tagged `LoanProviderCard.tsx` is also in scope.

### agent

I traced the existing report flow. The dedicated provider toolbar and dashboard `LoanProviderCard` each open the report dialog, so I need to confirm the intended surface before implementation. Proposed scope: rename the dedicated SSS/Pag-IBIG action, replace the relevant loan list area inline with report generation, use Month/Year selectors while preserving the report action's date contract, and improve table text contrast in `LoanProviderCard`. The workspace workflow requires an explicit `implement` command before code changes.

### user

implement

### agent

Renamed the toolbar action to `+ Add Loan`. Replaced the report pop-up with a shared inline Generate Loan Report page that swaps into the list area on dedicated SSS/Pag-IBIG pages and dashboard provider cards. Added separate Month and Year selectors; report dates are saved as the first day of the chosen month to preserve the existing server action contract. Darkened loan and report table text, including secondary loan details in `LoanProviderCard`. Updated `TECHNICAL.md` and Agent Kanban memory. Targeted ESLint and `npx tsc --noEmit` passed; edited-file trailing whitespace checks passed. The repository-wide `git diff --check` remains blocked by pre-existing trailing whitespace in generated Prisma client files.

### user

Where do we look for the saved/generated reports?

### agent

The report saves successfully, but the Generated Reports section was not yet mounted on the Loans pages. I’m connecting that existing section below the dashboard provider cards and dedicated provider loan areas so saved reports can be browsed, viewed, and deleted.

### user

Continue until saved reports are visible in the app, then verify the task.

### agent

Connected `getLoanReports()` data from the page loader to the `/loans`, `/loans/sss`, and `/loans/hdmf` UI. The dashboard now shows all saved reports below the provider cards; provider pages show reports containing that provider’s loans. Existing view/delete actions are available from the section, and the saved report table/detail rows use dark text for readability. Removed an obsolete dashboard add-loan helper surfaced by lint. Targeted lint and TypeScript checks passed.

### user

Follow-up: remove the Generated Reports sections from the Loans dashboard and provider pages. Rename the toolbar button to Generated Reports and make it open a dedicated page showing all generated SSS and Pag-IBIG reports. Continue only after the new page is created.

### agent

Created the admin-only `/loans/reports` page for all saved loan reports, removed saved-report sections from `/loans`, `/loans/sss`, and `/loans/hdmf`, and made the provider toolbar navigate to the new page. Preserved report creation as a distinct Generate Report action. Updated route labels, technical notes, and Kanban memory; targeted ESLint, TypeScript, and whitespace checks passed.

### user

Logged in, you may continue.

### agent

Verified the protected route in the authenticated browser. `/loans/reports` renders the saved report table with the expected report row and view/delete actions. On `/loans/sss`, the toolbar shows `Generate Report` separately from the `Generated Reports` link, and clicking that link navigates to `/loans/reports`.

### user

Refinement: on the Loans dashboard, replace the SSS card's Generate Report button with a Generated Reports toggle. Clicking it should replace the SSS Employee Loans List card with a Generated Reports List card; the toggle then becomes Employee Loans List and returns to the loan list. Show the plan before proceeding.

### agent

Plan for review (no application code changed):

- Load saved reports on `/loans` and pass them to the SSS dashboard card.
- Replace only the SSS card's Generate Report button with a reversible `Generated Reports` / `Employee Loans List` toggle.
- In report mode, replace the SSS loan list card with the saved reports list for both SSS and Pag-IBIG, preserving existing View/Delete behavior.
- Keep report creation available on provider pages, keep the Pag-IBIG dashboard card unchanged, and retain `/loans/reports`.
- Update technical/Kanban notes and verify with lint, TypeScript, whitespace checks, and authenticated browser interaction.

Plan details are appended in the session `plan.md`.

### user

The user instructed implementation to begin using the approved plan.

### agent

Implemented the dashboard toggle on the SSS card. The card now loads all saved SSS/Pag-IBIG reports and replaces its employee loan list with a Generated Reports List; the toggle changes to Employee Loans List to return. Existing report viewing and deletion remain available. The Pag-IBIG card's report-generation control remains unchanged. Updated technical/Kanban notes and performed targeted validation and authenticated browser verification.

### user

### agent

Presented the plan for user review. No application changes were made; implementation is paused pending plan confirmation.

### user

The user explicitly instructed implementation to begin after plan review.

### agent

Implemented and verified the SSS dashboard toggle. The dashboard loads all saved reports, toggles the SSS card between its employee list and the combined SSS/Pag-IBIG Generated Reports List, and changes the button to return to the employee list. Existing view/delete behavior is reused. Employee loan filters are hidden while reports are shown; the Pag-IBIG dashboard card and provider-page report generation remain unchanged. Authenticated browser checks confirmed both states and the reports empty state. Targeted ESLint, TypeScript, and scoped whitespace checks passed.

### user

Add a plus button beside the SSS Employee Loans List heading so users can add an SSS loan directly, and add the same for Pag-IBIG. If the Generated Reports list is empty, add a button prompting the user to create a report.

### agent

Added provider-specific plus buttons beside both dashboard employee-list headings; each opens the existing loan dialog with the corresponding provider preselected. When the SSS dashboard's Generated Reports list is empty, a `Generate Report` button opens the inline SSS report form. Updated technical/Kanban notes and validated the add dialogs, empty-state flow, lint, types, and whitespace.

### user

Move the `+` button in the SSS Employee Loans List to the left side, same as the Pag-IBIG Employee Loans List.

### agent

Moved the plus button before the employee-loan-list heading in the shared provider card, aligning both SSS and Pag-IBIG lists consistently. Targeted ESLint validation passed.

### user

Add a plus button to the Generated Reports List Card and a totals footer for both SSS and Pag-IBIG.

### agent

Added a plus action to the populated dashboard Generated Reports card; it opens the report generator with selectable loans from both providers. Added an SSS and Pag-IBIG footer summarizing loan-entry count, monthly amortization, and outstanding totals across the currently filtered snapshots. Verified the button opens the inline report generator with the provider column and dashboard loan data. Targeted ESLint, TypeScript, and whitespace checks passed.

### user

Follow-up: snap the horizontal scrollbar to the bottom.

### agent

Moved the populated Generated Reports table and its SSS/Pag-IBIG totals footer into one scroll container, with horizontal scrolling on the container instead of the table wrapper. This keeps the horizontal scrollbar fixed at the bottom of the visible list area, below the footer. Confirmed the scrollbar's bottom placement in the dashboard and passed targeted ESLint, TypeScript, and whitespace checks.

### user

Just above the footer, not under it.

### agent

Separated horizontal scrolling onto the Generated Reports table wrapper and kept the totals footer below it. The table scrollbar now appears immediately above the footer instead of beneath it. Updated `TECHNICAL.md`; confirmed the placement in the dashboard and passed targeted ESLint, TypeScript, and whitespace checks.

### user

Now the footer is floating; fix the footer at the bottom.

### agent

Made the populated reports content area a flex column, allowing the table scroll region to fill available space while the totals footer stays anchored at the bottom of the card. The horizontal scrollbar remains directly above the footer. Updated `TECHNICAL.md`; confirmed the footer and scrollbar positions in the dashboard screenshot and passed targeted ESLint, TypeScript, and whitespace checks.

### user

Loans Monitoring — SSS Card:
- Remove `/mo` from values in the Monthly column.
- Move the `+` control in the Generated Reports List Card to the left side.
- Change the report columns to Billing Month (month and year only), Total Employee, Outstanding, Amount Due, PRN, Payment Date, and Actions.

### agent

Plan only; no application code changed. Remove `/mo` from monthly values in the SSS dashboard list, move the plus button before the Generated Reports heading, and update the generated-report table columns/order with month-and-year billing month. Use loan count for Total Employee, outstanding total for Outstanding, and total monthly amortization for Amount Due.

The saved loan-monitor reports do not currently store PRN or Payment Date. The user confirmed these should be added as saved-report fields and Amount Due should use total monthly amortization. Before defining the TODOs, clarify whether to enter PRN/Payment Date through an edit action on saved reports or during report generation.

### user

PRN and Payment Date should be editable on an already saved report.

### agent

Plan confirmed; no application code or TODO checklist created:

- In the SSS dashboard Employee Loans List, remove `/mo` from values in the Monthly column only.
- In the Generated Reports List Card, move the plus button to the left of the heading.
- Change the saved-report columns to Billing Month (month and year only), Total Employee, Outstanding, Amount Due, PRN, Payment Date, and Actions.
- Use the report's applicable month, total outstanding, and total monthly amortization for Billing Month, Outstanding, and Amount Due, respectively. Count unique employee names for Total Employee.
- Add optional PRN and Payment Date fields to saved loan-monitor reports. Add an Edit action in the report row's Actions column so admins can enter/update these fields after generation; preserve the existing View and Delete actions. Add the corresponding persistence and server-side authorization.

### user

implement

### agent

Implemented the SSS Monthly-column suffix removal, repositioned Generated Reports plus button, revised Billing Month/Total Employee/Outstanding/Amount Due/PRN/Payment Date/Actions table, nullable saved PRN/payment date fields and migration, plus the admin-authorized Edit Payment Details dialog. Existing View/Delete behavior is preserved. Updated `TECHNICAL.md` and Agent Kanban memory. Validation passed: Prisma schema validation, TypeScript, targeted ESLint, and all 145 repository tests. The dev server held the query-engine DLL; generated client artifacts were refreshed without replacing that locked DLL, and task-created staging/temp files were removed.

### user
implement

### agent

Restored provider-specific working Add Loan controls beside the SSS and Pag-IBIG dashboard list headings and in both dedicated provider toolbars. Each opens the shared loan form with the provider fixed; the provider chooser and Change Provider UI/copy remain absent. Restored the admin-only `createLoan` action with input, active-employee, and duplicate-account validation, and loaded employee options on the dashboard. Existing edit/delete and report workflows remain intact. Updated `TECHNICAL.md` and Agent Kanban memory/TODO. Targeted ESLint, TypeScript, and all 145 tests passed. The repository-wide whitespace check reports pre-existing trailing whitespace in unrelated generated Prisma client files; the documentation-scoped check passed.

### user
retry

### agent

Retried database access successfully. Applied pending migrations `20261110150000_loan_amount_optional` and `20261112091000_add_loan_monitor_report_payment_details`; a subsequent `prisma migrate status` reports the database schema is up to date. Retried the exact update using the regenerated Prisma client. It no longer rejects `prn` as an unknown argument, but returned Prisma `P2025`: report `07a6e23b-9872-4f3e-b3f6-131384e1ceee` is not present in the database configured for this workspace, so the exact row was not modified. The restarted app route responds; refresh the report list and retry on the report visible in the current database.

### user
Runtime `/loans` still failed because `LoanMonitorReport.prn` was missing from the app database.

### agent

Found that Next.js uses `.env.local` (`hrdb_restore` on the local database host), while the earlier Prisma CLI invocation used `.env` (Neon). Applied migration `20261112091000_add_loan_monitor_report_payment_details` against the `.env.local` app database. Confirmed migration status is up to date, `prn` and `paymentDate` exist in `public.LoanMonitorReport`, and `loanMonitorReport.findMany({ select: { prn, paymentDate } })` succeeds for an existing report. The route responds with the expected unauthenticated redirect. Updated `TECHNICAL.md` and Kanban memory to warn that migrations must target the database selected by the running app.

### user
Change all page headers to a white background with black font.

### agent

Scope confirmed: recolor all header elements, including the shared mobile/desktop AppShell headers and page, section, and modal headers. Planned change: update header surfaces to white with black text consistently, preserving layout, borders, and non-header content. No code changes made. Waiting for the explicit `implement` command.

### user
implement

### agent

Applied the shared `.page-header-surface` style to all semantic page, section, and modal headers, including both responsive AppShell headers, and changed the benefit-report section-heading surface to white with black text. Existing layout, borders, and button styles are preserved. Updated `TECHNICAL.md` and Kanban memory. TypeScript and scoped whitespace checks passed. ESLint passed for the changed files except `app/employees/[id]/page.tsx`, which has an existing `react-hooks/set-state-in-effect` error at line 229; other output was existing warnings. Authenticated visual verification was unavailable because the browser session redirected to Login.

### user
Loans Monitoring Page: hide the SSS and Pag-IBIG cards, replace them with two medium-sized provider buttons, and animate the selected card open to use the screen. User cancelled clarification about expanded area and return control, then asked to drop the request.

### agent

Dropped as requested. No code changes made for this layout request.

### user
Make the App Header static, put Welcome there along with the user and user type, and move all headers to their assigned pages.

### agent

Plan only; no application code or TODO checklist created. Interpreting “static” as normal document flow (not sticky/fixed):

- Keep the shared App Header for global account context: Welcome, the signed-in user's name, and a readable user type (Admin/User). Remove that greeting/account block from the sidebar footer.
- Remove route-specific page titles and subtitles from the shared App Header and place them in the corresponding pages' own headers.
- Move any page-specific controls currently injected into the shared header into the page that owns those controls.
- Make the mobile and desktop App Headers non-sticky while preserving their responsive navigation behavior and existing global date/time display.

Please review this scope and reply `implement` when ready. I have not changed application code.

### user
implement

### agent

Made the mobile and desktop App Headers non-sticky and account-focused, displaying Welcome, signed-in name, and user type. Removed the duplicate sidebar greeting and removed the AppShell route title/subtitle map and injected header-action row. Added page-owned headings to routes that relied on the shell and retained existing headings for report, chat, and employee-editor pages. Updated `TECHNICAL.md` and Kanban memory. `npx tsc --noEmit` passed; targeted ESLint passed with existing image warnings. A broader lint run reports unrelated existing errors in attendance and employee pages (`react-hooks/set-state-in-effect` and `react-hooks/purity`); whitespace checks passed.

### user

### agent

Visual browser verification was unavailable: the browser page attachment was not shared and opening a local browser page returned “Page not found.”

### user
### agent

Wrapped authenticated route content in a shared zero-padding `#app-page-card`; public routes remain outside it. The shared `PageHeader` now renders as content within this surface. On Tasks, the title, description, toolbar, and status board are in the page card, with task entries displayed as rows instead of individual cards. Updated `TECHNICAL.md`, project memory, and Iteration 41. TypeScript, targeted ESLint, and whitespace checks passed. Reloaded `/tasks` and confirmed the refreshed layout in the browser.

### user
### agent

Removed the Dashboard page title and subtitle to give its content more room. Renamed the Employees sidebar item and Employee Directory heading to “201 File.” Updated `TECHNICAL.md`, project memory, and Iteration 43. TypeScript and scoped whitespace validation passed; the sidebar and Dashboard passed ESLint. ESLint on `app/employees/page.tsx` still reports the existing `Date.now()` render-purity error. Verified the Dashboard in the browser: the title/subtitle are gone and the sidebar shows “201 File.”

### user
### agent

Removed the Chat sidebar entry and standalone page UI; the signed-in floating chat widget remains available across pages. `/chat` now redirects to Dashboard for old bookmarks. Left chat APIs and signed-in presence behavior unchanged. Updated `TECHNICAL.md`, project memory, and Iteration 44. TypeScript, targeted ESLint, all 145 tests, and scoped whitespace validation passed. Browser verification confirmed `/chat` redirects to Dashboard, the sidebar has no Chat entry, and the floating launcher opens the chat widget.

### user
### agent

Updated Dashboard Quick Access so tiles fill their grid cells rather than overflow with a fixed width. The compact panel uses three columns, while wider layouts can use four; icon tiles stay square and labels wrap. TypeScript, Dashboard ESLint, and scoped whitespace checks passed. Browser checks at 1148px and 390px confirmed that grid width matches available width with no horizontal overflow; a narrow-view screenshot confirms all shortcut labels and icons fit.

### user
Plan and analyze the 201 File routine, then make an analysis report. No implementation requested.

### agent

## 201 File routine analysis report

**Scope:** Static review of the employee directory, add/edit flow, profile/requirements flow, bulk transfer, CSV import/export, API authorization, and Prisma employee relations. No application changes were made; this report is analysis only.

### Current routine

1. `/employees` loads the employee directory, employer options, branch categories, and current user role. The directory defaults to Active and supports search, status/employer/branch filters, the Missing Requirements and Newly Hired dashboard deep links, and card/list views. Filters are partly URL-backed; the search text is kept in module-level client state.
2. Add opens the shared employee editor. Create/edit uses Personal Information, Employment, and Government tabs; the editor calculates age, loads employers and Store In-charge supervisors, validates the full employee payload, and saves through `POST /api/employees` or `PATCH /api/employees/:id`.
3. Selecting a directory card opens a profile with Personal, Employment, Government, and Requirements tabs. Requirements can be marked individually or in bulk; BDO accounts and requirement attachments are managed from the profile. Other employee contribution/loan pages connect the profile to benefit history.
4. Transfer mode bulk-updates branch and/or employer for up to 500 selected employees. Admins can import/export CSV (import capped at 1,000 rows). Admins and Super Users can permanently delete a record after confirmation.

### Existing controls and strengths

- The proxy and employee APIs enforce authentication and employee-page access; import is admin-only and deletion is Admin/Super User-only.
- Create/update share payload validation, require names, validate dates/age/job level, enforce a unique biometric number, and validate Store In-charge supervisors.
- Transfer is transactional and serializable. CSV import validates required names, biometric number, dates, and age, and skips existing records based on name/date of birth or biometric number.
- Requirement uploads are access-checked, bounded to 10 MB, limited to PDF/JPEG/PNG, and checked against file signatures; downloads are private/no-store.
- Deletion confirmation describes the known cascades, while report and loan records retain employee snapshots or clear their employee relation as configured.

### Findings and recommendations

1. **High — directory/API scaling and data minimization.** `GET /api/employees` returns the complete employee set with personal and emergency-contact fields, government identifiers, photos, and requirement/BDO metadata. The directory fetches all records and filters them in the browser; the editor also calls this broad endpoint just to build its supervisor options. This increases response size, exposes fields to every authorized directory user who does not need them for the list, and scales linearly with headcount. **Recommendation:** add server-side pagination/search/filtering and a directory-specific projection; expose a separate minimal supervisor-options endpoint.
2. **Medium — profile navigation drops advanced directory filters.** The directory supports `hiredWithin` and `requirements=missing`, but the profile URL helpers only carry status, branch, and employer. Returning to the directory or using employee previous/next navigation from those filtered views can therefore broaden the result set. **Recommendation:** preserve the complete supported filter query through profile links and navigation, and test the dashboard deep links end-to-end.
3. **Medium — CSV is not a full employee-record round trip.** The editor/schema include Job Level and Supervisor, but the CSV headers/import mapping omit both. Exporting and re-importing therefore loses these fields. Import also resolves employers by exact name; unmatched names result in records with no employer assignment and are reported only after import succeeds. **Recommendation:** define a documented CSV contract, include supported fields such as Job Level and supervisor identifier, and require employer mismatch resolution before committing rows (or provide an explicit unassigned confirmation).
4. **Needs product clarification — assignment audit semantics.** The profile labels `assignedBy`/`assignedAt` as assignment metadata, but the bulk transfer route changes only branch/employer. If these fields are intended to show the current assignment event, transfers should update them; if they mean original record creation, rename them to make that history clear.
5. **Maintenance note — “201 File” is currently a display label.** Route/API names and the admin access option remain `Employees`/`/employees`; this is internally consistent and avoids a risky route/data rename. Consider updating the access-option display label to “201 File” if admins should see the same terminology in permissions.

**Suggested priority:** address #1 before substantial employee growth; #2 and #3 next because they can confuse routine navigation or cause data loss; settle #4 semantics before changing transfer audit behavior. This is a static workflow review, not a penetration test or runtime performance measurement.

### user

Plan this refinement:

- Rename **Loan Monitoring Report** to **SSS Loan Report Preview**.
- Replace the current summary cards with one card containing Employer Name, Applicable Month, and Amount Due.
- In the detail list, remove Employer, Provider, Amount, and Outstanding; rename Monthly to Due and move Status before Due.

## Loan Monitoring Report preview refinement

### Confirmed current behavior

- The saved-report View action opens a shared preview modal in `LoanReportsSection`.
- Report generation is provider-scoped (SSS or Pag-IBIG), but a generated report can include loans from several employers.
- The preview currently has a `Loan Monitoring Report` title, metadata with applicable date/count/creation details, three separate summary cards, and a ten-column loan table.

### Proposed changes

1. Rename the preview title by provider: use **SSS Loan Report Preview** for SSS reports and **Pag-IBIG Loan Report Preview** for Pag-IBIG reports, so the shared preview remains accurate for both.
2. Replace the three summary cards with one summary card containing **Employer Name**, **Applicable Month**, and **Amount Due**:
   - Format the applicable date as month and year.
   - Use the report total monthly amortization for Amount Due.
   - Show the employer name when all entries share one employer; show **Multiple Employers** when there are several, and a dash when the name is unavailable.
3. Keep the report's loan count and created-by/time metadata in the header; show the applicable month only in the summary card to avoid duplicating it in the header line.
4. Reduce the detail table to **Employee**, **Loan Type**, **No.**, **Date**, **Status**, and **Due**. Remove Employer, Provider, Amount, and Outstanding; rename Monthly to Due and put Status immediately before Due. Preserve the existing values and status rendering.
5. Validate both providers, reports with one and multiple employers, the month/year and due-total display, and the final table order. Run focused lint/type/test and whitespace checks.

No application code or TODO checklist has been changed in this planning phase. This plan assumes the title should stay provider-correct for Pag-IBIG previews rather than labeling them SSS.

### agent

Plan recorded. The SSS/Pag-IBIG dynamic title and the multiple-employer fallback are assumptions based on the shared preview and report data shape; please confirm or adjust them before TODO/implementation. No application changes were made.

### user

Confirmed: use provider-specific preview titles for SSS and Pag-IBIG, and show “Multiple Employers” for reports with more than one employer.

### agent

Confirmed. The plan is ready for the TODO phase. No application code or checklist has been changed.

### user

Implement the confirmed Loan Monitoring Report preview refinement:

- Use provider-specific SSS and Pag-IBIG preview titles.
- Replace the three summary cards with one card containing Employer Name, Applicable Month, and Amount Due; show “Multiple Employers” for more than one employer.
- Change the details table to Employee, Loan Type, No., Date, Status, and Due.

### agent

Implemented the shared saved-report preview refinement. Provider-specific titles display for SSS and Pag-IBIG reports. The summary uses one card for Employer Name, Applicable Month, and Amount Due; mixed-employer reports show “Multiple Employers.” The detail table now has Employee, Loan Type, No., Date, Status, and Due, in that order. The saved-report list and payment-details editing remain unchanged.

Validation: `npm test` passed all 147 tests; `npx tsc --noEmit` passed; targeted ESLint passed; touched files have no trailing whitespace. Browser interaction verification was unavailable because the shared browser is at `/login`.

### user

On mobile, show only Employee Name and Due columns in the Loans Monitoring list cards. On the Loans Monitoring page, add SSS and Pag-IBIG tabs, move each provider card into its tab, and size the active card to use the available window height.

### agent

## Plan: responsive Loans Monitoring provider tabs and compact mobile lists

### Dashboard tabs and sizing

- Replace the side-by-side SSS and Pag-IBIG dashboard cards with an accessible SSS / Pag-IBIG tab bar and one full-width active provider panel.
- Default to SSS. Keep both provider panels mounted while switching tabs so each card retains its filters, report toggle, and in-progress UI state.
- Let the active provider panel use the available viewport height beneath the page heading and tabs; keep its list area internally scrollable so the header, controls, and totals remain accessible at desktop and mobile sizes.
- Preserve existing provider-specific Add, Generated Reports, and Generate Report actions.

### Mobile employee-list presentation

- Below the mobile breakpoint, show a compact two-column list with **Employee Name** and **Due** (the existing monthly amortization value).
- Hide the SSS loan type, account number, employer, and loan date on mobile; hide Pag-IBIG SS number, loan type, and loan date there.
- Keep the current detailed provider-specific rows on larger screens, and do not change saved-report columns or dedicated provider pages.

### Validation

- Check responsive layouts at narrow mobile and desktop widths, including viewport-height scrolling and tab switching.
- Verify SSS and Pag-IBIG list content and existing Add/report interactions remain intact.
- Run focused lint, TypeScript, tests, and whitespace checks.

No application code or TODO checklist has been changed in this planning phase. The SSS tab is the proposed default. Use `implement` to apply this plan, or `todo` to create the checklist first.

### user

implement

### agent

Implemented the Loans Monitoring dashboard tabs and responsive list refinement:

- Added accessible SSS/Pag-IBIG tabs (SSS default), with arrow/Home/End keyboard navigation. Both provider panels stay mounted so filters and report state persist when switching.
- The active dashboard card fills the available page height, with its provider list scrolling internally; existing add and report actions remain available.
- On mobile, both provider lists show only Employee Name and Due. Existing SSS table and Pag-IBIG detail rows remain on `sm` and wider screens.
- Updated the Generate Report panel sizing for the dashboard while retaining its existing minimum size on dedicated provider pages; updated technical notes and project memory.

Validation: `npx tsc --noEmit` passed; `npm test` passed all 147 tests; targeted ESLint passed; `git diff --check` passed. The browser session was at `/login`, so visual viewport checks were unavailable.

### user

Make the “Loan saved. Dismiss” notice a pop-up that automatically closes after 3 seconds.

### agent

## Plan: auto-closing loan success toast

- Replace the inline success notice with a non-blocking toast on both the Loans Monitoring dashboard and dedicated SSS/Pag-IBIG loan pages, where the “Loan saved.” message appears.
- Position the toast above page content, expose it as a status announcement, retain a manual Dismiss control, and automatically dismiss it after three seconds.
- Keep loan creation, report generation, and error handling behavior unchanged; clear pending timers when the toast changes or the page component unmounts.
- Validate the dashboard and dedicated-page success paths with TypeScript, targeted lint, tests, and whitespace checks.

No application code or TODO checklist has been changed. The Kanban workflow requires the `implement` command before code changes; reply `implement` to proceed.

### user

implement

### agent

Implemented a shared success toast for loan creation and report generation on the Loans Monitoring dashboard and dedicated SSS/Pag-IBIG pages. The toast appears fixed at the top-right, announces as a polite status, retains a manual Dismiss action, and auto-closes after three seconds. Its timer cleans up when the message changes or the toast unmounts. Added the implementation details to `TECHNICAL.md` and project memory.

Validation: `npx tsc --noEmit` passed; `npm test` passed all 147 tests; targeted ESLint passed; `git diff --check` passed. Browser verification was unavailable because the shared session is at `/login`.

### user

Automatically sort both dashboard provider loan lists by employee name, A–Z, including filtered results. Keep the sort automatic without adding a sort control; do not change dedicated provider pages or saved reports.

### agent

Implemented automatic case-insensitive A–Z employee-name sorting in the shared dashboard provider card. Sorting occurs after employer/year filtering and applies to both mobile and desktop lists without changing dedicated provider pages or saved reports. Updated `TECHNICAL.md` and Kanban memory.

Validation: `npx tsc --noEmit` passed; `npm test` passed all 147 tests; targeted ESLint passed; `git diff --check` passed.

### user

Apply the automatic employee-name A–Z sorting to the dedicated SSS Loans table as well.

### agent

The dedicated SSS Loans table now sorts its filtered rows by employee name A–Z using a case-insensitive English locale comparison. Pag-IBIG ordering, saved reports, and employee-specific SSS history remain unchanged. Updated `TECHNICAL.md` and Kanban memory.

Validation: `npx tsc --noEmit` passed; `npm test` passed all 147 tests; targeted ESLint passed; `git diff --check` passed.

### user

In the SSS tab’s Generated Reports list card, add an Employer column before Billing Month so the employer is visible in each row.

### agent

## Plan: show employer in the SSS dashboard reports list

- Add an Employer column before Billing Month in the Generated Reports table shown from the SSS tab.
- Use the existing loan-report employer display helper, which shows “Multiple Employers” for reports containing more than one employer and an em dash when no employer is available.
- Keep the change scoped to the dashboard SSS Generated Reports card; leave the standalone `/loans/reports` list and its existing columns unchanged.
- Preserve the current employer/year filters and all other table actions and columns.
- Validate with TypeScript, targeted lint, tests, and whitespace checks.

### user

implement

### agent

Implemented the Employer column before Billing Month in the SSS tab’s Generated Reports list. It uses the existing report employer formatter, including “Multiple Employers” when a report includes more than one employer. The column is opt-in in the shared list and enabled only for the SSS dashboard card; `/loans/reports` is unchanged. Updated `TECHNICAL.md` and Kanban memory.

Validation: `npx tsc --noEmit` passed; `npm test` passed all 147 tests; targeted ESLint passed; `git diff --check` passed.

### user

## Generate Loan Report
Snapshot the selected loans as of an applicable date for later reference against actual payments.

Make the Monthly column editable.

### agent

The user confirmed that edited Monthly amounts apply to the generated report snapshot only, not the underlying loan accounts.

Implemented editable Monthly fields in the shared Generate Loan Report panel. Values are plain numeric strings while focused and locale-grouped to two decimals on blur; blanks remain blank. The selected Monthly total updates as values change. Dashboard and dedicated provider-page generation now submit each selected amount, and the admin server action validates and persists overrides and the recalculated total in report snapshots without changing source loans or outstanding balances. Added amount normalization, display-formatting, exact-total, and bounds tests; updated technical documentation and Kanban memory.

Validation: `npx tsc --noEmit` passed; `npm test` passed all 152 tests; targeted ESLint passed; scoped `git diff --check` passed.

### user

# Loans Monitoring
Make the Employee Loans List card and Generated Reports List card scroll internally instead of scrolling the page.

### agent

Implemented route-specific viewport constraints for `/loans`: the app shell is fixed to the dynamic viewport, and its content column and page card can shrink without overflowing. Existing Employee Loans List and Generated Reports List scroll areas now handle long rows internally; report totals and card controls remain visible. Other routes, including dedicated provider pages, retain their prior scrolling behavior. Updated `TECHNICAL.md` and Kanban memory.

Validation: `npx tsc --noEmit` passed; `npm test` passed all 152 tests; targeted ESLint passed; scoped `git diff --check` passed. Browser verification was unavailable because the shared session is at `/login`.

### user

Generated Reports List Card > Action Column:
- Add an Add Payment button.
- Rename Edit Payment Details to Edit, to update/edit the current generated report.

### agent

Plan: Add Payment opens the existing PRN and Payment Date form. Edit opens a separate editor for the saved report snapshot. The editor changes the applicable date and all copied fields on existing entries, including employee, employer, provider, loan details, status, and amounts; it does not add or remove entries or change source loans. Payment metadata remains in Add Payment. View and Delete remain available.

### user

Add Payment opens the existing PRN and Payment Date form; Edit targets the report snapshot.

### agent

Confirmed that Edit should allow changing all copied snapshot fields. The Agent Kanban checklist is complete; proceeding with the requested implementation.

### user

implement

### agent

Implemented separate report actions. Add Payment opens the PRN and Payment Date editor; Edit opens a distinct report snapshot editor for the applicable date and all copied entry fields. Snapshot edits validate entry IDs and field values server-side, update report and entries atomically, recalculate Amount Due and Outstanding, and leave source loans unchanged. Existing report entries cannot be added or removed. View and Delete remain available. Updated `TECHNICAL.md` and Kanban memory.

Validation: `npx tsc --noEmit` passed; `npm test` passed all 155 tests; targeted ESLint passed; scoped whitespace checks passed.

### user

Follow-up refinement:
- For the Payment button, remove only the visible word “Payment”; keep the button/action and its accessible name.
- In Edit Loan Report, remove the “Month and Year Selector” heading but keep the Month and Year controls.

### agent

Plan: Make the Payment action icon-only while retaining its accessible label/title. Remove the “Month and Year Selector” heading while preserving both selectors and their individual Month/Year labels. No code changes made; waiting for the explicit `implement` command.

### user

implement

### agent

Implemented the follow-up refinement. The action and payment dialog now say “Payment”. Generate Loan Report and Edit Loan Report use Employee, Loan Type, No., Loan Date, Status, and Monthly columns; generation keeps checkboxes, while Edit uses Month and Year selectors, editable Monthly values, and row delete controls. Saving updates retained snapshot entries only, recalculates monthly and outstanding totals, and rejects deletion of the final entry. Source loans remain unchanged. Updated `TECHNICAL.md` and Kanban memory.

Validation: `npx tsc --noEmit` passed; `npm test` passed all 155 tests; targeted ESLint passed; scoped whitespace checks passed.

### user
 
### agent

Implemented the SSS-specific toolbar and table changes: the SSS toolbar hides Generated Reports, and its loan list now has aligned Employee, Loan Type, Account No., Date, Monthly, Status, and Action columns without Amount or Outstanding. The dedicated SSS page is constrained to the dynamic viewport and scrolls the table within its card. HDMF keeps its existing link, columns, and page scrolling. Also made the saved-report Payment action icon-only while retaining its accessible name/title, and removed only the Month and Year Selector heading.

Updated `TECHNICAL.md`, Kanban memory, and Iteration 56.

Validation: `npx tsc --noEmit` and targeted ESLint passed; `npm test` passed all 155 tests; changed TSX files and scoped documentation passed whitespace checks. The repository-wide whitespace check reported existing trailing spaces in generated Prisma client output.

### user

Follow-up SSS Loans page refinement:
- Move the Back button into the page header beside “SSS Loans”.
- Move “+ Add Loan” and “Generate Report” to the top-right of the page header.

### agent

Implemented the SSS Loans header refinement. The Back control now sits beside the page title, with Add Loan and Generate Report aligned at the header’s right. The SSS list toolbar retains only refresh and filters. HDMF remains unchanged. Updated `PageHeader` with optional leading content and actions while preserving its existing layout for other pages.

Updated `TECHNICAL.md`, Kanban memory, and Iteration 57.

Validation: `npx tsc --noEmit` and targeted ESLint passed; all 155 tests passed; scoped whitespace checks passed.

### user

Follow-up SSS Loans refinement:
- Add a Search box in the list toolbar before Refresh.
- Adjust the SSS loan list columns to use the available width more evenly.

The Search box should search employee name only and replace the “All employees” filter. Keep the remaining filters and use balanced column widths with Action compact.

### agent

Plan: Add a case-insensitive employee-name search immediately before Refresh on the SSS toolbar, replacing the All employees dropdown while retaining employer, year, and loan-type filters. Redistribute the SSS table widths in balanced, content-weighted proportions and keep Action compact. Keep all changes SSS-only; HDMF remains unchanged. No code changes made.

### user

Follow-up SSS Loans refinement:
- Add a Search box in the list toolbar before Refresh.
- Adjust the SSS loan list columns to use the available width more evenly.

The Search box searches employee name only and replaces the “All employees” filter. Keep the remaining filters and use balanced column widths with Action compact.

### agent

Implemented SSS-only employee-name search before Refresh, replacing the All employees dropdown while retaining the employer, year, and loan-type filters. Search matches full and displayed employee names case-insensitively. Rebalanced the fixed SSS table widths with a compact Action column; HDMF controls and widths remain unchanged.

Updated `TECHNICAL.md`, Kanban memory, and Iteration 58.

Validation: `npx tsc --noEmit` and targeted ESLint passed; `npm test` passed all 155 tests; scoped whitespace checks passed.

### user

Latest Loans Monitoring refinements:
- Make Refresh reset all search/filter selections before refreshing; keep HDMF behavior and clarify its accessible text.
- Keep SSS Date, Monthly, Status, and Action columns compact on wide screens.
- Rename the dashboard report list to “Generated Reports for Posting”.
- Add Posted Reports buttons to both provider cards, and show reports on a combined page only after both PRN and Payment Date are saved. Posted reports should no longer appear in the posting lists.

### agent

Implemented reset-before-refresh behavior and compact SSS columns. Added a shared posted-report predicate requiring a non-blank PRN and Payment Date; unposted reports remain in the dashboard and Generated Reports page, while posted reports are available on the new admin-only `/loans/posted-reports` page. Added provider-card links and updated report headings, documentation, and memory.

Validation: `npx tsc --noEmit` passed; targeted ESLint passed; `npm test` passed all 156 tests; scoped whitespace checks passed.

### user

Follow-up Loans Monitoring refinement:
- Rename “Generated Reports for Posting” to “Generated Reports” in both the dashboard card and the Generated Reports page.
- Rename the Payment action to “Record Payment”.
- Redesign the payment dialog with an employer name / SS Number header; Amount Paid, Payment Branch, Pay Date, Trans Ref#, PRN, and a read-only Applicable Month populated from the report. Include Save and Cancel.

### agent

Plan for Iteration 60 (no application code changed yet):
- Replace the visible “Generated Reports for Posting” labels with “Generated Reports” on the dashboard report card and `/loans/reports`; keep the existing posted/unposted classification and Posted Reports page behavior.
- Rename the payment icon's accessible label/title and the dialog heading to “Record Payment”.
- Rework the dialog to show employer identity, the requested payment inputs, and a read-only Applicable Month derived from the selected report. Remove the current full-date subtitle. Preserve existing save/cancel and error/loading behavior.
- Persist Amount Paid, Payment Branch, and Trans Ref# on the loan-monitor report using an additive Prisma migration and server-side validation. Continue to treat a report as posted only when PRN and Pay Date are present.
- Populate employer identity from the saved report's employer data; where a report contains multiple employers, show the available employer identities without presenting one employer's SS Number as applying to all.
- Update report loading/types, related technical documentation and Kanban memory, then verify TypeScript, targeted lint, tests, and whitespace.

Before implementation, please confirm whether “SS Number” means the employer's SSS registration number (the `employer.sss` value, recommended) or the individual employees' SS Numbers. Also confirm whether all five payment fields (Amount Paid, Payment Branch, Pay Date, Trans Ref#, PRN) must be required to save, or whether incomplete payment details should still be saveable.

### user

- SS Number means the employer's SSS registration number.
- Allow partial saves.

### agent

Confirmed. Use each report employer's SSS registration number, and allow partial payment-detail saves. Keep the existing posted rule: both PRN and Pay Date are required to classify a report as posted; clearing either returns it to Generated Reports. The Iteration 60 plan and checklist are ready. Send `implement` to begin the code changes.

### user

implement

### agent

Implemented Iteration 60:
- Renamed the dashboard card and `/loans/reports` heading to “Generated Reports”.
- Renamed the payment action to “Record Payment” and redesigned its dialog with employer name and SSS registration number, Amount Paid, Payment Branch, Pay Date, Trans Ref#, PRN, read-only Applicable Month, and Save/Cancel.
- Added nullable payment columns and employer SSS snapshots with a migration. The admin server action validates and persists partial details; only PRN plus Pay Date continue to determine posted status.
- Updated `TECHNICAL.md` and Kanban memory.

Validation: TypeScript, targeted ESLint, Prisma validation, whitespace checks, and all 156 tests passed. Prisma client type metadata reflects the schema, but `npx prisma generate` could not replace the query-engine DLL while the development server was running. The migration has not been applied to a database; apply it to the app's configured database and restart the dev server before using the updated payment action.

### user
