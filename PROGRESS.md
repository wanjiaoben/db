# db.nice.okinawa Progress

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
