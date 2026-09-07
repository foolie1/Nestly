import { useState } from "react";
import { ArrowLeft, Building2, GraduationCap, Send } from "lucide-react";
import { children, parentThreads, type ParentThread } from "../../data";
import { useAuth } from "../../auth";
import { ChildSwitcher, useSelectedChild } from "./childSwitcher";

export default function ParentMessages() {
  const { user } = useAuth();
  const [childId, setChildId] = useSelectedChild();
  const child = children.find((c) => c.id === childId) ?? children[0];
  const [threads, setThreads] = useState<ParentThread[]>(parentThreads);
  const mine = threads.filter((t) => t.childId === child.id);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const open = mine.find((t) => t.id === openId) ?? null;

  const send = () => {
    if (!open || !draft.trim()) return;
    const msg = { id: `pm-${Date.now()}`, from: "me" as const, name: user?.name ?? "Me", body: draft.trim(), time: "Now" };
    setThreads((ts) => ts.map((t) => (t.id === open.id ? { ...t, messages: [...t.messages, msg] } : t)));
    setDraft("");
  };

  const ThreadCard = ({ t }: { t: ParentThread }) => {
    const last = t.messages[t.messages.length - 1];
    const Icon = t.kind === "teacher" ? GraduationCap : Building2;
    return (
      <button
        onClick={() => setOpenId(t.id)}
        aria-current={openId === t.id ? "true" : undefined}
        className={`w-full text-left bg-white border rounded-2xl p-4 flex gap-3 min-h-20 hover:border-[#0f7173] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173] ${openId === t.id ? "border-[#0f7173] shadow-sm" : "border-[#e2dfd8]"}`}
      >
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${t.kind === "teacher" ? "bg-[#e8f4f4] text-[#0f7173]" : "bg-[#e0e7ff] text-[#1e2d4e]"}`}>
          <Icon size={22} aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-semibold text-[#1e2d4e] truncate">{t.with}</p>
            {last && <span className="text-xs font-mono text-[#6b6860] flex-shrink-0">{last.time}</span>}
          </div>
          <p className="text-xs text-[#6b6860] mb-1">{t.kind === "teacher" ? `${child.name.split(" ")[0]}'s classroom` : "Billing, schedules, office questions"}</p>
          <p className="text-sm text-[#1a1a1a] truncate">{last ? `${last.from === "me" ? "You: " : ""}${last.body}` : "Start a conversation"}</p>
        </div>
      </button>
    );
  };

  const Conversation = () =>
    open ? (
      <div className="bg-white border border-[#e2dfd8] rounded-2xl flex flex-col h-full min-h-[420px]">
        <div className="px-4 py-3 border-b border-[#e2dfd8] flex items-center gap-2">
          <button onClick={() => setOpenId(null)} aria-label="Back to conversations" className="md:hidden w-10 h-10 -ml-2 flex items-center justify-center rounded-lg text-[#6b6860] hover:text-[#1e2d4e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173]"><ArrowLeft size={20} aria-hidden /></button>
          <div className="min-w-0">
            <p className="font-semibold text-[#1e2d4e] truncate">{open.with}</p>
            <p className="text-xs text-[#6b6860]">{open.kind === "teacher" ? "Teachers reply during classroom hours" : "Office hours 7am–6pm"}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {open.messages.length === 0 && <p className="text-center text-sm text-[#6b6860] py-8">Say hello 👋</p>}
          {open.messages.map((m) => (
            <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${m.from === "me" ? "bg-[#0f7173] text-white rounded-br-md" : "bg-[#f3f2ee] text-[#1a1a1a] rounded-bl-md"}`}>
                {m.from !== "me" && <p className="text-xs font-semibold text-[#1e2d4e] mb-0.5">{m.name}</p>}
                <p className="text-sm leading-relaxed">{m.body}</p>
                <p className={`text-[11px] mt-1 ${m.from === "me" ? "text-white/70" : "text-[#6b6860]"}`}>{m.time}</p>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-3 border-t border-[#e2dfd8] flex gap-2">
          <label htmlFor="reply" className="sr-only">Message</label>
          <input id="reply" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message…" className="flex-1 min-h-11 bg-[#f3f2ee] rounded-xl px-4 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173] focus:bg-white" />
          <button type="submit" disabled={!draft.trim()} aria-label="Send" className="w-11 h-11 rounded-xl bg-[#0f7173] text-white flex items-center justify-center hover:bg-[#0d5f61] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0f7173]"><Send size={18} aria-hidden /></button>
        </form>
      </div>
    ) : (
      <div className="hidden md:flex bg-white border border-[#e2dfd8] rounded-2xl items-center justify-center text-sm text-[#6b6860] min-h-[420px]">Pick a conversation</div>
    );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#1e2d4e] mb-4">Messages</h1>
      <ChildSwitcher value={childId} onChange={(id) => { setChildId(id); setOpenId(null); }} />
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className={`md:col-span-2 space-y-2 ${open ? "hidden md:block" : ""}`}>
          {mine.map((t) => <ThreadCard key={t.id} t={t} />)}
          <p className="text-xs text-[#6b6860] px-1 pt-2">You'll only ever see threads about your own child. Emergencies: call the center at (954) 555-0001.</p>
        </div>
        <div className={`md:col-span-3 ${!open ? "hidden md:block" : ""}`}><Conversation /></div>
      </div>
    </div>
  );
}
