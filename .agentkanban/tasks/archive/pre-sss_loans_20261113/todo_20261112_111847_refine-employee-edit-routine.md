---
title: Refining 201 File Employee Add/Edit Routine
lane: doing
created: 2026-11-12T11:26:39+08:00
updated: 2026-11-12T11:26:39+08:00
description: Implement card-level editing on employee profiles and retain employee creation.
---

# Iteration 1

- [x] Add profile card-level edit/save controls for Personal Information, Employment, and Government cards; Escape discards the active card draft.
- [x] Save the active card through the existing employee update API, preserve all other employee fields, update profile/cache state, and surface errors.
- [x] Remove the employee profile header Edit action and all directory/list links to the obsolete edit route while preserving View and Add Employee actions.
- [x] Remove only the edit-specific `/employees/new/[id]` page and simplify editor-only update behavior without changing `/employees/new`.
- [x] Update `TECHNICAL.md` and project memory to describe the inline edit flow.
- [x] Run targeted tests, lint, and TypeScript checks; verify the profile/add routing and key interactions.

Validation: `npx next typegen` and `npx tsc --noEmit` passed; `npm test` passed all 145 tests; `git diff --check` passed. Targeted ESLint reported two existing errors (profile tab state set synchronously from an effect and directory `Date.now()` during render) plus existing `<img>` warnings; it reported no new issues in the changed code. Browser interaction verification was unavailable because the shared browser was redirected to `/login`.

# Iteration 2

- [x] Add profile-photo upload button below the circular employee photo, with supported formats and size in its tooltip.
- [x] Validate file type and size, persist the photo using the authenticated employee update flow, and refresh the profile/cache.
- [x] Verify TypeScript, targeted lint, tests, and whitespace.

Validation: `npx tsc --noEmit` passed; `npm test` passed all 145 tests; `npx vitest run components/employee-profile-editor/utils.test.tsx` passed all 13 editor utility tests; `git diff --check` passed. Targeted ESLint found one pre-existing profile tab state/effect error and existing `<img>` warnings; no new photo-upload lint issues.

# Iteration 3

- [x] Ensure edits refresh visible state when the profile was served from cache.
- [x] Prevent photo upload and card editing from overlapping.
- [x] Re-run TypeScript, focused photo validation tests, targeted lint, and whitespace checks.

Validation: `npx tsc --noEmit` passed; all 13 photo/editor utility tests passed; `git diff --check` passed. Targeted ESLint still reports one existing profile tab state/effect error and existing `<img>` warnings.

# Iteration 4

- [x] Enlarge the employee photo into a portrait rectangle and move the upload control above it, auto-hidden except on hover/focus.
- [x] Update the technical and project workflow notes.
- [x] Verify TypeScript, lint, and whitespace.

Validation: `npx tsc --noEmit` passed; `git diff --check` passed. ESLint reports one pre-existing profile tab state/effect error and `<img>` warnings. Browser verification unavailable at `/login`.

# Iteration 5

- [x] Move the hover/focus-only upload button to the photo's bottom-right corner as an overlay.
- [x] Update the technical and project workflow notes.
- [x] Verify TypeScript, lint, and whitespace.

Validation: `npx tsc --noEmit` and `git diff --check` passed. ESLint reports one pre-existing profile-tab state/effect error and the existing photo `<img>` warning.

# Iteration 6

- [x] Remove the “Supported formats:” and “Maximum size:” labels from the upload tooltip while retaining its type and size details.
- [x] Update the technical note and task conversation.
- [x] Verify TypeScript, lint, and whitespace.

Validation: `npx tsc --noEmit` and `git diff --check` passed. ESLint reports one pre-existing profile-tab state/effect error and the existing photo `<img>` warning.
