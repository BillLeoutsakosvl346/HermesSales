"""
Core agent logic — drives a conversation turn using Claude with tool use.
"""

import anthropic
from .system_prompt import build_system_prompt
from .tools import TOOL_DEFINITIONS, execute_tool

client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 1024


def chat(
    messages: list[dict],
    customer: dict | None = None,
) -> tuple[str, list[dict]]:
    """
    Send one conversational turn to Claude and return the agent's text reply
    plus the updated messages list (with tool calls resolved).

    Args:
        messages: Conversation history in Anthropic format [{role, content}]
        customer: Optional customer record to personalise the system prompt

    Returns:
        (reply_text, updated_messages)
    """
    system = build_system_prompt(customer)

    # Agentic loop — keep going until Claude returns a final text response
    while True:
        response = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=system,
            tools=TOOL_DEFINITIONS,
            messages=messages,
        )

        # If Claude wants to use a tool, execute it and continue the loop
        if response.stop_reason == "tool_use":
            # Add Claude's response (which includes tool_use blocks) to history
            messages = messages + [{"role": "assistant", "content": response.content}]

            # Build tool_result blocks
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = execute_tool(block.name, block.input, customer=customer)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })

            # Add tool results as a user message and loop
            messages = messages + [{"role": "user", "content": tool_results}]
            continue

        # Claude returned a final text response
        reply = ""
        for block in response.content:
            if hasattr(block, "text"):
                reply += block.text

        # Add Claude's final reply to history
        messages = messages + [{"role": "assistant", "content": reply}]

        return reply, messages


def _opening_instruction(customer: dict | None) -> str:
    """Build a context-appropriate opening instruction based on lead status."""
    if not customer:
        return (
            "The prospect has just picked up. Open the call — introduce yourself as Imad from "
            "Sports Wholesale, mention you've got some new Adidas stock in and ask what they're "
            "looking for at the moment. Keep it casual."
        )

    status = customer.get("lead_status", "").lower()
    name = customer.get("name", "").split()[0]  # first name
    biz_type = customer.get("type", "")
    notes = customer.get("notes", "")

    if status == "active":
        return (
            f"The prospect ({name}) has just picked up. They're an active customer — "
            f"{biz_type} in {customer.get('location', '')}. {notes} "
            f"Open casually, reference something relevant from their history, and mention "
            f"you've got new stock they'd be interested in. One sentence, friendly."
        )
    elif status == "warm":
        return (
            f"The prospect ({name}) has just picked up. They're a warm lead — had one order but "
            f"lots of potential. {notes} "
            f"Open with 'Alright [name], it's Imad from Sports Wholesale' — reference the last "
            f"time you spoke or what they bought, and say you've got something new in. Keep it brief."
        )
    elif status == "lapsed":
        return (
            f"The prospect ({name}) has just picked up. They USED TO order regularly but have gone "
            f"quiet for 6+ months. {notes} "
            f"Open warmly, acknowledge it's been a while, don't be pushy. Ask how things are going "
            f"before pitching anything. Tone: catching up with someone you've lost touch with."
        )
    elif status == "cold":
        return (
            f"The prospect ({name}) has just picked up. This is a cold call — they enquired once "
            f"but never ordered. {notes} "
            f"Open by reminding them who you are and why you're calling. Be direct but not pushy. "
            f"Ask if they've got a minute."
        )
    elif status == "new":
        referral = ""
        if "referral" in customer.get("source", "").lower() or "referral" in notes.lower():
            referral = " Mention who referred them — Mike Brennan — to build instant trust."
        return (
            f"The prospect ({name}) has just picked up. They're a brand new lead.{referral} "
            f"{notes} Open by introducing yourself and explaining who Sports Wholesale is in "
            f"one sentence, then ask what they're looking for."
        )
    else:
        return (
            f"The prospect ({name}) has just picked up. Open casually as Imad from Sports Wholesale, "
            f"explain why you're calling, and ask what they're looking for."
        )


def start_call(customer: dict | None = None) -> tuple[str, list[dict]]:
    """
    Kick off a new outbound call. Returns the agent's opening line
    and the initial messages list.
    """
    opening_instruction = _opening_instruction(customer)
    seed = [{"role": "user", "content": opening_instruction}]
    reply, messages = chat(seed, customer=customer)
    return reply, messages
