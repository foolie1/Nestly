import { useState } from "react";
import { enrollmentLeads, children, EnrollmentLead } from "../data";

type Stage = EnrollmentLead["stage"];
const STAGES: { id: Stage; label: string; color: string }[] = [
  { id: "inquiry", label: "Inquiry", color: "bg-line" },
  { id: "tour", label: "Tour Scheduled", color: "bg-info-soft" },
  { id: "waitlist", label: "Waitlist", color: "bg-warning-soft" },
  { id: "application", label: "Application", color: "bg-purple-soft" },
  { id: "paperwork", label: "Paperwork", color: "bg-warning-soft" },
  { id: "active", label: "Enrolled", color: "bg-success-soft" },
];

type Props = { facilityId: string };

export default function Enrollment({ facilityId }: Props) {
  const [tab, setTab] = useState<"pipeline" | "roster">("pipeline");
  const [selected, setSelected] = useState<EnrollmentLead | null>(null);
  const [showNewInquiry, setShowNewInquiry] = useState(false);
  const [newInquiry, setNewInquiry] = useState({ childName: "", guardianName: "", phone: "", email: "", ageGroup: "", notes: "" });
  const leads = enrollmentLeads.filter((l) => l.facilityId === facilityId);
  const centerChildren = children.filter((c) => c.facilityId === facilityId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-sm font-mono text-muted uppercase tracking-widest mb-1">Enrollment</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand">Enrollment Pipeline</h1>
        </div>
        <button onClick={() => setShowNewInquiry(true)} className="bg-brand text-white text-sm font-medium px-4 py-2.5 min-h-11 rounded-ctl hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent transition-colors">
          + New Inquiry
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-line p-1 rounded-ctl w-fit">
        {(["pipeline", "roster"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 min-h-10 rounded-ctl text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent capitalize ${tab === t ? "bg-white text-brand shadow-sm" : "text-muted hover:text-brand"}`}>
            {t === "pipeline" ? "Pipeline" : "Enrolled Roster"}
          </button>
        ))}
      </div>

      {tab === "pipeline" ? (
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage.id);
            return (
              <div key={stage.id} className="w-60 flex-shrink-0">
                <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg ${stage.color}`}>
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand">{stage.label}</span>
                  <span className="text-xs font-mono bg-white/60 px-1.5 py-0.5 rounded">{stageLeads.length}</span>
                </div>
                <div className="space-y-2 mt-2">
                  {stageLeads.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => setSelected(lead)}
                      className="w-full bg-white border border-line rounded-card p-4 text-left hover:border-accent hover:shadow-sm transition-all"
                    >
                      <p className="font-semibold text-sm text-brand">{lead.childName}</p>
                      <p className="text-xs text-muted mt-0.5">{lead.guardianName}</p>
                      <p className="text-xs text-muted mt-1">{lead.ageGroup}</p>
                      {lead.stage === "paperwork" && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-warning">
                          <span>⚠</span><span>DH 680 pending</span>
                        </div>
                      )}
                      <p className="text-xs font-mono text-muted mt-2">{lead.createdAt}</p>
                    </button>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="border-2 border-dashed border-line rounded-card p-4 text-center text-xs text-muted">Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {centerChildren.map((c) => {
            const imm = c.immunizationStatus === "current" ? { cls: "bg-success-soft text-success", label: "DH 680 current" }
              : c.immunizationStatus === "expires-soon" ? { cls: "bg-warning-soft text-warning", label: "DH 680 expires soon" }
              : { cls: "bg-danger-soft text-danger", label: "DH 680 missing" };
            const tuition = c.tuitionStatus === "current" ? { cls: "bg-success-soft text-success", label: "Paid" }
              : c.tuitionStatus === "pending" ? { cls: "bg-surface-2 text-muted", label: "Pending" }
              : { cls: "bg-danger-soft text-danger", label: "Overdue" };
            return (
              <div key={c.id} className="bg-surface border border-line rounded-[calc(var(--t-radius)+0.25rem)] p-4 flex gap-3 hover:border-accent transition-colors">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${c.checkedIn ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted"}`}>
                  {c.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-brand truncate">{c.name}</p>
                      <p className="text-xs text-muted truncate">{c.room} · since {c.enrollmentDate}</p>
                    </div>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full flex-shrink-0 ${c.checkedIn ? "bg-success-soft text-success" : "bg-surface-2 text-muted"}`}>{c.checkedIn ? "In" : "Out"}</span>
                  </div>
                  <p className="text-sm text-ink mt-2">{c.guardian} <span className="text-xs text-muted font-mono">· {c.guardianPhone}</span></p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${imm.cls}`}>{imm.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tuition.cls}`}>{tuition.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Inquiry Modal */}
      {showNewInquiry && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowNewInquiry(false)}>
          <div className="bg-white rounded-t-[calc(var(--t-radius)+0.5rem)] sm:rounded-[calc(var(--t-radius)+0.25rem)] shadow-2xl w-full sm:max-w-lg p-5 sm:p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-brand mb-5">New Inquiry</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Child's Name</label>
                  <input
                    value={newInquiry.childName}
                    onChange={(e) => setNewInquiry((f) => ({ ...f, childName: e.target.value }))}
                    placeholder="First Last"
                    className="w-full border border-line rounded-ctl px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Guardian Name</label>
                  <input
                    value={newInquiry.guardianName}
                    onChange={(e) => setNewInquiry((f) => ({ ...f, guardianName: e.target.value }))}
                    placeholder="First Last"
                    className="w-full border border-line rounded-ctl px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:border-accent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Phone</label>
                  <input
                    value={newInquiry.phone}
                    onChange={(e) => setNewInquiry((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="(000) 000-0000"
                    className="w-full border border-line rounded-ctl px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Email</label>
                  <input
                    value={newInquiry.email}
                    onChange={(e) => setNewInquiry((f) => ({ ...f, email: e.target.value }))}
                    placeholder="email@example.com"
                    className="w-full border border-line rounded-ctl px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:border-accent"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Age Group</label>
                <select
                  value={newInquiry.ageGroup}
                  onChange={(e) => setNewInquiry((f) => ({ ...f, ageGroup: e.target.value }))}
                  className="w-full border border-line rounded-ctl px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:border-accent"
                >
                  <option value="">Select age group...</option>
                  <option>Infant (0–18 mo)</option>
                  <option>Toddler (18–36 mo)</option>
                  <option>Preschool (3–5 yr)</option>
                  <option>School-Age (6+ yr)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Notes</label>
                <textarea
                  value={newInquiry.notes}
                  onChange={(e) => setNewInquiry((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Desired start date, referral source, questions..."
                  className="w-full border border-line rounded-ctl px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:border-accent resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewInquiry(false)} className="flex-1 py-2 border border-line rounded-ctl text-sm text-muted hover:border-brand transition-colors">Cancel</button>
              <button
                onClick={() => { setShowNewInquiry(false); setNewInquiry({ childName: "", guardianName: "", phone: "", email: "", ageGroup: "", notes: "" }); }}
                className="flex-1 py-2 bg-brand text-white rounded-ctl text-sm font-medium hover:bg-brand-hover transition-colors"
              >
                Add to Inquiry Stage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {selected && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-end" onClick={() => setSelected(null)}>
          <div className="bg-white h-full w-full sm:w-96 shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-line flex items-start justify-between">
              <div>
                <p className="text-xs font-mono text-muted uppercase tracking-widest mb-1">{selected.stage.toUpperCase()}</p>
                <h2 className="text-lg font-bold text-brand">{selected.childName}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted hover:text-brand text-xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-5">
              {[
                { label: "Guardian", value: selected.guardianName },
                { label: "Phone", value: selected.phone },
                { label: "Email", value: selected.email },
                { label: "Age Group", value: selected.ageGroup },
                { label: "Created", value: selected.createdAt },
              ].map((r) => (
                <div key={r.label}>
                  <p className="text-xs font-mono text-muted uppercase tracking-widest mb-1">{r.label}</p>
                  <p className="text-sm text-ink">{r.value}</p>
                </div>
              ))}
              {selected.notes && (
                <div>
                  <p className="text-xs font-mono text-muted uppercase tracking-widest mb-1">Notes</p>
                  <p className="text-sm text-ink bg-surface-2 rounded-ctl p-3">{selected.notes}</p>
                </div>
              )}

              {selected.stage === "paperwork" && (
                <div className="bg-warning-soft border border-warning-line rounded-card p-4">
                  <p className="text-sm font-semibold text-warning mb-1">⚠ Florida DH 680 Required</p>
                  <p className="text-xs text-warning-strong">Immunization certification must be received within 30 days of enrollment start. Child cannot attend until document is on file.</p>
                </div>
              )}

              <div className="pt-2 space-y-2">
                <p className="text-xs font-mono text-muted uppercase tracking-widest mb-2">Move Stage</p>
                <div className="flex flex-wrap gap-2">
                  {STAGES.filter((s) => s.id !== selected.stage).map((s) => (
                    <button key={s.id} className="text-xs px-3 py-1.5 border border-line rounded-ctl hover:border-accent hover:text-accent transition-colors">
                      → {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
