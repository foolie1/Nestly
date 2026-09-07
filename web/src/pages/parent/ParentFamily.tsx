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
      <h1 className="text-2xl sm:text-3xl font-bold text-[#1e2d4e] mb-4">Family</h1>
      <ChildSwitcher value={childId} onChange={setChildId} />

      {/* Child profile */}
      <div className="bg-white border border-[#e2dfd8] rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#e8f4f4] flex items-center justify-center text-2xl" aria-hidden>🧒</div>
          <div>
            <h2 className="text-lg font-bold text-[#1e2d4e]">{child.name}</h2>
            <p className="text-sm text-[#6b6860]">Born {child.dob} · {child.room}</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div className="bg-[#f3f2ee] rounded-xl p-3"><dt className="text-xs text-[#6b6860]">Enrolled since</dt><dd className="font-medium text-[#1e2d4e]">{child.enrollmentDate}</dd></div>
          <div className="bg-[#f3f2ee] rounded-xl p-3"><dt className="text-xs text-[#6b6860]">Allergies</dt><dd className="font-medium text-[#1e2d4e]">None on file</dd></div>
        </dl>
        <p className="text-xs text-[#6b6860] mt-3">To change allergies, medications, or your child's room, message the office — teachers can't edit these.</p>
      </div>

      {/* Documents */}
      <section aria-labelledby="docs-h" className="mb-6">
        <h2 id="docs-h" className="font-semibold text-[#1e2d4e] mb-3">Documents &amp; forms</h2>
        <ul className="space-y-2">
          {docs.map((d) => {
            const s = docStatus(d);
            const style = s === "on-file" ? { bg: "bg-[#dcfce7]", fg: "text-[#16a34a]", Icon: Check, label: `On file${d.date ? ` · ${d.date}` : ""}` }
              : s === "needs-signature" ? { bg: "bg-[#fef3c7]", fg: "text-[#d97706]", Icon: FileText, label: "Needs your signature" }
              : s === "expires-soon" ? { bg: "bg-[#fef3c7]", fg: "text-[#d97706]", Icon: AlertTriangle, label: `Expires ${d.date} · upload a new one` }
              : { bg: "bg-[#fee2e2]", fg: "text-[#dc2626]", Icon: AlertTriangle, label: d.required ? "Missing · required" : "Not on file · optional" };
            return (
              <li key={d.id} className="bg-white border border-[#e2dfd8] rounded-2xl p-4 flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg} ${style.fg}`}><style.Icon size={22} aria-hidden /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1e2d4e] text-sm sm:text-base">{d.name}{d.formCode && <span className="text-xs font-mono text-[#6b6860] ml-2">{d.formCode}</span>}</p>
                  <p className={`text-xs ${style.fg}`}>{style.label}</p>
                </div>
                {s === "needs-signature" && (
                  <button onClick={() => setSigned((x) => [...x, d.id])} className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#1e2d4e] text-white min-h-10 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173]">Sign</button>
                )}
                {(s === "missing" || s === "expires-soon") && (
                  <button className="text-xs font-semibold px-3 py-2 rounded-lg border border-[#e2dfd8] text-[#1e2d4e] min-h-10 flex-shrink-0 hover:border-[#0f7173] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173]">Upload</button>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mt-3 bg-[#f3f2ee] rounded-xl p-3 text-xs text-[#6b6860] flex gap-2">
          <ShieldCheck size={16} className="text-[#0f7173] flex-shrink-0 mt-0.5" aria-hidden />
          <p>Florida requires a current immunization certificate (DH 680) within 30 days of enrollment. We'll remind you 30 days before it expires.</p>
        </div>
      </section>

      {/* Authorized pickups */}
      <section aria-labelledby="pickup-h">
        <div className="flex items-center justify-between mb-3">
          <h2 id="pickup-h" className="font-semibold text-[#1e2d4e]">Authorized pickups</h2>
          <button className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0f7173] min-h-10 px-2 rounded-lg hover:bg-[#e8f4f4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173]"><Plus size={16} aria-hidden /> Add person</button>
        </div>
        <ul className="space-y-2">
          {pickups.map((p) => (
            <li key={p.id} className="bg-white border border-[#e2dfd8] rounded-2xl p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#e0e7ff] text-[#1e2d4e] flex items-center justify-center flex-shrink-0"><UserRound size={22} aria-hidden /></div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1e2d4e] flex items-center gap-1.5">{p.name}{p.isPrimary && <Star size={14} className="text-[#d97706] fill-[#d97706]" aria-label="Primary guardian" />}</p>
                <p className="text-xs text-[#6b6860]">{p.relationship} · {p.phone}</p>
              </div>
              <a href={`tel:${p.phone.replace(/\D/g, "")}`} aria-label={`Call ${p.name}`} className="w-11 h-11 rounded-xl flex items-center justify-center text-[#0f7173] hover:bg-[#e8f4f4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173]"><Phone size={20} aria-hidden /></a>
            </li>
          ))}
        </ul>
        <p className="text-xs text-[#6b6860] mt-3">Anyone picking up must be on this list and show photo ID. Staff will call you if someone not listed arrives.</p>
      </section>
    </div>
  );
}
