/**
 * Tours, and the texts that remind families to show up for them.
 */
import { useMemo, useState } from "react";
import {
  AlertTriangle, CalendarPlus, Check, CheckCheck, ChevronDown, Clock, MessageSquare, MessageSquareOff, Phone, RotateCcw, Send, Settings2, UserX, X,
} from "lucide-react";
import { facilities, type EnrollmentLead } from "../data";
import { useRoster } from "../roster";
import { useAuth } from "../auth";
import {
  DEFAULT_SETTINGS, REMINDERS, fmtDay, fmtTime, fmtWhen, render, segments, useTours,
  type ReminderKey, type Sms, type Tour, type TourSettings, type TourStatus,
} from "../tours";

type Props = { facilityId: string };

const STATUS: Record<TourStatus, { label: string; cls: string }> = {
  scheduled: { label: "Scheduled", cls: "bg-surface-2 text-muted" },
  confirmed: { label: "Confirmed", cls: "bg-success-soft text-success" },
  "reschedule-requested": { label: "Wants to reschedule", cls: "bg-warning-soft text-warning" },
  completed: { label: "Toured", cls: "bg-accent-soft text-accent" },
  "no-show": { label: "No-show", cls: "bg-danger-soft text-danger" },
  cancelled: { label: "Cancelled", cls: "bg-surface-2 text-muted" },
};

const KIND_LABEL: Record<string, string> = {
  confirmation: "Confirmation",
  "reminder-24h": "Day before",
  "reminder-2h": "Same day",
  "follow-up": "Thank-you",
  "no-show": "Missed tour",
  cancelled: "Cancellation",
  manual: "From staff",
  "auto-reply": "Auto-reply",
};

