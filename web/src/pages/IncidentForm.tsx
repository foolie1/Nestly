/**
 * Incident report form.
 *
 * Reached from the teacher's Quick log and from the Compliance page. Florida
 * expects a written report with the guardian notified and a signature on file,
 * so description, staff signature and a notification decision are all required
 * before this will save — the form deliberately will not let you file a vague
 * report, because a vague report is the one that causes trouble later.
 */
import { useMemo, useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import { INCIDENT_TYPES } from "../data";
import { useRoster } from "../roster";
import { useIncidents } from "../incidents";
import { useLogs } from "../logs";
import { useAuth } from "../auth";
import { SignaturePad } from "../signature";
import { PhotoPicker } from "../media";

type Props = {
  facilityId: string;
  /** Limits the child list to one room — used from the teacher's side. */
  roomFilter?: string;
  presetChildId?: string;
  onClose: () => void;
  onSaved?: (message: string) => void;
};

const SEVERITY: { id: "low" | "medium" | "high"; label: string; blurb: string }[] = [
  { id: "low", label: "Low", blurb: "No treatment beyond basic first aid" },
  { id: "medium", label: "Medium", blurb: "Needed attention or follow-up" },
  { id: "high", label: "High", blurb: "Medical care, or a reportable event" },
];

const nowTime = () => new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

export default function IncidentForm({ facilityId, roomFilter, presetChildId, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const { roster } = useRoster();
  const { add } = useIncidents();
  const { addEntries } = useLogs();

  const kids = useMemo(
    () =>
      roster
        .filter((c) => c.facilityId === facilityId && (!roomFilter || c.room === roomFilter))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [roster, facilityId, roomFilter],
  );

  const [childId, setChildId] = useState(presetChildId ?? "");
  const [type, setType] = useState<string>(INCIDENT_TYPES[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(nowTime());
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [witnesses, setWitnesses] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("low");
  const [notified, setNotified] = useState(false);
  const [notifiedMethod, setNotifiedMethod] = useState<"in-person" | "phone" | "message">("in-person");
  const [signature, setSignature] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);

  const child = roster.find((c) => c.id === childId);

  const problems: string[] = [];
  if (!childId) problems.push("Choose the child this report is about.");
  if (description.trim().length < 15) problems.push("Describe what happened in a sentence or two.");
  if (!signature) problems.push("Sign the report before filing it.");

  const save = () => {
    if (problems.length > 0 || !child || !user) {
      setShowErrors(true);
      return;
    }
    add({
      childId: child.id,
      childName: child.name,
      facilityId,
      room: child.room,
      date,
      time,
      type,
      location: location.trim() || undefined,
      description: description.trim(),
      actionTaken: actionTaken.trim() || undefined,
      witnesses: witnesses.trim() || undefined,
      reportedBy: user.name,
      guardianNotified: notified,
      notifiedMethod: notified ? notifiedMethod : undefined,
      notifiedAt: notified ? `${date} ${time}` : undefined,
      guardianSigned: false,
      severity,
      staffSignature: signature ?? undefined,
    });
    // Mirror it onto the child's timeline so the family sees it too.
    addEntries({
      childIds: [child.id],
      type: "incident",
      title: type,
      detail: [description.trim(), actionTaken.trim() && `Action taken: ${actionTaken.trim()}`].filter(Boolean).join(" "),
      media: photos,
    });
    onSaved?.(`Incident report filed for ${child.name.split(" ")[0]}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="incident-title"
        className="bg-surface rounded-t-[calc(var(--t-radius)+0.5rem)] sm:rounded-[calc(var(--t-radius)+0.25rem)] shadow-2xl w-full sm:max-w-xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 sm:px-6 py-4 border-b border-line flex items-start justify-between sticky top-0 bg-surface z-10">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-card bg-danger-soft text-danger flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} aria-hidden />
            </span>
            <div>
              <h2 id="incident-title" className="text-lg font-bold text-brand leading-tight">Incident report</h2>
              <p className="text-xs text-muted mt-0.5">Filed by {user?.name}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {showErrors && problems.length > 0 && (
            <div role="alert" className="bg-danger-soft border border-danger-line rounded-card p-3.5">
              <p className="text-sm font-semibold text-danger mb-1">Before this can be filed:</p>
              <ul className="text-sm text-danger-strong list-disc pl-5 space-y-0.5">
                {problems.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </div>
          )}

          <div>
            <label htmlFor="inc-child" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Child <span className="text-danger">*</span></label>
            <select id="inc-child" value={childId} onChange={(e) => setChildId(e.target.value)} className="w-full min-h-11 border border-line rounded-ctl px-3 text-base bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <option value="">Select child…</option>
              {kids.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.room}</option>)}
            </select>
          </div>

          {child?.allergies?.length ? (
            <div className="bg-warning-soft border border-warning-line rounded-card p-3 text-xs text-warning-strong">
              <span className="font-semibold">Allergy on file:</span> {child.allergies.map((a) => a.name).join(", ")}. Note it here if it may be related.
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="inc-date" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Date</label>
              <input id="inc-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full min-h-11 border border-line rounded-ctl px-3 text-base bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
            </div>
            <div>
              <label htmlFor="inc-time" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Time</label>
              <input id="inc-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full min-h-11 border border-line rounded-ctl px-3 text-base bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
            </div>
          </div>

          <div>
            <label htmlFor="inc-type" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">What kind of incident</label>
            <select id="inc-type" value={type} onChange={(e) => setType(e.target.value)} className="w-full min-h-11 border border-line rounded-ctl px-3 text-base bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="inc-location" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Where</label>
            <input id="inc-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Playground, classroom, hallway…" className="w-full min-h-11 border border-line rounded-ctl px-3 text-base bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
          </div>

          <div>
            <label htmlFor="inc-desc" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">What happened <span className="text-danger">*</span></label>
            <textarea id="inc-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Plain facts, in order. What led up to it, what happened, what you observed." className="w-full border border-line rounded-ctl px-3.5 py-2.5 text-base bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none" />
          </div>

          <div>
            <label htmlFor="inc-action" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">What you did</label>
            <textarea id="inc-action" rows={2} value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} placeholder="First aid given, how long you monitored, who you told." className="w-full border border-line rounded-ctl px-3.5 py-2.5 text-base bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none" />
          </div>

          <div>
            <label htmlFor="inc-witness" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Staff who saw it</label>
            <input id="inc-witness" value={witnesses} onChange={(e) => setWitnesses(e.target.value)} placeholder="Names of anyone else present" className="w-full min-h-11 border border-line rounded-ctl px-3 text-base bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
          </div>

          <fieldset>
            <legend className="text-xs font-mono uppercase tracking-widest text-muted mb-1.5">Severity</legend>
            <div className="grid grid-cols-3 gap-2">
              {SEVERITY.map((s) => {
                const on = severity === s.id;
                return (
                  <button key={s.id} type="button" role="radio" aria-checked={on} onClick={() => setSeverity(s.id)} className={`border-2 rounded-card p-3 text-left min-h-16 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors ${on ? "border-accent bg-accent-soft" : "border-line hover:border-accent/50"}`}>
                    <span className="block text-sm font-semibold text-brand">{s.label}</span>
                    <span className="block text-xs text-muted mt-0.5 leading-snug">{s.blurb}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <PhotoPicker value={photos} onChange={setPhotos} max={4} label="Photos (optional)" />

          <div className="bg-surface-2 rounded-card p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={notified} onChange={(e) => setNotified(e.target.checked)} className="mt-0.5 w-5 h-5 rounded accent-[var(--t-accent)] flex-shrink-0" />
              <span className="text-sm">
                <span className="font-semibold text-brand">I told {child ? child.guardian : "the guardian"} about this</span>
                <span className="block text-xs text-muted mt-0.5">Required before the report is complete. If you haven't yet, file it now and the office will follow up.</span>
              </span>
            </label>
            {notified && (
              <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="How you told them">
                {(["in-person", "phone", "message"] as const).map((m) => (
                  <button key={m} type="button" role="radio" aria-checked={notifiedMethod === m} onClick={() => setNotifiedMethod(m)} className={`px-3.5 py-2 min-h-10 rounded-full text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${notifiedMethod === m ? "bg-brand text-white" : "bg-surface text-brand border border-line hover:border-accent"}`}>
                    {m === "in-person" ? "In person" : m === "phone" ? "Phone call" : "Message"}
                  </button>
                ))}
              </div>
            )}
          </div>

          <SignaturePad value={signature} onChange={setSignature} label="Your signature" placeholder="Sign to confirm this account is accurate" />

          <p className="text-xs text-muted">
            The office is notified as soon as you file this. The guardian's signature is collected separately and tracked on the compliance page.
          </p>
        </div>

        {/* z-20 so the sticky header can't paint over the submit button */}
        <div className="px-5 sm:px-6 pb-6 pt-3 flex gap-3 sticky bottom-0 z-20 bg-surface border-t border-line">
          <button onClick={onClose} className="flex-1 min-h-12 rounded-ctl border border-line text-muted hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors">Cancel</button>
          <button onClick={save} className="flex-1 min-h-12 rounded-ctl bg-danger text-white font-semibold hover:bg-danger-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent transition-colors flex items-center justify-center gap-2">
            <Check size={18} aria-hidden /> File report
          </button>
        </div>
      </div>
    </div>
  );
}
