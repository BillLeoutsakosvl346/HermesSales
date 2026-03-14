import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useRef } from "react";
import { Headphones } from "lucide-react";

interface TranscriptLine {
  speaker: string;
  text: string;
}

interface LiveCall {
  call_key: string;
  name: string;
  business: string;
  status: string;
  transcript: TranscriptLine[];
}

export default function LiveCalls() {
  const [calls, setCalls] = useState<Record<string, LiveCall>>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const evtSource = new EventSource("/api/calls/stream");

    evtSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      const key = data.call_key;

      setCalls((prev) => {
        const existing = prev[key];

        if (data.status === "ended") {
          const copy = { ...prev };
          delete copy[key];
          return copy;
        }

        if (data.speaker && data.text) {
          if (!existing) return prev;
          return {
            ...prev,
            [key]: {
              ...existing,
              transcript: [...existing.transcript, { speaker: data.speaker, text: data.text }],
            },
          };
        }

        if (data.transcript) {
          return {
            ...prev,
            [key]: {
              call_key: key,
              name: data.name || existing?.name || "",
              business: data.business || existing?.business || "",
              status: data.status || existing?.status || "live",
              transcript: data.transcript,
            },
          };
        }

        return {
          ...prev,
          [key]: {
            call_key: key,
            name: data.name || existing?.name || "",
            business: data.business || existing?.business || "",
            status: data.status || existing?.status || "dialing",
            transcript: existing?.transcript || [],
          },
        };
      });
    };

    return () => evtSource.close();
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [calls, selectedKey]);

  const callList = Object.values(calls).sort((a, b) => {
    const order: Record<string, number> = { live: 0, dialing: 1, ended: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  const selected = selectedKey ? calls[selectedKey] : null;
  const activeCount = callList.filter((c) => c.status === "live" || c.status === "dialing").length;

  return (
    <div className="flex flex-col h-[calc(100vh-40px)]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-foreground">Live Calls</h1>
          <span className="text-[12px] text-muted-foreground">{activeCount} active</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <ScrollArea className="w-[320px] shrink-0 border-r border-border">
          <div className="p-2 space-y-1">
            {callList.length === 0 ? (
              <div className="text-center text-muted-foreground text-[12px] py-8">No active calls</div>
            ) : (
              callList.map((call) => (
                <div
                  key={call.call_key}
                  onClick={() => setSelectedKey(call.call_key)}
                  className={`p-2.5 rounded-md border cursor-pointer transition-colors ${
                    selectedKey === call.call_key
                      ? "border-primary/30 bg-primary/5"
                      : "border-border hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-medium text-foreground">{call.name}</span>
                    <StatusBadge status={call.status === "live" ? "Live Call" : call.status === "dialing" ? "Dialing" : "Completed"} />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{call.business}</span>
                  {call.transcript.length > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                      {call.transcript[call.transcript.length - 1].text}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex-1 min-w-0">
          {selected ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">{selected.name}</h2>
                    <p className="text-[12px] text-muted-foreground">{selected.business}</p>
                  </div>
                  <StatusBadge status={selected.status === "live" ? "Live Call" : selected.status === "dialing" ? "Dialing" : "Completed"} />
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                {selected.transcript.length === 0 ? (
                  <div className="text-muted-foreground text-[12px]">Waiting for conversation...</div>
                ) : (
                  <div className="space-y-2">
                    {selected.transcript.map((msg, i) => (
                      <div key={i} className={`flex ${msg.speaker === "Buyer" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] px-3 py-2 rounded-md text-[12px] ${
                            msg.speaker === "AI"
                              ? "bg-muted text-foreground"
                              : "bg-primary/10 text-foreground"
                          }`}
                        >
                          <span className="font-medium text-[10px] uppercase text-muted-foreground">
                            {msg.speaker === "AI" ? "AI Agent" : "Buyer"}
                          </span>
                          <p className="mt-0.5">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={transcriptEndRef} />
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-[13px]">
              <div className="text-center">
                <Headphones className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Select a call to view live transcript</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
