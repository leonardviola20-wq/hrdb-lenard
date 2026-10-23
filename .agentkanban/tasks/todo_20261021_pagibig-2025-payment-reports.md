# Iteration 1

- [x] Trace the 2025 failure through year selection, draft state, client eligibility, API validation, and the available employer account data. Browser interaction could not be reproduced because the app redirected to login.
- [x] Update Pag-IBIG employee account management to let users select an account year when adding/editing and view accounts for the selected employer/year, keeping the current year as the default and retaining the existing report eligibility rules.
- [x] Ensure report preview and generation use only the selected employer's exact-year, non-excluded accounts with valid MIDs; do not copy 2026 values into 2025 automatically. Preserve duplicate-period protection and existing report/payment behavior.
- [x] Add regression coverage for historical account-year entry/listing and 2025 report generation, and confirm current-year behavior remains unchanged; run focused lint, type-check, relevant tests, and whitespace validation. The unit tests cover 2025 selection and shared year validation; authenticated report generation could not be exercised because the local database has no 2025 account data and the browser redirects to login.
