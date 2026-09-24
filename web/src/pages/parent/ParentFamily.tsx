import { useRef, useState } from "react";
import { AlertTriangle, Check, ChevronRight, Clock, FileText, Paperclip, Phone, Pill, Plus, ShieldCheck, Star, Trash2, UserRound, X } from "lucide-react";
import { authorizedPickups, type AuthorizedPickup } from "../../data";
import { useRoster } from "../../roster";
import { REQUIRED_FORMS, TEMPLATE, useForms, type FormTemplate, type Submission } from "../../forms";
import { AllergyDetail } from "../../components/allergy";
import { SubmissionView } from "../../components/SubmissionView";
import { ChildSwitcher, useSelectedChild } from "./childSwitcher";
import FormFill from "./FormFill";

type Upload = { docId: string; fileName: string; on: string };

const shortDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

const MAX_MB = 10;
const ACCEPT = "image/png,image/jpeg,image/heic,application/pdf";

export default function ParentFamily() {
  const { roster } = useRoster();
  const [childId, setChildId] = useSelectedChild();
  const child = roster.find((c) => c.id === childId) ?? roster[0];
  const { statusFor, latest, forChild } = useForms();

  const [uploads, setUploads] = useState<Upload[]>([]);
  const [filling, setFilling] = useState<{ template: FormTemplate; previous?: Submission } | null>(null);
  const [viewing, setViewing] = useState<Submission | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const done = REQUIRED_FORMS.filter((t) => statusFor(child.id, t.id) === "approved").length;
  const medSubs = forChild(child.id).filter((x) => x.formId === "medication");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [added, setAdded] = useState<AuthorizedPickup[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [addingPerson, setAddingPerson] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);
  const targetDoc = useRef<string | null>(null);

  const pickups = [...authorizedPickups.filter((p) => p.childId === child.id), ...added.filter((p) => p.childId === child.id)];
  const uploadFor = (docId: string) => uploads.find((u) => u.docId === docId);

  const chooseFile = (docId: string) => {
    setUploadError(null);
    targetDoc.current = docId;
    fileInput.current?.click();
  };

  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const docId = targetDoc.current;
    // Reset so picking the same file twice still fires a change event.
    e.target.value = "";
    if (!file || !docId) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploadError(`${file.name} is larger than ${MAX_MB} MB. Try a photo instead of a scan.`);
      return;
    }
    const on = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    setUploads((u) => [...u.filter((x) => x.docId !== docId), { docId, fileName: file.name, on }]);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-brand mb-4">Family</h1>
      <ChildSwitcher value={childId} onChange={setChildId} />

      {/* One hidden input serves every document row */}
      <input ref={fileInput} type="file" accept={ACCEPT} onChange={onFilePicked} className="sr-only" tabIndex={-1} aria-hidden />

      {/* Child profile */}
      <div className="bg-surface border border-line rounded-[calc(var(--t-radius)+0.25rem)] p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-[calc(var(--t-radius)+0.25rem)] bg-accent-soft flex items-center justify-center text-2xl" aria-hidden>🧒</div>
          <div>
            <h2 className="text-lg font-bold text-brand">{child.name}</h2>
            <p className="text-sm text-muted">Born {child.dob} · {child.room}</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div className="bg-surface-2 rounded-card p-3"><dt className="text-xs text-muted">Enrolled since</dt><dd className="font-medium text-brand">{child.enrollmentDate}</dd></div>
          <div className="bg-surface-2 rounded-card p-3"><dt className="text-xs text-muted">Room</dt><dd className="font-medium text-brand">{child.room}</dd></div>
        </dl>

        <div className="mt-4 border-t border-line pt-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-muted mb-2">Allergies</h3>
          <AllergyDetail child={child} />
          {child.dietaryNotes && (
            <p className="text-xs text-muted mt-2"><span className="font-semibold text-brand">Dietary notes:</span> {child.dietaryNotes}</p>
          )}
        </div>

        {child.medications?.length ? (
          <div className="mt-4 border-t border-line pt-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted mb-2">Medications we're authorized to give</h3>
            <ul className="space-y-2">
              {child.medications.map((m) => (
                <li key={m.id} className="border-l-2 border-accent pl-3">
                  <p className="text-sm font-semibold text-brand">{m.name} · {m.dose}</p>
                  <p className="text-xs text-muted mt-0.5">{m.schedule} · {m.route} · {m.prescriber}</p>
                  <p className="text-xs text-muted">Authorization on file through {m.authorizedUntil}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="text-xs text-muted mt-4">To change allergies or medications, use the forms below — the office reviews every change before it reaches the classroom. For a room change, message the office.</p>
      </div>

      {/* Paperwork */}
      <section aria-labelledby="docs-h" className="mb-6">
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <h2 id="docs-h" className="font-semibold text-brand">Paperwork</h2>
          <span className="text-xs font-mono text-muted">{done} of {REQUIRED_FORMS.length} required on file</span>
        </div>
        <p className="text-sm text-muted mb-3">Fill these in here — no printing, no scanning. The office reviews each one before it's added to {child.name.split(" ")[0]}'s record.</p>

        <ul className="space-y-2">
          {REQUIRED_FORMS.map((t) => {
            const st = statusFor(child.id, t.id);
            const last = latest(child.id, t.id);
            const style =
              st === "approved"
                ? { bg: "bg-success-soft", fg: "text-success", Icon: Check, label: `On file · ${shortDate(last?.reviewedAt)}` }
                : st === "submitted"
                  ? { bg: "bg-info-soft", fg: "text-info", Icon: Clock, label: "Sent · the office is reviewing it" }
                  : st === "returned"
                    ? { bg: "bg-warning-soft", fg: "text-warning", Icon: AlertTriangle, label: "Sent back — needs a change" }
                    : { bg: "bg-danger-soft", fg: "text-danger", Icon: FileText, label: `Not started · about ${t.minutes} min` };
            const action =
              st === "not-started" ? { text: "Start", primary: true, run: () => setFilling({ template: t }) }
              : st === "returned" ? { text: "Fix", primary: true, run: () => setFilling({ template: t, previous: last }) }
              : st === "submitted" ? { text: "View", primary: false, run: () => last && setViewing(last) }
              : { text: "Update", primary: false, run: () => setFilling({ template: t, previous: last }) };
            return (
              <li key={t.id} className="bg-surface border border-line rounded-[calc(var(--t-radius)+0.25rem)] p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-card flex items-center justify-center flex-shrink-0 ${style.bg} ${style.fg}`}><style.Icon size={22} aria-hidden /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-brand text-sm sm:text-base">{t.name}</p>
                    <p className={`text-xs ${style.fg}`}>{style.label}</p>
                  </div>
                  <button
                    onClick={action.run}
                    className={`inline-flex items-center gap-1 text-sm font-semibold px-3.5 rounded-ctl min-h-11 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${action.primary ? "bg-brand text-white hover:bg-brand-hover" : "border border-line text-brand hover:border-accent"}`}
                  >
                    {action.text} {action.primary && <ChevronRight size={16} aria-hidden />}
                  </button>
                </div>
                {st === "returned" && last?.reviewNote && (
                  <p className="text-sm text-ink bg-warning-soft rounded-card px-3.5 py-2.5 mt-3"><span className="font-semibold text-warning-strong">The office says:</span> {last.reviewNote}</p>
                )}
                {st === "approved" && last && (
                  <button onClick={() => setViewing(last)} className="text-xs text-accent font-medium mt-2 ml-14 min-h-8 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded">View what you sent</button>
                )}
              </li>
            );
          })}
        </ul>

        {/* Medication — only when the child needs something given */}
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h3 className="text-sm font-semibold text-brand flex items-center gap-2"><Pill size={16} className="text-accent" aria-hidden /> Medication authorizations</h3>
            <button onClick={() => setFilling({ template: TEMPLATE.medication })} className="inline-flex items-center gap-1 text-sm font-medium text-accent min-h-10 px-2.5 rounded-ctl hover:bg-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <Plus size={16} aria-hidden /> Authorize a medication
            </button>
          </div>
          {medSubs.length === 0 ? (
            <p className="text-sm text-muted bg-surface-2 rounded-card px-4 py-3">None on file. Staff can't give any medication — including over-the-counter — without one.</p>
          ) : (
            <ul className="space-y-2">
              {medSubs.map((m) => {
                const expired = m.status === "approved" && String(m.data.end) < new Date().toISOString().slice(0, 10);
                return (
                  <li key={m.id}>
                    <button onClick={() => setViewing(m)} className="w-full text-left bg-surface border border-line rounded-card px-4 py-3 flex items-center gap-3 hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-brand">{String(m.data.name)} · {String(m.data.dose)}</span>
                        <span className="block text-xs text-muted">{String(m.data.schedule)}</span>
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                        m.status === "submitted" ? "bg-info-soft text-info"
                        : m.status === "returned" ? "bg-warning-soft text-warning"
                        : expired ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}`}>
                        {m.status === "submitted" ? "In review" : m.status === "returned" ? "Sent back" : expired ? `Expired ${String(m.data.end)}` : `Through ${String(m.data.end)}`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* The one document that can't be done online — a doctor fills it in */}
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-brand mb-2">From your doctor</h3>
          {uploadError && (
            <div role="alert" className="mb-2 bg-danger-soft border border-danger-line text-danger-strong text-sm rounded-card px-4 py-3">{uploadError}</div>
          )}
          {(() => {
            const up = uploadFor("dh680");
            const imm = child.immunizationStatus;
            const style = up
              ? { bg: "bg-info-soft", fg: "text-info", Icon: Clock, label: `Uploaded ${up.on} · the office is reviewing it` }
              : imm === "current"
                ? { bg: "bg-success-soft", fg: "text-success", Icon: Check, label: "On file and current" }
                : imm === "expires-soon"
                  ? { bg: "bg-warning-soft", fg: "text-warning", Icon: AlertTriangle, label: "Expires soon · upload the new one" }
                  : { bg: "bg-danger-soft", fg: "text-danger", Icon: AlertTriangle, label: "Missing · required within 30 days of enrollment" };
            return (
              <div className="bg-surface border border-line rounded-[calc(var(--t-radius)+0.25rem)] p-4 flex items-center gap-3">
                <div className={`w-11 h-11 rounded-card flex items-center justify-center flex-shrink-0 ${style.bg} ${style.fg}`}><style.Icon size={22} aria-hidden /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brand text-sm sm:text-base">Florida Certification of Immunization <span className="text-xs font-mono text-muted ml-1">DH 680</span></p>
                  <p className={`text-xs ${style.fg}`}>{style.label}</p>
                  {up && (
                    <p className="text-xs text-muted mt-1 flex items-center gap-1 min-w-0">
                      <Paperclip size={12} className="flex-shrink-0" aria-hidden />
                      <span className="truncate">{up.fileName}</span>
                      <button onClick={() => setUploads((u) => u.filter((x) => x.docId !== "dh680"))} className="ml-1 text-danger hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-danger rounded flex-shrink-0">Remove</button>
                    </p>
                  )}
                </div>
                {!up && imm !== "current" && (
                  <button onClick={() => chooseFile("dh680")} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 rounded-ctl border border-line text-brand min-h-11 flex-shrink-0 hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    <Paperclip size={15} aria-hidden /> Upload
                  </button>
                )}
              </div>
            );
          })()}
          <p className="text-xs text-muted mt-2 px-1">Your pediatrician fills this one in, so it can't be completed here. A clear phone photo works — PDF or image, up to {MAX_MB} MB.</p>
        </div>

        <div className="mt-4 bg-surface-2 rounded-card p-3 text-xs text-muted flex gap-2">
          <ShieldCheck size={16} className="text-accent flex-shrink-0 mt-0.5" aria-hidden />
          <p>Nothing you send changes {child.name.split(" ")[0]}'s record until the office has looked at it. That's deliberate — especially for allergies, where a change should always be seen by a person first.</p>
        </div>
      </section>

      {/* Authorized pickups */}
      <section aria-labelledby="pickup-h">
        <div className="flex items-center justify-between mb-3">
          <h2 id="pickup-h" className="font-semibold text-brand">Authorized pickups</h2>
          <button onClick={() => setAddingPerson(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-accent min-h-10 px-2 rounded-ctl hover:bg-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <Plus size={16} aria-hidden /> Add person
          </button>
        </div>
        <ul className="space-y-2">
          {pickups.map((p) => {
            const pending = pendingIds.includes(p.id);
            return (
              <li key={p.id} className="bg-surface border border-line rounded-[calc(var(--t-radius)+0.25rem)] p-4 flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${pending ? "bg-warning-soft text-warning" : "bg-brand-soft text-brand"}`}><UserRound size={22} aria-hidden /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brand flex items-center gap-1.5 flex-wrap">
                    {p.name}
                    {p.isPrimary && <Star size={14} className="text-warning fill-warning" aria-label="Primary guardian" />}
                    {pending && <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium bg-warning-soft text-warning-strong">Pending office approval</span>}
                  </p>
                  <p className="text-xs text-muted">{p.relationship} · {p.phone}</p>
                </div>
                {pending ? (
                  <button
                    onClick={() => { setAdded((a) => a.filter((x) => x.id !== p.id)); setPendingIds((i) => i.filter((x) => x !== p.id)); }}
                    aria-label={`Remove ${p.name}`}
                    className="w-11 h-11 rounded-ctl flex items-center justify-center text-danger hover:bg-danger-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                  >
                    <Trash2 size={18} aria-hidden />
                  </button>
                ) : (
                  <a href={`tel:${p.phone.replace(/\D/g, "")}`} aria-label={`Call ${p.name}`} className="w-11 h-11 rounded-ctl flex items-center justify-center text-accent hover:bg-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><Phone size={20} aria-hidden /></a>
                )}
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted mt-3">Anyone picking up must be on this list and show photo ID. New people are checked by the office before their first pickup. Staff will call you if someone not listed arrives.</p>
      </section>

      {addingPerson && (
        <AddPersonModal
          childName={child.name}
          onClose={() => setAddingPerson(false)}
          onAdd={(person) => {
            const id = `p-${Date.now()}`;
            setAdded((a) => [...a, { ...person, id, childId: child.id, isPrimary: false }]);
            setPendingIds((i) => [...i, id]);
            setAddingPerson(false);
          }}
        />
      )}

      {filling && (
        <FormFill
          template={filling.template}
          child={child}
          previous={filling.previous}
          onClose={() => setFilling(null)}
          onDone={flash}
        />
      )}

      {viewing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setViewing(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="sv-title" className="bg-surface rounded-t-[calc(var(--t-radius)+0.5rem)] sm:rounded-[calc(var(--t-radius)+0.25rem)] shadow-2xl w-full sm:max-w-2xl max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <header className="px-5 sm:px-6 py-4 border-b border-line flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono uppercase tracking-widest text-muted">For {child.name}</p>
                <h2 id="sv-title" className="text-lg font-bold text-brand">{TEMPLATE[viewing.formId].name}</h2>
              </div>
              <button onClick={() => setViewing(null)} aria-label="Close" className="w-11 h-11 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><X size={20} aria-hidden /></button>
            </header>
            <div className="overflow-y-auto px-5 sm:px-6 py-5">
              <SubmissionView submission={viewing} />
            </div>
          </div>
        </div>
      )}

      {/* Held back while a form is open, so it never sits on top of the send button. */}
      {toast && !filling && !viewing && (
        <div role="status" className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 bg-brand text-white text-sm font-medium px-4 py-3 rounded-card shadow-lg z-50 flex items-center gap-2">
          <Check size={16} className="text-success" aria-hidden /> {toast}
        </div>
      )}
    </div>
  );
}

const RELATIONSHIPS = ["Grandparent", "Aunt / Uncle", "Sibling (18+)", "Family friend", "Nanny / Sitter", "Other"];

function AddPersonModal({ childName, onClose, onAdd }: { childName: string; onClose: () => void; onAdd: (p: { name: string; relationship: string; phone: string }) => void }) {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState(RELATIONSHIPS[0]);
  const [phone, setPhone] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const digits = phone.replace(/\D/g, "");
  const phoneOk = digits.length === 10;
  const ready = name.trim().length > 1 && phoneOk && confirmed;

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };

  const inputCls = "w-full min-h-11 border border-line rounded-ctl px-3.5 text-base bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";
  const labelCls = "text-xs font-mono uppercase tracking-widest text-muted block mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="ap-title" className="bg-surface rounded-t-[calc(var(--t-radius)+0.5rem)] sm:rounded-[calc(var(--t-radius)+0.25rem)] shadow-2xl w-full sm:max-w-md p-5 sm:p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 id="ap-title" className="text-lg font-bold text-brand">Add an authorized pickup</h2>
            <p className="text-sm text-muted">Someone who may collect {childName.split(" ")[0]}.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><X size={20} aria-hidden /></button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); if (ready) onAdd({ name: name.trim(), relationship, phone: formatPhone(phone) }); }}
        >
          <div>
            <label htmlFor="ap-name" className={labelCls}>Full name</label>
            <input id="ap-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="As it appears on their ID" className={inputCls} />
          </div>

          <div>
            <label htmlFor="ap-rel" className={labelCls}>Relationship</label>
            <select id="ap-rel" value={relationship} onChange={(e) => setRelationship(e.target.value)} className={inputCls}>
              {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="ap-phone" className={labelCls}>Mobile phone</label>
            <input id="ap-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="(000) 000-0000" className={inputCls} />
            {phone.length > 0 && !phoneOk && <p className="text-sm text-danger mt-1">Enter a 10-digit phone number.</p>}
          </div>

          <label className="flex items-start gap-3 text-sm text-ink cursor-pointer">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 w-4 h-4 accent-accent flex-shrink-0" />
            <span>I authorize this person to pick up {childName.split(" ")[0]}, and I understand the center will ask them for photo ID.</span>
          </label>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 min-h-12 rounded-ctl border border-line text-muted hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Cancel</button>
            <button type="submit" disabled={!ready} className="flex-1 min-h-12 rounded-ctl bg-brand text-white font-semibold hover:bg-brand-hover disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent">Add person</button>
          </div>
        </form>
      </div>
    </div>
  );
}
