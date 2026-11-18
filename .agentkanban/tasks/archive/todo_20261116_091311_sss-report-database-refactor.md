---
title: Separate SSS contribution and loan reporting databases
lane: todo
created: 2026-11-16T09:13:11+08:00
updated: 2026-11-16T09:13:11+08:00
description: Track the schema inventory, safe backups, physical database split, Reports navigation, migration runbook, and verification for SSS contribution and loan reporting.
---

# Iteration 1

- [x] Create the new Kanban task and matching TODO checklist for the agreed SSS-only scope.
- [ ] Inventory SSS contribution and loan models, relationships, and source row counts; identify shared HR references.
- [ ] Confirm the exact source/target database identities and secure external backup folder before exporting or writing any data.
- [ ] Create separate schema-and-data backups for SSS contributions and all SSS loan data; verify counts and checksums.
- [ ] Implement separate contribution and loan reporting databases, preserving source IDs and report snapshots without cross-database foreign keys.
- [x] Replace the standalone Loans sidebar entry with Reports > Contributions and Reports > Loan using the agreed SSS destinations; preserve authorization.
- [x] Create the initial `SSS-REPORTS-MIGRATION.md` with the checked-in database structure, backup placeholders, migration/restore steps, validation, and rollback outline.
- [ ] Run data-integrity checks, focused tests, lint, and type-check; update `TECHNICAL.md` and `.agentkanban/memory.md`.

## Blockers and safeguards

- The exact external backup folder and source/target database identities are not confirmed. Do not export or alter data until the user supplies and approves them.
- `LoanMonitorReport` can contain both SSS and Pag-IBIG entries while its totals and payment metadata apply to the entire snapshot. Do not split mixed-provider snapshots until the user chooses the handling policy recorded in `SSS-REPORTS-MIGRATION.md`.
- Do not place database dumps, credentials, or personally identifiable report data in the repository.
- Preserve existing source data until migration integrity checks pass and cutover is approved.

# Iteration 2

- [x] Catalog the checked-in SSS contribution, legacy loan, current loan, payment, monitor snapshot, and imported-history models and their local/shared relationships in the migration reference.
- [x] Add expandable Reports > Contributions and Reports > Loan links to the existing SSS report route; retain Reports permissions and remove only the standalone `/loans` shortcut.
- [x] Create the initial `SSS-REPORTS-MIGRATION.md` runbook with explicit pending states; do not claim backups or migration have completed.
- [x] Confirm mixed-provider loan-monitor snapshot treatment: keep complete mixed-provider snapshots central and migrate only SSS-only snapshots.
- [ ] Confirm the exact source database name/server, target provisioning and names, and secure external backup folder.
- [ ] Complete live row-count inventory, separate backups, physical database migration, and verified backup manifest after the blockers are resolved.
- [ ] Finish data-integrity validation and focused lint/type/test checks for the completed migration; update documentation and Kanban memory.

# Iteration 3

- [x] Apply separate reporting schemas and import the verified SSS datasets while leaving source records intact and complete mixed-provider snapshots central.
- [x] Recheck destination row counts by report kind/table and verify the loans target contains no non-SSS monitor entries.
- [x] Create and checksum native PostgreSQL archives for both populated targets outside the repository; verify each archive catalog with `pg_restore --list`.
- [x] Generate separate Prisma clients automatically for development/build startup and document the active data topology, counts, checksums, and no-cutover status.
- [x] Run `npx tsc --noEmit`, all 171 unit tests, focused ESLint (0 errors), and a Next.js production build with npm lifecycle scripts skipped.
- [ ] Resolve the Windows `EPERM` central Prisma engine rename and verify the standard `npm run build` lifecycle.
- [x] With approval, restore each native archive into a disposable database, verify restored counts and data, and remove only those test databases.
- [ ] Configure production target URLs, smoke-test the deployment, and obtain cutover approval; retain the central source data until then.

# Iteration 4

- [x] Remove provider cards, Employer selector, and employer-loading states from the Reports dashboard.
- [x] Add the Contribution Page landing route with SSS, PagIBIG, and Philhealth buttons.
- [x] Create three dedicated provider routes with clear headers and return links; preserve existing report screens.
- [x] Update sidebar navigation, `ContriPage.md`, and `TECHNICAL.md`.
- [x] Verify with TypeScript, focused ESLint, all 171 tests, and a production Next.js build.

