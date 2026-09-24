import { useState } from "react";
import { X } from "lucide-react";
import { type Invoice } from "../data";
import { useBilling } from "../billing";
import { Collections } from "../components/Collections";
import { useRoster } from "../roster";
import { useMessages } from "../messages";

type Props = { facilityId: string };

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default function Billing({ facilityId }: Props) {
  const { at, generate, payments } = useBilling();
  const [tab, setTab] = useState<"invoices" | "schedule">("invoices");
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateForm, setGenerateForm] = useState({ period: "October 2026", dueDate: "2026-10-01", sendEmail: true, includeOverdue: true });
  const [toast, setToast] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Invoice | null>(null);
  // Same store the parent portal writes to — a family paying in their app
  // shows here without anyone re-keying it.
  const centerInvoices = at(facilityId);
  const { roster } = useRoster();
  const { startOutreach } = useMessages();

  const flash = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2800);
  };

  /** Sends a real billing message to the family rather than a fake toast. */
  const remind = (inv: Invoice) => {
    const child = roster.find((c) => c.name === inv.child);
    if (!child) {
      flash(`No portal account linked to ${inv.family} yet`);
      return;
    }
    const sent = startOutreach({
      childId: child.id,
      category: "billing",
      title: `${inv.period} tuition · $${inv.amount.toLocaleString()}`,
      body: `Hi — a friendly reminder that the ${inv.period} invoice for ${inv.child} (${`$${inv.amount.toLocaleString()}`}) ${inv.status === "overdue" ? "is past due" : `is due ${inv.dueDate}`}. You can pay it in the Billing tab of your parent portal. Let us know if you'd like to set up a payment plan.`,
    });
    flash(sent ? `Reminder sent to ${inv.family}` : `Couldn't reach ${inv.family}`);
  };

  /** One invoice per enrolled child, at the rate their last invoice used. */
  const runGenerate = () => {
    const made = generate({
      facilityId,
      period: generateForm.period,
      dueDate: generateForm.dueDate,
      rateFor: (childName) => centerInvoices.find((i) => i.child === childName)?.amount ?? 0,
    });
    setShowGenerate(false);
    flash(made === 0 ? `Invoices for ${generateForm.period} already exist` : `${made} invoice${made === 1 ? "" : "s"} generated for ${generateForm.period}`);
  };

  // How each family most recently paid — AutoPay, the parent portal, or at the office.
  const lastSource = new Map<string, "portal" | "office" | "autopay">();
  [...payments].filter((p) => p.facilityId === facilityId).sort((a, b) => a.paidAt.localeCompare(b.paidAt)).forEach((p) => lastSource.set(p.child, p.source));

  /** The recurring schedule, read off the most recent invoice per family. */
  const schedules = [...new Map(centerInvoices.map((i) => [i.child, i])).values()].map((i) => {
    const child = roster.find((c) => c.name === i.child);
    const outstanding = centerInvoices.some((x) => x.child === i.child && x.status === "overdue");
    return {
      family: i.family,
      child: i.child,
      room: child?.room ?? "—",
      amount: i.amount,
      nextDue: outstanding ? "Past due" : generateForm.dueDate,
      source: lastSource.get(i.child),
    };
  });
  const pending = centerInvoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0);
  const overdue = centerInvoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-sm font-mono text-muted uppercase tracking-widest mb-1">Billing</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand">Tuition &amp; Invoices</h1>
          <p className="text-muted mt-1">September 2026 billing period</p>
        </div>
        <button onClick={() => setShowGenerate(true)} className="bg-brand text-white text-sm font-medium px-4 py-2.5 min-h-11 rounded-ctl hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent transition-colors">
          Generate Invoices
        </button>
      </div>

      {/* Money in, by week or month — read from when payments actually arrived */}
      <div className="mb-6">
        <Collections payments={payments} facilityId={facilityId} heading="Tuition collected" />
      </div>

      {/* What's still owed */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
        {[
          { label: "Due, not yet paid", value: `$${pending.toLocaleString()}`, sub: plural(centerInvoices.filter((i) => i.status === "pending").length, "invoice"), color: "text-warning" },
          { label: "Overdue", value: `$${overdue.toLocaleString()}`, sub: plural(centerInvoices.filter((i) => i.status === "overdue").length, "invoice"), color: "text-danger" },
        ].map((k) => (
          <div key={k.label} className="bg-surface border border-line rounded-card p-5">
            <p className="text-xs font-mono uppercase tracking-widest text-muted mb-2">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-line p-1 rounded-ctl w-fit">
        {(["invoices", "schedule"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 min-h-10 rounded-ctl text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${tab === t ? "bg-surface text-brand shadow-sm" : "text-muted hover:text-brand"}`}>
            {t === "invoices" ? "Invoice List" : "Tuition Schedule"}
          </button>
        ))}
      </div>

      {tab === "invoices" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {centerInvoices.map((inv) => {
            const s = inv.status === "paid" ? { cls: "bg-success-soft text-success", icon: "bg-success-soft text-success", label: "Paid" }
              : inv.status === "pending" ? { cls: "bg-warning-soft text-warning", icon: "bg-warning-soft text-warning", label: "Pending" }
              : { cls: "bg-danger-soft text-danger", icon: "bg-danger-soft text-danger", label: "Overdue" };
            return (
              <div key={inv.id} className="bg-surface border border-line rounded-[calc(var(--t-radius)+0.25rem)] p-4 flex items-center gap-3 hover:border-accent transition-colors">
                <div className={`w-12 h-12 rounded-card flex items-center justify-center flex-shrink-0 text-lg font-bold ${s.icon}`}>$</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-semibold text-brand truncate">{inv.family}</p>
                    <p className="font-mono font-bold text-brand flex-shrink-0">${inv.amount.toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-muted truncate">{inv.child} · {inv.period} · due {inv.dueDate}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>
                    <span className="text-[11px] font-mono text-muted">#{inv.id}</span>
                    <span className="ml-auto flex gap-1.5">
                      {inv.status !== "paid" && (
                        <button onClick={() => remind(inv)} className="text-xs px-2.5 py-1.5 min-h-8 bg-brand text-white rounded-ctl hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Remind</button>
                      )}
                      <button onClick={() => setViewing(inv)} className="text-xs px-2.5 py-1.5 min-h-8 border border-line rounded-ctl text-muted hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">View</button>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface border border-line rounded-card overflow-hidden">
          <div className="px-6 py-4 border-b border-line">
            <h2 className="font-semibold text-brand">Recurring Tuition Schedules</h2>
          </div>
          <div className="divide-y divide-line">
            {schedules.map((s) => (
              <div key={s.child} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-medium text-brand">{s.family}</p>
                  <p className="text-xs text-muted">{s.child} · {s.room}</p>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-right">
                    <p className="font-mono font-semibold text-brand">${s.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted">Monthly</p>
                  </div>
                  <div className="text-right w-28">
                    <p className={`text-xs font-mono ${s.nextDue === "Past due" ? "text-danger font-bold" : "text-muted"}`}>Next: {s.nextDue}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${s.source === "autopay" ? "bg-success-soft text-success" : s.source === "portal" ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted"}`}>
                    {s.source === "autopay" ? "AutoPay" : s.source === "portal" ? "Pays in app" : "Pays at office"}
                  </span>
                </div>
              </div>
            ))}
            {schedules.length === 0 && <p className="px-6 py-8 text-center text-sm text-muted">No tuition schedules yet.</p>}
          </div>
        </div>
      )}

      {/* Generate Invoices Modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowGenerate(false)}>
          <div className="bg-surface rounded-t-[calc(var(--t-radius)+0.5rem)] sm:rounded-[calc(var(--t-radius)+0.25rem)] shadow-2xl w-full sm:max-w-md p-5 sm:p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-brand mb-1">Generate Invoices</h2>
            <p className="text-sm text-muted mb-5">Creates one invoice per enrolled child for the selected period.</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Billing Period</label>
                <input
                  value={generateForm.period}
                  onChange={(e) => setGenerateForm((f) => ({ ...f, period: e.target.value }))}
                  className="w-full border border-line rounded-ctl px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:border-accent"
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={generateForm.dueDate}
                  onChange={(e) => setGenerateForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="w-full border border-line rounded-ctl px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:border-accent"
                />
              </div>
              <div className="space-y-3 pt-1">
                {[
                  { key: "sendEmail", label: "Email invoices to families on generation" },
                  { key: "includeOverdue", label: "Include outstanding balance on each invoice" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <button
                      role="checkbox"
                      aria-checked={generateForm[key as keyof typeof generateForm] as boolean}
                      onClick={() => setGenerateForm((f) => ({ ...f, [key]: !f[key as keyof typeof f] }))}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        generateForm[key as keyof typeof generateForm]
                          ? "bg-brand border-brand"
                          : "border-line bg-surface"
                      }`}
                    >
                      {generateForm[key as keyof typeof generateForm] && (
                        <span className="text-white text-xs leading-none">✓</span>
                      )}
                    </button>
                    <span className="text-sm text-ink">{label}</span>
                  </label>
                ))}
              </div>
              <div className="bg-surface-2 rounded-card p-3 text-xs text-muted">
                <span className="font-semibold text-brand">{schedules.filter((s) => !centerInvoices.some((i) => i.child === s.child && i.period === generateForm.period)).length} invoices</span> will be generated for {generateForm.period}. Families who already have one for this period are skipped.
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowGenerate(false)} className="flex-1 min-h-11 border border-line rounded-ctl text-sm text-muted hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors">Cancel</button>
              <button onClick={runGenerate} className="flex-1 min-h-11 bg-brand text-white rounded-ctl text-sm font-medium hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent transition-colors">Generate &amp; Send</button>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-end" onClick={() => setViewing(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="inv-title" className="bg-surface h-full w-full sm:w-96 shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-line flex items-start justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-muted mb-1">Invoice #{viewing.id}</p>
                <h2 id="inv-title" className="text-lg font-bold text-brand">{viewing.family}</h2>
              </div>
              <button onClick={() => setViewing(null)} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><X size={20} aria-hidden /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-surface-2 rounded-card p-4 text-center">
                <p className="text-xs font-mono uppercase tracking-widest text-muted">Amount</p>
                <p className="text-3xl font-bold text-brand mt-1">${viewing.amount.toLocaleString()}</p>
              </div>
              {[
                { label: "Child", value: viewing.child },
                { label: "Period", value: viewing.period },
                { label: "Due", value: viewing.dueDate },
                { label: "Status", value: viewing.status },
              ].map((r) => (
                <div key={r.label}>
                  <p className="text-xs font-mono text-muted uppercase tracking-widest mb-1">{r.label}</p>
                  <p className="text-sm text-ink capitalize">{r.value}</p>
                </div>
              ))}
              {(() => {
                const payment = payments.find((p) => p.invoiceId === viewing.id);
                return payment ? (
                  <div className="bg-success-soft border border-success rounded-card p-3.5">
                    <p className="text-sm font-semibold text-success">{payment.source === "autopay" ? "Paid by AutoPay" : payment.source === "portal" ? "Paid in the parent portal" : "Paid at the office"}</p>
                    <p className="text-xs text-ink mt-0.5">
                      {payment.method === "ach" ? "Bank transfer" : "Card"} · {new Date(payment.paidAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                ) : viewing.status !== "paid" ? (
                  <button onClick={() => { remind(viewing); setViewing(null); }} className="w-full min-h-11 bg-brand text-white rounded-ctl text-sm font-semibold hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent">
                    Send a reminder
                  </button>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand text-white text-sm font-medium px-4 py-3 rounded-card shadow-lg z-50">
          ✓ {toast}
        </div>
      )}

      {/* Platform billing note */}
      <div className="mt-6 p-4 bg-surface-2 border border-line rounded-card flex gap-3">
        <span className="text-accent">ℹ</span>
        <p className="text-xs text-muted">
          <span className="font-semibold text-brand">Platform invoice:</span> Your Nestly subscription for this center is billed separately at a flat monthly rate. Payment details managed in Organization Settings.
        </p>
      </div>
    </div>
  );
}
