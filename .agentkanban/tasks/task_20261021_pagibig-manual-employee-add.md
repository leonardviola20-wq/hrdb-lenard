---
title: Manual Employee Addition from Pag-IBIG
lane: todo
created: 2026-10-21T17:59:12+08:00
updated: 2026-10-21T17:59:12+08:00
description: Allow users to manually add employees through the Pag-IBIG employee workflow.
---

## Conversation

### user

task
allow to add employees manually

### agent

Captured a new Pag-IBIG workflow task. The implementation scope needs to distinguish between adding an existing HR employee to the selected employer's Pag-IBIG roster and creating a brand-new HR employee directly from Pag-IBIG. The workflow should preserve the selected employer and account year and must not invent or copy historical account amounts.

### user

task

inspect the workflow if it fits to the current workflow
make it fit

### agent

Workflow inspection found that HR employee creation already has an established path at `/employees/new` backed by `POST /api/employees` and the shared `validateEmployeePayload`. It requires first and last name; the create UI/API also require a Biometric Number. The API assigns the employee code, and the HR form supports employer assignment and Pag-IBIG MID entry.

To fit the existing routine, do not create a second employee model or a reduced custom HR form inside Pag-IBIG. Keep the current employee picker for employees already in HR. Add a “Create new employee” route from that flow to the existing HR form with the selected employer prefilled; after a successful employee save, return to Pag-IBIG with the selected employer and account year restored, then open the new employee's Pag-IBIG account form. The user enters year-specific savings, MP2, and loan data there from accurate records; nothing should be copied from another year.

This keeps the HR directory as the source of truth and allows the newly created person to continue into the employer-scoped Pag-IBIG account workflow. The task/TODO now reflect integration with the current workflow. No application code was changed during this inspection.

### user

implement

### agent

Implemented the manual employee addition path using the existing HR creation workflow:

- Added **Create new employee** to the Pag-IBIG Add Account form, carrying the selected employer and account year to `/employees/new`.
- The existing HR form preselects that employer and continues to enforce its normal employee fields, Biometric Number requirement, generated employee code, and API authorization.
- After successful creation, the form returns to the Pag-IBIG Employee List with employer/year restored and the new employee's account form opened. The existing MID is prefilled when available; the chosen year's savings, MP2, and loan amounts are not copied from another account.
- Added tested helpers for safely validating return context and constructing creation/setup routes. Updated `TECHNICAL.md` and project memory.

Validation passed: 10 focused Pag-IBIG tests, TypeScript check, production build (53 static pages), and `git diff --check`. ESLint reported no errors; it retains one existing `@next/next/no-img-element` warning in the HR employee form. The shared browser remained unauthenticated, so the authenticated end-to-end interaction could not be exercised. No report/account data was created, and no authorization bypass was added.

### user

see image
this is where we create the Report add a button so the user can select an employee, the selected employee shows in there

### agent

Understood: the requested entry point is the **Generate Pag-IBIG Report** dialog shown in the screenshot, not only the Employee List's Add Account dialog. The TODO should add an **Add Employee** action inside report creation. It should open an employer/year-aware employee picker and add the selected person to the visible preview.

To keep report figures accurate, selecting an employee without a Pag-IBIG account snapshot for the report year should show them in the preview as needing account setup, with a direct action to configure that selected year's account. Such a row must not be counted Ready or included in the generated report until the account has a valid MID and eligible account data. Existing account values for other years must not be copied. After the selected-year account is saved, refresh the report preview and show the employee with the saved values.

This change relocates the main workflow entry point into the report dialog while reusing the existing account form and the HR employee creation path. No application code was changed in response to this screenshot request; the implementation TODO is updated to this intended surface.

### user

the only problem in there is when you change the year the list vanishes, since that is happening, we add it manually so it will populate the list form

### agent

Thanks for clarifying the reason for manual selection: when the report year changes, the year-scoped employee list becomes empty, so the user needs an **Add Employee** action in the Generate Report form to bring an existing HR employee into that form's list. This should not be limited to employees already returned by the selected-year Pag-IBIG account query.

The picker should use the employer's employee roster, let the user add an employee to the visible report form, and then support setting up that employee's account for the selected year if needed. The year-specific values must still be entered accurately; selecting someone only makes them visible in the form and must not make them report-ready or fabricate contribution/loan values. I will keep the implementation scoped to this workflow.

### user

to give you an idea on the workflow
when the user press the generate button
the report page automatically populates the list with the current employees related to that employer
those list disappears when the user changes the year selector

### agent

That clarifies the issue: the Generate action initially populates the report form from the employer's current employee roster, but changing the report year replaces or clears that list. The manual-add control should let the user restore/select employees from that same employer roster in the still-open report form after changing years. It should preserve the existing initial population and only address the lost list on year change; account eligibility and report values remain specific to the selected year.

### user

update the todo list, then implement

### agent

Updated Iteration 4 to capture the clarified year-change behavior, then implemented the report workflow:

- The Generate Report preview now defaults to **All Employees**, so employer employees remain visible even when they have no account snapshot for the selected year.
- Changing the year retains the employee list, clears stale-year values while accounts reload, and ignores out-of-order responses. Added a **No Account for Year** filter with a **Set Up Account** action.
- Added an **Add Employee** picker in the report form. It adds an HR employee once, keeps that selection during year changes, and ties account setup to the report's selected year and employer.
- Employees without a selected-year account, without an MID, or marked excluded do not count as Ready. The report continues to generate from saved, exact-year eligible accounts only.
- Added pure helper regression tests and documented the workflow in `TECHNICAL.md` and project memory.

Validation: all 13 focused Pag-IBIG tests, ESLint, TypeScript, `git diff --check` for the changed files, and `npx next build` passed. `npm run build` could not complete its Prisma prebuild step because Windows returned `EPERM` renaming the generated Prisma query-engine DLL; running `npx next build` with the existing generated client completed the full 53-page production build. The shared browser rendered the dashboard but the Pag-IBIG page smoke check was inconclusive, so authenticated interaction was not confirmed. No database records, reports, or account data were created.
