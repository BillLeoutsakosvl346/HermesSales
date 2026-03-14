"""
Tool definitions and implementations for the Sports Wholesale agent.
All data reads/writes go through Supabase.

Tables:
  call_inputs   — prospects / leads (input spreadsheet)
  call_outputs  — call results     (output spreadsheet)
  products      — live stock catalogue
"""

from datetime import datetime
from pathlib import Path
from db.client import supabase

DATA_DIR = Path(__file__).parent.parent / "data"


# ── Tool schemas (passed to Claude) ──────────────────────────────────────────

TOOL_DEFINITIONS = [
    {
        "name": "lookup_products",
        "description": (
            "Search the live product catalogue by brand, category, or keyword. "
            "Returns matching products with pricing, availability, and size info. "
            "Use this when the prospect asks about specific products or when you want "
            "to pitch relevant stock accurately. Never invent stock — always use this tool."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "brand": {
                    "type": "string",
                    "description": "Brand name to filter by (e.g. 'Adidas', 'New Balance', 'Puma'). Case-insensitive.",
                },
                "category": {
                    "type": "string",
                    "description": "Category to filter by: 'Footwear', 'Apparel', or 'Accessories'.",
                },
                "keyword": {
                    "type": "string",
                    "description": "Keyword to search in product name or notes (e.g. 'Samba', 'hoodie', 'football boot', 'slides').",
                },
                "max_results": {
                    "type": "integer",
                    "description": "Maximum number of results to return. Default 5.",
                    "default": 5,
                },
            },
            "required": [],
        },
    },
    {
        "name": "get_customer_history",
        "description": (
            "Retrieve a customer's order history and profile mid-call. "
            "Use this when you want to reference what they've bought before, "
            "e.g. 'last time you took the Sambas — we've got more of those in'."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_id": {
                    "type": "string",
                    "description": "The customer ID (e.g. 'C001').",
                }
            },
            "required": ["customer_id"],
        },
    },
    {
        "name": "log_call_outcome",
        "description": (
            "Log the outcome of this call. Call this at the END of every conversation "
            "to record what happened. This is mandatory — always call this before wrapping up."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "outcome": {
                    "type": "string",
                    "enum": [
                        "interested_list_sent",
                        "interested_follow_up_booked",
                        "not_interested",
                        "no_answer_voicemail",
                        "no_answer_no_voicemail",
                        "callback_requested",
                        "order_placed",
                    ],
                    "description": "The call outcome.",
                },
                "notes": {
                    "type": "string",
                    "description": "Brief notes: what the prospect said, what they're interested in, any objections raised.",
                },
                "products_discussed": {
                    "type": "string",
                    "description": "Comma-separated list of products or brands that came up during the call, e.g. 'Adidas Samba, New Balance 574'.",
                },
                "lead_status_after": {
                    "type": "string",
                    "enum": ["Active", "Warm", "Lapsed", "Cold", "New", "Do Not Call"],
                    "description": "Updated lead status based on how the call went. Omit if unchanged.",
                },
                "follow_up_date": {
                    "type": "string",
                    "description": "If a follow-up was agreed, the date as YYYY-MM-DD. Leave blank if not applicable.",
                },
            },
            "required": ["outcome", "notes"],
        },
    },
]


# ── Tool implementations ──────────────────────────────────────────────────────

def lookup_products(
    brand: str | None = None,
    category: str | None = None,
    keyword: str | None = None,
    max_results: int = 5,
) -> str:
    """Search products in Supabase and return a formatted string for the agent."""
    query = supabase.table("products").select("*")

    if brand:
        query = query.ilike("brand", f"%{brand}%")
    if category:
        query = query.ilike("category", f"%{category}%")
    if keyword:
        query = query.or_(f"name.ilike.%{keyword}%,notes.ilike.%{keyword}%")

    query = query.limit(max_results)
    result = query.execute()
    products = result.data

    if not products:
        return "No products found matching those criteria."

    lines = [f"Found {len(products)} product(s):\n"]
    for p in products:
        lines.append(
            f"[{p['id']}] {p['brand']} — {p['name']}\n"
            f"  Category: {p['category']} | Gender: {p['gender']}\n"
            f"  Units: {p['units']:,} | Sizes: {p['sizes']}\n"
            f"  Offer price: £{p['offer_price']} (RRP £{p['rrp']}) | MOQ: {p['moq']} units\n"
            f"  Location: {p['location']} | Condition: {p['condition']}\n"
            f"  Notes: {p['notes']}\n"
        )

    return "\n".join(lines)


