import { useMemo, useState } from "react";
import { ArrowLeft, Building2, CheckCircle2, Eye, GraduationCap, Lock, Megaphone, Plus, RotateCcw, Search, Send, ShieldCheck, X } from "lucide-react";
import { children, facilities } from "../data";
import { useAuth } from "../auth";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  ROLE_LABEL,
  canClose,
  useMessages,
  type TicketCategory,
  type Thread,
  type ThreadKind,
} from "../messages";

type Props = { facilityId: string };
type Filter = "open" | "needs-reply" | "resolved" | "all" | ThreadKind;

const KIND_META: Record<ThreadKind, { label: string; Icon: typeof Building2; bg: string; fg: string }> = {
  child: { label: "Classroom", Icon: GraduationCap, bg: "bg-accent-soft", fg: "text-accent" },
  office: { label: "Request", Icon: Building2, bg: "bg-brand-soft", fg: "text-brand" },
  broadcast: { label: "Broadcast", Icon: Megaphone, bg: "bg-warning-soft", fg: "text-warning" },
};

export default function Messaging({ facilityId }: Props) {
  const { user } = useAuth();
  const { visibleThreads, send, markRead, broadcast, startOutreach, resolve, reopen, needsReply, canReply } = useMessages();
  const role = user?.role ?? "staff";
  const isOversight = role === "director" || role === "owner";
  const mayClose = canClose(role);
  const facility = facilities.find((f) => f.id === facilityId) ?? facilities[0];

  const [filter, setFilter] = useState<Filter>("open");
  const [room, setRoom] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showOutreach, setShowOutreach] = useState(false);
  const [bc, setBc] = useState({ title: "", body: "", allCenters: false });

  const all = visibleThreads(facilityId);

  const list = useMemo(() => {
    let ts = all;
    if (filter === "open") ts = ts.filter((t) => t.status !== "resolved");
    else if (filter === "resolved") ts = ts.filter((t) => t.status === "resolved");
    else if (filter === "needs-reply") ts = ts.filter(needsReply);
    else if (filter !== "all") ts = ts.filter((t) => t.kind === filter);
    if (room !== "all") ts = ts.filter((t) => t.room === room);
    if (search.trim()) {
      const q = search.toLowerCase();
      ts = ts.filter((t) => t.title.toLowerCase().includes(q) || (t.familyName ?? "").toLowerCase().includes(q) || t.messages.some((m) => m.body.toLowerCase().includes(q) || m.senderName.toLowerCase().includes(q)));
    }
    return [...ts].sort((a, b) => (b.messages.at(-1)?.at ?? "").localeCompare(a.messages.at(-1)?.at ?? ""));
  }, [all, filter, room, search]);

  const open = all.find((t) => t.id === openId) ?? null;
  const counts = {
    needsReply: all.filter(needsReply).length,
    openTickets: all.filter((t) => t.kind === "office" && t.status !== "resolved").length,
    resolved: all.filter((t) => t.status === "resolved").length,
  };
  const rooms = [...new Set(all.map((t) => t.room).filter(Boolean))] as string[];

  const openThread = (t: Thread) => { setOpenId(t.id); setDraft(""); markRead(t.id); };
  const submit = () => { if (open && draft.trim()) { send(open.id, draft); setDraft(""); } };
  const senderLabel = user ? (role === "staff" ? user.name : `${user.name} · ${ROLE_LABEL[role as keyof typeof ROLE_LABEL]}`) : "";

  const statusPill = (t: Thread) => {
    if (t.kind !== "office") return null;
    if (t.status === "resolved") return { cls: "bg-surface-2 text-muted", label: "Closed" };
    if (t.status === "answered") return { cls: "bg-info-soft text-info", label: "Answered" };
    return { cls: "bg-warning-soft text-warning", label: "Open" };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-sm font-mono text-muted uppercase tracking-widest mb-1">{isOversight ? "All conversations" : role === "office_admin" ? "Family requests" : "Messaging"}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand">{role === "staff" ? `${user?.room} families` : `${facility.name.split(" ").slice(0, 2).join(" ")} messages`}</h1>
          <p className="text-sm text-muted mt-1">
            {counts.needsReply > 0 ? <span className="text-warning font-medium">{counts.needsReply} waiting on a reply</span> : "Nobody's waiting on you"}
            {role !== "staff" ? ` · ${counts.openTickets} open request${counts.openTickets === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        {role !== "staff" && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowOutreach(true)} className="inline-flex items-center gap-2 bg-brand text-white text-sm font-semibold px-4 py-2.5 min-h-11 rounded-full hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent transition-colors">
              <Plus size={18} aria-hidden /> Message a family
            </button>
            <button onClick={() => setShowBroadcast(true)} className="inline-flex items-center gap-2 border-2 border-warning text-warning-strong text-sm font-semibold px-4 py-2.5 min-h-11 rounded-full hover:bg-warning-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-warning transition-colors">
              <Megaphone size={18} aria-hidden /> Broadcast
            </button>
          </div>
        )}
      </div>

      {isOversight && (
        <div className="mb-4 bg-accent-soft border border-accent/30 rounded-card px-4 py-3 flex gap-3 text-sm text-accent-ink">
          <Eye size={18} className="flex-shrink-0 mt-0.5" aria-hidden />
          <p>You're seeing every thread in this center — classroom chats, family requests, and broadcasts. Anything you send is labeled <span className="font-semibold">{ROLE_LABEL[role as keyof typeof ROLE_LABEL]}</span>. Closing a request stops replies on it; the family can still open a new one.</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex gap-1 bg-line p-1 rounded-ctl overflow-x-auto" role="tablist" aria-label="Filter conversations">
          {([
            { id: "open", label: "Open" },
            { id: "needs-reply", label: `Needs reply${counts.needsReply ? ` · ${counts.needsReply}` : ""}` },
            { id: "resolved", label: `Closed${counts.resolved ? ` · ${counts.resolved}` : ""}` },
            ...(role !== "office_admin" ? [{ id: "child", label: "Classroom" }] : []),
            ...(role !== "staff" ? [{ id: "office", label: "Requests" }] : []),
            { id: "all", label: "All" },
          ] as { id: Filter; label: string }[]).map((f) => (
            <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)} className={`px-3 py-2 min-h-10 rounded-ctl text-sm font-medium whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${filter === f.id ? "bg-surface text-brand shadow-sm" : "text-muted hover:text-brand"}`}>{f.label}</button>
          ))}
        </div>
        {isOversight && rooms.length > 1 && (
          <select value={room} onChange={(e) => setRoom(e.target.value)} aria-label="Room" className="min-h-10 border border-line rounded-ctl px-3 text-sm bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <option value="all">All rooms</option>
            {rooms.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        )}
        <div className="relative flex-1 min-w-[180px] sm:max-w-xs sm:ml-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search families, staff, text…" aria-label="Search messages" className="w-full min-h-10 bg-surface border border-line rounded-ctl pl-9 pr-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Thread list */}
        <div className={`md:col-span-2 space-y-2 ${open ? "hidden md:block" : ""}`}>
          {list.map((t) => {
            const meta = KIND_META[t.kind];
            const last = t.messages.filter((m) => !m.system).at(-1);
            const waiting = needsReply(t);
            const pill = statusPill(t);
            const closed = t.status === "resolved";
            return (
              <button
                key={t.id}
                onClick={() => openThread(t)}
                aria-current={openId === t.id ? "true" : undefined}
                className={`w-full text-left bg-surface border rounded-[calc(var(--t-radius)+0.25rem)] p-4 flex gap-3 min-h-20 hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${openId === t.id ? "border-accent shadow-sm" : waiting ? "border-warning-line" : "border-line"} ${closed ? "opacity-70" : ""}`}
              >
                <div className={`w-11 h-11 rounded-card flex items-center justify-center flex-shrink-0 ${closed ? "bg-surface-2 text-muted" : `${meta.bg} ${meta.fg}`}`}>
                  {closed ? <Lock size={20} aria-hidden /> : <meta.Icon size={22} aria-hidden />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`truncate ${!t.readByOffice && t.messages.length ? "font-bold" : "font-semibold"} text-brand`}>{t.title}</p>
                    {last && <span className="text-xs font-mono text-muted flex-shrink-0">{last.time}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs mb-1 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded font-mono ${meta.bg} ${meta.fg}`}>{meta.label}</span>
                    {t.kind === "office" && t.familyName && <span className="text-muted">{t.familyName} family</span>}
                    {pill && <span className={`px-1.5 py-0.5 rounded-full font-medium ${pill.cls}`}>{pill.label}</span>}
                    {waiting && <span className="px-1.5 py-0.5 rounded-full font-medium bg-warning-soft text-warning-strong">Needs reply</span>}
                    {!t.readByOffice && t.messages.length > 0 && <span className="w-2 h-2 rounded-full bg-accent" aria-label="Unread" />}
                  </div>
                  <p className="text-sm text-ink truncate">{last ? `${last.senderName.split(" ")[0]}: ${last.body}` : "No messages yet"}</p>
                </div>
              </button>
            );
          })}
          {list.length === 0 && <div className="border-2 border-dashed border-line rounded-[calc(var(--t-radius)+0.25rem)] p-8 text-center text-sm text-muted">Nothing matches.</div>}
        </div>

        {/* Conversation */}
        <div className={`md:col-span-3 ${!open ? "hidden md:block" : ""}`}>
          {open ? (
            <div className="bg-surface border border-line rounded-[calc(var(--t-radius)+0.25rem)] flex flex-col min-h-[520px] max-h-[calc(100vh-220px)]">
              <div className="px-4 py-3 border-b border-line flex items-center gap-2">
                <button onClick={() => setOpenId(null)} aria-label="Back to conversations" className="md:hidden w-10 h-10 -ml-2 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><ArrowLeft size={20} aria-hidden /></button>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-brand truncate">{open.title}</p>
                  <p className="text-xs text-muted truncate">
                    {KIND_META[open.kind].label}
                    {open.category ? ` · ${CATEGORY_LABEL[open.category]}` : ""}
                    {open.room ? ` · ${open.room}` : ""}
                    {open.familyName ? ` · ${open.familyName} family` : ""}
                    {open.status === "resolved" ? ` · closed by ${open.resolvedBy ?? "the office"}${open.resolvedOn ? ` on ${open.resolvedOn}` : ""}` : ""}
                  </p>
                </div>
                {open.kind === "office" && mayClose && (
                  open.status === "resolved" ? (
                    <button onClick={() => reopen(open.id)} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 min-h-10 rounded-ctl border border-line text-brand hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent flex-shrink-0">
                      <RotateCcw size={16} aria-hidden /> <span className="hidden sm:inline">Reopen</span>
                    </button>
                  ) : (
                    <button onClick={() => resolve(open.id)} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 min-h-10 rounded-ctl bg-success-soft text-success hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-success flex-shrink-0">
                      <CheckCircle2 size={16} aria-hidden /> <span className="hidden sm:inline">Resolve</span>
                    </button>
                  )
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {open.messages.length === 0 && <p className="text-center text-sm text-muted py-8">No messages yet — start the conversation.</p>}
                {open.messages.map((m) => {
                  if (m.system) {
                    return <p key={m.id} className="text-center text-xs text-muted py-1 flex items-center justify-center gap-1.5"><CheckCircle2 size={13} aria-hidden /> {m.body}</p>;
                  }
                  const mine = m.senderId === user?.id;
                  const fromCenter = m.senderRole !== "parent";
                  return (
                    <div key={m.id} className={`flex ${fromCenter ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-[calc(var(--t-radius)+0.25rem)] px-4 py-2.5 ${fromCenter ? (mine ? "bg-accent text-white rounded-br-md" : "bg-accent-soft text-ink rounded-br-md") : "bg-surface-2 text-ink rounded-bl-md"}`}>
                        <p className={`text-xs font-semibold mb-0.5 ${fromCenter && mine ? "text-white/90" : "text-brand"}`}>
                          {m.senderName} <span className={`font-normal ${fromCenter && mine ? "text-white/70" : "text-muted"}`}>· {ROLE_LABEL[m.senderRole]}</span>
                        </p>
                        <p className="text-sm leading-relaxed">{m.body}</p>
                        <p className={`text-[11px] mt-1 ${fromCenter && mine ? "text-white/70" : "text-muted"}`}>{m.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {open.kind === "broadcast" ? (
                <div className="p-3 border-t border-line text-xs text-muted text-center">Broadcasts are one-way. Families reply by opening a request.</div>
              ) : open.status === "resolved" ? (
                <div className="p-3 border-t border-line text-xs text-muted text-center flex items-center justify-center gap-1.5">
                  <Lock size={13} aria-hidden /> Closed — the family can read this but not reply.{mayClose ? " Reopen to continue." : ""}
                </div>
              ) : canReply(open) ? (
                <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="p-3 border-t border-line">
                  <div className="flex gap-2">
                    <label htmlFor="reply" className="sr-only">Reply</label>
                    <input id="reply" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Reply as ${senderLabel}…`} className="flex-1 min-h-11 bg-surface-2 rounded-ctl px-4 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:bg-surface" />
                    <button type="submit" disabled={!draft.trim()} aria-label="Send" className="w-11 h-11 rounded-ctl bg-accent text-white flex items-center justify-center hover:bg-accent-hover disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"><Send size={18} aria-hidden /></button>
                  </div>
                  {isOversight && open.kind === "child" && (
                    <p className="text-[11px] text-muted mt-2 flex items-center gap-1"><ShieldCheck size={12} aria-hidden /> The family and {open.room} teachers will both see this, labeled {ROLE_LABEL[role as keyof typeof ROLE_LABEL]}.</p>
                  )}
                </form>
              ) : (
                <div className="p-3 border-t border-line text-xs text-muted text-center">
                  {open.kind === "child" ? "Classroom chats are between the family and their teachers." : "Requests are handled by the office."}
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex bg-surface border border-line rounded-[calc(var(--t-radius)+0.25rem)] items-center justify-center text-sm text-muted min-h-[520px]">Pick a conversation</div>
          )}
        </div>
      </div>

      {/* Message a family */}
      {showOutreach && (
        <OutreachModal
          facilityId={facilityId}
          onClose={() => setShowOutreach(false)}
          onSubmit={(childId, category, title, body) => {
            const id = startOutreach({ childId, category, title, body });
            setShowOutreach(false);
            if (id) { setFilter("all"); setOpenId(id); }
          }}
        />
      )}

      {/* Broadcast */}
      {showBroadcast && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowBroadcast(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="bc-title" className="bg-surface rounded-t-[calc(var(--t-radius)+0.5rem)] sm:rounded-[calc(var(--t-radius)+0.25rem)] shadow-2xl w-full sm:max-w-lg p-5 sm:p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 id="bc-title" className="text-lg font-bold text-brand">Broadcast to families</h2>
                <p className="text-sm text-muted">Goes to every family {bc.allCenters ? "at all centers" : `at ${facility.name.split(" ").slice(0, 2).join(" ")}`}. One-way — families reply by opening a request.</p>
              </div>
              <button onClick={() => setShowBroadcast(false)} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><X size={20} aria-hidden /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="bc-subject" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Subject</label>
                <input id="bc-subject" value={bc.title} onChange={(e) => setBc((b) => ({ ...b, title: e.target.value }))} placeholder="e.g. Early closure Friday" className="w-full min-h-11 border border-line rounded-ctl px-3.5 text-base bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
              </div>
              <div>
                <label htmlFor="bc-body" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Message</label>
                <textarea id="bc-body" rows={5} value={bc.body} onChange={(e) => setBc((b) => ({ ...b, body: e.target.value }))} className="w-full border border-line rounded-ctl px-3.5 py-2.5 text-base bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none" />
              </div>
              {role === "owner" && (
                <label className="flex items-center gap-3 text-sm cursor-pointer min-h-11">
                  <input type="checkbox" checked={bc.allCenters} onChange={(e) => setBc((b) => ({ ...b, allCenters: e.target.checked }))} className="w-4 h-4 accent-accent" />
                  Send to all {facilities.length} centers
                </label>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowBroadcast(false)} className="flex-1 min-h-12 rounded-ctl border border-line text-muted hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Cancel</button>
              <button
                disabled={!bc.title.trim() || !bc.body.trim()}
                onClick={() => { broadcast(bc.allCenters ? facilities.map((f) => f.id) : [facilityId], bc.title, bc.body); setShowBroadcast(false); setBc({ title: "", body: "", allCenters: false }); setFilter("broadcast"); }}
                className="flex-1 min-h-12 rounded-ctl bg-warning text-white font-semibold hover:brightness-95 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-warning"
              >
                Send broadcast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OutreachModal({ facilityId, onClose, onSubmit }: { facilityId: string; onClose: () => void; onSubmit: (childId: string, c: TicketCategory, title: string, body: string) => void }) {
  const kids = children.filter((c) => c.facilityId === facilityId);
  const [childId, setChildId] = useState(kids[0]?.id ?? "");
  const [category, setCategory] = useState<TicketCategory>("other");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const child = kids.find((k) => k.id === childId);
  const ready = childId && title.trim().length > 2 && body.trim().length > 2;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="ou-title" className="bg-surface rounded-t-[calc(var(--t-radius)+0.5rem)] sm:rounded-[calc(var(--t-radius)+0.25rem)] shadow-2xl w-full sm:max-w-lg p-5 sm:p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 id="ou-title" className="text-lg font-bold text-brand">Message a family</h2>
            <p className="text-sm text-muted">Opens a request they can reply to. Close it when it's handled.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><X size={20} aria-hidden /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="ou-child" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Family</label>
            <select id="ou-child" value={childId} onChange={(e) => setChildId(e.target.value)} className="w-full min-h-11 border border-line rounded-ctl px-3 text-base bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              {kids.map((k) => <option key={k.id} value={k.id}>{k.guardian} — {k.name} ({k.room})</option>)}
            </select>
            {child && <p className="text-xs text-muted mt-1">Goes to {child.guardian} · {child.guardianPhone}</p>}
          </div>

          <div>
            <label htmlFor="ou-cat" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Topic</label>
            <select id="ou-cat" value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)} className="w-full min-h-11 border border-line rounded-ctl px-3 text-base bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="ou-subject" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Subject</label>
            <input id="ou-subject" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. DH 680 due in 5 days" className="w-full min-h-11 border border-line rounded-ctl px-3.5 text-base bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
          </div>

          <div>
            <label htmlFor="ou-body" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Message</label>
            <textarea id="ou-body" rows={4} value={body} onChange={(e) => setBody(e.target.value)} className="w-full border border-line rounded-ctl px-3.5 py-2.5 text-base bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 min-h-12 rounded-ctl border border-line text-muted hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Cancel</button>
          <button disabled={!ready} onClick={() => onSubmit(childId, category, title, body)} className="flex-1 min-h-12 rounded-ctl bg-brand text-white font-semibold hover:bg-brand-hover disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
