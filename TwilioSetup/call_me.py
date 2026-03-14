import os
import json
import asyncio
import uuid

import websockets
import uvicorn
from fastapi import FastAPI, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, StreamingResponse
from twilio.rest import Client
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

NGROK_URL = os.getenv("NGROK_URL", "https://8497-185-175-113-190.ngrok-free.app")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

VOICE = "ash"

twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
openai_client = OpenAI(api_key=OPENAI_API_KEY)
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

PROMPT_TEMPLATE = """IMPORTANT: Always speak in English. Do not switch to any other language unless the buyer explicitly asks you to.

You are Imad, a salesperson at Sports Wholesale, part of Dirac Trading Group.

You are making an outbound sales call to a real buyer. Your job is to sound like a genuine wholesale trader, not a scripted sales rep.

Your goal on this call:
- Introduce yourself naturally.
- Confirm you are speaking to the right person.
- Use the buyer context below.
- Ask what they are looking for right now.
- Match their answer to the stock context below.
- Try to make a sale if there is a fit.
- If there is not a good fit, say honestly that you do not have much on that at the moment.
- If they are interested but not ready to buy immediately, get a clear next step such as sending a list, WhatsApp follow-up, email follow-up, or a callback/meeting request.

How to sound:
- Casual, direct, trader-to-trader.
- Friendly and confident.
- Short sentences.
- One question at a time.
- Natural, not robotic.
- Never sound like a corporate SDR or call centre agent.

Business context:
- You work for Sports Wholesale.
- Sports Wholesale is a branded sportswear excess stock distributor.
- Adidas is the main brand.
- Other brands can include Converse, Puma, New Balance, Reebok and others depending on current stock.
- Stock is genuine.
- Sanitised invoices can be provided for Amazon/eBay brand approval.
- Minimum order value is £1,000.
- Some lines are immediate dispatch, others can have lead times.
- Payment is bank transfer.
- New customers are usually pro-forma.

Hard rules:
- Never mention where the stock comes from.
- Never mention brand partnerships.
- Never discuss margins or what Sports Wholesale paid.
- Never guarantee future availability.
- Never invent stock, price, quantity, MOQ, sizes, lead time, or delivery details that are not in the context below.
- If the buyer asks for something outside the stock context and there is no close match, say you do not have much on that right now but can check and come back to them.
- If you do not know something, say you will confirm it after the call.
- Do not be pushy.
- Do not oversell.

{buyer_context}

Stock shortlist:
{inventory_shortlist}

Fallback options:
{fallback_inventory}

Call goal:
{call_goal}

You are now on the call.
Start naturally with a short introduction in ENGLISH and then ask what they are looking for at the moment."""

active_calls = {}
sse_subscribers: list[asyncio.Queue] = []

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def broadcast_sse(event: dict):
    for q in sse_subscribers:
        q.put_nowait(event)


@app.post("/api/call")
async def api_call(request: Request):
    body = await request.json()
    lead_id = body["lead_id"]
    phone = body["phone"]
    name = body["name"]
    business = body.get("business", "")
    prompt_context = body.get("prompt_context", {})

    buyer_context = prompt_context.get("buyerContext", f"Contact name: {name}")
    shortlist = prompt_context.get("inventoryShortlist", [])
    fallback = prompt_context.get("fallbackInventory", [])
    call_goal = prompt_context.get("callGoal", "Introduce product range and gauge interest.")

    system_prompt = PROMPT_TEMPLATE.format(
        buyer_context=buyer_context,
        inventory_shortlist="\n".join(f"- {item}" for item in shortlist) if shortlist else "No specific stock shortlist for this call.",
        fallback_inventory="\n".join(f"- {item}" for item in fallback) if fallback else "No fallback options.",
        call_goal=call_goal,
    )

    call_key = str(uuid.uuid4())[:8]

    active_calls[call_key] = {
        "lead_id": lead_id,
        "name": name,
        "business": business,
        "prompt": system_prompt,
        "transcript": [],
        "status": "dialing",
    }

    call = twilio_client.calls.create(
        to=phone,
        from_=TWILIO_PHONE_NUMBER,
        url=f"{NGROK_URL}/twiml?key={call_key}",
    )

    active_calls[call_key]["call_sid"] = call.sid
    print(f"Call initiated for {name}: {call.sid} (key={call_key})")

    supabase.table("leads").update({"status": "Dialing"}).eq("id", lead_id).execute()

    broadcast_sse({"call_key": call_key, "name": name, "business": business, "status": "dialing"})

    return {"call_sid": call.sid, "call_key": call_key}


