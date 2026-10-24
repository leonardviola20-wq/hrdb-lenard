# Iteration 1

- [x] Replace the PhilHealth “Coming soon” dashboard card action with employer-gated Contribution and Payments links, preserving selected-employer context and Reports access behavior.
- [x] Add a PhilHealth employer-scoped Employee List page with employer name/PHIC header, Add/search/All-Active-Inactive/reset toolbar, paginated list, and totals footer.
- [x] Implement all-employee selection for Add Account; associate the account with the selected Reports employer, preserve employee PhilHealth number, and support Active/Inactive list filtering.
- [x] Design and add PhilHealth account, monthly contribution report, report entry, and payment persistence models plus Prisma migration; preserve existing employee PhilHealth and employer PHIC fields.
- [x] Add authorized employer-scoped APIs for employee accounts, monthly reports, and separate payment details; calculate Amount Due as the sum of manually entered employee contribution amounts.
- [x] Add monthly contribution report creation and report list flow, including employee selection and manually entered amounts.
- [x] Add a PhilHealth Payments/history page and compact employer-scoped recent payment preview on the dashboard card.
- [x] Implement payment form and storage for Payor Name, PEN, SPA, Applicable Period, Amount Paid, Accredited Collecting Agent, Transaction Confirmation No., Transaction Date, ePAR No., and ePAR Date.
- [x] Validate access gating, employer scope, account add/list/filter/reset, report totals, payment save/history, Prisma schema validation, lint, type-check, tests, and whitespace; the migration was not applied.
- [x] Run `npx prisma generate` to complete Prisma Client generation; verify the generated client with `npx tsc --noEmit`.

# Iteration 2

- [x] Remove whitespace text from placeholder `<tr>` rows to prevent React hydration warnings; verify with focused ESLint, TypeScript, and whitespace checks.

# Iteration 3

- [x] List employees assigned to the selected employer first in Add Account while retaining all employees as selectable choices.
- [x] Return a clear setup response when PhilHealth account storage is missing; verify with focused ESLint, TypeScript, and whitespace checks.
- [x] Restore the five authoritative applied Pag-IBIG migration sources from the local backup and verify their SHA-256 checksums against the database records; do not reuse the legacy Pag-IBIG migration from Git history, which has a different schema.

# Iteration 4

- [x] Apply the PhilHealth migration after user authorization and verify `npx prisma migrate status` reports the database schema up to date.

# Iteration 5

- [x] Add a visible close/dismiss control to the “PhilHealth account added to this employer.” success confirmation so users can close it when they are done.

# Iteration 6

- [x] In the PhilHealth Employee List, show Employee Name and replace the EMP Number column with Biometric Number.

# Iteration 7

- [x] Display the Biometric Number directly beneath the employee name in the PhilHealth Employee List instead of in a separate column.

# Iteration 8

- [x] Standardize shared visual design and common interactions across SSS, Pag-IBIG, and PhilHealth reports while preserving provider-specific workflows and data; extract shared components only where patterns are genuinely identical.

# Iteration 9

- [x] Wrap the SSS reports client page in a Suspense boundary to support prerendering its `useSearchParams()` usage; validate with focused lint, type-check, and production build.

# Iteration 10

- [x] Refine the SSS contribution/loan report table for the tested desktop viewport so amount and date values remain readable without awkward wrapping, while preserving responsive behavior and the shared benefits-report styling; verify the result visually at desktop and narrow widths.

# Iteration 11

- [x] Replace the descriptive subheader on each SSS, Pag-IBIG, and PhilHealth card in the Reports Dashboard with the shared label “Reports”.