# Iteration 5

- [x] Create and adopt the reusable circular icon-only back button with a chevron-only icon, accessible label, and tooltip across existing back-navigation controls.
- [x] Make Contribution Page provider buttons full-width and vertically stacked on mobile, while keeping them naturally sized in a horizontal row on larger screens.
- [x] Add Contributions and Loans tabs to SSS and PagIBIG provider pages; show Philhealth contributions directly without tabs.
- [x] Run TypeScript, focused ESLint, all 171 tests, and a production Next.js build; update docs and task memory. Broader ESLint reports existing state-in-effect errors in employee pages.

# Iteration 6

- [x] Move route-level Back buttons beside page headings on the left; keep modal and multi-step workflow controls in their existing workflow positions.
- [x] Wire PagIBIG and PhilHealth Contributions sections to existing provider contribution data/APIs only; no loan functionality was added.
- [x] Verify the provider routes and update `ContriPage.md`, `TECHNICAL.md`, and project memory.

Verification note: `npx tsc --noEmit`, all 171 tests, focused ESLint (0 errors outside the known employee-profile hook lint error), `npx next build`, and `git diff --check` passed. The standard `npm run build` prebuild Prisma generation hit a Windows `EPERM` rename on the query engine; `npx next build` completed successfully using the already-generated clients.

# Iteration 7

- [x] Remove the in-page Loans tab from the SSS and PagIBIG Contribution provider pages; keep Contributions content and the separate Loans navigation/pages unchanged.
- [x] Update Contribution Page documentation and project memory to describe the provider page layout.
- [x] Verify provider routes with focused lint and TypeScript.

# Iteration 8

- [x] Add a Reports-authorized aggregate endpoint for paid SSS Contributions in the dedicated SSS Contributions database, comparing current calendar year through the current applicable month with the full previous calendar year.
- [x] Add a Reports Dashboard analytics card with year labels, paid totals, difference/percentage, and loading, empty, and error states; do not restore the Employer selector or add a Loans card.
- [x] Update `TECHNICAL.md`, `ContriPage.md`, project memory, and the active task conversation.
- [x] Run TypeScript, focused lint, tests, production build, and `git diff --check`.

Verification note: TypeScript, focused ESLint, all 171 tests, `npx next build` (68/68 static pages), `git diff --check`, and browser checks for the live aggregate, dashboard display, and removed provider tabs passed. The SSS generated subclient raised `__dirname is not defined` in Next.js dev bundling, so the analytics path uses the central generated Prisma client pointed at the validated SSS Contributions datasource; the live endpoint then returned 200. No Loans database or navigation behavior was changed.

# Iteration 9

- [x] Replace the SSS annual analytics endpoint/card with an authorized, privacy-minimal 12-month aggregate for SSS, PagIBIG, and PhilHealth, grouped by applicable month and including paid amounts only.
- [x] Add responsive provider summary cards and an accessible grouped-column chart, including loading, empty, malformed-data, and error states; keep Reports header and Loans out of scope.
- [x] Update `TECHNICAL.md`, `ContriPage.md`, project memory, and append the implementation record to the active task.
- [x] Verify period boundaries, aggregation correctness, type safety, focused lint, tests/build, and the dashboard in browser at desktop/mobile sizes.

Verification: all 174 tests, focused ESLint, `npx next build` (68/68 static pages), post-build `npx tsc --noEmit`, and scoped `git diff --check` passed. Browser verified the endpoint returned 200, 12 months and reconciled monthly/provider totals, and no employer data; mobile verification confirmed stacked provider summaries and chart-only horizontal scrolling without page overflow.

# Iteration 10

- [x] Update the aggregate endpoint and response validation for previous full calendar year and current year-to-date monthly totals for all three providers.
- [x] Remove the Reports Dashboard heading/subtitle and render each provider’s two annual-total cards directly above its own paired monthly comparison chart; restore provider-colored card borders.
- [x] Update `TECHNICAL.md`, `ContriPage.md`, project memory, and append the implementation record to the active task.
- [x] Verify API totals/months, responsive dashboard, typecheck, focused lint, tests/build, and diff checks.

Verification: `npx tsc --noEmit`, focused ESLint, all 173 tests, `npx next build` (68/68 pages), and `git diff --check` passed. The authorized API returned 200; prior-year totals reconciled to all 12 monthly buckets and YTD totals reconciled through November for all three providers, with later current-year months zeroed. Browser confirmed the old dashboard heading/subtitle are absent, three government sections/charts render, provider accent borders are visible, and the 390px mobile page has no horizontal overflow.