@app.get("/api/calls/stream")
async def stream_calls():
    q: asyncio.Queue = asyncio.Queue()
    sse_subscribers.append(q)

    async def event_generator():
        try:
            # Send current active calls as initial state
            for key, call in active_calls.items():
                yield f"data: {json.dumps({'call_key': key, 'name': call['name'], 'business': call.get('business', ''), 'status': call['status'], 'transcript': call['transcript']})}\n\n"
            while True:
                try:
                    msg = await asyncio.wait_for(q.get(), timeout=15)
                    yield f"data: {json.dumps(msg)}\n\n"
                except asyncio.TimeoutError:
                    yield f": keepalive\n\n"
        finally:
            sse_subscribers.remove(q)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/twiml")
async def twiml(request: Request):
    key = request.query_params.get("key", "")
    ws_url = NGROK_URL.replace("https://", "wss://") + "/media-stream"
    xml = (
        "<Response>"
        "<Connect>"
        f'<Stream url="{ws_url}">'
        f'<Parameter name="key" value="{key}" />'
        "</Stream>"
        "</Connect>"
        "</Response>"
    )
    return PlainTextResponse(xml, media_type="text/xml")


@app.websocket("/media-stream")
async def media_stream(ws: WebSocket):
    await ws.accept()
    print("Twilio connected, waiting for start event...")

    key = ""
    stream_sid = None

    for _ in range(5):
        msg = await ws.receive_text()
        data = json.loads(msg)
        print(f"Twilio event: {data.get('event')}")
        if data["event"] == "start":
            stream_sid = data["start"]["streamSid"]
            key = data["start"].get("customParameters", {}).get("key", "")
            print(f"Stream started: {stream_sid}, key={key}")
            break

    call_data = active_calls.get(key)
    if not call_data:
        print(f"No call data for key={key}, closing")
        await ws.close()
        return

    call_data["status"] = "live"
    print(f"Call connected for {call_data['name']}")
    broadcast_sse({"call_key": key, "name": call_data["name"], "business": call_data.get("business", ""), "status": "live"})

    stream_active = True
    transcript = call_data["transcript"]

    openai_ws = await websockets.connect(
        "wss://api.openai.com/v1/realtime?model=gpt-realtime",
        additional_headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
    )

    await openai_ws.send(json.dumps({
        "type": "session.update",
        "session": {
            "type": "realtime",
            "model": "gpt-realtime",
            "instructions": call_data["prompt"],
            "audio": {
                "input": {
                    "format": {"type": "audio/pcmu"},
                    "transcription": {"model": "gpt-4o-mini-transcribe"},
                },
                "output": {"format": {"type": "audio/pcmu"}, "voice": VOICE},
            },
        },
    }))

    await openai_ws.send(json.dumps({
        "type": "response.create",
        "response": {
            "instructions": f"You MUST speak in English. Start the call now. Introduce yourself naturally as Imad from Sports Wholesale, then ask if you're speaking to {call_data['name']}.",
        },
    }))

    ai_speaking = False

    async def twilio_to_openai():
        nonlocal stream_active
        try:
            while True:
                msg = await ws.receive_text()
                data = json.loads(msg)
                if data["event"] == "media":
                    if not ai_speaking:
                        await openai_ws.send(json.dumps({
                            "type": "input_audio_buffer.append",
                            "audio": data["media"]["payload"],
                        }))
                elif data["event"] == "stop":
                    stream_active = False
                    print("Stream stopped")
                    await openai_ws.close()
                    break
        except Exception as e:
            print(f"Twilio->OpenAI error: {e}")

    async def openai_to_twilio():
        nonlocal ai_speaking
        try:
            async for msg in openai_ws:
                data = json.loads(msg)
                event_type = data.get("type", "")

                if event_type == "response.output_audio.delta":
                    ai_speaking = True
                    if stream_sid and stream_active:
                        await ws.send_text(json.dumps({
                            "event": "media",
                            "streamSid": stream_sid,
                            "media": {"payload": data["delta"]},
                        }))

                elif event_type == "response.output_audio.done":
                    ai_speaking = False

                elif event_type == "response.output_audio_transcript.done":
                    text = data.get("transcript", "")
                    transcript.append({"speaker": "AI", "text": text})
                    print(f"AI: {text}")
                    broadcast_sse({"call_key": key, "speaker": "AI", "text": text, "status": "live"})

                elif event_type == "conversation.item.input_audio_transcription.completed":
                    text = data.get("transcript", "")
                    if text:
                        transcript.append({"speaker": "Buyer", "text": text})
                        print(f"Buyer: {text}")
                        broadcast_sse({"call_key": key, "speaker": "Buyer", "text": text, "status": "live"})

                elif event_type == "conversation.item.done":
                    item = data.get("item", {})
                    if item.get("role") == "user":
                        for content in item.get("content", []):
                            text = content.get("transcript", "")
                            if text:
                                transcript.append({"speaker": "Buyer", "text": text})
                                print(f"Buyer: {text}")
                                broadcast_sse({"call_key": key, "speaker": "Buyer", "text": text, "status": "live"})

                elif event_type == "session.created":
                    print("OpenAI session created")

                elif event_type == "session.updated":
                    print("OpenAI session configured")

                elif event_type == "error":
                    print(f"OpenAI error: {data}")

        except Exception as e:
            if stream_active:
                print(f"OpenAI->Twilio error: {e}")

    try:
        await asyncio.gather(twilio_to_openai(), openai_to_twilio())
    finally:
        await openai_ws.close()
        call_data["status"] = "ended"
        broadcast_sse({"call_key": key, "status": "ended"})
        print(f"Call ended for {call_data['name']}, analyzing transcript...")
        supabase.table("leads").update({"status": "Processing"}).eq("id", call_data["lead_id"]).execute()
        await analyze_and_save(call_data)
        del active_calls[key]


