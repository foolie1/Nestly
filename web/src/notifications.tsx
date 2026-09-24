/**
 * Notification centre.
 *
 * There is no separate notifications table. Everything here is derived from
 * what is already true in the other stores — an unanswered message, an
 * unsigned incident, a missing DH 680, an overdue invoice — so a notification
 * cannot drift out of step with the thing it is about. Acting on the cause
 * makes the notification disappear on the next render, which is the behaviour
 * you want and the one a stored list gets wrong.
 *
 * Read state is per user and lives in localStorage, because "I already looked
 * at that" is a per-person, per-device fact rather than shared data.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CalendarClock, CreditCard, FileSignature, MessageSquare, ShieldAlert, Sparkles, X, type LucideIcon } from "lucide-react";
import { useAuth } from "./auth";
import { useRoster } from "./roster";
import { useMessages } from "./messages";
import { useLogs } from "./logs";
import { useIncidents } from "./incidents";
import { useBilling } from "./billing";
import { REQUIRED_FORMS, TEMPLATE, useForms } from "./forms";
import { useTours, fmtWhen } from "./tours";

export type NoteKind = "message" | "incident" | "billing" | "compliance" | "activity";

export type Note = {
  id: string;
  kind: NoteKind;
  title: string;
  body: string;
  /** What the user reads. */
  when: string;
  /** What we sort on — any consistently comparable string. */
  at: string;
  /** Nav target for the whole row. */
  page: string;
  /** Pulls it to the top and colours it red. */
  urgent?: boolean;
};

const KIND: Record<NoteKind, { Icon: LucideIcon; bg: string; fg: string }> = {
  message: { Icon: MessageSquare, bg: "bg-accent-soft", fg: "text-accent" },
  incident: { Icon: ShieldAlert, bg: "bg-danger-soft", fg: "text-danger" },
  billing: { Icon: CreditCard, bg: "bg-warning-soft", fg: "text-warning" },
  compliance: { Icon: FileSignature, bg: "bg-purple-soft", fg: "text-purple" },
  activity: { Icon: Sparkles, bg: "bg-pink-soft", fg: "text-pink" },
};

const readKey = (userId: string) => `nestly.readNotes.${userId}`;

const loadRead = (userId: string): string[] => {
  try {
    return JSON.parse(localStorage.getItem(readKey(userId)) || "[]");
  } catch {
    return [];
  }
};

const todayISO = () => new Date().toISOString().slice(0, 10);

