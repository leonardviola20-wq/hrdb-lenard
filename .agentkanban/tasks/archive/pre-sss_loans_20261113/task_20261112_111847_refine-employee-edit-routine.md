---
title: Refining 201 File Employee Add/Edit Routine
lane: todo
created: 2026-11-12T11:18:47+08:00
updated: 2026-11-12T11:18:47+08:00
description: Review and refine the employee profile add, edit, and save experience.
---

## Conversation

The user selected: **Check saves; Escape cancels.**

### agent

## Confirmed interaction

- The Check button saves the edited card.
- Pressing Escape while editing discards that card's unsaved values and exits edit mode; there is no separate X button.
- Only one card should be editable at a time, retaining the current editor's single-card-at-a-time behavior.
- Keep the Requirements tab unchanged and preserve `/employees/new` for adding employees.
- Remove the update-only `/employees/new/[id]` page after verifying the profile is its only remaining caller. The employee PATCH API remains because inline editing still needs it.
- The existing PATCH validator expects a complete employee payload, so inline saves must preserve all non-edited values (or deliberately introduce a safe partial-update contract) rather than accidentally clearing unrelated fields.

Ready for the TODO phase when requested. No application changes or TODO checklist were made during planning.

### user

Move the upload button to the bottom right, over the photo.

### agent

Moved the hover/focus-only upload button to overlay the photo at its bottom-right corner. Updated the technical and project workflow notes.

Validation: `npx tsc --noEmit` and `git diff --check` passed. Targeted ESLint reports the existing profile-tab state/effect error and `<img>` warning.

### user

Refinement: make the photo a bit larger and a vertical rectangle. Move the upload button above the photo and auto-hide it, showing it only on hover or keyboard focus.

### agent

Updated the profile photo to a 112×144px portrait rectangle and moved its upload icon above the photo. The control is hidden by default and fades in on hover or keyboard focus; its supported-format tooltip and upload behavior are unchanged.

Validation: `npx tsc --noEmit` passed; `git diff --check` passed. ESLint reports one pre-existing profile tab state/effect error and `<img>` warnings. Browser verification was unavailable because the shared browser is at `/login`.

### user

Plan how to refine the employee edit routine. Show me the current workflow for editing an employee profile, saving changes, and adding an employee, then create a task file for this work.

### agent

## Current 201 File workflow

### Editing an employee profile

1. Open an employee from the 201 File directory.
2. On the employee profile, use the pencil button beside the employee's name. This opens `/employees/new/[id]`.
3. The editor loads the selected employee, employer options, and Store In-charge supervisor options. It presents Personal Information, Employment, and Government tabs.
4. Existing employee details are displayed in cards. A card's pencil button enters edit mode for that card; only one card can be edited at a time. The card's check button saves, while its X button restores that card's values to their pre-edit state.
5. The editor also has a page-level **Save changes** action. Both that action and a card-level save submit the full employee form to `PATCH /api/employees/[id]`; a successful page-level save returns to the employee profile.

### Saving changes

1. The client sends the current full form, including calculated age and normalized employer/supervisor IDs.
2. The API checks authentication and 201 File access, then validates the complete employee payload. First and last name are required; dates, age, employer ID, job level, and supervisor ID are checked. A supervisor must be a different employee whose position is exactly Store In-charge.
3. A successful update returns the saved employee. A page-level save navigates back to its profile; a card-level save stays in the editor and displays “Changes saved.” Validation or server errors are displayed in the editor.
4. The page-level Cancel link navigates away. It does not currently ask for confirmation when there are unsaved changes. Card-level Cancel restores only that card's values.

### Adding an employee

1. Start from the Dashboard's **Add Employee** shortcut or the 201 File directory's **Add** button. Both open `/employees/new`.
2. The same three-tab editor starts with an empty form. All cards are editable directly; card-level edit/save controls are for existing employees.
3. Fill in the employee information and submit **Create employee**. The client sends `POST /api/employees`.
4. The API requires first name, last name, and biometric number, validates the other supported fields and supervisor, creates the employee, generates an employee code, and records the creator/assignment timestamp.
5. On success, the user is taken to the new employee's profile (or back to the relevant Pag-IBIG account workflow when that context was captured). Errors, including a duplicate biometric number, remain visible in the editor.

## Refinement plan

- Choose one clear save model for existing employees; the current card-level and page-level save actions overlap because both submit the full form.
- Make unsaved-change behavior explicit, especially when using the page-level Cancel/back navigation or switching tabs.
- Keep add and edit behavior distinguishable through the page title, fields, primary action, and post-save destination.
- Preserve the current validation, authorization, duplicate-biometric handling, and Pag-IBIG return behavior while refining the interaction.
- Verify loading, validation errors, successful add/edit, card cancel, page cancel, and duplicate submission behavior.

## Decision needed before TODO/implementation

Which existing-employee edit model should the refinement use?

