import { useRef, useState } from "react";
import { AlertTriangle, Check, Clock, FileText, Paperclip, Phone, Plus, ShieldCheck, Star, Trash2, UserRound, X } from "lucide-react";
import { authorizedPickups, childDocuments, children, type AuthorizedPickup } from "../../data";
import { ChildSwitcher, useSelectedChild } from "./childSwitcher";

type Upload = { docId: string; fileName: string; on: string };

const MAX_MB = 10;
const ACCEPT = "image/png,image/jpeg,image/heic,application/pdf";

export default function ParentFamily() {
  const [childId, setChildId] = useSelectedChild();
  const child = children.find((c) => c.id === childId) ?? children[0];
  const docs = childDocuments.filter((d) => d.childId === child.id);

  const [signed, setSigned] = useState<string[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [added, setAdded] = useState<AuthorizedPickup[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [addingPerson, setAddingPerson] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);
  const targetDoc = useRef<string | null>(null);

  const pickups = [...authorizedPickups.filter((p) => p.childId === child.id), ...added.filter((p) => p.childId === child.id)];
  const uploadFor = (docId: string) => uploads.find((u) => u.docId === docId);
  const docStatus = (d: (typeof docs)[0]) =>
    signed.includes(d.id) || uploadFor(d.id) ? "on-file" : d.status;

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
          <div className="bg-surface-2 rounded-card p-3"><dt className="text-xs text-muted">Allergies</dt><dd className="font-medium text-brand">None on file</dd></div>
        </dl>
        <p className="text-xs text-muted mt-3">To change allergies, medications, or your child's room, send the office a request — teachers can't edit these.</p>
      </div>

      {/* Documents */}
      <section aria-labelledby="docs-h" className="mb-6">
        <h2 id="docs-h" className="font-semibold text-brand mb-3">Documents &amp; forms</h2>

        {uploadError && (
          <div role="alert" className="mb-2 bg-danger-soft border border-danger-line text-danger-strong text-sm rounded-card px-4 py-3">{uploadError}</div>
        )}

        <ul className="space-y-2">
          {docs.map((d) => {
            const up = uploadFor(d.id);
            const s = docStatus(d);
            const style = up
              ? { bg: "bg-info-soft", fg: "text-info", Icon: Clock, label: `Uploaded ${up.on} · pending office review` }
              : s === "on-file"
                ? { bg: "bg-success-soft", fg: "text-success", Icon: Check, label: `On file${d.date ? ` · ${d.date}` : ""}` }
                : s === "needs-signature"
                  ? { bg: "bg-warning-soft", fg: "text-warning", Icon: FileText, label: "Needs your signature" }
                  : s === "expires-soon"
                    ? { bg: "bg-warning-soft", fg: "text-warning", Icon: AlertTriangle, label: `Expires ${d.date} · upload a new one` }
                    : { bg: "bg-danger-soft", fg: "text-danger", Icon: AlertTriangle, label: d.required ? "Missing · required" : "Not on file · optional" };
            const canUpload = !up && (s === "missing" || s === "expires-soon");
            return (
              <li key={d.id} className="bg-surface border border-line rounded-[calc(var(--t-radius)+0.25rem)] p-4 flex items-center gap-3">
                <div className={`w-11 h-11 rounded-card flex items-center justify-center flex-shrink-0 ${style.bg} ${style.fg}`}><style.Icon size={22} aria-hidden /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brand text-sm sm:text-base">{d.name}{d.formCode && <span className="text-xs font-mono text-muted ml-2">{d.formCode}</span>}</p>
                  <p className={`text-xs ${style.fg}`}>{style.label}</p>
                  {up && (
                    <p className="text-xs text-muted mt-1 flex items-center gap-1 min-w-0">
                      <Paperclip size={12} className="flex-shrink-0" aria-hidden />
                      <span className="truncate">{up.fileName}</span>
                      <button onClick={() => setUploads((u) => u.filter((x) => x.docId !== d.id))} className="ml-1 text-danger hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-danger rounded flex-shrink-0">Remove</button>
                    </p>
                  )}
                </div>
                {s === "needs-signature" && (
                  <button onClick={() => setSigned((x) => [...x, d.id])} className="text-xs font-semibold px-3 py-2 rounded-ctl bg-brand text-white min-h-10 flex-shrink-0 hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Sign</button>
                )}
                {canUpload && (
                  <button onClick={() => chooseFile(d.id)} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-ctl border border-line text-brand min-h-10 flex-shrink-0 hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    <Paperclip size={14} aria-hidden /> Upload
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        <p className="text-xs text-muted mt-2 px-1">Photos or PDFs, up to {MAX_MB} MB. A clear phone photo of the form works fine.</p>

        <div className="mt-3 bg-surface-2 rounded-card p-3 text-xs text-muted flex gap-2">
          <ShieldCheck size={16} className="text-accent flex-shrink-0 mt-0.5" aria-hidden />
          <p>Florida requires a current immunization certificate (DH 680) within 30 days of enrollment. We'll remind you 30 days before it expires.</p>
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
