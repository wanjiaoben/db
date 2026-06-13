# Nice Analytics Worker

This worker receives lightweight analytics events from `translation.nice.okinawa`,
stores them in Cloudflare D1, and serves dashboard summaries to `db.nice.okinawa`.

## Cloudflare Setup

1. Create a D1 database named `nice_analytics`.
2. Run `schema.sql` in the D1 console.
3. Deploy this worker as `nice-analytics`.
4. Bind the D1 database to the worker with binding name `DB`.
5. Add a worker secret named `DASHBOARD_KEY`.
6. Add a custom domain or route:
   `analytics.nice.okinawa/*`

## Required Endpoints

- `POST https://analytics.nice.okinawa/collect`
- `GET https://analytics.nice.okinawa/summary?days=7`
- `POST https://analytics.nice.okinawa/search-console/sync?days=7`
- `GET https://analytics.nice.okinawa/health`

## Dashboard

Open `https://db.nice.okinawa/`, enter the same `DASHBOARD_KEY`, and save it.
The key is stored only in the browser localStorage.

## Google Search Console

The dashboard can show Google search queries, clicks, impressions, CTR, and
average position after a Google service account is connected.

1. In Google Cloud, create a service account and download a JSON key.
2. In Google Search Console, add the service account email as a user for each
   property listed in `GSC_SITE_URLS`.
3. Set these Worker secrets:
   - `GSC_CLIENT_EMAIL`
   - `GSC_PRIVATE_KEY`
4. Run `schema.sql` on the D1 database again to create `search_console_daily`.
5. Deploy the Worker. The cron sync runs daily, and the dashboard button can
   manually sync the latest 7 days.

## Events

The current tracking script records:

- `page_view`
- `page_leave`
- `section_view`
- `section_time`
- `click`

It does not store full IP addresses or personal form contents.
