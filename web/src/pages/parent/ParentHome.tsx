import { useState } from "react";
import { AlertTriangle, Baby, BedDouble, Camera, ChevronRight, ClipboardCheck, CreditCard, FileSignature, LogIn, MessageSquare, Moon, Pill, Smile, Sparkles, Utensils, type LucideIcon } from "lucide-react";
import { facilities, type LogType } from "../../data";
import { REQUIRED_FORMS, useForms } from "../../forms";
import { useAuth } from "../../auth";
import { useRoster } from "../../roster";
import { useLogs } from "../../logs";
import { useBilling } from "../../billing";
import { ChildSwitcher, useSelectedChild } from "./childSwitcher";
import { FeedVideo } from "../../media";

type Props = { onNav: (page: string) => void };

const TYPE: Record<LogType, { Icon: LucideIcon; bg: string; fg: string; label: string }> = {
  meal: { Icon: Utensils, bg: "bg-success-soft", fg: "text-success", label: "Meal" },
  nap: { Icon: BedDouble, bg: "bg-info-soft", fg: "text-info", label: "Nap" },
  diaper: { Icon: Baby, bg: "bg-slate-soft", fg: "text-slate", label: "Diaper" },
  bathroom: { Icon: Baby, bg: "bg-purple-soft", fg: "text-purple", label: "Bathroom" },
  photo: { Icon: Camera, bg: "bg-pink-soft", fg: "text-pink", label: "Photo" },
  note: { Icon: ClipboardCheck, bg: "bg-warning-soft", fg: "text-warning", label: "Note" },
  mood: { Icon: Smile, bg: "bg-warning-soft", fg: "text-warning", label: "Mood" },
  learning: { Icon: Sparkles, bg: "bg-purple-soft", fg: "text-purple", label: "Learning" },
  medication: { Icon: Pill, bg: "bg-info-soft", fg: "text-info", label: "Medication" },
  incident: { Icon: AlertTriangle, bg: "bg-danger-soft", fg: "text-danger", label: "Incident" },
};

function ageLabel(dob: string) {
  const d = new Date(dob), now = new Date("2026-08-31");
  const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  if (months < 24) return `${months} months`;
  return `${Math.floor(months / 12)} years`;
}

