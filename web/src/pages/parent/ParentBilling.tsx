import { useState } from "react";
import { Check, CreditCard, Download, Landmark, Receipt, X } from "lucide-react";
import { children, invoices } from "../../data";
import { useAuth } from "../../auth";

export default function ParentBilling() {
  const { user } = useAuth();
  const kids = children.filter((c) => user?.childIds?.includes(c.id));
  const mine = invoices.filter((i) => kids.some((k) => k.name === i.child));
  const [paidIds, setPaidIds] = useState<string[]>([]);
  const [autopay, setAutopay] = useState(false);
  const [payTarget, setPayTarget] = useState<typeof invoices[0] | null>(null);
  const [method, setMethod] = useState<"card" | "ach">("card");
  const [done, setDone] = useState(false);

  const status = (i: typeof invoices[0]) => (paidIds.includes(i.id) ? "paid" : i.status);
  const balance = mine.filter((i) => status(i) !== "paid").reduce((s, i) => s + i.amount, 0);
  const tuition = kids.reduce((s, k) => s + (invoices.find((i) => i.child === k.name)?.amount ?? 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#1e2d4e] mb-5">Billing</h1>

      {/* Balance */}
      <div className={`rounded-2xl p-5 sm:p-6 mb-4 text-white ${balance > 0 ? "bg-[#1e2d4e]" : "bg-[#0f7173]"}`}>
        <p className="text-xs font-mono uppercase tracking-widest text-white/60">Current balance</p>
        <p className="text-4xl font-bold mt-1">${balance.toLocaleString()}</p>
        <p className="text-sm text-white/70 mt-1">{balance > 0 ? `${mine.filter((i) => status(i) !== "paid").length} open invoice${mine.filter((i) => status(i) !== "paid").length === 1 ? "" : "s"}` : "You're all paid up 🎉"}</p>
        {balance > 0 && (
          <button onClick={() => setPayTarget(mine.find((i) => status(i) !== "paid") ?? null)} className="mt-4 w-full sm:w-auto min-h-12 px-6 rounded-xl bg-white text-[#1e2d4e] font-semibold hover:bg-[#f3f2ee] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e2d4e]">
            Pay ${balance.toLocaleString()} now
          </button>
        )}
      </div>

      {/* Autopay */}
      <div className="bg-white border border-[#e2dfd8] rounded-2xl p-4 mb-6 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-[#e8f4f4] text-[#0f7173] flex items-center justify-center flex-shrink-0"><Landmark size={22} aria-hidden /></div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#1e2d4e]">AutoPay</p>
          <p className="text-sm text-[#6b6860]">${tuition.toLocaleString()}/month on the 1st · {autopay ? "Visa •••• 4242" : "Never miss a due date"}</p>
        </div>
        <button
          role="switch"
          aria-checked={autopay}
          aria-label="AutoPay"
          onClick={() => setAutopay((a) => !a)}
          className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0f7173] ${autopay ? "bg-[#0f7173]" : "bg-[#c9c5bc]"}`}
        >
          <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${autopay ? "translate-x-7" : "translate-x-1"}`} />
        </button>
      </div>

      {/* Invoices */}
      <h2 className="font-semibold text-[#1e2d4e] mb-3">Invoices</h2>
      <ul className="space-y-2">
        {mine.map((inv) => {
          const s = status(inv);
          return (
            <li key={inv.id} className="bg-white border border-[#e2dfd8] rounded-2xl p-4 flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s === "paid" ? "bg-[#dcfce7] text-[#16a34a]" : s === "overdue" ? "bg-[#fee2e2] text-[#dc2626]" : "bg-[#fef3c7] text-[#d97706]"}`}>
                <Receipt size={22} aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1e2d4e]">{inv.period}</p>
                <p className="text-xs text-[#6b6860] truncate">{inv.child} · {s === "paid" ? "Paid" : `Due ${inv.dueDate}`} · #{inv.id}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-mono font-semibold text-[#1e2d4e]">${inv.amount.toLocaleString()}</p>
                {s === "paid" ? (
                  <button className="text-xs text-[#0f7173] inline-flex items-center gap-1 min-h-8 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173] rounded"><Download size={12} aria-hidden /> Receipt</button>
                ) : (
                  <button onClick={() => setPayTarget(inv)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg min-h-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173] ${s === "overdue" ? "bg-[#dc2626] text-white" : "bg-[#1e2d4e] text-white"}`}>Pay</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-[#6b6860] mt-4">Tuition questions? Message the office from the Messages tab. Payments processed securely (demo — no real charge).</p>

      {/* Pay modal */}
      {payTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => { setPayTarget(null); setDone(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="pay-title" className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            {done ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center mx-auto mb-4"><Check size={32} aria-hidden /></div>
                <h2 id="pay-title" className="text-xl font-bold text-[#1e2d4e]">Payment received</h2>
                <p className="text-sm text-[#6b6860] mt-1">${payTarget.amount.toLocaleString()} for {payTarget.period}. A receipt is on its way to {user?.email}.</p>
                <button onClick={() => { setPayTarget(null); setDone(false); }} className="mt-6 w-full min-h-12 rounded-xl bg-[#1e2d4e] text-white font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0f7173]">Done</button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 id="pay-title" className="text-xl font-bold text-[#1e2d4e]">Pay invoice</h2>
                    <p className="text-sm text-[#6b6860]">{payTarget.period} · {payTarget.child}</p>
                  </div>
                  <button onClick={() => setPayTarget(null)} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-lg text-[#6b6860] hover:text-[#1e2d4e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173]"><X size={20} aria-hidden /></button>
                </div>
                <p className="text-3xl font-bold text-[#1e2d4e] mb-5">${payTarget.amount.toLocaleString()}</p>
                <p className="text-xs font-mono uppercase tracking-widest text-[#6b6860] mb-2">Pay with</p>
                <div className="grid grid-cols-2 gap-2 mb-5" role="radiogroup" aria-label="Payment method">
                  {[
                    { id: "card" as const, Icon: CreditCard, l: "Card", sub: "Visa •••• 4242" },
                    { id: "ach" as const, Icon: Landmark, l: "Bank (ACH)", sub: "No fee" },
                  ].map((m) => (
                    <button key={m.id} role="radio" aria-checked={method === m.id} onClick={() => setMethod(m.id)} className={`border-2 rounded-xl p-3 text-left min-h-16 flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173] ${method === m.id ? "border-[#0f7173] bg-[#e8f4f4]" : "border-[#e2dfd8]"}`}>
                      <m.Icon size={22} className="text-[#0f7173] flex-shrink-0" aria-hidden />
                      <span><span className="block font-semibold text-sm text-[#1e2d4e]">{m.l}</span><span className="block text-xs text-[#6b6860]">{m.sub}</span></span>
                    </button>
                  ))}
                </div>
                <button onClick={() => { setPaidIds((p) => [...p, payTarget.id]); setDone(true); }} className="w-full min-h-12 rounded-xl bg-[#0f7173] text-white font-semibold hover:bg-[#0d5f61] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0f7173]">
                  Pay ${payTarget.amount.toLocaleString()}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
