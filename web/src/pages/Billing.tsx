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
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-sm font-mono text-[#6b6860] uppercase tracking-widest mb-1">Billing</p>
          <h1 className="text-3xl font-bold text-[#1e2d4e]">Tuition &amp; Invoices</h1>
          <p className="text-[#6b6860] mt-1">September 2026 billing period</p>
        </div>
        <button onClick={() => setShowGenerate(true)} className="bg-[#1e2d4e] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#2a3f6b] transition-colors">
          Generate Invoices
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Billed", value: `$${total.toLocaleString()}`, color: "text-[#1e2d4e]" },
          { label: "Collected", value: `$${paid.toLocaleString()}`, color: "text-[#16a34a]" },
          { label: "Pending", value: `$${pending.toLocaleString()}`, color: "text-[#d97706]" },
          { label: "Overdue", value: `$${overdue.toLocaleString()}`, color: "text-[#dc2626]" },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-[#e2dfd8] rounded-xl p-5">
            <p className="text-xs font-mono uppercase tracking-widest text-[#6b6860] mb-2">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#e2dfd8] p-1 rounded-lg w-fit">
        {(["invoices", "schedule"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? "bg-white text-[#1e2d4e] shadow-sm" : "text-[#6b6860] hover:text-[#1e2d4e]"}`}>
            {t === "invoices" ? "Invoice List" : "Tuition Schedule"}
          </button>
        ))}
      </div>

      {tab === "invoices" ? (
        <div className="bg-white border border-[#e2dfd8] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f3f2ee] text-xs font-mono uppercase tracking-wider text-[#6b6860]">
                <th className="px-6 py-3 text-left">Invoice</th>
                <th className="px-6 py-3 text-left">Family</th>
                <th className="px-6 py-3 text-left">Child</th>
                <th className="px-6 py-3 text-left">Period</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-left">Due</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {centerInvoices.map((inv) => (
                <tr key={inv.id} className="border-t border-[#e2dfd8] hover:bg-[#f9f8f5] transition-colors">
                  <td className="px-6 py-3.5 font-mono text-xs text-[#6b6860]">{inv.id}</td>
                  <td className="px-6 py-3.5 font-medium text-[#1e2d4e]">{inv.family}</td>
                  <td className="px-6 py-3.5 text-sm text-[#6b6860]">{inv.child}</td>
                  <td className="px-6 py-3.5 text-sm text-[#6b6860]">{inv.period}</td>
                  <td className="px-6 py-3.5 text-right font-mono font-semibold text-[#1e2d4e]">${inv.amount.toLocaleString()}</td>
                  <td className="px-6 py-3.5 font-mono text-xs text-[#6b6860]">{inv.dueDate}</td>
                  <td className="px-6 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      inv.status === "paid" ? "bg-[#dcfce7] text-[#16a34a]" :
                      inv.status === "pending" ? "bg-[#fef3c7] text-[#d97706]" :
                      "bg-[#fee2e2] text-[#dc2626]"
                    }`}>
                      {inv.status === "paid" ? "✓ Paid" : inv.status === "pending" ? "Pending" : "⚠ Overdue"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex gap-2 justify-end">
                      {inv.status === "overdue" && (
                        <button className="text-xs px-2.5 py-1 bg-[#1e2d4e] text-white rounded-lg hover:bg-[#2a3f6b] transition-colors">Send Reminder</button>
                      )}
                      <button className="text-xs px-2.5 py-1 border border-[#e2dfd8] rounded-lg hover:border-[#0f7173] text-[#6b6860] hover:text-[#0f7173] transition-colors">View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-[#e2dfd8] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e2dfd8]">
            <h2 className="font-semibold text-[#1e2d4e]">Recurring Tuition Schedules</h2>
          </div>
          <div className="divide-y divide-[#e2dfd8]">
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
                  <p className="font-medium text-[#1e2d4e]">{s.family}</p>
                  <p className="text-xs text-[#6b6860]">{s.child} · {s.room}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-mono font-semibold text-[#1e2d4e]">${s.amount.toLocaleString()}</p>
                    <p className="text-xs text-[#6b6860]">{s.freq}</p>
                  </div>
                  <div className="text-right w-32">
                    <p className={`text-xs font-mono ${s.nextDue === "Past due" ? "text-[#dc2626] font-bold" : "text-[#6b6860]"}`}>Next: {s.nextDue}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${s.autopay ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#f3f2ee] text-[#6b6860]"}`}>
                    {s.autopay ? "AutoPay" : "Manual"}
                  </span>
                  <button className="text-xs text-[#0f7173] hover:underline">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Invoices Modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowGenerate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#1e2d4e] mb-1">Generate Invoices</h2>
            <p className="text-sm text-[#6b6860] mb-5">Creates one invoice per enrolled child for the selected period.</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-[#6b6860] block mb-1.5">Billing Period</label>
                <input
                  value={generateForm.period}
                  onChange={(e) => setGenerateForm((f) => ({ ...f, period: e.target.value }))}
                  className="w-full border border-[#e2dfd8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f7173]"
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-[#6b6860] block mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={generateForm.dueDate}
                  onChange={(e) => setGenerateForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="w-full border border-[#e2dfd8] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f7173]"
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
                          ? "bg-[#1e2d4e] border-[#1e2d4e]"
                          : "border-[#e2dfd8] bg-white"
                      }`}
                    >
                      {generateForm[key as keyof typeof generateForm] && (
                        <span className="text-white text-xs leading-none">✓</span>
                      )}
                    </button>
                    <span className="text-sm text-[#1a1a1a]">{label}</span>
                  </label>
                ))}
              </div>
              <div className="bg-[#f3f2ee] rounded-xl p-3 text-xs text-[#6b6860]">
                <span className="font-semibold text-[#1e2d4e]">{centerInvoices.length} invoices</span> will be generated based on current tuition schedules.
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowGenerate(false)} className="flex-1 py-2 border border-[#e2dfd8] rounded-lg text-sm text-[#6b6860] hover:border-[#1e2d4e] transition-colors">Cancel</button>
              <button onClick={() => setShowGenerate(false)} className="flex-1 py-2 bg-[#1e2d4e] text-white rounded-lg text-sm font-medium hover:bg-[#2a3f6b] transition-colors">Generate &amp; Send</button>
            </div>
          </div>
        </div>
      )}

      {/* Platform billing note */}
      <div className="mt-6 p-4 bg-[#f3f2ee] border border-[#e2dfd8] rounded-xl flex gap-3">
        <span className="text-[#0f7173]">ℹ</span>
        <p className="text-xs text-[#6b6860]">
          <span className="font-semibold text-[#1e2d4e]">Platform invoice:</span> Your Nestly subscription for this center is billed separately at a flat monthly rate. Payment details managed in Organization Settings.
        </p>
      </div>
    </div>
  );
}
