import { useState } from "react";
import { enrollmentLeads, children, EnrollmentLead } from "../data";

type Stage = EnrollmentLead["stage"];
const STAGES: { id: Stage; label: string; color: string }[] = [
  { id: "inquiry", label: "Inquiry", color: "bg-[#e2dfd8]" },
  { id: "tour", label: "Tour Scheduled", color: "bg-[#dbeafe]" },
  { id: "waitlist", label: "Waitlist", color: "bg-[#fef3c7]" },
  { id: "application", label: "Application", color: "bg-[#ede9fe]" },
  { id: "paperwork", label: "Paperwork", color: "bg-[#ffedd5]" },
  { id: "active", label: "Enrolled", color: "bg-[#dcfce7]" },
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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-sm font-mono text-[#6b6860] uppercase tracking-widest mb-1">Enrollment</p>
          <h1 className="text-3xl font-bold text-[#1e2d4e]">Enrollment Pipeline</h1>
        </div>
        <button onClick={() => setShowNewInquiry(true)} className="bg-[#1e2d4e] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#2a3f6b] transition-colors">
          + New Inquiry
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#e2dfd8] p-1 rounded-lg w-fit">
        {(["pipeline", "roster"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${tab === t ? "bg-white text-[#1e2d4e] shadow-sm" : "text-[#6b6860] hover:text-[#1e2d4e]"}`}>
            {t === "pipeline" ? "Pipeline" : "Enrolled Roster"}
          </button>
        ))}
      </div>

      {tab === "pipeline" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage.id);
            return (
              <div key={stage.id} className="w-60 flex-shrink-0">
                <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg ${stage.color}`}>
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#1e2d4e]">{stage.label}</span>
                  <span className="text-xs font-mono bg-white/60 px-1.5 py-0.5 rounded">{stageLeads.length}</span>
                </div>
                <div className="space-y-2 mt-2">
                  {stageLeads.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => setSelected(lead)}
                      className="w-full bg-white border border-[#e2dfd8] rounded-xl p-4 text-left hover:border-[#0f7173] hover:shadow-sm transition-all"
                    >
                      <p className="font-semibold text-sm text-[#1e2d4e]">{lead.childName}</p>
                      <p className="text-xs text-[#6b6860] mt-0.5">{lead.guardianName}</p>
                      <p className="text-xs text-[#6b6860] mt-1">{lead.ageGroup}</p>
                      {lead.stage === "paperwork" && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-[#d97706]">
                          <span>⚠</span><span>DH 680 pending</span>
                        </div>
                      )}
                      <p className="text-xs font-mono text-[#6b6860] mt-2">{lead.createdAt}</p>
                    </button>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="border-2 border-dashed border-[#e2dfd8] rounded-xl p-4 text-center text-xs text-[#6b6860]">Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-[#e2dfd8] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f3f2ee] text-xs font-mono uppercase tracking-wider text-[#6b6860]">
                <th className="px-6 py-3 text-left">Child</th>
                <th className="px-6 py-3 text-left">Guardian</th>
                <th className="px-6 py-3 text-left">Room</th>
                <th className="px-6 py-3 text-left">Enrolled</th>
                <th className="px-6 py-3 text-center">DH 680</th>
                <th className="px-6 py-3 text-center">Tuition</th>
                <th className="px-6 py-3 text-center">Today</th>
              </tr>
            </thead>
            <tbody>
              {centerChildren.map((c) => (
                <tr key={c.id} className="border-t border-[#e2dfd8] hover:bg-[#f9f8f5] transition-colors">
                  <td className="px-6 py-3.5">
                    <p className="font-medium text-[#1e2d4e]">{c.name}</p>
                    <p className="text-xs text-[#6b6860]">DOB {c.dob}</p>
                  </td>
                  <td className="px-6 py-3.5">
                    <p className="text-sm">{c.guardian}</p>
                    <p className="text-xs text-[#6b6860] font-mono">{c.guardianPhone}</p>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-[#6b6860]">{c.room}</td>
                  <td className="px-6 py-3.5 text-sm font-mono text-[#6b6860]">{c.enrollmentDate}</td>
                  <td className="px-6 py-3.5 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      c.immunizationStatus === "current" ? "bg-[#dcfce7] text-[#16a34a]" :
                      c.immunizationStatus === "expires-soon" ? "bg-[#fef3c7] text-[#d97706]" :
                      "bg-[#fee2e2] text-[#dc2626]"
                    }`}>
                      {c.immunizationStatus === "current" ? "Current" : c.immunizationStatus === "expires-soon" ? "Expires soon" : "MISSING"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      c.tuitionStatus === "current" ? "bg-[#dcfce7] text-[#16a34a]" :
                      c.tuitionStatus === "pending" ? "bg-[#f3f2ee] text-[#6b6860]" :
                      "bg-[#fee2e2] text-[#dc2626]"
                    }`}>
                      {c.tuitionStatus === "current" ? "Paid" : c.tuitionStatus === "pending" ? "Pending" : "OVERDUE"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded font-mono ${c.checkedIn ? "bg-[#dcfce7] text-[#16a34a]" : "text-[#6b6860]"}`}>
                      {c.checkedIn ? "In" : "Out"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Inquiry Modal */}
      {showNewInquiry && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowNewInquiry(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#1e2d4e] mb-5">New Inquiry</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-[#6b6860] block mb-1.5">Child's Name</label>
                  <input
                    value={newInquiry.childName}
                    onChange={(e) => setNewInquiry((f) => ({ ...f, childName: e.target.value }))}
                    placeholder="First Last"
                    className="w-full border border-[#e2dfd8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f7173]"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-[#6b6860] block mb-1.5">Guardian Name</label>
                  <input
                    value={newInquiry.guardianName}
                    onChange={(e) => setNewInquiry((f) => ({ ...f, guardianName: e.target.value }))}
                    placeholder="First Last"
                    className="w-full border border-[#e2dfd8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f7173]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-[#6b6860] block mb-1.5">Phone</label>
                  <input
                    value={newInquiry.phone}
                    onChange={(e) => setNewInquiry((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="(000) 000-0000"
                    className="w-full border border-[#e2dfd8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f7173]"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-[#6b6860] block mb-1.5">Email</label>
                  <input
                    value={newInquiry.email}
                    onChange={(e) => setNewInquiry((f) => ({ ...f, email: e.target.value }))}
                    placeholder="email@example.com"
                    className="w-full border border-[#e2dfd8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f7173]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-[#6b6860] block mb-1.5">Age Group</label>
                <select
                  value={newInquiry.ageGroup}
                  onChange={(e) => setNewInquiry((f) => ({ ...f, ageGroup: e.target.value }))}
                  className="w-full border border-[#e2dfd8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f7173]"
                >
                  <option value="">Select age group...</option>
                  <option>Infant (0–18 mo)</option>
                  <option>Toddler (18–36 mo)</option>
                  <option>Preschool (3–5 yr)</option>
                  <option>School-Age (6+ yr)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-[#6b6860] block mb-1.5">Notes</label>
                <textarea
                  value={newInquiry.notes}
                  onChange={(e) => setNewInquiry((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Desired start date, referral source, questions..."
                  className="w-full border border-[#e2dfd8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f7173] resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewInquiry(false)} className="flex-1 py-2 border border-[#e2dfd8] rounded-lg text-sm text-[#6b6860] hover:border-[#1e2d4e] transition-colors">Cancel</button>
              <button
                onClick={() => { setShowNewInquiry(false); setNewInquiry({ childName: "", guardianName: "", phone: "", email: "", ageGroup: "", notes: "" }); }}
                className="flex-1 py-2 bg-[#1e2d4e] text-white rounded-lg text-sm font-medium hover:bg-[#2a3f6b] transition-colors"
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
          <div className="bg-white h-full w-96 shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-[#e2dfd8] flex items-start justify-between">
              <div>
                <p className="text-xs font-mono text-[#6b6860] uppercase tracking-widest mb-1">{selected.stage.toUpperCase()}</p>
                <h2 className="text-lg font-bold text-[#1e2d4e]">{selected.childName}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#6b6860] hover:text-[#1e2d4e] text-xl leading-none">×</button>
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
                  <p className="text-xs font-mono text-[#6b6860] uppercase tracking-widest mb-1">{r.label}</p>
                  <p className="text-sm text-[#1a1a1a]">{r.value}</p>
                </div>
              ))}
              {selected.notes && (
                <div>
                  <p className="text-xs font-mono text-[#6b6860] uppercase tracking-widest mb-1">Notes</p>
                  <p className="text-sm text-[#1a1a1a] bg-[#f3f2ee] rounded-lg p-3">{selected.notes}</p>
                </div>
              )}

              {selected.stage === "paperwork" && (
                <div className="bg-[#fef3c7] border border-[#fcd34d] rounded-xl p-4">
                  <p className="text-sm font-semibold text-[#d97706] mb-1">⚠ Florida DH 680 Required</p>
                  <p className="text-xs text-[#92400e]">Immunization certification must be received within 30 days of enrollment start. Child cannot attend until document is on file.</p>
                </div>
              )}

              <div className="pt-2 space-y-2">
                <p className="text-xs font-mono text-[#6b6860] uppercase tracking-widest mb-2">Move Stage</p>
                <div className="flex flex-wrap gap-2">
                  {STAGES.filter((s) => s.id !== selected.stage).map((s) => (
                    <button key={s.id} className="text-xs px-3 py-1.5 border border-[#e2dfd8] rounded-lg hover:border-[#0f7173] hover:text-[#0f7173] transition-colors">
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
