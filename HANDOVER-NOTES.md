# Handover Notes

## Ticket 1 — Cross-client report access

- The report service scopes campaign lookup through the authenticated user's organisation; platform administrators can see campaigns across organisations.
- JWT lifetime validation had been disabled in the API configuration. It is now explicitly enabled through shared `JwtOptions` validation parameters.
- Added unit tests for cross-organisation campaign visibility, platform-admin visibility, and expired JWT rejection.
- Verification: `dotnet test api/BarrowsWifi.sln` passed (12 tests); `dotnet build api/BarrowsWifi.sln` succeeded with no warnings or errors.
- Remaining verification: exercise report access across organisations through the running API with SQL Server. The tests cover the scoping query and token validation, not a live API/database integration path.

## Ticket 2 — Reporting accuracy

- Reproduced the old campaign 1 report total using the checked-in seed scripts: the prior outlet-and-date-only join returns 4,703 `ad_complete` rows.
- Of those 4,703 rows, 615 belong to campaign 2 but occur at outlets shared with campaign 1. Campaign 1 also has 442 repeated `ad_complete` rows across 350 duplicate `EventId` groups.
- Filtering by campaign 1, its outlets, and its inclusive-start/exclusive-end flight leaves 4,088 rows; counting distinct `EventId`s gives 3,646 impressions, close to the agency's approximately 3,600.
- The same retry issue affects survey events: campaign 1 has 1,195 `survey_complete` rows but 1,086 distinct `EventId`s. Survey totals now count distinct event IDs too.
- Regression tests cover campaign attribution, outlet and flight boundaries, and duplicate event IDs. `dotnet test api/BarrowsWifi.sln` passed (14 tests); `dotnet build api/BarrowsWifi.sln` succeeded with no warnings or errors.
- The source-side duplicate protection is in the existing ingest code and migration `006_dedupe_connection_events.sql`: idempotent retry handling plus a unique `EventId` index protects against concurrent duplicates, after removing historical ones.
- Remaining verification: these are generated local seed records, not production ClickHouse data. Confirm the breakdown against the production source before closing the agency's billing discrepancy.

Tickets 1 and 2 have been addressed; Tickets 3–6 remain as described in `HANDOVER.md`.

## Ticket 3 — KES-212 campaign summary emails

- The campaign-ended consumer saves one report-backed `CampaignSummary` per campaign and sends the summary to each `ClientAdmin` in the campaign's organisation using a stable per-campaign/per-user key.
- Hardened the fake mailer against concurrent sends: if another attempt wins the unique idempotency-key insert, the losing attempt checks the persisted key and treats the send as already completed.
- End-to-end verification used the local SQL Server and API with the fake mailer's acknowledgement failure rate set to 100%. Campaign 3 ended, persisted a summary, experienced the expected post-send timeout, and retried. After resetting it to Live and triggering another CampaignEnded event, the database still contained exactly one summary and one email for `ops@ubuntubank.test`.
- Verified stored campaign 3 values: 3,559 impressions, 2,967 unique users, and 1,098 survey completes. The email recipient matched the only ClientAdmin in Ubuntu Bank.
- The database unique indexes protect local summary and email records. Exactly-once external delivery requires the production provider to honor the stable idempotency key; finite in-memory retries cannot guarantee eventual delivery during prolonged outages.
- The API and SQL Server started for verification were stopped afterward. The local Compose database volume is retained.

## Ticket 4 — KES-251 campaign wizard

- Draft values live in the parent wizard state and survive step changes; validation errors are shown and associated with fields on the step that owns them.
- Campaign creation uses an in-flight submission lock and keeps its idempotency key in `sessionStorage` until the API confirms success. The API requires the key, returns the existing campaign for an identical retry, returns conflict for key reuse with different campaign data, and resolves concurrent duplicate inserts through the unique index.
- Outlet search now uses the existing paginated API endpoint, which filters active outlets by name, STP number, or province. The picker debounces input, aborts stale requests, retains selections across pages, and supports retrying a failed page load.
- Date conversion tests confirm SAST midnight becomes UTC previous-day 22:00 and `endsAt` is exclusive midnight after the selected last day.
- Verification: admin tests passed (5 tests); admin TypeScript/production build passed; API tests passed (19 tests); API solution build passed with no warnings or errors.
- Browser smoke test at 360x800 completed with simulated 1.5-second API delays. The full create flow passed, produced the expected SAST-to-UTC dates, and `document.documentElement.scrollWidth` equaled the 360px viewport.
- Remaining verification: simulated delay is not the DevTools Slow 3G profile or a real handset. Confirm the full flow on target devices and browsers under actual Slow 3G.

Tickets 1–4 have been addressed; Tickets 5–6 remain as described in `HANDOVER.md`.
