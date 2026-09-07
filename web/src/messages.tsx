/**
 * Shared message store — one source of truth for every role.
 *
 * Two conversation shapes:
 *   • Classroom chat (kind "child") — ongoing, never closed. Day-to-day teacher ↔ parent.
 *   • Tickets (kind "office") — a request with a subject + category that gets
 *     answered and then RESOLVED. Once resolved the family can read it but not
 *     reply; they open a new request instead. Admins can also open a ticket
 *     themselves to raise something with a family ("outreach").
 *   • Broadcasts (kind "broadcast") — one-way announcements.
 *
 * Visibility:
 *   parent        → their own child's threads + tickets + center broadcasts
 *   staff         → their room's classroom chats + broadcasts
 *   office_admin  → tickets + broadcasts for their center
 *   director      → every thread in their center
 *   owner         → every thread in the selected center
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { children, facilities, type DemoUser, type Role } from "./data";
import { useAuth } from "./auth";

export type SenderRole = "parent" | "staff" | "office_admin" | "director" | "owner" | "system";

export type Msg = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: SenderRole;
  body: string;
  /** "HH:MM" today, or "Mon D" for older */
  time: string;
  /** ISO-ish sort key */
  at: string;
  /** System notes ("Resolved by …") render differently and aren't replies. */
  system?: boolean;
};

export type ThreadKind = "child" | "office" | "broadcast";
export type TicketStatus = "open" | "answered" | "resolved";

export type TicketCategory = "billing" | "schedule" | "absence" | "documents" | "health" | "other";

export const CATEGORIES: { id: TicketCategory; label: string; hint: string }[] = [
  { id: "billing", label: "Billing & tuition", hint: "Invoices, autopay, statements" },
  { id: "schedule", label: "Schedule change", hint: "Days, hours, part-time" },
  { id: "absence", label: "Absence or vacation", hint: "Let us know they'll be out" },
  { id: "documents", label: "Forms & documents", hint: "DH 680, agreements, signatures" },
  { id: "health", label: "Health & allergies", hint: "Medication, allergy updates" },
  { id: "other", label: "Something else", hint: "Anything not listed" },
];

export const CATEGORY_LABEL: Record<TicketCategory, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label]),
) as Record<TicketCategory, string>;

export type Thread = {
  id: string;
  facilityId: string;
  kind: ThreadKind;
  /** child threads: the child + their room */
  childId?: string;
  room?: string;
  /** office tickets: which family; broadcasts: audience label */
  familyName?: string;
  title: string;
  messages: Msg[];
  /** office has opened it (demo state) */
  readByOffice: boolean;
  /** tickets only */
  status?: TicketStatus;
  category?: TicketCategory;
  /** who started it — drives "your request" vs "from the center" wording */
  openedBy?: "parent" | "center";
  resolvedBy?: string;
  resolvedAt?: string;
  /** display date, e.g. "Aug 31" */
  resolvedOn?: string;
};

export const ROLE_LABEL: Record<SenderRole, string> = {
  parent: "Parent",
  staff: "Teacher",
  office_admin: "Office",
  director: "Director",
  owner: "Owner",
  system: "System",
};

/** Only the admin side closes tickets. Teachers reply but can't resolve. */
export function canClose(role: Role | undefined) {
  return role === "owner" || role === "director" || role === "office_admin";
}

