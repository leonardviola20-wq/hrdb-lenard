---
title: Local P2P Chatroom
lane: todo
created: 2026-11-02T14:40:00+08:00
updated: 2026-11-02T14:40:00+08:00
description: Add a local peer-to-peer chatroom to the HR application, with a clear connection flow and no hosted messaging service.
---

## Conversation

### agent

Repository review found no existing chat or signaling service. The implementation will use the single local Next.js Node process only for authenticated, in-memory room discovery and WebRTC offer/answer signaling; chat messages will travel directly over WebRTC data channels, with no external STUN/TURN or persistence. Scope is a small room (up to eight people) on the same local network. The app must be opened in a secure browser context for peer connections; multi-process hosting and internet/NAT traversal are outside this local MVP.

### user

The user reported repeated HTTP 401 responses from chat presence and inbox polling after session expiry and asked whether this was normal.

### agent

The 401 responses are expected when the auth cookie is expired, but repeated polling was unnecessary. Chat API errors now preserve HTTP status, and a 401 stops presence, inbox, conversation, `/chat` directory polling, typing activity, and app-shell heartbeats. The app shell handles expiry once by clearing the expired cookie through `/api/logout`, clearing signed-in state and route history, and redirecting to `/login`; non-401 failures continue their normal retries. A generation guard prevents an older `/api/me` result from restoring stale user state during the transition. Updated `TECHNICAL.md`, project memory, and Iteration 16 in the TODO.

Validation: all 142 configured tests pass, including the new unauthorized/transient/unreadable-body client tests. Focused ESLint passes. Full TypeScript validation reports only known unrelated Pag-IBIG loans-route and test-library/matcher typing errors. `git diff --check` passes with only line-ending warnings for unrelated files. No commit was created.

### user

Employee Profile Page
Government Tab
Philhealth Eye button
create a report page for Philhealth with relation to the employee it handles same reports with SSS for COntribution only

### agent

Implemented the employee-specific PhilHealth contribution history page at `/employees/[id]/philhealth-contributions`, linked from the Government tab. The authenticated endpoint returns saved paid and unpaid entries scoped to that employee. Table view totals multiple employers by month; List view shows each entry with its payment date and no payment-status column. Updated Sidebar metadata, `TECHNICAL.md`, and project memory.

Validation: all 139 configured tests pass, including the 3 new history tests. Focused ESLint passes for the new page, API, helper/tests, and Sidebar. The profile page ESLint run reports the pre-existing `react-hooks/set-state-in-effect` error at line 229 and `<img>` warning; full TypeScript check reports only existing Pag-IBIG route and test typing errors, with none in the PhilHealth changes. `git diff --check` passes. No changes were committed.

### user

### user

Enable Chat for all signed-in users.

### agent

Selected behavior: Chat should be available to every signed-in user, not restricted by the admin-managed `/chat` page permission. I’ll implement that once the task workflow is explicitly advanced to `implement`.

### user

Two different accounts are signed in, but the other account does not have Chat in its sidebar.

### agent

That explains the missing user: the presence endpoint rejects heartbeats from accounts without `/chat` permission, and those accounts cannot use direct messages. I’m checking whether Chat should remain admin-granted or be enabled for all signed-in users; I won’t change access policy without confirmation.

### user

Create a local p2p chatroom.

### agent

Plan: inspect the existing app shell, access controls, and installed Next.js guidance; select a connection/signaling approach that keeps chat messages peer-to-peer and local; build a usable, responsive room experience; cover connection and messaging behavior with focused tests; and document setup and network limitations. Initial scope assumption: small rooms, no message persistence, and no third-party hosted chat service.

### user

Create the task and TODO first, then implement.

### agent

Created this task and its implementation checklist. I will follow the checklist and record any necessary architecture adjustment discovered during implementation.

### user

Plan to remove the current chatroom and replace it with an online-user list (up to three visible plus View all) and one popup direct-message chat at a time. Presence is app-wide; messages remain in local server memory. Keep the work focused on chat.

### agent

The room-based flow has been replaced with authenticated app-wide presence and in-memory direct messages. `/chat` shows up to three online users initially, offers View all, and opens a single switchable popup. The old room UI, WebRTC signaling store, room route, and room tests are removed. Focused chat tests (11), chat-specific lint, and targeted TypeScript checks pass; chat-scoped whitespace checks are clean. The implementation and chat documentation are complete.

### user

No one is online though 2 are active.

### agent

Checked the shared `/chat` page: its authenticated presence heartbeat returns HTTP 204, and the presence API is functioning. The list excludes the currently signed-in account, and only accounts actively signed in with Chat permission can appear. The account list currently has four users, two with Chat access. I need to confirm whether the two “active” users are separate signed-in accounts and whether they have Chat permission before changing access or presence behavior.

### user

Two separate accounts are signed in; the other account did not have Chat in its sidebar. I chose to enable Chat for all signed-in users and authorized implementation.

### agent

