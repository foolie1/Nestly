import { useState } from "react";
import { staff, facilities } from "../data";

type Props = { facilityId: string };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function Staff({ facilityId }: Props) {
  const [tab, setTab] = useState<"schedule" | "certifications">("schedule");
  const centerStaff = staff.filter((s) => s.facilityId === facilityId);
  const facility = facilities.find((f) => f.id === facilityId) ?? facilities[0];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-sm font-mono text-[#6b6860] uppercase tracking-widest mb-1">Staff</p>
          <h1 className="text-3xl font-bold text-[#1e2d4e]">Scheduling &amp; Certifications</h1>
          <p className="text-[#6b6860] mt-1">{facility.name} · {centerStaff.length} staff members</p>
        </div>
        <button className="bg-[#1e2d4e] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#2a3f6b] transition-colors">
          + Add Staff
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#e2dfd8] p-1 rounded-lg w-fit">
        {(["schedule", "certifications"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${tab === t ? "bg-white text-[#1e2d4e] shadow-sm" : "text-[#6b6860] hover:text-[#1e2d4e]"}`}>
            {t === "schedule" ? "Weekly Schedule" : "Certifications"}
          </button>
        ))}
      </div>

      {tab === "schedule" && (
        <>
          {/* Weekly grid */}
          <div className="bg-white border border-[#e2dfd8] rounded-xl overflow-hidden mb-6">
            <div className="grid grid-cols-6 border-b border-[#e2dfd8]">
              <div className="px-4 py-3 bg-[#f3f2ee]">
                <span className="text-xs font-mono uppercase tracking-wider text-[#6b6860]">Staff</span>
              </div>
              {DAYS.map((d) => (
                <div key={d} className="px-4 py-3 bg-[#f3f2ee] text-center">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#6b6860]">{d}</span>
                </div>
              ))}
            </div>
            {centerStaff.map((s) => {
              const certBlocked = s.certifications.some((c) => c.status === "expired");
              const bgBlocked = s.backgroundScreening.status === "pending";
              return (
                <div key={s.id} className={`grid grid-cols-6 border-t border-[#e2dfd8] ${certBlocked || bgBlocked ? "bg-[#fff7f7]" : ""}`}>
                  <div className="px-4 py-4">
                    <p className="font-medium text-sm text-[#1e2d4e]">{s.name}</p>
                    <p className="text-xs text-[#6b6860]">{s.role}</p>
                    <p className="text-xs text-[#6b6860]">{s.room}</p>
                    {certBlocked && <span className="text-xs bg-[#fee2e2] text-[#dc2626] px-1.5 py-0.5 rounded mt-1 inline-block">Cert expired</span>}
                    {bgBlocked && <span className="text-xs bg-[#fef3c7] text-[#d97706] px-1.5 py-0.5 rounded mt-1 inline-block">BG pending</span>}
                  </div>
                  {DAYS.map((d) => {
                    const shift = s.scheduledShifts.find((sh) => sh.startsWith(d));
                    return (
                      <div key={d} className="px-3 py-4 text-center">
                        {shift ? (
                          <div className={`rounded-lg px-2 py-1.5 text-xs font-mono ${certBlocked ? "bg-[#fee2e2] text-[#dc2626]" : "bg-[#e8f4f4] text-[#0f7173]"}`}>
                            {shift.replace(d + " ", "")}
                          </div>
                        ) : (
                          <span className="text-xs text-[#e2dfd8]">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Ratio coverage check */}
          <div className="bg-white border border-[#e2dfd8] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e2dfd8]">
              <h2 className="font-semibold text-[#1e2d4e]">Ratio Coverage Check — Monday</h2>
              <p className="text-xs text-[#6b6860] mt-0.5">Scheduling is blocked if a ratio-critical certification has lapsed</p>
            </div>
            <div className="divide-y divide-[#e2dfd8]">
              {facility.rooms.map((room) => {
                const roomStaff = centerStaff.filter((s) => s.room === room.name);
                const expiredCount = roomStaff.filter((s) => s.certifications.some((c) => c.status === "expired")).length;
                const effectiveStaff = roomStaff.length - expiredCount;
                const noStaff = effectiveStaff === 0;
                const ratio = !noStaff ? room.childrenPresent / effectiveStaff : 0;
                const over = !noStaff && ratio > room.ratioLimit;
                return (
                  <div key={room.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#1e2d4e]">{room.name}</p>
                      <p className="text-xs text-[#6b6860]">{room.childrenPresent} children enrolled · {roomStaff.length} staff scheduled</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {expiredCount > 0 && (
                        <span className="text-xs bg-[#fee2e2] text-[#dc2626] px-2 py-1 rounded font-mono">{expiredCount} cert lapsed</span>
                      )}
                      {noStaff ? (
                        <span className="font-mono text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#fee2e2] text-[#dc2626]">
                          No staff scheduled — ratio cannot be met
                        </span>
                      ) : (
                        <span className={`font-mono text-sm font-bold px-3 py-1 rounded-lg ${over ? "bg-[#fee2e2] text-[#dc2626]" : "bg-[#dcfce7] text-[#16a34a]"}`}>
                          {over ? "⚠ " : ""}1:{ratio.toFixed(1)} {over ? "(OVER)" : "(OK)"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {tab === "certifications" && (
        <div className="space-y-4">
          {centerStaff.map((s) => {
            const anyIssue = s.certifications.some((c) => c.status !== "valid") || s.backgroundScreening.status !== "clear";
            return (
              <div key={s.id} className={`bg-white border rounded-xl overflow-hidden ${anyIssue ? "border-[#fca5a5]" : "border-[#e2dfd8]"}`}>
                <div className="px-6 py-4 border-b border-[#e2dfd8] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#e8f4f4] flex items-center justify-center text-sm font-bold text-[#0f7173]">
                      {s.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1e2d4e]">{s.name}</p>
                      <p className="text-xs text-[#6b6860]">{s.role} · {s.room}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${anyIssue ? "bg-[#fee2e2] text-[#dc2626]" : "bg-[#dcfce7] text-[#16a34a]"}`}>
                    {anyIssue ? "Action Required" : "✓ All Clear"}
                  </span>
                </div>
                <div className="px-6 py-4">
                  <div className="grid grid-cols-3 gap-3">
                    {/* Background Screening */}
                    <div className={`rounded-xl p-4 ${s.backgroundScreening.status === "clear" ? "bg-[#f3f2ee]" : s.backgroundScreening.status === "pending" ? "bg-[#fef3c7]" : "bg-[#fee2e2]"}`}>
                      <p className="text-xs font-mono uppercase tracking-widest text-[#6b6860] mb-1">Level 2 Background</p>
                      <p className={`font-semibold text-sm ${s.backgroundScreening.status === "clear" ? "text-[#1e2d4e]" : s.backgroundScreening.status === "pending" ? "text-[#d97706]" : "text-[#dc2626]"}`}>
                        {s.backgroundScreening.status === "clear" ? "✓ Clear" : s.backgroundScreening.status === "pending" ? "Pending" : "Expired"}
                      </p>
                      <p className="text-xs text-[#6b6860] mt-0.5">
                        {s.backgroundScreening.status === "clear" ? `Expires ${s.backgroundScreening.expiresDate}` : "FBI/FDLE · 5-year rescreening"}
                      </p>
                    </div>
                    {s.certifications.map((cert) => (
                      <div key={cert.name} className={`rounded-xl p-4 ${cert.status === "valid" ? "bg-[#f3f2ee]" : cert.status === "expiring-soon" ? "bg-[#fef3c7]" : "bg-[#fee2e2]"}`}>
                        <p className="text-xs font-mono uppercase tracking-widest text-[#6b6860] mb-1">{cert.name}</p>
                        <p className={`font-semibold text-sm ${cert.status === "valid" ? "text-[#1e2d4e]" : cert.status === "expiring-soon" ? "text-[#d97706]" : "text-[#dc2626]"}`}>
                          {cert.status === "valid" ? "✓ Valid" : cert.status === "expiring-soon" ? "⚠ Expires soon" : "✗ EXPIRED"}
                        </p>
                        <p className="text-xs text-[#6b6860] mt-0.5">Expires {cert.expiry}</p>
                      </div>
                    ))}
                  </div>
                  {anyIssue && (
                    <div className="mt-3 flex gap-2">
                      <button className="text-xs px-3 py-1.5 border border-[#e2dfd8] rounded-lg hover:border-[#0f7173] text-[#6b6860] hover:text-[#0f7173] transition-colors">Update certification</button>
                      <button className="text-xs px-3 py-1.5 border border-[#e2dfd8] rounded-lg hover:border-[#0f7173] text-[#6b6860] hover:text-[#0f7173] transition-colors">Send reminder</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