const seed: Thread[] = [
  // ── Classroom chats (never closed) ──────────────────────────
  {
    id: "t-c1", facilityId: "f1", kind: "child", childId: "c1", room: "Bluebell Infants", familyName: "Torres", title: "Amelia Torres · Bluebell Infants", readByOffice: true,
    messages: [
      { id: "m1", senderId: "u-parent", senderName: "Maria Torres", senderRole: "parent", body: "Hi Denise, my mother will be picking up Amelia today around 3:30. Her name is Carmen Torres and she's on the authorized pickup list.", time: "08:14", at: "2026-08-31T08:14" },
      { id: "m2", senderId: "u-staff", senderName: "Denise Morales", senderRole: "staff", body: "Got it, thank you Maria! We'll have her ready. Amelia's had a great morning so far 😊", time: "08:21", at: "2026-08-31T08:21" },
    ],
  },
  {
    id: "t-c2", facilityId: "f1", kind: "child", childId: "c2", room: "Bluebell Infants", familyName: "Patel", title: "Noah Patel · Bluebell Infants", readByOffice: false,
    messages: [
      { id: "m3", senderId: "u-parent2", senderName: "Priya Patel", senderRole: "parent", body: "Noah didn't sleep well last night — he might be extra fussy at nap time today. Sorry in advance!", time: "07:48", at: "2026-08-31T07:48" },
    ],
  },
  {
    id: "t-c3", facilityId: "f1", kind: "child", childId: "c3", room: "Sunflower Toddlers", familyName: "Reyes", title: "Sofia Reyes · Sunflower Toddlers", readByOffice: false,
    messages: [
      { id: "m4", senderId: "u-staff2", senderName: "Gloria Sánchez", senderRole: "staff", body: "Hi Carlos — quick heads up that Sofia bit another child during free play today. No skin broken, ice applied. Incident report is in your Family tab and needs your signature.", time: "Aug 27", at: "2026-08-27T15:10" },
      { id: "m5", senderId: "g-reyes", senderName: "Carlos Reyes", senderRole: "parent", body: "Thanks for letting me know. Is this the first time? We haven't seen this at home and I'd like to talk to someone about it.", time: "Aug 27", at: "2026-08-27T18:40" },
    ],
  },
  {
    id: "t-c6", facilityId: "f1", kind: "child", childId: "c6", room: "Clover Preschool", familyName: "Williams", title: "James Williams · Clover Preschool", readByOffice: true,
    messages: [
      { id: "m6", senderId: "u-staff3", senderName: "Marcus Webb", senderRole: "staff", body: "James had a small fall during circle time today — no injury, we watched him for 15 minutes and he was back to normal. Just wanted you to hear it from us first.", time: "10:35", at: "2026-08-31T10:35" },
    ],
  },

  // ── Tickets ─────────────────────────────────────────────────
  {
    id: "t-o1", facilityId: "f1", kind: "office", childId: "c2", familyName: "Patel", title: "August invoice amount looks wrong",
    category: "billing", status: "answered", openedBy: "parent", readByOffice: false,
    messages: [
      { id: "m7", senderId: "u-parent2", senderName: "Priya Patel", senderRole: "parent", body: "Hello, I noticed my August invoice shows a different amount than I expected. Could someone please review this?", time: "Aug 30", at: "2026-08-30T15:42" },
      { id: "m8", senderId: "u-office", senderName: "Front Office", senderRole: "office_admin", body: "Hi Priya — looking into it now, we'll have an answer for you by tomorrow morning.", time: "Aug 30", at: "2026-08-30T16:05" },
      { id: "m9", senderId: "u-parent2", senderName: "Priya Patel", senderRole: "parent", body: "Any update on this? Autopay runs on the 1st and I don't want to be charged the wrong amount.", time: "08:02", at: "2026-08-31T08:02" },
    ],
  },
  {
    id: "t-o3", facilityId: "f1", kind: "office", childId: "c3", familyName: "Reyes", title: "August tuition past due",
    category: "billing", status: "open", openedBy: "center", readByOffice: true,
    messages: [
      { id: "m10", senderId: "u-office", senderName: "Front Office", senderRole: "office_admin", body: "Hi Carlos, a reminder that the August tuition ($1,250) is past due. You can pay in the Billing tab or call us to set up a plan.", time: "Aug 29", at: "2026-08-29T09:00" },
    ],
  },
  {
    id: "t-o5", facilityId: "f1", kind: "office", childId: "c1", familyName: "Torres", title: "Vacation days Sept 8–12",
    category: "absence", status: "resolved", openedBy: "parent", readByOffice: true,
    resolvedBy: "Front Office", resolvedOn: "Aug 26",
    messages: [
      { id: "m15", senderId: "u-parent", senderName: "Maria Torres", senderRole: "parent", body: "Amelia will be out the week of September 8th — we're travelling. Do I still get billed for those days?", time: "Aug 25", at: "2026-08-25T10:12" },
      { id: "m16", senderId: "u-office", senderName: "Front Office", senderRole: "office_admin", body: "Thanks for the notice, Maria. We've marked her absent for Sept 8–12. Tuition holds your spot so those days are still billed, but there's no late fee and no need to do anything else.", time: "Aug 26", at: "2026-08-26T09:30" },
      { id: "m17", senderId: "sys", senderName: "System", senderRole: "system", body: "Request resolved by Front Office.", time: "Aug 26", at: "2026-08-26T09:31", system: true },
    ],
  },

  // ── Broadcast ───────────────────────────────────────────────
  {
    id: "t-b1", facilityId: "f1", kind: "broadcast", familyName: "All families", title: "Labor Day closure", readByOffice: true,
    messages: [
      { id: "m11", senderId: "u-admin", senderName: "Sunshine Childcare Group", senderRole: "owner", body: "Reminder: all three centers will be CLOSED Monday, September 1st for Labor Day. Emergency contact for facility issues: (954) 555-0001.", time: "Aug 28", at: "2026-08-28T09:00" },
    ],
  },

  // ── Second center ───────────────────────────────────────────
  {
    id: "t-c8", facilityId: "f2", kind: "child", childId: "c8", room: "Daisy Infants", familyName: "Nguyen", title: "Oliver Nguyen · Daisy Infants", readByOffice: true,
    messages: [
      { id: "m12", senderId: "g-nguyen", senderName: "Lan Nguyen", senderRole: "parent", body: "Oliver has a new bottle — it's the green one in his bag. The old one leaks.", time: "07:30", at: "2026-08-31T07:30" },
      { id: "m13", senderId: "s5", senderName: "Jade Osei", senderRole: "staff", body: "Perfect, found it. Thanks Lan!", time: "07:41", at: "2026-08-31T07:41" },
    ],
  },
  {
    id: "t-o4", facilityId: "f2", kind: "office", childId: "c10", familyName: "Brown", title: "Past-due notice but I already paid",
    category: "billing", status: "open", openedBy: "parent", readByOffice: false,
    messages: [
      { id: "m14", senderId: "g-brown", senderName: "Karen Brown", senderRole: "parent", body: "We got a past-due notice but I paid on the 3rd. Can you check?", time: "Aug 29", at: "2026-08-29T12:15" },
    ],
  },
];

