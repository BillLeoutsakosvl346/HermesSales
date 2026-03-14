import os
import json
import asyncio
import threading
import time

import websockets
import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.responses import PlainTextResponse
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# ── Paste your ngrok URL here (changes every restart) ──
NGROK_URL = "https://8497-185-175-113-190.ngrok-free.app"

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
MY_PHONE_NUMBER = os.getenv("MY_PHONE_NUMBER")

SYSTEM_PROMPT = "You are a helpful assistant. Be concise and friendly."
VOICE = "alloy"

app = FastAPI()


@app.post("/twiml")
async def twiml():
    ws_url = NGROK_URL.replace("https://", "wss://") + "/media-stream"
    xml = (
        "<Response>"
        "<Connect>"
        f'<Stream url="{ws_url}" />'
        "</Connect>"
        "</Response>"
    )
    return PlainTextResponse(xml, media_type="text/xml")


@app.websocket("/media-stream")
async def media_stream(ws: WebSocket):
    await ws.accept()
    print("Twilio connected")

    stream_sid = None

    openai_ws = await websockets.connect(
        "wss://api.openai.com/v1/realtime?model=gpt-realtime",
        additional_headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
    )

    await openai_ws.send(json.dumps({
        "type": "session.update",
        "session": {
            "type": "realtime",
            "model": "gpt-realtime",
            "instructions": SYSTEM_PROMPT,
            "audio": {
                "input": {"format": {"type": "audio/pcmu"}},
                "output": {"format": {"type": "audio/pcmu"}, "voice": VOICE},
            },
        },
    }))

    await openai_ws.send(json.dumps({
        "type": "response.create",
        "response": {
            "instructions": "Greet the user warmly and ask how you can help.",
        },
    }))

    async def twilio_to_openai():
        nonlocal stream_sid, stream_active
        try:
            while True:
                msg = await ws.receive_text()
                data = json.loads(msg)

                if data["event"] == "start":
                    stream_sid = data["start"]["streamSid"]
                    print(f"Stream started: {stream_sid}")

                elif data["event"] == "media":
                    await openai_ws.send(json.dumps({
                        "type": "input_audio_buffer.append",
                        "audio": data["media"]["payload"],
                    }))

                elif data["event"] == "stop":
                    stream_active = False
                    print("Stream stopped")
                    break
        except Exception as e:
            print(f"Twilio->OpenAI error: {e}")

    stream_active = True
    audio_debug_logged = False

    async def openai_to_twilio():
        nonlocal audio_debug_logged
        try:
            async for msg in openai_ws:
                data = json.loads(msg)
                event_type = data.get("type", "")

                if event_type == "response.output_audio.delta":
                    if not audio_debug_logged:
                        keys = [k for k in data.keys() if k != "delta"]
                        print(f"Audio delta keys: {keys}")
                        print(f"Delta sample (first 40 chars): {data.get('delta', 'MISSING')[:40]}")
                        audio_debug_logged = True
                    if stream_sid and stream_active:
                        payload = data["delta"]
                        await ws.send_text(json.dumps({
                            "event": "media",
                            "streamSid": stream_sid,
                            "media": {"payload": payload},
                        }))

                elif event_type == "session.created":
                    print("OpenAI session created")

                elif event_type == "session.updated":
                    print("OpenAI session configured")

                elif event_type == "response.output_audio_transcript.done":
                    print(f"Assistant said: {data.get('transcript', '')}")

                elif event_type == "error":
                    print(f"OpenAI error: {data}")

        except Exception as e:
            if stream_active:
                print(f"OpenAI->Twilio error: {e}")

    try:
        await asyncio.gather(twilio_to_openai(), openai_to_twilio())
    finally:
        await openai_ws.close()
        print("Session closed")


def make_call():
    time.sleep(3)
    twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    call = twilio_client.calls.create(
        to=MY_PHONE_NUMBER,
        from_=TWILIO_PHONE_NUMBER,
        url=f"{NGROK_URL}/twiml",
    )
    print(f"Call initiated: {call.sid}")


if __name__ == "__main__":
    threading.Thread(target=make_call, daemon=True).start()
    uvicorn.run(app, host="0.0.0.0", port=8080)
