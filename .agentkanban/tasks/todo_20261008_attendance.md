# Iteration 1

- [x] Remove branch filtering from daily and date-range attendance views.
- [x] Add alphabetically sorted employee cards as the default view and a toggle to the existing list view.
- [x] Update attendance documentation and verify the UI changes with the repository's checks.

# Iteration 2

- [x] Roll back the unintended attendance-page and attendance documentation changes.
- [x] Remove the Branch A–Z sort option from the employee directory.
- [x] Keep employee cards alphabetically sorted by default and add a list-view toggle.
- [x] Update employee-directory documentation and validate the corrected page.

# Iteration 3

- [x] Move the Cards/List toggle beside the import action and remove the manual sort selector while preserving alphabetical order.
- [x] Redesign employee list rows to show photo, name with biometric below, position, branch, employer, active status, phone, email, and actions.
- [x] Update documentation and validate lint/type-check and whitespace.

# Iteration 4

- [x] Replace the labeled Cards/List controls with one icon-only toggle reflecting the current view.
- [x] Group Import beside Export in the toolbar.
- [x] Update documentation and verify lint and whitespace.

# Iteration 5

- [x] Ask where to save employee CSV exports using the browser Save As picker when supported.
- [x] Preserve standard download behavior when the picker API is unavailable and handle cancellation/errors.
- [x] Document and validate the export flow.

# Iteration 6

- [x] Show employee import/export success messages in a dismissible popup notification instead of an inline banner.
- [x] Verify the notification UI with lint and whitespace checks.

# Iteration 7

- [x] Sort employee cards A–Z by their displayed first-middle-last name on initial load.
- [x] Verify the shared sorted data continues to order both cards and list consistently.

# Iteration 8

- [x] Limit the employee-status dropdown to Active employees and Inactive employees.
- [x] Keep the separate quick filters and verify lint/whitespace.

# Iteration 9

- [x] Make the employee filter and quick-filter toolbars sticky below the application header.
- [x] Verify lint and whitespace.

# Iteration 10

- [x] Keep the sticky employee toolbar above scrolling cards and list content with a stronger stacking layer.
- [x] Validate employee-page lint and whitespace; record the browser verification limitation.

# Iteration 11

- [x] Keep the sticky employee toolbar visibly below the app header with an 8px gap and ensure the header layers above it.
- [x] Validate the responsive sticky offsets and run page lint and whitespace checks.

# Iteration 12

- [x] Remove the sticky gap so scrolling content cannot appear between the application header and employee filters.
- [x] Move the desktop sidebar toggle fully inside the sidebar so it no longer overlaps employee-page controls.
- [x] Run lint and whitespace checks.

# Iteration 13

- [x] Remove sticky positioning from the employee filters and quick filters so they scroll normally with the page.
- [x] Update employee-directory technical notes and project memory.
- [x] Run employee-page lint and whitespace checks.

# Iteration 14

- [x] Restore the desktop sidebar toggle to its original position slightly outside the sidebar edge.
- [x] Verify the sidebar lint and patch whitespace.

# Iteration 15

- [x] Move the sidebar toggle below the app header while keeping its original horizontal position and protrusion.
- [x] Run sidebar lint and whitespace checks.

# Iteration 16

- [x] Restore the sidebar toggle to its original vertical position at `top-20`.
- [x] Run sidebar lint and whitespace checks.

# Iteration 17

- [x] Position the sidebar toggle over the Employee Directory title header, left of the title text.
- [x] Run sidebar lint and whitespace checks.

# Iteration 18

- [x] Keep the sidebar toggle in its current position and draw it above the desktop title header so the full circle is visible.
- [x] Update technical notes and project memory.
- [x] Run sidebar lint and whitespace checks.

# Iteration 19

- [x] Restore the sidebar toggle to the original `top-20` position so it no longer overlaps the collapsed sidebar logo.
- [x] Run sidebar lint and whitespace checks.

# Iteration 20

- [x] Redesign dashboard birthday notifications as compact horizontally scrolling photo/name/countdown tiles.
- [x] Add access-aware “See all” navigation, upcoming count, and stacked avatar preview.
- [x] Include employee photo URLs and days-until values in the authorized birthday reminders response.
- [x] Run targeted lint and whitespace checks; note unrelated pre-existing dashboard lint and type-check violations.

# Iteration 21

