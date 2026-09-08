import { useState } from "react";
import { staff, facilities } from "../data";

type Props = { facilityId: string };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function Staff({ facilityId }: Props) {
  const [tab, setTab] = useState<"schedule" | "certifications">("schedule");
  const centerStaff = staff.filter((s) => s.facilityId === facilityId);
  const facility = facilities.find((f) => f.id === facilityId) ?? facilities[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-sm font-mono text-muted uppercase tracking-widest mb-1">Staff</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand">Scheduling &amp; Certifications</h1>
          <p className="text-muted mt-1">{facility.name} · {centerStaff.length} staff members</p>
        </div>
        <button className="bg-brand text-white text-sm font-medium px-4 py-2.5 min-h-11 rounded-ctl hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent transition-colors">
          + Add Staff
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-line p-1 rounded-ctl w-fit">
        {(["schedule", "certifications"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 min-h-10 rounded-ctl text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent capitalize ${tab === t ? "bg-surface text-brand shadow-sm" : "text-muted hover:text-brand"}`}>
            {t === "schedule" ? "Weekly Schedule" : "Certifications"}
          </button>
        ))}
      </div>

      {tab === "schedule" && (
        <>
          {/* Weekly grid */}
          <div className="bg-surface border border-line rounded-card overflow-x-auto mb-6">
            <div className="min-w-[760px] grid grid-cols-6 border-b border-line">
              <div className="px-4 py-3 bg-surface-2">
                <span className="text-xs font-mono uppercase tracking-wider text-muted">Staff</span>
              </div>
              {DAYS.map((d) => (
                <div key={d} className="px-4 py-3 bg-surface-2 text-center">
                  <span className="text-xs font-mono uppercase tracking-wider text-muted">{d}</span>
                </div>
              ))}
            </div>
            {centerStaff.map((s) => {
              const certBlocked = s.certifications.some((c) => c.status === "expired");
              const bgBlocked = s.backgroundScreening.status === "pending";
              return (
                <div key={s.id} className={`grid grid-cols-6 border-t border-line ${certBlocked || bgBlocked ? "bg-danger-soft" : ""}`}>
                  <div className="px-4 py-4">
                    <p className="font-medium text-sm text-brand">{s.name}</p>
                    <p className="text-xs text-muted">{s.role}</p>
                    <p className="text-xs text-muted">{s.room}</p>
                    {certBlocked && <span className="text-xs bg-danger-soft text-danger px-1.5 py-0.5 rounded mt-1 inline-block">Cert expired</span>}
                    {bgBlocked && <span className="text-xs bg-warning-soft text-warning px-1.5 py-0.5 rounded mt-1 inline-block">BG pending</span>}
                  </div>
                  {DAYS.map((d) => {
                    const shift = s.scheduledShifts.find((sh) => sh.startsWith(d));
                    return (
                      <div key={d} className="px-3 py-4 text-center">
                        {shift ? (
                          <div className={`rounded-ctl px-2 py-1.5 text-xs font-mono ${certBlocked ? "bg-danger-soft text-danger" : "bg-accent-soft text-accent"}`}>
                            {shift.replace(d + " ", "")}
                          </div>
                        ) : (
                          <span className="text-xs text-line">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Ratio coverage check */}
          <div className="bg-surface border border-line rounded-card overflow-hidden">
            <div className="px-6 py-4 border-b border-line">
              <h2 className="font-semibold text-brand">Ratio Coverage Check — Monday</h2>
              <p className="text-xs text-muted mt-0.5">Scheduling is blocked if a ratio-critical certification has lapsed</p>
            </div>
            <div className="divide-y divide-line">
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
                      <p className="font-medium text-brand">{room.name}</p>
                      <p className="text-xs text-muted">{room.childrenPresent} children enrolled · {roomStaff.length} staff scheduled</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {expiredCount > 0 && (
                        <span className="text-xs bg-danger-soft text-danger px-2 py-1 rounded font-mono">{expiredCount} cert lapsed</span>
                      )}
                      {noStaff ? (
                        <span className="font-mono text-xs font-semibold px-3 py-1.5 rounded-ctl bg-danger-soft text-danger">
                          No staff scheduled — ratio cannot be met
                        </span>
                      ) : (
                        <span className={`font-mono text-sm font-bold px-3 py-1 rounded-ctl ${over ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}`}>
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
              <div key={s.id} className={`bg-surface border rounded-card overflow-hidden ${anyIssue ? "border-danger-line" : "border-line"}`}>
                <div className="px-6 py-4 border-b border-line flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent-soft flex items-center justify-center text-sm font-bold text-accent">
                      {s.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-semibold text-brand">{s.name}</p>
                      <p className="text-xs text-muted">{s.role} · {s.room}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${anyIssue ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}`}>
                    {anyIssue ? "Action Required" : "✓ All Clear"}
                  </span>
                </div>
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Background Screening */}
                    <div className={`rounded-card p-4 ${s.backgroundScreening.status === "clear" ? "bg-surface-2" : s.backgroundScreening.status === "pending" ? "bg-warning-soft" : "bg-danger-soft"}`}>
                      <p className="text-xs font-mono uppercase tracking-widest text-muted mb-1">Level 2 Background</p>
                      <p className={`font-semibold text-sm ${s.backgroundScreening.status === "clear" ? "text-brand" : s.backgroundScreening.status === "pending" ? "text-warning" : "text-danger"}`}>
                        {s.backgroundScreening.status === "clear" ? "✓ Clear" : s.backgroundScreening.status === "pending" ? "Pending" : "Expired"}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {s.backgroundScreening.status === "clear" ? `Expires ${s.backgroundScreening.expiresDate}` : "FBI/FDLE · 5-year rescreening"}
                      </p>
                    </div>
                    {s.certifications.map((cert) => (
                      <div key={cert.name} className={`rounded-card p-4 ${cert.status === "valid" ? "bg-surface-2" : cert.status === "expiring-soon" ? "bg-warning-soft" : "bg-danger-soft"}`}>
                        <p className="text-xs font-mono uppercase tracking-widest text-muted mb-1">{cert.name}</p>
                        <p className={`font-semibold text-sm ${cert.status === "valid" ? "text-brand" : cert.status === "expiring-soon" ? "text-warning" : "text-danger"}`}>
                          {cert.status === "valid" ? "✓ Valid" : cert.status === "expiring-soon" ? "⚠ Expires soon" : "✗ EXPIRED"}
                        </p>
                        <p className="text-xs text-muted mt-0.5">Expires {cert.expiry}</p>
                      </div>
                    ))}
                  </div>
                  {anyIssue && (
                    <div className="mt-3 flex gap-2">
                      <button className="text-xs px-3 py-1.5 border border-line rounded-ctl hover:border-accent text-muted hover:text-accent transition-colors">Update certification</button>
                      <button className="text-xs px-3 py-1.5 border border-line rounded-ctl hover:border-accent text-muted hover:text-accent transition-colors">Send reminder</button>
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