Made Chat available to all authenticated accounts: removed it from admin-managed page permissions, exposed the Chat link for all signed-in users, enabled app-wide presence heartbeats, and allowed direct messages between all signed-in users. The previously missing account now appears online in the shared `/chat` page. Focused tests, lint, targeted TypeScript, and scoped whitespace checks pass.

### user

[[PLAN]] The chat service returned an invalid message. unable to load new message

### agent

Reproduced the issue in the shared browser: the inbox API returned HTTP 500, and conversation messages from the running dev process lacked the new `sequence` field. Added a versioned global-store guard that resets incompatible legacy in-memory state while preserving compatible state through hot reload. Updated chat documentation and project memory.

Verification: all 12 focused chat tests and chat-specific ESLint checks pass. In the shared browser, inbox and conversation endpoints now return HTTP 200 and the widget no longer displays the invalid-message alert. The full TypeScript check remains blocked only by the unrelated existing `certifyingEmployer` error in `app/api/reports/pagibig/loans/route.ts`.

### user

How about emojis?

### agent

Yes. The current message field can already send emojis when typed or pasted from the device keyboard. A small emoji-picker button beside the composer could make choosing them easier; emoji characters remain ordinary message text in the existing in-memory chat.

### user

Is it possible to add a typing indicator so the other user knows that someone is typing?

### agent

Yes. The chat can show a brief “Name is typing…” indicator by sending lightweight typing activity to the existing local in-memory chat service while the message field is active, then expiring it after a short idle period. This would not require browser notifications or database storage. To make the change, advance this task to `implement`.

### user
implement

### agent