- [x] Increase the birthday card minimum height and let the tile carousel expand into the extra space.
- [x] Enlarge birthday portraits, initials, names, and footer avatar stack.
- [x] Run dashboard lint and whitespace checks.

# Iteration 22

- [x] Reduce celebrant tile width to show four items at a time.
- [x] Make celebrant names semibold and replace the arrow with no-tail chevrons.
- [x] Add previous/next carousel controls and keyboard focus for navigating birthdays.
- [x] Run dashboard lint and whitespace checks; note existing type-check errors.

# Iteration 23

- [x] Display three celebrant tiles at a time and slightly enlarge photo/fallback avatars.
- [x] Display only the first given name above the last name on each tile.
- [x] Update reminders response shape, technical notes, and project memory.
- [x] Run dashboard lint and whitespace checks; note the pre-existing type-check blocker.

# Iteration 24

- [x] Add the celebrant's month/day birthdate at the bottom of each tile.
- [x] Highlight cards when the celebrant's birthday is today.
- [x] Run targeted lint and whitespace checks; note the pre-existing type-check blocker.

# Iteration 25

- [x] Change the Employee Directory add button label to “Add” without changing its icon or behavior.
- [x] Run employee-page lint and whitespace checks.

# Iteration 26

- [x] Remove the biometric label from the employee list name cell while keeping its number visible.
- [x] Move Clear All beside the view toggle and replace its text with an accessible refresh icon.
- [x] Run employee-page lint and whitespace checks; ESLint reports four existing `<img>` warnings and no errors, and `git diff --check` passes.

# Iteration 27

- [x] Add employee checkboxes to both card and list views, including visible-row select-all in the list.
- [x] Add validated bulk transfer API for selected employees' branch and employer; preserve unrelated data.
- [x] Add destination branch/employer controls and success/error handling; refresh employee data after transfer.
- [x] Add date joined beside the card photo and after Email in list view.
- [x] Replace direct View/Update buttons with accessible three-dot action disclosures in both views.
- [x] Update technical notes and project memory; ESLint and whitespace checks pass. TypeScript check remains blocked by existing errors in `app/api/contacts/[id]/route.ts`.

# Iteration 28

- [x] Replace vertical action dots with bold horizontal dots in card and list views.
- [x] Move the card-view transfer checkbox beside the action menu.
- [x] Format Date Joined in bold as `MMM dd, yyyy`.
- [x] Run targeted ESLint (no errors; four existing `<img>` warnings) and `git diff --check`.

# Iteration 29

- [x] Move admin Export/Import/Select Employee/Transfer into a separate right-side card aligned with toolbar and quick-filter/count area.
- [x] Hide all employee selection checkboxes until admin activates selection mode.
- [x] Show destination controls only after Transfer is pressed with selected employees; support branch-only, employer-only, or both.
- [x] Make bulk-transfer API admin-only and validate optional assignment fields.
- [x] Update technical notes/project memory. ESLint passes with four existing `<img>` warnings; `git diff --check` passes. Type-check remains blocked by errors in `app/api/contacts/[id]/route.ts`.

# Iteration 30

- [x] Remove the Employee actions heading from the admin action card.
- [x] Show Transfer only while Select Employee mode is active.
- [x] Update documentation and run targeted lint/whitespace checks; ESLint has no errors and four existing `<img>` warnings, `git diff --check` passes.

# Iteration 31

- [x] Return Export and Import to the main toolbar and remove the admin action card.
- [x] Add admin-only “Transfer Employee” below the toolbar and align it with the quick-filter/count row.
- [x] Animate a vertical transfer panel below the button; reveal selectors after employee selection.
- [x] Update technical notes/project memory and run targeted lint/whitespace checks; ESLint has no errors and four existing `<img>` warnings, `git diff --check` passes.

# Iteration 32

- [x] Move Transfer Employee beside Export/Import and match toolbar sizing, styling, and shadow.
- [x] Lay out destination controls horizontally when space allows; keep the animated panel in normal flow so cards remain unobstructed.
- [x] Update technical notes/project memory and run targeted lint/whitespace checks; ESLint has no errors and four existing `<img>` warnings, `git diff --check` passes.

# Iteration 33

- [x] Move Transfer before Export and Import and shorten its label to “Transfer.”
- [x] Prevent destination selectors from stretching across the panel and rename the transfer action to “Transfer.”
- [x] Update technical notes/project memory and run targeted lint/whitespace checks.

# Iteration 34

