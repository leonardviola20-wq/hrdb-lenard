# SSS Contributions and Loans Database Migration

> **Status: target migration, backups, and restore validation complete; production cutover pending.** The contribution and loan schemas are applied, the verified SSS datasets are imported into their separate databases, and application code routes the relevant SSS reporting operations to those targets. Destination counts were rechecked after import. Native PostgreSQL archives were checksum-verified and restored into disposable databases; restored counts matched the targets. The disposable databases were removed. The source database remains intact; production environment configuration and cutover approval are still required.

## Scope and target boundary

This runbook covers SSS only. Pag-IBIG and PhilHealth remain in the existing application database.

The planned destination is two physical PostgreSQL databases:

1. **SSS contributions** — completed SSS contribution reports, their entries, and contribution drafts.
2. **SSS loans** — SSS loan accounts, completed SSS loan reports and entries, loan drafts, SSS-only Loans Monitoring report snapshots, and imported historical SSS loan reports.

`User`, `employee`, and `employer` remain in the central HR database. Report databases must not use cross-database foreign keys. Keep source HR IDs as reference values and preserve employer/employee/report snapshots in report records. The migration must not delete or rewrite source records during copy or validation.

Confirmed source: PostgreSQL `192.168.1.220:5432/hrdb_restore`, loaded from `.env.local`. The populated destinations on the same server are `hrdb_sss_contributions` and `hrdb_sss_loans`. The secure backup directory is `D:\VSCode\hrdb-backups\sss-reports-20261116`; its ACL is restricted to the current user, SYSTEM, and local Administrators. Store database connection values in environment configuration only; never put credentials in this document or in shell history.

## Current schema inventory

The source schema in `prisma/schema.prisma` describes the original central tables. The target schemas are in `prisma/sss-contributions/schema.prisma`, `prisma/sss-loans/schema.prisma`, and `prisma/sss-reports/schema.prisma`. Contribution and loan reports share the `SssReport` and `SssReportEntry` model shapes; report kind determines the destination database.

| Model/table | Current purpose | Destination |
|---|---|---|
| `SssReport` | Saved SSS report header; `kind` distinguishes `CONTRIBUTION` and `LOAN`; includes employer snapshot, PRN, applicable period, amount due, payment details, creator ID, and timestamps. | Contribution reports in `hrdb_sss_contributions`; loan reports in `hrdb_sss_loans`. |
| `SssReportEntry` | Report entries; includes employee and SSS identifiers/snapshots, contribution shares, loan amount/account references, and total. Has a local FK to `SssReport`. | Stored with its parent report in the corresponding reporting database. |
| `SssReportDraft` | Incomplete SSS drafts; `kind` distinguishes the form, with owner, optional employer, period, JSON entries, and claim metadata. | Stored by `kind` in the matching reporting database. Owner and employer IDs remain central-HR references, not cross-database FKs. |
| `SssLoan` | SSS source loan accounts, employer/optional employee IDs, account/type/date/amount/amortization/status. | `hrdb_sss_loans`. |
| `Loan` | Current SSS and Pag-IBIG loan accounts, distinguished by `provider`; includes employee ID, account/type/date/terms, amount, amortization, outstanding balance, and status. | SSS-provider accounts in `hrdb_sss_loans`; Pag-IBIG accounts remain central. |
| `LoanPayment` | Payment records linked to current `Loan` accounts, including payroll-period ID, amount, date, and source. | Payments whose parent loan is SSS are in `hrdb_sss_loans`; Pag-IBIG payments remain central. |
| `LoanMonitorReport` | Generated SSS/Pag-IBIG loan-monitor snapshot header with applicable date, employer/payment snapshots, aggregate totals, creator ID, and timestamps. | SSS-only snapshots in `hrdb_sss_loans`; complete mixed-provider and other snapshots stay central. |
| `LoanMonitorReportEntry` | Loan-monitor snapshot lines, including provider, loan/account/employee/employer snapshots, amounts, status, and a local report relation. `loanId` is a scalar ID, not a declared Prisma relation. | Complete SSS-only snapshots are in `hrdb_sss_loans`; mixed-provider and other snapshots stay central. |
| `ImportedSssLoanReport` | Provenance-preserving imported historical SSS payment report, keyed by source report ID and containing source/payment snapshots. | `hrdb_sss_loans`. |
| `ImportedSssLoanReportEntry` | Provenance-preserving imported historical report entry, keyed by source entry ID, with a local relation to its imported report. | `hrdb_sss_loans`. |
| `User`, `employee`, `employer` | Shared authentication and HR records referenced by reports and source loans. | Stay in the central HR database; reporting databases retain their IDs and copied display snapshots. |

