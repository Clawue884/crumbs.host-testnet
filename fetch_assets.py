#!/usr/bin/env python3
from __future__ import annotations

import csv
import datetime as dt
import time
import requests
from typing import Dict, Any, List

HORIZON_ASSETS_URL = "https://api.testnet.minepi.com/horizon/assets"
HEADERS = {
    "User-Agent": "CrumbsPiTestnetIndexer/2.0"
}

OUTPUT_JSON = "data/tokens.json"
OUTPUT_CSV = "data/tokens.csv"

SLEEP_BETWEEN_PAGES = 0.2  # seconds
TIMEOUT = 10

def fetch_all_assets() -> List[Dict[str, Any]]:
    all_assets: List[Dict[str, Any]] = []
    url = HORIZON_ASSETS_URL
    page = 0

    while url:
        page += 1
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()

        records = data.get("_embedded", {}).get("records", [])
        for a in records:
            authorized = a.get("balances", {}).get("authorized", 0)
            asset_code = a.get("asset_code")
            asset_issuer = a.get("asset_issuer")

            is_nft_like = authorized <= 1

            all_assets.append({
                "asset_code": asset_code,
                "issuer": asset_issuer,
                "authorized_balances": authorized,
                "paging_token": a.get("paging_token"),
                "last_modified_ledger": a.get("last_modified_ledger"),
                "is_nft_like": is_nft_like,
            })

        url = data.get("_links", {}).get("next", {}).get("href")
        print(f"\rPages scanned: {page} | Assets collected: {len(all_assets)}", end="")
        time.sleep(SLEEP_BETWEEN_PAGES)

    print()
    return all_assets


def save_csv_json(assets: List[Dict[str, Any]]):
    now = dt.datetime.utcnow().isoformat() + "Z"

    # JSON
    for a in assets:
        a["last_updated"] = now

    import json
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(assets, f, indent=2)

    # CSV
    fieldnames = [
        "asset_code",
        "issuer",
        "authorized_balances",
        "is_nft_like",
        "last_modified_ledger",
        "paging_token",
        "last_updated",
    ]

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for a in assets:
            writer.writerow(a)


def main():
    print("Fetching Pi Testnet assets from Horizon…")
    assets = fetch_all_assets()
    save_csv_json(assets)
    print(f"Saved {len(assets)} assets to:")
    print(f" - {OUTPUT_JSON}")
    print(f" - {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