type Store = {
  threads: Thread[];
  /** Threads the current user may see, optionally scoped to a facility (owner switching centers). */
  visibleThreads: (facilityId?: string) => Thread[];
  send: (threadId: string, body: string) => void;
  markRead: (threadId: string) => void;
  /** Create a broadcast thread to all families of a center (or all centers for owner). */
  broadcast: (facilityIds: string[], title: string, body: string) => void;
  /** Parent files a new request. Returns the new thread id. */
  openTicket: (input: { childId: string; category: TicketCategory; title: string; body: string }) => string | null;
  /** Admin raises something with one family. Returns the new thread id. */
  startOutreach: (input: { childId: string; category: TicketCategory; title: string; body: string }) => string | null;
  /** Close a ticket — family can read but not reply. */
  resolve: (threadId: string) => void;
  /** Reopen a resolved ticket. */
  reopen: (threadId: string) => void;
  /** True when the last message is from a parent and nobody from the center has answered. */
  needsReply: (t: Thread) => boolean;
  /** Whether the signed-in user can post in this thread right now. */
  canReply: (t: Thread) => boolean;
};

const Ctx = createContext<Store | null>(null);

function senderRoleOf(user: DemoUser): SenderRole {
  return user.role as Role as SenderRole;
}

function stamp() {
  const now = new Date();
  return {
    time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    at: now.toISOString(),
    day: now.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };
}

