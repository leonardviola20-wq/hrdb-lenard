# Iteration 1

- [x] Create task + TODO files for PhilHealth UI Refinement and Workflow Polish
- [x] Reports Dashboard PhilHealth card: verified layout, employer gating, recent payment preview, shared "Reports" subheader; consistent with SSS/Pag-IBIG cards
- [x] Replace page title fallback "HRDB-Lenard" with "Philhealth Reports" for /reports/philhealth (Sidebar getPageTitle + getPageSubtitle)
- [x] Audit all PhilHealth buttons: consistent labels, states, focus, hover; payment form Cancel/Save styled consistently
- [x] Verify Employee List > Reports > Payments tab order, labels, and active states; combined into "Reports & Payments" tab
- [x] Combine Reports and Payments pages: removed separate Payments tab; Reports view shows combined reports + payment info
- [x] Fix List form to show max 9 rows: employeePageSize 8 → 9 (includes empty-row filler calc)
- [x] Lock footer at bottom: payment form footer is now flex sibling (shrink-0) outside scrollable content; report details modal footer already locked; report creation form already locked
- [x] Record PhilHealth Payment form: professional layout pass (2-column grid, required * indicators, peso prefix on Amount Paid, grouped fields, hover states, locked footer)
- [x] Overall professional UI pass: responsive checks at desktop + narrow widths

# Iteration 2

- [x] Set PhilHealth employee list page size to 8
- [x] Remove biometric number from employee list rows
- [x] Keep employee list internal scrolling
- [x] Show only active total in employee list footer
- [x] Remove Monthly Reports link from employee footer
- [x] Move Create Monthly Report action to employee toolbar
- [x] Redesign Add PhilHealth Account routine with scrollable list (max 5), active/inactive toggle default active, and Add/Add All/Cancel actions
- [x] Add All adds only filtered employees already assigned to the selected employer
- [x] Rename Payments page from Reports & Payments
- [x] Remove Refresh action from Payments page
- [x] Add search and year filters to Payments page
- [x] Remove employer name line from Payments report rows
- [x] Keep payment and report actions on Payments page
- [x] Run TypeScript, focused ESLint, and diff checks
