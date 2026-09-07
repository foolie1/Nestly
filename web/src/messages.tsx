/**
 * Shared message store — one source of truth for every role.
 *
 * Visibility (mirrors the PRD §9.2 workflow 7 + director oversight):
 *   parent        → threads about their own child (+ broadcasts to their center)
 *   staff         → threads for children in their room + staff/broadcast threads
 *   office_admin  → office threads + broadcasts for their center
 *   director      → every thread in their center
 *   owner         → every thread in the selected center
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { children, type DemoUser, type Role } from "./data";
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
};

export type ThreadKind = "child" | "office" | "broadcast";

export type Thread = {
  id: string;
  facilityId: string;
  kind: ThreadKind;
  /** child threads: the child + their room */
  childId?: string;
  room?: string;
  /** office threads: which family; broadcasts: audience label */
  familyName?: string;
  title: string;
  messages: Msg[];
  /** office has opened it (demo state) */
  readByOffice: boolean;
};

export const ROLE_LABEL: Record<SenderRole, string> = {
  parent: "Parent",
  staff: "Teacher",
  office_admin: "Office",
  director: "Director",
  owner: "Owner",
  system: "System",
};

const seed: Thread[] = [
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
  {
    id: "t-o1", facilityId: "f1", kind: "office", childId: "c2", familyName: "Patel", title: "Patel family · Office", readByOffice: false,
    messages: [
      { id: "m7", senderId: "u-parent2", senderName: "Priya Patel", senderRole: "parent", body: "Hello, I noticed my August invoice shows a different amount than I expected. Could someone please review this?", time: "Aug 30", at: "2026-08-30T15:42" },
      { id: "m8", senderId: "u-office", senderName: "Front Office", senderRole: "office_admin", body: "Hi Priya — looking into it now, we'll have an answer for you by tomorrow morning.", time: "Aug 30", at: "2026-08-30T16:05" },
      { id: "m9", senderId: "u-parent2", senderName: "Priya Patel", senderRole: "parent", body: "Any update on this? Autopay runs on the 1st and I don't want to be charged the wrong amount.", time: "08:02", at: "2026-08-31T08:02" },
    ],
  },
  {
    id: "t-o2", facilityId: "f1", kind: "office", childId: "c1", familyName: "Torres", title: "Torres family · Office", readByOffice: true,
    messages: [],
  },
  {
    id: "t-o3", facilityId: "f1", kind: "office", childId: "c3", familyName: "Reyes", title: "Reyes family · Office", readByOffice: true,
    messages: [
      { id: "m10", senderId: "u-office", senderName: "Front Office", senderRole: "office_admin", body: "Hi Carlos, a reminder that the August tuition ($1,250) is past due. You can pay in the Billing tab or call us to set up a plan.", time: "Aug 29", at: "2026-08-29T09:00" },
    ],
  },
  {
    id: "t-b1", facilityId: "f1", kind: "broadcast", familyName: "All families", title: "Labor Day closure", readByOffice: true,
    messages: [
      { id: "m11", senderId: "u-admin", senderName: "Sunshine Childcare Group", senderRole: "owner", body: "Reminder: all three centers will be CLOSED Monday, September 1st for Labor Day. Emergency contact for facility issues: (954) 555-0001.", time: "Aug 28", at: "2026-08-28T09:00" },
    ],
  },
  {
    id: "t-c8", facilityId: "f2", kind: "child", childId: "c8", room: "Daisy Infants", familyName: "Nguyen", title: "Oliver Nguyen · Daisy Infants", readByOffice: true,
    messages: [
      { id: "m12", senderId: "g-nguyen", senderName: "Lan Nguyen", senderRole: "parent", body: "Oliver has a new bottle — it's the green one in his bag. The old one leaks.", time: "07:30", at: "2026-08-31T07:30" },
      { id: "m13", senderId: "s5", senderName: "Jade Osei", senderRole: "staff", body: "Perfect, found it. Thanks Lan!", time: "07:41", at: "2026-08-31T07:41" },
    ],
  },
  {
    id: "t-o4", facilityId: "f2", kind: "office", childId: "c10", familyName: "Brown", title: "Brown family · Office", readByOffice: false,
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
  /** True when the last message is from a parent and nobody from the center has answered. */
  needsReply: (t: Thread) => boolean;
};

const Ctx = createContext<Store | null>(null);

function senderRoleOf(user: DemoUser): SenderRole {
  return user.role as Role as SenderRole;
}

export function MessagesProvider({ children: kids }: { children: ReactNode }) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>(seed);

  const needsReply = (t: Thread) => {
    const last = t.messages[t.messages.length - 1];
    return !!last && last.senderRole === "parent";
  };

  const visibleThreads = (facilityId?: string) => {
    if (!user) return [];
    const fid = facilityId ?? user.facilityId;
    const inFacility = threads.filter((t) => t.facilityId === fid);
    switch (user.role) {
      case "parent":
        return threads.filter((t) => (t.childId && user.childIds?.includes(t.childId)) || (t.kind === "broadcast" && t.facilityId === user.facilityId));
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
    const now = new Date();
    const msg: Msg = {
      id: `m-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      senderRole: senderRoleOf(user),
      body: body.trim(),
      time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      at: now.toISOString(),
    };
    setThreads((ts) => ts.map((t) => (t.id === threadId ? { ...t, messages: [...t.messages, msg], readByOffice: user.role !== "parent" } : t)));
  };

  const markRead = (threadId: string) => {
    if (!user || user.role === "parent" || user.role === "staff") return;
    setThreads((ts) => ts.map((t) => (t.id === threadId && !t.readByOffice ? { ...t, readByOffice: true } : t)));
  };

  const broadcast = (facilityIds: string[], title: string, body: string) => {
    if (!user) return;
    const now = new Date();
    const created: Thread[] = facilityIds.map((fid) => ({
      id: `t-b-${fid}-${Date.now()}`,
      facilityId: fid,
      kind: "broadcast",
      familyName: "All families",
      title,
      readByOffice: true,
      messages: [{ id: `m-${fid}-${Date.now()}`, senderId: user.id, senderName: user.name, senderRole: senderRoleOf(user), body: body.trim(), time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }), at: now.toISOString() }],
    }));
    setThreads((ts) => [...created, ...ts]);
  };

  const value = useMemo<Store>(() => ({ threads, visibleThreads, send, markRead, broadcast, needsReply }), [threads, user]);
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