- [x] Right-align the toolbar actions.
- [x] Hide Cards/List, refresh, Transfer, Export, and Import controls on mobile while keeping them visible at large breakpoints.
- [x] Update technical notes/project memory and run targeted lint/whitespace checks; ESLint reports no errors and four existing `<img>` warnings, `git diff --check` passes.

# Iteration 35

- [x] Add a left-aligned magnifying-glass toggle for mobile search and filters.
- [x] Show the search box and status, employer, and branch filters vertically when toggled open.
- [x] Update technical notes/project memory and run targeted lint/whitespace checks.

# Iteration 36

- [x] Align the mobile Showing count on the same row as the magnifying-glass button in both filter states.
- [x] Keep the desktop count in its existing toolbar row without a duplicate mobile count.
- [x] Update technical notes/project memory and run targeted lint/whitespace checks.

# Iteration 37

- [x] Remove excess space below the closed mobile search/count row by eliminating empty responsive rows and collapsed-panel margin.
- [x] Preserve comfortable spacing beneath the expanded mobile filter stack and active transfer panel.
- [x] Update technical notes/project memory and run targeted lint/whitespace checks; ESLint has no errors and four existing `<img>` warnings, `git diff --check` passes.

# Iteration 38

- [x] Replace the profile's Back control with a circular previous-record navigation control and remove the separate summary card, aligning the header and adjusting photo size.
- [x] Add icons to profile tabs; rename Personal to Personal Information and Government to Government ID.
- [x] Move contact and emergency information cards into the Personal Information tab.
- [x] Update technical notes/project memory and run targeted profile checks. ESLint passes with one existing `<img>` warning; `git diff --check` passes. Full TypeScript check remains blocked by existing errors in `app/api/contacts/[id]/route.ts`.

# Iteration 39

- [x] Remove uppercase styling from employee profile field labels.
- [x] Make employee profile field values semibold.
- [x] Run targeted ESLint and `git diff --check`.

# Iteration 40

- [x] Ensure employee profile labels use normal font weight while values remain semibold.
- [x] Run targeted ESLint and `git diff --check`.

# Iteration 41

- [x] Plan confirmed: normalize profile card headings and add relevant icons; reorganize Employment into Contract Duration, Contract Position Details, and Contract Details.
- [x] Confirmed Job Level options: Entry-level, Junior, Mid-level, Senior, Supervisor/Lead, Manager, Executive.
- [x] Confirmed persisted/editable Job Level and Supervisor; supervisor candidates limited to other Store In-charge employees.
- [x] Implement tenure/expiry calculations and profile card content; seven focused tenure/expiry cases pass within the full 30-test library suite.
- [x] Add schema/migration/API/form support for Job Level and Supervisor. Prisma validation, targeted ESLint, and whitespace checks pass. Prisma client generation hit a Windows engine-file lock from the running dev server; its generated TypeScript definitions include the new fields. Full tsc remains blocked by pre-existing errors in `app/api/contacts/[id]/route.ts`.
- [x] Update technical notes/project memory and validate the changed surfaces.

# Iteration 42

- [x] Check and apply the pending employee Job Level/Supervisor migration to the configured local PostgreSQL database after employee queries failed on missing `employee.jobLevel`.
- [x] Verify Prisma reports the database schema is up to date and document the per-database migration requirement.

# Iteration 43

- [x] Resolve employee Assigned By account IDs to display names in profile and directory detail views while preserving the stored audit value.
- [x] Cover account-ID parsing, display-name fallbacks, legacy values, and missing accounts with unit tests.
- [x] Run targeted tests, ESLint, and `git diff --check`; full TypeScript checking remains blocked by existing contact-route errors.
- [x] Update technical documentation and project memory.

# Iteration 44

- [x] Restore a Back-to-Employees link and add previous/next record navigation beside it, with boundary controls disabled.
- [x] Spell out years, months, and days in service duration and simplify expected work hours to `48 hours`.
- [x] Update duration tests, technical notes, and project memory; run targeted validation.

# Iteration 45

- [x] Remove the duplicate profile-level Back link and place the previous/next controls beside the shared AppShell Back button.
- [x] Validate profile and shared shell lint, type checking, and whitespace. ESLint and whitespace checks pass; full TypeScript check remains blocked by existing contact-route errors.
- [x] Update technical notes and project memory.

# Iteration 46