# Iteration 11

- [x] Render the three government analytics in a compact, responsive three-column desktop layout while keeping them stacked on mobile.
- [x] Replace paired-column charts with compact, accessible two-series monthly line charts and preserve prior-year/current-year-to-date totals and accents.
- [x] Update documentation and project memory; append implementation summary to the active task.
- [x] Verify desktop fit, mobile stacking, graph values, accessibility data, TypeScript, lint, tests, build, and diff checks.

Verification: `npx tsc --noEmit`, focused ESLint, all 173 tests, direct `npx next build` (68/68 pages), scoped `git diff --check`, and no trailing whitespace in updated files passed. The normal `npm run build` prebuild hook could not rename a locked Prisma engine DLL, so the Next.js build was run directly and completed. Browser confirmed three provider panels fit in one 1440×900 desktop viewport (357px each), three two-line SVG charts and accent borders render, 390px mobile stacks the panels without page overflow, and the previous/current year comparisons retain their accessible monthly data tables.

# Iteration 12

- [x] Make the Reports sidebar control toggle its submenu; add a Reports Dashboard submenu link and preserve navigation/accessibility.
- [x] Replace Contribution Page provider links with accessible SSS, PagIBIG, and Philhealth tabs rendering existing provider content; keep tab selection URL-backed.
- [x] Redirect existing direct provider routes to the corresponding Contribution Page tab.
- [x] Update `TECHNICAL.md`, `ContriPage.md`, and project memory; append implementation summary to the task.
- [x] Verify menu toggling, tab switching and keyboard behavior, direct-route redirects, responsive layout, typecheck, lint, tests, and diff checks.

Verification: `npx tsc --noEmit`, focused ESLint, all 173 tests, scoped `git diff --check`, and browser checks passed. Browser verified repeated Reports-row clicks close and reopen the submenu, the dashboard remains available within it, provider tabs update the URL and content, ArrowRight changes tabs and URL, all three legacy provider routes redirect to matching tabs, and the 390px mobile tab layout has no horizontal overflow. A production build was not run because the workspace's Next.js development server was already running against the shared `.next` directory.

# Iteration 13

- [x] Make Reports navigate to the dashboard and toggle its submenu; remove the dashboard submenu link and keep the label left aligned.
- [x] Bound the PhilHealth employer picker to viewport-aware height with internal scrolling and keyboard/accessibility support.
- [x] Make PhilHealth report View open a popup with requested payment fields, employee/PhilHealth number/PS/ES/total columns, and PS/ES/grand-total footers using the existing half split.
- [x] Update `TECHNICAL.md`, `ContriPage.md`, and project memory; append implementation summary to the task.
- [x] Split the contribution report table into its own component so every changed TSX component stays within the 150-line limit.
- [x] Verify menu navigation/toggling, bounded picker, popup data/layout/accessibility, typecheck, lint, tests/build as possible, and diff checks.

Verification: `npx tsc --noEmit`, focused ESLint, all 173 tests, and scoped `git diff --check` passed. Browser checks confirmed Reports navigates to `/reports` and toggles open/closed with only Contributions and Loan links; the PhilHealth picker has 9 options in a 288px internally scrolling list; the details dialog shows all requested payment fields and columns without Employee Code; all employee row totals and PS/ES/grand totals reconcile to the cent; Escape closes the dialog and restores focus; and the 390×844 mobile dialog remains viewport-bounded with internal content/table scrolling. A production build was not run because the workspace's Next.js dev server uses the shared `.next` directory.

# Iteration 14

- [x] Restyle the PhilHealth View popup to match the report reference; constrain scrolling to employee rows and keep the table header and totals footer sticky.
- [x] Make the PhilHealth Contributions page report list scroll only within its card, keep its table header sticky, and change `Report` to `SPA Number` without adding a totals footer.
- [x] Update `TECHNICAL.md`, `ContriPage.md`, project memory, and append the implementation record to the active task.
- [x] Verify desktop/mobile sticky scrolling, dialog accessibility and totals, page list label/data, typecheck, focused lint, tests, and diff checks.

