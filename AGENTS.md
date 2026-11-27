# Repository Guidelines

## Project Structure

This is a small Node.js/Express application. `server.js` wires the app and serves `public/`, which contains the HTML, browser JavaScript, and CSS. API routers live in `routes/`; business logic is split across `lib/` (orders, inventory, pricing, coupons, tax, ledger, reports, invoices, dates, and storage). `config.js` holds shop and application settings. `data/db.json` is the local JSON datastore. `docs/architecture.svg` diagrams the app. There is no test directory or existing automated test suite.

## Development Commands

- `npm start` starts the Express server on port 3000. Always use port 3000 when running the application; do not override it with `PORT`.
- `npm test` currently exits with “no test specified”; it does not run tests.

There is no build or lint script. For local development, make a backup of `data/db.json` before exercising write endpoints: orders, cancellations, and settlements update that file.

## Required Work Lifecycle

For every change, follow this lifecycle: understand the request and current behavior, plan the smallest useful change, set up the needed context or safe test data, build the change, test it, debug failures, review the final diff, and ship the completed work. Report any lifecycle step that cannot be completed and why.

For bug fixes, pin the problem first by writing or identifying a failing test or a reliable reproduction before changing implementation code. Prefer tests first, then make the smallest change that fixes the pinned failure. Do not broaden the change without a clear requirement.

## Coding Style

Follow the existing CommonJS and callback style (`require`, `module.exports`) and match nearby code. JavaScript currently uses `var`, single quotes, semicolons, and two-space indentation. Keep route handlers thin where practical and put reusable business rules in `lib/`. Use descriptive lowercase filenames such as `gst-reconciliation` for route concepts; preserve existing public endpoint names.

## Testing

No framework, test naming convention, or coverage requirement is configured. For behavior changes, add focused tests if introducing a test framework is part of the change, and document the command used. At minimum, manually verify the affected route and its persisted data using a disposable database copy; avoid testing against shared or production data.

## Commits and Pull Requests

Recent commits use short, lowercase, descriptive summaries (for example, `support hsn gst slabs and coupon maxDiscount caps`). Follow that style and keep each commit focused. Pull requests should explain the behavior change, list relevant endpoints or modules, describe verification performed, and include screenshots for visible UI changes. Link an issue when one exists; no PR template or formal commit convention is present in this repository.

## Configuration and Data Safety

Shop details, tax slabs, coupons, and an admin export key are defined in `config.js`; review configuration changes carefully and do not add real credentials. `data/db.json` contains mutable business records and is rewritten as a whole by `lib/store.js`. Keep private or production records out of commits and preserve the JSON structure when editing sample data.
