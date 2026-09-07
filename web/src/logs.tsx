/**
 * Shared daily-log store.
 *
 * Both the Daily Logs page and the teacher's Quick log on My Room write here,
 * so an entry made in one shows up in the other straight away.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { children, logEntries, type LogEntry } from "./data";
import { useAuth } from "./auth";

export type LogType = LogEntry["type"];

export const LOG_TYPES: { id: LogType; label: string; icon: string; bg: string; fg: string }[] = [
  { id: "meal", label: "Meal", icon: "🍼", bg: "bg-success-soft", fg: "text-success" },
  { id: "nap", label: "Nap", icon: "😴", bg: "bg-info-soft", fg: "text-info" },
  { id: "diaper", label: "Diaper", icon: "🧷", bg: "bg-slate-soft", fg: "text-slate" },
  { id: "bathroom", label: "Bathroom", icon: "🚽", bg: "bg-purple-soft", fg: "text-purple" },
  { id: "note", label: "Note", icon: "📝", bg: "bg-warning-soft", fg: "text-warning" },
  { id: "incident", label: "Incident", icon: "⚠", bg: "bg-danger-soft", fg: "text-danger" },
];

export const LOG_META: Record<LogType, (typeof LOG_TYPES)[number]> = Object.fromEntries(
  LOG_TYPES.map((t) => [t.id, t]),
) as Record<LogType, (typeof LOG_TYPES)[number]>;

type Store = {
  entries: LogEntry[];
  /** Add one entry per child id. Returns how many were written. */
  addEntries: (input: { childIds: string[]; type: LogType; detail: string }) => number;
};

const Ctx = createContext<Store | null>(null);

export function LogsProvider({ children: kids }: { children: ReactNode }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LogEntry[]>(logEntries);

  const addEntries: Store["addEntries"] = ({ childIds, type, detail }) => {
    if (!user || childIds.length === 0 || !detail.trim()) return 0;
    const timestamp = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    const made: LogEntry[] = [];
    childIds.forEach((childId, i) => {
      const child = children.find((c) => c.id === childId);
      if (!child) return;
      made.push({
        id: `l-${Date.now()}-${i}`,
        childId: child.id,
        childName: child.name,
        facilityId: child.facilityId,
        room: child.room,
        timestamp,
        type,
        detail: detail.trim(),
        loggedBy: user.name,
      });
    });
    if (made.length) setEntries((e) => [...made, ...e]);
    return made.length;
  };

  const value = useMemo<Store>(() => ({ entries, addEntries }), [entries, user]);
  return <Ctx.Provider value={value}>{kids}</Ctx.Provider>;
}

export function useLogs() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLogs must be used inside <LogsProvider>");
  return ctx;
}
