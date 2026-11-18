# Iteration 1 — SSS Loans

- [x] Remove Outstanding from the Generate Loan Report footer summary and widen the Search field without changing the responsive date selectors.
- [x] Make SSS ListCard columns evenly distributed and render Status as bold colored text without the badge; preserve HDMF styling.
- [x] Rename the Generated Reports action from Record Payment to Payment.
- [x] Extend the Edit Loan Report snapshot to add one SSS source loan account at a time, including validated server-side snapshot creation, recalculated totals, and tests; preserve source loan records.
- [x] Allow regular users with explicit Posted Reports permission to view posted reports; keep loan management admin-only.
- [x] Make Posted Reports actions role-aware: regular users View only, admins View/Delete, and neither role gets Edit or Record Payment there.
- [x] Update related technical documentation and verify the relevant screens and role behavior.
- [x] Run targeted ESLint, TypeScript, unit tests, and whitespace validation.

# Iteration 2 — Posted Reports navigation and snapshot account selector

- [x] Remove the Posted Reports entry from the sidebar while preserving its route and page-access permission.
- [x] Replace the Add Employee launcher/popup with an inline dropdown containing one eligible linked SSS loan account per option, including inactive accounts, and an Add confirmation.
- [x] Preserve duplicate exclusions, local snapshot insertion, editable Monthly, and existing Edit Loan Report copy.
- [x] Update related documentation/memory and run targeted lint, type-check, tests, and browser validation.

# Iteration 3 — Employer-first loan report generation

- [x] Add nullable report-level employer snapshot fields and an additive Prisma migration; apply it to the active `.env.local` database.
- [ ] Complete `npx prisma generate`. Client types/runtime metadata were updated, but the active dev process held the Windows query-engine DLL and blocked replacement; restart the dev server and retry.
- [x] Require employer selection in every shared report-generation surface; do not filter loans by employee employer, and clear selections when employer changes.
- [x] Validate/fetch the selected employer server-side and persist its snapshot at report and entry level; use that snapshot when adding accounts to existing reports.
- [x] Make report-list labels/filters, previews, printing, and payment employer details prefer report-level employer snapshots with legacy entry fallback.
- [x] Add focused employer ID/display fallback tests; update technical documentation and memory.
- [x] Run targeted ESLint, TypeScript, unit/full tests, and migration status validation. Browser flow validation was unavailable because the existing browser session is unauthenticated.

# Iteration 4 — Previous report list and generation layout

- [x] Hide the dedicated SSS/HDMF loan filter toolbar while inline report generation is open.
- [x] Sort Generate Loan Report loan rows by employee name ascending.
- [x] Pass previous generated and posted snapshots into shared report generation; allow choosing a report for the selected employer and loading its entries/monthly amounts into the unsaved list.
- [x] Disable and explain the load control when the selected employer has no prior reports; report unavailable loan entries without partially loading.
- [x] Add focused tests and update technical documentation and Kanban memory.
- [x] Run targeted lint, TypeScript, focused/full tests, and browser validation where available.

# Iteration 5 — Compact employer and one-click previous list

- [x] Reduce employer selector width and place a single “Load Previous” button immediately after it; remove the previous-report selector.
- [x] Load the selected employer’s latest report directly, preserving atomic validation and unsaved-only behavior.
- [x] Disable the button before employer selection and when no prior report exists; expose the exact “no previous report” tooltip.
- [x] Update focused tests, documentation, memory, and Kanban task.
- [x] Run targeted lint, TypeScript, tests, and browser verification.

# Iteration 6 — Prevent duplicate employer/provider report months

- [x] Identify occupied months from generated and posted snapshots for the selected employer and provider; disable them in the month selector and show a contextual warning.
- [x] Reject duplicate employer/provider/month report creation server-side, including requests that bypass the UI.
- [x] Add focused helper tests used by both the UI and server guard for provider isolation, employer isolation, billing month, and posted reports.
- [x] Update technical documentation and Kanban memory.
- [x] Run targeted lint, type-check, full tests, SSS UI validation, and verify Pag-IBIG provider isolation; the HDMF page currently has no loans.
