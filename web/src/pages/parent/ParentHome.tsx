import { useState } from "react";
import { Baby, BedDouble, Camera, ChevronRight, ClipboardCheck, CreditCard, FileSignature, LogIn, MessageSquare, Moon, Smile, Sparkles, Utensils, type LucideIcon } from "lucide-react";
import { children, childDocuments, feed, invoices, facilities } from "../../data";
import { useAuth } from "../../auth";
import { ChildSwitcher, useSelectedChild } from "./childSwitcher";

type Props = { onNav: (page: string) => void };

const TYPE: Record<string, { Icon: LucideIcon; bg: string; fg: string; label: string }> = {
  checkin: { Icon: LogIn, bg: "bg-[#e8f4f4]", fg: "text-[#0f7173]", label: "Check-in" },
  meal: { Icon: Utensils, bg: "bg-[#dcfce7]", fg: "text-[#16a34a]", label: "Meal" },
  nap: { Icon: BedDouble, bg: "bg-[#dbeafe]", fg: "text-[#1d4ed8]", label: "Nap" },
  diaper: { Icon: Baby, bg: "bg-[#f3f2ee]", fg: "text-[#6b6860]", label: "Diaper" },
  bathroom: { Icon: Baby, bg: "bg-[#ede9fe]", fg: "text-[#7c3aed]", label: "Bathroom" },
  photo: { Icon: Camera, bg: "bg-[#fce7f3]", fg: "text-[#be185d]", label: "Photo" },
  note: { Icon: ClipboardCheck, bg: "bg-[#fef3c7]", fg: "text-[#d97706]", label: "Note" },
  mood: { Icon: Smile, bg: "bg-[#fef3c7]", fg: "text-[#d97706]", label: "Mood" },
  learning: { Icon: Sparkles, bg: "bg-[#ede9fe]", fg: "text-[#7c3aed]", label: "Learning" },
};

function ageLabel(dob: string) {
  const d = new Date(dob), now = new Date("2026-08-31");
  const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  if (months < 24) return `${months} months`;
  return `${Math.floor(months / 12)} years`;
}

