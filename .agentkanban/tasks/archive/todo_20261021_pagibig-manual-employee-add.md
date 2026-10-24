# Iteration 1

- [x] Clarify the intended workflow: keep selecting existing HR employees and also allow creating a new HR employee through the established employee form.
- [x] Inspect existing employee creation and Pag-IBIG account workflows, including required identity fields, employer assignment, employee-code generation, MID, selected account year, and year-specific account amounts.
- [x] Implement the agreed manual-add workflow using existing validation and authorization conventions, without fabricating or copying year-specific account amounts.
- [x] Add regression coverage for the validated employer/year return context and account-setup URL; run focused lint, type-check, relevant tests, production build, and whitespace validation. Authenticated end-to-end interaction was unavailable.

# Iteration 2

- [x] Add a Pag-IBIG employee-picker action that routes to the existing `/employees/new` flow with the selected employer and a safe return context containing the Pag-IBIG employer and account year.
- [x] After HR employee creation succeeds, return to Pag-IBIG, restore the employer/year, and open the created employee's account setup; preserve generated employee code, biometric-number validation, and existing HR workflow.
- [x] Continue to save the account under the selected employer/year through the existing account form; do not copy savings, MP2, or loan data from another year. Exact-year report eligibility is unchanged; authenticated verification was unavailable because the browser requires login.
- [x] Add focused regression coverage and run lint, type-check, relevant tests, production build, and whitespace validation.

# Iteration 3

- [x] Add an **Add Employee** action inside the Generate Pag-IBIG Report dialog shown in the user's screenshot. The employer and report year must scope employee selection and account setup.
- [x] Let the user select an employee and show that employee in the report preview. For employees without a saved account for the selected year, show an explicit setup-needed state and open the existing Add/Edit Account form for that employee/year.
- [x] Keep setup-needed, missing-MID, and excluded employees out of the Ready count and generated report. Require valid selected-year account data; never copy savings, MP2, or loans from another year. Refresh the preview after account save.
- [x] Preserve the existing HR employee creation route for employees not yet in HR and return to the same selected employer/year/report flow after creation.
- [x] Add regression coverage for selecting configured and unconfigured employees in the report dialog, account setup/refresh, and report eligibility; run focused lint, type-check, tests, production build, and whitespace validation.

# Iteration 4

- [x] Keep the employer's employee list populated in the Generate Report form when the report-year selector changes; retain the list during loading and clear stale-year amounts before refreshing.
- [x] Add an **Add Employee** picker in the open report form to manually select an HR employee, append them without duplicates, and preserve that selection during year changes.
- [x] Load and associate account snapshots by the selected report year, keeping employees with no account for that year visible but not report-ready; never copy values from another year.
- [x] Preserve the existing Generate behavior and report eligibility rules, add regression coverage, and run focused tests, lint, TypeScript, production compilation, and whitespace validation.
