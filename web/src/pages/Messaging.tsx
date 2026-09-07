import { useMemo, useState } from "react";
import { ArrowLeft, Building2, Eye, GraduationCap, Megaphone, Search, Send, ShieldCheck, X } from "lucide-react";
import { facilities } from "../data";
import { useAuth } from "../auth";
import { ROLE_LABEL, useMessages, type Thread, type ThreadKind } from "../messages";

type Props = { facilityId: string };
type Filter = "all" | "needs-reply" | ThreadKind;

const KIND_META: Record<ThreadKind, { label: string; Icon: typeof Building2; bg: string; fg: string }> = {
  child: { label: "Parent ↔ Teacher", Icon: GraduationCap, bg: "bg-accent-soft", fg: "text-accent" },
  office: { label: "Office", Icon: Building2, bg: "bg-brand-soft", fg: "text-brand" },
  broadcast: { label: "Broadcast", Icon: Megaphone, bg: "bg-warning-soft", fg: "text-warning" },
};

export default function Messaging({ facilityId }: Props) {
  const { user } = useAuth();
  const { visibleThreads, send, markRead, broadcast, needsReply } = useMessages();
  const role = user?.role ?? "staff";
  const isOversight = role === "director" || role === "owner";
  const facility = facilities.find((f) => f.id === facilityId) ?? facilities[0];

  const [filter, setFilter] = useState<Filter>("all");
  const [room, setRoom] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [bc, setBc] = useState({ title: "", body: "", allCenters: false });

  const all = visibleThreads(facilityId);
  const list = useMemo(() => {
    let ts = all;
    if (filter === "needs-reply") ts = ts.filter(needsReply);
    else if (filter !== "all") ts = ts.filter((t) => t.kind === filter);
    if (room !== "all") ts = ts.filter((t) => t.room === room);
    if (search.trim()) {
      const q = search.toLowerCase();
      ts = ts.filter((t) => t.title.toLowerCase().includes(q) || t.messages.some((m) => m.body.toLowerCase().includes(q) || m.senderName.toLowerCase().includes(q)));
    }
    return [...ts].sort((a, b) => (b.messages[b.messages.length - 1]?.at ?? "").localeCompare(a.messages[a.messages.length - 1]?.at ?? ""));
  }, [all, filter, room, search]);

  const open = all.find((t) => t.id === openId) ?? null;
  const counts = {
    needsReply: all.filter(needsReply).length,
    unread: all.filter((t) => !t.readByOffice && t.messages.length > 0).length,
  };
  const rooms = [...new Set(all.map((t) => t.room).filter(Boolean))] as string[];

  const openThread = (t: Thread) => { setOpenId(t.id); markRead(t.id); };
  const submit = () => { if (open && draft.trim()) { send(open.id, draft); setDraft(""); } };

  const senderLabel = user ? (role === "staff" ? user.name : `${user.name} · ${ROLE_LABEL[role as keyof typeof ROLE_LABEL]}`) : "";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-sm font-mono text-muted uppercase tracking-widest mb-1">{isOversight ? "All conversations" : "Messaging"}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand">{isOversight ? `${facility.name.split(" ").slice(0, 2).join(" ")} messages` : role === "staff" ? `${user?.room} families` : "Office inbox"}</h1>
          <p className="text-sm text-muted mt-1">
            {counts.needsReply > 0 ? <span className="text-warning font-medium">{counts.needsReply} waiting on a reply</span> : "Nobody's waiting on you"}
            {counts.unread > 0 && !isOversight ? ` · ${counts.unread} unread` : ""}
          </p>
        </div>
        {role !== "staff" && (
          <button onClick={() => setShowBroadcast(true)} className="inline-flex items-center gap-2 border-2 border-warning text-warning-strong text-sm font-semibold px-4 py-2.5 min-h-11 rounded-card hover:bg-warning-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-warning transition-colors">
            <Megaphone size={18} aria-hidden /> Broadcast
          </button>
        )}
      </div>

      {isOversight && (
        <div className="mb-4 bg-accent-soft border border-accent/30 rounded-card px-4 py-3 flex gap-3 text-sm text-accent-ink">
          <Eye size={18} className="flex-shrink-0 mt-0.5" aria-hidden />
          <p>You're seeing every thread in this center — parent↔teacher, office, and broadcasts. Anything you send is labeled <span className="font-semibold">{ROLE_LABEL[role as keyof typeof ROLE_LABEL]}</span> so families know who's talking. Views are recorded in the audit log.</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex gap-1 bg-line p-1 rounded-ctl" role="tablist" aria-label="Filter conversations">
          {([
            { id: "all", label: "All" },
            { id: "needs-reply", label: `Needs reply${counts.needsReply ? ` · ${counts.needsReply}` : ""}` },
            ...(role !== "office_admin" ? [{ id: "child", label: "Parent ↔ Teacher" }] : []),
            ...(role !== "staff" ? [{ id: "office", label: "Office" }] : []),
            { id: "broadcast", label: "Broadcasts" },
          ] as { id: Filter; label: string }[]).map((f) => (
            <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)} className={`px-3 py-2 min-h-10 rounded-ctl text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${filter === f.id ? "bg-white text-brand shadow-sm" : "text-muted hover:text-brand"}`}>{f.label}</button>
          ))}
        </div>
        {isOversight && rooms.length > 1 && (
          <select value={room} onChange={(e) => setRoom(e.target.value)} aria-label="Room" className="min-h-10 border border-line rounded-ctl px-3 text-sm bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <option value="all">All rooms</option>
            {rooms.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        )}
        <div className="relative flex-1 min-w-[180px] sm:max-w-xs sm:ml-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search families, staff, text…" aria-label="Search messages" className="w-full min-h-10 bg-white border border-line rounded-ctl pl-9 pr-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Thread list */}
        <div className={`md:col-span-2 space-y-2 ${open ? "hidden md:block" : ""}`}>
          {list.map((t) => {
            const meta = KIND_META[t.kind];
            const last = t.messages[t.messages.length - 1];
            const waiting = needsReply(t);
            return (
              <button
                key={t.id}
                onClick={() => openThread(t)}
                aria-current={openId === t.id ? "true" : undefined}
                className={`w-full text-left bg-white border rounded-[calc(var(--t-radius)+0.25rem)] p-4 flex gap-3 min-h-20 hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${openId === t.id ? "border-accent shadow-sm" : waiting ? "border-warning-line" : "border-line"}`}
              >
                <div className={`w-11 h-11 rounded-card flex items-center justify-center flex-shrink-0 ${meta.bg} ${meta.fg}`}><meta.Icon size={22} aria-hidden /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`truncate ${!t.readByOffice && t.messages.length ? "font-bold" : "font-semibold"} text-brand`}>{t.title}</p>
                    {last && <span className="text-xs font-mono text-muted flex-shrink-0">{last.time}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className={`px-1.5 py-0.5 rounded font-mono ${meta.bg} ${meta.fg}`}>{meta.label}</span>
                    {waiting && <span className="px-1.5 py-0.5 rounded font-medium bg-warning-soft text-warning-strong">Needs reply</span>}
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
            <div className="bg-white border border-line rounded-[calc(var(--t-radius)+0.25rem)] flex flex-col min-h-[520px] max-h-[calc(100vh-220px)]">
              <div className="px-4 py-3 border-b border-line flex items-center gap-2">
                <button onClick={() => setOpenId(null)} aria-label="Back to conversations" className="md:hidden w-10 h-10 -ml-2 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><ArrowLeft size={20} aria-hidden /></button>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-brand truncate">{open.title}</p>
                  <p className="text-xs text-muted">{KIND_META[open.kind].label}{open.room ? ` · ${open.room}` : ""}{open.kind === "child" && isOversight ? " · teacher thread, visible to you as " + ROLE_LABEL[role as keyof typeof ROLE_LABEL] : ""}</p>
                </div>
                {open.kind !== "broadcast" && open.familyName && (
                  <span className="hidden sm:inline text-xs font-mono text-muted bg-surface-2 px-2 py-1 rounded">{open.familyName} family</span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {open.messages.length === 0 && <p className="text-center text-sm text-muted py-8">No messages yet — start the conversation.</p>}
                {open.messages.map((m) => {
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
                <div className="p-3 border-t border-line text-xs text-muted text-center">Broadcasts are one-way. Families reply through their office thread.</div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="p-3 border-t border-line">
                  <div className="flex gap-2">
                    <label htmlFor="reply" className="sr-only">Reply</label>
                    <input id="reply" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Reply as ${senderLabel}…`} className="flex-1 min-h-11 bg-surface-2 rounded-card px-4 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:bg-white" />
                    <button type="submit" disabled={!draft.trim()} aria-label="Send" className="w-11 h-11 rounded-card bg-accent text-white flex items-center justify-center hover:bg-accent-hover disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"><Send size={18} aria-hidden /></button>
                  </div>
                  {isOversight && open.kind === "child" && (
                    <p className="text-[11px] text-muted mt-2 flex items-center gap-1"><ShieldCheck size={12} aria-hidden /> The family and {open.room} teachers will both see this, labeled {ROLE_LABEL[role as keyof typeof ROLE_LABEL]}.</p>
                  )}
                </form>
              )}
            </div>
          ) : (
            <div className="hidden md:flex bg-white border border-line rounded-[calc(var(--t-radius)+0.25rem)] items-center justify-center text-sm text-muted min-h-[520px]">Pick a conversation</div>
          )}
        </div>
      </div>

      {/* Broadcast modal */}
      {showBroadcast && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowBroadcast(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="bc-title" className="bg-white rounded-t-[calc(var(--t-radius)+0.5rem)] sm:rounded-[calc(var(--t-radius)+0.25rem)] shadow-2xl w-full sm:max-w-lg p-5 sm:p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 id="bc-title" className="text-lg font-bold text-brand">Broadcast to families</h2>
                <p className="text-sm text-muted">Goes to every family {bc.allCenters ? "at all centers" : `at ${facility.name.split(" ").slice(0, 2).join(" ")}`}. One-way — replies come to the office.</p>
              </div>
              <button onClick={() => setShowBroadcast(false)} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><X size={20} aria-hidden /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="bc-subject" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Subject</label>
                <input id="bc-subject" value={bc.title} onChange={(e) => setBc((b) => ({ ...b, title: e.target.value }))} placeholder="e.g. Early closure Friday" className="w-full min-h-11 border border-line rounded-card px-3.5 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
              </div>
              <div>
                <label htmlFor="bc-body" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Message</label>
                <textarea id="bc-body" rows={5} value={bc.body} onChange={(e) => setBc((b) => ({ ...b, body: e.target.value }))} className="w-full border border-line rounded-card px-3.5 py-2.5 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none" />
              </div>
              {role === "owner" && (
                <label className="flex items-center gap-3 text-sm cursor-pointer min-h-11">
                  <input type="checkbox" checked={bc.allCenters} onChange={(e) => setBc((b) => ({ ...b, allCenters: e.target.checked }))} className="w-4 h-4 accent-accent" />
                  Send to all {facilities.length} centers
                </label>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowBroadcast(false)} className="flex-1 min-h-12 rounded-card border border-line text-muted hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Cancel</button>
              <button
                disabled={!bc.title.trim() || !bc.body.trim()}
                onClick={() => { broadcast(bc.allCenters ? facilities.map((f) => f.id) : [facilityId], bc.title, bc.body); setShowBroadcast(false); setBc({ title: "", body: "", allCenters: false }); setFilter("broadcast"); }}
                className="flex-1 min-h-12 rounded-card bg-warning text-white font-semibold hover:bg-warning-strong disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-warning"
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
