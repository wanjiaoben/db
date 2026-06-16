#!/usr/bin/env python3
"""
Generate db/data/content-stats.json for db.nice.okinawa.

Local inventory is read from sibling repos under /Users/jiajia/Documents/GitHub.
Active BJT members are read from the existing BJT admin API by default.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any


JST = timezone(timedelta(hours=9))
DB_REPO = Path(os.environ.get("DB_REPO", Path(__file__).resolve().parents[1])).resolve()
GITHUB_ROOT = DB_REPO.parent
BJT_REPO = GITHUB_ROOT / "bjt"
PROGRESS_REPO = GITHUB_ROOT / "progress"
OUTPUT_FILE = DB_REPO / "data" / "content-stats.json"
HISTORY_FILE = DB_REPO / "data" / "content-stats-history.json"
BJT_ADMIN_API = os.environ.get("BJT_ADMIN_API", "https://bjt-worker.gerheidicn.workers.dev")
BJT_KV_NAMESPACE_ID = os.environ.get("BJT_KV_NAMESPACE_ID", "fc382800625e42b7bbfe13830dd39e82")
WRANGLER_BIN = os.environ.get("WRANGLER_BIN", "/Users/jiajia/.nvm/versions/node/v24.16.0/bin/npx")


FLAT_KEYS = (
    "bjtPro.studyWords",
    "bjtPro.mogiSets",
    "bjtPro.activeMembers",
    "patto.j1",
    "patto.j2",
    "patto.j3",
    "progress.en",
    "progress.jp",
    "progress.cn",
)


def read_text(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(path)
    return path.read_text(encoding="utf-8")


def count_unique_nums(paths: list[Path]) -> int:
    values: set[str] = set()
    pattern = re.compile(r'\bnum\s*:\s*["\']([^"\']+)["\']|"num"\s*:\s*"([^"]+)"')
    for path in paths:
        text = read_text(path)
        for match in pattern.findall(text):
            value = (match[0] or match[1]).strip()
            if value:
                values.add(value)
    return len(values)


def count_bjt_study_words() -> int:
    return count_unique_nums([
        BJT_REPO / "pro/data/study_part12.js",
        BJT_REPO / "pro/data/study_part3.js",
    ])


def count_mogi_sets() -> int:
    paths = sorted((BJT_REPO / "pro/data").glob("mogi_set*.js"))
    count = 0
    for path in paths:
        if re.search(r"\bvar\s+MOGI_SET_\d+\s*=", read_text(path)):
            count += 1
    return count


def post_json(url: str, payload: dict[str, Any]) -> dict[str, Any]:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.loads(res.read().decode("utf-8"))


def get_json(url: str, token: str) -> dict[str, Any]:
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.loads(res.read().decode("utf-8"))


def parse_date(value: Any) -> datetime | None:
    if not value:
        return None
    text = str(value).strip()
    try:
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", text):
            return datetime.fromisoformat(text).replace(tzinfo=JST)
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=JST)
        return parsed.astimezone(JST)
    except ValueError:
        return None


def is_active_member(member: dict[str, Any], now: datetime) -> bool:
    expires = parse_date(member.get("expire_date"))
    if not expires:
        return False
    # expire_date is stored as YYYY-MM-DD and treated as valid through that JST date.
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(member.get("expire_date", "")).strip()):
        return expires.date() >= now.date()
    return expires >= now


def fetch_members_from_admin_api() -> list[dict[str, Any]]:
    password = os.environ.get("BJT_ADMIN_PASSWORD")
    token = os.environ.get("BJT_ADMIN_TOKEN")
    if not token:
        if not password:
            raise RuntimeError("BJT_ADMIN_PASSWORD or BJT_ADMIN_TOKEN is required for active member stats")
        login = post_json(f"{BJT_ADMIN_API}/api/admin/login", {"password": password})
        token = login.get("token")
    if not token:
        raise RuntimeError("BJT admin login did not return a token")
    data = get_json(f"{BJT_ADMIN_API}/api/admin/members", token)
    members = data.get("members")
    if not isinstance(members, list):
        raise RuntimeError("BJT admin members response is missing members[]")
    return [m for m in members if isinstance(m, dict)]


def run_wrangler(args: list[str]) -> str:
    command = [WRANGLER_BIN, "wrangler", *args]
    result = subprocess.run(
        command,
        cwd=BJT_REPO / "worker",
        check=True,
        text=True,
        capture_output=True,
    )
    return result.stdout


def fetch_members_from_wrangler() -> list[dict[str, Any]]:
    raw_keys = run_wrangler([
        "kv", "key", "list",
        "--namespace-id", BJT_KV_NAMESPACE_ID,
        "--prefix", "member:",
    ])
    keys = json.loads(raw_keys)
    members: list[dict[str, Any]] = []
    for item in keys:
        name = item.get("name") if isinstance(item, dict) else None
        if not name:
            continue
        raw_member = run_wrangler([
            "kv", "key", "get", name,
            "--namespace-id", BJT_KV_NAMESPACE_ID,
        ])
        member = json.loads(raw_member)
        if isinstance(member, dict):
            members.append(member)
    return members


def count_active_members(now: datetime) -> int:
    api_error: Exception | None = None
    try:
        members = fetch_members_from_admin_api()
    except Exception as exc:
        api_error = exc
        try:
            members = fetch_members_from_wrangler()
        except Exception as wrangler_exc:
            raise RuntimeError(
                f"failed to read BJT members from admin API ({api_error}) "
                f"or wrangler KV ({wrangler_exc})"
            ) from wrangler_exc
    return sum(1 for member in members if is_active_member(member, now))


def count_patto_words() -> dict[str, int]:
    counts = {"j1": 0, "j2": 0, "j3": 0}
    seen: set[str] = set()
    item_pattern = re.compile(r"\{[^{}]*?\bid\s*:\s*['\"]([^'\"]+)['\"][^{}]*?\blevel\s*:\s*['\"]([^'\"]+)['\"][^{}]*?\}", re.S)
    for path in sorted((BJT_REPO / "audio/voca").glob("bank*.js")):
        text = read_text(path)
        for word_id, raw_level in item_pattern.findall(text):
            if word_id in seen:
                continue
            seen.add(word_id)
            level = raw_level.strip().upper()
            if level.startswith("J1"):
                counts["j1"] += 1
            elif level == "J2":
                counts["j2"] += 1
            elif level == "J3":
                counts["j3"] += 1
    return counts


def count_progress_words() -> dict[str, int]:
    data = json.loads(read_text(PROGRESS_REPO / "data/decks/gdp_top3.json"))
    if not isinstance(data, list):
        raise RuntimeError("progress data/decks/gdp_top3.json must be a JSON array")
    return {
        "en": sum(1 for item in data if isinstance(item, dict) and item.get("en")),
        "jp": sum(1 for item in data if isinstance(item, dict) and item.get("jp")),
        "cn": sum(1 for item in data if isinstance(item, dict) and item.get("cn")),
    }


def flatten(values: dict[str, Any]) -> dict[str, int]:
    return {
        "bjtPro.studyWords": int(values["bjtPro"]["studyWords"]),
        "bjtPro.mogiSets": int(values["bjtPro"]["mogiSets"]),
        "bjtPro.activeMembers": int(values["bjtPro"]["activeMembers"]),
        "patto.j1": int(values["patto"]["j1"]),
        "patto.j2": int(values["patto"]["j2"]),
        "patto.j3": int(values["patto"]["j3"]),
        "progress.en": int(values["progress"]["en"]),
        "progress.jp": int(values["progress"]["jp"]),
        "progress.cn": int(values["progress"]["cn"]),
    }


def read_history() -> dict[str, dict[str, int]]:
    if not HISTORY_FILE.exists():
        return {}
    data = json.loads(read_text(HISTORY_FILE))
    if not isinstance(data, dict):
        raise RuntimeError("content-stats-history.json must be an object")
    return {str(k): {kk: int(vv) for kk, vv in v.items()} for k, v in data.items() if isinstance(v, dict)}


def latest_before(history: dict[str, dict[str, int]], today: str) -> dict[str, int] | None:
    dates = sorted(day for day in history if re.fullmatch(r"\d{4}-\d{2}-\d{2}", day) and day < today)
    if not dates:
        return None
    return history[dates[-1]]


def stat(value: int, previous: dict[str, int] | None, key: str) -> dict[str, int]:
    return {"value": value, "change": value - int((previous or {}).get(key, value))}


def build_output(now: datetime, flat: dict[str, int], previous: dict[str, int] | None) -> dict[str, Any]:
    return {
        "generatedAt": now.isoformat(timespec="seconds"),
        "bjtPro": {
            "studyWords": stat(flat["bjtPro.studyWords"], previous, "bjtPro.studyWords"),
            "mogiSets": stat(flat["bjtPro.mogiSets"], previous, "bjtPro.mogiSets"),
            "activeMembers": stat(flat["bjtPro.activeMembers"], previous, "bjtPro.activeMembers"),
        },
        "patto": {
            "j1": stat(flat["patto.j1"], previous, "patto.j1"),
            "j2": stat(flat["patto.j2"], previous, "patto.j2"),
            "j3": stat(flat["patto.j3"], previous, "patto.j3"),
        },
        "progress": {
            "en": stat(flat["progress.en"], previous, "progress.en"),
            "jp": stat(flat["progress.jp"], previous, "progress.jp"),
            "cn": stat(flat["progress.cn"], previous, "progress.cn"),
        },
    }


def validate_schema(data: dict[str, Any]) -> None:
    for top in ("generatedAt", "bjtPro", "patto", "progress"):
        if top not in data:
            raise RuntimeError(f"missing field: {top}")
    for group, keys in {
        "bjtPro": ("studyWords", "mogiSets", "activeMembers"),
        "patto": ("j1", "j2", "j3"),
        "progress": ("en", "jp", "cn"),
    }.items():
        for key in keys:
            stat_obj = data[group].get(key)
            if set(stat_obj or {}) != {"value", "change"}:
                raise RuntimeError(f"invalid stat object: {group}.{key}")
            if not isinstance(stat_obj["value"], int) or not isinstance(stat_obj["change"], int):
                raise RuntimeError(f"non-integer stat value: {group}.{key}")


def collect_values(now: datetime) -> dict[str, Any]:
    return {
        "bjtPro": {
            "studyWords": count_bjt_study_words(),
            "mogiSets": count_mogi_sets(),
            "activeMembers": count_active_members(now),
        },
        "patto": count_patto_words(),
        "progress": count_progress_words(),
    }


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def git_push(generated_at: str, dry_run: bool) -> None:
    if dry_run:
        return
    subprocess.run(["git", "-C", str(DB_REPO), "pull", "--rebase"], check=True)
    subprocess.run(["git", "-C", str(DB_REPO), "add", "data/content-stats.json", "data/content-stats-history.json"], check=True)
    status = subprocess.run(["git", "-C", str(DB_REPO), "diff", "--cached", "--quiet"])
    if status.returncode == 0:
        print("No content stats changes to commit.")
        return
    subprocess.run(["git", "-C", str(DB_REPO), "commit", "-m", f"update content stats {generated_at}"], check=True)
    subprocess.run(["git", "-C", str(DB_REPO), "push"], check=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="calculate and print without writing or pushing")
    parser.add_argument("--no-push", action="store_true", help="write JSON files but skip git pull/commit/push")
    parser.add_argument("--now", help="override current JST time, ISO 8601")
    args = parser.parse_args()

    now = parse_date(args.now) if args.now else datetime.now(JST)
    if now is None:
        raise RuntimeError("--now must be an ISO 8601 datetime/date")

    today = now.date().isoformat()
    values = collect_values(now)
    flat = flatten(values)
    history = read_history()
    previous = latest_before(history, today)
    output = build_output(now, flat, previous)
    validate_schema(output)
    history[today] = flat

    if args.dry_run:
        print(json.dumps(output, ensure_ascii=False, indent=2))
        return 0

    write_json(HISTORY_FILE, dict(sorted(history.items())))
    write_json(OUTPUT_FILE, output)
    print(f"Wrote {OUTPUT_FILE}")
    print(f"Wrote {HISTORY_FILE}")
    git_push(output["generatedAt"], args.no_push)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
