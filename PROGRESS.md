# db.nice.okinawa Progress

UX-0823-03 fixes the orders dashboard counts and recent list to use paid, deduped, non-test order rows only while keeping attribution blank until upstream first-touch fields arrive.

BACKUP-0823-01 keeps fresh R2 latest manifests from being overridden by missing same-day daily history, preserving BJT/progress green status while leaving true nice_analytics token 9109 backup failures visible.

ALERT-0822-02 adds a dashboard "发测试告警" button wired to `/alerts/test`, makes GET `/alerts/test` return a friendly Dashboard-key hint, and forces manual test alert subjects to include `[TEST]`.

ALERT-0822-01 centralizes all system notification recipients into `ALERT_RECIPIENTS=aboutokinawa@gmail.com`, removes the old info@ recipient paths, and updates CLAUDE.md to WAN Constitution v1.17.

DB-0822-01 adds the draft Search Console dashboard integration: 28-day daily sync via service-account JSON, site/query/page D1 aggregation, Top20/CTR-opportunity/4-15 ranking views, Monday weekly summary email plumbing, and documents missing production secrets blocking live GSC/email validation.

M0731-34 aligns the db-private `/orders` dashboard auth path with proxied dashboard APIs so Basic-authenticated dashboard users can load monthly order exports without a browser-stored dashboard key.

M0731-28 ships the monthly order CSV export to production and adjusts the default month so month-start tax handoff opens the previous month while month-end verification stays on the current JST month.

UX-0823-02 reorders the db dashboard around mobile-first orders: sticky status strip, today/7/30 order counts, recent 10 orders, mobile-collapsed secondary panels, and additive `/orders` range/recent fields.

M0731-14 adds a draft natural-month order export flow for the order source dashboard: previous-month default, captured-only tax totals, excluded pending rows, and BOM CSV evidence exports.

M0731-05 adds a draft BJT Pro order source dashboard page backed by read-only `paypal_order_meta:*` KV rows through the db-private `/orders` endpoint.

M0729-11 adds the draft customer path checker for analytics Worker preview: path_check_* D1 tables, 15-minute scheduled checks with status + content/resource contracts, heartbeat rows, red-only Resend alert debounce, and monthly green self-check email suppression.

M0728-17r2 changes the visitor dashboard into a three-layer view: 12-site overview, per-site aggregates, and collapsed compact visitor rows with global 1/7/30/180-day ranges.

M0728-12 changes the visitor dashboard card to render one collapsed row per site_id plus visitor_id, with four mobile-first columns and detailed metrics moved into row expansion.

M0727-27 fixes beacon dwell delivery by switching unload sendBeacon payloads to text/plain JSON and allowing /events to parse text/plain JSON without changing origin, allowlist, or rate-limit checks.
M0727-31 adds a DASHBOARD_KEY-protected visitor dashboard endpoint/card for production visitor_events and closes the missing-token anonymous admin access path with 403 responses.

M0727-20 adds the draft central `/beacon.js` visitor beacon script, including explicit `data-site` site IDs, guarded once-per-session `section_view`, narrow UTM forwarding, and script size tests under 4KB.

T0719-01 changes BJT and Progress dashboard backup freshness from "today JST" to an inclusive rolling 27-hour window, adds 26h-green/28h-red alert counterexamples, and documents the 48-hour observation and alert ownership split.

M0718-19 splits Progress backup health into production/preview manifests, validates environment/database/object prefixes, and alerts independently when either is missing, crossed, or older than 27 hours.

## 2026-06-16 Content Inventory

- Script: `/Users/jiajia/Documents/GitHub/db/scripts/content_stats.py`
- Output: `/Users/jiajia/Documents/GitHub/db/data/content-stats.json`
- History: `/Users/jiajia/Documents/GitHub/db/data/content-stats-history.json`
- Schedule: `/Users/jiajia/Library/LaunchAgents/com.dashboard.content-stats.plist`, daily at 02:15 JST, log `/tmp/content-stats.log`. The LaunchAgent executes `/Users/jiajia/Documents/GitHub/db/scripts/content_stats_launchd.mjs` with Node because macOS launchd blocks `/usr/bin/python3` from reading files under `Documents/GitHub` on this machine.

### Data Sources

- BJT Pro Study: `/Users/jiajia/Documents/GitHub/bjt/pro/data/study_part12.js` and `/Users/jiajia/Documents/GitHub/bjt/pro/data/study_part3.js`; counts unique `num` entries in `STUDY_BANK_A` through `STUDY_BANK_I`. Current value: 889.
- BJT Pro Mogi: `/Users/jiajia/Documents/GitHub/bjt/pro/data/mogi_set*.js`; counts fixed `MOGI_SET_*` files as sets, not questions. Current value: 2.
- BJT Pro Active Members: Cloudflare KV namespace `fc382800625e42b7bbfe13830dd39e82`, keys `member:*`; reuses the existing admin API when `BJT_ADMIN_PASSWORD` or `BJT_ADMIN_TOKEN` is available, otherwise reads the same KV via `wrangler`. Active means `expire_date` is today or later in JST. Current value: 15.
- PATTO J1/J2/J3: `/Users/jiajia/Documents/GitHub/bjt/audio/voca/bank*.js`; counts unique `id` by `level`. `J1+` is included in J1 because the dashboard has only J1/J2/J3 columns. Current values: J1 119, J2 920, J3 429.
- PROGRESS EN/JP/CN: `/Users/jiajia/Documents/GitHub/progress/data/decks/gdp_top3.json`; counts entries with non-empty `en`, `jp`, and `cn` fields. Current values: EN 1000, JP 1000, CN 1000.

### Verification

- Ran `python3 /Users/jiajia/Documents/GitHub/db/scripts/content_stats.py --dry-run` successfully against real local repos and Cloudflare KV.
- Ran `python3 /Users/jiajia/Documents/GitHub/db/scripts/content_stats.py --no-push` to write `content-stats.json` and history.
- Temporarily inserted a 2026-06-15 history snapshot and reran the script to verify positive, negative, and zero `change` values, then restored real history and regenerated the final JSON.
M0807-69 db：新增 nice_analytics 生产 D1 每日备份 workflow，UTC 18:29 导出到 `progress-backup/d1/nice_analytics/production/`，manifest 记录时间、大小、sha256、表行数、failures 与 30 天游走+月留一份保留策略；上传后立即读回校验 sha256；dashboard 备份健康加入 nice_analytics manifest 校验。
