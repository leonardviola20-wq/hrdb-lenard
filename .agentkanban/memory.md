# Project Memory

- Next.js app uses App Router pages under `app/` and route handlers under `app/api/`.
- API authentication uses `getAuthenticatedSession` from `lib/auth.ts`; employee data access is checked against `User.accessiblePages` for non-admin users.
- Employee branch, position, and status fields remain strings on the `employee` model. Their selectable values are managed in the `EmployeeCategory` table and are soft-deactivated to preserve existing employee data.
- Consult the installed Next.js docs under `node_modules/next/dist/docs/` before adding or changing Next.js conventions.
