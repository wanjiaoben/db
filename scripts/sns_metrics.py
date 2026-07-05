#!/usr/bin/env python3
"""
Refresh db/data/sns-metrics.json metadata.

The current SNS source requires Meta/Instagram permissions that are not always
available to automation. When no supported token-based fetcher is configured,
the script keeps the last measured values and marks the file as manual data.
"""

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any


JST = timezone(timedelta(hours=9))
DB_REPO = Path(os.environ.get("DB_REPO", Path(__file__).resolve().parents[1])).resolve()
OUTPUT_FILE = DB_REPO / "data" / "sns-metrics.json"


def read_json(path: Path) -> dict[str, Any]:
  if not path.exists():
    return {
      "generatedAt": "",
      "postsChecked": 0,
      "totals": {},
      "dmSummary": {"available": False, "error": "not_configured"},
      "byTheme": [],
      "topPosts": [],
    }
  data = json.loads(path.read_text(encoding="utf-8"))
  if not isinstance(data, dict):
    raise RuntimeError("sns-metrics.json must be an object")
  return data


def write_json(path: Path, data: dict[str, Any]) -> None:
  path.parent.mkdir(parents=True, exist_ok=True)
  path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
  parser = argparse.ArgumentParser()
  parser.add_argument("--dry-run", action="store_true")
  parser.add_argument("--now", help="override current JST time, ISO 8601")
  args = parser.parse_args()

  now = datetime.fromisoformat(args.now) if args.now else datetime.now(JST)
  if now.tzinfo is None:
    now = now.replace(tzinfo=JST)
  now = now.astimezone(JST)

  data = read_json(OUTPUT_FILE)
  data["updateMode"] = "manual"
  data["status"] = "manual_required"
  data["refreshAttemptedAt"] = now.isoformat(timespec="seconds")
  data["lastManualUpdate"] = data.get("generatedAt") or ""
  data["manualReason"] = (
    "Meta/Instagram metrics require page and messaging permissions; "
    "last measured values are retained until a token-based fetcher is configured."
  )

  if args.dry_run:
    print(json.dumps(data, ensure_ascii=False, indent=2))
    return 0

  write_json(OUTPUT_FILE, data)
  print(f"Wrote {OUTPUT_FILE}")
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