export default function ParentHome({ onNav }: Props) {
  const { user } = useAuth();
  const [childId, setChildId] = useSelectedChild();
  const child = children.find((c) => c.id === childId) ?? children[0];
  const facility = facilities.find((f) => f.id === child.facilityId) ?? facilities[0];
  const items = feed.filter((f) => f.childId === child.id).sort((a, b) => b.time.localeCompare(a.time));
  const checkin = feed.find((f) => f.childId === child.id && f.type === "checkin");
  const openInvoice = invoices.find((i) => i.child === child.name && i.status !== "paid");
  const docsNeedingAction = childDocuments.filter((d) => d.childId === child.id && d.status !== "on-file");
  const [filter, setFilter] = useState<"all" | "photo" | "meal" | "nap">("all");
  const visible = filter === "all" ? items : items.filter((i) => i.type === filter);
  const firstName = user?.name.split(" ")[0];

  const counts = {
    meals: items.filter((i) => i.type === "meal").length,
    naps: items.filter((i) => i.type === "nap" && i.title.toLowerCase().includes("started")).length,
    diapers: items.filter((i) => i.type === "diaper").length,
    photos: items.filter((i) => i.type === "photo").length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-5">
        <p className="text-sm text-[#6b6860]">Good afternoon, {firstName} 👋</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1e2d4e]">Today at {facility.name.split(" ").slice(0, 2).join(" ")}</h1>
      </div>

      <ChildSwitcher value={childId} onChange={setChildId} />

      {/* Status card */}
      <div className="bg-white border border-[#e2dfd8] rounded-2xl p-5 mb-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#e8f4f4] flex items-center justify-center text-2xl flex-shrink-0" aria-hidden>🧒</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-[#1e2d4e]">{child.name}</h2>
            <p className="text-sm text-[#6b6860]">{ageLabel(child.dob)} · {child.room}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium bg-[#dcfce7] text-[#16a34a] px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#16a34a]" /> Checked in {checkin ? `at ${checkin.time}` : ""}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-5">
          {[
            { Icon: Utensils, n: counts.meals, l: "Meals" },
            { Icon: Moon, n: counts.naps, l: "Naps" },
            { Icon: Baby, n: counts.diapers, l: "Diapers" },
            { Icon: Camera, n: counts.photos, l: "Photos" },
          ].map(({ Icon, n, l }) => (
            <div key={l} className="bg-[#f3f2ee] rounded-xl py-3 text-center">
              <Icon size={18} className="mx-auto text-[#0f7173]" aria-hidden />
              <p className="text-xl font-bold text-[#1e2d4e] mt-1 leading-none">{n}</p>
              <p className="text-xs text-[#6b6860] mt-1">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Needs attention */}
      {(openInvoice || docsNeedingAction.length > 0) && (
        <div className="space-y-2 mb-5">
          {openInvoice && (
            <button onClick={() => onNav("p-billing")} className="w-full bg-[#fef3c7] border border-[#fcd34d] rounded-xl px-4 py-3.5 flex items-center gap-3 text-left min-h-14 hover:bg-[#fde68a]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d97706]">
              <CreditCard size={20} className="text-[#d97706] flex-shrink-0" aria-hidden />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-[#92400e]">{openInvoice.status === "overdue" ? "Tuition overdue" : "Tuition due"} · ${openInvoice.amount.toLocaleString()}</span>
                <span className="block text-xs text-[#92400e]/80">{openInvoice.period} · due {openInvoice.dueDate}</span>
              </span>
              <ChevronRight size={18} className="text-[#d97706]" aria-hidden />
            </button>
          )}
          {docsNeedingAction.map((d) => (
            <button key={d.id} onClick={() => onNav("p-family")} className="w-full bg-white border border-[#e2dfd8] rounded-xl px-4 py-3.5 flex items-center gap-3 text-left min-h-14 hover:border-[#0f7173] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173]">
              <FileSignature size={20} className="text-[#0f7173] flex-shrink-0" aria-hidden />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-[#1e2d4e]">{d.status === "needs-signature" ? "Signature needed" : d.status === "expires-soon" ? "Expiring soon" : "Document missing"}</span>
                <span className="block text-xs text-[#6b6860] truncate">{d.name}{d.formCode ? ` (${d.formCode})` : ""}</span>
              </span>
              <ChevronRight size={18} className="text-[#6b6860]" aria-hidden />
            </button>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={() => onNav("p-messages")} className="bg-[#1e2d4e] text-white rounded-xl px-4 py-3.5 flex items-center gap-3 min-h-14 font-medium hover:bg-[#2a3f6b] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0f7173]">
          <MessageSquare size={20} aria-hidden /> Message teacher
        </button>
        <button onClick={() => onNav("p-family")} className="bg-white border border-[#e2dfd8] text-[#1e2d4e] rounded-xl px-4 py-3.5 flex items-center gap-3 min-h-14 font-medium hover:border-[#0f7173] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173]">
          <LogIn size={20} className="text-[#0f7173]" aria-hidden /> Pickup info
        </button>
      </div>

      {/* Feed */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-[#1e2d4e]">Today's feed</h2>
        <div className="flex gap-1 bg-[#e2dfd8] p-1 rounded-lg" role="tablist" aria-label="Filter feed">
          {(["all", "photo", "meal", "nap"] as const).map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize min-h-9 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173] ${filter === f ? "bg-white text-[#1e2d4e] shadow-sm" : "text-[#6b6860]"}`}>
              {f === "all" ? "All" : f === "photo" ? "Photos" : f === "meal" ? "Meals" : "Naps"}
            </button>
          ))}
        </div>
      </div>
      <ol className="space-y-2">
        {visible.map((item) => {
          const t = TYPE[item.type]!;
          return (
            <li key={item.id} className="bg-white border border-[#e2dfd8] rounded-2xl p-4 flex gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${t.bg} ${t.fg}`}>
                <t.Icon size={20} aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold text-[#1e2d4e]">{item.title}</p>
                  <time className="text-xs font-mono text-[#6b6860] flex-shrink-0">{item.time}</time>
                </div>
                {item.detail && <p className="text-sm text-[#1a1a1a] mt-0.5">{item.detail}</p>}
                {item.photo && (
                  <div className="mt-3 aspect-[4/3] max-w-xs rounded-xl bg-gradient-to-br from-[#e8f4f4] to-[#dbeafe] flex items-center justify-center text-6xl" role="img" aria-label={`Photo: ${item.title}`}>
                    {item.photo}
                  </div>
                )}
                <p className="text-xs text-[#6b6860] mt-2">{item.by}</p>
              </div>
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className="border-2 border-dashed border-[#e2dfd8] rounded-2xl p-8 text-center text-sm text-[#6b6860]">Nothing here yet today.</li>
        )}
      </ol>
    </div>
  );
}
