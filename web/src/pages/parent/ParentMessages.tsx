import { useState } from "react";
import { ArrowLeft, Building2, CheckCircle2, GraduationCap, Lock, Megaphone, Phone, Plus, Send, X } from "lucide-react";
import { children } from "../../data";
import { useAuth } from "../../auth";
import { CATEGORIES, CATEGORY_LABEL, ROLE_LABEL, centerPhone, useMessages, type TicketCategory, type Thread } from "../../messages";
import { ChildSwitcher, useSelectedChild } from "./childSwitcher";

export default function ParentMessages() {
  const { user } = useAuth();
  const [childId, setChildId] = useSelectedChild();
  const child = children.find((c) => c.id === childId) ?? children[0];
  const { visibleThreads, send: sendMsg, openTicket, canReply } = useMessages();
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [composing, setComposing] = useState(false);
  const phone = centerPhone(child.facilityId);

  const mine = visibleThreads().filter((t) => t.childId === child.id || t.kind === "broadcast");
  const classroom = mine.filter((t) => t.kind === "child");
  const announcements = mine.filter((t) => t.kind === "broadcast");
  const openTickets = mine.filter((t) => t.kind === "office" && t.status !== "resolved");
  const closedTickets = mine.filter((t) => t.kind === "office" && t.status === "resolved");
  const open = mine.find((t) => t.id === openId) ?? null;

  const send = () => {
    if (!open || !draft.trim()) return;
    sendMsg(open.id, draft);
    setDraft("");
  };

  const statusPill = (t: Thread) => {
    if (t.status === "resolved") return { cls: "bg-surface-2 text-muted", label: "Closed" };
    if (t.status === "answered") return { cls: "bg-success-soft text-success", label: "Answered" };
    return { cls: "bg-warning-soft text-warning", label: "Waiting on the office" };
  };

  const ThreadCard = ({ t }: { t: Thread }) => {
    const last = t.messages.filter((m) => !m.system).at(-1);
    const Icon = t.kind === "child" ? GraduationCap : t.kind === "office" ? Building2 : Megaphone;
    const label = t.kind === "child" ? `${child.room} teachers` : t.title;
    const pill = t.kind === "office" ? statusPill(t) : null;
    return (
      <button
        onClick={() => { setOpenId(t.id); setDraft(""); }}
        aria-current={openId === t.id ? "true" : undefined}
        className={`w-full text-left bg-surface border rounded-[calc(var(--t-radius)+0.25rem)] p-4 flex gap-3 min-h-20 hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${openId === t.id ? "border-accent shadow-sm" : "border-line"}`}
      >
        <div className={`w-11 h-11 rounded-card flex items-center justify-center flex-shrink-0 ${t.kind === "child" ? "bg-accent-soft text-accent" : t.kind === "office" ? (t.status === "resolved" ? "bg-surface-2 text-muted" : "bg-brand-soft text-brand") : "bg-warning-soft text-warning"}`}>
          <Icon size={22} aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-semibold text-brand truncate">{label}</p>
            {last && <span className="text-xs font-mono text-muted flex-shrink-0">{last.time}</span>}
          </div>
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            {t.kind === "child" && <span className="text-xs text-muted">{child.name.split(" ")[0]}'s classroom</span>}
            {t.kind === "office" && t.category && <span className="text-xs text-muted">{CATEGORY_LABEL[t.category]}</span>}
            {t.kind === "broadcast" && <span className="text-xs text-muted">Announcement</span>}
            {pill && <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${pill.cls}`}>{pill.label}</span>}
            {t.kind === "office" && t.openedBy === "center" && t.status !== "resolved" && <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium bg-accent-soft text-accent">From the center</span>}
          </div>
          <p className="text-sm text-ink truncate">{last ? `${last.senderId === user?.id ? "You: " : ""}${last.body}` : "No messages yet"}</p>
        </div>
      </button>
    );
  };

  const Conversation = () => {
    if (!open) {
      return <div className="hidden md:flex bg-surface border border-line rounded-[calc(var(--t-radius)+0.25rem)] items-center justify-center text-sm text-muted min-h-[420px]">Pick a conversation</div>;
    }
    const replyable = canReply(open);
    const closed = open.status === "resolved";
    return (
      <div className="bg-surface border border-line rounded-[calc(var(--t-radius)+0.25rem)] flex flex-col h-full min-h-[420px]">
        <div className="px-4 py-3 border-b border-line flex items-center gap-2">
          <button onClick={() => setOpenId(null)} aria-label="Back to conversations" className="md:hidden w-10 h-10 -ml-2 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><ArrowLeft size={20} aria-hidden /></button>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-brand truncate">{open.kind === "child" ? `${child.room} teachers` : open.title}</p>
            <p className="text-xs text-muted">
              {open.kind === "child"
                ? "Teachers reply during classroom hours · center directors can see this thread"
                : open.kind === "broadcast"
                  ? "From your center"
                  : `${open.category ? CATEGORY_LABEL[open.category] : "Request"}${closed ? ` · closed ${open.resolvedOn ?? ""}` : ""}`}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {open.messages.length === 0 && <p className="text-center text-sm text-muted py-8">Say hello 👋</p>}
          {open.messages.map((m) => {
            if (m.system) {
              return (
                <p key={m.id} className="text-center text-xs text-muted py-1 flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={13} aria-hidden /> {m.body}
                </p>
              );
            }
            const mine = m.senderId === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-[calc(var(--t-radius)+0.25rem)] px-4 py-2.5 ${mine ? "bg-accent text-white rounded-br-md" : "bg-surface-2 text-ink rounded-bl-md"}`}>
                  {!mine && <p className="text-xs font-semibold text-brand mb-0.5">{m.senderName} <span className="font-normal text-muted">· {ROLE_LABEL[m.senderRole]}</span></p>}
                  <p className="text-sm leading-relaxed">{m.body}</p>
                  <p className={`text-[11px] mt-1 ${mine ? "text-white/70" : "text-muted"}`}>{m.time}</p>
                </div>
              </div>
            );
          })}
        </div>

        {open.kind === "broadcast" ? (
          <div className="p-3 border-t border-line text-xs text-muted text-center">Announcements are one-way — start a request if you need something.</div>
        ) : closed ? (
          <div className="p-4 border-t border-line bg-surface-2 rounded-b-[calc(var(--t-radius)+0.25rem)]">
            <p className="text-sm text-ink flex items-start gap-2">
              <Lock size={16} className="text-muted flex-shrink-0 mt-0.5" aria-hidden />
              <span>This request was closed{open.resolvedBy ? ` by ${open.resolvedBy}` : ""}{open.resolvedOn ? ` on ${open.resolvedOn}` : ""}. Still need help with it?</span>
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={() => { setOpenId(null); setComposing(true); }} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 min-h-11 rounded-ctl bg-brand text-white hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent">
                <Plus size={16} aria-hidden /> Start a new request
              </button>
              <a href={`tel:${phone.replace(/\D/g, "")}`} className="inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 min-h-11 rounded-ctl border border-line text-brand hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                <Phone size={16} className="text-accent" aria-hidden /> Call {phone}
              </a>
            </div>
          </div>
        ) : replyable ? (
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-3 border-t border-line flex gap-2">
            <label htmlFor="reply" className="sr-only">Message</label>
            <input id="reply" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message…" className="flex-1 min-h-11 bg-surface-2 rounded-ctl px-4 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus:bg-surface" />
            <button type="submit" disabled={!draft.trim()} aria-label="Send" className="w-11 h-11 rounded-ctl bg-accent text-white flex items-center justify-center hover:bg-accent-hover disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"><Send size={18} aria-hidden /></button>
          </form>
        ) : null}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand">Messages</h1>
        <button onClick={() => setComposing(true)} className="inline-flex items-center justify-center gap-2 bg-brand text-white text-sm font-semibold px-4 py-2.5 min-h-11 rounded-full hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent">
          <Plus size={18} aria-hidden /> New request
        </button>
      </div>

      <ChildSwitcher value={childId} onChange={(id) => { setChildId(id); setOpenId(null); }} />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className={`md:col-span-2 space-y-4 ${open ? "hidden md:block" : ""}`}>
          {classroom.length > 0 && (
            <section aria-labelledby="cls-h">
              <h2 id="cls-h" className="text-xs font-mono uppercase tracking-widest text-muted mb-2 px-1">Classroom</h2>
              <div className="space-y-2">{classroom.map((t) => <ThreadCard key={t.id} t={t} />)}</div>
            </section>
          )}

          <section aria-labelledby="req-h">
            <h2 id="req-h" className="text-xs font-mono uppercase tracking-widest text-muted mb-2 px-1">Requests {openTickets.length > 0 && `· ${openTickets.length} open`}</h2>
            <div className="space-y-2">
              {openTickets.map((t) => <ThreadCard key={t.id} t={t} />)}
              {openTickets.length === 0 && (
                <button onClick={() => setComposing(true)} className="w-full border-2 border-dashed border-line rounded-[calc(var(--t-radius)+0.25rem)] p-5 text-center text-sm text-muted hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  <Plus size={18} className="mx-auto mb-1" aria-hidden />
                  No open requests — start one
                </button>
              )}
            </div>
          </section>

          {closedTickets.length > 0 && (
            <section aria-labelledby="closed-h">
              <h2 id="closed-h" className="text-xs font-mono uppercase tracking-widest text-muted mb-2 px-1">Closed</h2>
              <div className="space-y-2">{closedTickets.map((t) => <ThreadCard key={t.id} t={t} />)}</div>
            </section>
          )}

          {announcements.length > 0 && (
            <section aria-labelledby="ann-h">
              <h2 id="ann-h" className="text-xs font-mono uppercase tracking-widest text-muted mb-2 px-1">Announcements</h2>
              <div className="space-y-2">{announcements.map((t) => <ThreadCard key={t.id} t={t} />)}</div>
            </section>
          )}

          <p className="text-xs text-muted px-1 pt-1">
            You only see threads about your own child. Your child's teachers and the center director can see them too. Urgent? Call {phone}.
          </p>
        </div>
        <div className={`md:col-span-3 ${!open ? "hidden md:block" : ""}`}><Conversation /></div>
      </div>

      {composing && (
        <NewRequest
          childName={child.name}
          onClose={() => setComposing(false)}
          onSubmit={(category, title, body) => {
            const id = openTicket({ childId: child.id, category, title, body });
            setComposing(false);
            if (id) setOpenId(id);
          }}
        />
      )}
    </div>
  );
}