### Current field-level structure

The field names below are from `prisma/schema.prisma`. Types/defaults/indexes must be rechecked against the confirmed live source and final migration before deployment.

- **`SssReport`** — PK `id`; `kind`, `employerId`, `employerName`, `employerAddress`, `employerSssNumber`, `prn`, `applicableMonth`, `applicableYear`, `amountDue`, `amountPaid`, `paymentType`, `payDate`, `sssBranch`, `transactionReference`, `createdBy`, `createdAt`, `updatedAt`. Current relations: employer, optional creator, entries. Indexes: employer/period and kind/created time.
- **`SssReportEntry`** — PK `id`; `reportId`, `employeeId`, `employeeName`, `employeeCode`, `employeeSssNumber`, `sssLoanId`, `loanAccountNumber`, `employeeEmployerId`, `employeeEmployerName`, `salaryRange`, `monthlySalaryCredit`, `employeeSs`, `employerSs`, `employeeMpf`, `employerMpf`, `ec`, `loanAmount`, `totalAmount`. Current local parent relation is `reportId`; optional employee and SSS loan relations must not become cross-database FKs.
- **`SssReportDraft`** — PK `id`; `createdBy`, `kind`, `employerId`, `prn`, `applicableMonth`, `applicableYear`, `amountDue` (string), `entries` (JSON), `continuedBy`, `continuedAt`, `createdAt`, `updatedAt`. Current creator relation cascades on user deletion; report drafts are partitioned by kind.
- **`SssLoan`** — PK `id`; `employerId`, `employeeId`, `employeeName`, `employeeCode`, `biometricNo`, `loanAccountNumber`, `transactionNumber`, `loanType`, `loanDate`, `loanAmount`, `monthlyAmortization`, `status`, `statusReason`, `createdAt`, `updatedAt`. Current employer relation restricts deletion; optional employee relation sets null.
- **`Loan`** — PK UUID `id`; `employeeId`, `provider` (`SSS` or `PAGIBIG`), `loanType`, `loanAccountNumber`, `loanDate`, `terms`, `statusReason`, `totalAmount`, `monthlyAmortization`, `outstandingBalance`, `status`, `createdAt`, `updatedAt`. Account number is unique in the current shared table; optional employee relation sets null.
- **`LoanPayment`** — PK UUID `id`; `loanId`, `payrollPeriodId`, `amountPaid`, `paymentDate`, `source`, `createdAt`. Current loan relation cascades on loan deletion.
- **`LoanMonitorReport`** — PK UUID `id`; `applicableDate`, `employerName`, `employerSssNumber`, `employerAddress`, `totalMonthly`, `totalOutstanding`, `prn`, `paymentDate`, `amountPaid`, `paymentBranch`, `transactionReference`, `createdBy`, `createdAt`. Optional creator relation sets null; report entries cascade with the report.
- **`LoanMonitorReportEntry`** — PK UUID `id`; `reportId`, `loanId`, `provider`, `loanType`, `loanAccountNumber`, `employeeName`, `loanDate`, `terms`, `totalAmount`, `monthlyAmortization`, `outstandingBalance`, `status`, `statusReason`, `employerName`, `employerSssNumber`, `employerAddress`. `reportId` is the declared parent relation; `loanId` is a scalar with no declared Prisma relation.
- **`ImportedSssLoanReport`** — PK `sourceReportId`; `sourceKind`, `sourceEmployerId`, employer/payment snapshots (`employerName`, `employerAddress`, `employerSssNumber`, `prn`, applicable period, due/paid amounts, payment type/date, branch, transaction reference), `sourceCreatedBy`, `sourceCreatedAt`, `sourceUpdatedAt`, `importedAt`. Entries are local children.
- **`ImportedSssLoanReportEntry`** — PK `sourceEntryId`; `sourceReportId`, `sourceEmployeeId`, `employeeName`, `employeeCode`, `employeeSssNumber`, `sourceSssLoanId`, `loanAccountNumber`, `sourceEmployeeEmployerId`, `employeeEmployerName`, `salaryRange`, `monthlySalaryCredit`, `employeeSs`, `employerSs`, `employeeMpf`, `employerMpf`, `ec`, `loanAmount`, `totalAmount`. `sourceReportId` is a local parent FK.

