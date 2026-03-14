import { supabase } from "@/lib/supabase";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Play, Pause, Plus, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  business: string;
  phone: string;
  status: string;
  notes: string;
  prompt_context: {
    buyerContext?: string;
    inventoryShortlist?: string[];
    fallbackInventory?: string[];
    callGoal?: string;
  };
  created_at: string;
}

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newLead, setNewLead] = useState({
    name: "",
    business: "",
    phone: "",
    notes: "",
    buyerContext: "",
    inventoryShortlist: "",
    callGoal: "",
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      toast.error("Failed to load leads");
      console.error(error);
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  }

  const stats = {
    ready: leads.filter((l) => l.status === "Ready").length,
    dialing: leads.filter((l) => l.status === "Dialing").length,
    done: leads.filter((l) => l.status === "Done").length,
    total: leads.length,
  };

  const handleAddLead = async () => {
    if (!newLead.name || !newLead.business || !newLead.phone) {
      toast.error("Please fill in name, business, and phone.");
      return;
    }

    const lead = {
      name: newLead.name,
      business: newLead.business,
      phone: newLead.phone,
      status: "Ready",
      notes: newLead.notes,
      prompt_context: {
        buyerContext: newLead.buyerContext || `Contact name: ${newLead.name}\nBusiness: ${newLead.business}`,
        inventoryShortlist: newLead.inventoryShortlist
          ? newLead.inventoryShortlist.split("\n").filter(Boolean)
          : [],
        fallbackInventory: [],
        callGoal: newLead.callGoal || "Introduce product range and gauge interest.",
      },
    };

    const { data, error } = await supabase.from("leads").insert(lead).select().single();
    if (error) {
      toast.error("Failed to add lead");
      console.error(error);
      return;
    }

    setLeads((prev) => [...prev, data]);
    setNewLead({ name: "", business: "", phone: "", notes: "", buyerContext: "", inventoryShortlist: "", callGoal: "" });
    setAddDialogOpen(false);
    toast.success("Lead added.");
  };

  const handleSave = async () => {
    for (const lead of leads) {
      await supabase.table("leads").upsert(lead);
    }
    setHasChanges(false);
    toast.success("Changes saved.");
  };

  const handleStartCalling = async () => {
    const readyLeads = leads.filter((l) => l.status === "Ready");
    if (readyLeads.length === 0) {
      toast.error("No leads ready to call.");
      return;
    }

    setIsRunning(true);

    for (const lead of readyLeads) {
      try {
        const res = await fetch("/api/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_id: lead.id,
            phone: lead.phone,
            name: lead.name,
            business: lead.business,
            prompt_context: lead.prompt_context,
          }),
        });

        if (res.ok) {
          toast.success(`Calling ${lead.name}...`);
          setLeads((prev) =>
            prev.map((l) => (l.id === lead.id ? { ...l, status: "Dialing" } : l))
          );
        } else {
          toast.error(`Failed to call ${lead.name}`);
        }
      } catch (e) {
        toast.error(`Error calling ${lead.name}`);
        console.error(e);
      }
    }
  };

  const handleDeleteLead = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete lead");
      return;
    }
    setLeads((prev) => prev.filter((l) => l.id !== id));
    toast.success("Lead removed.");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-40px)]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-foreground">Outbound Dialer</h1>
          {isRunning ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-status-done border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-status-done animate-pulse" />
              Running Calls…
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              Idle
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={fetchLeads}>
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-3 w-3" />
            Add Lead
          </Button>
          {isRunning ? (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => setIsRunning(false)}>
              <Pause className="h-3 w-3" />
              Pause
            </Button>
          ) : (
            <Button size="sm" className="h-7 text-xs gap-1.5" onClick={handleStartCalling}>
              <Play className="h-3 w-3" />
              Start Calling
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex gap-4 px-4 py-2 border-b border-border bg-card shrink-0">
          <StatChip label="Ready" value={stats.ready} />
          <StatChip label="Dialing" value={stats.dialing} color="text-blue-600" />
          <StatChip label="Done" value={stats.done} color="text-status-done" />
          <StatChip label="Total" value={stats.total} />
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No leads yet. Add one to get started.</div>
          ) : (
            <table className="table-dense" style={{ minWidth: "700px" }}>
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-muted-foreground">Name</th>
                  <th className="text-left font-medium text-muted-foreground">Business</th>
                  <th className="text-left font-medium text-muted-foreground">Phone</th>
                  <th className="text-left font-medium text-muted-foreground">Status</th>
                  <th className="text-left font-medium text-muted-foreground">Notes</th>
                  <th className="text-left font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                    <td className="font-medium text-foreground whitespace-nowrap">{lead.name}</td>
                    <td className="text-muted-foreground whitespace-nowrap">{lead.business}</td>
                    <td className="text-tabular text-muted-foreground whitespace-nowrap">{lead.phone}</td>
                    <td><StatusBadge status={lead.status} /></td>
                    <td className="text-muted-foreground max-w-[200px] truncate">{lead.notes}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[11px] text-destructive hover:text-destructive"
                        onClick={() => handleDeleteLead(lead.id)}
                      >
                        ✕
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Add New Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-[12px]">Name *</Label>
              <Input placeholder="e.g. Priya Patel" value={newLead.name} onChange={(e) => setNewLead((p) => ({ ...p, name: e.target.value }))} className="h-8 text-[13px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px]">Business *</Label>
              <Input placeholder="e.g. StepUp Kicks" value={newLead.business} onChange={(e) => setNewLead((p) => ({ ...p, business: e.target.value }))} className="h-8 text-[13px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px]">Phone *</Label>
              <Input placeholder="e.g. +44 7535 666 317" value={newLead.phone} onChange={(e) => setNewLead((p) => ({ ...p, phone: e.target.value }))} className="h-8 text-[13px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px]">Notes</Label>
              <Input placeholder="Optional notes..." value={newLead.notes} onChange={(e) => setNewLead((p) => ({ ...p, notes: e.target.value }))} className="h-8 text-[13px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px]">Buyer Context</Label>
              <Textarea placeholder="e.g. Amazon FBA seller, needs clean invoices, focuses on Adidas..." value={newLead.buyerContext} onChange={(e) => setNewLead((p) => ({ ...p, buyerContext: e.target.value }))} className="text-[13px] min-h-[60px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px]">Stock Shortlist (one per line)</Label>
              <Textarea placeholder={"e.g.\nAdidas Samba OG — 380 pairs, £42/pair\nConverse Chuck Taylor — 500 pairs, £32/pair"} value={newLead.inventoryShortlist} onChange={(e) => setNewLead((p) => ({ ...p, inventoryShortlist: e.target.value }))} className="text-[13px] min-h-[60px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-[12px]">Call Goal</Label>
              <Input placeholder="e.g. Pitch Samba OG, aim for 300+ pair commitment" value={newLead.callGoal} onChange={(e) => setNewLead((p) => ({ ...p, callGoal: e.target.value }))} className="h-8 text-[13px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)} className="h-7 text-xs">Cancel</Button>
            <Button size="sm" onClick={handleAddLead} className="h-7 text-xs">Add Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={`text-[13px] font-semibold ${color || "text-foreground"}`}>{value}</span>
    </div>
  );
}
