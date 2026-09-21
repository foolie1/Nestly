/**
 * Shared daily-log store.
 *
 * This is the single source of truth for "what happened to a child today".
 * The Daily Logs page, the teacher's Quick log on My Room, and the parent
 * activity feed all read and write here — a teacher logs something once and
 * the family sees the same row.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { logEntries, type LogEntry, type LogType, type VideoClip } from "./data";
import { useRoster } from "./roster";
import { useAuth } from "./auth";

export type { LogType };

export const LOG_TYPES: { id: LogType; label: string; icon: string; bg: string; fg: string }[] = [
  { id: "meal", label: "Meal", icon: "🍼", bg: "bg-success-soft", fg: "text-success" },
  { id: "nap", label: "Nap", icon: "😴", bg: "bg-info-soft", fg: "text-info" },
  { id: "diaper", label: "Diaper", icon: "🧷", bg: "bg-slate-soft", fg: "text-slate" },
  { id: "bathroom", label: "Bathroom", icon: "🚽", bg: "bg-purple-soft", fg: "text-purple" },
  { id: "photo", label: "Photo", icon: "📸", bg: "bg-pink-soft", fg: "text-pink" },
  { id: "mood", label: "Mood", icon: "🙂", bg: "bg-warning-soft", fg: "text-warning" },
  { id: "learning", label: "Learning", icon: "✨", bg: "bg-purple-soft", fg: "text-purple" },
  { id: "medication", label: "Medication", icon: "💊", bg: "bg-info-soft", fg: "text-info" },
  { id: "note", label: "Note", icon: "📝", bg: "bg-warning-soft", fg: "text-warning" },
  { id: "incident", label: "Incident", icon: "⚠", bg: "bg-danger-soft", fg: "text-danger" },
];

export const LOG_META: Record<LogType, (typeof LOG_TYPES)[number]> = Object.fromEntries(
  LOG_TYPES.map((t) => [t.id, t]),
) as Record<LogType, (typeof LOG_TYPES)[number]>;

export type NewEntry = {
  childIds: string[];
  type: LogType;
  detail: string;
  /** Heading shown to parents. Defaults to the type label. */
  title?: string;
  /** Photos as data URLs. */
  media?: string[];
  videos?: VideoClip[];
};

type Store = {
  entries: LogEntry[];
  /** Everything logged for one child, newest first — this is the parent feed. */
  forChild: (childId: string) => LogEntry[];
  /** Add one entry per child id. Returns how many were written. */
  addEntries: (input: NewEntry) => number;
};

const Ctx = createContext<Store | null>(null);

export function LogsProvider({ children: kids }: { children: ReactNode }) {
  const { user } = useAuth();
  const { roster } = useRoster();
  const [entries, setEntries] = useState<LogEntry[]>(logEntries);

  const addEntries: Store["addEntries"] = ({ childIds, type, detail, title, media, videos }) => {
    // A photo or video entry is worth saving on the strength of the picture
    // alone, so it's the one case that doesn't require text.
    const hasBody = detail.trim().length > 0 || (media?.length ?? 0) > 0 || (videos?.length ?? 0) > 0;
    if (!user || childIds.length === 0 || !hasBody) return 0;
    const timestamp = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    const made: LogEntry[] = [];
    childIds.forEach((childId, i) => {
      const child = roster.find((c) => c.id === childId);
      if (!child) return;
      made.push({
        id: `l-${Date.now()}-${i}`,
        childId: child.id,
        childName: child.name,
        facilityId: child.facilityId,
        room: child.room,
        timestamp,
        type,
        title: title?.trim() || undefined,
        detail: detail.trim(),
        loggedBy: user.name,
        media: media?.length ? media : undefined,
        videos: videos?.length ? videos : undefined,
      });
    });
    if (made.length) setEntries((e) => [...made, ...e]);
    return made.length;
  };

  const forChild: Store["forChild"] = (childId) =>
    entries.filter((e) => e.childId === childId).sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const value = useMemo<Store>(() => ({ entries, forChild, addEntries }), [entries, user, roster]);
  return <Ctx.Provider value={value}>{kids}</Ctx.Provider>;
}

export function useLogs() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLogs must be used inside <LogsProvider>");
  return ctx;
}