### Relationship handling

- Keep report-to-entry and imported-report-to-entry parent-child relations inside their destination database.
- Preserve `SssLoan` and `Loan` source account identifiers, related `LoanPayment` rows, and loan-monitor snapshot identifiers. Any relationships to records outside the target database must be represented by IDs and snapshots rather than cross-database constraints.
- Preserve `createdBy`, `employeeId`, `employerId`, `sourceCreatedBy`, and related source IDs as references. Resolve them against central HR only at runtime where needed.
- Do not infer missing employee, employer, payment, loan balance, or status data.
- Keep each original report and entry ID. Report IDs may exist in both physical databases because each database is independent.

The inventory above was checked against the source and applied target Prisma schemas. Target table counts were rechecked after import; see the verified counts below.

### Mixed-provider loan-monitor snapshots: selected policy

The current UI and report model allow a single `LoanMonitorReport` to contain both SSS and Pag-IBIG entries; its header totals and payment metadata apply to the full snapshot. Filtering out Pag-IBIG entries would make the copied report inconsistent with its saved totals, while copying the full snapshot would move Pag-IBIG data into the SSS loans database.

**Selected policy: keep the complete mixed-provider snapshot in the central database and migrate only SSS-only snapshots.** This avoids copying Pag-IBIG entries into the SSS database and avoids changing the original shared totals. Mixed snapshots are excluded from the SSS loan database and must remain accessible from the central database.

## Sidebar destinations

The Reports menu has:

- **Contributions** → `/reports/sss?kind=CONTRIBUTION`
- **Loan** → `/reports/sss?kind=LOAN`

The old standalone Loans sidebar shortcut is removed. This does not remove `/loans` or change its route/API authorization. Reports route access remains governed by the existing Reports permission.

## Confirmed identities and current status

Confirmed:

- Source: PostgreSQL `192.168.1.220:5432/hrdb_restore`.
- Contributions target: PostgreSQL database `hrdb_sss_contributions` on the source server.
- Loans target: PostgreSQL database `hrdb_sss_loans` on the source server.
- Backup folder: `D:\VSCode\hrdb-backups\sss-reports-20261116`, ACL restricted to current user, SYSTEM, and local Administrators.
- Mixed-provider policy: keep complete mixed-provider loan-monitor snapshots central; migrate only SSS-only snapshots.

Completed: target schemas and migrations, import and field-level verification, application database routing, post-import destination count verification, and native target archives. The source rows were not deleted or rewritten.

Still required: configure production with explicit `SSS_CONTRIBUTIONS_DATABASE_URL` and `SSS_LOANS_DATABASE_URL`, smoke-test the deployed application, and obtain production cutover approval. The production URLs must point to the exact database names above. Do not record credentials here.

## Backup and migration procedure

The source model inventory, logical exports, physical migration, target backups, and restore testing are complete. Production cutover remains:

1. The source model inventory was recorded from `prisma/schema.prisma`. Logical exports were captured in one PostgreSQL `RepeatableRead` transaction.
2. The two filtered SSS dataset exports and the Prisma schema snapshot were written to the restricted external directory. Checksums and JSON structure were verified after writing. These logical migration exports are retained as source snapshots, in addition to the native target archives below.
3. Reviewed target schemas and initial migrations were applied. Central HR tables are not present in the reporting databases; references to HR records remain scalar IDs and snapshots.
4. Contribution and loan exports were imported into their respective targets. The importer compared source and target fields and counts; it did not delete or rewrite source records. Complete mixed-provider monitoring snapshots remain central.
5. Post-import destination counts were rechecked. The contribution database contains 114 reports and 1,556 entries. The loans database contains 34 legacy reports/251 entries, 63 `SssLoan` accounts, 43 SSS `Loan` accounts, 0 SSS loan payments, 7 SSS-only monitor reports/47 entries, and 32 imported historical reports/238 entries. Both databases contain 0 drafts.
6. Native schema-and-data archives were created and SHA-256 checksummed. `pg_restore --list` confirmed each archive's catalog. Both archives were restored into disposable databases, their table counts matched the verified targets, and the disposable databases were dropped.
7. Application routes now use the target connections for SSS reporting data. Development may derive target names from `DATABASE_URL`; production requires explicit target URLs. Configure and smoke-test production, then obtain cutover approval before any source cleanup.

