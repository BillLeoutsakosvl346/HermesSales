"""
Supabase client — single shared instance for the whole app.
"""

import os
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://wnfcxumebppdqefqbnys.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

if not SUPABASE_KEY:
    raise EnvironmentError("SUPABASE_KEY is not set. Add it to your .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
