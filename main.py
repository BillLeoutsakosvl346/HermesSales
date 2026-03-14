"""
Sports Wholesale AI Sales Agent — FastAPI backend

Endpoints:
  GET  /inputs              — list all call inputs (leads)
  GET  /inputs/{id}         — get single lead
  GET  /inputs/queue        — prioritised call queue (DNC filtered)
  POST /inputs/import       — sync rows from input spreadsheet to DB
  GET  /products            — list/search products
  POST /chat                — text-based agent conversation (for testing)
  POST /call/start          — start a new outbound call session
  GET  /outputs             — list all call outputs (results)
  GET  /outputs/results     — full output spreadsheet view (joined with inputs)
  POST /voice/webhook       — Twilio voice webhook stub
"""

import os
import uuid
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent.agent import chat, start_call
from agent.tools import get_all_inputs, get_input_by_id, lookup_products, get_outputs
from db.client import supabase

app = FastAPI(title="Sports Wholesale AI Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request/Response models ───────────────────────────────────────────────────

class Message(BaseModel):
    role: str   # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    customer_id: str | None = None
    messages: list[Message]


class ChatResponse(BaseModel):
    reply: str
    messages: list[Message]


class StartCallRequest(BaseModel):
    customer_id: str | None = None


class StartCallResponse(BaseModel):
    opening_line: str
    messages: list[Message]
    customer: dict | None


class CallInputRow(BaseModel):
    """One row from the input spreadsheet."""
    id: str | None = None
    name: str
    business_name: str | None = None
    phone_number: str | None = None
    type: str | None = None
    source: str | None = None
    lead_status: str = "New"
    location: str | None = None
    notes: str | None = None
    ebay_store: str | None = None
    amazon_store: str | None = None
    website: str | None = None
    priority_brands: str | None = None
    priority_categories: str | None = None
    keywords_to_pitch: str | None = None
    call_priority: str = "Medium"
    call_window: str = "Any"
    max_attempts: int = 3
    do_not_call: bool = False


class ImportRequest(BaseModel):
    rows: list[CallInputRow]


class ImportResponse(BaseModel):
    upserted: int
    ids: list[str]


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "service": "Sports Wholesale AI Agent"}


@app.get("/inputs")
def list_inputs():
    """List all leads from call_inputs."""
    return get_all_inputs()


@app.get("/inputs/queue")
def get_input_queue():
    """
    Return the prioritised call queue.
    Filtered: no DNC, has attempts remaining. Ordered: priority then lead_status.
    """
    result = supabase.table("input_queue_view").select("*").execute()
    return result.data


@app.get("/inputs/{input_id}")
def get_input(input_id: str):
    record = get_input_by_id(input_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Input {input_id} not found")
    return record


@app.post("/inputs/import", response_model=ImportResponse)
def import_inputs(req: ImportRequest):
    """
    Sync rows from the input spreadsheet to call_inputs.
    Upserts on id — new rows are inserted, existing rows are updated.
    Omit 'id' to auto-generate one for brand-new leads.
    """
    records = []
    for row in req.rows:
        record = row.model_dump(exclude_none=True)
        if not record.get("id"):
            record["id"] = "C" + str(uuid.uuid4())[:6].upper()
        records.append(record)

    result = supabase.table("call_inputs").upsert(records).execute()
    return ImportResponse(upserted=len(result.data), ids=[r["id"] for r in result.data])


@app.get("/products")
def list_products(
    brand: str | None = None,
    category: str | None = None,
    keyword: str | None = None,
    max_results: int = 20,
):
    result = lookup_products(brand=brand, category=category, keyword=keyword, max_results=max_results)
    return {"result": result}


@app.post("/call/start", response_model=StartCallResponse)
def start_new_call(req: StartCallRequest):
    """
    Start a new outbound call. Returns the agent's opening line
    and the initial conversation state to continue with /chat.
    """
    customer = None
    if req.customer_id:
        customer = get_input_by_id(req.customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail=f"Input {req.customer_id} not found")

    opening_line, messages = start_call(customer=customer)

    return StartCallResponse(
        opening_line=opening_line,
        messages=[Message(role=m["role"], content=m["content"] if isinstance(m["content"], str) else str(m["content"])) for m in messages],
        customer=customer,
    )


@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    """
    Continue a conversation. Pass the full messages history each time.
    The agent will respond and return the updated history.
    """
    customer = None
    if req.customer_id:
        customer = get_input_by_id(req.customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail=f"Input {req.customer_id} not found")

    messages = [{"role": m.role, "content": m.content} for m in req.messages]
    reply, updated_messages = chat(messages, customer=customer)

    serializable = [
        Message(role=m["role"], content=m["content"])
        for m in updated_messages
        if isinstance(m["content"], str)
    ]

    return ChatResponse(reply=reply, messages=serializable)


@app.get("/outputs")
def list_outputs():
    """Return all call outputs from call_outputs, most recent first."""
    return get_outputs()


@app.get("/outputs/results")
def get_output_results():
    """
    Return the full output spreadsheet view — call_outputs joined with call_inputs.
    Maps to output_results_view in Supabase.
    """
    result = supabase.table("output_results_view").select("*").execute()
    return result.data


@app.post("/voice/webhook")
async def voice_webhook(request: dict):
    """
    Stub for Twilio/Bland/Vapi voice webhook.
    Wire up your voice platform to POST speech-to-text turns here,
    then return the agent's text response for TTS.
    """
    return {"message": "Voice webhook stub — integrate your voice platform here"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
