# Technical Notes

## Employee category configuration

Employee branch, position, and employment status choices are stored in the `EmployeeCategory` table. The `type` values are `BRANCH`, `POSITION`, and `EMPLOYMENT_STATUS`; the migration seeds the existing employee-form options. Categories are soft-deactivated with `active = false`, preserving employee records that still contain an inactive value.

`/management/system-configuration` is available to administrators from the Management section in the sidebar. `/api/management/categories` allows administrators to list, add, and activate/deactivate categories. Authenticated users with employee-page access may read the categories for employee forms. New and updated employee profiles use active category values while preserving any currently selected legacy value.
