import { facilities } from "../data";

type Props = { onSelectFacility: (id: string) => void; onNav: (page: string) => void };

export default function OperatorDashboard({ onSelectFacility, onNav }: Props) {
  const totalEnrollment = facilities.reduce((s, f) => s + f.enrollment, 0);
  const totalCapacity = facilities.reduce((s, f) => s + f.capacity, 0);
  const totalRevenue = facilities.reduce((s, f) => s + f.revenue, 0);
  const avgCompliance = Math.round(facilities.reduce((s, f) => s + f.complianceScore, 0) / facilities.length);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-sm font-mono text-muted uppercase tracking-widest mb-1">Operator View</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand">Sunshine Childcare Group</h1>
        <p className="text-muted mt-1">All 3 centers · Florida · Flat per-center billing</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {[
          { label: "Total Enrollment", value: `${totalEnrollment}`, sub: `of ${totalCapacity} seats`, color: "text-brand" },
          { label: "Monthly Revenue", value: `$${totalRevenue.toLocaleString()}`, sub: "across all centers", color: "text-accent" },
          { label: "Avg Compliance", value: `${avgCompliance}%`, sub: "Florida rule pack", color: avgCompliance >= 95 ? "text-success" : "text-warning" },
          { label: "Open Incidents", value: "4", sub: "2 require signatures", color: "text-danger" },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-line rounded-card p-5">
            <p className="text-xs font-mono uppercase tracking-widest text-muted mb-2">{k.label}</p>
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Centers — cards */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-brand">Your centers</h2>
          <span className="text-xs font-mono text-muted">LIVE · Updated 8:47 AM</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {facilities.map((f) => {
            const occupancy = Math.round((f.enrollment / f.capacity) * 100);
            const over = f.rooms.filter((r) => r.staffCount > 0 && r.childrenPresent / r.staffCount > r.ratioLimit).length;
            const pill = f.status === "good" ? "bg-success-soft text-success" : f.status === "warning" ? "bg-warning-soft text-warning" : "bg-danger-soft text-danger";
            const dot = f.status === "good" ? "bg-success" : f.status === "warning" ? "bg-warning" : "bg-danger";
            return (
              <button
                key={f.id}
                onClick={() => { onSelectFacility(f.id); onNav("center-dashboard"); }}
                className="text-left bg-surface border border-line rounded-[calc(var(--t-radius)+0.25rem)] p-5 hover:border-accent hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <p className="font-bold text-lg text-brand truncate">{f.name.replace(" Center", "")}</p>
                    <p className="text-xs text-muted">{f.city}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${pill}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    {f.complianceScore}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-surface-2 rounded-card p-3"><p className="text-[11px] font-mono uppercase tracking-wider text-muted">Enrolled</p><p className="text-xl font-bold text-brand">{f.enrollment}<span className="text-xs font-normal text-muted">/{f.capacity}</span></p></div>
                  <div className="bg-surface-2 rounded-card p-3"><p className="text-[11px] font-mono uppercase tracking-wider text-muted">Revenue</p><p className="text-xl font-bold text-accent">${Math.round(f.revenue / 1000)}k</p></div>
                  <div className="bg-surface-2 rounded-card p-3"><p className="text-[11px] font-mono uppercase tracking-wider text-muted">Rooms</p><p className="text-xl font-bold text-brand">{f.rooms.length}{over > 0 && <span className="text-xs font-semibold text-danger ml-1">⚠{over}</span>}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-line rounded-full h-2 overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${occupancy}%` }} /></div>
                  <span className="text-xs font-mono text-muted">{occupancy}% full</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>


      {/* Compliance Alerts + Room Ratios side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-white border border-line rounded-card overflow-hidden">
          <div className="px-6 py-4 border-b border-line">
            <h2 className="font-semibold text-brand">Compliance Alerts</h2>
          </div>
          <div className="divide-y divide-line">
            {[
              { center: "Coral Springs", issue: "Rashida Okafor — CPR cert expires in 20 days", severity: "warning" },
              { center: "Coral Springs", issue: "Gloria Sánchez — CPR cert EXPIRED", severity: "alert" },
              { center: "Coral Springs", issue: "James Williams — DH 680 immunization missing", severity: "alert" },
              { center: "Boca Raton", issue: "Marcus Webb — Level 2 background screening pending", severity: "warning" },
              { center: "Boca Raton", issue: "Sofia Reyes — guardian signature pending on incident", severity: "warning" },
            ].map((a, i) => (
              <div key={i} className="px-6 py-3.5 flex items-start gap-3">
                <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${a.severity === "alert" ? "bg-danger" : "bg-warning"}`} />
                <div>
                  <p className="text-xs font-mono text-muted mb-0.5">{a.center}</p>
                  <p className="text-sm text-ink">{a.issue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-line rounded-card overflow-hidden">
          <div className="px-6 py-4 border-b border-line">
            <h2 className="font-semibold text-brand">Live Ratios — All Centers</h2>
          </div>
          <div className="divide-y divide-line">
            {facilities.flatMap((f) =>
              f.rooms.map((r) => {
                const ratio = r.staffCount > 0 ? r.childrenPresent / r.staffCount : Infinity;
                const over = ratio > r.ratioLimit;
                return (
                  <div key={r.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-brand">{r.name}</p>
                      <p className="text-xs text-muted">{f.name.split(" ")[0]}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted">{r.childrenPresent} children / {r.staffCount} staff</span>
                      <span className={`font-mono text-sm font-semibold px-2 py-0.5 rounded ${over ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}`}>
                        1:{Math.round(ratio * 10) / 10}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
