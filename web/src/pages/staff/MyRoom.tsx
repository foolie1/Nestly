import { useEffect, useState } from "react";
import { AlertTriangle, Baby, BedDouble, Camera, CalendarCheck, Check, ClipboardList, MessageSquare, Pill, Smile, Utensils, Video, X, type LucideIcon } from "lucide-react";
import { facilities, staff, type Child, type VideoClip } from "../../data";
import { useRoster } from "../../roster";
import { useLogs, type LogType } from "../../logs";
import { useAuth } from "../../auth";
import { PhotoPicker, VideoPicker } from "../../media";
import { AllergyBadges, AllergyWarning, foodAllergies } from "../../components/allergy";
import IncidentForm from "../IncidentForm";

type Props = { onNav: (page: string) => void };

/** The quick-log buttons, in the order a teacher reaches for them. */
const QUICK: { id: LogType; label: string; Icon: LucideIcon; bg: string; fg: string; video?: boolean }[] = [
  { id: "meal", label: "Meal", Icon: Utensils, bg: "bg-success-soft", fg: "text-success" },
  { id: "nap", label: "Nap", Icon: BedDouble, bg: "bg-info-soft", fg: "text-info" },
  { id: "diaper", label: "Diaper", Icon: Baby, bg: "bg-slate-soft", fg: "text-slate" },
  { id: "photo", label: "Photo", Icon: Camera, bg: "bg-pink-soft", fg: "text-pink" },
  { id: "photo", label: "Video", Icon: Video, bg: "bg-pink-soft", fg: "text-pink", video: true },
  { id: "mood", label: "Mood", Icon: Smile, bg: "bg-warning-soft", fg: "text-warning" },
  { id: "medication", label: "Meds", Icon: Pill, bg: "bg-info-soft", fg: "text-info" },
  { id: "incident", label: "Incident", Icon: AlertTriangle, bg: "bg-danger-soft", fg: "text-danger" },
];

const CHIPS: Partial<Record<LogType, { label: string; options: string[] }>> = {
  meal: { label: "What", options: ["Bottle 4 oz", "Bottle 6 oz", "Breakfast", "Lunch", "Snack"] },
  nap: { label: "Nap", options: ["Started", "Woke up"] },
  diaper: { label: "Type", options: ["Wet", "BM", "Dry", "Cream applied"] },
  mood: { label: "Mood", options: ["Happy", "Calm", "Fussy", "Tired", "Playful"] },
  photo: { label: "Moment", options: ["Playtime", "Art", "Outdoors", "Mealtime", "Nap"] },
};

