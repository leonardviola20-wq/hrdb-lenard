---
title: Pag-IBIG 2025 Payment Report Generation
lane: todo
created: 2026-10-21T17:20:00+08:00
updated: 2026-10-21T17:20:00+08:00
description: Investigate and fix Pag-IBIG Payment Reports failing to generate reports for 2025.
---

## Conversation

### user

PagIBIG Payment Reports cannot generate reports for 2025.

### agent

Captured this as a Pag-IBIG report-generation task. The likely investigation path is the Payments page's year and applicable-period selection, client eligibility/generation state, the report-generation API validation, and the employer/year/month uniqueness and lookup logic. The fix should support generating a report for 2025 without changing current-year defaults or allowing duplicate periods. No code has been changed in this task-capture step.

### user

### agent

Investigation is complete. No application code or database data was changed.

- The current local database has no Pag-IBIG account records for 2025 for any employer. For Basirat OPC (employer 2), there are 13 account records for 2026 (2 included in reports, 11 excluded), but none for 2025. There is a saved draft for February 2025, but drafts do not create or supply the year-specific account records required by report generation.
- The report preview loads accounts for the selected employer and exact report year. The client disables **Save Report** when there are no eligible preview entries. The API also queries only records matching the requested employer and year, requiring a non-excluded account and a non-empty MID; with no matches it returns HTTP 400: “Add at least one employee Pag-IBIG account for this year before generating a report.”
- The report API accepts 2025 as a valid year. The failure is therefore not a year-validation or duplicate-period issue: historical 2025 member account snapshots are missing. The Employee List account form defaults account year to the current calendar year, so it currently provides no straightforward way to create those missing 2025 records.
- I could not reproduce the interaction in the browser because navigation redirected to `/login`; the matching database state, client disable condition, and server rejection establish the blocking path.

To produce an accurate 2025 report, the employer's 2025 account amounts, MID eligibility, and loan data must be entered/imported as 2025 records. Reusing 2026 account values for 2025 would create an inaccurate report. No fix was implemented because this turn requested investigation only.

### user

todo

### agent

TODO refined from the investigation: enable account management for a chosen historical year (keeping the current year as the default), preserve exact-year report eligibility and duplicate protections, and add regression coverage for historical and current-year flows. Historical account values must be entered/imported from accurate source data; the system must not populate 2025 from 2026 values. Browser reproduction was blocked by the login redirect, so regression validation should include the report and account-management paths.

### user

implement

### agent

Implemented historical Pag-IBIG account-year management without creating or copying any account data:

- Added a year selector to the Employee List for 2020 through the current year, defaulting to the current year. Selecting a year reloads that employer/year's accounts and resets stale search, status, and pagination state.
- Add/Edit account forms now use and display the selected account year. Selecting an employee for a new account no longer substitutes that employee's other-year account year.
- Centralized the supported 2020–2200 year validation across member-account, report, and draft APIs. Report preview and generation continue to filter accounts by exact employer/year, non-excluded status, and non-empty MID.
- Added unit coverage for the 2025 selector option, current-year default ordering, and shared year validation. Updated `TECHNICAL.md` and project memory.

Validation passed: focused Pag-IBIG tests (7 assertions/tests), ESLint on changed app/API/test files, `npx tsc --noEmit`, `npx next build` (53 static pages), and `git diff --check`. I did not create a 2025 report because the local database has no actual 2025 account amounts/loan details, and could not verify the UI in-browser because the shared browser redirects to login. The exact-year generation rules and duplicate protection were preserved.

### user

Task
Year picker is fine
the only problem is that when the user picks a year, there are no records showing after
can you suggest a better workflow for this?

### agent

Recommended workflow: keep the year picker, but do not make it hide the employer's roster. Always show employees currently assigned to the selected employer **and** employees who have a Pag-IBIG account record for that employer in any year. For the selected year, show each employee's matching account if one exists; otherwise show an explicit “Not set up for [year]” state and an action to add that year's record. Include a “Missing setup” count/filter so the user can focus on unconfigured employees.

The Add action should create only the selected year's snapshot and prefill the employee's globally stored MID when available. It should not copy savings, MP2, or loan amounts from another year; those values need accurate source data. In the report preview, if no accounts are eligible, give a direct action to open Employee Accounts with the report year selected. A bulk import can be considered later if there are many historical accounts to enter.

This addresses why changing to 2025 can look like there are no employees: the current list query includes current employer members and records matching the selected employer **and selected year**, so a former employee with only a 2026 record disappears from the 2025 roster. No code was changed in response to this workflow suggestion.

### user
