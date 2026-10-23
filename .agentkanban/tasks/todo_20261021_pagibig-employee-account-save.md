# Iteration 1

- [x] Scope Add Account employee options to employees assigned to the selected employer, while preserving the picker’s search and loading/error behavior.
- [x] Validate on the account-save API that the selected employee belongs to the selected employer; return a clear client error for invalid combinations.
- [x] Preserve existing account upsert and post-save refresh; clear stale search/status/page filters so the just-saved employee is visible in the Employee List.
- [x] Run focused lint/type checks and relevant tests. Existing tests do not include an API route integration harness, so route-level regression coverage was not added.

# Iteration 2

- [x] Show all available employees in Add Account, and allow saving their account under the currently selected Reports employer even when their employee record is assigned elsewhere.
- [x] Include employees assigned to the selected employer or having a Pag-IBIG account record for that employer/current year in the Employee List, without duplicate rows.
- [x] Ensure newly added accounts are saved as Active and show in the Active Employee List after refresh; update client/server behavior and documentation consistently.
- [x] Run focused lint/type checks, unit tests, and whitespace validation.

# Iteration 3

- [x] Match Pag-IBIG Payments report row heights to the compact 44px Employee List rows while preserving readable report-period, payment, amount, and action content.
- [x] Match the Payments pagination footer's vertical spacing, typography, button sizing, and alignment to the Employee List footer while retaining report counts and pagination behavior.
- [x] Preserve sticky headers, column styling, responsive horizontal scrolling, and current report/payment actions.
- [x] Run focused lint, TypeScript, and whitespace checks.
