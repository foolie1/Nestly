import { useState } from "react";
import { AlertTriangle, Baby, BedDouble, Camera, CalendarCheck, Check, ClipboardList, MessageSquare, Smile, Utensils, X, type LucideIcon } from "lucide-react";
import { facilities, staff } from "../../data";
import { useRoster } from "../../roster";
import { useLogs, type LogType } from "../../logs";
import { useAuth } from "../../auth";

type Props = { onNav: (page: string) => void };

const QUICK: { id: string; label: string; Icon: LucideIcon; bg: string; fg: string }[] = [
  { id: "meal", label: "Meal", Icon: Utensils, bg: "bg-success-soft", fg: "text-success" },
  { id: "nap", label: "Nap", Icon: BedDouble, bg: "bg-info-soft", fg: "text-info" },
  { id: "diaper", label: "Diaper", Icon: Baby, bg: "bg-surface-2", fg: "text-muted" },
  { id: "photo", label: "Photo", Icon: Camera, bg: "bg-pink-soft", fg: "text-pink" },
  { id: "mood", label: "Mood", Icon: Smile, bg: "bg-warning-soft", fg: "text-warning" },
  { id: "incident", label: "Incident", Icon: AlertTriangle, bg: "bg-danger-soft", fg: "text-danger" },
];

