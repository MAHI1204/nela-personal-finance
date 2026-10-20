# Nela — offline personal finance

Nela is an installable web app for iPhone and desktop. All personal records and receipt photos are stored in IndexedDB on the device. It does not use ChatGPT hosting, sign-in, a cloud database, remote fonts, analytics, bank APIs or AI APIs at runtime.

## What is included

- EUR and INR bank, cash, savings and credit-card accounts.
- Expense/income entry and actual-amount cross-currency transfers.
- Credit-card purchases and repayments handled separately: repayment is a transfer, not another expense.
- CSV statement import with column mapping, date/decimal format selection, preview, invalid-row reporting and duplicate detection.
- Reviewed receipt-photo attachments (JPG, PNG or WebP, under 5 MB each). Amounts are entered manually; OCR is not included.
- Weekly, monthly and yearly recurring income, bills and transfers, posted only when confirmed.
- Category budgets, salary-cycle settings, savings goals and emergency-fund reservations.
- Cash forecast until payday, category spending breakdowns and six-month spending chart.
- Loan scenario comparison with a fixed nominal annual rate, one extra principal payment and an optional percentage prepayment fee.
- Separate shared-expense groups with exact equal splits, balances and settlement suggestions.
- Complete personal JSON backups including linked photos, plus CSV export.
- Separate group-file exports/imports that exclude personal financial records.
- A Home Screen icon, a relative-path manifest and a cached app shell for offline operation.
- Legacy imports of older Nela personal JSON backups. Cloud photo references are explicitly removed after confirmation because those backups do not contain image bytes.

## First run and iPhone installation

1. Deploy the app to HTTPS, for example GitHub Pages, and open the resulting address in Safari.
2. Wait for **Ready for offline use on this device**. This means the service worker has installed its app cache.
3. Choose **Share → Add to Home Screen**, keep **Open as Web App** enabled if shown, and choose Add.
4. Open Nela from its icon while online and confirm it is ready for offline use there too. Safari and the installed app may use different storage contexts; do your financial work consistently in the installed app.
5. Add an account, record a small test entry, then enable Airplane Mode. Close and reopen Nela from its icon, add another entry, reopen again and verify that both entries remain. Export a backup and check it before entering substantial data.

The service worker caches application files only. Financial records and photos are kept in IndexedDB, separately from the cached files. Offline operation requires a successful first installation and retained browser storage. Clearing website data, removing the app, storage eviction, a new origin/address or device loss may make local data unavailable. Browser persistence is requested only through the button in Data & settings and is not guaranteed. Backups remain necessary. This version is a PWA, not an App Store binary; native widgets, Siri and Face ID protection are not implemented.

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

Forecast = today's recorded bank/cash/savings balances + future/scheduled cash flow before payday − explicit savings reservations. It excludes unscheduled spending and card debt itself. Use a scheduled bank-to-card transfer for an expected card repayment. Overdue unconfirmed occurrences are warned about and excluded. Savings goals reserve existing cash; they are not additional assets. Budget cycle start days are limited to 1–28; payday uses the month's last day when needed.

Loan scenarios use entered nominal annual interest divided by 12, month-end payments and monthly cent rounding. A single optional extra payment and its percentage fee are modeled. Daily accrual, variable rates, lender-specific charges and tax are excluded. These are calculations from your inputs, not lender quotes or financial recommendations.

CSV duplicate detection uses account, date, amount and description. Identical legitimate purchases may be skipped and need manual entry. Review transfers and repayments explicitly, because CSV statements cannot reliably distinguish them from ordinary income/expenses.

## Testing and limitations

Automated tests cover financial arithmetic, calendar boundaries, CSV parsing, snapshot export isolation, actual IndexedDB-style transaction flows through fake-indexeddb, stale-revision rejection, receipt backup/restoration and static offline configuration. TypeScript checking and the standalone production build are included.

Physical iPhone/Safari testing and real browser service-worker offline testing have not been performed in this execution environment. Follow the Airplane Mode checklist above. Local backups are unencrypted. There is no PIN/biometric app lock, cloud sync, automatic bank integration, receipt OCR, push notifications, unequal split editor or concurrent group merge. The working name Nela has not been checked for trademark/domain/App Store availability.

Third-party dependency licenses are collected in `THIRD_PARTY_LICENSES.txt`. A license for the project's own source has not yet been selected; public source visibility alone does not grant an open-source license.
