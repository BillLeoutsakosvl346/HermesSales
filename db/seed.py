"""
Seed Supabase with data from the local JSON files.
Run once: python -m db.seed
"""

import json
import sys
from pathlib import Path

# Allow running from project root
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from db.client import supabase

DATA_DIR = Path(__file__).parent.parent / "data"


def seed_customers():
    with open(DATA_DIR / "customers.json") as f:
        customers = json.load(f)

    print(f"Seeding {len(customers)} customers...")
    result = supabase.table("call_inputs").upsert(customers).execute()
    print(f"  Done — {len(result.data)} rows upserted.")


def seed_products():
    with open(DATA_DIR / "products.json") as f:
        products = json.load(f)

    print(f"Seeding {len(products)} products...")
    result = supabase.table("products").upsert(products).execute()
    print(f"  Done — {len(result.data)} rows upserted.")


def seed_call_logs():
    """Migrate any existing local call_log.json entries into Supabase."""
    log_path = DATA_DIR / "call_log.json"
    if not log_path.exists():
        print("No local call_log.json found — skipping.")
        return

    with open(log_path) as f:
        logs = json.load(f)

    if not logs:
        print("call_log.json is empty — skipping.")
        return

    # Strip the local 'timestamp' field name to match Supabase schema
    cleaned = []
    for entry in logs:
        cleaned.append({
            "customer_id":    entry.get("customer_id") or None,
            "customer_name":  entry.get("customer_name"),
            "outcome":        entry.get("outcome"),
            "notes":          entry.get("notes"),
            "follow_up_date": entry.get("follow_up_date") or None,
        })

    print(f"Migrating {len(cleaned)} call log entries...")
    result = supabase.table("call_outputs").insert(cleaned).execute()
    print(f"  Done — {len(result.data)} rows inserted.")


if __name__ == "__main__":
    print("=== Seeding Supabase ===")
    seed_customers()
    seed_products()
    seed_call_logs()
    print("\nAll done.")
