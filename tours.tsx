/**
 * Tours and their text reminders.
 *
 * Texting is simulated: messages are planned, queued, "sent" when their time
 * comes and replies can be typed in by hand, but nothing reaches a real phone
 * until an SMS provider is connected on the backend. The rules around sending
 * are real, though, and are the part worth getting right before that happens:
 *
 *   - No texts without consent recorded at booking.
 *   - STOP (and its synonyms) opts a number out of everything, immediately.
 *   - Sends stay inside a daily window — 8 AM to 8 PM by default, which is
 *     Florida's limit for telephone solicitation and the conservative choice
 *     for a message to a prospective customer.
 *   - No more than three texts about a tour to one number in 24 hours — the
 *     same Florida limit.
 *
 * A reminder that falls outside the window is moved, not dropped, when there
 * is still room before the tour; otherwise it's skipped and the reason shown.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { facilities } from "./data";
import { centerPhone } from "./messages";

export type TourStatus = "scheduled" | "confirmed" | "reschedule-requested" | "completed" | "no-show" | "cancelled";

export type Tour = {
  id: string;
  leadId?: string;
  facilityId: string;
  childName: string;
  ageGroup: string;
  guardianName: string;
  phone: string;
  /** ISO datetime of the tour. */
  startsAt: string;
  guide: string;
  status: TourStatus;
  /** Consent to automated texts, captured when the tour was booked. */
  smsConsent: boolean;
  createdAt: string;
  notes?: string;
};

export type SmsKind =
  | "confirmation"
  | "reminder-24h"
  | "reminder-2h"
  | "follow-up"
  | "no-show"
  | "cancelled"
  | "manual"
  | "auto-reply"
  | "reply";

export type SmsStatus = "queued" | "delivered" | "skipped" | "blocked" | "received";

export type Sms = {
  id: string;
  tourId: string;
  phone: string;
  direction: "out" | "in";
  kind: SmsKind;
  body: string;
  /** When it goes (or went) out. */
  sendAt: string;
  status: SmsStatus;
  /** Why a message was moved, skipped or blocked — shown to staff. */
  note?: string;
};

export type ReminderKey = "confirmation" | "reminder-24h" | "reminder-2h" | "follow-up" | "no-show";

export type TourSettings = {
  enabled: Record<ReminderKey, boolean>;
  templates: Record<ReminderKey, string>;
  windowStart: number;
  windowEnd: number;
  maxPer24h: number;
};

export const REMINDERS: { key: ReminderKey; label: string; when: string }[] = [
  { key: "confirmation", label: "Booking confirmation", when: "As soon as the tour is booked" },
  { key: "reminder-24h", label: "Day-before reminder", when: "24 hours before" },
  { key: "reminder-2h", label: "Same-day reminder", when: "2 hours before" },
  { key: "follow-up", label: "Thank-you follow-up", when: "Next morning, after a tour you mark completed" },
  { key: "no-show", label: "Missed-tour message", when: "When you mark a tour as a no-show" },
];

export const DEFAULT_SETTINGS: TourSettings = {
  enabled: { confirmation: true, "reminder-24h": true, "reminder-2h": true, "follow-up": true, "no-show": true },
  templates: {
    confirmation: "{center}: Hi {family}, you're booked for a tour on {day} at {time}. Reply C to confirm or R to reschedule. Reply STOP to opt out.",
    "reminder-24h": "{center}: Reminder, your tour is tomorrow at {time} at {address}. Ask for {guide}. Reply C to confirm or R to reschedule.",
    "reminder-2h": "{center}: See you at {time} today! Park out front and ring the bell at the main door. Reply R if you're running late.",
    "follow-up": "{center}: Thanks for visiting yesterday, {family}! Questions, or ready to apply? Just reply here and we'll get back to you.",
    "no-show": "{center}: Sorry we missed you today, {family}. Reply R and we'll find a new time that works.",
  },
  windowStart: 8,
  windowEnd: 20,
  maxPer24h: 3,
};

// ─── Message length ─────────────────────────────────────────────
//
// A text is billed per segment. Plain GSM-7 characters fit 160 in one
// segment; a single em dash, curly quote or emoji flips the whole message to
// UCS-2, which fits 70. Staff editing templates should see that happen.

