import { useState } from "react";
import { AlertTriangle, Baby, BedDouble, Camera, CalendarCheck, Check, ClipboardList, MessageSquare, Smile, Utensils, X, type LucideIcon } from "lucide-react";
import { children, facilities, logEntries, staff } from "../../data";
import { useAuth } from "../../auth";

type Props = { onNav: (page: string) => void };

const QUICK: { id: string; label: string; Icon: LucideIcon; bg: string; fg: string }[] = [
  { id: "meal", label: "Meal", Icon: Utensils, bg: "bg-[#dcfce7]", fg: "text-[#16a34a]" },
  { id: "nap", label: "Nap", Icon: BedDouble, bg: "bg-[#dbeafe]", fg: "text-[#1d4ed8]" },
  { id: "diaper", label: "Diaper", Icon: Baby, bg: "bg-[#f3f2ee]", fg: "text-[#6b6860]" },
  { id: "photo", label: "Photo", Icon: Camera, bg: "bg-[#fce7f3]", fg: "text-[#be185d]" },
  { id: "mood", label: "Mood", Icon: Smile, bg: "bg-[#fef3c7]", fg: "text-[#d97706]" },
  { id: "incident", label: "Incident", Icon: AlertTriangle, bg: "bg-[#fee2e2]", fg: "text-[#dc2626]" },
];

