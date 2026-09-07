import { useState } from "react";
import { logEntries, children } from "../data";

type Props = { facilityId: string; roomFilter?: string };

const typeConfig = {
  meal: { label: "Meal", bg: "bg-success-soft", text: "text-success", icon: "🍼" },
  nap: { label: "Nap", bg: "bg-info-soft", text: "text-info", icon: "😴" },
  diaper: { label: "Diaper", bg: "bg-surface-2", text: "text-muted", icon: "🧷" },
  bathroom: { label: "Bathroom", bg: "bg-purple-soft", text: "text-purple", icon: "🚽" },
  note: { label: "Note", bg: "bg-warning-soft", text: "text-warning", icon: "📝" },
  incident: { label: "Incident", bg: "bg-danger-soft", text: "text-danger", icon: "⚠" },
};

export default function DailyLogs({ facilityId, roomFilter }: Props) {
  const [selectedChild, setSelectedChild] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newLog, setNewLog] = useState({ type: "meal", detail: "", child: "" });

  const facilityChildren = children.filter((c) => c.facilityId === facilityId && c.checkedIn && (!roomFilter || c.room === roomFilter));
  const entries = logEntries
    .filter((e) => e.facilityId === facilityId && (!roomFilter || e.room === roomFilter))
    .filter((e) => selectedChild === "all" || e.childId === selectedChild)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-sm font-mono text-muted uppercase tracking-widest mb-1">Daily Activity Log</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand">Today's Log</h1>
          <p className="text-muted mt-1">Monday, August 31, 2026 · {entries.length} entries</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-brand text-white text-sm font-medium px-4 py-2.5 min-h-11 rounded-ctl hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent transition-colors">
          + Log Entry
        </button>
      </div>

      {/* Child Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setSelectedChild("all")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedChild === "all" ? "bg-brand text-white" : "bg-white border border-line text-muted hover:border-brand"}`}
        >
          All Children
        </button>
        {facilityChildren.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedChild(c.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedChild === c.id ? "bg-accent text-white" : "bg-white border border-line text-muted hover:border-accent"}`}
          >
            {c.name.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Summary badges */}
      <div className="flex gap-3 mb-6">
        {(Object.keys(typeConfig) as (keyof typeof typeConfig)[]).map((type) => {
          const count = entries.filter((e) => e.type === type).length;
          const cfg = typeConfig[type];
          return (
            <div key={type} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
              <span>{cfg.icon}</span>
              <span>{cfg.label}</span>
              <span className="font-mono font-bold">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {entries.map((entry) => {
          const cfg = typeConfig[entry.type];
          return (
            <div key={entry.id} className="bg-white border border-line rounded-card p-4 flex gap-4 hover:border-accent/40 transition-colors">
              <div className="flex flex-col items-center pt-1">
                <span className="font-mono text-sm font-semibold text-brand w-12 text-right">{entry.timestamp}</span>
              </div>
              <div className={`w-0.5 self-stretch ${cfg.bg} rounded`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                  <span className="font-semibold text-sm text-brand">{entry.childName}</span>
                  <span className="text-xs text-muted">· {entry.room}</span>
                </div>
                <p className="text-sm text-ink">{entry.detail}</p>
                <p className="text-xs text-muted mt-1">Logged by {entry.loggedBy}</p>
              </div>
            </div>
          );
        })}
        {entries.length === 0 && (
          <div className="border-2 border-dashed border-line rounded-card p-10 text-center text-muted">
            <p className="text-sm">No log entries yet for today.</p>
          </div>
        )}
      </div>

      {/* Add Log Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-t-[calc(var(--t-radius)+0.5rem)] sm:rounded-[calc(var(--t-radius)+0.25rem)] shadow-2xl w-full sm:max-w-md p-5 sm:p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-brand mb-5">Log New Entry</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Child</label>
                <select
                  value={newLog.child}
                  onChange={(e) => setNewLog((l) => ({ ...l, child: e.target.value }))}
                  className="w-full border border-line rounded-ctl px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:border-accent"
                >
                  <option value="">Select child...</option>
                  {facilityChildren.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Type</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(typeConfig) as (keyof typeof typeConfig)[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setNewLog((l) => ({ ...l, type: t }))}
                      className={`px-3 py-1.5 rounded-ctl text-xs font-medium transition-colors ${newLog.type === t ? `${typeConfig[t].bg} ${typeConfig[t].text}` : "bg-surface-2 text-muted hover:bg-line"}`}
                    >
                      {typeConfig[t].icon} {typeConfig[t].label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Detail</label>
                <textarea
                  value={newLog.detail}
                  onChange={(e) => setNewLog((l) => ({ ...l, detail: e.target.value }))}
                  rows={3}
                  placeholder="Describe the activity..."
                  className="w-full border border-line rounded-ctl px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:border-accent resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-line rounded-ctl text-sm text-muted hover:border-brand transition-colors">Cancel</button>
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 bg-brand text-white rounded-ctl text-sm font-medium hover:bg-brand-hover transition-colors">Save Entry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