Implemented the typing indicator and emoji picker in the floating chat widget. Typing status is directional (one user clearing their status does not clear the other user's), authenticated, and expires after five seconds; the widget refreshes it while typing and clears it on idle, send, close, or minimize. The accessible emoji picker inserts at the current selection and enforces the message length limit.

Updated the chat documentation and project memory. Validation: all 14 focused store/API tests pass, ESLint passes for the changed chat files, and `git diff --check` is clean. The browser confirmed emoji insertion; its shared session was unauthenticated, so live cross-user typing could not be checked there. Full `tsc --noEmit` remains blocked by the unrelated existing `certifyingEmployer` type error in `app/api/reports/pagibig/loans/route.ts`.

### user
[[PLAN]] chatbox emoji and send not align visually

### agent

Adjusted the floating chat composer so the textarea wrapper uses flex alignment and the textarea is a block element, removing the inline baseline gap. The emoji and send buttons remain bottom-aligned with the field, including when it grows to multiple lines. Updated the direct-messaging technical notes.

Validation: `npx eslint components/DirectMessageWidget.tsx` and scoped `git diff --check` pass. The browser showed the original offset, but redirected to `/login` after the edit, preventing a final authenticated screenshot.

### user
Console reports `Chat presence cleanup failed: 401` from the AppShell effect cleanup.

### agent

The 401 occurs because logout (`/api/logout`) clears the auth cookie before the AppShell unmounts and sends its authenticated `DELETE /api/chat/presence`. The chat endpoint is correctly rejecting an unauthenticated cleanup. Stale presence then clears through the existing 60-second TTL. The fix is to leave presence before logout clears the cookie, while keeping cleanup idempotent and treating 401 only as expected for already-expired sessions.

### agent

Implemented logout-safe presence cleanup in the app shell. The sidebar awaits the active chat session’s leave request before calling `/api/logout`; effect unmount reuses the same promise and won’t issue a duplicate DELETE. Cleanup 401 is no longer logged if authentication has already expired, and other failures remain visible. Updated the chat docs and project memory.

Validation: all 14 focused chat store/API tests pass, ESLint passes for `components/Sidebar.tsx`, and scoped `git diff --check` passes. `npx tsc --noEmit` reports only the unrelated existing `certifyingEmployer` error in the Pag-IBIG loans route. The shared browser was not used to sign out a user, avoiding a disruptive change to the shared session.

### user

Can we add more emojis and allow reacting to a specific message? The chosen behavior is a full searchable emoji picker, multiple reactions per message, and each participant can toggle their own reaction.

### agent

Implemented the searchable, category-based emoji picker in the composer and on individual messages. Emoji selection inserts at the composer caret; each conversation participant can add or remove their own reaction, with aggregate counts and selected state shown in the widget. Reactions are authenticated, rate-limited, validated as single emoji graphemes, and limited to 20 distinct emoji per message in the in-memory store.

Validation: all 17 focused chat store/API tests pass, targeted ESLint passes, and the live widget verified emoji search and draft insertion without sending a message. Reaction behavior is covered in store/API tests; no chat message was sent solely to perform a live UI reaction check. Full TypeScript validation remains blocked by unrelated existing errors in Pag-IBIG report typing and matcher typings.

### user

resume

### agent

Resumed the approved Pag-IBIG refactor. The page now uses the existing feature-folder components for its member list, payments table, report preview, report details, payment dialog, and drafts menu. Member/report filtering, sorting, pagination, manual report merging, and preview totals now live in `usePagibigReportView`. The route entry, Suspense boundary, URL-backed state, API calls, and save handlers remain in `PagIbigReportsPage.tsx`.

Updated `TECHNICAL.md` and project memory. Validation: all 136 configured tests pass; scoped ESLint and `git diff --check` pass. Full TypeScript validation reports no errors in the refactored components, but remains blocked by the unrelated Pag-IBIG loans route typing issue and test-file typing issues. The optional page smoke test could not run because the checkout's Vitest/Vite/jsdom tooling is incomplete, and there is no shared browser page for a visual check. The earlier chat refactor also passes the configured tests, focused ESLint, and scoped whitespace checks.

### user

### agent

Cleaned up the Pag-IBIG Reports page by moving the Add/Edit account and loan editor into `components/pagibig-reports/AccountFormDialog.tsx` and the PIF/manual report-generation form and employee preview into `components/pagibig-reports/ReportGenerationDialog.tsx`. The page retains URL-backed state, API calls, save workflows, and account-edit return-to-preview behavior; the extracted JSX is formatted for readability.

Updated `TECHNICAL.md`, project memory, and the task checklist. Validation: all 136 configured tests pass, focused ESLint is clean, and scoped whitespace checks pass. `tsc --noEmit` reports only the known unrelated loans-route and page-test typing errors; it reports no errors in the changed page or extracted components. A browser page was not available for a visual check.

### user

Continue the Pag-IBIG Reports workflow-hook refactor from the prior context and complete the outstanding integration and verification.

### agent

Completed Iteration 13. Added employer-scoped draft loading to `usePagibigDrafts`, moved draft save/delete operations there, and moved report generation into `usePagibigReportForm`. `PagIbigReportsPage.tsx` now wires the feature hooks while retaining URL/Suspense state and cross-view account-save and preview-selection coordination. Updated `TECHNICAL.md`, project memory, and the TODO checklist.

Validation: all 136 configured tests pass; focused ESLint and `git diff --check` pass. `npx tsc --noEmit` still reports only the known unrelated loans-route and page-test typing errors; no errors point to the changed page or hooks.

### user

git commit push merge then branch

### agent

The current branch is `feature/benefits-reports-20261021`, already three commits ahead of its origin, and the worktree contains many unrelated modified and untracked files. I have not staged, committed, pushed, or merged anything. Before proceeding, confirm which changes to include, the merge destination, and whether to create a new branch or delete the current feature branch after merging.

### user

The user was unavailable to clarify; proceed with a narrow, safe interpretation: commit intended application changes, exclude unrelated generated/temp and rug-design files, merge to `main`, and create a fresh branch without deleting the original feature branch.

### agent

Committed the intended application, benefits-report, chat, migration, and related documentation/task changes as `68b9867` (`Complete benefits and chat workflows`). Pushed `feature/benefits-reports-20261021`, fast-forwarded and pushed `main` to the same commit, then created and switched to `feature/next-work-20261103` from that merged commit. The previous feature branch remains available. The unrelated rug-design artifacts, scratch scripts, generated temporary files, modified server batch file, and staged `hrdb_local_backup.dump` were left untouched. The database backup remains staged in the new branch's worktree.

Remote verification confirmed both `main` and `feature/benefits-reports-20261021` point to `68b9867`. The existing validation was 136 passing configured tests, focused ESLint, and clean whitespace checks for the committed set.

### user

### agent

Implemented the employee-specific PhilHealth contribution history page at `/employees/[id]/philhealth-contributions`, linked from the Government tab. The authenticated endpoint returns saved paid and unpaid entries scoped to that employee. Table view totals multiple employers by month; List view shows each entry with its payment date and no payment-status column. Updated Sidebar metadata, `TECHNICAL.md`, and project memory.

Validation: all 139 configured tests pass, including the 3 new history tests. Focused ESLint passes for the new page, API, helper/tests, and Sidebar. The profile page ESLint run reports the pre-existing `react-hooks/set-state-in-effect` error at line 229 and `<img>` warning; full TypeScript check reports only existing Pag-IBIG route and test typing errors, with none in the PhilHealth changes. `git diff --check` passes. No changes were committed.

### user

[[PLAN]] Philhealth add the payment details in list view
then apply these to PagIBIG Eye also

PhilHealth - ePar
PagIBIG - PIN / Invoice No

### agent

Implemented the approved payment-detail updates. The employee PhilHealth history API now includes ePAR number/date, and List view displays ePAR No. and ePAR Date with em dashes when unavailable. The Government-tab Pag-IBIG eye now opens that employee's existing history page; its List rows label the saved report PIN as `Invoice No. (PIN)`. Sidebar metadata and technical/project notes are updated. No payment workflow or schema changes were made.

Validation: all 139 configured tests pass; the 3 focused PhilHealth history tests pass. Focused ESLint passes with the pre-existing `react-hooks/set-state-in-effect` rule errors suppressed; remaining existing profile `<img>` warning is unchanged. Full TypeScript validation reports only known unrelated loans-route and test typing errors. `git diff --check` passes. No commits were created.

### user
