# Iteration 1

- [x] Inspect existing app navigation, route/access patterns, and the installed Next.js guidance; determine whether there is prior chat or signaling infrastructure.
- [ ] Implement authenticated, in-memory room discovery and WebRTC offer/answer signaling in the local Next.js process; keep chat messages on direct peer data channels without external STUN/TURN or persistence.
- [ ] Build a responsive chatroom with room creation/joining, participant identity/status, message history for the active session, and message composition.
- [ ] Add focused tests for the connection/messaging behaviors and validate the app with relevant checks.
- [ ] Document how to use the room, its local-network limitations, and any required local service in `TECHNICAL.md`.
- [ ] Add the chat page to app navigation and page-access options, and enforce the page permission on signaling APIs.

# Iteration 2 — Online users and direct messages

- [x] Replace the room-based chat UI with an online-user list (three visible initially, with View all) and a single popup direct-message conversation.
- [x] Add authenticated, in-memory presence and direct-message APIs; integrate app-wide session heartbeats and stale-session cleanup.
- [x] Remove the obsolete room UI, WebRTC signaling store, room route, and room-specific tests; update chat navigation/access labels and technical documentation.
- [x] Add focused store/API tests and validate chat-specific lint and TypeScript checks.

Iteration 2 supersedes the room-code/WebRTC requirements in Iteration 1 after the user changed the chat design.

# Iteration 3 — Chat access for all signed-in users

- [x] Remove Chat from admin-managed page access and make the route, sidebar link, and presence heartbeat available to all authenticated users.
- [x] Remove recipient permission filtering so all signed-in users can appear online and exchange direct messages.
- [x] Add/adjust focused access and API tests; verify the second signed-in account appears in the online-user list.
- [x] Update direct-messaging documentation and validate targeted lint, TypeScript, and whitespace checks.

# Iteration 4 — Floating chat widget

- [x] Add an authenticated inbox polling API with sequence cursors and focused pagination/privacy/authentication tests.
- [x] Build a persistent floating chat widget with online roster, one direct conversation, in-app unread indicators, and send/receive behavior.
- [x] Mount the widget across signed-in pages and connect the `/chat` directory to the widget without route navigation.
- [x] Update chat implementation notes, task history, and project memory.
- [x] Record the unrelated full TypeScript check failure without changing benefits-report code.
- [x] Run focused chat tests and lint; run TypeScript validation and verify the interaction in the browser.

The full TypeScript check reports an unrelated existing error in `app/api/reports/pagibig/loans/route.ts` (`certifyingEmployer` is not present on the generated record type).

# Iteration 5 — Reset incompatible in-memory chat state

- [x] Add a versioned global-store guard that reuses compatible state and replaces a legacy/incompatible store.
- [x] Add regression coverage for resetting stale state, preserving compatible state, cursor behavior, and inbox authorization.
- [x] Update chat technical notes and project memory with the hot-reload recovery behavior.
- [x] Verify focused tests and lint; confirm inbox and conversation endpoints recover in the shared browser without an invalid-message alert.

# Iteration 6 — Typing indicator and emoji picker

- [x] Add expiring, directional typing state to the in-memory chat store and authenticated typing API.
- [x] Show “is typing” feedback in the direct conversation and send/clear typing activity from the composer lifecycle.
- [x] Add an accessible emoji picker that inserts emoji at the current message cursor.
- [x] Add focused store/API tests and document the new chat interactions.
- [x] Validate focused chat tests and lint; verify emoji insertion in the browser and typing API/state behavior in focused tests.

The shared browser session was unauthenticated during validation, so authenticated live typing could not be exercised there.

# Iteration 7 — Align emoji and send controls

- [x] Inspect the composer sizing and reproduce the visible alignment issue.
- [x] Remove inline baseline spacing from the textarea wrapper while preserving bottom alignment for expanded drafts.
- [x] Run focused lint and whitespace checks; record browser verification limitation.

The shared browser redirected to `/login` during this check, so the final layout could not be re-captured with an authenticated conversation open.

# Iteration 8 — Avoid chat presence cleanup 401 on logout

- [x] Clean up chat presence before logout clears the authentication cookie.
- [x] Make logout/unmount cleanup idempotent and avoid logging an expected 401 for already-expired sessions.
- [x] Run focused lint, chat presence tests, and whitespace checks; update chat documentation and task history.

The shared browser session was not logged out during validation to avoid changing the user's session.

# Iteration 9 — Full emoji picker and message reactions

- [x] Replace the curated composer emoji list with a full searchable, category-based emoji picker.
- [x] Add authenticated, bounded, per-message reaction state and toggle API for both conversation participants.
- [x] Display aggregate reaction counts and each user's selected state in the conversation.
- [x] Add focused store/API tests, update technical notes and task history, then validate tests, lint, TypeScript, and browser behavior.

Validation: all 17 focused store/API tests pass and targeted ESLint passes. In the authenticated browser, searching for “rocket” returned emoji matches and selecting one inserted it into the draft without sending a message. Reaction authorization, aggregation, and toggle behavior are covered by store/API tests; no message was sent just to exercise the live reaction UI. Full `tsc --noEmit` still reports unrelated existing Pag-IBIG `certifyingEmployer` typing and missing matcher typings in `PagIbigReportsPage.test.tsx`.

# Iteration 10 — Organize direct-message components

- [x] Read the installed Next.js client-component guidance and inspect chat component call sites.
- [x] Move the widget and `/chat` directory component into `components/chat/`.
- [x] Extract widget state/orchestration and split the UI into cohesive feature components.
- [x] Update app imports, technical notes, and project memory.
- [x] Run focused tests, lint, type-check impact, browser behavior checks, and scoped whitespace validation.

