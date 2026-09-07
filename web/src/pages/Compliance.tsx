import { useState } from "react";
import { incidents, children, staff } from "../data";

type Props = { facilityId: string };

export default function Compliance({ facilityId }: Props) {
  const [tab, setTab] = useState<"dashboard" | "incidents" | "log">("dashboard");
  const [selectedIncident, setSelectedIncident] = useState<typeof incidents[0] | null>(null);
  const centerIncidents = incidents.filter((i) => i.facilityId === facilityId);
  const centerChildren = children.filter((c) => c.facilityId === facilityId);
  const centerStaff = staff.filter((s) => s.facilityId === facilityId);

  const immIssues = centerChildren.filter((c) => c.immunizationStatus !== "current");
  const certIssues = centerStaff.flatMap((s) =>
    s.certifications.filter((c) => c.status !== "valid").map((c) => ({ staff: s.name, cert: c.name, status: c.status, expiry: c.expiry }))
  );
  const bgIssues = centerStaff.filter((s) => s.backgroundScreening.status !== "clear");

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <p className="text-sm font-mono text-[#6b6860] uppercase tracking-widest mb-1">Compliance</p>
        <h1 className="text-3xl font-bold text-[#1e2d4e]">Florida Compliance Dashboard</h1>
        <p className="text-[#6b6860] mt-1">Rule pack: Florida (FL Statute §402.305 · Fla. Admin. Code Ch. 65C-22)</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#e2dfd8] p-1 rounded-lg w-fit">
        {(["dashboard", "incidents", "log"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${tab === t ? "bg-white text-[#1e2d4e] shadow-sm" : "text-[#6b6860] hover:text-[#1e2d4e]"}`}>
            {t === "dashboard" ? "Overview" : t === "incidents" ? "Incidents" : "Audit Log"}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="space-y-6">
          {/* Compliance score */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Overall Score", value: "89%", color: "text-[#d97706]", sub: "2 open items require action" },
              { label: "Incidents This Month", value: `${centerIncidents.length}`, color: "text-[#dc2626]", sub: `${centerIncidents.filter((i) => !i.guardianSigned).length} pending guardian signature` },
              { label: "Staff Compliance", value: `${centerStaff.length - bgIssues.length}/${centerStaff.length}`, color: "text-[#0f7173]", sub: "fully cleared staff" },
            ].map((k) => (
              <div key={k.label} className="bg-white border border-[#e2dfd8] rounded-xl p-5">
                <p className="text-xs font-mono uppercase tracking-widest text-[#6b6860] mb-2">{k.label}</p>
                <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-[#6b6860] mt-1">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Immunization */}
          <div className="bg-white border border-[#e2dfd8] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e2dfd8] flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-[#1e2d4e]">Immunization Status (DH 680)</h2>
                <p className="text-xs text-[#6b6860] mt-0.5">Required within 30 days of enrollment · FL requirement</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${immIssues.length === 0 ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#fee2e2] text-[#dc2626]"}`}>
                {immIssues.length} issue{immIssues.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="divide-y divide-[#e2dfd8]">
              {immIssues.length === 0 ? (
                <div className="px-6 py-4 text-sm text-[#16a34a] font-medium">✓ All children have current immunization documentation on file.</div>
              ) : (
                immIssues.map((c) => (
                  <div key={c.id} className="px-6 py-3.5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#1e2d4e]">{c.name}</p>
                      <p className="text-xs text-[#6b6860]">{c.room} · Enrolled {c.enrollmentDate}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.immunizationStatus === "missing" ? "bg-[#fee2e2] text-[#dc2626]" : "bg-[#fef3c7] text-[#d97706]"}`}>
                        {c.immunizationStatus === "missing" ? "MISSING — exclude after 30 days" : "Expires soon"}
                      </span>
                      <button className="text-xs text-[#0f7173] hover:underline">Mark received</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Staff Certifications */}
          <div className="bg-white border border-[#e2dfd8] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e2dfd8]">
              <h2 className="font-semibold text-[#1e2d4e]">Staff Certifications &amp; Background Screening</h2>
              <p className="text-xs text-[#6b6860] mt-0.5">Level 2 background screening required — rescreening every 5 years (FL DCF)</p>
            </div>
            <div className="divide-y divide-[#e2dfd8]">
              {centerStaff.map((s) => {
                const anyIssue = s.certifications.some((c) => c.status !== "valid") || s.backgroundScreening.status !== "clear";
                return (
                  <div key={s.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-[#1e2d4e]">{s.name} <span className="text-xs text-[#6b6860] font-normal">· {s.role}</span></p>
                        <p className="text-xs text-[#6b6860]">{s.room}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${anyIssue ? "bg-[#fee2e2] text-[#dc2626]" : "bg-[#dcfce7] text-[#16a34a]"}`}>
                        {anyIssue ? "Action required" : "✓ Clear"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-mono ${
                        s.backgroundScreening.status === "clear" ? "bg-[#dcfce7] text-[#16a34a]" :
                        s.backgroundScreening.status === "pending" ? "bg-[#fee2e2] text-[#dc2626]" :
                        "bg-[#fee2e2] text-[#dc2626]"
                      }`}>
                        Level 2 BG: {s.backgroundScreening.status === "clear" ? `Clear · expires ${s.backgroundScreening.expiresDate}` : s.backgroundScreening.status.toUpperCase()}
                      </span>
                      {s.certifications.map((cert) => (
                        <span key={cert.name} className={`text-xs px-2.5 py-1 rounded-lg font-mono ${
                          cert.status === "valid" ? "bg-[#f3f2ee] text-[#6b6860]" :
                          cert.status === "expiring-soon" ? "bg-[#fef3c7] text-[#d97706]" :
                          "bg-[#fee2e2] text-[#dc2626]"
                        }`}>
                          {cert.name}: {cert.status === "expired" ? "EXPIRED" : cert.status === "expiring-soon" ? `Expires ${cert.expiry}` : `Valid to ${cert.expiry}`}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Florida Ratios Reference */}
          <div className="bg-[#f3f2ee] border border-[#e2dfd8] rounded-xl p-5">
            <p className="font-semibold text-[#1e2d4e] mb-3 text-sm">Florida Staff-to-Child Ratio Requirements</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { age: "Infants", range: "Under 18 months", ratio: "1:4" },
                { age: "Toddlers", range: "18–36 months", ratio: "1:6" },
                { age: "Preschool", range: "3–5 years", ratio: "1:15" },
                { age: "School-Age", range: "6+ years", ratio: "1:20" },
              ].map((r) => (
                <div key={r.age} className="bg-white rounded-xl p-3 text-center">
                  <p className="font-bold text-2xl text-[#0f7173]">{r.ratio}</p>
                  <p className="text-xs font-semibold text-[#1e2d4e] mt-1">{r.age}</p>
                  <p className="text-xs text-[#6b6860]">{r.range}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#6b6860] mt-3">Ratios apply at all times including naps, transitions, and outdoor play. In mixed-age rooms, the youngest child's ratio governs the entire room.</p>
          </div>
        </div>
      )}

      {tab === "incidents" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6b6860]">{centerIncidents.length} incidents this month</p>
            <button className="bg-[#1e2d4e] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#2a3f6b] transition-colors">
              + Log Incident
            </button>
          </div>
          {centerIncidents.map((inc) => (
            <button
              key={inc.id}
              onClick={() => setSelectedIncident(inc)}
              className="w-full bg-white border border-[#e2dfd8] rounded-xl p-5 text-left hover:border-[#0f7173] transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${inc.severity === "high" ? "bg-[#dc2626]" : inc.severity === "medium" ? "bg-[#d97706]" : "bg-[#6b6860]"}`} />
                    <span className="font-semibold text-[#1e2d4e]">{inc.type}</span>
                    <span className="text-xs text-[#6b6860]">· {inc.childName}</span>
                  </div>
                  <p className="text-sm text-[#1a1a1a]">{inc.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                  <span className="font-mono text-xs text-[#6b6860]">{inc.date}</span>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${inc.guardianNotified ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#f3f2ee] text-[#6b6860]"}`}>
                      {inc.guardianNotified ? "✓ Notified" : "Not notified"}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${inc.guardianSigned ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#fef3c7] text-[#d97706]"}`}>
                      {inc.guardianSigned ? "✓ Signed" : "Sig. pending"}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-[#6b6860]">Reported by {inc.reportedBy}</p>
            </button>
          ))}

          {selectedIncident && (
            <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-end" onClick={() => setSelectedIncident(null)}>
              <div className="bg-white h-full w-96 shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-5 border-b border-[#e2dfd8] flex items-start justify-between">
                  <h2 className="text-lg font-bold text-[#1e2d4e]">Incident Report</h2>
                  <button onClick={() => setSelectedIncident(null)} className="text-[#6b6860] hover:text-[#1e2d4e] text-xl">×</button>
                </div>
                <div className="p-6 space-y-5">
                  {[
                    { label: "Child", value: selectedIncident.childName },
                    { label: "Date", value: selectedIncident.date },
                    { label: "Type", value: selectedIncident.type },
                    { label: "Severity", value: selectedIncident.severity.toUpperCase() },
                    { label: "Reported By", value: selectedIncident.reportedBy },
                    { label: "Description", value: selectedIncident.description },
                  ].map((r) => (
                    <div key={r.label}>
                      <p className="text-xs font-mono text-[#6b6860] uppercase tracking-widest mb-1">{r.label}</p>
                      <p className="text-sm text-[#1a1a1a]">{r.value}</p>
                    </div>
                  ))}
                  {!selectedIncident.guardianSigned && (
                    <div className="bg-[#fef3c7] border border-[#fcd34d] rounded-xl p-4">
                      <p className="text-sm font-semibold text-[#d97706]">Guardian signature required</p>
                      <p className="text-xs text-[#92400e] mt-1">Send a signature request to the guardian via the messaging system.</p>
                      <button className="mt-3 w-full py-2 bg-[#d97706] text-white rounded-lg text-sm font-medium hover:bg-[#b45309] transition-colors">Send Signature Request</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "log" && (
        <div className="bg-white border border-[#e2dfd8] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e2dfd8]">
            <h2 className="font-semibold text-[#1e2d4e]">Audit Log</h2>
            <p className="text-xs text-[#6b6860] mt-0.5">All compliance-relevant events · retained indefinitely per Florida default</p>
          </div>
          <div className="divide-y divide-[#e2dfd8]">
            {[
              { ts: "2026-08-31 08:02", event: "Child check-in", detail: "Amelia Torres checked in by Denise Morales", user: "Denise Morales", type: "info" },
              { ts: "2026-08-30 15:44", event: "Invoice overdue", detail: "Reyes family invoice #inv003 flagged overdue (Aug 2026)", user: "System", type: "warning" },
              { ts: "2026-08-29 11:30", event: "Incident logged", detail: "Minor injury — Noah Patel. Guardian notified and signed.", user: "Denise Morales", type: "incident" },
              { ts: "2026-08-27 14:15", event: "Immunization flag", detail: "James Williams DH 680 missing — child may be excluded after 30 days", user: "System", type: "alert" },
              { ts: "2026-08-25 09:00", event: "Background screening", detail: "Marcus Webb Level 2 screening submitted — status: pending", user: "Center Director", type: "info" },
              { ts: "2026-08-20 08:00", event: "Cert expiration warning", detail: "Rashida Okafor CPR/First Aid expires in 30 days (Sep 20)", user: "System", type: "warning" },
              { ts: "2026-08-15 10:30", event: "Ratio alert resolved", detail: "Clover Preschool ratio 1:16 — resolved within 5 minutes", user: "System", type: "alert" },
            ].map((e, i) => (
              <div key={i} className="px-6 py-3.5 flex items-center gap-4">
                <span className="font-mono text-xs text-[#6b6860] w-36 flex-shrink-0">{e.ts}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-mono flex-shrink-0 ${
                  e.type === "alert" ? "bg-[#fee2e2] text-[#dc2626]" :
                  e.type === "incident" ? "bg-[#fef3c7] text-[#d97706]" :
                  e.type === "warning" ? "bg-[#fef3c7] text-[#d97706]" :
                  "bg-[#f3f2ee] text-[#6b6860]"
                }`}>{e.event}</span>
                <span className="text-sm text-[#1a1a1a] flex-1">{e.detail}</span>
                <span className="text-xs text-[#6b6860] flex-shrink-0">{e.user}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