/** Medication is one child at a time — you don't batch a dose. */
const SINGLE_CHILD: LogType[] = ["medication"];

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

  const [quick, setQuick] = useState<{ type: LogType; selected: string[]; video?: boolean } | null>(null);
  const [chip, setChip] = useState("");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<VideoClip[]>([]);
  const [showIncident, setShowIncident] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const firstName = user?.name.split(" ")[0];

  const flash = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2800);
  };

  // A modal that ignores Escape traps keyboard users.
  useEffect(() => {
    if (!quick) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setQuick(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [quick]);

  const openQuick = (type: LogType, video = false) => {
    if (type === "incident") {
      setShowIncident(true);
      return;
    }
    setQuick({ type, selected: [], video });
    setChip("");
    setNote("");
    setPhotos([]);
    setVideos([]);
  };

  const selectedKids = quick ? present.filter((k) => quick.selected.includes(k.id)) : [];
  // Only the children actually selected matter — warning about a peanut allergy
  // for a child who isn't being fed is how people learn to ignore warnings.
  const mealRisk = quick?.type === "meal" ? selectedKids.filter((k) => foodAllergies(k).length > 0) : [];

  const submitQuick = () => {
    if (!quick) return;
    const label = quick.video ? "Video" : QUICK.find((q) => q.id === quick.type)?.label ?? "Entry";
    const detail = [chip, note.trim()].filter(Boolean).join(" — ");
    const n = addEntries({
      childIds: quick.selected,
      type: quick.type,
      title: chip || label,
      detail: detail || label,
      media: photos,
      videos,
    });
    if (!n) return;
    flash(`${label} logged for ${n} ${n === 1 ? "child" : "children"}`);
    setQuick(null);
    setChip("");
    setNote("");
    setPhotos([]);
    setVideos([]);
  };

  const canSave = (() => {
    if (!quick) return false;
    if (quick.selected.length === 0) return false;
    // A photo entry stands on the picture; everything else needs some text.
    if (quick.type === "photo") return photos.length > 0 || videos.length > 0 || !!chip || note.trim().length > 0;
    if (quick.type === "medication") return !!chip || note.trim().length > 0;
    return true;
  })();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-5">
        <p className="text-sm text-muted">Hi {firstName} 👋</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand">{room.name}</h1>
        <p className="text-muted mt-0.5">{facility.name}</p>
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

      {/* Allergy board — the thing that has to be visible without tapping anything */}
      {present.some((k) => k.allergies?.length) && (
        <section aria-labelledby="allergy-h" className="mb-5 bg-danger-soft border border-danger-line rounded-[calc(var(--t-radius)+0.25rem)] p-4">
          <h2 id="allergy-h" className="text-sm font-bold text-danger flex items-center gap-2 mb-2.5">
            <AlertTriangle size={16} aria-hidden /> Allergies in the room today
          </h2>
          <ul className="space-y-2">
            {present.filter((k) => k.allergies?.length).map((k) => (
              <li key={k.id} className="text-sm">
                <span className="font-semibold text-brand">{k.name}</span>
                <span className="text-danger-strong"> — {k.allergies!.map((a) => a.name).join(", ")}</span>
                {k.allergies!.some((a) => a.severity === "severe") && (
                  <span className="ml-1.5 text-xs font-bold uppercase tracking-wide bg-danger text-white px-1.5 py-0.5 rounded">Severe</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Quick log — the thing teachers do 50× a day */}
      <section aria-labelledby="quick-h" className="mb-6">
        <h2 id="quick-h" className="font-semibold text-brand mb-3">Quick log</h2>
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
          {QUICK.map((q) => (
            <button key={q.label} onClick={() => openQuick(q.id, q.video)} className={`rounded-[calc(var(--t-radius)+0.25rem)] p-3 sm:p-4 flex flex-col items-center gap-2 min-h-20 ${q.bg} ${q.fg} hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent transition`}>
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
            <li key={k.id} className={`bg-surface border rounded-[calc(var(--t-radius)+0.25rem)] p-3.5 flex items-start gap-3 ${k.checkedIn ? "border-accent/40" : "border-line opacity-70"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${k.checkedIn ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted"}`}>{k.name.split(" ").map((n) => n[0]).join("")}</div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-brand truncate">{k.name}</p>
                <p className="text-xs text-muted">{k.checkedIn ? "Present" : "Not in yet"}{k.immunizationStatus === "missing" ? " · immunization ⚠" : ""}</p>
                <AllergyBadges child={k} />
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
              <li key={r.id} className="px-4 py-3 flex gap-3 text-sm items-start">
                <span className="font-mono text-xs text-muted w-11 flex-shrink-0 pt-0.5">{r.timestamp}</span>
                <span className="min-w-0 flex-1"><span className="font-medium text-brand">{r.childName.split(" ")[0]}</span> <span className="text-muted">· {r.title ?? r.detail}</span></span>
                {r.media?.length ? <img src={r.media[0]} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0 border border-line" />
                  : r.videos?.[0]?.poster ? <span className="relative flex-shrink-0"><img src={r.videos[0].poster} alt="" className="w-9 h-9 rounded object-cover border border-line" /><Video size={12} className="absolute bottom-0.5 right-0.5 text-white drop-shadow" aria-hidden /></span> : null}
              </li>
            ))}
            {recent.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">Nothing logged yet today.</li>}
          </ul>
        </section>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => onNav("messaging")} className="bg-brand text-white rounded-[calc(var(--t-radius)+0.25rem)] p-4 flex flex-col items-start gap-2 min-h-24 hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent">
            <MessageSquare size={24} aria-hidden /><span className="font-semibold">Message families</span>
          </button>
          <button onClick={() => onNav("logs")} className="bg-surface border border-line text-brand rounded-[calc(var(--t-radius)+0.25rem)] p-4 flex flex-col items-start gap-2 min-h-24 hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <ClipboardList size={24} className="text-accent" aria-hidden /><span className="font-semibold">Daily logs</span><span className="text-xs text-muted">Families see these live</span>
          </button>
        </div>
      </div>

      {/* Quick-log sheet */}
      {quick && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setQuick(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="ql-title" className="bg-surface rounded-t-[calc(var(--t-radius)+0.5rem)] sm:rounded-[calc(var(--t-radius)+0.25rem)] shadow-2xl w-full sm:max-w-lg p-5 sm:p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 id="ql-title" className="text-lg font-bold text-brand">Log {quick.video ? "a video" : QUICK.find((q) => q.id === quick.type)?.label.toLowerCase()}</h2>
              <button onClick={() => setQuick(null)} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><X size={20} aria-hidden /></button>
            </div>

            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-mono uppercase tracking-widest text-muted">Who?</p>
              {!SINGLE_CHILD.includes(quick.type) && (
                <button onClick={() => setQuick((q) => q && ({ ...q, selected: q.selected.length === present.length ? [] : present.map((p) => p.id) }))} className="text-xs font-medium text-accent min-h-9 px-2 rounded hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  {quick.selected.length === present.length ? "Clear all" : "Everyone present"}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {present.map((k) => {
                const on = quick.selected.includes(k.id);
                const single = SINGLE_CHILD.includes(quick.type);
                return (
                  <button
                    key={k.id}
                    role={single ? "radio" : "checkbox"}
                    aria-checked={on}
                    onClick={() => setQuick((q) => {
                      if (!q) return q;
                      if (single) return { ...q, selected: on ? [] : [k.id] };
                      return { ...q, selected: on ? q.selected.filter((x) => x !== k.id) : [...q.selected, k.id] };
                    })}
                    className={`border-2 rounded-card px-3 py-3 min-h-14 flex items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${on ? "border-accent bg-accent-soft" : "border-line"}`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${on ? "bg-accent text-white" : "bg-surface-2"}`}>{on && <Check size={14} aria-hidden />}</span>
                    <span className="text-sm font-medium text-brand truncate flex-1">{k.name}</span>
                    {foodAllergies(k).length > 0 && quick.type === "meal" && (
                      <span className="text-danger flex-shrink-0" title="Food allergy on file" aria-label="Food allergy on file"><AlertTriangle size={15} aria-hidden /></span>
                    )}
                  </button>
                );
              })}
              {present.length === 0 && <p className="col-span-2 text-sm text-muted py-3">Nobody is checked in yet.</p>}
            </div>

            {mealRisk.length > 0 && <AllergyWarning children_={mealRisk} />}

            {quick.type === "medication" ? (
              <MedicationPicker child={selectedKids[0]} value={chip} onChange={setChip} />
            ) : CHIPS[quick.type] ? (
              <Chips label={CHIPS[quick.type]!.label} options={CHIPS[quick.type]!.options} value={chip} onChange={setChip} />
            ) : null}

            {quick.type === "photo" && (quick.video ? (
              <>
                <VideoPicker value={videos} onChange={setVideos} max={2} label="Video" />
                <PhotoPicker value={photos} onChange={setPhotos} max={6} label="Add photos too (optional)" />
              </>
            ) : (
              <>
                <PhotoPicker value={photos} onChange={setPhotos} max={6} label="Photos" />
                <VideoPicker value={videos} onChange={setVideos} max={2} label="Add a video (optional)" />
              </>
            ))}

            <label htmlFor="ql-note" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">
              {quick.type === "medication" ? "Notes" : "Note (optional)"}
            </label>
            <textarea id="ql-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={quick.type === "medication" ? "Reason given, how they responded…" : "Anything to add…"} className="w-full border border-line rounded-card px-3 py-2 text-base bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none mb-4" />

            {quick.type !== "photo" && (
              <div className="mb-4">
                <PhotoPicker value={photos} onChange={setPhotos} max={3} label="Add a photo (optional)" />
              </div>
            )}

            <button onClick={submitQuick} disabled={!canSave} className="w-full min-h-12 rounded-card bg-brand text-white font-semibold hover:bg-brand-hover disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent">
              Save {quick.selected.length > 0 ? `for ${quick.selected.length}` : ""}
            </button>
            <p className="text-xs text-muted text-center mt-2">Families see this on their feed straight away.</p>
          </div>
        </div>
      )}

      {showIncident && (
        <IncidentForm
          facilityId={facility.id}
          roomFilter={room.name}
          onClose={() => setShowIncident(false)}
          onSaved={flash}
        />
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
  return (
    <div className="mb-4">
      <p className="text-xs font-mono uppercase tracking-widest text-muted mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={o} role="radio" aria-checked={v === o} onClick={() => onChange(o)} className={`px-3.5 py-2 rounded-full text-sm font-medium min-h-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${v === o ? "bg-brand text-white" : "bg-surface-2 text-brand hover:bg-line"}`}>{o}</button>
        ))}
      </div>
    </div>
  );
}

/**
 * Medication can only be logged against what the parent actually authorized,
 * and only while that authorization is current.
 */
function MedicationPicker({ child, value, onChange }: { child?: Child; value: string; onChange: (v: string) => void }) {
  if (!child) {
    return <p className="text-sm text-muted mb-4">Pick a child to see the medications you're authorized to give.</p>;
  }
  const meds = child.medications ?? [];
  if (meds.length === 0) {
    return (
      <div className="bg-warning-soft border border-warning-line rounded-card p-3.5 text-sm text-warning-strong mb-4">
        No medication is authorized for {child.name.split(" ")[0]}. The office needs a signed authorization on file before anything can be given.
      </div>
    );
  }
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="mb-4">
      <p className="text-xs font-mono uppercase tracking-widest text-muted mb-1.5">Which medication</p>
      <div className="space-y-2" role="radiogroup" aria-label="Authorized medications">
        {meds.map((m) => {
          const expired = m.authorizedUntil < today;
          const label = `${m.name} · ${m.dose}`;
          const on = value === label;
          return (
            <button
              key={m.id}
              role="radio"
              aria-checked={on}
              disabled={expired}
              onClick={() => onChange(label)}
              className={`w-full text-left border-2 rounded-card p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors ${expired ? "border-line opacity-60 cursor-not-allowed" : on ? "border-accent bg-accent-soft" : "border-line hover:border-accent/50"}`}
            >
              <span className="block text-sm font-semibold text-brand">{m.name} · {m.dose}</span>
              <span className="block text-xs text-muted mt-0.5">{m.schedule} · {m.route}</span>
              {m.notes && <span className="block text-xs text-ink mt-1">{m.notes}</span>}
              {expired ? (
                <span className="inline-block mt-1.5 text-xs font-semibold text-danger">Authorization expired {m.authorizedUntil} — do not administer</span>
              ) : (
                <span className="inline-block mt-1.5 text-xs text-muted">Authorized through {m.authorizedUntil}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