export function MessagesProvider({ children: kids }: { children: ReactNode }) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>(seed);

  const needsReply = (t: Thread) => {
    if (t.status === "resolved") return false;
    const last = t.messages.filter((m) => !m.system).at(-1);
    return !!last && last.senderRole === "parent";
  };

  const canReply = (t: Thread) => {
    if (!user) return false;
    if (t.kind === "broadcast") return false;
    if (t.status === "resolved") return false;
    // Office admins don't join classroom chats; teachers don't join tickets.
    if (t.kind === "child" && user.role === "office_admin") return false;
    if (t.kind === "office" && user.role === "staff") return false;
    return true;
  };

  const visibleThreads = (facilityId?: string) => {
    if (!user) return [];
    const fid = facilityId ?? user.facilityId;
    const inFacility = threads.filter((t) => t.facilityId === fid);
    switch (user.role) {
      case "parent":
        return threads.filter(
          (t) =>
            (t.childId && user.childIds?.includes(t.childId)) ||
            (t.kind === "broadcast" && t.facilityId === user.facilityId),
        );
      case "staff":
        return inFacility.filter((t) => t.kind === "broadcast" || (t.kind === "child" && t.room === user.room));
      case "office_admin":
        return inFacility.filter((t) => t.kind !== "child");
      case "director":
      case "owner":
        return inFacility;
    }
  };

  const send = (threadId: string, body: string) => {
    if (!user || !body.trim()) return;
    const t = threads.find((x) => x.id === threadId);
    if (!t || t.status === "resolved") return;
    const s = stamp();
    const msg: Msg = {
      id: `m-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      senderRole: senderRoleOf(user),
      body: body.trim(),
      time: s.time,
      at: s.at,
    };
    const fromCenter = user.role !== "parent";
    setThreads((ts) =>
      ts.map((x) =>
        x.id === threadId
          ? {
              ...x,
              messages: [...x.messages, msg],
              readByOffice: fromCenter,
              // A center reply moves a ticket to "answered"; a parent reply reopens it to "open".
              status: x.kind === "office" ? (fromCenter ? "answered" : "open") : x.status,
            }
          : x,
      ),
    );
  };

  const markRead = (threadId: string) => {
    if (!user || user.role === "parent" || user.role === "staff") return;
    setThreads((ts) => ts.map((t) => (t.id === threadId && !t.readByOffice ? { ...t, readByOffice: true } : t)));
  };

  const makeTicket = (
    input: { childId: string; category: TicketCategory; title: string; body: string },
    openedBy: "parent" | "center",
  ) => {
    if (!user || !input.title.trim() || !input.body.trim()) return null;
    const child = children.find((c) => c.id === input.childId);
    if (!child) return null;
    const s = stamp();
    const id = `t-o-${Date.now()}`;
    const thread: Thread = {
      id,
      facilityId: child.facilityId,
      kind: "office",
      childId: child.id,
      familyName: child.guardian.split(" ").at(-1),
      title: input.title.trim(),
      category: input.category,
      status: openedBy === "parent" ? "open" : "answered",
      openedBy,
      readByOffice: openedBy === "center",
      messages: [
        {
          id: `m-${Date.now()}`,
          senderId: user.id,
          senderName: openedBy === "center" ? user.name : user.name,
          senderRole: senderRoleOf(user),
          body: input.body.trim(),
          time: s.time,
          at: s.at,
        },
      ],
    };
    setThreads((ts) => [thread, ...ts]);
    return id;
  };

  const openTicket: Store["openTicket"] = (input) => makeTicket(input, "parent");
  const startOutreach: Store["startOutreach"] = (input) => makeTicket(input, "center");

  const resolve = (threadId: string) => {
    if (!user || !canClose(user.role)) return;
    const s = stamp();
    setThreads((ts) =>
      ts.map((t) =>
        t.id === threadId
          ? {
              ...t,
              status: "resolved",
              resolvedBy: user.name,
              resolvedAt: s.at,
              resolvedOn: s.day,
              readByOffice: true,
              messages: [
                ...t.messages,
                { id: `m-sys-${Date.now()}`, senderId: "sys", senderName: "System", senderRole: "system" as const, body: `Request resolved by ${user.name}.`, time: s.time, at: s.at, system: true },
              ],
            }
          : t,
      ),
    );
  };

  const reopen = (threadId: string) => {
    if (!user || !canClose(user.role)) return;
    const s = stamp();
    setThreads((ts) =>
      ts.map((t) =>
        t.id === threadId
          ? {
              ...t,
              status: "answered",
              resolvedBy: undefined,
              resolvedAt: undefined,
              resolvedOn: undefined,
              messages: [
                ...t.messages,
                { id: `m-sys-${Date.now()}`, senderId: "sys", senderName: "System", senderRole: "system" as const, body: `Reopened by ${user.name}.`, time: s.time, at: s.at, system: true },
              ],
            }
          : t,
      ),
    );
  };

  const broadcast = (facilityIds: string[], title: string, body: string) => {
    if (!user) return;
    const s = stamp();
    const created: Thread[] = facilityIds.map((fid) => ({
      id: `t-b-${fid}-${Date.now()}`,
      facilityId: fid,
      kind: "broadcast",
      familyName: "All families",
      title,
      readByOffice: true,
      messages: [{ id: `m-${fid}-${Date.now()}`, senderId: user.id, senderName: user.name, senderRole: senderRoleOf(user), body: body.trim(), time: s.time, at: s.at }],
    }));
    setThreads((ts) => [...created, ...ts]);
  };

  const value = useMemo<Store>(
    () => ({ threads, visibleThreads, send, markRead, broadcast, openTicket, startOutreach, resolve, reopen, needsReply, canReply }),
    [threads, user],
  );
  return <Ctx.Provider value={value}>{kids}</Ctx.Provider>;
}

export function useMessages() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMessages must be used inside <MessagesProvider>");
  return ctx;
}

/** Helper: child name for a thread */
export function childNameOf(t: Thread) {
  return children.find((c) => c.id === t.childId)?.name;
}

/** Helper: the center's phone, shown as the fallback when a ticket is closed. */
export function centerPhone(facilityId: string | undefined) {
  void facilities;
  return facilityId === "f2" ? "(561) 555-0002" : facilityId === "f3" ? "(954) 555-0003" : "(954) 555-0001";
}
