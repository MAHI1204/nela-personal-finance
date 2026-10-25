# Nela — offline personal finance

Nela is an installable web app for iPhone and desktop. All personal records and receipt photos are stored in IndexedDB on the device. It does not use ChatGPT hosting, sign-in, a cloud database, remote fonts, analytics, bank APIs or AI APIs at runtime.

## Add Nela to your phone

Open your **deployed HTTPS app URL** on your phone (not the GitHub source page).

- **iPhone:** in Safari, tap **Share → Add to Home Screen**, enable **Open as Web App** if shown, then tap **Add**.
- **Android:** in Chrome, tap **⋮ → Install and create shortcut → Install** (older versions may show **Add to home screen**).
- Open Nela from its new icon while online and wait for **Ready for offline use on this device**. Then test reopening it in Airplane Mode.

Use the installed app consistently: each device/browser has its own ledger, with no automatic sync. Export a JSON backup regularly. See [the full installation checklist](#first-run-and-iphone-installation) below.

Official instructions: [Apple](https://support.apple.com/guide/iphone/iphea86e5236/ios) · [Google Chrome](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=en).

## Version 1.3 — credit cards and Owe & Owed

Before updating, export a personal JSON backup and close other Nela tabs. Reopen online and choose **Update app** when offered. Existing format-2, format-3 and format-4 ledgers migrate to format 5, preserving existing records and supplying empty lending/statement collections. The next save uses format 5; previous app versions reject that format. Keep your existing app URL and browser context.

### Credit Cards

Open **Credit Cards** in navigation. Add or edit a card account, record purchases, record a bank-to-card transfer, add issuer statements, inspect activity, or open reconciliation with that card selected. Card purchases count as expenses; repayments are transfers, never another expense. Negative opening balances represent existing card debt. Available credit is displayed separately from cash you own.

Copy the closing date, due date, statement amount and minimum from your issuer's statement. Statements are checkpoints, not transactions; saving one does not change a balance. For the latest statement on or before the displayed date, tracked remaining is its amount minus credits recorded strictly after closing. Unbilled charges are recorded debits after closing, before credits. Closing-date entries count as billed. Verify issuer payment/refund allocation and minimum-payment rules yourself. Nela does not calculate card interest. Enter actual interest and fees as expenses. Do not import a card payment again when its transfer is already recorded.

### Owe & Owed

Keep **I owe** and **Owed to me** separate, including for the same person. Use **I borrowed**, **I lent**, **Paid for someone**, or **Add existing balance**. Choose an existing record to **I repaid** or **I received repayment**; partial repayments are supported. Each record has a person, original amount, currency, date, optional due date and note. A person's view shows both directions, record history and repayments. EUR and INR are never silently combined.

Borrowing/lending cash and repayments use a bank, cash or savings account in the debt's currency. They change cash and the outstanding principal, but never salary income or spending. Existing balances create no account movement. Do not add an existing balance for borrowing/lending already recorded through a new cash movement.

For **Paid for someone**, enter **their share** and **your own share**, not the full bill twice. Nela posts their share as money owed to you and your share as a category expense. Together they equal the account outflow. A credit card is also allowed for this action. Receiving their repayment settles principal without adding income or reversing your own expense.

Debt account movements are linked and saved atomically with their records. Selecting one in Transactions opens Owe & Owed so it cannot be accidentally changed into ordinary income. Use **Record interest separately** for an ordinary interest expense or receipt without reducing principal. Use **Gift / forgive balance** only when forgiveness is agreed: it records a noncash principal reduction separately from repayments, changes no account/spending/salary total and makes no tax classification. New cash gifts belong in ordinary expense/income entries.

Edit or delete a repayment to correct it; editing/deleting the original record rebuilds its account movements. Deleting a record also deletes its repayments, noncash adjustments and linked movements after confirmation. Remove any separately linked refunds or trackers first if they prevent deletion. Repayments cannot predate the debt, cross currencies or exceed the original amount cumulatively. Due dates do not automatically mark debts as paid.

### Dashboard and monthly reports

Click **Spent this month** to open the full monthly report for the selected calendar month. Click **Credit card debt**, **I owe**, **Owed to me**, or **Settled this month** to open its relevant report view. All four debt summary cards preserve the selected month and currency. The report includes **Overview**, **Spending**, **Cash movements**, **Credit cards** and **Friends**. Report-month changes update the page month selector. Choose calendar months or salary cycles inside Analysis.

Spending and repayments are activity during the selected period. Debt/card/account balances are snapshots as of the period's last recorded actual date, capped to today; future months never project unposted balances. Settled-this-month is actual repayments in both directions, not the number of agreements closed. Card debt and friend lending are independent: lending funded through a card does not erase your debt to the issuer.

CSV and PDF / Print monthly exports include card balances and activity, friend balances and repayments, and cash-account movements. The monthly plan lists outstanding card/personal repayment dates within its selected cycle, using today's remaining amounts. These expectations do not automatically change forecasts or post payments. Use a scheduled bank-to-card transfer to include an expected card payment in the forecast. Expected repayments from friends remain excluded until recorded.

Full personal JSON backup/restore includes lending records, repayments, noncash adjustments, card statements and their linked account movements. Group exports remain separate. This release continues to store everything on this device; cross-device cloud sync is not implemented.

## Version 1.2 — reports, savings and trips

Before updating, export a full personal JSON backup and close other Nela tabs. Reopen the app online and use **Update app** when offered. This release originally read format-2 and format-3 ledgers and supplies new defaults without deleting records. That release saved format 4; the current release saves format 5 as described above. Keep the same app URL and browser context.

### Monthly reports

Open **Analysis**. Reports default to calendar months, with a switch to salary cycles based on your configured cycle start day. Choose any report month and any comparison month, including another year. Show a side-by-side comparison, the previous 1–6 months, or both, with a 3- or 6-month historical average.

- **Equal elapsed days** compares the first available matching number of days. The pairwise comparison caps to the shorter of its two windows. Trend and baseline windows all cap to their shortest available window. Exact end-exclusive dates are shown.
- **Complete windows** uses the full recorded actuals available in each period; an ongoing month remains incomplete. Future-dated entries and unconfirmed schedules are excluded in both modes.
- Category reports show actual, budget, remaining allocation, spending share, comparison amounts, change and history average. Expand a category for transactions and optional subcategories.
- Essential/optional and recurring/one-time sections use your purchase classifications; linked returns inherit the purchase classifications. Unclassified entries remain visible. Existing schedule-linked purchases default to recurring in reports.
- Merchant changes explain differences between the two comparison windows using net spending, including linked returns.
- Set category amount limits and historical percentage thresholds in **Spending alert rules**. Historical flags need at least three previous windows with recorded activity and a positive category average; the default threshold is 25% above that average. Missing windows are excluded from averages, never inferred to be zero. Recorded activity does not certify completeness.
- Calendar budget comparisons use the latest monthly base terms effective before the period end, without salary-cycle carryover. Salary-cycle budget comparisons include rollover. These are allocations, not account balances.

Use **Export CSV** or **PDF / Print**. The latter opens a printable report and your browser's print dialog: choose Save as PDF or the PDF/share option available on your phone. Pop-ups must be allowed. Exports are generated on the device and contain private records; they are not full backups.

### Purchase details and discount tracking

In a purchase entry, expand **Optional: subcategory, discounts and trip splits**. Subcategories are optional free text. Set essential/optional and recurring/one-time labels if useful.

The main amount is always the actual amount paid. Enter either a discount amount, a reference price, or both. When both are supplied, reference price minus actual paid must equal the discount. Choose coupon, sale, loyalty or other. Reference prices are user records, not verified market prices.

Open **Savings & renewals** for monthly and yearly recorded purchase discounts, breakdowns by type/category/merchant, cashback, annual-bill plans and subscriptions. Product refunds reverse discounts proportionally when received, with cumulative minor-unit rounding; reimbursements do not reverse a purchase discount. A historical period can therefore show a negative discount adjustment. Discounts do not increase account balances. Unused budget and reserved money are not added to discount totals.

Track cashback as an expected amount, optionally linked to a purchase. Pending cashback is excluded from balances. **Record receipt** creates an actual income transaction and allows partial receipts. If it already exists in a statement import, edit that income entry and link it to the cashback tracker instead of entering it again. Tracker outstanding amounts are as of today; monthly/yearly received totals use receipt dates.

### Trip budgets and reports

Open **Trips & reports** and create a trip, such as an India visit. Enter inclusive travel dates, EUR/INR budgets, and optional category budgets. Trip tags, rather than transaction dates, define membership, so pre-departure flights, later refunds and trips crossing months/years remain in one report.

Allocate purchases through their optional details. Split one purchase across trips and ordinary spending; allocations must fit within the actual purchase amount. Each allocation has an optional own share, defaulting to its full amount. Own shares cannot exceed the amount paid. Each transaction remains a single ledger entry and still appears in its normal monthly report.

Reports show paid-by-you amounts, entered own shares before refunds, received refunds/reimbursements, net paid, budget remaining, tracked expected returns, discounts, categories, daily entries and before/during/after-travel phases. They cover your allocated ledger records, not all participants' expenses; there is no automatic group-ledger integration or settlement. Budget remaining uses net paid. Linked returns are allocated proportionally across original splits and ordinary spending using cumulative rounding.

EUR and INR stay separate. Optionally enter **INR for 1 EUR** to show a combined EUR summary. INR totals are divided by that entered rate and rounded once to cents. This reporting assumption is displayed; it is not a live market rate and does not convert account entries. Trips can be archived while retaining their history. Use CSV or PDF / Print for a separate trip report.

### Annual bills and subscription history

Annual-bill plans track a due date, target and amount already reserved. The monthly contribution calculation divides the remaining amount across this month through the due month, rounding up to minor units. Overdue plans show the amount remaining due now. Update the reservation as you set money aside. It labels existing cash and creates no account transfer. Reservations selected for deduction reduce available cash in the forecast alongside reserved goals; do not reserve the same cash twice. Record the actual bill separately, then update the plan's amount/date. A funding plan does not automatically create a recurring schedule.

Subscriptions use recurring expense schedules. Editing their amount/frequency records the old and new terms dated today and changes unconfirmed occurrences; historical transactions are unchanged. Annual equivalents use 12 months or 52 weeks. Record an optional cancellation deadline. Confirming cancellation stops the schedule in Nela, but does not contact or cancel with a provider. Schedule currency cannot be changed; create a separate schedule for a different currency.

### Reminders when Nela is closed

In **Savings & renewals → Reminders while Nela is closed**, export an `.ics` calendar file containing the next 12 months of active expense-schedule occurrences, cancellation deadlines and annual-bill dates. Select advance notice of 0, 1, 3, 7, 14 or 30 days. Events are at 09:00 in the calendar's local time, with a due-date alarm and an advance alarm when selected.

Import the file into a calendar that supports event/alert import and allow its notifications. If the phone only previews the file, use that calendar's desktop import workflow and sync it to the phone. Verify the time and alerts on an imported event and test one reminder before relying on it; calendar clients may alter or discard imported alarms.

This is a snapshot, not a live calendar feed. Use a dedicated Nela calendar and replace old imported events after changing schedules; repeated imports may create duplicates. The file contains event names/dates, not balances or payment amounts. Your calendar may sync those details to its provider.

**Direct Nela web push is not implemented.** The static GitHub Pages app has no push server. Closed-app alerts here are supplied by your calendar after import, subject to its settings and support; no closed-browser JavaScript timer is claimed to run. Standards reference: [iCalendar / VALARM, RFC 5545](https://www.rfc-editor.org/rfc/rfc5545.html). Web-push architecture: [Apple developer documentation](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers).

## What is included

- EUR and INR bank, cash, savings and credit-card accounts.
- Expense/income entry and actual-amount cross-currency transfers.
- Credit-card purchases and repayments handled separately: repayment is a transfer, not another expense.
- CSV statement import with column mapping, date/decimal format selection, preview, invalid-row reporting and duplicate detection.
- Reviewed receipt-photo attachments (JPG, PNG or WebP, under 5 MB each). Amounts are entered manually; OCR is not included.
- Weekly, monthly and yearly recurring income, bills and transfers, posted only when confirmed.
- Category budgets, salary-cycle settings, savings goals and emergency-fund reservations.
- Cash forecast until payday, category spending reports and configurable 1–6-month trends.
- Loan scenario comparison with a fixed nominal annual rate, one extra principal payment and an optional percentage prepayment fee.
- Separate shared-expense groups with exact equal splits, balances and settlement suggestions.
- Complete personal JSON backups including linked photos, plus CSV export.
- Separate group-file exports/imports that exclude personal financial records.
- A Home Screen icon, a relative-path manifest and a cached app shell for offline operation.
- Legacy imports of older Nela personal JSON backups. Cloud photo references are explicitly removed after confirmation because those backups do not contain image bytes.

## Version 1.1 — monthly planning and quick capture

Before updating, export a full personal backup and close other Nela tabs. Reopen the app online and use the **Update app** banner when it appears. Version 1.1 originally introduced data format 3. Version 1.2 upgraded earlier ledgers to format 4; the current release upgrades to format 5 as described above. Older application versions reject that newer format rather than saving a truncated ledger. Keep the same URL and browser context to retain the local database.

### Quick entry

The amount keypad is available in the entry dialog. You can save an expense or income draft as a favourite; favourite buttons reopen it for review rather than silently posting another transaction. Enter a merchant name to recall its most recent matching account and category in the same currency. Amounts are never converted by merchant matching.

### Monthly plan

- Set each category to fixed or flexible and choose reset, positive carryover, or positive-and-negative carryover.
- New budget terms begin at the selected budget cycle; previous saved terms are retained for subsequent rollover calculations. Deleting a budget removes its terms/history.
- The daily allowance uses remaining flexible allocations minus positive spending in unbudgeted categories, divided by remaining days including today. It is a planning figure, not proof of bank affordability.
- Compare full budget cycles and inspect the transactions behind a category. An active cycle may be incomplete, so the comparison explicitly warns about that.
- The calendar shows actual/expected entries and schedules. Low-balance warnings are in-app projections based on recorded starting balances, future entries and unconfirmed schedules. Set each non-credit account’s warning threshold in Accounts. No push notifications are sent.
- Subscriptions and annual bills show a monthly equivalent using 12 months or 52 weeks. This is informational; it does not automatically reserve funds.
- Purchase/savings/loan what-if inputs change displayed scenario results only. They do not create transactions or initiate payments.

### Returns and reconciliation

Track one expected-return total against an expense, choosing refund or reimbursement. Only matching received return types reduce that tracker. Expected money is excluded from balances and the cash forecast. Received returns must use the original expense’s currency and category, cannot predate it, and cannot exceed its gross amount in total. They reduce net spending when received and are not salary income. Cross-currency returns are not converted automatically.

Statement reconciliation saves the statement and calculated balance at an end-of-day date, plus their difference. It does not edit account balances. If older entries change afterward, that checkpoint is marked as changed. Review pending transactions, missing entries and duplicates yourself; Nela cannot infer an unknown bank transaction from a balance difference.

### Companion iPhone Shortcut

Open **Data & settings → Siri & Back Tap capture** for the complete setup guide and paste-review form. The recommended Shortcut asks for a number and copies text such as `NELA amount=12.50&currency=EUR`. Open the installed Nela app, paste that text, review and save. This requires one-time manual setup in Apple Shortcuts; no signed Shortcut or native integration is installed automatically.

An optional `#capture?amount=12.50&currency=EUR` URL handoff is also supported. The fragment is processed locally and cleared, and never saves a transaction automatically. iOS may open Safari rather than the installed PWA, which can use a different local ledger. Use the clipboard method to avoid that ambiguity. Voice recognition and Siri availability depend on the device; they are not supplied by Nela’s offline code.

## First run and iPhone installation

1. Deploy the app to HTTPS, for example GitHub Pages, and open the resulting address in Safari.
2. Wait for **Ready for offline use on this device**. This means the service worker has installed its app cache.
3. Choose **Share → Add to Home Screen**, keep **Open as Web App** enabled if shown, and choose Add.
4. Open Nela from its icon while online and confirm it is ready for offline use there too. Safari and the installed app may use different storage contexts; do your financial work consistently in the installed app.
5. Add an account, record a small test entry, then enable Airplane Mode. Close and reopen Nela from its icon, add another entry, reopen again and verify that both entries remain. Export a backup and check it before entering substantial data.

The service worker caches application files only. Financial records and photos are kept in IndexedDB, separately from the cached files. Offline operation requires a successful first installation and retained browser storage. Clearing website data, removing the app, storage eviction, a new origin/address or device loss may make local data unavailable. Browser persistence is requested only through the button in Data & settings and is not guaranteed. Backups remain necessary. This version is a PWA, not an App Store binary; native widgets and Face ID protection are not implemented. Siri and Back Tap use the separately configured companion Shortcut described above.

## GitHub project and deployment

Source repository: https://github.com/MAHI1204/nela-personal-finance

1. In this repository, open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
2. Push changes to `main`, or run the **Deploy Nela to GitHub Pages** workflow from the Actions tab.
3. The workflow installs locked dependencies, runs tests and TypeScript checks, builds the application and deploys its static files.
4. Use the URL shown by the successful deployment. The expected project URL is `https://mahi1204.github.io/nela-personal-finance/`; it is not live until Pages is enabled and deployment succeeds.

Never commit personal backups, bank statements, receipt photos, node_modules or runtime databases. Public source code does not upload your locally entered records. GitHub Pages is not a permanent availability guarantee: keep the source and independent financial backups. You can move the static app files to another HTTPS host without adding a backend.

### Prebuilt version

`site/` in the release ZIP contains the ready-to-host static files. It needs no package installation to serve. Do not double-click index.html and expect installation/offline caching: service workers require HTTPS or localhost. Keep `.nojekyll` when deploying files to GitHub Pages through a branch.

## Local development on Linux, Windows or macOS

Install Node.js 22.13 or newer. Extract the source and run:

```sh
npm ci
npm test
npm run typecheck
npm run dev
```

Open `http://localhost:5173`. The local server serves the production build; rebuild and reload after editing. `npm run build` writes `dist/`. `npm run preview` serves an existing build. No Mac or Apple Developer membership is required for this web version.

## Your data and backups

Each browser/device has an independent ledger. There is **no automatic synchronization**.

- In **Data & settings → Backup JSON**, export a full personal backup. Linked receipt photos are embedded in that file.
- A personal backup is not encrypted and contains private financial information. Store it securely; do not send it to group participants.
- On another device, use **Restore a personal backup**. Review the replacement confirmation. It replaces personal records/photos in one database transaction; groups are unaffected.
- For shared groups, use the separate export/import workflow below.
- An export download being prepared does not prove that you saved it successfully. Verify your backup file exists and keep more than one recent copy.
- Transaction CSV export is useful for spreadsheets but is not a full backup of accounts, schedules, goals or photos.

## Sharing a group without a server

1. Create a group and list its participants. Names and optional email labels do not create online accounts or access controls.
2. Add shared expenses and completed settlements.
3. Export that group as a group JSON file and send it yourself to intended participants using your chosen file-sharing method.
4. The recipient imports it through **Shared groups → Import group**.
5. A participant can edit their local copy and export the next snapshot.

Use one current editor at a time. Importing an existing group **replaces** its local snapshot after showing counts and asking for confirmation. It does not merge concurrent edits, and another person's old file can undo newer changes if you approve replacement. Export your current copy first. Group files are not encrypted; anyone receiving one can read the complete group. They contain no personal accounts, private transactions, receipts, goals or loans. Shared entries do not automatically change a personal account.

## Calculation assumptions

Amounts use integer cents/paise. Supported account currencies are EUR and INR, never silently combined. Transfers use the actual amounts entered on both sides. Record transfer fees as separate expenses. A negative credit-card balance means debt. Do not re-enter activity already included in an account's starting balance.

Forecast = today's recorded bank/cash/savings balances + future/scheduled cash flow before payday − explicit goal and annual-bill reservations. It excludes unscheduled spending and card debt itself. Use a scheduled bank-to-card transfer for an expected card repayment. Overdue unconfirmed occurrences are warned about and excluded. Savings goals and annual-bill plans reserve existing cash; they are not additional assets. Budget cycle start days are limited to 1–28; payday uses the month's last day when needed.

Loan scenarios use entered nominal annual interest divided by 12, month-end payments and monthly cent rounding. A single optional extra payment and its percentage fee are modeled. Daily accrual, variable rates, lender-specific charges and tax are excluded. These are calculations from your inputs, not lender quotes or financial recommendations.

CSV duplicate detection uses account, date, amount and description. Identical legitimate purchases may be skipped and need manual entry. Review transfers and repayments explicitly, because CSV statements cannot reliably distinguish them from ordinary income/expenses.

## Testing and limitations

Automated tests cover financial arithmetic, calendar boundaries, CSV parsing, snapshot export isolation, actual IndexedDB-style transaction flows through fake-indexeddb, stale-revision rejection, receipt backup/restoration, format-4 migration, arbitrary report comparisons, classification, trip/discount return rounding, cashback, bill reservations, CSV/print escaping, calendar folding and static offline configuration. TypeScript checking and the standalone production build are included.

Physical iPhone/Safari testing, real browser service-worker offline testing, PDF print-dialog testing and calendar-client alarm delivery have not been performed in this execution environment. Automated component rendering is not a substitute for those device checks. Follow the Airplane Mode checklist above. Local backups are unencrypted. There is no PIN/biometric app lock, cloud sync, automatic bank integration, receipt OCR, push notifications, unequal split editor or concurrent group merge. Statement differences are identified, not automatically repaired. The working name Nela has not been checked for trademark/domain/App Store availability.

Third-party dependency licenses are collected in `THIRD_PARTY_LICENSES.txt`. A license for the project's own source has not yet been selected; public source visibility alone does not grant an open-source license.