export default function MyRoom({ onNav }: Props) {
  const { user } = useAuth();
  const facility = facilities.find((f) => f.id === user?.facilityId) ?? facilities[0];
  const room = facility.rooms.find((r) => r.name === user?.room) ?? facility.rooms[0];
  const kids = children.filter((c) => c.facilityId === facility.id && c.room === room.name);
  const present = kids.filter((c) => c.checkedIn);
  const roomStaff = staff.filter((s) => s.facilityId === facility.id && s.room === room.name);
  const recent = logEntries.filter((l) => l.facilityId === facility.id && l.room === room.name).sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 5);
  const ratio = roomStaff.length ? present.length / roomStaff.length : 0;
  const over = ratio > room.ratioLimit;
  const [quick, setQuick] = useState<{ type: string; selected: string[] } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const firstName = user?.name.split(" ")[0];

  const submitQuick = () => {
    if (!quick) return;
    setToast(`${QUICK.find((q) => q.id === quick.type)?.label} logged for ${quick.selected.length} ${quick.selected.length === 1 ? "child" : "children"}`);
    setQuick(null);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-5">
        <p className="text-sm text-[#6b6860]">Hi {firstName} 👋</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1e2d4e]">{room.name}</h1>
        <p className="text-[#6b6860] mt-0.5">{facility.name} · Monday, Aug 31</p>
      </div>

      {/* Ratio + presence */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white border border-[#e2dfd8] rounded-2xl p-4 col-span-2 sm:col-span-1">
          <p className="text-xs font-mono uppercase tracking-widest text-[#6b6860]">Live ratio</p>
          <p className={`text-3xl font-bold mt-1 ${over ? "text-[#dc2626]" : "text-[#16a34a]"}`}>1:{ratio.toFixed(1)}</p>
          <p className="text-xs text-[#6b6860] mt-1">FL max 1:{room.ratioLimit} · {roomStaff.length} staff on</p>
        </div>
        <div className="bg-white border border-[#e2dfd8] rounded-2xl p-4">
          <p className="text-xs font-mono uppercase tracking-widest text-[#6b6860]">Present</p>
          <p className="text-3xl font-bold text-[#1e2d4e] mt-1">{present.length}</p>
          <p className="text-xs text-[#6b6860] mt-1">of {kids.length} enrolled</p>
        </div>
        <div className="bg-white border border-[#e2dfd8] rounded-2xl p-4 hidden sm:block">
          <p className="text-xs font-mono uppercase tracking-widest text-[#6b6860]">Flags</p>
          <p className="text-3xl font-bold text-[#d97706] mt-1">{kids.filter((k) => k.immunizationStatus !== "current").length}</p>
          <p className="text-xs text-[#6b6860] mt-1">DH 680 issues</p>
        </div>
      </div>

      {/* Quick log — the thing teachers do 50× a day */}
      <section aria-labelledby="quick-h" className="mb-6">
        <h2 id="quick-h" className="font-semibold text-[#1e2d4e] mb-3">Quick log</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {QUICK.map((q) => (
            <button key={q.id} onClick={() => setQuick({ type: q.id, selected: [] })} className={`rounded-2xl p-3 sm:p-4 flex flex-col items-center gap-2 min-h-20 ${q.bg} ${q.fg} hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0f7173] transition`}>
              <q.Icon size={26} aria-hidden />
              <span className="text-sm font-semibold">{q.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Kids */}
      <section aria-labelledby="kids-h" className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 id="kids-h" className="font-semibold text-[#1e2d4e]">My kids today</h2>
          <button onClick={() => onNav("checkin")} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0f7173] min-h-10 px-2 rounded-lg hover:bg-[#e8f4f4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173]"><CalendarCheck size={16} aria-hidden /> Check-in board</button>
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {kids.map((k) => (
            <li key={k.id} className={`bg-white border rounded-2xl p-3.5 flex items-center gap-3 ${k.checkedIn ? "border-[#0f7173]/40" : "border-[#e2dfd8] opacity-70"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${k.checkedIn ? "bg-[#e8f4f4] text-[#0f7173]" : "bg-[#f3f2ee] text-[#6b6860]"}`}>{k.name.split(" ").map((n) => n[0]).join("")}</div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-[#1e2d4e] truncate">{k.name}</p>
                <p className="text-xs text-[#6b6860]">{k.checkedIn ? "Present" : "Not in yet"}{k.immunizationStatus === "missing" ? " · DH 680 ⚠" : ""}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Recent + shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section aria-labelledby="recent-h" className="bg-white border border-[#e2dfd8] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e2dfd8] flex items-center justify-between">
            <h2 id="recent-h" className="font-semibold text-[#1e2d4e]">Recent in this room</h2>
            <button onClick={() => onNav("logs")} className="text-xs font-medium text-[#0f7173] min-h-9 px-2 rounded hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173]">All logs →</button>
          </div>
          <ul className="divide-y divide-[#e2dfd8]">
            {recent.map((r) => (
              <li key={r.id} className="px-4 py-3 flex gap-3 text-sm">
                <span className="font-mono text-xs text-[#6b6860] w-11 flex-shrink-0 pt-0.5">{r.timestamp}</span>
                <span className="min-w-0"><span className="font-medium text-[#1e2d4e]">{r.childName.split(" ")[0]}</span> <span className="text-[#6b6860]">· {r.detail}</span></span>
              </li>
            ))}
          </ul>
        </section>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => onNav("messaging")} className="bg-[#1e2d4e] text-white rounded-2xl p-4 flex flex-col items-start gap-2 min-h-24 hover:bg-[#2a3f6b] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0f7173]">
            <MessageSquare size={24} aria-hidden /><span className="font-semibold">Message families</span><span className="text-xs text-white/60">2 unread</span>
          </button>
          <button onClick={() => onNav("logs")} className="bg-white border border-[#e2dfd8] text-[#1e2d4e] rounded-2xl p-4 flex flex-col items-start gap-2 min-h-24 hover:border-[#0f7173] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173]">
            <ClipboardList size={24} className="text-[#0f7173]" aria-hidden /><span className="font-semibold">Daily logs</span><span className="text-xs text-[#6b6860]">Reports go out at 5pm</span>
          </button>
        </div>
      </div>

      {/* Quick-log sheet */}
      {quick && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setQuick(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="ql-title" className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg p-5 sm:p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 id="ql-title" className="text-lg font-bold text-[#1e2d4e]">Log {QUICK.find((q) => q.id === quick.type)?.label.toLowerCase()}</h2>
              <button onClick={() => setQuick(null)} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-lg text-[#6b6860] hover:text-[#1e2d4e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173]"><X size={20} aria-hidden /></button>
            </div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-mono uppercase tracking-widest text-[#6b6860]">Who?</p>
              <button onClick={() => setQuick((q) => q && ({ ...q, selected: q.selected.length === present.length ? [] : present.map((p) => p.id) }))} className="text-xs font-medium text-[#0f7173] min-h-9 px-2 rounded hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173]">
                {quick.selected.length === present.length ? "Clear all" : "Everyone present"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {present.map((k) => {
                const on = quick.selected.includes(k.id);
                return (
                  <button key={k.id} role="checkbox" aria-checked={on} onClick={() => setQuick((q) => q && ({ ...q, selected: on ? q.selected.filter((x) => x !== k.id) : [...q.selected, k.id] }))} className={`border-2 rounded-xl px-3 py-3 min-h-14 flex items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173] ${on ? "border-[#0f7173] bg-[#e8f4f4]" : "border-[#e2dfd8]"}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${on ? "bg-[#0f7173] text-white" : "bg-[#f3f2ee]"}`}>{on && <Check size={14} aria-hidden />}</span>
                    <span className="text-sm font-medium text-[#1e2d4e] truncate">{k.name}</span>
                  </button>
                );
              })}
            </div>
            {quick.type === "meal" && <Chips label="What" options={["Bottle 4 oz", "Bottle 6 oz", "Breakfast", "Lunch", "Snack"]} />}
            {quick.type === "nap" && <Chips label="Nap" options={["Started", "Woke up"]} />}
            {quick.type === "diaper" && <Chips label="Type" options={["Wet", "BM", "Dry", "Cream applied"]} />}
            {quick.type === "mood" && <Chips label="Mood" options={["Happy", "Calm", "Fussy", "Tired", "Playful"]} />}
            {quick.type === "incident" && (
              <div className="bg-[#fef3c7] border border-[#fcd34d] rounded-xl p-3 text-xs text-[#92400e] mb-4">Incidents open the full Florida incident form (required fields, guardian notification, signatures). Select one child.</div>
            )}
            <label htmlFor="ql-note" className="text-xs font-mono uppercase tracking-widest text-[#6b6860] block mb-1.5">Note (optional)</label>
            <textarea id="ql-note" rows={2} placeholder="Anything to add…" className="w-full border border-[#e2dfd8] rounded-xl px-3 py-2 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173] resize-none mb-4" />
            <button onClick={submitQuick} disabled={quick.selected.length === 0} className="w-full min-h-12 rounded-xl bg-[#1e2d4e] text-white font-semibold hover:bg-[#2a3f6b] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0f7173]">
              Save {quick.selected.length > 0 ? `for ${quick.selected.length}` : ""}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1e2d4e] text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50">
          <Check size={16} className="text-[#4ade80]" aria-hidden /> {toast}
        </div>
      )}
    </div>
  );
}

function Chips({ label, options }: { label: string; options: string[] }) {
  const [v, setV] = useState(options[0]);
  return (
    <div className="mb-4">
      <p className="text-xs font-mono uppercase tracking-widest text-[#6b6860] mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={o} role="radio" aria-checked={v === o} onClick={() => setV(o)} className={`px-3.5 py-2 rounded-full text-sm font-medium min-h-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173] ${v === o ? "bg-[#1e2d4e] text-white" : "bg-[#f3f2ee] text-[#1e2d4e] hover:bg-[#e2dfd8]"}`}>{o}</button>
        ))}
      </div>
    </div>
  );
}