const GSM = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM_EXT = "^{}\\[~]|€";

export function segments(text: string) {
  const chars = Array.from(text);
  const isGsm = chars.every((c) => GSM.includes(c) || GSM_EXT.includes(c));
  if (isGsm) {
    const len = chars.reduce((n, c) => n + (GSM_EXT.includes(c) ? 2 : 1), 0);
    return { encoding: "GSM-7" as const, length: len, segments: len <= 160 ? 1 : Math.ceil(len / 153), perSegment: len <= 160 ? 160 : 153 };
  }
  const len = chars.length;
  const offenders = [...new Set(chars.filter((c) => !GSM.includes(c) && !GSM_EXT.includes(c)))];
  return { encoding: "UCS-2" as const, length: len, segments: len <= 70 ? 1 : Math.ceil(len / 67), perSegment: len <= 70 ? 70 : 67, offenders };
}

// ─── Rendering ──────────────────────────────────────────────────

export const fmtDay = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
export const fmtTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
export const fmtWhen = (iso: string) => `${fmtDay(new Date(iso))} · ${fmtTime(new Date(iso))}`;

export function render(template: string, tour: Pick<Tour, "facilityId" | "guardianName" | "childName" | "startsAt" | "guide">) {
  const f = facilities.find((x) => x.id === tour.facilityId) ?? facilities[0];
  const start = new Date(tour.startsAt);
  const values: Record<string, string> = {
    center: f.name,
    family: tour.guardianName.split(" ")[0],
    child: tour.childName.split(" ")[0],
    day: fmtDay(start),
    time: fmtTime(start),
    address: f.address,
    guide: tour.guide.split(" ")[0],
    phone: centerPhone(tour.facilityId),
  };
  return template.replace(/\{(\w+)\}/g, (m, k) => values[k] ?? m);
}

const STOP_WORDS = ["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT", "OPTOUT", "REVOKE"];
const START_WORDS = ["START", "UNSTOP", "YES"];

const normPhone = (p: string) => p.replace(/\D/g, "").slice(-10);

// ─── Store ──────────────────────────────────────────────────────

type NewTour = Omit<Tour, "id" | "status" | "createdAt">;

type Store = {
  tours: Tour[];
  messages: Sms[];
  settings: TourSettings;
  optedOut: string[];
  now: number;
  at: (facilityId: string) => Tour[];
  thread: (tourId: string) => Sms[];
  isOptedOut: (phone: string) => boolean;
  schedule: (input: NewTour) => string;
  reschedule: (tourId: string, startsAt: string) => void;
  cancel: (tourId: string, notify: boolean) => void;
  setOutcome: (tourId: string, outcome: "completed" | "no-show") => void;
  /** Type in a reply as if the family had texted it. */
  receive: (tourId: string, body: string) => void;
  /** Staff writing to the family directly. Returns why it couldn't send, if it couldn't. */
  sendManual: (tourId: string, body: string) => string | null;
  sendNow: (smsId: string) => void;
  updateSettings: (s: TourSettings) => void;
};

const Ctx = createContext<Store | null>(null);

