/**
 * Shared roster store — enrolled children and the enrollment pipeline.
 *
 * Enrolling a child here is what makes them appear in the teacher's room:
 * My Room, the check-in board and Daily Logs all read from this store.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { children as seedChildren, enrollmentLeads as seedLeads, facilities, type Child, type EnrollmentLead } from "./data";

export type Stage = EnrollmentLead["stage"];

export type NewChild = {
  name: string;
  dob: string;
  facilityId: string;
  room: string;
  guardian: string;
  guardianPhone: string;
  startDate: string;
  /** True when the chosen room was already full and an admin overrode it. */
  overCapacity?: boolean;
};

type Store = {
  roster: Child[];
  leads: EnrollmentLead[];
  /** Children enrolled at one facility (optionally one room). */
  childrenAt: (facilityId: string, room?: string) => Child[];
  addLead: (input: Omit<EnrollmentLead, "id" | "stage" | "createdAt">) => string;
  moveLead: (leadId: string, stage: Stage) => void;
  /** Create the child record. Pass leadId to also close out the pipeline card. */
  enroll: (input: NewChild, leadId?: string) => string;
  /** Toggle presence — used by the check-in board. */
  setCheckedIn: (childId: string, value: boolean) => void;
};

const Ctx = createContext<Store | null>(null);

const today = () => new Date().toISOString().slice(0, 10);

export function RosterProvider({ children: kids }: { children: ReactNode }) {
  const [roster, setRoster] = useState<Child[]>(seedChildren);
  const [leads, setLeads] = useState<EnrollmentLead[]>(seedLeads);

  const childrenAt: Store["childrenAt"] = (facilityId, room) =>
    roster.filter((c) => c.facilityId === facilityId && (!room || c.room === room));

  const addLead: Store["addLead"] = (input) => {
    const id = `e-${Date.now()}`;
    setLeads((l) => [{ ...input, id, stage: "inquiry", createdAt: today() }, ...l]);
    return id;
  };

  const moveLead: Store["moveLead"] = (leadId, stage) => {
    setLeads((l) => l.map((x) => (x.id === leadId ? { ...x, stage } : x)));
  };

  const enroll: Store["enroll"] = (input, leadId) => {
    const id = `c-${Date.now()}`;
    const child: Child = {
      id,
      name: input.name.trim(),
      dob: input.dob,
      room: input.room,
      facilityId: input.facilityId,
      status: "active",
      guardian: input.guardian.trim(),
      guardianPhone: input.guardianPhone.trim(),
      // Paperwork starts incomplete — this is what puts them on the
      // compliance dashboard until the family sends the form in.
      immunizationStatus: "missing",
      checkedIn: false,
      enrollmentDate: input.startDate || today(),
      tuitionStatus: "pending",
      enrolledOverCapacity: input.overCapacity || undefined,
    };
    setRoster((r) => [...r, child]);
    if (leadId) setLeads((l) => l.map((x) => (x.id === leadId ? { ...x, stage: "active" } : x)));
    return id;
  };

  const setCheckedIn: Store["setCheckedIn"] = (childId, value) => {
    setRoster((r) => r.map((c) => (c.id === childId ? { ...c, checkedIn: value } : c)));
  };

  const value = useMemo<Store>(
    () => ({ roster, leads, childrenAt, addLead, moveLead, enroll, setCheckedIn }),
    [roster, leads],
  );
  return <Ctx.Provider value={value}>{kids}</Ctx.Provider>;
}

export function useRoster() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRoster must be used inside <RosterProvider>");
  return ctx;
}

/** Rooms at a facility with their current headcount, for the enroll form. */
export function roomsWithSpace(facilityId: string, roster: Child[]) {
  const facility = facilities.find((f) => f.id === facilityId);
  return (facility?.rooms ?? []).map((r) => {
    const enrolled = roster.filter((c) => c.facilityId === facilityId && c.room === r.name).length;
    return { ...r, enrolled, spaces: Math.max(r.capacity - enrolled, 0) };
  });
}

/** Rough age-band match so the form can flag an odd room choice. */
export function bandForDob(dob: string): Child["room"] extends string ? string : string {
  if (!dob) return "";
  const months = (Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  if (months < 18) return "infant";
  if (months < 36) return "toddler";
  if (months < 60) return "preschool";
  return "school-age";
}