const SLOTS = ["8:30", "9:00", "9:30", "10:00", "10:30", "11:00", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
const slotLabel = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return `${h > 12 ? h - 12 : h}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};
const combine = (date: string, slot: string) => {
  const [h, m] = slot.split(":").map(Number);
  const d = new Date(`${date}T00:00:00`);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
/** YYYY-MM-DD in local time — toISOString() is UTC and flips the date after 8 PM Eastern. */
const localDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayLocal = () => localDate(new Date());
const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return localDate(d);
};

export default function Tours({ facilityId }: Props) {
  const { at, messages, thread, setOutcome, cancel, isOptedOut, now } = useTours();
  const facility = facilities.find((f) => f.id === facilityId) ?? facilities[0];
  const tours = at(facilityId);

  const [scheduling, setScheduling] = useState(false);
  const [rescheduling, setRescheduling] = useState<Tour | null>(null);
  const [threadFor, setThreadFor] = useState<Tour | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2800);
  };

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const isUpcoming = (t: Tour) => new Date(t.startsAt) >= startOfToday && t.status !== "cancelled" && t.status !== "completed" && t.status !== "no-show";
  const upcoming = tours.filter(isUpcoming);
  const past = tours.filter((t) => !isUpcoming(t)).reverse();
  const in7 = upcoming.filter((t) => new Date(t.startsAt).getTime() < now + 7 * 86_400_000);
  const needsCall = upcoming.filter((t) => t.status === "reschedule-requested" || !t.smsConsent || isOptedOut(t.phone));
  const queued = messages.filter((m) => m.status === "queued" && tours.some((t) => t.id === m.tourId));
  const finished = tours.filter((t) => t.status === "completed" || t.status === "no-show");
  const noShowRate = finished.length ? Math.round((finished.filter((t) => t.status === "no-show").length / finished.length) * 100) : 0;

  const byDay = useMemo(() => {
    const groups: { day: string; items: Tour[] }[] = [];
    for (const t of upcoming) {
      const key = fmtDay(new Date(t.startsAt));
      const g = groups.find((x) => x.day === key);
      if (g) g.items.push(t);
      else groups.push({ day: key, items: [t] });
    }
    return groups;
  }, [upcoming]);

  const dayLabel = (d: string) => {
    const today = fmtDay(new Date());
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    return d === today ? `Today · ${d}` : d === fmtDay(tmr) ? `Tomorrow · ${d}` : d;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-sm font-mono text-muted uppercase tracking-widest mb-1">Tours</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand">Tours &amp; reminders</h1>
          <p className="text-muted mt-1">{facility.name} · families get a text when they book, the day before, and on the day</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSettingsOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-medium px-3.5 min-h-11 rounded-full border border-line text-brand hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <Settings2 size={16} aria-hidden /> Reminder settings
          </button>
          <button onClick={() => setScheduling(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 min-h-11 rounded-full bg-brand text-white hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent">
            <CalendarPlus size={16} aria-hidden /> Schedule a tour
          </button>
        </div>
      </div>

      <div className="mb-6 bg-info-soft border border-info/30 rounded-card px-4 py-3 text-sm text-ink flex gap-2.5">
        <MessageSquare size={17} className="text-info flex-shrink-0 mt-0.5" aria-hidden />
        <p>
          <span className="font-semibold">Texting is simulated.</span> Reminders are planned, timed and shown exactly as they'd go out, but nothing reaches a real phone until an SMS provider is connected. You can type a family's reply in any conversation to see how it's handled.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-7">
        {[
          { label: "Next 7 days", value: `${in7.length}`, sub: `${in7.filter((t) => t.status === "confirmed").length} confirmed by text`, color: "text-brand" },
          { label: "Need a call", value: `${needsCall.length}`, sub: "reschedule, or no texting", color: needsCall.length ? "text-warning" : "text-success" },
          { label: "Texts queued", value: `${queued.length}`, sub: queued.length ? `next ${fmtWhen([...queued].sort((a, b) => a.sendAt.localeCompare(b.sendAt))[0].sendAt)}` : "nothing pending", color: "text-accent" },
          { label: "No-show rate", value: `${noShowRate}%`, sub: `of ${finished.length} past tours`, color: noShowRate > 20 ? "text-danger" : "text-success" },
        ].map((k) => (
          <div key={k.label} className="bg-surface border border-line rounded-card p-5">
            <p className="text-xs font-mono uppercase tracking-widest text-muted mb-2">{k.label}</p>
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted mt-1 truncate">{k.sub}</p>
          </div>
        ))}
      </div>

      {byDay.length === 0 && (
        <div className="border-2 border-dashed border-line rounded-card p-10 text-center">
          <p className="font-medium text-brand">No tours coming up</p>
          <p className="text-sm text-muted mt-1">Schedule one from here or from a family on the enrollment pipeline.</p>
        </div>
      )}

      <div className="space-y-7">
        {byDay.map((g) => (
          <section key={g.day} aria-label={g.day}>
            <h2 className="text-sm font-mono uppercase tracking-widest text-muted mb-2.5">{dayLabel(g.day)}</h2>
            <ul className="space-y-3">
              {g.items.map((t) => (
                <TourCard
                  key={t.id}
                  tour={t}
                  thread={thread(t.id)}
                  optedOut={isOptedOut(t.phone)}
                  onThread={() => setThreadFor(t)}
                  onReschedule={() => setRescheduling(t)}
                  onOutcome={(o) => { setOutcome(t.id, o); flash(o === "completed" ? `Marked toured — thank-you text queued for tomorrow` : `Marked no-show — missed-tour text sent`); }}
                  onCancel={() => { cancel(t.id, t.smsConsent && !isOptedOut(t.phone)); flash(`Tour cancelled${t.smsConsent ? " — family notified" : ""}`); }}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {past.length > 0 && (
        <section className="mt-9">
          <button onClick={() => setShowPast((s) => !s)} aria-expanded={showPast} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-brand min-h-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded">
            <ChevronDown size={16} className={`transition-transform ${showPast ? "rotate-180" : ""}`} aria-hidden /> Past and cancelled tours ({past.length})
          </button>
          {showPast && (
            <ul className="mt-3 divide-y divide-line bg-surface border border-line rounded-card overflow-hidden">
              {past.map((t) => (
                <li key={t.id}>
                  <button onClick={() => setThreadFor(t)} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-row-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent">
                    <span className="text-xs font-mono text-muted w-32 flex-shrink-0">{fmtWhen(t.startsAt)}</span>
                    <span className="flex-1 min-w-0 text-sm text-brand truncate">{t.guardianName} · {t.childName}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS[t.status].cls}`}>{STATUS[t.status].label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {scheduling && <ScheduleTourModal facilityId={facilityId} onClose={() => setScheduling(false)} onDone={flash} />}
      {rescheduling && <RescheduleModal tour={rescheduling} onClose={() => setRescheduling(null)} onDone={flash} />}
      {threadFor && <ThreadDrawer tourId={threadFor.id} onClose={() => setThreadFor(null)} />}
      {settingsOpen && <SettingsDrawer onClose={() => setSettingsOpen(false)} onSaved={flash} />}

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand text-white text-sm font-medium px-4 py-3 rounded-card shadow-lg z-[60] flex items-center gap-2 max-w-[90vw]">
          <Check size={16} className="text-success flex-shrink-0" aria-hidden /> {toast}
        </div>
      )}
    </div>
  );
}

