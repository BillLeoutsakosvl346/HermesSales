import { supabase } from "@/lib/supabase";
import { StatusBadge } from "@/components/StatusBadge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface CallResult {
  id: string;
  lead_id: string;
  result: string;
  summary: string;
  transcript: { speaker: string; text: string }[];
  next_step: string;
  created_at: string;
  leads?: { name: string; business: string; phone: string };
}

export default function Results() {
  const [results, setResults] = useState<CallResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CallResult | null>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  async function fetchResults() {
    setLoading(true);
    const { data, error } = await supabase
      .from("call_results")
      .select("*, leads(name, business, phone)")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load results");
      console.error(error);
    } else {
      setResults(data || []);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-40px)]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Call Results</h1>
          <p className="text-[11px] text-muted-foreground">{results.length} completed calls</p>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={fetchResults}>
          <RefreshCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>

      <div className="flex flex-1 min-h-0">
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Loading...</div>
          ) : results.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No call results yet.</div>
          ) : (
            <table className="w-full table-dense">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-muted-foreground">Time</th>
                  <th className="text-left font-medium text-muted-foreground">Lead</th>
                  <th className="text-left font-medium text-muted-foreground">Business</th>
                  <th className="text-left font-medium text-muted-foreground">Result</th>
                  <th className="text-left font-medium text-muted-foreground">Summary</th>
                  <th className="text-left font-medium text-muted-foreground">Next Step</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-b border-border hover:bg-accent/50 cursor-pointer transition-colors ${selected?.id === r.id ? "bg-accent/50" : ""}`}
                    onClick={() => setSelected(r)}
                  >
                    <td className="text-tabular text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="font-medium text-foreground whitespace-nowrap">{r.leads?.name || "—"}</td>
                    <td className="text-muted-foreground whitespace-nowrap">{r.leads?.business || "—"}</td>
                    <td><StatusBadge status={r.result || "—"} /></td>
                    <td className="text-muted-foreground max-w-[250px] truncate">{r.summary || "—"}</td>
                    <td className="text-muted-foreground max-w-[200px] truncate">{r.next_step || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ScrollArea>

        {selected && (
          <div className="w-[340px] border-l border-border bg-card overflow-y-auto shrink-0">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-semibold">{selected.leads?.name || "Unknown"}</h2>
              <p className="text-[11px] text-muted-foreground">{selected.leads?.business}</p>
              <div className="mt-2"><StatusBadge status={selected.result || "—"} /></div>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Summary</h3>
                <p className="text-[12px] text-foreground leading-relaxed">{selected.summary || "No summary"}</p>
              </div>
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Next Step</h3>
                <p className="text-[12px] text-foreground">{selected.next_step || "—"}</p>
              </div>
              {selected.transcript && selected.transcript.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Transcript</h3>
                  <div className="space-y-2">
                    {selected.transcript.map((msg, i) => (
                      <div key={i} className={`px-3 py-2 rounded-md text-[12px] ${msg.speaker === "AI" ? "bg-muted" : "bg-primary/10"}`}>
                        <span className="font-medium text-[10px] uppercase text-muted-foreground">{msg.speaker}</span>
                        <p className="mt-0.5">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
