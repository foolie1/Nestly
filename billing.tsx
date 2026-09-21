/**
 * Shared billing store.
 *
 * The admin invoice list and the parent's billing tab are two views of one
 * list. A parent paying an invoice marks it paid for the office too, which is
 * the whole point — previously each side kept its own copy and they disagreed.
 *
 * Revenue is read from the payments ledger, not from invoices. An invoice
 * says what's owed and whether it's settled; only a payment says *when* money
 * arrived, and "how much came in this week" is a question about when.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { invoices as seedInvoices, type Invoice } from "./data";

export type Payment = {
  id: string;
  /** Absent for payments recorded before invoices were kept in the app. */
  invoiceId?: string;
  facilityId: string;
  family: string;
  child: string;
  method: "card" | "ach";
  /** How it was taken — the parent portal, the office, or an autopay run. */
  source: "portal" | "office" | "autopay";
  paidAt: string;
  amount: number;
};

type Store = {
  invoices: Invoice[];
  payments: Payment[];
  at: (facilityId: string) => Invoice[];
  /** Invoices for a set of children, by name — how the parent view scopes. */
  forChildren: (childNames: string[]) => Invoice[];
  markPaid: (invoiceId: string, method: Payment["method"]) => void;
  /** Create invoices for a period for every child that doesn't have one yet. */
  generate: (input: { facilityId: string; period: string; dueDate: string; rateFor: (childName: string) => number }) => number;
};

const Ctx = createContext<Store | null>(null);

export function BillingProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(seedInvoices);
  const [payments, setPayments] = useState<Payment[]>(SEED_PAYMENTS);

  const at: Store["at"] = (facilityId) => invoices.filter((i) => i.facilityId === facilityId);

  const forChildren: Store["forChildren"] = (childNames) => invoices.filter((i) => childNames.includes(i.child));

  const markPaid: Store["markPaid"] = (invoiceId, method) => {
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (!invoice || invoice.status === "paid") return;
    setInvoices((list) => list.map((i) => (i.id === invoiceId ? { ...i, status: "paid" } : i)));
    setPayments((p) => [
      {
        id: `pay-${Date.now()}`,
        invoiceId,
        facilityId: invoice.facilityId,
        family: invoice.family,
        child: invoice.child,
        method,
        source: "portal",
        amount: invoice.amount,
        paidAt: new Date().toISOString(),
      },
      ...p,
    ]);
  };

  const generate: Store["generate"] = ({ facilityId, period, dueDate, rateFor }) => {
    const existing = new Set(invoices.filter((i) => i.facilityId === facilityId && i.period === period).map((i) => i.child));
    const names = [...new Set(invoices.filter((i) => i.facilityId === facilityId).map((i) => i.child))];
    const made: Invoice[] = names
      .filter((name) => !existing.has(name))
      .map((name, idx) => ({
        id: `inv-${Date.now()}-${idx}`,
        family: `${name.split(" ").slice(-1)[0]} Family`,
        child: name,
        facilityId,
        amount: rateFor(name),
        dueDate,
        status: "pending",
        period,
      }));
    if (made.length) setInvoices((list) => [...made, ...list]);
    return made.length;
  };

  const value = useMemo<Store>(
    () => ({ invoices, payments, at, forChildren, markPaid, generate }),
    [invoices, payments],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBilling() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBilling must be used inside <BillingProvider>");
  return ctx;
}

// ─── Periods ────────────────────────────────────────────────────

/** Weeks run Monday to Sunday, local time. */
export function weekStart(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - dow);
  return x;
}

export function monthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export type Bucket = { start: Date; end: Date; total: number; count: number; current: boolean };

/** Money in, by week or month, oldest first, ending with the current period. */
export function collections(payments: Payment[], opts: { period: "week" | "month"; count: number; facilityId?: string; now?: Date }): Bucket[] {
  const now = opts.now ?? new Date();
  const scoped = opts.facilityId ? payments.filter((p) => p.facilityId === opts.facilityId) : payments;
  const buckets: Bucket[] = [];
  let cursor = opts.period === "week" ? weekStart(now) : monthStart(now);
  for (let i = 0; i < opts.count; i++) {
    const start = new Date(cursor);
    const end = opts.period === "week" ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7) : new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const inside = scoped.filter((p) => {
      const t = new Date(p.paidAt);
      return t >= start && t < end;
    });
    buckets.unshift({ start, end, total: inside.reduce((s, p) => s + p.amount, 0), count: inside.length, current: i === 0 });
    cursor = opts.period === "week" ? new Date(start.getFullYear(), start.getMonth(), start.getDate() - 7) : new Date(start.getFullYear(), start.getMonth() - 1, 1);
  }
  return buckets;
}

// ─── Seed ledger ────────────────────────────────────────────────
//
// Built from the seeded invoices, plus the three earlier months those same
// families paid before this summer's invoices were created. Tuition is due on
// the 1st, so most payments land within a few days either side of it.

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

function seedLedger(): Payment[] {
  const out: Payment[] = [];
  const paidNear = (due: string, key: string) => {
    const d = new Date(`${due}T00:00:00`);
    d.setDate(d.getDate() + ((hash(key) % 8) - 4)); // four days early to three late
    d.setHours(8 + (hash(key + "h") % 11), hash(key + "m") % 60, 0, 0);
    return d.toISOString();
  };
  const methodFor = (key: string): Payment["method"] => (hash(key) % 10 < 6 ? "ach" : "card");
  const sourceFor = (key: string): Payment["source"] => (hash(key + "s") % 3 === 0 ? "office" : "autopay");

  // Paid invoices already in the app.
  for (const inv of seedInvoices.filter((i) => i.status === "paid")) {
    out.push({
      id: `pay-${inv.id}`, invoiceId: inv.id, facilityId: inv.facilityId, family: inv.family, child: inv.child,
      method: methodFor(inv.id), source: sourceFor(inv.id), amount: inv.amount, paidAt: paidNear(inv.dueDate, inv.id),
    });
  }

  // Earlier months for every family, at their current rate, unless an
  // invoice for that month already exists (paid or not).
  const families = [...new Map(seedInvoices.map((i) => [i.child, i])).values()];
  const months: [string, string][] = [["June 2026", "2026-06-01"], ["July 2026", "2026-07-01"], ["August 2026", "2026-08-01"]];
  for (const f of families) {
    for (const [period, due] of months) {
      if (seedInvoices.some((i) => i.child === f.child && i.period === period)) continue;
      const key = `${f.child}-${period}`;
      out.push({
        id: `pay-hist-${hash(key)}`, facilityId: f.facilityId, family: f.family, child: f.child,
        method: methodFor(key), source: sourceFor(key), amount: f.amount, paidAt: paidNear(due, key),
      });
    }
  }
  return out.sort((a, b) => b.paidAt.localeCompare(a.paidAt));
}

const SEED_PAYMENTS = seedLedger();