// ─── One tour ────────────────────────────────────────────────────

function TourCard({
  tour, thread, optedOut, onThread, onReschedule, onOutcome, onCancel,
}: {
  tour: Tour; thread: Sms[]; optedOut: boolean;
  onThread: () => void; onReschedule: () => void; onOutcome: (o: "completed" | "no-show") => void; onCancel: () => void;
}) {
  const start = new Date(tour.startsAt);
  const outbound = thread.filter((m) => m.direction === "out" && m.kind !== "auto-reply");
  const lastIn = [...thread].reverse().find((m) => m.direction === "in");
  const unansweredQuestion = lastIn && !["C", "R", "STOP", "HELP", "YES", "Y", "CONFIRM"].includes(lastIn.body.trim().toUpperCase());
  const s = STATUS[tour.status];
  const started = start.getTime() <= Date.now();

  return (
    <li className={`bg-surface border rounded-[calc(var(--t-radius)+0.25rem)] overflow-hidden ${tour.status === "reschedule-requested" ? "border-warning-line" : "border-line"}`}>
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
        <div className="sm:w-24 flex-shrink-0">
          <p className="text-2xl font-bold text-brand leading-none">{fmtTime(start).replace(/ (AM|PM)/, "")}</p>
          <p className="text-xs font-mono text-muted mt-1">{fmtTime(start).slice(-2)} · 30 min</p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-brand">{tour.guardianName}</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
          </div>
          <p className="text-sm text-muted">{tour.childName} · {tour.ageGroup} · with {tour.guide}</p>
          <p className="text-xs font-mono text-muted mt-1 inline-flex items-center gap-1"><Phone size={12} aria-hidden /> {tour.phone}</p>

          {/* What the family has been, or will be, sent */}
          {!tour.smsConsent ? (
            <p className="mt-3 text-sm text-warning-strong bg-warning-soft rounded-card px-3 py-2 inline-flex items-center gap-2">
              <MessageSquareOff size={15} aria-hidden /> No texting consent — call to confirm
            </p>
          ) : optedOut ? (
            <p className="mt-3 text-sm text-danger-strong bg-danger-soft rounded-card px-3 py-2 inline-flex items-center gap-2">
              <MessageSquareOff size={15} aria-hidden /> Replied STOP — no more texts
            </p>
          ) : (
            <ol className="mt-3 flex flex-wrap gap-1.5" aria-label="Reminder texts">
              {outbound.map((m) => (
                <li key={m.id} title={m.note ?? m.body} className={`text-xs px-2 py-1 rounded-ctl inline-flex items-center gap-1 border ${
                  m.status === "delivered" ? "bg-success-soft text-success border-transparent"
                  : m.status === "queued" ? "bg-surface text-ink border-line border-dashed"
                  : "bg-surface-2 text-muted border-transparent line-through"}`}>
                  {m.status === "delivered" ? <CheckCheck size={12} aria-hidden /> : m.status === "queued" ? <Clock size={12} aria-hidden /> : <X size={12} aria-hidden />}
                  {KIND_LABEL[m.kind] ?? m.kind}{" "}
                  <span className="text-muted no-underline">· {m.status === "delivered" ? "sent" : fmtWhen(m.sendAt).replace(" · ", " ")}</span>
                  {m.note && m.status === "queued" && <span className="sr-only"> ({m.note})</span>}
                </li>
              ))}
            </ol>
          )}

          {unansweredQuestion && (
            <button onClick={onThread} className="mt-3 w-full text-left bg-accent-soft rounded-card px-3.5 py-2.5 text-sm hover:ring-2 hover:ring-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <span className="font-semibold text-accent">Family asked: </span>
              <span className="text-ink">“{lastIn!.body}”</span>
            </button>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-5 py-2.5 border-t border-line bg-surface-2 flex flex-wrap gap-1.5">
        <button onClick={onThread} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand px-3 min-h-10 rounded-ctl hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <MessageSquare size={15} aria-hidden /> Texts
        </button>
        <button onClick={onReschedule} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand px-3 min-h-10 rounded-ctl hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <RotateCcw size={15} aria-hidden /> Reschedule
        </button>
        {started ? (
          <>
            <button onClick={() => onOutcome("completed")} className="inline-flex items-center gap-1.5 text-sm font-medium text-success px-3 min-h-10 rounded-ctl hover:bg-success-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <Check size={15} aria-hidden /> They toured
            </button>
            <button onClick={() => onOutcome("no-show")} className="inline-flex items-center gap-1.5 text-sm font-medium text-danger px-3 min-h-10 rounded-ctl hover:bg-danger-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <UserX size={15} aria-hidden /> No-show
            </button>
          </>
        ) : null}
        <button onClick={onCancel} className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-muted px-3 min-h-10 rounded-ctl hover:text-danger hover:bg-danger-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <X size={15} aria-hidden /> Cancel tour
        </button>
      </div>
    </li>
  );
}

// ─── Booking ─────────────────────────────────────────────────────

export function ScheduleTourModal({ facilityId, lead, onClose, onDone }: { facilityId: string; lead?: EnrollmentLead; onClose: () => void; onDone: (m: string) => void }) {
  const { leads, addLead, moveLead } = useRoster();
  const { user } = useAuth();
  const { schedule, settings } = useTours();
  const candidates = leads.filter((l) => l.facilityId === facilityId && ["inquiry", "tour", "waitlist", "application"].includes(l.stage));

  const [leadId, setLeadId] = useState(lead?.id ?? "");
  const picked = candidates.find((l) => l.id === leadId) ?? lead;
  const [guardian, setGuardian] = useState(lead?.guardianName ?? "");
  const [child, setChild] = useState(lead?.childName ?? "");
  const [ageGroup, setAgeGroup] = useState(lead?.ageGroup ?? "Toddler (18–36 mo)");
  const [phone, setPhone] = useState(lead?.phone ?? "");
  const [date, setDate] = useState(tomorrowISO());
  const [slot, setSlot] = useState("10:00");
  const [guide, setGuide] = useState(user?.name ?? "");
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = (id: string) => {
    setLeadId(id);
    const l = candidates.find((x) => x.id === id);
    if (l) { setGuardian(l.guardianName); setChild(l.childName); setAgeGroup(l.ageGroup); setPhone(l.phone); }
  };

  const center = facilities.find((f) => f.id === facilityId) ?? facilities[0];
  const startsAt = date ? combine(date, slot) : "";
  const preview = startsAt ? render(settings.templates.confirmation, { facilityId, guardianName: guardian || "there", childName: child, startsAt, guide }) : "";

  const submit = () => {
    const digits = phone.replace(/\D/g, "");
    if (!guardian.trim() || !child.trim()) return setErr("Add the parent's and child's names.");
    if (digits.length !== 10) return setErr("Enter a 10-digit mobile number.");
    if (!date || new Date(startsAt) <= new Date()) return setErr("Pick a time in the future.");
    let id = picked?.id;
    if (!id) {
      id = addLead({ childName: child.trim(), guardianName: guardian.trim(), phone, email: "", facilityId, ageGroup, notes: "Booked a tour." });
    }
    moveLead(id, "tour");
    schedule({ leadId: id, facilityId, childName: child.trim(), ageGroup, guardianName: guardian.trim(), phone, startsAt, guide: guide.trim() || "Front desk", smsConsent: consent });
    onDone(consent ? `Tour booked — confirmation text sent to ${guardian.split(" ")[0]}` : `Tour booked — no texts, so call to confirm`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="st-title" className="bg-surface rounded-t-[calc(var(--t-radius)+0.5rem)] sm:rounded-[calc(var(--t-radius)+0.25rem)] shadow-2xl w-full sm:max-w-lg max-h-[94vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="px-5 sm:px-6 py-4 border-b border-line flex items-start justify-between gap-3">
          <div>
            <h2 id="st-title" className="text-lg font-bold text-brand">Schedule a tour</h2>
            <p className="text-xs text-muted">{center.name}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-11 h-11 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><X size={20} aria-hidden /></button>
        </header>

        <div className="overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
          {!lead && candidates.length > 0 && (
            <div>
              <label htmlFor="st-lead" className="text-sm font-semibold text-brand block mb-1.5">Family from the pipeline</label>
              <select id="st-lead" value={leadId} onChange={(e) => pick(e.target.value)} className="w-full min-h-11 border border-line rounded-ctl px-3 text-base bg-surface text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                <option value="">A new family</option>
                {candidates.map((l) => <option key={l.id} value={l.id}>{l.guardianName} · {l.childName}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field id="st-guardian" label="Parent's name" value={guardian} onChange={setGuardian} disabled={!!picked} />
            <Field id="st-child" label="Child's name" value={child} onChange={setChild} disabled={!!picked} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field id="st-phone" label="Mobile number" value={phone} onChange={setPhone} type="tel" />
            <div>
              <label htmlFor="st-age" className="text-sm font-semibold text-brand block mb-1.5">Age group</label>
              <select id="st-age" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} disabled={!!picked} className="w-full min-h-11 border border-line rounded-ctl px-3 text-base bg-surface text-ink disabled:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                {["Infant (0–18 mo)", "Toddler (18–36 mo)", "Preschool (3–5 yr)", "School-Age (5+)"].map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="st-date" className="text-sm font-semibold text-brand block mb-1.5">Date</label>
              <input id="st-date" type="date" value={date} min={todayLocal()} onChange={(e) => setDate(e.target.value)} className="w-full min-h-11 border border-line rounded-ctl px-3 text-base bg-surface text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
            </div>
            <div>
              <label htmlFor="st-slot" className="text-sm font-semibold text-brand block mb-1.5">Time</label>
              <select id="st-slot" value={slot} onChange={(e) => setSlot(e.target.value)} className="w-full min-h-11 border border-line rounded-ctl px-3 text-base bg-surface text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                {SLOTS.map((s) => <option key={s} value={s}>{slotLabel(s)}</option>)}
              </select>
            </div>
          </div>
          <Field id="st-guide" label="Who's giving the tour" value={guide} onChange={setGuide} />

          <label className={`flex items-start gap-3 cursor-pointer rounded-card border-2 p-3.5 ${consent ? "border-accent bg-accent-soft/60" : "border-line"}`}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 w-5 h-5 flex-shrink-0 accent-[var(--t-accent)]" />
            <span className="text-sm">
              <span className="font-semibold text-brand block">The family agreed to tour texts</span>
              <span className="text-muted">Read this to them if booking by phone: “Can we text you a confirmation and reminders about your tour? Message and data rates may apply, and you can reply STOP at any time.”</span>
            </span>
          </label>

          {consent && preview && (
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-muted mb-1.5">They'll get this now</p>
              <div className="bg-surface-2 rounded-card p-3.5 text-sm text-ink">{preview}</div>
            </div>
          )}
          {!consent && <p className="text-xs text-muted">Without consent, the tour is still booked — nobody gets texted, and the tour shows as needing a call.</p>}

          {err && <p role="alert" className="text-sm text-danger font-medium">{err}</p>}
        </div>

        <footer className="px-5 sm:px-6 py-4 border-t border-line flex gap-3">
          <button onClick={onClose} className="flex-1 min-h-12 rounded-ctl border border-line text-muted hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Cancel</button>
          <button onClick={submit} className="flex-[2] min-h-12 rounded-ctl bg-brand text-white font-semibold hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent">
            Book the tour
          </button>
        </footer>
      </div>
    </div>
  );
}

function Field({ id, label, value, onChange, type = "text", disabled }: { id: string; label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-brand block mb-1.5">{label}</label>
      <input id={id} type={type} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} inputMode={type === "tel" ? "tel" : undefined} className="w-full min-h-11 border border-line rounded-ctl px-3 text-base bg-surface text-ink disabled:bg-surface-2 disabled:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
    </div>
  );
}

function RescheduleModal({ tour, onClose, onDone }: { tour: Tour; onClose: () => void; onDone: (m: string) => void }) {
  const { reschedule } = useTours();
  const [date, setDate] = useState(() => { const d = localDate(new Date(tour.startsAt)); return d < todayLocal() ? tomorrowISO() : d; });
  const current = new Date(tour.startsAt);
  const [slot, setSlot] = useState(`${current.getHours()}:${String(current.getMinutes()).padStart(2, "0")}`);
  const [err, setErr] = useState<string | null>(null);
  const save = () => {
    const iso = combine(date, SLOTS.includes(slot) ? slot : "10:00");
    if (new Date(iso) <= new Date()) return setErr("Pick a time in the future.");
    reschedule(tour.id, iso);
    onDone(tour.smsConsent ? `Moved to ${fmtWhen(iso)} — new confirmation texted` : `Moved to ${fmtWhen(iso)}`);
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="rs-title" className="bg-surface rounded-t-[calc(var(--t-radius)+0.5rem)] sm:rounded-[calc(var(--t-radius)+0.25rem)] shadow-2xl w-full sm:max-w-md p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <h2 id="rs-title" className="text-lg font-bold text-brand">Reschedule {tour.guardianName.split(" ")[0]}'s tour</h2>
        <p className="text-sm text-muted mb-4">Currently {fmtWhen(tour.startsAt)}. Any reminders still waiting are cancelled and new ones planned.</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="rs-date" className="text-sm font-semibold text-brand block mb-1.5">Date</label>
            <input id="rs-date" type="date" value={date} min={todayLocal()} onChange={(e) => setDate(e.target.value)} className="w-full min-h-11 border border-line rounded-ctl px-3 text-base bg-surface text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
          </div>
          <div>
            <label htmlFor="rs-slot" className="text-sm font-semibold text-brand block mb-1.5">Time</label>
            <select id="rs-slot" value={slot} onChange={(e) => setSlot(e.target.value)} className="w-full min-h-11 border border-line rounded-ctl px-3 text-base bg-surface text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              {SLOTS.map((s) => <option key={s} value={s}>{slotLabel(s)}</option>)}
            </select>
          </div>
        </div>
        {err && <p role="alert" className="text-sm text-danger font-medium mt-3">{err}</p>}
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 min-h-12 rounded-ctl border border-line text-muted hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Cancel</button>
          <button onClick={save} className="flex-[2] min-h-12 rounded-ctl bg-brand text-white font-semibold hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent">Move the tour</button>
        </div>
      </div>
    </div>
  );
}

// ─── Conversation ────────────────────────────────────────────────

function ThreadDrawer({ tourId, onClose }: { tourId: string; onClose: () => void }) {
  const { tours, thread, receive, sendManual, sendNow, isOptedOut } = useTours();
  const tour = tours.find((t) => t.id === tourId)!;
  const msgs = thread(tourId);
  const [reply, setReply] = useState("");
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const simulate = (text: string) => { receive(tourId, text); setReply(""); };
  const send = () => {
    const problem = sendManual(tourId, draft);
    if (problem) setErr(problem);
    else { setDraft(""); setErr(null); }
  };
  const seg = segments(draft);

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-stretch justify-end" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="th-title" className="bg-surface h-full w-full sm:max-w-md shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="px-5 py-4 border-b border-line flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 id="th-title" className="text-lg font-bold text-brand leading-tight">{tour.guardianName}</h2>
            <p className="text-xs text-muted">{tour.phone} · tour {fmtWhen(tour.startsAt)}</p>
            <span className={`inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS[tour.status].cls}`}>{STATUS[tour.status].label}</span>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-11 h-11 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><X size={20} aria-hidden /></button>
        </header>

        <ol className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-surface-2" aria-label="Text messages">
          {msgs.length === 0 && <li className="text-sm text-muted text-center py-8">No texts yet.</li>}
          {msgs.map((m) => {
            const mine = m.direction === "out";
            const dim = m.status === "skipped" || m.status === "blocked";
            return (
              <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${dim ? "opacity-60" : ""}`}>
                  <div className={`rounded-2xl px-3.5 py-2.5 text-sm ${
                    !mine ? "bg-surface border border-line text-ink rounded-bl-md"
                    : m.status === "queued" ? "border-2 border-dashed border-accent/50 text-ink bg-surface rounded-br-md"
                    : dim ? "bg-line text-muted line-through rounded-br-md"
                    : "bg-accent text-white rounded-br-md"}`}>
                    {m.body}
                  </div>
                  <p className={`text-[11px] mt-1 font-mono text-muted ${mine ? "text-right" : ""}`}>
                    {mine && (KIND_LABEL[m.kind] ? `${KIND_LABEL[m.kind]} · ` : "")}
                    {m.status === "queued" ? `scheduled ${fmtWhen(m.sendAt)}` : m.status === "delivered" ? `delivered ${fmtWhen(m.sendAt)}` : m.status === "received" ? fmtWhen(m.sendAt) : m.status}
                    {mine && m.status !== "blocked" && ` · ${segments(m.body).segments} seg`}
                  </p>
                  {m.note && <p className={`text-[11px] mt-0.5 ${m.status === "queued" ? "text-accent" : "text-warning-strong"} ${mine ? "text-right" : ""}`}>{m.note}</p>}
                  {m.status === "queued" && (
                    <div className="text-right">
                      <button onClick={() => sendNow(m.id)} className="text-[11px] font-medium text-accent hover:underline mt-0.5 min-h-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded">Send now</button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="border-t border-line px-4 py-3 space-y-3">
          <div>
            <label htmlFor="th-draft" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Text the family</label>
            <div className="flex gap-2">
              <input id="th-draft" value={draft} onChange={(e) => { setDraft(e.target.value); setErr(null); }} placeholder={isOptedOut(tour.phone) ? "They replied STOP" : "Write a message…"} disabled={!tour.smsConsent || isOptedOut(tour.phone)} className="flex-1 min-h-11 border border-line rounded-ctl px-3 text-base bg-surface text-ink disabled:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
              <button onClick={send} disabled={!draft.trim()} aria-label="Send text" className="w-11 h-11 rounded-ctl bg-brand text-white flex items-center justify-center hover:bg-brand-hover disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"><Send size={17} aria-hidden /></button>
            </div>
            {draft && <p className={`text-[11px] font-mono mt-1 ${seg.segments > 1 ? "text-warning-strong" : "text-muted"}`}>{seg.length} chars · {seg.segments} segment{seg.segments === 1 ? "" : "s"}{seg.encoding === "UCS-2" ? " · emoji or special characters halve the length" : ""}</p>}
            {err && <p role="alert" className="text-xs text-danger font-medium mt-1">{err}</p>}
          </div>

          <div className="rounded-card border border-dashed border-line p-3">
            <p className="text-xs font-mono uppercase tracking-widest text-muted mb-2">Pretend the family replied</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {["C", "R", "STOP", "HELP", "START"].map((w) => (
                <button key={w} onClick={() => simulate(w)} className="text-xs font-mono font-medium px-2.5 min-h-9 rounded-ctl border border-line text-brand hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">{w}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <label htmlFor="th-sim" className="sr-only">Their reply</label>
              <input id="th-sim" value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && simulate(reply)} placeholder="Or type what they'd say…" className="flex-1 min-h-10 border border-line rounded-ctl px-3 text-sm bg-surface text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
              <button onClick={() => simulate(reply)} disabled={!reply.trim()} className="text-sm font-medium px-3 min-h-10 rounded-ctl border border-line text-brand hover:border-accent disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Receive</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────────

function SettingsDrawer({ onClose, onSaved }: { onClose: () => void; onSaved: (m: string) => void }) {
  const { settings, updateSettings } = useTours();
  const [draft, setDraft] = useState<TourSettings>(settings);
  const sample = { facilityId: "f1", guardianName: "Priya Patel", childName: "Noah Patel", startsAt: combine(tomorrowISO(), "10:00"), guide: "Patricia Lane" };
  const set = (patch: Partial<TourSettings>) => setDraft((d) => ({ ...d, ...patch }));
  const hour = (h: number) => (h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`);

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-stretch justify-end" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="set-title" className="bg-surface h-full w-full sm:max-w-xl shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="px-5 sm:px-6 py-4 border-b border-line flex items-start justify-between gap-3">
          <div>
            <h2 id="set-title" className="text-lg font-bold text-brand">Reminder settings</h2>
            <p className="text-xs text-muted">Applies to tours booked from now on. Tours already booked keep the texts they have.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-11 h-11 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><X size={20} aria-hidden /></button>
        </header>

        <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-5 space-y-6">
          <section className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted">When texts can go out</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="set-start" className="text-sm font-semibold text-brand block mb-1.5">Not before</label>
                <select id="set-start" value={draft.windowStart} onChange={(e) => set({ windowStart: Number(e.target.value) })} className="w-full min-h-11 border border-line rounded-ctl px-3 text-base bg-surface text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  {[8, 9, 10].map((h) => <option key={h} value={h}>{hour(h)}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="set-end" className="text-sm font-semibold text-brand block mb-1.5">Not after</label>
                <select id="set-end" value={draft.windowEnd} onChange={(e) => set({ windowEnd: Number(e.target.value) })} className="w-full min-h-11 border border-line rounded-ctl px-3 text-base bg-surface text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  {[18, 19, 20].map((h) => <option key={h} value={h}>{hour(h)}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="set-max" className="text-sm font-semibold text-brand block mb-1.5">Max per day</label>
                <select id="set-max" value={draft.maxPer24h} onChange={(e) => set({ maxPer24h: Number(e.target.value) })} className="w-full min-h-11 border border-line rounded-ctl px-3 text-base bg-surface text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  {[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <p className="text-xs text-muted flex gap-1.5">
              <AlertTriangle size={13} className="flex-shrink-0 mt-0.5 text-warning" aria-hidden />
              <span>These can't be set wider than 8 AM–8 PM or more than 3 a day. That's Florida's limit for texts to people who aren't customers yet, and a tour reminder is close enough to count. Have a lawyer confirm before going live.</span>
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted">Which texts, and what they say</h3>
            <p className="text-xs text-muted -mt-2">Fill-ins: {"{center} {family} {child} {day} {time} {address} {guide} {phone}"}</p>
            {REMINDERS.map((r) => {
              const on = draft.enabled[r.key];
              const text = draft.templates[r.key];
              const preview = render(text, sample);
              const seg = segments(preview);
              return (
                <div key={r.key} className={`border rounded-card p-4 ${on ? "border-line" : "border-line opacity-60"}`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={on} onChange={(e) => set({ enabled: { ...draft.enabled, [r.key]: e.target.checked } })} className="mt-0.5 w-5 h-5 flex-shrink-0 accent-[var(--t-accent)]" />
                    <span>
                      <span className="block text-sm font-semibold text-brand">{r.label}</span>
                      <span className="block text-xs text-muted">{r.when}</span>
                    </span>
                  </label>
                  {on && (
                    <div className="mt-3 space-y-2">
                      <label htmlFor={`tpl-${r.key}`} className="sr-only">{r.label} message</label>
                      <textarea id={`tpl-${r.key}`} rows={3} value={text} onChange={(e) => set({ templates: { ...draft.templates, [r.key]: e.target.value } })} className="w-full border border-line rounded-ctl px-3 py-2.5 text-sm bg-surface text-ink font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none" />
                      <div className="bg-surface-2 rounded-card p-3 text-sm text-ink">{preview}</div>
                      <p className={`text-[11px] font-mono ${seg.segments > 1 ? "text-warning-strong" : "text-muted"}`}>
                        {seg.length} chars · {seg.segments} segment{seg.segments === 1 ? "" : "s"}
                        {seg.encoding === "UCS-2" && ` · "${(seg as { offenders?: string[] }).offenders?.join(" ")}" forces the short format — swap for plain characters`}
                      </p>
                      {r.key === "confirmation" && !/STOP/i.test(text) && (
                        <p className="text-xs text-danger font-medium">The first text has to tell people how to opt out. Keep “Reply STOP to opt out.”</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        </div>

        <footer className="px-5 sm:px-6 py-4 border-t border-line flex gap-3">
          <button onClick={() => setDraft(DEFAULT_SETTINGS)} className="min-h-12 px-4 rounded-ctl text-sm text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Reset</button>
          <button onClick={onClose} className="flex-1 min-h-12 rounded-ctl border border-line text-muted hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Cancel</button>
          <button
            onClick={() => { updateSettings(draft); onSaved("Reminder settings saved"); onClose(); }}
            disabled={draft.enabled.confirmation && !/STOP/i.test(draft.templates.confirmation)}
            className="flex-[2] min-h-12 rounded-ctl bg-brand text-white font-semibold hover:bg-brand-hover disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
          >
            Save
          </button>
        </footer>
      </div>
    </div>
  );
}
