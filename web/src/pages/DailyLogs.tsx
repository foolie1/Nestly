import { useState } from "react";
import { X } from "lucide-react";
import { useRoster } from "../roster";
import { LOG_META, LOG_TYPES, useLogs, type LogType } from "../logs";

type Props = { facilityId: string; roomFilter?: string };

export default function DailyLogs({ facilityId, roomFilter }: Props) {
  const { entries: allEntries, addEntries } = useLogs();
  const { roster: children } = useRoster();
  const [selectedChild, setSelectedChild] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<LogType | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newLog, setNewLog] = useState<{ type: LogType; detail: string; child: string }>({ type: "meal", detail: "", child: "" });
  const [toast, setToast] = useState<string | null>(null);

  const facilityChildren = children.filter((c) => c.facilityId === facilityId && c.checkedIn && (!roomFilter || c.room === roomFilter));

  // Everything for this facility/room — counts come from here so they don't
  // change when a type filter is applied.
  const scoped = allEntries
    .filter((e) => e.facilityId === facilityId && (!roomFilter || e.room === roomFilter))
    .filter((e) => selectedChild === "all" || e.childId === selectedChild);

  const entries = [...scoped]
    .filter((e) => !typeFilter || e.type === typeFilter)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const saveEntry = () => {
    const n = addEntries({ childIds: [newLog.child], type: newLog.type, detail: newLog.detail });
    if (!n) return;
    setShowAdd(false);
    setToast(`${LOG_META[newLog.type].label} logged`);
    setNewLog({ type: "meal", detail: "", child: "" });
    setTypeFilter(null);
    setTimeout(() => setToast(null), 2500);
  };

  const canSave = !!newLog.child && newLog.detail.trim().length > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-sm font-mono text-muted uppercase tracking-widest mb-1">Daily Activity Log</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand">Today's Log</h1>
          <p className="text-muted mt-1">
            Monday, August 31, 2026 · {entries.length} {entries.length === 1 ? "entry" : "entries"}
            {typeFilter ? ` · ${LOG_META[typeFilter].label} only` : ""}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-brand text-white text-sm font-semibold px-4 py-2.5 min-h-11 rounded-full hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent transition-colors">
          + Log Entry
        </button>
      </div>

      {/* Child filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setSelectedChild("all")}
          aria-pressed={selectedChild === "all"}
          className={`px-3 py-2 min-h-10 rounded-full text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${selectedChild === "all" ? "bg-brand text-white" : "bg-surface border border-line text-muted hover:border-brand"}`}
        >
          All Children
        </button>
        {facilityChildren.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedChild(c.id)}
            aria-pressed={selectedChild === c.id}
            className={`px-3 py-2 min-h-10 rounded-full text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${selectedChild === c.id ? "bg-accent text-white" : "bg-surface border border-line text-muted hover:border-accent"}`}
          >
            {c.name.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Type filters — tap to show only that kind */}
      <div className="flex gap-2 mb-5 flex-wrap items-center">
        {LOG_TYPES.map(({ id, label, icon, bg, fg }) => {
          const count = scoped.filter((e) => e.type === id).length;
          const active = typeFilter === id;
          return (
            <button
              key={id}
              onClick={() => setTypeFilter(active ? null : id)}
              aria-pressed={active}
              className={`flex items-center gap-1.5 px-3 py-2 min-h-10 rounded-full text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-accent ${bg} ${fg} ${active ? "ring-2 ring-offset-1 ring-current shadow-sm" : "opacity-90 hover:opacity-100"} ${count === 0 && !active ? "opacity-45" : ""}`}
            >
              <span aria-hidden>{icon}</span>
              <span>{label}</span>
              <span className="font-mono font-bold">{count}</span>
            </button>
          );
        })}
        {typeFilter && (
          <button onClick={() => setTypeFilter(null)} className="text-xs font-medium text-accent min-h-10 px-2 rounded-ctl hover:bg-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            Show all types
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {entries.map((entry) => {
          const cfg = LOG_META[entry.type];
          return (
            <div key={entry.id} className="bg-surface border border-line rounded-card p-4 flex gap-4 hover:border-accent/40 transition-colors">
              <div className="flex flex-col items-center pt-1">
                <span className="font-mono text-sm font-semibold text-brand w-12 text-right">{entry.timestamp}</span>
              </div>
              <div className={`w-0.5 self-stretch ${cfg.bg} rounded`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.fg}`}>
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
            <p className="text-sm">{typeFilter ? `No ${LOG_META[typeFilter].label.toLowerCase()} entries yet.` : "No log entries yet for today."}</p>
          </div>
        )}
      </div>

      {/* Add Log Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowAdd(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="log-title" className="bg-surface rounded-t-[calc(var(--t-radius)+0.5rem)] sm:rounded-[calc(var(--t-radius)+0.25rem)] shadow-2xl w-full sm:max-w-md p-5 sm:p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <h2 id="log-title" className="text-lg font-bold text-brand">Log New Entry</h2>
              <button onClick={() => setShowAdd(false)} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><X size={20} aria-hidden /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="log-child" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Child</label>
                <select
                  id="log-child"
                  value={newLog.child}
                  onChange={(e) => setNewLog((l) => ({ ...l, child: e.target.value }))}
                  className="w-full min-h-11 border border-line rounded-ctl px-3 text-base bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <option value="">Select child…</option>
                  {facilityChildren.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Type</p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Entry type">
                  {LOG_TYPES.map(({ id, label, icon, bg, fg }) => {
                    const active = newLog.type === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setNewLog((l) => ({ ...l, type: id }))}
                        className={`px-3 py-2 min-h-10 rounded-full text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${active ? `${bg} ${fg} ring-2 ring-current ring-offset-1` : "bg-surface-2 text-muted hover:bg-line"}`}
                      >
                        <span aria-hidden>{icon}</span> {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="log-detail" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Detail</label>
                <textarea
                  id="log-detail"
                  value={newLog.detail}
                  onChange={(e) => setNewLog((l) => ({ ...l, detail: e.target.value }))}
                  rows={3}
                  placeholder="Describe the activity…"
                  className="w-full border border-line rounded-ctl px-3.5 py-2.5 text-base bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 min-h-12 rounded-ctl border border-line text-muted hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors">Cancel</button>
              <button onClick={saveEntry} disabled={!canSave} className="flex-1 min-h-12 rounded-ctl bg-brand text-white font-semibold hover:bg-brand-hover disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent transition-colors">Save Entry</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand text-white text-sm font-medium px-4 py-3 rounded-card shadow-lg z-50">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