export default function ParentHome({ onNav }: Props) {
  const { user } = useAuth();
  const { roster } = useRoster();
  const { forChild } = useLogs();
  const { forChildren } = useBilling();
  const [childId, setChildId] = useSelectedChild();
  const child = roster.find((c) => c.id === childId) ?? roster[0];
  const facility = facilities.find((f) => f.id === child.facilityId) ?? facilities[0];
  // Same rows the teacher wrote — there is no separate parent feed.
  const items = forChild(child.id);
  const openInvoice = forChildren([child.name]).find((i) => i.status !== "paid");
  const { statusFor } = useForms();
  // Forms the family has to act on: never started, or sent back by the office.
  const docsNeedingAction = REQUIRED_FORMS
    .map((t) => ({ t, st: statusFor(child.id, t.id) }))
    .filter(({ st }) => st === "not-started" || st === "returned")
    .map(({ t, st }) => ({ id: t.id, name: t.name, status: st }));
  const [filter, setFilter] = useState<"all" | "photo" | "meal" | "nap">("all");
  const visible = filter === "all" ? items : items.filter((i) => i.type === filter);
  const firstName = user?.name.split(" ")[0];

  const heading = (item: (typeof items)[number]) => item.title ?? TYPE[item.type].label;

  const counts = {
    meals: items.filter((i) => i.type === "meal").length,
    naps: items.filter((i) => i.type === "nap" && heading(i).toLowerCase().includes("started")).length,
    diapers: items.filter((i) => i.type === "diaper").length,
    photos: items.filter((i) => i.type === "photo" || (i.media?.length ?? 0) > 0 || (i.videos?.length ?? 0) > 0).length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-5">
        <p className="text-sm text-muted">Good afternoon, {firstName} 👋</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand">Today at {facility.name.split(" ").slice(0, 2).join(" ")}</h1>
      </div>

      <ChildSwitcher value={childId} onChange={setChildId} />

      {/* Status card — compact */}
      <div className="bg-surface border border-line rounded-[calc(var(--t-radius)+0.25rem)] p-4 mb-3 shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 rounded-[calc(var(--t-radius)+0.25rem)] bg-accent-soft flex items-center justify-center text-2xl flex-shrink-0" aria-hidden>🧒</div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-brand leading-tight">{child.name}</h2>
          <p className="text-sm text-muted">{ageLabel(child.dob)} · {child.room}</p>
        </div>
        {child.checkedIn ? (
          <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium bg-success-soft text-success px-3 py-1.5 rounded-full flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-success" /> Present
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium bg-surface-2 text-muted px-3 py-1.5 rounded-full flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-muted" /> Not in yet
          </div>
        )}
      </div>

      {/* Day at a glance */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { Icon: Utensils, n: counts.meals, l: "Meals", f: "meal" as const },
          { Icon: Moon, n: counts.naps, l: "Naps", f: "nap" as const },
          { Icon: Baby, n: counts.diapers, l: "Diapers", f: "all" as const },
          { Icon: Camera, n: counts.photos, l: "Photos", f: "photo" as const },
        ].map(({ Icon, n, l, f }) => (
          <button key={l} onClick={() => setFilter(f)} aria-pressed={filter === f} className={`rounded-card py-3 text-center border focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors ${filter === f && f !== "all" ? "bg-accent-soft border-accent" : "bg-surface border-line hover:border-accent"}`}>
            <Icon size={18} className="mx-auto text-accent" aria-hidden />
            <p className="text-xl font-bold text-brand mt-1 leading-none">{n}</p>
            <p className="text-xs text-muted mt-1">{l}</p>
          </button>
        ))}
      </div>

      {/* Needs attention */}
      {(openInvoice || docsNeedingAction.length > 0) && (
        <div className="space-y-2 mb-3">
          {openInvoice && (
            <button onClick={() => onNav("p-billing")} className="w-full bg-warning-soft border border-warning-line rounded-card px-4 py-3 flex items-center gap-3 text-left min-h-12 hover:bg-warning-line/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-warning">
              <CreditCard size={20} className="text-warning flex-shrink-0" aria-hidden />
              <span className="flex-1 min-w-0 text-sm font-semibold text-warning-strong truncate">{openInvoice.status === "overdue" ? "Tuition overdue" : "Tuition due"} · ${openInvoice.amount.toLocaleString()} · {openInvoice.period}</span>
              <ChevronRight size={18} className="text-warning" aria-hidden />
            </button>
          )}
          {docsNeedingAction.map((d) => (
            <button key={d.id} onClick={() => onNav("p-family")} className="w-full bg-surface border border-line rounded-card px-4 py-3 flex items-center gap-3 text-left min-h-12 hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <FileSignature size={20} className="text-accent flex-shrink-0" aria-hidden />
              <span className="flex-1 min-w-0 text-sm truncate"><span className="font-semibold text-brand">{d.status === "returned" ? "Sent back — needs a change" : "Form to fill out"}</span> <span className="text-muted">· {d.name}</span></span>
              <ChevronRight size={18} className="text-muted" aria-hidden />
            </button>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onNav("p-messages")} className="bg-brand text-white rounded-full px-4 py-3 flex items-center justify-center gap-2 min-h-12 font-medium hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent">
          <MessageSquare size={18} aria-hidden /> Message teacher
        </button>
        <button onClick={() => onNav("p-family")} className="bg-surface border border-line text-brand rounded-full px-4 py-3 flex items-center justify-center gap-2 min-h-12 font-medium hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <LogIn size={18} className="text-accent" aria-hidden /> Pickup info
        </button>
      </div>

      {/* Feed — photo-first */}
      <div className="flex items-center justify-between mb-3 mt-5">
        <h2 className="font-semibold text-brand">{filter === "all" ? "Today's feed" : filter === "photo" ? "Today's photos" : filter === "meal" ? "Meals" : "Naps"}</h2>
        {filter !== "all" && <button onClick={() => setFilter("all")} className="text-xs font-medium text-accent min-h-9 px-2 rounded-ctl hover:bg-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Show everything</button>}
      </div>
      <ol className="space-y-3">
        {visible.map((item) => {
          const t = TYPE[item.type];
          const photos = item.media ?? [];
          const clips = item.videos ?? [];
          const title = heading(item);

          // Anything with a picture leads with the picture.
          if (photos.length > 0 || clips.length > 0) {
            return (
              <li key={item.id} className="bg-surface border border-line rounded-[calc(var(--t-radius)+0.25rem)] overflow-hidden shadow-sm">
                {clips.map((c, i) => <FeedVideo key={i} clip={c} label={title} />)}
                {photos.length === 0 ? null : photos.length === 1 ? (
                  <img src={photos[0]} alt={title} className="w-full aspect-[16/10] object-cover bg-surface-2" />
                ) : (
                  <ul className="grid grid-cols-2 gap-0.5 bg-line">
                    {photos.slice(0, 4).map((src, i) => (
                      <li key={i} className="relative">
                        <img src={src} alt={`${title} — photo ${i + 1}`} className="w-full aspect-square object-cover bg-surface-2" />
                        {i === 3 && photos.length > 4 && (
                          <span className="absolute inset-0 bg-black/55 text-white flex items-center justify-center text-lg font-bold">
                            +{photos.length - 4}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-semibold text-brand text-lg">{title}</p>
                    <time className="text-xs font-mono text-muted flex-shrink-0">{item.timestamp}</time>
                  </div>
                  {item.detail && item.detail !== title && <p className="text-sm text-ink mt-0.5">{item.detail}</p>}
                  <p className="text-xs text-muted mt-2">{clips.length ? "🎥" : "📸"} {item.loggedBy}</p>
                </div>
              </li>
            );
          }

          return (
            <li key={item.id} className={`bg-surface border rounded-[calc(var(--t-radius)+0.25rem)] p-4 flex gap-3 ${item.type === "incident" ? "border-danger-line" : "border-line"}`}>
              <div className={`w-11 h-11 rounded-card flex items-center justify-center flex-shrink-0 ${t.bg} ${t.fg}`}>
                <t.Icon size={22} aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold text-brand">{title}</p>
                  <time className="text-xs font-mono text-muted flex-shrink-0">{item.timestamp}</time>
                </div>
                {item.detail && item.detail !== title && <p className="text-sm text-ink mt-0.5">{item.detail}</p>}
                <p className="text-xs text-muted mt-1.5">{item.loggedBy}</p>
              </div>
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className="border-2 border-dashed border-line rounded-[calc(var(--t-radius)+0.25rem)] p-8 text-center text-sm text-muted">Nothing here yet today.</li>
        )}
      </ol>

    </div>
  );
}
