import { useState } from "react";
import { AlertTriangle, Check, GraduationCap, Search, UserPlus, X } from "lucide-react";
import { facilities, type EnrollmentLead } from "../data";
import { bandForDob, roomsWithSpace, useRoster, type Stage } from "../roster";

const STAGES: { id: Stage; label: string; color: string }[] = [
  { id: "inquiry", label: "Inquiry", color: "bg-line" },
  { id: "tour", label: "Tour Scheduled", color: "bg-info-soft" },
  { id: "waitlist", label: "Waitlist", color: "bg-warning-soft" },
  { id: "application", label: "Application", color: "bg-purple-soft" },
  { id: "paperwork", label: "Paperwork", color: "bg-accent-soft" },
  { id: "active", label: "Enrolled", color: "bg-success-soft" },
];

type Props = { facilityId: string };

export default function Enrollment({ facilityId }: Props) {
  const { roster, leads, addLead, moveLead } = useRoster();
  const [tab, setTab] = useState<"pipeline" | "roster">("pipeline");
  const [selected, setSelected] = useState<EnrollmentLead | null>(null);
  const [showNewInquiry, setShowNewInquiry] = useState(false);
  const [enrolling, setEnrolling] = useState<{ lead?: EnrollmentLead } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const facilityLeads = leads
    .filter((l) => l.facilityId === facilityId)
    .filter((l) => !q || [l.childName, l.guardianName, l.phone, l.email, l.ageGroup].some((v) => (v ?? "").toLowerCase().includes(q)))
    .sort((a, b) => a.childName.localeCompare(b.childName));

  const centerChildren = roster
    .filter((c) => c.facilityId === facilityId)
    .filter((c) => !q || [c.name, c.guardian, c.guardianPhone, c.room].some((v) => (v ?? "").toLowerCase().includes(q)))
    .sort((a, b) => a.name.localeCompare(b.name));

  const totalLeads = leads.filter((l) => l.facilityId === facilityId && l.stage !== "active").length;
  const totalEnrolled = roster.filter((c) => c.facilityId === facilityId).length;

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Keep the open detail panel in sync when a lead moves stage.
  const liveSelected = selected ? leads.find((l) => l.id === selected.id) ?? null : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-sm font-mono text-muted uppercase tracking-widest mb-1">Enrollment</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand">Enrollment Pipeline</h1>
          <p className="text-muted mt-1">{totalEnrolled} enrolled · {totalLeads} in the pipeline</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setEnrolling({})} className="inline-flex items-center gap-2 bg-brand text-white text-sm font-semibold px-4 py-2.5 min-h-11 rounded-full hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent transition-colors">
            <UserPlus size={18} aria-hidden /> Enroll a child
          </button>
          <button onClick={() => setShowNewInquiry(true)} className="inline-flex items-center gap-2 border border-line text-brand text-sm font-semibold px-4 py-2.5 min-h-11 rounded-full hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors">
            + New Inquiry
          </button>
        </div>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex gap-1 bg-line p-1 rounded-ctl w-fit">
          {(["pipeline", "roster"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} aria-pressed={tab === t} className={`px-4 py-2 min-h-10 rounded-ctl text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${tab === t ? "bg-surface text-brand shadow-sm" : "text-muted hover:text-brand"}`}>
              {t === "pipeline" ? "Pipeline" : `Enrolled Roster · ${totalEnrolled}`}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs sm:ml-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search child, guardian, phone…"
            aria-label="Search enrollment"
            className="w-full min-h-10 bg-surface border border-line rounded-ctl pl-9 pr-9 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <X size={15} aria-hidden />
            </button>
          )}
        </div>
      </div>

      {q && (
        <p className="text-sm text-muted mb-3 -mt-2">
          {tab === "pipeline"
            ? `${facilityLeads.length} matching ${facilityLeads.length === 1 ? "lead" : "leads"}`
            : `${centerChildren.length} matching ${centerChildren.length === 1 ? "child" : "children"}`}
        </p>
      )}

      {tab === "pipeline" ? (
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {STAGES.map((stage) => {
            const stageLeads = facilityLeads.filter((l) => l.stage === stage.id);
            return (
              <div key={stage.id} className="w-60 flex-shrink-0">
                <div className={`flex items-center justify-between px-3 py-2 rounded-t-ctl ${stage.color}`}>
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand">{stage.label}</span>
                  <span className="text-xs font-mono bg-surface/60 px-1.5 py-0.5 rounded">{stageLeads.length}</span>
                </div>
                <div className="space-y-2 mt-2">
                  {stageLeads.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => setSelected(lead)}
                      className="w-full bg-surface border border-line rounded-[calc(var(--t-radius)+0.25rem)] p-4 text-left hover:border-accent hover:shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <p className="font-semibold text-sm text-brand">{lead.childName}</p>
                      <p className="text-xs text-muted mt-0.5">{lead.guardianName}</p>
                      <p className="text-xs text-muted mt-1">{lead.ageGroup}</p>
                      {lead.stage === "paperwork" && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-warning"><span aria-hidden>⚠</span><span>Paperwork pending</span></div>
                      )}
                      <p className="text-xs font-mono text-muted mt-2">{lead.createdAt}</p>
                    </button>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="border-2 border-dashed border-line rounded-[calc(var(--t-radius)+0.25rem)] p-4 text-center text-xs text-muted">Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {centerChildren.map((c) => {
            const imm = c.immunizationStatus === "current" ? { cls: "bg-success-soft text-success", label: "Immunization current" }
              : c.immunizationStatus === "expires-soon" ? { cls: "bg-warning-soft text-warning", label: "Immunization expiring" }
              : { cls: "bg-danger-soft text-danger", label: "Immunization missing" };
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
                    {c.enrolledOverCapacity && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-warning-soft text-warning-strong">Over capacity</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {centerChildren.length === 0 && (
            <div className="sm:col-span-2 xl:col-span-3 border-2 border-dashed border-line rounded-[calc(var(--t-radius)+0.25rem)] p-10 text-center text-sm text-muted">
              {q ? "No children match that search." : "Nobody enrolled at this center yet."}
            </div>
          )}
        </div>
      )}

      {/* New inquiry */}
      {showNewInquiry && (
        <NewInquiryModal
          facilityId={facilityId}
          onClose={() => setShowNewInquiry(false)}
          onSave={(lead) => { addLead(lead); setShowNewInquiry(false); setTab("pipeline"); flash(`${lead.childName} added to Inquiry`); }}
        />
      )}

      {/* Enroll */}
      {enrolling && (
        <EnrollModal
          facilityId={facilityId}
          lead={enrolling.lead}
          onClose={() => setEnrolling(null)}
          onDone={(name, room) => { setEnrolling(null); setSelected(null); setTab("roster"); flash(`${name} enrolled in ${room} — now visible to that room's teachers`); }}
        />
      )}

      {/* Lead detail */}
      {liveSelected && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-end" onClick={() => setSelected(null)}>
          <div className="bg-surface h-full w-full sm:w-96 shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-line flex items-start justify-between">
              <div>
                <p className="text-xs font-mono text-muted uppercase tracking-widest mb-1">{STAGES.find((s) => s.id === liveSelected.stage)?.label}</p>
                <h2 className="text-lg font-bold text-brand">{liveSelected.childName}</h2>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><X size={20} aria-hidden /></button>
            </div>
            <div className="p-6 space-y-5">
              {[
                { label: "Guardian", value: liveSelected.guardianName },
                { label: "Phone", value: liveSelected.phone },
                { label: "Email", value: liveSelected.email },
                { label: "Age Group", value: liveSelected.ageGroup },
                { label: "Created", value: liveSelected.createdAt },
              ].map((r) => (
                <div key={r.label}>
                  <p className="text-xs font-mono text-muted uppercase tracking-widest mb-1">{r.label}</p>
                  <p className="text-sm text-ink">{r.value}</p>
                </div>
              ))}
              {liveSelected.notes && (
                <div>
                  <p className="text-xs font-mono text-muted uppercase tracking-widest mb-1">Notes</p>
                  <p className="text-sm text-ink bg-surface-2 rounded-card p-3">{liveSelected.notes}</p>
                </div>
              )}

              {liveSelected.stage === "active" ? (
                <div className="bg-success-soft border border-success/30 rounded-card p-4 text-sm text-success flex items-start gap-2">
                  <Check size={16} className="flex-shrink-0 mt-0.5" aria-hidden /> Enrolled. They're on the roster and in their room.
                </div>
              ) : (
                <button
                  onClick={() => setEnrolling({ lead: liveSelected })}
                  className="w-full inline-flex items-center justify-center gap-2 min-h-12 rounded-ctl bg-brand text-white font-semibold hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
                >
                  <GraduationCap size={18} aria-hidden /> Enroll this child
                </button>
              )}

              <div className="pt-1">
                <p className="text-xs font-mono text-muted uppercase tracking-widest mb-2">Move stage</p>
                <div className="flex flex-wrap gap-2">
                  {STAGES.filter((s) => s.id !== liveSelected.stage && s.id !== "active").map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { moveLead(liveSelected.id, s.id); flash(`${liveSelected.childName} → ${s.label}`); }}
                      className="text-xs px-3 py-2 min-h-10 border border-line rounded-ctl hover:border-accent hover:text-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      → {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand text-white text-sm font-medium px-4 py-3 rounded-card shadow-lg z-[60] max-w-[90vw] text-center">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}

const CAP_WARN_KEY = "nestly.hideCapacityWarning";
const readHideCapWarning = () => {
  try { return localStorage.getItem(CAP_WARN_KEY) === "1"; } catch { return false; }
};
const writeHideCapWarning = (v: boolean) => {
  try { v ? localStorage.setItem(CAP_WARN_KEY, "1") : localStorage.removeItem(CAP_WARN_KEY); } catch { /* private mode */ }
};

const inputCls = "w-full min-h-11 border border-line rounded-ctl px-3.5 text-base bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";
const labelCls = "text-xs font-mono uppercase tracking-widest text-muted block mb-1.5";

const AGE_GROUPS = ["Infant (0–18 mo)", "Toddler (18–36 mo)", "Preschool (3–5 yr)", "School-Age (6+ yr)"];

function NewInquiryModal({ facilityId, onClose, onSave }: { facilityId: string; onClose: () => void; onSave: (l: Omit<EnrollmentLead, "id" | "stage" | "createdAt">) => void }) {
  const [f, setF] = useState({ childName: "", guardianName: "", phone: "", email: "", ageGroup: AGE_GROUPS[0], notes: "" });
  const ready = f.childName.trim().length > 1 && f.guardianName.trim().length > 1;

  return (
    <Modal title="New inquiry" subtitle="A family reaching out. They start in the Inquiry column." onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label htmlFor="ni-child" className={labelCls}>Child's name</label><input id="ni-child" value={f.childName} onChange={(e) => setF({ ...f, childName: e.target.value })} placeholder="First Last" className={inputCls} /></div>
          <div><label htmlFor="ni-guardian" className={labelCls}>Guardian name</label><input id="ni-guardian" value={f.guardianName} onChange={(e) => setF({ ...f, guardianName: e.target.value })} placeholder="First Last" className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label htmlFor="ni-phone" className={labelCls}>Phone</label><input id="ni-phone" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="(000) 000-0000" className={inputCls} /></div>
          <div><label htmlFor="ni-email" className={labelCls}>Email</label><input id="ni-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="email@example.com" className={inputCls} /></div>
        </div>
        <div>
          <label htmlFor="ni-age" className={labelCls}>Age group</label>
          <select id="ni-age" value={f.ageGroup} onChange={(e) => setF({ ...f, ageGroup: e.target.value })} className={inputCls}>
            {AGE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="ni-notes" className={labelCls}>Notes</label>
          <textarea id="ni-notes" rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Desired start date, referral source, questions…" className="w-full border border-line rounded-ctl px-3.5 py-2.5 text-base bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none" />
        </div>
      </div>
      <Actions
        onClose={onClose}
        disabled={!ready}
        confirmLabel="Add to pipeline"
        onConfirm={() => onSave({ ...f, facilityId })}
      />
    </Modal>
  );
}

function EnrollModal({ facilityId, lead, onClose, onDone }: { facilityId: string; lead?: EnrollmentLead; onClose: () => void; onDone: (name: string, room: string) => void }) {
  const { roster, enroll } = useRoster();
  const rooms = roomsWithSpace(facilityId, roster);
  const facility = facilities.find((f) => f.id === facilityId);
  // Default to a room that actually has space, not just the first one.
  const [f, setF] = useState({
    name: lead?.childName ?? "",
    dob: "",
    guardian: lead?.guardianName ?? "",
    guardianPhone: lead?.phone ?? "",
    room: (rooms.find((r) => r.spaces > 0) ?? rooms[0])?.name ?? "",
    startDate: new Date().toISOString().slice(0, 10),
  });
  const [overrideOk, setOverrideOk] = useState(false);
  const [hideWarning, setHideWarning] = useState(readHideCapWarning);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const band = bandForDob(f.dob);
  const chosen = rooms.find((r) => r.name === f.room);
  const bandMismatch = !!f.dob && !!chosen && chosen.ageGroup !== band;
  const isFull = !!chosen && chosen.spaces === 0;
  const ready = f.name.trim().length > 1 && f.dob && f.guardian.trim().length > 1 && f.room && (!isFull || hideWarning || overrideOk);

  return (
    <Modal title="Enroll a child" subtitle={`They'll appear on the roster and in their room at ${facility?.name.split(" ").slice(0, 2).join(" ")}.`} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label htmlFor="en-name" className={labelCls}>Child's name</label><input id="en-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="First Last" className={inputCls} /></div>
          <div><label htmlFor="en-dob" className={labelCls}>Date of birth</label><input id="en-dob" type="date" value={f.dob} onChange={(e) => setF({ ...f, dob: e.target.value })} className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label htmlFor="en-guardian" className={labelCls}>Guardian</label><input id="en-guardian" value={f.guardian} onChange={(e) => setF({ ...f, guardian: e.target.value })} placeholder="First Last" className={inputCls} /></div>
          <div><label htmlFor="en-phone" className={labelCls}>Guardian phone</label><input id="en-phone" type="tel" value={f.guardianPhone} onChange={(e) => setF({ ...f, guardianPhone: e.target.value })} placeholder="(000) 000-0000" className={inputCls} /></div>
        </div>
        <div>
          <label htmlFor="en-room" className={labelCls}>Classroom</label>
          <select id="en-room" value={f.room} onChange={(e) => { setF({ ...f, room: e.target.value }); setOverrideOk(false); }} className={inputCls}>
            {rooms.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name} — {r.spaces > 0 ? `${r.spaces} space${r.spaces === 1 ? "" : "s"} left` : "FULL"}
              </option>
            ))}
          </select>
          {bandMismatch && (
            <p className="text-sm text-warning mt-1.5">Heads up — that room is {chosen?.ageGroup.replace("-", " ")}, but this date of birth puts them in the {band.replace("-", " ")} band.</p>
          )}
        </div>

        {isFull && chosen && !hideWarning && (
          <div className="bg-warning-soft border border-warning-line rounded-card p-4">
            <p className="text-sm font-semibold text-warning-strong flex items-start gap-2">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" aria-hidden />
              {chosen.name} is at capacity — {chosen.enrolled} of {chosen.capacity} places filled.
            </p>
            <p className="text-xs text-warning-strong/80 mt-1.5 ml-6">
              Enrolling here takes the room past its licensed capacity. Only do this if you have a place opening up or the capacity on record is out of date.
            </p>
            <label className="flex items-start gap-3 text-sm text-warning-strong mt-3 ml-6 cursor-pointer">
              <input type="checkbox" checked={overrideOk} onChange={(e) => setOverrideOk(e.target.checked)} className="mt-0.5 w-4 h-4 accent-warning flex-shrink-0" />
              <span>I'm overriding the capacity limit for this room, and it will be flagged on their record.</span>
            </label>
            <label className="flex items-start gap-3 text-xs text-warning-strong/80 mt-2.5 ml-6 cursor-pointer">
              <input type="checkbox" checked={dontAskAgain} onChange={(e) => setDontAskAgain(e.target.checked)} className="mt-0.5 w-3.5 h-3.5 accent-warning flex-shrink-0" />
              <span>Don't show this warning again — I'll manage capacity myself. Over-capacity enrollments stay flagged either way.</span>
            </label>
          </div>
        )}

        {isFull && chosen && hideWarning && (
          <div className="flex items-start justify-between gap-3 text-xs text-warning-strong bg-warning-soft/60 rounded-card px-3 py-2.5">
            <span className="flex items-start gap-2">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" aria-hidden />
              {chosen.name} is full ({chosen.enrolled} of {chosen.capacity}) — this will be flagged as over capacity.
            </span>
            <button
              type="button"
              onClick={() => { setHideWarning(false); writeHideCapWarning(false); }}
              className="underline whitespace-nowrap flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-warning rounded"
            >
              Turn warnings back on
            </button>
          </div>
        )}
        <div>
          <label htmlFor="en-start" className={labelCls}>Start date</label>
          <input id="en-start" type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} className={inputCls} />
        </div>
        <div className="bg-surface-2 rounded-card p-3 text-xs text-muted">
          They'll be added with immunization records outstanding and tuition pending, so they show on the compliance and billing lists until the paperwork is in.
        </div>
      </div>
      <Actions
        onClose={onClose}
        disabled={!ready}
        confirmLabel="Enroll"
        onConfirm={() => {
          if (dontAskAgain) writeHideCapWarning(true);
          enroll({ ...f, facilityId, overCapacity: isFull }, lead?.id);
          onDone(f.name.trim(), f.room);
        }}
      />
    </Modal>
  );
}

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNodeLike }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="bg-surface rounded-t-[calc(var(--t-radius)+0.5rem)] sm:rounded-[calc(var(--t-radius)+0.25rem)] shadow-2xl w-full sm:max-w-lg p-5 sm:p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-brand">{title}</h2>
            {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><X size={20} aria-hidden /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

type ReactNodeLike = React.ReactNode;

function Actions({ onClose, onConfirm, disabled, confirmLabel }: { onClose: () => void; onConfirm: () => void; disabled: boolean; confirmLabel: string }) {
  return (
    <div className="flex gap-3 mt-6">
      <button onClick={onClose} className="flex-1 min-h-12 rounded-ctl border border-line text-muted hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors">Cancel</button>
      <button onClick={onConfirm} disabled={disabled} className="flex-1 min-h-12 rounded-ctl bg-brand text-white font-semibold hover:bg-brand-hover disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent transition-colors">{confirmLabel}</button>
    </div>
  );
}
