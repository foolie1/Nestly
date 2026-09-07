import { useState } from "react";
import { messages } from "../data";

type Props = { facilityId: string };

export default function Messaging({ facilityId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(messages[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [compose, setCompose] = useState(false);

  const centerMessages = messages.filter((m) => m.facilityId === facilityId);
  const filtered = centerMessages.filter(
    (m) => m.subject.toLowerCase().includes(search.toLowerCase()) ||
      m.from.toLowerCase().includes(search.toLowerCase())
  );
  const selected = filtered.find((m) => m.id === selectedId) ?? filtered[0];
  const unread = centerMessages.filter((m) => !m.read).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-sm font-mono text-[#6b6860] uppercase tracking-widest mb-1">Messaging</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1e2d4e]">Messages</h1>
          {unread > 0 && <p className="text-[#0f7173] text-sm mt-1">{unread} unread</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCompose(true)} className="bg-[#1e2d4e] text-white text-sm font-medium px-4 py-2.5 min-h-11 rounded-lg hover:bg-[#2a3f6b] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0f7173] transition-colors">
            Compose
          </button>
          <button className="border border-[#dc2626] text-[#dc2626] text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#fee2e2] transition-colors">
            ⚡ Broadcast
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#e2dfd8] rounded-xl overflow-hidden flex flex-col md:flex-row" style={{ height: "calc(100vh - 240px)", minHeight: 480 }}>
        {/* Thread List */}
        <div className="w-full md:w-80 md:flex-shrink-0 md:border-r border-[#e2dfd8] flex flex-col">
          <div className="p-3 border-b border-[#e2dfd8]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages..."
              className="w-full bg-[#f3f2ee] rounded-lg px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173] focus:bg-white border border-transparent transition-all"
            />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#e2dfd8]">
            {filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`w-full px-4 py-4 text-left transition-colors ${selectedId === m.id ? "bg-[#e8f4f4]" : "hover:bg-[#f9f8f5]"}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {!m.read && <span className="w-2 h-2 rounded-full bg-[#0f7173] flex-shrink-0 mt-0.5" />}
                    <span className={`text-sm ${!m.read ? "font-semibold text-[#1e2d4e]" : "font-medium text-[#1e2d4e]"}`}>{m.from}</span>
                  </div>
                  <span className="text-xs font-mono text-[#6b6860] flex-shrink-0">{m.timestamp.split(" ")[1]}</span>
                </div>
                <p className={`text-sm mb-0.5 ${!m.read ? "font-medium text-[#1e2d4e]" : "text-[#6b6860]"}`}>{m.subject}</p>
                <p className="text-xs text-[#6b6860] truncate">{m.preview}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs bg-[#f3f2ee] text-[#6b6860] px-1.5 py-0.5 rounded font-mono">{m.fromRole}</span>
                  {m.childId && <span className="text-xs text-[#0f7173]">· child thread</span>}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="p-6 text-center text-sm text-[#6b6860]">No messages match your search.</div>
            )}
          </div>
        </div>

        {/* Message View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="px-8 py-5 border-b border-[#e2dfd8]">
                <h2 className="text-lg font-bold text-[#1e2d4e] mb-1">{selected.subject}</h2>
                <div className="flex items-center gap-4 text-sm text-[#6b6860]">
                  <span><span className="font-medium text-[#1e2d4e]">{selected.from}</span> ({selected.fromRole})</span>
                  <span>→ {selected.to}</span>
                  <span className="font-mono">{selected.timestamp}</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <p className="text-[#1a1a1a] leading-relaxed">{selected.body}</p>
              </div>
              <div className="px-8 py-4 border-t border-[#e2dfd8]">
                <div className="flex gap-3">
                  <input
                    placeholder="Reply to this message..."
                    className="flex-1 bg-[#f3f2ee] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173] focus:bg-white border border-transparent transition-all"
                  />
                  <button className="bg-[#0f7173] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0d5f61] transition-colors">Send</button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#6b6860] text-sm">
              Select a message to read
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {compose && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center" onClick={() => setCompose(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg p-5 sm:p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#1e2d4e] mb-5">New Message</h2>
            <div className="space-y-4">
              {[{ label: "To", placeholder: "Family name or staff member..." }, { label: "Subject", placeholder: "Subject..." }].map((f) => (
                <div key={f.label}>
                  <label className="text-xs font-mono uppercase tracking-widest text-[#6b6860] block mb-1.5">{f.label}</label>
                  <input placeholder={f.placeholder} className="w-full border border-[#e2dfd8] rounded-lg px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173] focus:border-[#0f7173]" />
                </div>
              ))}
              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-[#6b6860] block mb-1.5">Message</label>
                <textarea rows={5} placeholder="Write your message..." className="w-full border border-[#e2dfd8] rounded-lg px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173] focus:border-[#0f7173] resize-none" />
              </div>
              <div className="p-3 bg-[#f3f2ee] rounded-lg text-xs text-[#6b6860]">
                <span className="font-semibold text-[#1e2d4e]">Privacy:</span> Guardians can only see messages related to their own child's thread.
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setCompose(false)} className="flex-1 py-2 border border-[#e2dfd8] rounded-lg text-sm text-[#6b6860] hover:border-[#1e2d4e] transition-colors">Cancel</button>
              <button onClick={() => setCompose(false)} className="flex-1 py-2 bg-[#0f7173] text-white rounded-lg text-sm font-medium hover:bg-[#0d5f61] transition-colors">Send Message</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
