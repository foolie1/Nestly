import { useState } from "react";
import { invoices } from "../data";

type Props = { facilityId: string };

export default function Billing({ facilityId }: Props) {
  const [tab, setTab] = useState<"invoices" | "schedule">("invoices");
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateForm, setGenerateForm] = useState({ period: "October 2026", dueDate: "2026-10-01", sendEmail: true, includeOverdue: true });
  const centerInvoices = invoices.filter((i) => i.facilityId === facilityId);
  const total = centerInvoices.reduce((s, i) => s + i.amount, 0);
  const paid = centerInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
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

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {[
          { label: "Total Billed", value: `$${total.toLocaleString()}`, color: "text-brand" },
          { label: "Collected", value: `$${paid.toLocaleString()}`, color: "text-success" },
          { label: "Pending", value: `$${pending.toLocaleString()}`, color: "text-warning" },
          { label: "Overdue", value: `$${overdue.toLocaleString()}`, color: "text-danger" },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-line rounded-card p-5">
            <p className="text-xs font-mono uppercase tracking-widest text-muted mb-2">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-line p-1 rounded-ctl w-fit">
        {(["invoices", "schedule"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 min-h-10 rounded-ctl text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${tab === t ? "bg-white text-brand shadow-sm" : "text-muted hover:text-brand"}`}>
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
                      {inv.status === "overdue" && <button className="text-xs px-2.5 py-1.5 min-h-8 bg-brand text-white rounded-ctl hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Remind</button>}
                      <button className="text-xs px-2.5 py-1.5 min-h-8 border border-line rounded-ctl text-muted hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">View</button>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-line rounded-card overflow-hidden">
          <div className="px-6 py-4 border-b border-line">
            <h2 className="font-semibold text-brand">Recurring Tuition Schedules</h2>
          </div>
          <div className="divide-y divide-line">
            {[
              { family: "Torres Family", child: "Amelia Torres", room: "Bluebell Infants", amount: 1450, freq: "Monthly", nextDue: "Oct 1, 2026", autopay: true },
              { family: "Patel Family", child: "Noah Patel", room: "Bluebell Infants", amount: 1450, freq: "Monthly", nextDue: "Oct 1, 2026", autopay: false },
              { family: "Reyes Family", child: "Sofia Reyes", room: "Sunflower Toddlers", amount: 1250, freq: "Monthly", nextDue: "Past due", autopay: false },
              { family: "Johnson Family", child: "Liam Johnson", room: "Sunflower Toddlers", amount: 1250, freq: "Monthly", nextDue: "Oct 1, 2026", autopay: true },
              { family: "Kim Family", child: "Ava Kim", room: "Clover Preschool", amount: 1100, freq: "Monthly", nextDue: "Oct 1, 2026", autopay: true },
              { family: "Williams Family", child: "James Williams", room: "Clover Preschool", amount: 1100, freq: "Monthly", nextDue: "Oct 1, 2026", autopay: false },
              { family: "Cruz Family", child: "Isabella Cruz", room: "Maple School-Age", amount: 850, freq: "Monthly", nextDue: "Oct 1, 2026", autopay: true },
            ].map((s, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-brand">{s.family}</p>
                  <p className="text-xs text-muted">{s.child} · {s.room}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-mono font-semibold text-brand">${s.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted">{s.freq}</p>
                  </div>
                  <div className="text-right w-32">
                    <p className={`text-xs font-mono ${s.nextDue === "Past due" ? "text-danger font-bold" : "text-muted"}`}>Next: {s.nextDue}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${s.autopay ? "bg-success-soft text-success" : "bg-surface-2 text-muted"}`}>
                    {s.autopay ? "AutoPay" : "Manual"}
                  </span>
                  <button className="text-xs text-accent hover:underline">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Invoices Modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowGenerate(false)}>
          <div className="bg-white rounded-t-[calc(var(--t-radius)+0.5rem)] sm:rounded-[calc(var(--t-radius)+0.25rem)] shadow-2xl w-full sm:max-w-md p-5 sm:p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                          : "border-line bg-white"
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
                <span className="font-semibold text-brand">{centerInvoices.length} invoices</span> will be generated based on current tuition schedules.
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowGenerate(false)} className="flex-1 py-2 border border-line rounded-ctl text-sm text-muted hover:border-brand transition-colors">Cancel</button>
              <button onClick={() => setShowGenerate(false)} className="flex-1 py-2 bg-brand text-white rounded-ctl text-sm font-medium hover:bg-brand-hover transition-colors">Generate &amp; Send</button>
            </div>
          </div>
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