Generate the custom Prisma clients as part of development startup or the production build with `npm run prisma:generate:sss`; the `predev` and `prebuild` lifecycle hooks run the command automatically. Ensure both target databases are reachable and correctly named in the environment. The central Prisma client generation remains part of `prebuild`.

The logical backups can be regenerated with:

```powershell
npx tsx scripts/export-sss-report-backups.ts --env-file .env.local --expected-host 192.168.1.220 --expected-port 5432 --expected-database hrdb_restore --output-dir "D:\VSCode\hrdb-backups\sss-reports-20261116"
```

The exporter refuses a source identity mismatch, an output directory inside the repository, or a non-empty output directory.

Do not run broad database dumps or restore commands until the exact source, target, and backup paths are confirmed. Keep backup files outside the repository and restrict access because they contain employee and payment data.

## Backup manifest

Captured `2026-11-16T02:26:19.790Z` from `192.168.1.220:5432/hrdb_restore`. Files are outside the repository at `D:\VSCode\hrdb-backups\sss-reports-20261116`.

| Dataset | File | Size | SHA-256 | Export integrity |
|---|---|---:|---|---|
| SSS Contributions | `sss-contributions-backup.json` | 1,225,228 bytes | `db1fdb87b1a01dc447810c23fb35723d5a686fe3bdfdd37747454bca283b4996` | JSON parsed; checksum verified |
| SSS Loans | `sss-loans-backup.json` | 525,730 bytes | `71af8c8461f32cc8176b8925d9f307e7c8d0f3ec151e883ac1f31042c36bef29` | JSON parsed; checksum verified |
| Source Prisma model schema | `sss-reports-source-schema.prisma` | — | `16dd9e98bcb5c162d550d49685a1c53e59cdd9a00dc695c94e5382a4f0b71805` | Checksum verified |
| Manifest | `sss-reports-backup-manifest.json` | — | See file | Counts and export checksums recorded |
| Contributions target archive | `sss-contributions-20261116.dump` | 35,592 bytes | `83ac9c3341334e2cdbcba083576ca0dc454172a8e40668ea3393b045310a6be5` | Catalog verified and disposable restore matched 114 reports/1,556 entries/0 drafts |
| Loans target archive | `sss-loans-20261116.dump` | 49,407 bytes | `9a73d147afe23087d445283b6d6fd1ea792927c1fca9c6873f9b00bd30d1011d` | Catalog verified and disposable restore matched all listed counts; 0 non-SSS monitor entries |

| Dataset counts | Reports | Entries | Drafts | Other rows |
|---|---:|---:|---:|---|
| SSS Contributions | 114 | 1,556 | 0 | — |
| SSS Loans | 34 legacy + 7 SSS-only monitor + 32 imported historical | 251 legacy + 47 monitor + 238 imported | 0 | 63 `SssLoan` accounts; 43 SSS `Loan` accounts; 0 loan payments |

The native archives contain the populated target schemas and data. Independent restores into disposable databases succeeded and the test databases were removed. Production cutover has not occurred; the original source database remains intact.

## Rollback

Before cutover, rollback means leaving the original source database untouched and discarding/recreating only the unapproved destination databases. After cutover, stop report writes, route the application back to the original source using the approved release/configuration rollback, and reconcile writes made after cutover before retrying. Never restore over the source database as a rollback shortcut.

## Completion record

The approved source, target, and external backup identities are listed above. The target row counts, native archive checksums, and successful disposable restore results are recorded. Append production smoke-test results, cutover approval, and the rollback reference after those steps are approved and performed. Do not remove or alter the original source data before then.
