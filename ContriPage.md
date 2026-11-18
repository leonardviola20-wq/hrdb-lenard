# Contribution Page

## Revised requirements

### Reports dashboard

- [x] Remove all provider cards from the Reports dashboard.
- [x] Remove the Employer selector and its related dashboard content.
- Keep the dashboard header; it no longer requests employer data.

### Contribution landing page

- Use the existing contribution-page header copy as the starting point:
  - Title: `Contribution Page`
  - Subtitle: `Monitor SSS employer contributions and loan payments.`
- Show three provider buttons: `SSS`, `PagIBIG`, and `Philhealth`.
  - [x] On mobile, provider buttons fill the available width and stack vertically; on larger screens they use a horizontal row with natural widths.

### Provider pages

- [x] Use the selected provider and employer to show saved contribution payments on the landing page.
- [x] Keep the employer filter required before provider buttons activate.
- [x] Add a separate all-reports page for complete paid and unpaid contribution reports.
- [x] Preserve the existing SSS, PagIBIG, and Philhealth route redirects.
- [x] Reuse existing provider report APIs, authorization, employee details, and PhilHealth payment dialog on the full-report page.

### Back button refinement

- [x] Replace back navigation controls with a consistent, reusable circular icon-only `BackButton`.
- [x] Use a left chevron without an arrow shaft/tail.
- [x] Apply the shared component across existing and future back controls.
- [x] Keep each control accessible with a descriptive label and a visible-on-hover tooltip.

### Additional refinements implemented

- [x] Place route-level Back buttons beside page headings on the left, including employee, SSS report, configuration, and provider pages. The all-reports page uses its clickable breadcrumb instead; modal and workflow Back controls remain with their workflows.
- [x] Use the existing PagIBIG and Philhealth report APIs for contribution-only display; no loan functionality was added.
- [x] Add compact side-by-side SSS, PagIBIG, and PhilHealth previous-year/current-year-to-date summary cards and monthly line comparisons to the Reports dashboard; remove the dashboard heading/subtitle.
- Loans analytics are omitted pending later integration; existing Loans navigation remains unchanged.
- PagIBIG and Philhealth data still use the central Prisma `DATABASE_URL`; no separate provider database clients are configured.

## Implemented routes

- `/reports` — Government-specific annual contribution comparisons; no Reports Dashboard heading/subtitle, provider navigation cards, Employer selector, or employer-loading states.
- `/reports` — contribution analytics displays compact SSS, PagIBIG, and PhilHealth panels side by side on desktop and stacked on mobile. Each has accent-bordered previous full calendar year and current year-to-date total cards and an accessible two-line monthly comparison by applicable contribution month.
- `/reports/contributions` — Contribution Page with a vertically stacked employer/provider card fixed while scrolling on desktop and normal-flow on mobile, beside selected-provider latest payments. Provider selection is URL-backed; the right panel shows up to twelve paid contributions. Desktop rows show period, payment date, and amount paid; mobile rows show only period and amount paid. Each provider button has an adjacent disclosure that expands an inline submenu like the Reports sidebar, with a disabled New placeholder followed by View; View opens that provider's all-reports page for the selected employer.
- `/reports/contributions/all` — all saved contribution reports for the selected provider and employer, with a plain “Contribution / {provider}” breadcrumb above the employer header. The clickable Contribution breadcrumb provides return navigation without a Back button. The employer header shows employer name, provider number without a label, and address. The list uses provider-specific identifier columns (SSS PRN Number, PagIBIG PIN, PhilHealth SPA Number), and View opens report details in a popup. On desktop/large screens, the columns are distributed evenly across the list card; mobile rows show only period and amount due. The report list scrolls within a card sized for about eight rows, with the column header outside the vertical scroll region and only report rows scrolling below it; matching stable scrollbar gutters keep columns aligned. The SSS detail popup uses the saved employer snapshot without labels and places Report Details and Payment Details in a 30/70 desktop split, stacked on mobile. Ordinary labels sit beside their values; Amount Due and Amount Paid use label-above, large bold values. Payment Details arranges Trans Ref: beside Paid Branch: on the first row and Pay Date: beside Pay Type: on the second, with Amount Paid below. A Print button prints only the open report. The SSS employee table columns are evenly sized and ordered Employee, SSS Number, SS, EC, Contribution; the scrollbar does not cover its sticky header, total footer, or content. Printing follows the screen's 30/70 gray detail-card layout with inline fields and large bold amounts, scaled to the page above a ruled employee table. Print-only widths are 4% for the row number, 30% for Employee, and 16.5% for SSS Number, SS, EC, and Contribution; header cells stretch across those same grid tracks, while on-screen columns remain equal. Employee Code and Payment Status are omitted. Existing provider report APIs and authorization are reused.

