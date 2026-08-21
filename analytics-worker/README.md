# Nice Analytics Worker

This worker receives lightweight analytics events from `translation.nice.okinawa`,
stores them in Cloudflare D1, and serves dashboard summaries to `db.nice.okinawa`.

## Cloudflare Setup

1. Create a D1 database named `nice_analytics`.
2. Run `schema.sql` in the D1 console.
3. Deploy this worker as `nice-analytics`.
4. Bind the D1 database to the worker with binding name `DB`.
5. Add worker secrets named `DASHBOARD_KEY` and `RESEND_API_KEY`.
6. Add a custom domain or route:
   `analytics.nice.okinawa/*`

## Required Endpoints

- `POST https://analytics.nice.okinawa/events`
- `GET https://analytics.nice.okinawa/beacon.js`
- `POST https://analytics.nice.okinawa/collect`
- `GET https://analytics.nice.okinawa/summary?days=7`
- `GET https://analytics.nice.okinawa/visitors?days=7`
- `POST https://analytics.nice.okinawa/search-console/sync?days=7`
- `GET https://analytics.nice.okinawa/health`
- `POST https://analytics.nice.okinawa/alerts/test`
- `POST https://analytics.nice.okinawa/alerts/self-check`

## Alert Channel Self-Check

The Worker sends a monthly alert-channel self-check email via Resend on the
first day of each month at 09:00 JST (`0 0 1 * *` UTC). The email is sent to
`ALERT_CHANNEL_SELF_CHECK_EMAIL`, currently `aboutokinawa@gmail.com`, with a
`[Nice Dashboard] 通道自检 YYYY-MM` subject. If the message is missing on the
first day of a month, investigate the alerting system itself.

Admins can force a channel self-check with `POST /alerts/self-check?force=1`.

## Backup Freshness and Alert Ownership

Nice Dashboard treats the latest BJT manifest as fresh for 51 hours because the
BJT KV backup cron runs every other day. Daily D1 backups stay on the 27-hour
freshness window. Freshness is a rolling duration and does not reset at midnight
JST. A date change by itself must not turn a backup red or send a recovery email
later that morning.

The two alert layers have separate responsibilities:

- The Progress Worker owns environment-specific execution details. It sends an
  immediate `Progress Monitor` alert only when a production or preview backup
  run itself fails.
- Nice Dashboard owns the summary view. It reads the BJT manifest and the
  Progress production/preview restore pointers, validates their age and the
  Progress environment/database/object prefix, then sends one dashboard email
  only when the overall red/green state changes.

An immediate Progress execution failure and a later Dashboard stale state are
different stages, not duplicate notifications for the same check. Persistent
failure does not cause repeated Dashboard mail. When investigating a Progress
backup, use the environment-specific details introduced by db PR #3 as the
source of truth; use Nice Dashboard for the cross-system summary.

After a freshness-rule release, observe two complete JST midnight crossings
(48 hours). Expected behavior: no red or recovery email caused only by the date
change. Mail is expected only when a manifest is actually older than its
configured freshness window, has an invalid/future timestamp, crosses a
Progress environment boundary, or another monitored deployment/probe is red.

## Dashboard

Open `https://db.nice.okinawa/`, enter the same `DASHBOARD_KEY`, and save it.
The key is stored only in the browser localStorage.

`GET /visitors?days=7` serves the dashboard visitor card from production D1
`visitor_events`. It is an admin-only endpoint, keeps its legacy default when no
valid `days` is supplied, and accepts `days=1`, `days=7`, `days=30`, or
`days=180` for the dashboard range switcher. It returns all per-site aggregates
and visitor rows in one response. Sites with fewer than 20 events in the
selected window return raw records instead of charts or ratios.

Set the same `DASHBOARD_KEY` secret on both Workers:

```sh
openssl rand -base64 32
```

Then Wan sets the generated value with `wrangler secret put DASHBOARD_KEY` in
`analytics-worker` and `private-worker`, and stores it in the GitHub Actions
`production-worker` environment if future release preflight requires it.

## Google Search Console

The dashboard can show Google search queries, clicks, impressions, CTR, and
average position after a Google service account is connected. It syncs the
latest 28 days daily at 09:00 JST and sends a Monday 09:00 JST summary to
`info@nice.okinawa`.

1. In Google Cloud, create a service account and download a JSON key.
2. In Google Search Console, add the service account email as a user for each
   property listed in `GSC_SITE_URLS`.
3. Set this Worker secret:
   - `GSC_SERVICE_ACCOUNT_JSON`
4. Keep `GSC_WEEKLY_REPORT_EMAIL` and `ALERT_EMAIL_ALLOWLIST` aligned if the
   recipient changes.
5. Run `schema.sql` on the D1 database again to create `search_console_daily`.
6. Deploy the Worker. The cron sync runs daily, and the dashboard button can
   manually sync the latest 28 days.

`GSC_CLIENT_EMAIL` and `GSC_PRIVATE_KEY` are still accepted as a fallback for
older preview environments, but production should use the JSON secret above.

## GitHub Deployment Status

The dashboard reads GitHub Actions through `GITHUB_TOKEN` when present. Set a
read-only repo-status token as a Worker secret named `GITHUB_TOKEN`. When it is
absent, the four deployment status cells show `未配 token` and do not call the
GitHub API.

## Events

`POST /events` is the B-0154 visitor beacon endpoint. It accepts only four
event types: `pageview`, `dwell`, `contact_click`, and `section_view`.

`GET /beacon.js` serves the central B-0155 beacon script with a short
`Cache-Control: public, max-age=3600` cache. Site installation stays one line:

```html
<script src="https://analytics.nice.okinawa/beacon.js" data-site="snorkel" defer></script>
```

The script always reads `site_id` from `data-site` and does not infer it from
`location.hostname`. UI language is read in this order:
`window.NICE_UI_LANG`, `window.SITE_UI_LANG`, then `<html lang>`.

The endpoint stores events in `visitor_events`, accepts only the production
Nice Okinawa host allowlist, silently discards `*.pages.dev` traffic with
`204`, rate-limits by `site_id + visitor_id`, and stores Cloudflare geo fields
from `request.cf` without storing IP addresses.

UTM persistence is deliberately narrow: only `utm_source`, `utm_medium`, and
`utm_campaign` are extracted from the landing URL query string. `landing_path`
stores only the path portion and never stores query strings.

Cross-site jumps such as `nice.okinawa` → `snorkel.nice.okinawa` are identified
only through `referrer_host`. Sessions are not merged across hostnames because
the visitor ID is stored in `localStorage`, which is origin-scoped.

The current tracking script records:

- `page_view`
- `page_leave`
- `section_view`
- `section_time`
- `click`

It does not store full IP addresses or personal form contents.