export default function MyRoom({ onNav }: Props) {
  const { user } = useAuth();
  const { roster } = useRoster();
  const facility = facilities.find((f) => f.id === user?.facilityId) ?? facilities[0];
  const room = facility.rooms.find((r) => r.name === user?.room) ?? facility.rooms[0];
  const kids = roster.filter((c) => c.facilityId === facility.id && c.room === room.name);
  const present = kids.filter((c) => c.checkedIn);
  const roomStaff = staff.filter((s) => s.facilityId === facility.id && s.room === room.name);
  const { entries, addEntries } = useLogs();
  const recent = entries.filter((l) => l.facilityId === facility.id && l.room === room.name).sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 5);
  const [quick, setQuick] = useState<{ type: string; selected: string[] } | null>(null);
  const [chip, setChip] = useState("");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const firstName = user?.name.split(" ")[0];

  const submitQuick = () => {
    if (!quick) return;
    const label = QUICK.find((q) => q.id === quick.type)?.label ?? "Entry";
    const detail = [chip, note.trim()].filter(Boolean).join(" — ") || label;
    // "photo" and "mood" aren't log types in the data model; they file as notes.
    const type: LogType = (["meal", "nap", "diaper", "bathroom", "incident"] as const).includes(quick.type as never)
      ? (quick.type as LogType)
      : "note";
    const n = addEntries({ childIds: quick.selected, type, detail });
    setToast(`${label} logged for ${n} ${n === 1 ? "child" : "children"}`);
    setQuick(null);
    setChip("");
    setNote("");
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-5">
        <p className="text-sm text-muted">Hi {firstName} 👋</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand">{room.name}</h1>
        <p className="text-muted mt-0.5">{facility.name} · Monday, Aug 31</p>
      </div>

      {/* Today at a glance */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-surface border border-line rounded-[calc(var(--t-radius)+0.25rem)] p-4">
          <p className="text-xs font-mono uppercase tracking-widest text-muted">Present</p>
          <p className="text-3xl font-bold text-brand mt-1">{present.length}</p>
          <p className="text-xs text-muted mt-1">of {kids.length} enrolled · {roomStaff.length} staff on</p>
        </div>
        <div className="bg-surface border border-line rounded-[calc(var(--t-radius)+0.25rem)] p-4">
          <p className="text-xs font-mono uppercase tracking-widest text-muted">Flags</p>
          <p className="text-3xl font-bold text-warning mt-1">{kids.filter((k) => k.immunizationStatus !== "current").length}</p>
          <p className="text-xs text-muted mt-1">Immunization records</p>
        </div>
      </div>

      {/* Quick log — the thing teachers do 50× a day */}
      <section aria-labelledby="quick-h" className="mb-6">
        <h2 id="quick-h" className="font-semibold text-brand mb-3">Quick log</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {QUICK.map((q) => (
            <button key={q.id} onClick={() => { setQuick({ type: q.id, selected: [] }); setChip(""); setNote(""); }} className={`rounded-[calc(var(--t-radius)+0.25rem)] p-3 sm:p-4 flex flex-col items-center gap-2 min-h-20 ${q.bg} ${q.fg} hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent transition`}>
              <q.Icon size={26} aria-hidden />
              <span className="text-sm font-semibold">{q.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Kids */}
      <section aria-labelledby="kids-h" className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 id="kids-h" className="font-semibold text-brand">My kids today</h2>
          <button onClick={() => onNav("checkin")} className="inline-flex items-center gap-1.5 text-sm font-medium text-accent min-h-10 px-2 rounded-ctl hover:bg-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><CalendarCheck size={16} aria-hidden /> Check-in board</button>
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {kids.map((k) => (
            <li key={k.id} className={`bg-surface border rounded-[calc(var(--t-radius)+0.25rem)] p-3.5 flex items-center gap-3 ${k.checkedIn ? "border-accent/40" : "border-line opacity-70"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${k.checkedIn ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted"}`}>{k.name.split(" ").map((n) => n[0]).join("")}</div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-brand truncate">{k.name}</p>
                <p className="text-xs text-muted">{k.checkedIn ? "Present" : "Not in yet"}{k.immunizationStatus === "missing" ? " · immunization ⚠" : ""}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Recent + shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section aria-labelledby="recent-h" className="bg-surface border border-line rounded-[calc(var(--t-radius)+0.25rem)] overflow-hidden">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between">
            <h2 id="recent-h" className="font-semibold text-brand">Recent in this room</h2>
            <button onClick={() => onNav("logs")} className="text-xs font-medium text-accent min-h-9 px-2 rounded hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">All logs →</button>
          </div>
          <ul className="divide-y divide-line">
            {recent.map((r) => (
              <li key={r.id} className="px-4 py-3 flex gap-3 text-sm">
                <span className="font-mono text-xs text-muted w-11 flex-shrink-0 pt-0.5">{r.timestamp}</span>
                <span className="min-w-0"><span className="font-medium text-brand">{r.childName.split(" ")[0]}</span> <span className="text-muted">· {r.detail}</span></span>
              </li>
            ))}
          </ul>
        </section>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => onNav("messaging")} className="bg-brand text-white rounded-[calc(var(--t-radius)+0.25rem)] p-4 flex flex-col items-start gap-2 min-h-24 hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent">
            <MessageSquare size={24} aria-hidden /><span className="font-semibold">Message families</span><span className="text-xs text-white/60">2 unread</span>
          </button>
          <button onClick={() => onNav("logs")} className="bg-surface border border-line text-brand rounded-[calc(var(--t-radius)+0.25rem)] p-4 flex flex-col items-start gap-2 min-h-24 hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <ClipboardList size={24} className="text-accent" aria-hidden /><span className="font-semibold">Daily logs</span><span className="text-xs text-muted">Reports go out at 5pm</span>
          </button>
        </div>
      </div>

      {/* Quick-log sheet */}
      {quick && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setQuick(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="ql-title" className="bg-surface rounded-t-[calc(var(--t-radius)+0.5rem)] sm:rounded-[calc(var(--t-radius)+0.25rem)] shadow-2xl w-full sm:max-w-lg p-5 sm:p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 id="ql-title" className="text-lg font-bold text-brand">Log {QUICK.find((q) => q.id === quick.type)?.label.toLowerCase()}</h2>
              <button onClick={() => setQuick(null)} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><X size={20} aria-hidden /></button>
            </div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-mono uppercase tracking-widest text-muted">Who?</p>
              <button onClick={() => setQuick((q) => q && ({ ...q, selected: q.selected.length === present.length ? [] : present.map((p) => p.id) }))} className="text-xs font-medium text-accent min-h-9 px-2 rounded hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                {quick.selected.length === present.length ? "Clear all" : "Everyone present"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {present.map((k) => {
                const on = quick.selected.includes(k.id);
                return (
                  <button key={k.id} role="checkbox" aria-checked={on} onClick={() => setQuick((q) => q && ({ ...q, selected: on ? q.selected.filter((x) => x !== k.id) : [...q.selected, k.id] }))} className={`border-2 rounded-card px-3 py-3 min-h-14 flex items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${on ? "border-accent bg-accent-soft" : "border-line"}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${on ? "bg-accent text-white" : "bg-surface-2"}`}>{on && <Check size={14} aria-hidden />}</span>
                    <span className="text-sm font-medium text-brand truncate">{k.name}</span>
                  </button>
                );
              })}
            </div>
            {quick.type === "meal" && <Chips label="What" options={["Bottle 4 oz", "Bottle 6 oz", "Breakfast", "Lunch", "Snack"]} value={chip} onChange={setChip} />}
            {quick.type === "nap" && <Chips label="Nap" options={["Started", "Woke up"]} value={chip} onChange={setChip} />}
            {quick.type === "diaper" && <Chips label="Type" options={["Wet", "BM", "Dry", "Cream applied"]} value={chip} onChange={setChip} />}
            {quick.type === "mood" && <Chips label="Mood" options={["Happy", "Calm", "Fussy", "Tired", "Playful"]} value={chip} onChange={setChip} />}
            {quick.type === "photo" && <Chips label="Moment" options={["Playtime", "Art", "Outdoors", "Mealtime", "Nap"]} value={chip} onChange={setChip} />}
            {quick.type === "incident" && (
              <div className="bg-warning-soft border border-warning-line rounded-card p-3 text-xs text-warning-strong mb-4">Incidents open the full incident form — required fields, guardian notification and signatures. Select one child.</div>
            )}
            <label htmlFor="ql-note" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Note (optional)</label>
            <textarea id="ql-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything to add…" className="w-full border border-line rounded-card px-3 py-2 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none mb-4" />
            <button onClick={submitQuick} disabled={quick.selected.length === 0} className="w-full min-h-12 rounded-card bg-brand text-white font-semibold hover:bg-brand-hover disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent">
              Save {quick.selected.length > 0 ? `for ${quick.selected.length}` : ""}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand text-white text-sm font-medium px-4 py-3 rounded-card shadow-lg flex items-center gap-2 z-50">
          <Check size={16} className="text-success" aria-hidden /> {toast}
        </div>
      )}
    </div>
  );
}

function Chips({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  const v = value || options[0];
  const setV = onChange;
  return (
    <div className="mb-4">
      <p className="text-xs font-mono uppercase tracking-widest text-muted mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={o} role="radio" aria-checked={v === o} onClick={() => setV(o)} className={`px-3.5 py-2 rounded-full text-sm font-medium min-h-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${v === o ? "bg-brand text-white" : "bg-surface-2 text-brand hover:bg-line"}`}>{o}</button>
        ))}
      </div>
    </div>
  );
}