export function ToursProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<TourSettings>(DEFAULT_SETTINGS);
  const [now, setNow] = useState(() => Date.now());
  const [optedOut, setOptedOut] = useState<string[]>([]);
  const [{ tours, messages }, setState] = useState(() => seedState(DEFAULT_SETTINGS));

  // The simulated delivery clock. A real system would have a scheduler on the
  // server; here every queued message whose time has come is delivered.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  // Runs on the clock tick and whenever messages change, so a confirmation
  // due "now" goes out immediately rather than on the next tick.
  useEffect(() => {
    const t = Date.now();
    setState((s) => {
      let changed = false;
      const next = s.messages.map((m) => {
        if (m.status === "queued" && new Date(m.sendAt).getTime() <= t) {
          changed = true;
          return { ...m, status: "delivered" as const };
        }
        return m;
      });
      return changed ? { ...s, messages: next } : s;
    });
  }, [now, messages]);

  const isOptedOut = (phone: string) => optedOut.includes(normPhone(phone));

  const at: Store["at"] = (facilityId) =>
    tours.filter((t) => t.facilityId === facilityId).sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const thread: Store["thread"] = (tourId) =>
    messages.filter((m) => m.tourId === tourId).sort((a, b) => a.sendAt.localeCompare(b.sendAt) || (a.direction === "in" ? -1 : 1));

  /** Everything scheduling-related funnels through here. */
  const enqueue = (
    list: Sms[],
    tour: Tour,
    kind: SmsKind,
    body: string,
    desired: Date,
    opts: { notAfter?: Date; allowNextDay?: boolean } = {},
  ): Sms => {
    const base = { id: `sms-${Math.random().toString(36).slice(2, 10)}`, tourId: tour.id, phone: tour.phone, direction: "out" as const, kind, body };
    if (!tour.smsConsent) return { ...base, sendAt: desired.toISOString(), status: "blocked", note: "No texting consent on file — call instead" };
    if (optedOut.includes(normPhone(tour.phone))) return { ...base, sendAt: desired.toISOString(), status: "blocked", note: "Family replied STOP" };

    // Keep inside the send window.
    const when = new Date(desired);
    let note: string | undefined;
    const h = when.getHours() + when.getMinutes() / 60;
    if (h < settings.windowStart) {
      when.setHours(settings.windowStart, 0, 0, 0);
      note = `Moved to ${fmtTime(when)} — outside texting hours`;
    } else if (h >= settings.windowEnd) {
      if (opts.allowNextDay) {
        when.setDate(when.getDate() + 1);
        when.setHours(settings.windowStart, 0, 0, 0);
      } else {
        when.setHours(settings.windowEnd - 1, 30, 0, 0);
      }
      note = `Moved to ${fmtDay(when)} ${fmtTime(when)} — outside texting hours`;
    }
    if (opts.notAfter && when >= opts.notAfter) {
      return { ...base, sendAt: desired.toISOString(), status: "skipped", note: "Skipped — no time left inside texting hours before the tour" };
    }

    // Three per rolling 24 hours to one number, counting what's already gone
    // out and what's already queued ahead of this one.
    const since = when.getTime() - 86_400_000;
    const recent = [...messages, ...list].filter((m) => {
      if (m.direction !== "out" || normPhone(m.phone) !== normPhone(tour.phone)) return false;
      if (m.status !== "queued" && m.status !== "delivered") return false;
      const t = new Date(m.sendAt).getTime();
      return t > since && t <= when.getTime();
    }).length;
    if (recent >= settings.maxPer24h && kind !== "auto-reply") {
      return { ...base, sendAt: when.toISOString(), status: "skipped", note: `Skipped — already ${settings.maxPer24h} texts to this number within 24 hours` };
    }

    return { ...base, sendAt: when.toISOString(), status: "queued", note };
  };

  /** Plans the standard reminders for a tour. */
  const plan = (tour: Tour, from: Date): Sms[] => {
    const out: Sms[] = [];
    const start = new Date(tour.startsAt);
    const push = (key: ReminderKey, at: Date, opts?: { notAfter?: Date; allowNextDay?: boolean }) => {
      if (!settings.enabled[key]) return;
      out.push(enqueue(out, tour, key, render(settings.templates[key], tour), at, opts));
    };
    push("confirmation", from, { notAfter: start, allowNextDay: true });
    const r24 = new Date(start.getTime() - 24 * 3_600_000);
    if (r24 > from) push("reminder-24h", r24, { notAfter: start });
    const r2 = new Date(start.getTime() - 2 * 3_600_000);
    if (r2 > from) push("reminder-2h", r2, { notAfter: start });
    return out;
  };

  const skipQueued = (list: Sms[], tourId: string, reason: string) =>
    list.map((m) => (m.tourId === tourId && m.status === "queued" ? { ...m, status: "skipped" as const, note: reason } : m));

  const schedule: Store["schedule"] = (input) => {
    const tour: Tour = { ...input, id: `tour-${Date.now()}`, status: "scheduled", createdAt: new Date().toISOString() };
    setState((s) => ({ tours: [...s.tours, tour], messages: [...s.messages, ...plan(tour, new Date())] }));
    return tour.id;
  };

  const reschedule: Store["reschedule"] = (tourId, startsAt) => {
    setState((s) => {
      const t = s.tours.find((x) => x.id === tourId);
      if (!t) return s;
      const moved: Tour = { ...t, startsAt, status: "scheduled" };
      return {
        tours: s.tours.map((x) => (x.id === tourId ? moved : x)),
        messages: [...skipQueued(s.messages, tourId, "Tour was rescheduled"), ...plan(moved, new Date())],
      };
    });
  };

  const cancel: Store["cancel"] = (tourId, notify) => {
    setState((s) => {
      const t = s.tours.find((x) => x.id === tourId);
      if (!t) return s;
      let msgs = skipQueued(s.messages, tourId, "Tour was cancelled");
      if (notify) {
        msgs = [...msgs, enqueue([], t, "cancelled", render("{center}: Your tour on {day} at {time} has been cancelled. Reply here if you'd like to pick a new time.", t), new Date(), { allowNextDay: true })];
      }
      return { tours: s.tours.map((x) => (x.id === tourId ? { ...x, status: "cancelled" } : x)), messages: msgs };
    });
  };

  const setOutcome: Store["setOutcome"] = (tourId, outcome) => {
    setState((s) => {
      const t = s.tours.find((x) => x.id === tourId);
      if (!t) return s;
      let msgs = skipQueued(s.messages, tourId, outcome === "completed" ? "Tour already happened" : "Marked as a no-show");
      if (outcome === "completed" && settings.enabled["follow-up"]) {
        const next = new Date();
        next.setDate(next.getDate() + 1);
        next.setHours(10, 0, 0, 0);
        msgs = [...msgs, enqueue(msgs, t, "follow-up", render(settings.templates["follow-up"], t), next)];
      }
      if (outcome === "no-show" && settings.enabled["no-show"]) {
        msgs = [...msgs, enqueue(msgs, t, "no-show", render(settings.templates["no-show"], t), new Date(), { allowNextDay: true })];
      }
      return { tours: s.tours.map((x) => (x.id === tourId ? { ...x, status: outcome } : x)), messages: msgs };
    });
  };

  const receive: Store["receive"] = (tourId, body) => {
    const text = body.trim();
    if (!text) return;
    const word = text.toUpperCase().replace(/[^A-Z]/g, "");
    setState((s) => {
      const t = s.tours.find((x) => x.id === tourId);
      if (!t) return s;
      const nowIso = new Date().toISOString();
      const incoming: Sms = { id: `sms-in-${Date.now()}`, tourId, phone: t.phone, direction: "in", kind: "reply", body: text, sendAt: nowIso, status: "received" };
      const reply = (tpl: string): Sms => ({
        id: `sms-auto-${Date.now()}`, tourId, phone: t.phone, direction: "out", kind: "auto-reply",
        // Required replies to STOP/HELP go out regardless of the send window.
        body: render(tpl, t), sendAt: new Date(Date.now() + 1000).toISOString(), status: "queued",
      });
      let tours = s.tours;
      let msgs = [...s.messages, incoming];

      if (STOP_WORDS.includes(word)) {
        setOptedOut((o) => [...new Set([...o, normPhone(t.phone)])]);
        msgs = s.messages
          .map((m) => (normPhone(m.phone) === normPhone(t.phone) && m.status === "queued" ? { ...m, status: "blocked" as const, note: "Family replied STOP" } : m))
          .concat(incoming, reply("{center}: You're unsubscribed and won't get more texts from us. Reply START to resubscribe."));
      } else if (START_WORDS.includes(word) && optedOut.includes(normPhone(t.phone))) {
        setOptedOut((o) => o.filter((p) => p !== normPhone(t.phone)));
        msgs.push(reply("{center}: You're resubscribed to tour texts. Reply STOP to opt out."));
      } else if (word === "HELP" || word === "INFO") {
        msgs.push(reply("{center}: Tour reminders for {family}. Questions? Call {phone}. Reply STOP to opt out."));
      } else if (word === "C" || word === "CONFIRM" || word === "Y") {
        tours = tours.map((x) => (x.id === tourId ? { ...x, status: "confirmed" } : x));
        msgs.push(reply("{center}: Thanks, you're confirmed. See you {day} at {time}!"));
      } else if (word === "R" || word === "RESCHEDULE" || word.startsWith("RESCHED")) {
        tours = tours.map((x) => (x.id === tourId ? { ...x, status: "reschedule-requested" } : x));
        msgs.push(reply("{center}: No problem. Someone from our office will text you shortly with new times."));
      }
      // Anything else is a real message for a person to answer — no auto-reply.
      return { tours, messages: msgs };
    });
  };

  const sendManual: Store["sendManual"] = (tourId, body) => {
    const t = tours.find((x) => x.id === tourId);
    if (!t || !body.trim()) return "Write a message first.";
    if (!t.smsConsent) return "This family didn't agree to texts when booking. Call them instead.";
    if (isOptedOut(t.phone)) return "This family replied STOP. You can't text them unless they reply START.";
    const h = new Date().getHours();
    if (h < settings.windowStart || h >= settings.windowEnd) return `Texting hours are ${settings.windowStart} AM to ${settings.windowEnd - 12} PM. Try again then, or call.`;
    const m = enqueue([], t, "manual", body.trim(), new Date());
    if (m.status !== "queued") return m.note ?? "Couldn't send.";
    setState((s) => ({ ...s, messages: [...s.messages, { ...m, status: "delivered" }] }));
    return null;
  };

  const sendNow: Store["sendNow"] = (smsId) => {
    setState((s) => ({
      ...s,
      messages: s.messages.map((m) => (m.id === smsId && m.status === "queued" ? { ...m, status: "delivered", sendAt: new Date().toISOString(), note: "Sent early by staff" } : m)),
    }));
  };

  const value = useMemo<Store>(
    () => ({ tours, messages, settings, optedOut, now, at, thread, isOptedOut, schedule, reschedule, cancel, setOutcome, receive, sendManual, sendNow, updateSettings: setSettings }),
    [tours, messages, settings, optedOut, now],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTours() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTours must be used inside <ToursProvider>");
  return ctx;
}