async def analyze_and_save(call_data):
    lead_id = call_data["lead_id"]
    transcript = call_data["transcript"]

    if not transcript:
        supabase.table("leads").update({"status": "Ready"}).eq("id", lead_id).execute()
        print("No transcript to analyze")
        return

    transcript_text = "\n".join(f"{t['speaker']}: {t['text']}" for t in transcript)

    print(f"\n--- Sending transcript to GPT-4o for analysis ---")
    print(f"Transcript:\n{transcript_text}")

    analysis_schema = {
        "type": "json_schema",
        "json_schema": {
            "name": "call_analysis",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "result": {
                        "type": "string",
                        "enum": ["Interested", "Not Interested", "Send List", "Callback Requested", "Meeting Requested", "Voicemail Left", "No Answer", "Wrong Person", "Failed"],
                    },
                    "summary": {"type": "string"},
                    "next_step": {"type": "string"},
                },
                "required": ["result", "summary", "next_step"],
                "additionalProperties": False,
            },
        },
    }

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            response_format=analysis_schema,
            messages=[
                {"role": "system", "content": "You analyze sales call transcripts."},
                {"role": "user", "content": f"""Analyze this sales call transcript and return a JSON object with:
- result: the call outcome
- summary: 1-2 sentence summary of what happened
- next_step: what should happen next

Transcript:
{transcript_text}"""},
            ],
        )

        raw = response.choices[0].message.content
        print(f"\n--- GPT-4o response ---\n{raw}")
        analysis = json.loads(raw)
    except Exception as e:
        print(f"Analysis failed: {e}")
        analysis = {"result": "Failed", "summary": "Call completed but analysis failed.", "next_step": "Review manually."}

    supabase.table("call_results").insert({
        "lead_id": lead_id,
        "result": analysis.get("result", "Failed"),
        "summary": analysis.get("summary", ""),
        "transcript": transcript,
        "next_step": analysis.get("next_step", ""),
    }).execute()

    supabase.table("leads").update({
        "status": "Done",
    }).eq("id", lead_id).execute()

    print(f"Result saved: {analysis.get('result')} — {analysis.get('summary')}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
