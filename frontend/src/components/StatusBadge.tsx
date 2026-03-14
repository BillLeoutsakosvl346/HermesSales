import { cn } from "@/lib/utils";
import type { LeadStatus, CallStatus, ResultType } from "@/data/mockData";

const statusStyles: Record<string, string> = {
  "Ready": "bg-blue-50 text-status-ready border-blue-200",
  "Dialing": "bg-amber-50 text-status-dialing border-amber-200",
  "Paused": "bg-slate-50 text-status-paused border-slate-200",
  "Done": "bg-green-50 text-status-done border-green-200",
  "Do Not Call": "bg-red-50 text-status-dnc border-red-200",
  "Ringing": "bg-purple-50 text-status-ringing border-purple-200",
  "Voicemail": "bg-orange-50 text-status-voicemail border-orange-200",
  "Live Call": "bg-green-50 text-status-live border-green-200",
  "Completed": "bg-slate-50 text-status-completed border-slate-200",
  "Failed": "bg-red-50 text-status-failed border-red-200",
  // Result types
  "No Answer": "bg-slate-50 text-status-paused border-slate-200",
  "Voicemail Left": "bg-orange-50 text-status-voicemail border-orange-200",
  "Interested": "bg-green-50 text-status-done border-green-200",
  "Send List": "bg-blue-50 text-status-ready border-blue-200",
  "Callback Requested": "bg-amber-50 text-status-dialing border-amber-200",
  "Meeting Requested": "bg-purple-50 text-status-ringing border-purple-200",
  "Not Interested": "bg-slate-50 text-status-paused border-slate-200",
  "Wrong Person": "bg-red-50 text-status-dnc border-red-200",
};

export function StatusBadge({ status, className }: { status: LeadStatus | CallStatus | ResultType | string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border whitespace-nowrap",
        statusStyles[status] || "bg-muted text-muted-foreground border-border",
        className
      )}
    >
      {status}
    </span>
  );
}
