Barrows WiFi Assessment – Handover Notes

1. Project Overview

This repository contains the Barrows WiFi assessment project. It includes:

* A .NET 8 Minimal API backend.
* SQL Server with Entity Framework Core.
* JWT and API key authentication.
* MassTransit messaging.
* A React-based administration portal.
* A captive portal.
* Campaign reporting and data ingestion functionality.

The assessment consists of six development tickets. Changes should be committed regularly, and this document should be updated as work progresses.

2. Ticket Progress

Ticket 1 – Security: Cross-client report access

Status: Implementation and unit-test verification completed; live API/database verification remains outstanding.

Work addressed:

* Added user context to report access.
* Applied organisation and user-level visibility restrictions.
* Enabled JWT lifetime validation and covered expired-token rejection.
* Added tests for client organisation scoping and platform-admin visibility.
* `dotnet test api/BarrowsWifi.sln`: 12 passed.
* `dotnet build api/BarrowsWifi.sln`: succeeded with 0 warnings and 0 errors.

Important files:

* api/src/BarrowsWifi.Api/Endpoints/ReportEndpoints.cs
* api/src/BarrowsWifi.Api/Infrastructure/ReportService.cs
* Related test files.

Ticket 2 – Reporting accuracy

Status: Report logic and seed-data discrepancy verified; production event-store confirmation remains outstanding.

Work addressed:

* Reproduced the old 4,703 ad-complete total from the campaign 1 seed data. It included 615 rows belonging to campaign 2 at shared outlets.
* Found 442 additional repeated campaign 1 ad-complete rows across 350 duplicated EventIds.
* Campaign 1's flight- and outlet-scoped distinct total is 3,646 ad-complete events, near the agency's approximately 3,600.
* Report queries now share tested campaign/outlet/flight filtering and count distinct EventIds for both impressions and survey completes.
* The ingestion path already checks retries and handles concurrent unique-key conflicts; migration `006_dedupe_connection_events.sql` removes historical duplicate EventIds and adds a unique index to prevent recurrence.
* Added regression tests for campaign attribution, outlet and flight boundaries, and duplicate event IDs.

Important consideration:

The numerical reconciliation above uses the checked-in generated SQL seed data, not production ClickHouse. Confirm the same breakdown against the production event store before treating the invoice discrepancy as resolved.

Ticket 3 – KES-212: Reliable campaign summary emails

Status: Implemented and end-to-end verified locally with forced mail acknowledgement failures and duplicate campaign-ended delivery.

Work addressed:

* Updated CampaignEndedConsumer to generate campaign summaries.
* Added recipient handling for client administrators.
* Introduced idempotency keys for email processing.
* Handled concurrent insert collisions against the unique email idempotency key without sending duplicates.
* Updated the fake mailer to simulate an acknowledgement timeout.
* Added database uniqueness protection for campaign summaries and email idempotency keys.
* Verified campaign 3 with local SQL Server: a forced mail acknowledgement timeout and a repeated CampaignEnded delivery produced one CampaignSummaries row and one SentEmails row for `ops@ubuntubank.test`; the saved values were 3,559 impressions, 2,967 unique users and 1,098 survey completes.

Guarantees and limitations:

* The unique campaign-summary and email-idempotency indexes prevent duplicate local records. The fake mailer stores the email before simulating an acknowledgement timeout, so retries with the same key do not create or send another local email.
* A production mail provider must honor the supplied idempotency key across retries to provide the same delivery guarantee. Without provider-side idempotency, a lost acknowledgement after actual delivery can still result in a duplicate email.
* Delivery is attempted for each ClientAdmin; the in-memory MassTransit retry policy is finite, and does not guarantee eventual delivery through a prolonged outage.

Important files:

* api/src/BarrowsWifi.Api/Messaging/CampaignEndedConsumer.cs
* api/src/BarrowsWifi.Api/Infrastructure/ReportMailer.cs
* api/src/BarrowsWifi.Api/Domain/
* api/src/BarrowsWifi.Api/Data/AppDbContext.cs
* Database migration for idempotency.

Important consideration:

The production email provider must also support idempotency keys to prevent duplicate emails when an acknowledgement is lost after successful delivery.

Ticket 4 – KES-251: Campaign wizard improvements

Status: Implemented and verified with frontend/backend tests and a 360px browser smoke test under delayed API responses.

Requirements:

* Retain entered values when navigating between wizard steps.
* Keep field validation errors on their relevant step and announce them accessibly.
* Prevent duplicate submissions with a session-persisted idempotency key, an in-flight lock, and server-side request matching including concurrent insert races.
* Search active outlets by name, STP number, or province through a paginated API query.
* Debounce outlet search and cancel stale requests; verified at 360px with 1.5-second API response delays and no horizontal overflow.
* Convert selected SAST calendar dates to UTC with an inclusive start and exclusive midnight after the selected final day.
* `cd web/admin && npm test`: 5 passed; `cd web/admin && npm run build`: succeeded.
* `dotnet test api/BarrowsWifi.sln`: 19 passed; `dotnet build api/BarrowsWifi.sln`: succeeded with 0 warnings and 0 errors.

Frontend area:

* web/admin/src/features/wizard/

Backend area:

* api/src/BarrowsWifi.Api/Endpoints/

The browser smoke test used simulated 1.5-second API delays rather than the DevTools Slow 3G preset. Confirm the full flow on the target mobile device/browser before release.

Ticket 5 – Captive portal compatibility and performance

Status: Not yet completed.

Requirements:

* Investigate blank captive portal screens on older phones.
* Investigate issues with in-app sign-in browsers.
* Improve slow initial loading.
* Prevent survey questions from appearing repeatedly.

Ticket 6 – Distributor data reconciliation

Status: Not yet completed.

Requirements:

* Investigate distributor data reconciliation.
* Implement the required CSV handling and reconciliation.
* Validate the output against the expected source data.

3. Technical Notes

* The backend uses .NET 8 Minimal APIs.
* Entity Framework Core manages database access.
* MassTransit handles campaign lifecycle messaging.
* Campaign summary generation is triggered through the CampaignEnded event.
* API database migrations are located under api/db/migrations.
* Migrations are configured to run during API startup.

4. Testing and Verification

Testing must be completed before the work is considered fully verified.

Outstanding verification includes:

* Running backend tests.
* Running frontend tests.
* Verifying report access across different client organisations through the running API and SQL Server.
* Confirming the Ticket 2 breakdown against production event-store data.
* Confirming the production mail provider supports the email idempotency contract.
* Confirming the campaign wizard on target mobile devices and browsers under real Slow 3G.
* Testing the captive portal on older devices and slower connections.
* Validating distributor CSV reconciliation.

Do not treat a change as verified until the relevant tests have actually been run.

5. Git and Commit History

Changes should be committed incrementally, using ticket references in commit messages.

Examples:

* KES-212: Implement reliable campaign summary emails
* KES-251: Improve campaign wizard validation and outlet selection

6. Outstanding Handover Actions

1. Verify and run tests for Tickets 1–3.
2. Complete and verify Ticket 4, including the actual campaign creation endpoint.
3. Investigate and implement Ticket 5.
4. Investigate and implement Ticket 6.
5. Update this document with final implementation details, test results and any remaining issues.

⸻

End of handover notes