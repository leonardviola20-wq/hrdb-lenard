---
title: Loan refinement
lane: todo
created: 2026-11-14T09:13:27+08:00
updated: 2026-11-14T09:13:27+08:00
description: Implement the requested SSS loan account creation and status-column refinements.
---

# Iteration 1

- [x] Inspect the SSS loan account, Add Loan Form, Edit Loan Report, and Generate Loan Report flows; preserve the saved-snapshot behavior and existing employee-list source.
- [x] Add a New button after Add in Edit Loan Report; open the Add SSS Loan form, create the loan account for a 201 File employee, and make the new SSS Loan Account available in the report selection.
- [x] In SSS Loans, remove the Status column and display each account's active / inactive status directly below its Salary, Calamity, or Emergency loan type.
- [x] In Generate Loan Report's List Card, remove only the Status column without other list refinements.
- [x] Run focused validation for the changed loan flows and update related technical documentation if needed.

Validation: targeted ESLint and `npx tsc --noEmit` passed; `npm test` passed all 165 tests. Changed-file whitespace scan passed. Workspace-wide `git diff --check` remains blocked by pre-existing trailing whitespace in modified generated Prisma client files; those unrelated files were not changed for this task.

# Iteration 2

- [x] Route expired-session page requests and loan server actions to a clear session-expired login experience instead of surfacing JWT verification errors.
- [x] Show an accessible popup explaining the one-hour session expiration on the login screen.
- [x] Refresh Loans Monitoring data when returning to the tab, and clarify that occupied months include both generated and posted reports.
- [x] Update technical documentation and Kanban memory; run focused lint, type-check, tests, and whitespace validation.

Validation: targeted ESLint passed with no warnings; `npx tsc --noEmit` passed; `npm test` passed all 165 tests; `npx next build` completed successfully (with existing Prisma generated-client tracing warnings); changed-file whitespace scan passed.