def get_input_by_id(input_id: str) -> dict | None:
    """Look up a call_inputs record from Supabase by ID."""
    result = supabase.table("call_inputs").select("*").eq("id", input_id).single().execute()
    return result.data


def get_all_inputs() -> list[dict]:
    """Return all rows from call_inputs."""
    result = supabase.table("call_inputs").select("*").execute()
    return result.data


def get_customer_history(customer_id: str) -> str:
    """Return a customer's order history formatted for the agent."""
    record = get_input_by_id(customer_id)
    if not record:
        return f"No customer found with ID {customer_id}."

    history = record.get("order_history") or []
    if not history:
        return (
            f"{record['name']} ({record['business_name']}) has no previous orders. "
            f"Status: {record['lead_status']}. Notes: {record.get('notes', '')}"
        )

    lines = [
        f"{record['name']} — {record['business_name']} ({record['type']}, {record['location']})",
        f"Status: {record['lead_status']}",
        f"Notes: {record.get('notes', '')}",
        f"\nOrder history ({len(history)} orders):",
    ]
    for o in history:
        lines.append(f"  {o['date']}: £{o['total']:,} — {o['items']}")

    total_spend = sum(o["total"] for o in history)
    lines.append(f"\nLifetime spend: £{total_spend:,}")

    return "\n".join(lines)


def log_call_outcome(
    outcome: str,
    notes: str,
    follow_up_date: str = "",
    customer_id: str = "",
    customer_name: str = "",
    business_name: str = "",
    phone_number: str = "",
    products_discussed: str = "",
    lead_status_before: str = "",
    lead_status_after: str = "",
) -> str:
    """Write a call outcome record to the call_outputs table."""
    record = {
        "customer_id":        customer_id or None,
        "customer_name":      customer_name,
        "business_name":      business_name or None,
        "phone_number":       phone_number or None,
        "outcome":            outcome,
        "notes":              notes,
        "follow_up_date":     follow_up_date or None,
        "products_discussed": products_discussed or None,
        "lead_status_before": lead_status_before or None,
        "lead_status_after":  lead_status_after or None,
    }

    supabase.table("call_outputs").insert(record).execute()

    # Write back updated lead status and increment attempt counter
    if customer_id:
        current = supabase.table("call_inputs").select("call_attempt_count").eq("id", customer_id).single().execute()
        update: dict = {
            "call_attempt_count": (current.data.get("call_attempt_count") or 0) + 1,
            "updated_at": datetime.utcnow().isoformat(),
        }
        if lead_status_after:
            update["lead_status"] = lead_status_after
        supabase.table("call_inputs").update(update).eq("id", customer_id).execute()

    return f"Call logged: {outcome}.{f' Follow-up: {follow_up_date}.' if follow_up_date else ''}"


def get_outputs() -> list[dict]:
    """Return all call outputs, most recent first."""
    result = supabase.table("call_outputs").select("*").order("created_at", desc=True).execute()
    return result.data


def get_recent_outputs(customer_id: str, limit: int = 3) -> list[dict]:
    """Return the most recent call outputs for a specific customer."""
    try:
        result = (
            supabase.table("call_outputs")
            .select("created_at, outcome, notes, products_discussed, follow_up_date, lead_status_after")
            .eq("customer_id", customer_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data
    except Exception:
        # Fall back to base columns if migration hasn't been run yet
        result = (
            supabase.table("call_outputs")
            .select("created_at, outcome, notes, follow_up_date")
            .eq("customer_id", customer_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data


def execute_tool(tool_name: str, tool_input: dict, customer: dict | None = None) -> str:
    """Dispatch a tool call and return the result as a string."""
    if tool_name == "lookup_products":
        return lookup_products(
            brand=tool_input.get("brand"),
            category=tool_input.get("category"),
            keyword=tool_input.get("keyword"),
            max_results=tool_input.get("max_results", 5),
        )

    if tool_name == "get_customer_history":
        return get_customer_history(tool_input["customer_id"])

    if tool_name == "log_call_outcome":
        return log_call_outcome(
            outcome=tool_input["outcome"],
            notes=tool_input["notes"],
            follow_up_date=tool_input.get("follow_up_date", ""),
            customer_id=customer.get("id", "") if customer else "",
            customer_name=customer.get("name", "") if customer else "",
            business_name=customer.get("business_name", "") if customer else "",
            phone_number=customer.get("phone_number", "") if customer else "",
            products_discussed=tool_input.get("products_discussed", ""),
            lead_status_before=customer.get("lead_status", "") if customer else "",
            lead_status_after=tool_input.get("lead_status_after", ""),
        )

    return f"Unknown tool: {tool_name}"