- [x] Preserve Status, Branch, and Employer filter values in employee profile, previous/next, and Back URLs; keep the directory filters synchronized from the URL when returning.
- [x] Add editable profile navigation filters, a filtered scope/count label, and nearest-matching alphabetized navigation while keeping excluded profiles open at `00 of N`.
- [x] Add focus-ring spacing around shared record controls and wrap the directory `useSearchParams` consumer in Suspense.
- [x] Add focused navigation tests; run employee/profile/API/shell lint, TypeScript, and whitespace checks; update technical notes and project memory. Six tests pass, targeted ESLint has no errors (five existing `<img>` warnings), and `git diff --check` passes; full TypeScript checking remains blocked by five existing errors in `app/api/contacts/[id]/route.ts`.

# Iteration 47

- [x] Move the employee profile Status, Branch, and Employer filters plus the navigation scope/count out of the standalone card and into the shared top row beside Back and previous/next controls.
- [x] Make the shared action row wrap and bottom-align controls so selectors remain usable on narrow screens.
- [x] Update technical notes and project memory; verify profile/sidebar lint, navigation tests, TypeScript status, and whitespace.

# Iteration 48

- [x] Remove visible labels from profile navigation filters while retaining accessible names.
- [x] Match dropdown font size to the Employee Directory filters.
- [x] Update technical notes and project memory; run targeted lint and whitespace checks.

# Iteration 49

- [x] Remove padding from the shared profile top action toolbar wrapper.
- [x] Update technical notes and project memory; run targeted lint and whitespace checks.

# Iteration 50

- [x] Remove the Employee Directory toolbar wrapper padding while retaining the page gutter alignment.
- [x] Update technical notes and project memory; run targeted lint and whitespace checks.

# Iteration 51

- [x] Add a bounded, short-lived client cache for profile details and prefetch previous/next employee records.
- [x] Skip the full navigation roster query for prefetched details after the roster is loaded; mark API responses private/no-store and clear cache at logout.
- [x] Run focused lint, employee tests, TypeScript, and whitespace checks; update technical notes and project memory. Seventeen tests pass, lint has no errors (one existing `<img>` warning), and `git diff --check` passes; full TypeScript remains blocked by five existing contacts-route errors.

# Iteration 52

- [x] Remove the “Active employees” group choice from the profile Status dropdown while retaining inherited directory selections.
- [x] Refresh employee/navigation data when a profile filter changes and navigate to the first alphabetized match (stay on the current record if no matches).
- [x] Add first-match helper tests and update technical notes/project memory; run lint, focused tests, TypeScript, and whitespace validation.

# Iteration 53

- [x] Add an eye action after the Branch filter to open the first alphabetically sorted employee matching current directory filters and search.
- [x] Provide the action beside the mobile Branch filter and disable it when no records match.
- [x] Update technical notes/project memory and validate directory lint and whitespace.

# Iteration 54

- [x] Remove the card shadow treatment from the Employee Directory toolbar and filter wrapper.
- [x] Restyle desktop and mobile eye buttons with a blue visual treatment.
- [x] Update technical notes/project memory and verify lint and whitespace.

# Iteration 55

- [x] Remove the Status/Active employees selector from the employee profile toolbar while preserving any inherited status scope.
- [x] Keep Branch and Employer selectors and align them to the right side of the shared header actions.
- [x] Update technical notes/project memory and validate profile lint and whitespace.

# Iteration 56

- [x] Replace Employee Directory card/list three-dot menus with direct eye (View) and pencil (Edit) icon actions.
- [x] Preserve transfer-selection checkboxes and filter-aware profile links.
- [x] Update technical notes/project memory and verify lint, tests, and whitespace.

# Iteration 57

- [x] Add an A–Z and `#` first-character filter for contacts using the selected contact/company sort field.
- [x] Align the alphabet controls with the contact count and include alphabet selection in Clear filters.
- [x] Update technical notes/project memory and validate Contacts lint and whitespace.

# Iteration 58

- [x] Persist the 17 employee requirement checklist statuses and expose authorized individual updates.
- [x] Add the Requirements tab and per-employee markable checklist to employee profiles.
- [x] Add a dashboard statistic for employees missing one or more requirements.
- [x] Apply the employee requirements migration and regenerate Prisma Client after releasing the development server's file lock.
- [x] Verify the database migration state, restart and check the development server, and rerun tests, targeted lint, TypeScript, and whitespace validation. TypeScript still reports five existing contacts-route errors.
