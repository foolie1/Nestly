/**
 * Office paperwork: review what families have sent, and see who still owes what.
 *
 * Approving is the only way a family's answers reach a child's record, so the
 * review drawer shows what will actually change — and calls out, loudly, any
 * allergy a submission would remove.
 */
import { useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronRight, Clock, FileSignature, Mail, RotateCcw, X } from "lucide-react";
import { facilities, type Child } from "../data";
import { useRoster } from "../roster";
import { useMessages } from "../messages";
import { PHOTO_LABEL, REQUIRED_FORMS, TEMPLATE, useForms, type AllergyRow, type FormStatus, type Submission } from "../forms";
import { SubmissionView } from "../components/SubmissionView";

type Props = { facilityId: string };

const ago = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
};

const CELL: Record<FormStatus, { cls: string; label: string }> = {
  approved: { cls: "bg-success-soft text-success", label: "On file" },
  submitted: { cls: "bg-info-soft text-info", label: "To review" },
  returned: { cls: "bg-warning-soft text-warning", label: "Sent back" },
  "not-started": { cls: "bg-danger-soft text-danger", label: "Missing" },
};

export default function Paperwork({ facilityId }: Props) {
  const { roster } = useRoster();
  const { pendingAt, statusFor, outstanding, approve, returnForChanges, submissions } = useForms();
  const { startOutreach } = useMessages();
  const facility = facilities.find((f) => f.id === facilityId) ?? facilities[0];
  const kids = useMemo(() => roster.filter((c) => c.facilityId === facilityId).sort((a, b) => a.name.localeCompare(b.name)), [roster, facilityId]);

  const [tab, setTab] = useState<"review" | "children">("review");
  const [reviewing, setReviewing] = useState<Submission | null>(null);
  const [returning, setReturning] = useState(false);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [reminded, setReminded] = useState<string[]>([]);
  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2800);
  };

  const pending = pendingAt(facilityId);
  const owing = kids.filter((c) => outstanding(c).length > 0);
  const totalRequired = kids.length * REQUIRED_FORMS.length;
  const approvedCount = kids.reduce((n, c) => n + REQUIRED_FORMS.filter((t) => statusFor(c.id, t.id) === "approved").length, 0);
  const pct = totalRequired ? Math.round((approvedCount / totalRequired) * 100) : 100;
  const in30 = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const medsExpiring = kids.flatMap((c) => (c.medications ?? []).filter((m) => m.authorizedUntil <= in30).map((m) => ({ c, m })));

  const childOf = (s: Submission) => roster.find((c) => c.id === s.childId);

  const close = () => {
    setReviewing(null);
    setReturning(false);
    setNote("");
  };

  const doApprove = () => {
    if (!reviewing) return;
    const c = childOf(reviewing);
    approve(reviewing.id);
    flash(`Approved — ${c?.name.split(" ")[0]}'s record is updated`);
    close();
  };

  const doReturn = () => {
    if (!reviewing || !note.trim()) return;
    returnForChanges(reviewing.id, note);
    flash(`Sent back to ${childOf(reviewing)?.guardian ?? "the family"}`);
    close();
  };

  const remind = (c: Child) => {
    const missing = outstanding(c);
    if (missing.length === 0) return;
    startOutreach({
      childId: c.id,
      category: "documents",
      title: `Paperwork for ${c.name.split(" ")[0]}`,
      body: `Hi ${c.guardian.split(" ")[0]} — we're still missing ${missing.length === 1 ? "one form" : `${missing.length} forms`} for ${c.name.split(" ")[0]}: ${missing
        .map((t) => t.name)
        .join(", ")}. You can fill ${missing.length === 1 ? "it" : "them"} in from the Family tab in the app — each one takes a few minutes, and there's nothing to print.`,
    });
    setReminded((r) => [...r, c.id]);
    flash(`Reminder sent to ${c.guardian}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <p className="text-sm font-mono text-muted uppercase tracking-widest mb-1">Paperwork</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand">Family forms</h1>
        <p className="text-muted mt-1">{facility.name} · families complete these in the app, you review them here</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-7">
        {[
          { label: "Waiting on you", value: `${pending.length}`, sub: pending.length ? `oldest ${ago(pending[0].submittedAt)}` : "nothing to review", color: pending.length ? "text-info" : "text-success", go: () => setTab("review") },
          { label: "Families owing forms", value: `${owing.length}`, sub: `of ${kids.length} enrolled`, color: owing.length ? "text-warning" : "text-success", go: () => setTab("children") },
          { label: "Required forms on file", value: `${pct}%`, sub: `${approvedCount} of ${totalRequired}`, color: pct >= 90 ? "text-success" : "text-brand", go: () => setTab("children") },
          { label: "Medication auth expiring", value: `${medsExpiring.length}`, sub: "within 30 days", color: medsExpiring.length ? "text-danger" : "text-success", go: () => setTab("children") },
        ].map((k) => (
          <button key={k.label} onClick={k.go} className="bg-surface border border-line rounded-card p-5 text-left hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors">
            <p className="text-xs font-mono uppercase tracking-widest text-muted mb-2">{k.label}</p>
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted mt-1">{k.sub}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-1 mb-5 bg-line p-1 rounded-ctl w-fit" role="tablist">
        {(["review", "children"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-4 py-2 min-h-10 rounded-ctl text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${tab === t ? "bg-surface text-brand shadow-sm" : "text-muted hover:text-brand"}`}>
            {t === "review" ? `To review${pending.length ? ` · ${pending.length}` : ""}` : "By child"}
          </button>
        ))}
      </div>

      {tab === "review" && (
        <div className="space-y-2">
          {pending.length === 0 && (
            <div className="border-2 border-dashed border-line rounded-card p-10 text-center">
              <Check size={28} className="mx-auto text-success mb-2" aria-hidden />
              <p className="font-medium text-brand">Nothing waiting</p>
              <p className="text-sm text-muted mt-1">New submissions from families will show up here.</p>
            </div>
          )}
          {pending.map((s) => {
            const c = childOf(s);
            const t = TEMPLATE[s.formId];
            return (
              <button key={s.id} onClick={() => setReviewing(s)} className="w-full bg-surface border border-line rounded-card p-4 flex items-center gap-4 text-left hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors">
                <span className="w-11 h-11 rounded-card bg-info-soft text-info flex items-center justify-center flex-shrink-0">
                  <FileSignature size={20} aria-hidden />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-brand">{t.name}{s.formId === "medication" ? ` · ${String(s.data.name)}` : ""}</span>
                  <span className="block text-sm text-muted truncate">{c?.name} · {c?.room} · from {s.signedName}</span>
                </span>
                <span className="text-xs font-mono text-muted flex-shrink-0 hidden sm:block">{ago(s.submittedAt)}</span>
                <ChevronRight size={18} className="text-muted flex-shrink-0" aria-hidden />
              </button>
            );
          })}
        </div>
      )}

      {tab === "children" && (
        <div className="bg-surface border border-line rounded-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="bg-surface-2 border-b border-line">
                  <th scope="col" className="text-left px-4 py-3 text-xs font-mono uppercase tracking-widest text-muted font-medium">Child</th>
                  {REQUIRED_FORMS.map((t) => (
                    <th key={t.id} scope="col" className="text-left px-3 py-3 text-xs font-mono uppercase tracking-widest text-muted font-medium">
                      {t.id === "enrollment" ? "Agreement" : t.id === "emergency" ? "Emergency" : t.id === "health" ? "Health" : "Photos"}
                    </th>
                  ))}
                  <th scope="col" className="text-left px-3 py-3 text-xs font-mono uppercase tracking-widest text-muted font-medium">DH 680</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {kids.map((c) => {
                  const owes = outstanding(c).length > 0;
                  return (
                    <tr key={c.id} className="hover:bg-row-hover">
                      <th scope="row" className="text-left px-4 py-3 font-medium">
                        <span className="block text-brand">{c.name}</span>
                        <span className="block text-xs text-muted font-normal">{c.room}</span>
                      </th>
                      {REQUIRED_FORMS.map((t) => {
                        const st = statusFor(c.id, t.id);
                        const cell = CELL[st];
                        const sub = submissions.find((x) => x.childId === c.id && x.formId === t.id && x.status === "submitted");
                        return (
                          <td key={t.id} className="px-3 py-3">
                            {sub ? (
                              <button onClick={() => setReviewing(sub)} className={`text-xs font-medium px-2 py-1 rounded-full ${cell.cls} hover:ring-2 hover:ring-current focus:outline-none focus-visible:ring-2 focus-visible:ring-accent`}>
                                {cell.label}
                              </button>
                            ) : (
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${cell.cls}`}>{cell.label}</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.immunizationStatus === "current" ? CELL.approved.cls : c.immunizationStatus === "expires-soon" ? CELL.returned.cls : CELL["not-started"].cls}`}>
                          {c.immunizationStatus === "current" ? "Current" : c.immunizationStatus === "expires-soon" ? "Expiring" : "Missing"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {owes &&
                          (reminded.includes(c.id) ? (
                            <span className="text-xs text-muted inline-flex items-center gap-1"><Check size={13} aria-hidden /> Reminded</span>
                          ) : (
                            <button onClick={() => remind(c)} className="inline-flex items-center gap-1.5 text-xs font-medium text-accent min-h-9 px-2.5 rounded-ctl hover:bg-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                              <Mail size={14} aria-hidden /> Remind family
                            </button>
                          ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {medsExpiring.length > 0 && (
            <div className="border-t border-line p-4 bg-danger-soft/40">
              <p className="text-sm font-semibold text-danger mb-2 flex items-center gap-2"><AlertTriangle size={16} aria-hidden /> Medication authorizations expiring</p>
              <ul className="space-y-1 text-sm">
                {medsExpiring.map(({ c, m }) => (
                  <li key={m.id}>
                    <span className="font-medium text-brand">{c.name}</span>
                    <span className="text-muted"> · {m.name} · {m.authorizedUntil < today ? `expired ${m.authorizedUntil}` : `expires ${m.authorizedUntil}`}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted mt-2">Teachers can't log a dose once the date passes. The family can renew from their Family tab.</p>
            </div>
          )}
        </div>
      )}

      {reviewing && (
        <ReviewDrawer
          submission={reviewing}
          child={childOf(reviewing)}
          returning={returning}
          note={note}
          setNote={setNote}
          onStartReturn={() => setReturning(true)}
          onCancelReturn={() => { setReturning(false); setNote(""); }}
          onApprove={doApprove}
          onReturn={doReturn}
          onClose={close}
        />
      )}

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand text-white text-sm font-medium px-4 py-3 rounded-card shadow-lg z-50 flex items-center gap-2">
          <Check size={16} className="text-success" aria-hidden /> {toast}
        </div>
      )}
    </div>
  );
}

function ReviewDrawer({
  submission, child, returning, note, setNote, onStartReturn, onCancelReturn, onApprove, onReturn, onClose,
}: {
  submission: Submission;
  child?: Child;
  returning: boolean;
  note: string;
  setNote: (v: string) => void;
  onStartReturn: () => void;
  onCancelReturn: () => void;
  onApprove: () => void;
  onReturn: () => void;
  onClose: () => void;
}) {
  const t = TEMPLATE[submission.formId];
  const changes = child ? describeChanges(submission, child) : [];
  const risky = changes.some((c) => c.danger);

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-stretch justify-end" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="rv-title" className="bg-surface h-full w-full sm:max-w-xl shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="px-5 sm:px-6 py-4 border-b border-line flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono uppercase tracking-widest text-muted">{child?.name} · {child?.room}</p>
            <h2 id="rv-title" className="text-lg font-bold text-brand">{t.name}</h2>
            <p className="text-xs text-muted mt-0.5 flex items-center gap-1"><Clock size={12} aria-hidden /> Sent by {submission.signedName}, {ago(submission.submittedAt)}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-11 h-11 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><X size={20} aria-hidden /></button>
        </header>

        <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-5">
          {changes.length > 0 && (
            <div className={`rounded-card border p-4 mb-6 ${risky ? "bg-danger-soft border-danger-line" : "bg-accent-soft border-accent/30"}`}>
              <p className={`text-sm font-semibold mb-2 flex items-center gap-2 ${risky ? "text-danger" : "text-accent"}`}>
                {risky && <AlertTriangle size={16} aria-hidden />}
                {risky ? "Approving this removes safety information" : "What approving this changes"}
              </p>
              <ul className="space-y-1 text-sm">
                {changes.map((c, i) => (
                  <li key={i} className={c.danger ? "text-danger-strong font-medium" : "text-ink"}>{c.text}</li>
                ))}
              </ul>
              {risky && <p className="text-xs text-muted mt-2">Confirm with the family before approving. If it was a mistake, send it back.</p>}
            </div>
          )}
          <SubmissionView submission={submission} />
        </div>

        <footer className="px-5 sm:px-6 py-4 border-t border-line bg-surface">
          {returning ? (
            <div className="space-y-3">
              <label htmlFor="rv-note" className="text-sm font-semibold text-brand block">What should the family change?</label>
              <textarea id="rv-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} autoFocus placeholder="Be specific — they'll see exactly this." className="w-full border border-line rounded-ctl px-3.5 py-2.5 text-base bg-surface text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none" />
              <div className="flex gap-3">
                <button onClick={onCancelReturn} className="flex-1 min-h-11 rounded-ctl border border-line text-muted hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Cancel</button>
                <button onClick={onReturn} disabled={!note.trim()} className="flex-[2] min-h-11 rounded-ctl bg-warning text-white font-semibold hover:bg-warning-strong disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent">Send back to family</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={onStartReturn} className="flex-1 min-h-12 rounded-ctl border border-line text-brand font-medium hover:border-warning hover:text-warning inline-flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                <RotateCcw size={16} aria-hidden /> Send back
              </button>
              <button onClick={onApprove} className="flex-[2] min-h-12 rounded-ctl bg-success text-white font-semibold hover:brightness-95 inline-flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent">
                <Check size={17} aria-hidden /> Approve and add to record
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

/** Plain-language diff between the submission and what's on file now. */
function describeChanges(s: Submission, c: Child): { text: string; danger?: boolean }[] {
  const out: { text: string; danger?: boolean }[] = [];
  if (s.formId === "health") {
    const before = c.allergies ?? [];
    const after = s.data.hasAllergies === "Yes" ? ((s.data.allergies as AllergyRow[]) ?? []) : [];
    const key = (n: string) => n.trim().toLowerCase();
    for (const a of before) {
      if (!after.some((x) => key(x.name) === key(a.name))) {
        out.push({ text: `Removes ${a.name} (${a.severity}) from the allergy list`, danger: true });
      }
    }
    for (const a of after) {
      const was = before.find((x) => key(x.name) === key(a.name));
      if (!was) out.push({ text: `Adds ${a.name} (${a.severity})` });
      else if (was.severity !== a.severity) out.push({ text: `${a.name}: ${was.severity} → ${a.severity}`, danger: a.severity !== "severe" && was.severity === "severe" });
    }
    const diet = String(s.data.dietaryNotes ?? "").trim();
    if (diet !== (c.dietaryNotes ?? "")) out.push({ text: diet ? `Dietary notes: “${diet}”` : "Clears the dietary notes" });
  }
  if (s.formId === "photo") {
    const map: Record<string, keyof typeof PHOTO_LABEL> = {
      [TEMPLATE.photo.sections[0].fields[0].options![0]]: "granted",
      [TEMPLATE.photo.sections[0].fields[0].options![1]]: "feed-only",
      [TEMPLATE.photo.sections[0].fields[0].options![2]]: "denied",
    };
    const next = map[String(s.data.consent)];
    out.push({ text: `${c.photoConsent ? PHOTO_LABEL[c.photoConsent] : "No answer on file"} → ${PHOTO_LABEL[next]}` });
  }
  if (s.formId === "medication") {
    out.push({ text: `Staff can give ${String(s.data.name)} (${String(s.data.dose)}) through ${String(s.data.end)}` });
  }
  if (s.formId === "emergency") {
    const n = ((s.data.contacts as { name: string }[]) ?? []).filter((x) => x.name.trim()).length;
    out.push({ text: `Replaces the emergency contact list with ${n} contact${n === 1 ? "" : "s"}` });
  }
  return out;
}
