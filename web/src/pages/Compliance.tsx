import { useState } from "react";
import { staff, type Incident } from "../data";
import { useRoster } from "../roster";
import { useIncidents } from "../incidents";
import { useLogs } from "../logs";
import { SignaturePad } from "../signature";
import IncidentForm from "./IncidentForm";

type Props = { facilityId: string };

export default function Compliance({ facilityId }: Props) {
  const { roster: children, setImmunization } = useRoster();
  const { at, sign } = useIncidents();
  const { entries } = useLogs();
  const [tab, setTab] = useState<"dashboard" | "incidents" | "log">("dashboard");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [guardianSig, setGuardianSig] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const centerIncidents = at(facilityId);
  const centerChildren = children.filter((c) => c.facilityId === facilityId);
  const centerStaff = staff.filter((s) => s.facilityId === facilityId);

  const immIssues = centerChildren.filter((c) => c.immunizationStatus !== "current");
  const certIssues = centerStaff.flatMap((s) =>
    s.certifications.filter((c) => c.status !== "valid").map((c) => ({ staff: s.name, cert: c.name, status: c.status, expiry: c.expiry }))
  );
  const bgIssues = centerStaff.filter((s) => s.backgroundScreening.status !== "clear");
  const unsigned = centerIncidents.filter((i) => !i.guardianSigned);

  const flash = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2800);
  };

  // One point per open item, off a clean 100. Nothing clever — but it moves
  // when you fix something, which the hardcoded 89% never did.
  const openItems = immIssues.length + certIssues.length + bgIssues.length + unsigned.length;
  const score = Math.max(0, 100 - openItems * 4);
  const scoreColor = score >= 95 ? "text-success" : score >= 85 ? "text-warning" : "text-danger";

  const receiveImmunization = (childId: string, name: string) => {
    setImmunization(childId, "current");
    flash(`DH 680 marked received for ${name.split(" ")[0]}`);
  };

  /**
   * The audit trail is assembled from what actually happened rather than kept
   * as its own list — incidents filed, medication given, and the compliance
   * flags currently standing against children and staff.
   */
  const today = new Date().toISOString().slice(0, 10);
  const auditEvents: { id: string; ts: string; event: string; detail: string; user: string; type: string }[] = [
    ...centerIncidents.map((i) => ({
      id: `inc-${i.id}`,
      ts: `${i.date}${i.time ? ` ${i.time}` : ""}`,
      event: "Incident logged",
      detail: `${i.type} — ${i.childName}. ${i.guardianNotified ? "Guardian notified" : "Guardian not yet notified"}${i.guardianSigned ? " and signed" : ""}.`,
      user: i.reportedBy,
      type: "incident",
    })),
    ...entries
      .filter((e) => e.facilityId === facilityId && (e.type === "medication" || e.type === "incident"))
      .map((e) => ({
        id: `log-${e.id}`,
        ts: `${today} ${e.timestamp}`,
        event: e.type === "medication" ? "Medication given" : "Incident noted",
        detail: `${e.childName} — ${e.title ?? e.detail}`,
        user: e.loggedBy,
        type: e.type === "medication" ? "info" : "warning",
      })),
    ...immIssues.map((c) => ({
      id: `imm-${c.id}`,
      ts: c.enrollmentDate,
      event: "Immunization flag",
      detail: `${c.name} DH 680 ${c.immunizationStatus === "missing" ? "missing — child may be excluded after 30 days" : "expires soon"}`,
      user: "System",
      type: "alert",
    })),
    ...certIssues.map((c, i) => ({
      id: `cert-${i}`,
      ts: c.expiry,
      event: c.status === "expired" ? "Cert expired" : "Cert expiring",
      detail: `${c.staff} — ${c.cert} ${c.status === "expired" ? "expired" : "expires"} ${c.expiry}`,
      user: "System",
      type: c.status === "expired" ? "alert" : "warning",
    })),
    ...bgIssues.map((s) => ({
      id: `bg-${s.id}`,
      ts: s.backgroundScreening.expiresDate,
      event: "Background screening",
      detail: `${s.name} Level 2 screening — status: ${s.backgroundScreening.status}`,
      user: "System",
      type: "warning",
    })),
  ].sort((a, b) => b.ts.localeCompare(a.ts));

  const applyGuardianSignature = () => {
    if (!selectedIncident || !guardianSig) return;
    sign(selectedIncident.id, guardianSig);
    flash(`Signature recorded for ${selectedIncident.childName.split(" ")[0]}`);
    setGuardianSig(null);
    setSelectedIncident(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <p className="text-sm font-mono text-muted uppercase tracking-widest mb-1">Compliance</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand">Florida Compliance Dashboard</h1>
        <p className="text-muted mt-1">Rule pack: Florida (FL Statute §402.305 · Fla. Admin. Code Ch. 65C-22)</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-line p-1 rounded-ctl w-fit">
        {(["dashboard", "incidents", "log"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 min-h-10 rounded-ctl text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent capitalize ${tab === t ? "bg-surface text-brand shadow-sm" : "text-muted hover:text-brand"}`}>
            {t === "dashboard" ? "Overview" : t === "incidents" ? "Incidents" : "Audit Log"}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="space-y-6">
          {/* Compliance score */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: "Overall Score", value: `${score}%`, color: scoreColor, sub: openItems === 0 ? "Everything is clear" : `${openItems} open item${openItems === 1 ? "" : "s"} require action` },
              { label: "Incidents This Month", value: `${centerIncidents.length}`, color: "text-danger", sub: `${unsigned.length} pending guardian signature` },
              { label: "Staff Compliance", value: `${centerStaff.length - bgIssues.length}/${centerStaff.length}`, color: "text-accent", sub: "fully cleared staff" },
            ].map((k) => (
              <div key={k.label} className="bg-surface border border-line rounded-card p-5">
                <p className="text-xs font-mono uppercase tracking-widest text-muted mb-2">{k.label}</p>
                <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-muted mt-1">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Immunization */}
          <div className="bg-surface border border-line rounded-card overflow-hidden">
            <div className="px-6 py-4 border-b border-line flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-brand">Immunization Status (DH 680)</h2>
                <p className="text-xs text-muted mt-0.5">Required within 30 days of enrollment · FL requirement</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${immIssues.length === 0 ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>
                {immIssues.length} issue{immIssues.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="divide-y divide-line">
              {immIssues.length === 0 ? (
                <div className="px-6 py-4 text-sm text-success font-medium">✓ All children have current immunization documentation on file.</div>
              ) : (
                immIssues.map((c) => (
                  <div key={c.id} className="px-6 py-3.5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-brand">{c.name}</p>
                      <p className="text-xs text-muted">{c.room} · Enrolled {c.enrollmentDate}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.immunizationStatus === "missing" ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"}`}>
                        {c.immunizationStatus === "missing" ? "MISSING — exclude after 30 days" : "Expires soon"}
                      </span>
                      <button onClick={() => receiveImmunization(c.id, c.name)} className="text-xs font-medium text-accent min-h-10 px-2.5 rounded-ctl hover:bg-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Mark received</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Staff Certifications */}
          <div className="bg-surface border border-line rounded-card overflow-hidden">
            <div className="px-6 py-4 border-b border-line">
              <h2 className="font-semibold text-brand">Staff Certifications &amp; Background Screening</h2>
              <p className="text-xs text-muted mt-0.5">Level 2 background screening required — rescreening every 5 years (FL DCF)</p>
            </div>
            <div className="divide-y divide-line">
              {centerStaff.map((s) => {
                const anyIssue = s.certifications.some((c) => c.status !== "valid") || s.backgroundScreening.status !== "clear";
                return (
                  <div key={s.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-brand">{s.name} <span className="text-xs text-muted font-normal">· {s.role}</span></p>
                        <p className="text-xs text-muted">{s.room}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${anyIssue ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}`}>
                        {anyIssue ? "Action required" : "✓ Clear"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-ctl font-mono ${
                        s.backgroundScreening.status === "clear" ? "bg-success-soft text-success" :
                        s.backgroundScreening.status === "pending" ? "bg-danger-soft text-danger" :
                        "bg-danger-soft text-danger"
                      }`}>
                        Level 2 BG: {s.backgroundScreening.status === "clear" ? `Clear · expires ${s.backgroundScreening.expiresDate}` : s.backgroundScreening.status.toUpperCase()}
                      </span>
                      {s.certifications.map((cert) => (
                        <span key={cert.name} className={`text-xs px-2.5 py-1 rounded-ctl font-mono ${
                          cert.status === "valid" ? "bg-surface-2 text-muted" :
                          cert.status === "expiring-soon" ? "bg-warning-soft text-warning" :
                          "bg-danger-soft text-danger"
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
          <div className="bg-surface-2 border border-line rounded-card p-5">
            <p className="font-semibold text-brand mb-3 text-sm">Florida Staff-to-Child Ratio Requirements</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { age: "Infants", range: "Under 18 months", ratio: "1:4" },
                { age: "Toddlers", range: "18–36 months", ratio: "1:6" },
                { age: "Preschool", range: "3–5 years", ratio: "1:15" },
                { age: "School-Age", range: "6+ years", ratio: "1:20" },
              ].map((r) => (
                <div key={r.age} className="bg-surface rounded-card p-3 text-center">
                  <p className="font-bold text-2xl text-accent">{r.ratio}</p>
                  <p className="text-xs font-semibold text-brand mt-1">{r.age}</p>
                  <p className="text-xs text-muted">{r.range}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted mt-3">Ratios apply at all times including naps, transitions, and outdoor play. In mixed-age rooms, the youngest child's ratio governs the entire room.</p>
          </div>
        </div>
      )}

      {tab === "incidents" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">{centerIncidents.length} incidents this month</p>
            <button onClick={() => setShowForm(true)} className="bg-brand text-white text-sm font-medium px-4 py-2.5 min-h-11 rounded-ctl hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent transition-colors">
              + Log Incident
            </button>
          </div>
          {centerIncidents.length === 0 && (
            <div className="border-2 border-dashed border-line rounded-card p-10 text-center text-sm text-muted">No incidents logged this month.</div>
          )}
          {centerIncidents.map((inc) => (
            <button
              key={inc.id}
              onClick={() => setSelectedIncident(inc)}
              className="w-full bg-surface border border-line rounded-card p-5 text-left hover:border-accent transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${inc.severity === "high" ? "bg-danger" : inc.severity === "medium" ? "bg-warning" : "bg-muted"}`} />
                    <span className="font-semibold text-brand">{inc.type}</span>
                    <span className="text-xs text-muted">· {inc.childName}</span>
                  </div>
                  <p className="text-sm text-ink">{inc.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                  <span className="font-mono text-xs text-muted">{inc.date}</span>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${inc.guardianNotified ? "bg-success-soft text-success" : "bg-surface-2 text-muted"}`}>
                      {inc.guardianNotified ? "✓ Notified" : "Not notified"}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${inc.guardianSigned ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>
                      {inc.guardianSigned ? "✓ Signed" : "Sig. pending"}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted">Reported by {inc.reportedBy}</p>
            </button>
          ))}

          {selectedIncident && (
            <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-end" onClick={() => { setSelectedIncident(null); setGuardianSig(null); }}>
              <div className="bg-surface h-full w-full sm:w-96 shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-5 border-b border-line flex items-start justify-between">
                  <h2 className="text-lg font-bold text-brand">Incident Report</h2>
                  <button onClick={() => { setSelectedIncident(null); setGuardianSig(null); }} className="text-muted hover:text-brand text-xl">×</button>
                </div>
                <div className="p-6 space-y-5">
                  {[
                    { label: "Child", value: selectedIncident.childName },
                    { label: "When", value: [selectedIncident.date, selectedIncident.time].filter(Boolean).join(" · ") },
                    { label: "Where", value: selectedIncident.location },
                    { label: "Type", value: selectedIncident.type },
                    { label: "Severity", value: selectedIncident.severity.toUpperCase() },
                    { label: "Reported By", value: selectedIncident.reportedBy },
                    { label: "Staff who saw it", value: selectedIncident.witnesses },
                    { label: "What happened", value: selectedIncident.description },
                    { label: "What was done", value: selectedIncident.actionTaken },
                    {
                      label: "Guardian notified",
                      value: selectedIncident.guardianNotified
                        ? `Yes${selectedIncident.notifiedMethod ? ` · ${selectedIncident.notifiedMethod.replace("-", " ")}` : ""}${selectedIncident.notifiedAt ? ` · ${selectedIncident.notifiedAt}` : ""}`
                        : "Not yet — office follow-up needed",
                    },
                  ]
                    .filter((r) => r.value)
                    .map((r) => (
                      <div key={r.label}>
                        <p className="text-xs font-mono text-muted uppercase tracking-widest mb-1">{r.label}</p>
                        <p className="text-sm text-ink">{r.value}</p>
                      </div>
                    ))}

                  {selectedIncident.staffSignature && (
                    <div>
                      <p className="text-xs font-mono text-muted uppercase tracking-widest mb-1">Staff signature</p>
                      <img src={selectedIncident.staffSignature} alt={`Signature of ${selectedIncident.reportedBy}`} className="w-full border border-line rounded-card bg-surface-2" />
                    </div>
                  )}

                  {selectedIncident.guardianSigned ? (
                    <div className="bg-success-soft border border-success rounded-card p-4">
                      <p className="text-sm font-semibold text-success">Guardian signature on file</p>
                      {selectedIncident.guardianSignature && (
                        <img src={selectedIncident.guardianSignature} alt="Guardian signature" className="mt-2 w-full border border-line rounded-card bg-surface" />
                      )}
                    </div>
                  ) : (
                    <div className="bg-warning-soft border border-warning-line rounded-card p-4">
                      <p className="text-sm font-semibold text-warning">Guardian signature required</p>
                      <p className="text-xs text-warning-strong mt-1 mb-3">
                        Collect it here when {selectedIncident.childName.split(" ")[0]} is picked up, or send a request through Messaging.
                      </p>
                      <SignaturePad value={guardianSig} onChange={setGuardianSig} label="Guardian signature" placeholder="Hand the device to the guardian" height={120} />
                      <button
                        onClick={applyGuardianSignature}
                        disabled={!guardianSig}
                        className="mt-3 w-full min-h-11 bg-warning text-white rounded-ctl text-sm font-semibold hover:bg-warning-strong disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent transition-colors"
                      >
                        Record signature
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "log" && (
        <div className="bg-surface border border-line rounded-card overflow-hidden">
          <div className="px-6 py-4 border-b border-line">
            <h2 className="font-semibold text-brand">Audit Log</h2>
            <p className="text-xs text-muted mt-0.5">All compliance-relevant events · retained indefinitely per Florida default</p>
          </div>
          <div className="divide-y divide-line">
            {auditEvents.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-muted">Nothing recorded yet.</p>
            )}
            {auditEvents.map((e) => (
              <div key={e.id} className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <span className="font-mono text-xs text-muted w-36 flex-shrink-0">{e.ts}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-mono flex-shrink-0 self-start ${
                  e.type === "alert" ? "bg-danger-soft text-danger" :
                  e.type === "incident" ? "bg-warning-soft text-warning" :
                  e.type === "warning" ? "bg-warning-soft text-warning" :
                  "bg-surface-2 text-muted"
                }`}>{e.event}</span>
                <span className="text-sm text-ink flex-1">{e.detail}</span>
                <span className="text-xs text-muted flex-shrink-0">{e.user}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <IncidentForm facilityId={facilityId} onClose={() => setShowForm(false)} onSaved={flash} />
      )}

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand text-white text-sm font-medium px-4 py-3 rounded-card shadow-lg z-50">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