Validation: the configured project suite passes all 136 tests, including the chat store/API tests; focused chat ESLint and scoped whitespace checks pass. The full TypeScript check reports no errors in the refactored chat files and remains blocked by unrelated Pag-IBIG route/test typing errors. No browser page was shared for a post-refactor visual check.

# Iteration 11 — Refactor Pag-IBIG Reports UI

- [x] Resolve duplicate local declarations and wire existing feature components into the page.
- [x] Extract report/member filtering, sorting, manual-report merging, pagination, and preview totals into `usePagibigReportView`.
- [x] Integrate the member, payment, preview, report-details, payment-dialog, and drafts components without changing APIs, schema, URL state, or Suspense boundary.
- [x] Update technical documentation and project memory.
- [x] Run configured tests, focused ESLint, TypeScript impact checks, and scoped whitespace validation; record unavailable browser/smoke-test verification.

Validation: all 136 configured tests pass; ESLint and scoped `git diff --check` pass for the refactored components. `tsc --noEmit` reports no errors in the refactored components, but reports the unrelated existing loans-route error and test typing issues. The optional page smoke suite could not be run because its Vitest/Vite/jsdom test toolchain is incomplete in this checkout; no browser page was shared.

# Iteration 12 — Clean up Pag-IBIG form dialogs

- [x] Read the installed Next.js client-component guidance and inspect the current feature-folder patterns.
- [x] Extract the account/loan editor into `AccountFormDialog` and the report-generation form/preview into `ReportGenerationDialog`.
- [x] Keep URL state, API calls, form workflows, and preview-year invalidation in the page coordinator while preserving existing behavior.
- [x] Reformat extracted JSX and update technical documentation and project memory.
- [x] Run the configured tests, focused ESLint, TypeScript impact checks, and scoped whitespace validation.

Validation: all 136 configured tests pass and focused ESLint passes for the page and both extracted components. `tsc --noEmit` reports only the known unrelated loans-route and page-test typing errors; it reports no errors in the extracted components or page. No browser page was shared for visual verification.

# Iteration 13 — Extract Pag-IBIG workflow hooks

- [x] Map data loading, account/loan editing, report preview/generation, drafts, and payment dependencies and callbacks.
- [x] Extract the employer-scoped report data and refresh workflow behind a typed hook.
- [x] Consolidate account, report, draft, and payment state/operations into cohesive hooks; eliminate silent failures while preserving the UI's visible errors.
- [x] Keep URL/query state, Suspense, and page/component composition in `PagIbigReportsPage.tsx`; preserve existing API and workflow behavior.
- [x] Update technical documentation, project memory, and task history; run tests, focused ESLint, TypeScript impact, and whitespace checks.

Validation: all 136 configured tests pass. Focused ESLint and `git diff --check` pass. `npx tsc --noEmit` reports only the known unrelated Pag-IBIG loans-route typing issue and test-library/matcher typing issues; none point to the changed page or hooks. Account-save coordination and preview employee selection remain in the page because they update several workflow surfaces together.

# Iteration 14 — Add employee PhilHealth contribution history

- [x] Add an authorized employee-scoped PhilHealth history API that includes saved paid and unpaid report entries.
- [x] Aggregate saved contribution amounts by period and cover multi-employer, empty, and invalid-data cases with focused tests.
- [x] Add the Table/List history page, payment-date display, and Government-tab eye link.
- [x] Update page metadata, technical documentation, project memory, and task history.
- [x] Run focused tests, configured tests, relevant lint/type checks, and whitespace validation.

Validation: all 139 configured tests pass, including the 3 focused history tests. Focused ESLint passes for the new page, route, helper/tests, and `Sidebar`. The changed profile page still triggers the pre-existing `react-hooks/set-state-in-effect` error at line 229 (plus its existing `<img>` warning). `npx tsc --noEmit` reports only existing Pag-IBIG route and test typing errors, with none in the PhilHealth changes. `git diff --check` passes.

# Iteration 15 — Add PhilHealth ePAR and Pag-IBIG invoice details

- [x] Extend the employee PhilHealth history API/model to return ePAR number and date.
- [x] Add ePAR details to PhilHealth List view and show Pag-IBIG report PIN as Invoice No. in the employee List view.
- [x] Update the Government-tab Pag-IBIG eye destination and Sidebar metadata.
- [x] Update technical documentation, project memory, and task conversation; validate tests, lint, type impact, and whitespace.

Validation: all 139 configured tests pass and the 3 focused PhilHealth history tests pass. Focused ESLint on all changed TypeScript files has no errors when suppressing the pre-existing `react-hooks/set-state-in-effect` issue; it reports the existing profile `<img>` warning. The unmodified Pag-IBIG history page also has a pre-existing set-state-in-effect error. Full `npx tsc --noEmit` reports only the known unrelated loans-route and test typing issues. `git diff --check` passes.

# Iteration 16 — Stop chat polling after authentication expires

- [x] Preserve chat API HTTP status and cover 401 versus transient failures in client tests.
- [x] Stop presence, inbox, conversation, `/chat`, typing, and heartbeat requests on the first 401.
- [x] Clear expired auth, app user state, and route history, then redirect once to login.
- [x] Document behavior and update task history.
- [x] Run full tests, focused ESLint, TypeScript impact, and whitespace validation.

Validation: all 142 configured tests pass. Focused ESLint passes for the changed chat files. `npx tsc --noEmit` reports only the existing unrelated Pag-IBIG loans-route and test-library/matcher typing issues. `git diff --check` passes; Git emitted only line-ending normalization warnings for unrelated files.