1. **Keep the current card-based profile editing** and make its per-card and page-level save behavior clearer.
2. **Use one profile-wide edit/save flow** with a single primary save action.
3. **Keep only per-card saves** and remove the page-level save action.

No application code or TODO checklist has been changed. Waiting for the preferred edit model before turning this plan into implementation tasks.

### user

The planned routine is:

- Keep the View button on every employee directory card; it opens the employee profile.
- Remove the Edit button beside the employee's name in the profile header.
- Add an Edit button to every information card through the Government tab; Requirements is not included.
- When a card enters edit mode, replace its Edit button with a Check button in the same position. Do not show a separate X button. The Check control should save and also provide a way to cancel if the user decides not to proceed.
- Carefully remove the page reached by the profile-header Edit button.

### agent

## Updated plan

1. Preserve each employee directory card's View action and profile destination.
2. Remove the profile-header pencil/Edit link.
3. Add inline edit mode to every data card in Personal Information, Employment, and Government. Keep the Requirements tab and its existing checklist/account/attachment workflows unchanged.
4. Put the edit control in each card heading. In edit mode, replace it in place with a single Check control and no separate X control.
5. Save only that card's changed fields through the existing authenticated employee update API, while preserving validation and supervisor rules. Keep saved data reflected in the profile and report errors in the profile.
6. Remove only the edit-specific `/employees/new/[id]` route and its unused update-editor behavior after confirming no callers remain. Preserve `/employees/new` and its Dashboard/directory Add Employee entry points, since adding remains a separate workflow.
7. Preserve unsaved card values when the user is still editing; ensure cancel/discard does not persist them. Test every affected tab/card, validation failures, successful updates, and add/view navigation.

### Clarification needed

The single Check control cannot infer whether a click means “save” or “cancel” once values have changed. The intended cancel interaction needs to be defined before implementation. No code or TODO checklist has been changed.

### user

implement

### agent

Implemented the inline 201 File edit routine. Employee profile cards in Personal Information, Employment, and Government now replace Edit with a Check action while editing; Check saves and Escape discards the active card draft. Only one card can be edited at a time, and Requirements stays unchanged. Card saves use the existing authenticated PATCH endpoint, preserve other profile values, refresh the profile/cache data, and surface validation/save errors. Duplicate biometric-number updates now return a clear conflict response.

Removed the Edit icon beside the profile name, the obsolete directory list Edit link, and `/employees/new/[id]`. Directory View actions and `/employees/new` remain. Also corrected create-mode editor controls so fields stay enabled when adding an employee.

Validation: `npx next typegen` and `npx tsc --noEmit` passed; `npm test` passed all 145 tests; `git diff --check` passed. Targeted ESLint found two pre-existing errors (profile tab state set synchronously from an effect and directory `Date.now()` during render) and existing `<img>` warnings, with no new lint issues from this change. Browser interaction checks could not run because the shared browser was redirected to `/login`.

### user

We forgot photo updating. Add an upload button icon below the photo circle with a tooltip describing supported file types.

### agent

Added a profile-photo upload icon directly below the circular employee photo. Its tooltip names JPG, PNG, and GIF and the 2 MB maximum. Replaced photos save through the existing authenticated employee PATCH flow, update the displayed profile and cache, and show upload errors in the profile. File type and size validation is shared with the add-employee photo reader, whose picker now advertises the same supported formats. Added utility tests for supported types and the size limit.

Validation: `npx tsc --noEmit` passed; `npm test` passed all 145 tests; `npx vitest run components/employee-profile-editor/utils.test.tsx` passed all 13 editor utility tests; `git diff --check` passed. Targeted ESLint found one pre-existing profile tab state/effect error and existing `<img>` warnings; it found no new photo-upload lint issues. Browser verification remains unavailable while the shared browser is at `/login`.

### user

continue

### agent

Continued verification and fixed a cached-profile edge case: successful profile updates now refresh both the in-memory cache and rendered employee state even when the profile was served from cache. Card editing and photo replacement are prevented from overlapping.

Validation: `npx tsc --noEmit` passed; all 13 employee editor utility/photo validation tests passed; `git diff --check` passed. ESLint reports one pre-existing profile tab state/effect error and existing `<img>` warnings. Browser verification remains unavailable while the shared browser is at `/login`.

### user

Move the upload button to the bottom right, over the photo.

### agent

Moved the hover/focus-only upload button to overlay the photo at its bottom-right corner. Updated the technical and project workflow notes.

Validation: `npx tsc --noEmit` passed; `git diff --check` passed. Targeted ESLint reports the existing profile-tab state/effect error and `<img>` warning.

### user

Remove the words “Supported formats:” and “Maximum size:” from the upload tooltip.

### agent

Removed those labels from the tooltip while retaining the details as `JPG, PNG, GIF. 2 MB.` Updated the technical note and task checklist.

Validation: `npx tsc --noEmit` and `git diff --check` passed. ESLint reports one pre-existing profile-tab state/effect error and the existing photo `<img>` warning.

### user
