/**
 * Shared incident store.
 *
 * An incident written by a teacher in My Room and one written by a director on
 * the Compliance page are the same record, and both land on the compliance
 * dashboard. Filing one also drops an entry into the daily log so it shows on
 * the child's timeline and, through that, on the family's feed.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { incidents as seedIncidents, type Incident } from "./data";

export type NewIncident = Omit<Incident, "id">;

type Store = {
  incidents: Incident[];
  at: (facilityId: string) => Incident[];
  add: (input: NewIncident) => string;
  /** Record the guardian's signature on a filed report. */
  sign: (incidentId: string, signature: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function IncidentsProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>(seedIncidents);

  const at: Store["at"] = (facilityId) =>
    incidents
      .filter((i) => i.facilityId === facilityId)
      .sort((a, b) => `${b.date}${b.time ?? ""}`.localeCompare(`${a.date}${a.time ?? ""}`));

  const add: Store["add"] = (input) => {
    const id = `i-${Date.now()}`;
    setIncidents((list) => [{ ...input, id }, ...list]);
    return id;
  };

  const sign: Store["sign"] = (incidentId, signature) => {
    setIncidents((list) =>
      list.map((i) => (i.id === incidentId ? { ...i, guardianSigned: true, guardianSignature: signature } : i)),
    );
  };

  const value = useMemo<Store>(() => ({ incidents, at, add, sign }), [incidents]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useIncidents() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useIncidents must be used inside <IncidentsProvider>");
  return ctx;
}