Scrollable data-list cards share `components/ScrollableListTable.tsx`: column headers and summary/footer rows stay outside the vertical row scroll region, while horizontal scrolling and stable gutter-based column alignment are preserved. The same pattern is used for contribution payment history, SSS loan/report lists, Pag-IBIG loan lists, and PhilHealth report entries; report editors, menus, and pickers remain unchanged.
- `/reports/contributions/sss`, `/pagibig`, and `/philhealth` — redirect to the Contribution Page with the matching provider selected.

The Reports sidebar Contributions link opens `/reports/contributions`. The all-reports page loads SSS contribution reports from `/api/reports/sss?kind=CONTRIBUTION`, PagIBIG reports from `/api/reports/pagibig` filtered to `kind=CONTRIBUTION`, and PhilHealth contribution reports from `/api/reports/philhealth/reports`; each is filtered by employer and includes paid and unpaid reports. It displays the selected employer's name, unlabeled provider number, and address; filters reports by payment status and applicable year; and shows provider identifiers as SSS PRN Number, PagIBIG PIN, and PhilHealth SPA Number. View opens a popup with report details for all providers, preserving PhilHealth payment fields and showing saved employee entries for SSS/PagIBIG. On desktop/large screens, its table columns share the available list-card width evenly; the column header remains outside the vertical scrolling region while report rows scroll below it, with matching stable gutters to preserve alignment. Mobile keeps the compact period/amount view. The SSS report popup uses a 30/70 desktop split for Report Details and Payment Details and stacks on mobile. Ordinary labels sit beside their values, while Amount Due and Amount Paid use label-above, large bold values. Payment Details arranges Trans Ref: beside Paid Branch: on the first row and Pay Date: beside Pay Type: on the second, with Amount Paid below. Print is limited to the open report. Its employee table uses equal columns in Employee, SSS Number, SS, EC, Contribution order and keeps the scrollbar clear of the sticky header, footer, and content. The page uses a clickable Contribution breadcrumb for return navigation instead of a Back button. The Contribution Page's provider launcher adds an adjacent disclosure to each provider button; pressing it expands an inline submenu like the Reports sidebar, with disabled New followed by View, which preserves the selected provider and employer when opening all reports. Payment summaries are headed “SSS Payments”, “PagIBIG Payment”, and “PhilHealth Payment”; they use the authorized SSS, PagIBIG, and PhilHealth payment views, each limited to the latest twelve paid contributions. Existing payment API callers retain the default eight-row limit; the landing page explicitly requests twelve. The Reports Dashboard uses the authorized `/api/reports/contributions/analytics` aggregate endpoint to compare paid SSS Contributions from the dedicated SSS Contributions database and paid PagIBIG/PhilHealth reports from the central database. It compares the previous full calendar year against the current year-to-date through the current applicable month, grouped by contribution month, and returns no report entries or employer information. Loans analytics are intentionally omitted for now. Existing provider redirects and separate Loans navigation remain unchanged.

Current SSS Contribution print-preview refinement: use a 40/60 Report Details/Payment Details split; show Amount Paid and Total Employees as aligned side-by-side label/value pairs on screen and in print, with matching large result text; allocate 4% to the sequential number column, 30% to Employee, and 16.5% each to SSS Number, SS, EC, and Contribution. Center the SS and EC column headers while keeping their amounts right-aligned. In print, the Total Amount Due footer spans the row-number column and all columns through EC so its amount sits under Contribution. The popup employer address is shown on two balanced lines with its full text retained. The separate SSS saved-report view also shows Total Employees beside Amount Paid on screen and in print.

## Employer-filtered provider launchers

The Contribution Page's vertical employer/provider launcher has medium-sized SSS, PagIBIG, and PhilHealth buttons that are disabled until an employer is selected. Selecting a different employer updates the latest-payment panel; activating a provider carries both `provider` and `employerId` into the URL. The all-reports page preserves those filters, while the existing provider redirects remain unchanged.

Loans Monitoring (`/loans`) has the same employer-first flow, with medium-sized SSS and Pag-IBIG buttons only because PhilHealth loans are not supported. The buttons open `/loans/sss` and `/loans/hdmf` with the selected `employerId`. Each provider route validates that ID against its employer list and initially filters its loan table, report-generation employer and loan list, and (for SSS) historical reports to the selected employer. Existing employer/year filters can still be changed. The Reports sidebar label remains left-aligned beside its icon; its disclosure chevron stays at the far right.
