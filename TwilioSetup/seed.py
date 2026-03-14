import os
import json
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

leads = [
    {
        "name": "Marcus Webb",
        "business": "TradeKicks Ltd",
        "phone": "+44 7911 234 001",
        "status": "Ready",
        "notes": "Prefers phone, buys in bulk 500+ pairs",
        "prompt_context": {
            "buyerContext": "Contact name: Marcus Webb\nBusiness: TradeKicks Ltd\nBuyer type: Footwear Wholesaler\nUK-based, repeat buyer. Avg order £15k. Prefers Adidas lifestyle range. Price ceiling £48/pair.",
            "inventoryShortlist": [
                "Adidas Samba OG — 380 pairs, sizes 6-12, £42/pair",
                "Adidas Gazelle Indoor — 200 pairs, sizes 7-11, £38/pair",
            ],
            "fallbackInventory": [
                "Adidas Stan Smith — 150 pairs, mixed sizes, £35/pair",
                "Adidas Ultraboost 22 — 90 pairs, £52/pair",
            ],
            "callGoal": "Pitch Samba OG excess stock. Mention Gazelle as add-on. Aim for 300+ pair commitment.",
        },
    },
    {
        "name": "Priya Patel",
        "business": "SoleMate Wholesale",
        "phone": "+44 7922 345 012",
        "status": "Ready",
        "notes": "Needs clean invoices, Amazon FBA seller",
        "prompt_context": {
            "buyerContext": "Contact name: Priya Patel\nBusiness: SoleMate Wholesale\nBuyer type: Amazon Seller\nAmazon FBA seller, needs clean invoices and brand authorization letters. Moves fast on good pricing.",
            "inventoryShortlist": [
                "Converse Chuck Taylor Hi — 500 pairs, full size run, £32/pair",
                "Converse Chuck 70 — 180 pairs, sizes 7-10, £45/pair",
            ],
            "fallbackInventory": [
                "New Balance 574 — 220 pairs, £38/pair",
                "Mixed Converse Low — 300 pairs, £28/pair",
            ],
            "callGoal": "Follow up on previous list request. Push Chuck Taylor volume deal. Mention Chuck 70 premium margin opportunity.",
        },
    },
    {
        "name": "Danny Okoye",
        "business": "NorthWear Apparel",
        "phone": "+44 7933 456 023",
        "status": "Ready",
        "notes": "Price sensitive, wants UK stock only",
        "prompt_context": {
            "buyerContext": "Contact name: Danny Okoye\nBusiness: NorthWear Apparel\nBuyer type: Apparel Trader\nManchester-based. Sells to market stalls and independent retailers. Price ceiling £12/unit on apparel.",
            "inventoryShortlist": [
                "Adidas Training Tees x800 — £8/unit",
                "Adidas Track Pants x400 — £11/unit",
            ],
            "fallbackInventory": [
                "Mixed Sportswear Hoodies x200 — £14/unit",
            ],
            "callGoal": "Re-engage after previous interest. Offer UK-warehoused apparel lots. Emphasize quick delivery.",
        },
    },
    {
        "name": "Sarah Chen",
        "business": "BulkBuy Direct",
        "phone": "+44 7944 567 034",
        "status": "Ready",
        "notes": "Large volume only, prefers WhatsApp follow-up",
        "prompt_context": {
            "buyerContext": "Contact name: Sarah Chen\nBusiness: BulkBuy Direct\nBuyer type: Bulk Discount Buyer\nHigh-volume buyer, typically 500+ pairs minimum. Exports to EU. Very price-driven.",
            "inventoryShortlist": [
                "Converse Chuck Taylor Hi — 500 pairs, £32/pair",
                "Converse Chuck Taylor Lo — 400 pairs, £30/pair",
            ],
            "fallbackInventory": [
                "Converse Chuck 70 Hi — 180 pairs, £45/pair",
            ],
            "callGoal": "Callback follow-up. Offer combined Chuck Taylor Hi+Lo deal at volume discount.",
        },
    },
    {
        "name": "James Thornton",
        "business": "StepRight Trading",
        "phone": "+44 7955 678 045",
        "status": "Ready",
        "notes": "New lead, referred by Marcus Webb",
        "prompt_context": {
            "buyerContext": "Contact name: James Thornton\nBusiness: StepRight Trading\nBuyer type: Footwear Wholesaler\nNew lead referred by existing buyer. Birmingham-based. No order history.",
            "inventoryShortlist": [
                "Adidas Samba OG — 380 pairs, £42/pair",
                "Adidas Stan Smith — 150 pairs, £35/pair",
            ],
            "fallbackInventory": [
                "Adidas Gazelle Indoor — 200 pairs, £38/pair",
            ],
            "callGoal": "Intro call. Mention referral from Marcus Webb. Gauge interest and volume capacity.",
        },
    },
]

print(f"Seeding {len(leads)} leads...")
result = supabase.table("leads").insert(leads).execute()
print(f"Done. Inserted {len(result.data)} leads.")