Verification: TypeScript, focused ESLint, all 173 tests, and scoped `git diff --check` passed. Browser checks at 1440×900 and 390×844 confirmed the PhilHealth page list stays bounded to a 60dvh card with an internally sticky header and the SPA Number field; the View dialog scrolls its employee entries inside the modal with its table header/totals footer pinned and within the viewport. All 38 tested employee rows reconciled to PS ₱9,500.00, ES ₱9,500.00, and grand total ₱19,000.00; required payment fields remain visible, Employee Code is absent, Escape closes the dialog, and focus returns to View. Production build was not run because the active dev server shares `.next`.

# Iteration 15

- [x] Add a shared employer selector and provider launcher to the Contribution Page; disable provider buttons until selection and carry employer/provider query parameters into the selected contribution view.
- [x] Add the same employer selector and SSS/Pag-IBIG launch buttons to Loans Monitoring; preserve existing tabs and route to provider pages with the selected employer filter applied to loan rows and report workflows.
- [x] Left-align the Reports sidebar label while keeping its disclosure control at the far right and preserving collapsed-sidebar behavior.
- [x] Update `TECHNICAL.md`, `ContriPage.md`, project memory, and append an implementation summary to the task.
- [x] Verify TypeScript, focused lint/tests, query-based filters, disabled/enabled controls, responsive layout, and scoped diff checks.

Verification: `npx tsc --noEmit`, focused ESLint, `npm test`, and scoped `git diff --check` passed. Browser validation was unavailable because no local app server was listening on ports 3000–3002.

# Iteration 16

- [x] Replace the Contribution landing tabs/report lists with a two-column layout: vertical employer/provider card on the left and selected-provider latest payments on the right.
- [x] Show the latest eight paid contributions with period, payment date, and amount paid; add saved date/amount fields to SSS and PagIBIG payment API responses and preserve PhilHealth payment data.
- [x] Add a toolbar action and new provider/employer-filtered full-report route showing all saved reports, paid and unpaid; leave existing provider redirects unchanged.
- [x] Update `ContriPage.md`, `TECHNICAL.md`, project memory, and append the implementation record to the active task.
- [x] Verify TypeScript, focused lint/tests, paid-only summary and all-report scopes, provider/employer URL behavior, responsive layout, and scoped diff checks.

# Iteration 17

- [x] Keep the Contribution Page employer/provider launcher sticky on desktop while the payment list scrolls; keep normal flow on mobile.
- [x] Show the latest 12 paid contribution payments, remove the explanatory latest-eight sentence, and hide payment date on mobile.
- [x] Replace the all-reports text Back link with the circular shared BackButton; remove generic subtitles and provider-panel heading/copy.
- [x] Add selected employer name, address, and provider number above the all-reports toolbar.
- [x] Add payment-status and applicable-year filters; constrain the list to an internally scrollable card showing about eight rows.
- [x] On mobile, show only report period and amount due in the all-reports list while preserving report details access.
- [x] Update related API response fields, `TECHNICAL.md`, `ContriPage.md`, project memory, and append the implementation record.
- [x] Verify desktop sticky behavior, mobile columns, 12-payment limit, filters, TypeScript, focused lint/tests, and scoped diff checks.

Verification: TypeScript, focused ESLint, all 173 tests, and scoped `git diff --check` passed. Browser checks confirmed a sticky desktop launcher and normal-flow mobile launcher; twelve paid payments with date visible only on desktop; employer name/provider number/address across SSS, PagIBIG, and PhilHealth; status/year filtering; an internally scrolling 448px reports list; mobile period/total columns without horizontal page overflow; and preserved report-detail access from the mobile period control.

Verification: `npx tsc --noEmit`, focused ESLint, all 173 tests, and scoped `git diff --check` passed. `npx next build` compiled but exited during static page generation because the installed Next.js version is flagged by its security check; the upgrade recommendation is pending. Browser validation was unavailable because ports 3000–3002 had no active app server.

# Iteration 18

- [x] Remove the provider-number line from the Contribution all-reports employer header while retaining name and address.
- [x] Replace “Previous Payments” headings with “SSS Payments”, “PagIBIG Payment”, and “PhilHealth Payment”.
- [x] Update contribution documentation and project memory; leave the separate historical-loans title and data behavior unchanged.
- [x] Run TypeScript, focused ESLint, and scoped diff checks; record the implementation in the active task.

Verification: `npx tsc --noEmit`, focused ESLint on both updated components, and `git diff --check` passed.
