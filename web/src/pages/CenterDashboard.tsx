import { CalendarCheck, ClipboardList, MessageSquare, Receipt, UserPlus } from "lucide-react";
import { facilities, children, incidents, staff } from "../data";

type Props = { facilityId: string; onNav: (page: string) => void };

export default function CenterDashboard({ facilityId, onNav }: Props) {
  const facility = facilities.find((f) => f.id === facilityId) ?? facilities[0];
  const centerChildren = children.filter((c) => c.facilityId === facilityId);
  const checkedIn = centerChildren.filter((c) => c.checkedIn).length;
  const centerStaff = staff.filter((s) => s.facilityId === facilityId);
  const centerIncidents = incidents.filter((i) => i.facilityId === facilityId);
  const immWarnings = centerChildren.filter((c) => c.immunizationStatus !== "current").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-sm font-mono text-[#6b6860] uppercase tracking-widest mb-1">Center Director View</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1e2d4e]">{facility.name}</h1>
          <p className="text-[#6b6860] mt-1">{facility.address} · {facility.city}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
            facility.status === "good" ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#fef3c7] text-[#d97706]"
          }`}>
            <span className={`w-2 h-2 rounded-full ${facility.status === "good" ? "bg-[#16a34a]" : "bg-[#d97706]"}`} />
            {facility.complianceScore}% Compliant
          </span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-6 sm:mb-8">
        {[
          { label: "Check in a child", Icon: CalendarCheck, page: "checkin" },
          { label: "Log activity", Icon: ClipboardList, page: "logs" },
          { label: "New inquiry", Icon: UserPlus, page: "enrollment" },
          { label: "Message families", Icon: MessageSquare, page: "messaging" },
          { label: "Invoices", Icon: Receipt, page: "billing" },
        ].map((a) => (
          <button key={a.page} onClick={() => onNav(a.page)} className="bg-[#1e2d4e] text-white rounded-xl px-3 py-3 min-h-14 flex items-center gap-2.5 text-sm font-medium hover:bg-[#2a3f6b] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0f7173] transition-colors">
            <a.Icon size={20} className="flex-shrink-0" aria-hidden /> <span className="truncate">{a.label}</span>
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {[
          { label: "Enrolled", value: `${facility.enrollment}`, sub: `of ${facility.capacity} seats`, action: () => onNav("enrollment") },
          { label: "Checked In Today", value: `${checkedIn}`, sub: `of ${facility.enrollment} enrolled`, action: () => onNav("checkin") },
          { label: "Open Incidents", value: `${centerIncidents.length}`, sub: "This month", action: () => onNav("compliance") },
          { label: "Immunization Flags", value: `${immWarnings}`, sub: "Require attention", action: () => onNav("enrollment") },
        ].map((k) => (
          <button key={k.label} onClick={k.action} className="bg-white border border-[#e2dfd8] rounded-xl p-5 text-left hover:border-[#0f7173] hover:shadow-sm transition-all">
            <p className="text-xs font-mono uppercase tracking-widest text-[#6b6860] mb-2">{k.label}</p>
            <p className="text-2xl sm:text-3xl font-bold text-[#1e2d4e]">{k.value}</p>
            <p className="text-xs text-[#6b6860] mt-1">{k.sub}</p>
          </button>
        ))}
      </div>

      {/* Rooms + Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
        <div className="lg:col-span-2 bg-white border border-[#e2dfd8] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e2dfd8] flex items-center justify-between">
            <h2 className="font-semibold text-[#1e2d4e]">Rooms &amp; Live Ratios</h2>
            <button onClick={() => onNav("checkin")} className="text-xs text-[#0f7173] font-medium hover:underline">Manage check-in →</button>
          </div>
          <div className="divide-y divide-[#e2dfd8]">
            {facility.rooms.map((r) => {
              const ratio = r.staffCount > 0 ? r.childrenPresent / r.staffCount : 0;
              const over = ratio > r.ratioLimit;
              const atCap = !over && r.staffCount > 0 && ratio === r.ratioLimit;
              const pct = Math.min(r.childrenPresent / r.capacity, 1);
              const ageLabel = { infant: "Infants (≤18 mo) · 1:4 max", toddler: "Toddlers (18–36 mo) · 1:6 max", preschool: "Preschool (3–5 yr) · 1:15 max", "school-age": "School-Age · 1:20 max" }[r.ageGroup];
              return (
                <div key={r.id} className="px-6 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-[#1e2d4e]">{r.name}</p>
                      <p className="text-xs text-[#6b6860]">{ageLabel}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-[#6b6860]">{r.childrenPresent}/{r.capacity} children</span>
                      <span className={`font-mono text-sm font-bold px-2.5 py-1 rounded-lg ${over ? "bg-[#fee2e2] text-[#dc2626]" : atCap ? "bg-[#fef3c7] text-[#d97706]" : "bg-[#dcfce7] text-[#16a34a]"}`}>
                        {over ? "⚠ " : atCap ? "△ " : ""}1:{ratio.toFixed(1)}{atCap ? " — at limit" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-[#e2dfd8] rounded-full h-1.5">
                      <div className="h-full bg-[#0f7173] rounded-full transition-all" style={{ width: `${pct * 100}%` }} />
                    </div>
                    <span className="text-xs font-mono text-[#6b6860] whitespace-nowrap">{r.staffCount} staff on</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Staff Summary */}
        <div className="bg-white border border-[#e2dfd8] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e2dfd8] flex items-center justify-between">
            <h2 className="font-semibold text-[#1e2d4e]">Staff Today</h2>
            <button onClick={() => onNav("staff")} className="text-xs text-[#0f7173] font-medium hover:underline">Schedule →</button>
          </div>
          <div className="divide-y divide-[#e2dfd8]">
            {centerStaff.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-[#6b6860]">No staff scheduled today.</div>
            ) : (
              centerStaff.map((s) => {
                const certAlert = s.certifications.some((c) => c.status === "expired" || c.status === "expiring-soon");
                const bgAlert = s.backgroundScreening.status !== "clear";
                return (
                  <div key={s.id} className="px-6 py-3.5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#e8f4f4] flex items-center justify-center text-sm font-bold text-[#0f7173] flex-shrink-0">
                      {s.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1e2d4e] truncate">{s.name}</p>
                      <p className="text-xs text-[#6b6860]">{s.room}</p>
                    </div>
                    <div className="flex gap-1">
                      {certAlert && <span className="w-2 h-2 rounded-full bg-[#d97706]" title="Cert issue" />}
                      {bgAlert && <span className="w-2 h-2 rounded-full bg-[#dc2626]" title="Background screening" />}
                      {!certAlert && !bgAlert && <span className="w-2 h-2 rounded-full bg-[#16a34a]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-[#e2dfd8] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2dfd8] flex items-center justify-between">
          <h2 className="font-semibold text-[#1e2d4e]">Recent Activity</h2>
          <button onClick={() => onNav("logs")} className="text-xs text-[#0f7173] font-medium hover:underline">All logs →</button>
        </div>
        <div className="divide-y divide-[#e2dfd8]">
          {[
            { time: "10:45", type: "Check-out", text: "Amelia Torres checked out by Carmen Torres (authorized)", tag: "check-out" },
            { time: "10:20", type: "Incident", text: "James Williams — small fall, no injury, monitored 15 min", tag: "incident" },
            { time: "10:00", type: "Meal Log", text: "Noah Patel — 5 oz formula, finished", tag: "meal" },
            { time: "09:30", type: "Nap", text: "Amelia Torres — nap started, swaddled", tag: "nap" },
            { time: "09:00", type: "Billing", text: "Invoice sent to Reyes family — August overdue ($1,250)", tag: "billing" },
          ].map((a, i) => (
            <div key={i} className="px-6 py-3.5 flex items-center gap-4">
              <span className="font-mono text-xs text-[#6b6860] w-12 flex-shrink-0">{a.time}</span>
              <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                a.tag === "incident" ? "bg-[#fee2e2] text-[#dc2626]" :
                a.tag === "billing" ? "bg-[#fef3c7] text-[#d97706]" :
                "bg-[#f3f2ee] text-[#6b6860]"
              }`}>{a.type}</span>
              <span className="text-sm text-[#1a1a1a]">{a.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