// ─── Seed ───────────────────────────────────────────────────────

function at(daysFromNow: number, hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function seedState(settings: TourSettings): { tours: Tour[]; messages: Sms[] } {
  const mk = (t: Omit<Tour, "createdAt"> & { bookedDaysAgo: number }): Tour => {
    const { bookedDaysAgo, ...rest } = t;
    return { ...rest, createdAt: at(-bookedDaysAgo, 15, 5).toISOString() };
  };
  const tours: Tour[] = [
    mk({ id: "tour-1", leadId: "e2", facilityId: "f1", childName: "Lucas Shaw", ageGroup: "Toddler (18–36 mo)", guardianName: "David Shaw", phone: "(954) 555-0822", startsAt: at(1, 9).toISOString(), guide: "Patricia Lane", status: "scheduled", smsConsent: true, bookedDaysAgo: 3 }),
    mk({ id: "tour-2", leadId: "e1", facilityId: "f1", childName: "Mia Fernandez", ageGroup: "Infant (0–18 mo)", guardianName: "Ana Fernandez", phone: "(954) 555-0711", startsAt: at(2, 10, 30).toISOString(), guide: "Patricia Lane", status: "confirmed", smsConsent: true, bookedDaysAgo: 2 }),
    mk({ id: "tour-3", facilityId: "f1", childName: "Noelle Ellis", ageGroup: "Preschool (3–5 yr)", guardianName: "Jordan Ellis", phone: "(954) 555-0918", startsAt: at(3, 14, 30).toISOString(), guide: "Patricia Lane", status: "scheduled", smsConsent: false, bookedDaysAgo: 1, notes: "Booked by phone — didn't want texts." }),
    mk({ id: "tour-4", facilityId: "f1", childName: "Owen Brooks", ageGroup: "Toddler (18–36 mo)", guardianName: "Tasha Brooks", phone: "(954) 555-0876", startsAt: at(-1, 11).toISOString(), guide: "Patricia Lane", status: "completed", smsConsent: true, bookedDaysAgo: 6 }),
    mk({ id: "tour-5", facilityId: "f1", childName: "Ruby Klein", ageGroup: "Infant (0–18 mo)", guardianName: "Sam Klein", phone: "(954) 555-0654", startsAt: at(-3, 9, 30).toISOString(), guide: "Patricia Lane", status: "no-show", smsConsent: true, bookedDaysAgo: 8 }),
    mk({ id: "tour-6", facilityId: "f2", childName: "Eli Warren", ageGroup: "Preschool (3–5 yr)", guardianName: "Dana Warren", phone: "(561) 555-0733", startsAt: at(1, 15).toISOString(), guide: "Kevin Brooks", status: "reschedule-requested", smsConsent: true, bookedDaysAgo: 4 }),
  ];

  const nowMs = Date.now();
  const msgs: Sms[] = [];
  let n = 0;
  const out = (tour: Tour, kind: SmsKind, when: Date, body?: string, extra: Partial<Sms> = {}) => {
    msgs.push({
      id: `seed-sms-${++n}`, tourId: tour.id, phone: tour.phone, direction: "out", kind,
      body: body ?? render(settings.templates[kind as ReminderKey], tour),
      sendAt: when.toISOString(), status: when.getTime() <= nowMs ? "delivered" : "queued", ...extra,
    });
  };
  const inn = (tour: Tour, when: Date, body: string) =>
    msgs.push({ id: `seed-sms-${++n}`, tourId: tour.id, phone: tour.phone, direction: "in", kind: "reply", body, sendAt: when.toISOString(), status: "received" });

  const byId = (id: string) => tours.find((t) => t.id === id)!;
  const start = (t: Tour) => new Date(t.startsAt);
  const hoursBefore = (t: Tour, h: number) => new Date(start(t).getTime() - h * 3_600_000);
  const clamp8 = (d: Date) => { if (d.getHours() < 8) d.setHours(8, 0, 0, 0); return d; };

  // Lucas — booked three days ago, confirmation delivered, two reminders queued.
  const t1 = byId("tour-1");
  out(t1, "confirmation", new Date(t1.createdAt));
  out(t1, "reminder-24h", hoursBefore(t1, 24));
  out(t1, "reminder-2h", clamp8(hoursBefore(t1, 2)), undefined, { note: "Moved to 8:00 AM — outside texting hours" });

  // Mia — confirmed by replying C.
  const t2 = byId("tour-2");
  out(t2, "confirmation", new Date(t2.createdAt));
  inn(t2, new Date(new Date(t2.createdAt).getTime() + 12 * 60_000), "C");
  out(t2, "auto-reply", new Date(new Date(t2.createdAt).getTime() + 12 * 60_000 + 1000), render("{center}: Thanks, you're confirmed. See you {day} at {time}!", t2));
  out(t2, "reminder-24h", hoursBefore(t2, 24));
  out(t2, "reminder-2h", hoursBefore(t2, 2));

  // Jordan — no consent, so everything is blocked and staff are told to call.
  const t3 = byId("tour-3");
  msgs.push({ id: `seed-sms-${++n}`, tourId: t3.id, phone: t3.phone, direction: "out", kind: "confirmation", body: render(settings.templates.confirmation, t3), sendAt: t3.createdAt, status: "blocked", note: "No texting consent on file — call instead" });

  // Owen — toured yesterday, thank-you queued for this morning.
  const t4 = byId("tour-4");
  out(t4, "confirmation", new Date(t4.createdAt));
  out(t4, "reminder-24h", hoursBefore(t4, 24));
  out(t4, "reminder-2h", clamp8(hoursBefore(t4, 2)));
  out(t4, "follow-up", at(0, 10));

  // Ruby — didn't show; the missed-tour text went out.
  const t5 = byId("tour-5");
  out(t5, "confirmation", new Date(t5.createdAt));
  out(t5, "reminder-24h", hoursBefore(t5, 24));
  out(t5, "reminder-2h", clamp8(hoursBefore(t5, 2)));
  out(t5, "no-show", new Date(start(t5).getTime() + 45 * 60_000));

  // Dana (Boca) — asked to reschedule, and asked a real question.
  const t6 = byId("tour-6");
  out(t6, "confirmation", new Date(t6.createdAt));
  inn(t6, at(0, 7, 48), "R");
  out(t6, "auto-reply", at(0, 7, 48), render("{center}: No problem. Someone from our office will text you shortly with new times.", t6));
  inn(t6, at(0, 7, 50), "Could we do Thursday afternoon instead? My husband wants to come too.");
  out(t6, "reminder-24h", hoursBefore(t6, 24), undefined, { status: "skipped", note: "Tour needs rescheduling" });

  return { tours, messages: msgs };
}