function NewRequest({ childName, onClose, onSubmit }: { childName: string; onClose: () => void; onSubmit: (c: TicketCategory, title: string, body: string) => void }) {
  const [category, setCategory] = useState<TicketCategory | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const ready = !!category && title.trim().length > 2 && body.trim().length > 2;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="nr-title" className="bg-surface rounded-t-[calc(var(--t-radius)+0.5rem)] sm:rounded-[calc(var(--t-radius)+0.25rem)] shadow-2xl w-full sm:max-w-lg p-5 sm:p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 id="nr-title" className="text-lg font-bold text-brand">New request</h2>
            <p className="text-sm text-muted">About {childName}. The office will reply here.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-ctl text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><X size={20} aria-hidden /></button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted mb-1.5">What's it about?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label="Category">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={category === c.id}
                  onClick={() => setCategory(c.id)}
                  className={`text-left border-2 rounded-card p-3 min-h-16 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors ${category === c.id ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong"}`}
                >
                  <span className="block text-sm font-semibold text-brand">{c.label}</span>
                  <span className="block text-xs text-muted mt-0.5">{c.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="nr-subject" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Subject</label>
            <input id="nr-subject" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="One line — e.g. Changing to 3 days a week" className="w-full min-h-11 border border-line rounded-ctl px-3.5 text-base bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
          </div>

          <div>
            <label htmlFor="nr-body" className="text-xs font-mono uppercase tracking-widest text-muted block mb-1.5">Details</label>
            <textarea id="nr-body" rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Tell us what you need…" className="w-full border border-line rounded-ctl px-3.5 py-2.5 text-base bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 min-h-12 rounded-ctl border border-line text-muted hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Cancel</button>
          <button disabled={!ready} onClick={() => category && onSubmit(category, title, body)} className="flex-1 min-h-12 rounded-ctl bg-brand text-white font-semibold hover:bg-brand-hover disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent">
            Send request
          </button>
        </div>
      </div>
    </div>
  );
}
