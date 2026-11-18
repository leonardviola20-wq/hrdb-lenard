---
title: Loan refinement
lane: todo
created: 2026-11-14T09:13:27+08:00
updated: 2026-11-14T09:13:27+08:00
description: Add an employee-based SSS loan flow in Edit Loan Report and refine status display in the SSS loan lists.
---

## Conversation

### user

approve revised plan

### agent

Implemented the return-after-expiry refinements. Expired JWTs now redirect to the login route with a session-expired reason, and loan server guards handle expired tokens with the same redirect instead of exposing JWT verification errors. The root layout shows an accessible popup explaining the existing one-hour session lifetime. Loans Monitoring refreshes on tab visibility, browser history navigation, and back/forward-cache restoration. Month warnings now clarify that both Generated and Posted reports reserve the month; posted reports remain correctly separated from Generated Reports. The provider tabs were extracted so `LoansClient` stays under the repository's 150-line limit.

Updated TECHNICAL.md and Kanban memory. Validation passed: targeted ESLint (clean), TypeScript, all 165 tests, production build, and changed-file whitespace scan. The build emitted existing Prisma generated-client tracing warnings.

### user

implement

### agent

Architecture check before continuing the implementation:

- Component scope: `LoansClient` coordinates Loans Monitoring UI; a small hook will handle fresh server data when the browser tab/page is restored. `SessionExpiredDialog` will only explain the expired one-hour sign-in session on the login screen.
- Modular bloat checklist: custom hook needed — Yes (`components/loans/useRefreshOnRestore.ts`); separate subcomponent needed — Yes (`components/SessionExpiredDialog.tsx`); separate types/utilities needed — No.
- Proposed files: modify `proxy.ts`, `app/actions/loans.ts`, `app/loans/loadLoansData.ts`, `app/login/page.tsx`, `components/loans/LoansClient.tsx`, `components/loans/LoanReportDateSearch.tsx`, `TECHNICAL.md`, and `.agentkanban/memory.md`; create `components/SessionExpiredDialog.tsx` and `components/loans/useRefreshOnRestore.ts`.
- The existing JWT lifetime is one hour from sign-in, not a sliding inactivity timer. The dialog will accurately say the one-hour session expired; it will not claim active use resets that timer.

### user

Please check the Loans Monitoring return-after-idle behavior. On returning after an authentication failure, the Generate Loan Report month selector sometimes reports an existing SSS report for Imarak Traders OPC in 2026 even though no report is visible in Generated Reports; after returning again, both the warning and the report-exists marker are absent. When authentication expires, show a clear logged-out-for-idle popup instead of a Next.js error.

### agent

Investigation findings (no implementation yet):

- Login issues JWTs with a one-hour expiration (`app/api/login/route.ts`). The proxy redirects expired page requests to `/login` without an expiration reason, while the loan page and loan server-action guards call `jwt.verify` without handling an expired-token error. This is consistent with an expired session surfacing as a Next.js error instead of a clear idle-logout notice.
- `Generate Loan Report` calculates occupied months from both generated and posted snapshots passed by `/loans`; it intentionally includes posted reports in duplicate-month checks. The Generated Reports list contains only unposted reports, so a report with both PRN and Pay Date is expected to appear under Posted Reports rather than Generated Reports while still marking the month unavailable.
- `/loans` is force-dynamic, but a client-side navigation/history restoration may reuse stale report props. The warning appearing and then disappearing suggests stale UI data or an auth failure during refresh; the exact affected report's posting state and month could not be verified from the report provided.

The workspace Kanban workflow requires the `implement` command before code changes. Waiting for confirmation to implement the idle-session notice and ensure the loan page refreshes its report state after re-authentication.

### user

Loan refinement:

## Edit Loan Report
Update this saved snapshot. Source loan accounts will not be changed.

Add a New button after Add button. Add from the employees list database (201 File), open Add Loan Form:

## Add SSS Loan
Enter the SSS loan details below.

Then update the list selection with the new SSS Loan Account in Edit Loan Report.

## SSS Loans
Salary, Calamity, and Emergency loan accounts.
- Remove the Status column.
- Put the status below the Loan Type: Salary / Calamity / Emergency, with active / inactive just below each type.

Apply this in:

## Generate Loan Report
Snapshot the selected loans as of an applicable date for later reference against actual payments.
Monthly edits apply to this report snapshot only; loan accounts are unchanged.
- In the List Card, remove the Status column only; do not make additional refinements there.

### agent

Created the task and its TODO checklist. No implementation has been started.

### user

implement

### agent

Implemented the requested loan refinements. Edit Loan Report now has a New button that opens the existing Add SSS Loan form with the 201 File employee lookup; after saving, the SSS Loan Account dropdown refreshes so the new account can be added to the report snapshot. The SSS loan list shows Active/Inactive below Loan Type instead of a Status column, and Generate Loan Report's selection list no longer has a Status column. Edit snapshot rows still show Status, and monthly snapshot edits remain separate from source loan accounts.

Updated TECHNICAL.md and Kanban memory. Validation passed: targeted ESLint, TypeScript, all 165 tests, and changed-file whitespace scan. Workspace-wide git diff check reported pre-existing trailing whitespace in generated Prisma client files; those unrelated files were left untouched.

### user

Implementation-plan adjustment: the existing `LoansClient` exceeds the repository's 150-line component limit, so I propose extracting its accessible provider tablist into `components/loans/LoanProviderTabs.tsx` while keeping the refresh-on-restore behavior in its hook. The login page is also already over the component limit; to avoid expanding it, I propose mounting the query-driven expiry dialog from the root `app/layout.tsx` instead. This changes the approved plan's integration points from `app/login/page.tsx` to `app/layout.tsx` and adds `components/loans/LoanProviderTabs.tsx`.

### user

approve revised plan

### agent

Implemented the return-after-expiry refinements. Expired JWTs now redirect to the login route with a session-expired reason, and loan server guards handle expired tokens with the same redirect instead of exposing JWT verification errors. The root layout shows an accessible popup explaining the existing one-hour session lifetime. Loans Monitoring refreshes on tab visibility, browser history navigation, and back/forward-cache restoration. Month warnings now clarify that both Generated and Posted reports reserve the month; posted reports remain correctly separated from Generated Reports. The provider tabs were extracted so `LoansClient` stays under the repository's 150-line limit.

Updated TECHNICAL.md and Kanban memory. Validation passed: targeted ESLint (clean), TypeScript, all 165 tests, production build, and changed-file whitespace scan. The build emitted existing Prisma generated-client tracing warnings.

### user