/** Builds the list for whoever is signed in. */
export function useNotifications(facilityId: string) {
  const { user } = useAuth();
  const { roster } = useRoster();
  const { visibleThreads, needsReply } = useMessages();
  const { entries } = useLogs();
  const { at: incidentsAt } = useIncidents();
  const { at: invoicesAt, forChildren } = useBilling();
  const { statusFor, latest, pendingAt } = useForms();
  const { at: toursAt, thread, isOptedOut } = useTours();

  const notes = useMemo<Note[]>(() => {
    if (!user) return [];
    const out: Note[] = [];
    const today = todayISO();

    // Office admins have no compliance page, so their compliance-flavoured
    // notifications go where they can actually act on them.
    const compliancePage = user.role === "office_admin" ? "enrollment" : "compliance";

    if (user.role === "parent") {
      const mine = roster.filter((c) => user.childIds?.includes(c.id));
      const mineIds = mine.map((c) => c.id);

      visibleThreads().forEach((t) => {
        const last = t.messages[t.messages.length - 1];
        if (!last || last.senderRole === "parent" || last.system) return;
        out.push({
          id: `msg-${t.id}-${last.id}`,
          kind: "message",
          title: t.kind === "broadcast" ? `Announcement · ${t.title}` : `${last.senderName} replied`,
          body: last.body.length > 110 ? `${last.body.slice(0, 110)}…` : last.body,
          when: last.time,
          at: last.at ?? last.time,
          page: "p-messages",
        });
      });

      // Photos and incidents from today's feed.
      entries
        .filter((e) => mineIds.includes(e.childId))
        .forEach((e) => {
          if (e.type === "incident") {
            out.push({
              id: `inc-log-${e.id}`,
              kind: "incident",
              title: `Incident logged for ${e.childName.split(" ")[0]}`,
              body: e.detail,
              when: e.timestamp,
              at: `${today} ${e.timestamp}`,
              page: "p-home",
              urgent: true,
            });
          } else if ((e.media?.length ?? 0) > 0 || (e.videos?.length ?? 0) > 0) {
            const np = e.media?.length ?? 0;
            const nv = e.videos?.length ?? 0;
            const what = [np && `${np} new photo${np === 1 ? "" : "s"}`, nv && `${nv === 1 ? "a new video" : `${nv} new videos`}`].filter(Boolean).join(" and ");
            out.push({
              id: `photo-${e.id}`,
              kind: "activity",
              title: `${what.charAt(0).toUpperCase()}${what.slice(1)} of ${e.childName.split(" ")[0]}`,
              body: e.title ?? e.detail,
              when: e.timestamp,
              at: `${today} ${e.timestamp}`,
              page: "p-home",
            });
          }
        });

      forChildren(mine.map((c) => c.name))
        .filter((i) => i.status !== "paid")
        .forEach((i) => {
          out.push({
            id: `inv-${i.id}`,
            kind: "billing",
            title: i.status === "overdue" ? `Tuition overdue · $${i.amount.toLocaleString()}` : `Tuition due · $${i.amount.toLocaleString()}`,
            body: `${i.period} · due ${i.dueDate}`,
            when: i.dueDate,
            at: i.dueDate,
            page: "p-billing",
            urgent: i.status === "overdue",
          });
        });

      // Paperwork: anything sent back is urgent; anything never started isn't.
      mine.forEach((c) => {
        REQUIRED_FORMS.forEach((t) => {
          const st = statusFor(c.id, t.id);
          if (st === "returned") {
            const last = latest(c.id, t.id);
            out.push({
              id: `form-ret-${last?.id}`,
              kind: "compliance",
              title: `${t.name} sent back`,
              body: last?.reviewNote ?? "The office asked for a change.",
              when: last?.reviewedAt?.slice(0, 10) ?? "",
              at: last?.reviewedAt ?? "",
              page: "p-family",
              urgent: true,
            });
          } else if (st === "not-started") {
            out.push({
              id: `form-todo-${c.id}-${t.id}`,
              kind: "compliance",
              title: `Form to fill out · ${c.name.split(" ")[0]}`,
              body: `${t.name} — about ${t.minutes} min, right in the app.`,
              when: "",
              at: "0000",
              page: "p-family",
            });
          }
        });
      });

      return sort(out);
    }

    // ── Staff and admin ──────────────────────────────────────────
    visibleThreads(facilityId).forEach((t) => {
      if (!needsReply(t)) return;
      const last = t.messages[t.messages.length - 1];
      if (!last) return;
      out.push({
        id: `msg-${t.id}-${last.id}`,
        kind: "message",
        title: `${t.familyName ?? last.senderName} is waiting on a reply`,
        body: last.body.length > 110 ? `${last.body.slice(0, 110)}…` : last.body,
        when: last.time,
        at: last.at ?? last.time,
        page: "messaging",
      });
    });

    const roomScope = (room?: string) => user.role !== "staff" || room === user.room;

    incidentsAt(facilityId)
      .filter((i) => roomScope(i.room))
      .forEach((i) => {
        if (!i.guardianSigned) {
          out.push({
            id: `inc-${i.id}`,
            kind: "incident",
            title: `${i.type} · ${i.childName}`,
            body: i.guardianNotified ? "Guardian notified — signature still outstanding." : "Guardian has not been notified yet.",
            when: i.date,
            at: `${i.date} ${i.time ?? ""}`,
            page: user.role === "staff" ? "logs" : compliancePage,
            urgent: !i.guardianNotified || i.severity === "high",
          });
        }
      });

    if (user.role === "staff") {
      // A lapsed medication authorization is the teacher's problem the moment
      // the child needs a dose, so surface it before that happens.
      roster
        .filter((c) => c.facilityId === facilityId && c.room === user.room)
        .forEach((c) => {
          (c.medications ?? []).forEach((m) => {
            if (m.authorizedUntil < today) {
              out.push({
                id: `med-${c.id}-${m.id}`,
                kind: "compliance",
                title: `${m.name} authorization expired`,
                body: `${c.name} — expired ${m.authorizedUntil}. Do not administer until the office has a new form.`,
                when: m.authorizedUntil,
                at: m.authorizedUntil,
                page: "my-room",
                urgent: true,
              });
            }
          });
        });
      return sort(out);
    }

    // Admin-only items.

    // Tours: families who asked to move, asked a question, or can't be texted.
    const KEYWORDS = ["C", "R", "Y", "YES", "CONFIRM", "STOP", "HELP", "START"];
    const soon = Date.now() + 48 * 3_600_000;
    toursAt(facilityId)
      .filter((t) => ["scheduled", "confirmed", "reschedule-requested"].includes(t.status) && new Date(t.startsAt).getTime() > Date.now() - 3_600_000)
      .forEach((t) => {
        const msgs = thread(t.id);
        const lastIn = [...msgs].reverse().find((m) => m.direction === "in");
        const answered = lastIn && msgs.some((m) => m.kind === "manual" && m.sendAt > lastIn.sendAt);
        if (lastIn && !answered && !KEYWORDS.includes(lastIn.body.trim().toUpperCase())) {
          out.push({ id: `tour-q-${lastIn.id}`, kind: "message", title: `${t.guardianName} texted about their tour`, body: `"${lastIn.body}"`, when: fmtWhen(lastIn.sendAt), at: lastIn.sendAt, page: "tours", urgent: true });
        } else if (t.status === "reschedule-requested") {
          out.push({ id: `tour-rs-${t.id}`, kind: "message", title: `${t.guardianName} wants to reschedule`, body: `Tour was ${fmtWhen(t.startsAt)}`, when: "", at: t.startsAt, page: "tours", urgent: true });
        } else if ((!t.smsConsent || isOptedOut(t.phone)) && new Date(t.startsAt).getTime() < soon) {
          out.push({ id: `tour-call-${t.id}`, kind: "message", title: `Call ${t.guardianName} to confirm their tour`, body: `${fmtWhen(t.startsAt)} · ${t.smsConsent ? "they replied STOP" : "no texting consent"}`, when: "", at: t.startsAt, page: "tours" });
        }
      });

    pendingAt(facilityId).forEach((sub) => {
      const c = roster.find((x) => x.id === sub.childId);
      out.push({
        id: `form-review-${sub.id}`,
        kind: "compliance",
        title: `${TEMPLATE[sub.formId].name} to review`,
        body: `${c?.name ?? "A child"} · sent by ${sub.signedName}`,
        when: sub.submittedAt.slice(0, 10),
        at: sub.submittedAt,
        page: "paperwork",
      });
    });

    roster
      .filter((c) => c.facilityId === facilityId && c.immunizationStatus !== "current")
      .forEach((c) => {
        out.push({
          id: `imm-${c.id}`,
          kind: "compliance",
          title: c.immunizationStatus === "missing" ? `DH 680 missing · ${c.name}` : `DH 680 expiring · ${c.name}`,
          body: c.immunizationStatus === "missing" ? "Child may be excluded 30 days after enrollment." : "Ask the family for the updated form.",
          when: c.enrollmentDate,
          at: c.enrollmentDate,
          page: compliancePage,
          urgent: c.immunizationStatus === "missing",
        });
      });

    invoicesAt(facilityId)
      .filter((i) => i.status === "overdue")
      .forEach((i) => {
        out.push({
          id: `inv-${i.id}`,
          kind: "billing",
          title: `Overdue · ${i.family}`,
          body: `$${i.amount.toLocaleString()} · ${i.period} · due ${i.dueDate}`,
          when: i.dueDate,
          at: i.dueDate,
          page: "billing",
        });
      });

    roster
      .filter((c) => c.facilityId === facilityId && c.enrolledOverCapacity)
      .forEach((c) => {
        out.push({
          id: `cap-${c.id}`,
          kind: "compliance",
          title: `${c.name} is enrolled over room capacity`,
          body: `${c.room} was full when this enrollment was approved. Staffing needs to cover it.`,
          when: c.enrollmentDate,
          at: c.enrollmentDate,
          page: "enrollment",
        });
      });

    return sort(out);
  }, [user, roster, facilityId, visibleThreads, needsReply, entries, incidentsAt, invoicesAt, forChildren, statusFor, latest, pendingAt, toursAt, thread, isOptedOut]);

  return notes;
}

