import { useState } from "react";
import { AlertTriangle, Check, FileText, Phone, Plus, ShieldCheck, Star, UserRound } from "lucide-react";
import { authorizedPickups, childDocuments, children } from "../../data";
import { ChildSwitcher, useSelectedChild } from "./childSwitcher";

export default function ParentFamily() {
  const [childId, setChildId] = useSelectedChild();
  const child = children.find((c) => c.id === childId) ?? children[0];
  const docs = childDocuments.filter((d) => d.childId === child.id);
  const pickups = authorizedPickups.filter((p) => p.childId === child.id);
  const [signed, setSigned] = useState<string[]>([]);

  const docStatus = (d: typeof docs[0]) => (signed.includes(d.id) ? "on-file" : d.status);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-brand mb-4">Family</h1>
      <ChildSwitcher value={childId} onChange={setChildId} />

      {/* Child profile */}
      <div className="bg-white border border-line rounded-[calc(var(--t-radius)+0.25rem)] p-5 mb-6">
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
        <p className="text-xs text-muted mt-3">To change allergies, medications, or your child's room, message the office — teachers can't edit these.</p>
      </div>

      {/* Documents */}
      <section aria-labelledby="docs-h" className="mb-6">
        <h2 id="docs-h" className="font-semibold text-brand mb-3">Documents &amp; forms</h2>
        <ul className="space-y-2">
          {docs.map((d) => {
            const s = docStatus(d);
            const style = s === "on-file" ? { bg: "bg-success-soft", fg: "text-success", Icon: Check, label: `On file${d.date ? ` · ${d.date}` : ""}` }
              : s === "needs-signature" ? { bg: "bg-warning-soft", fg: "text-warning", Icon: FileText, label: "Needs your signature" }
              : s === "expires-soon" ? { bg: "bg-warning-soft", fg: "text-warning", Icon: AlertTriangle, label: `Expires ${d.date} · upload a new one` }
              : { bg: "bg-danger-soft", fg: "text-danger", Icon: AlertTriangle, label: d.required ? "Missing · required" : "Not on file · optional" };
            return (
              <li key={d.id} className="bg-white border border-line rounded-[calc(var(--t-radius)+0.25rem)] p-4 flex items-center gap-3">
                <div className={`w-11 h-11 rounded-card flex items-center justify-center flex-shrink-0 ${style.bg} ${style.fg}`}><style.Icon size={22} aria-hidden /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brand text-sm sm:text-base">{d.name}{d.formCode && <span className="text-xs font-mono text-muted ml-2">{d.formCode}</span>}</p>
                  <p className={`text-xs ${style.fg}`}>{style.label}</p>
                </div>
                {s === "needs-signature" && (
                  <button onClick={() => setSigned((x) => [...x, d.id])} className="text-xs font-semibold px-3 py-2 rounded-ctl bg-brand text-white min-h-10 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Sign</button>
                )}
                {(s === "missing" || s === "expires-soon") && (
                  <button className="text-xs font-semibold px-3 py-2 rounded-ctl border border-line text-brand min-h-10 flex-shrink-0 hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Upload</button>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mt-3 bg-surface-2 rounded-card p-3 text-xs text-muted flex gap-2">
          <ShieldCheck size={16} className="text-accent flex-shrink-0 mt-0.5" aria-hidden />
          <p>Florida requires a current immunization certificate (DH 680) within 30 days of enrollment. We'll remind you 30 days before it expires.</p>
        </div>
      </section>

      {/* Authorized pickups */}
      <section aria-labelledby="pickup-h">
        <div className="flex items-center justify-between mb-3">
          <h2 id="pickup-h" className="font-semibold text-brand">Authorized pickups</h2>
          <button className="inline-flex items-center gap-1.5 text-sm font-medium text-accent min-h-10 px-2 rounded-ctl hover:bg-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><Plus size={16} aria-hidden /> Add person</button>
        </div>
        <ul className="space-y-2">
          {pickups.map((p) => (
            <li key={p.id} className="bg-white border border-line rounded-[calc(var(--t-radius)+0.25rem)] p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-brand-soft text-brand flex items-center justify-center flex-shrink-0"><UserRound size={22} aria-hidden /></div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-brand flex items-center gap-1.5">{p.name}{p.isPrimary && <Star size={14} className="text-warning fill-warning" aria-label="Primary guardian" />}</p>
                <p className="text-xs text-muted">{p.relationship} · {p.phone}</p>
              </div>
              <a href={`tel:${p.phone.replace(/\D/g, "")}`} aria-label={`Call ${p.name}`} className="w-11 h-11 rounded-card flex items-center justify-center text-accent hover:bg-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><Phone size={20} aria-hidden /></a>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted mt-3">Anyone picking up must be on this list and show photo ID. Staff will call you if someone not listed arrives.</p>
      </section>
    </div>
  );
}