/** Urgent first, then newest. */
function sort(notes: Note[]) {
  return notes.sort((a, b) => {
    if (!!a.urgent !== !!b.urgent) return a.urgent ? -1 : 1;
    return b.at.localeCompare(a.at);
  });
}

type Props = { facilityId: string; onNav: (page: string) => void };

export function NotificationBell({ facilityId, onNav }: Props) {
  const { user } = useAuth();
  const notes = useNotifications(facilityId);
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<string[]>([]);

  // Read state is per signed-in user, so switching demo accounts doesn't
  // inherit somebody else's "already seen".
  useEffect(() => {
    setRead(user ? loadRead(user.id) : []);
  }, [user?.id]);

  const persist = useCallback(
    (ids: string[]) => {
      setRead(ids);
      if (!user) return;
      try {
        localStorage.setItem(readKey(user.id), JSON.stringify(ids));
      } catch {
        /* private browsing — the list just won't be remembered */
      }
    },
    [user?.id],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = () => setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, [open]);

  const unread = notes.filter((n) => !read.includes(n.id));
  const count = unread.length;

  const openNote = (n: Note) => {
    if (!read.includes(n.id)) persist([...read, n.id]);
    setOpen(false);
    onNav(n.page);
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={count === 0 ? "Notifications, none unread" : `Notifications, ${count} unread`}
        title="Notifications"
        className="relative w-11 h-11 flex items-center justify-center text-muted hover:text-brand rounded-ctl hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Bell size={20} aria-hidden />
        {count > 0 && (
          <span
            aria-hidden
            className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-danger text-white text-[10px] font-bold leading-4 text-center"
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="fixed inset-x-2 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-1 sm:w-96 bg-surface border border-line rounded-card shadow-2xl z-50 max-h-[70vh] flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <h2 className="font-semibold text-brand">
              Notifications {count > 0 && <span className="text-xs font-mono text-muted">· {count} unread</span>}
            </h2>
            <div className="flex items-center gap-1">
              {count > 0 && (
                <button
                  onClick={() => persist(notes.map((n) => n.id))}
                  className="text-xs font-medium text-accent min-h-9 px-2 rounded-ctl hover:bg-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="w-9 h-9 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
          </div>

          <ul className="overflow-y-auto divide-y divide-line">
            {notes.map((n) => {
              const k = KIND[n.kind];
              const isRead = read.includes(n.id);
              return (
                <li key={n.id}>
                  <button
                    onClick={() => openNote(n)}
                    className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${isRead ? "opacity-60" : ""}`}
                  >
                    <span className={`w-9 h-9 rounded-card flex items-center justify-center flex-shrink-0 ${n.urgent ? "bg-danger-soft text-danger" : `${k.bg} ${k.fg}`}`}>
                      <k.Icon size={18} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`text-sm truncate ${isRead ? "font-medium text-ink" : "font-semibold text-brand"}`}>{n.title}</span>
                        {n.when && <time className="text-[11px] font-mono text-muted flex-shrink-0">{n.when}</time>}
                      </span>
                      <span className="block text-xs text-muted mt-0.5 line-clamp-2">{n.body}</span>
                    </span>
                    {!isRead && <span aria-hidden className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5" />}
                  </button>
                </li>
              );
            })}
            {notes.length === 0 && (
              <li className="px-4 py-10 text-center">
                <p className="text-sm font-medium text-brand">You're all caught up</p>
                <p className="text-xs text-muted mt-1">Messages, incidents and anything needing paperwork will show up here.</p>
              </li>
            )}
          </ul>

          <p className="px-4 py-2.5 border-t border-line text-[11px] text-muted">
            These are built from what's actually open right now — clear the underlying item and it leaves this list.
          </p>
        </div>
      )}
    </div>
  );
}
