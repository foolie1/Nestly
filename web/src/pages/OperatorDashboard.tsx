import { facilities, staff } from "../data";
import { facilityEnrollment, roomOccupancy, useRoster } from "../roster";
import { useIncidents } from "../incidents";
import { collections, useBilling } from "../billing";
import { Collections } from "../components/Collections";

type Props = { onSelectFacility: (id: string) => void; onNav: (page: string) => void };

export default function OperatorDashboard({ onSelectFacility, onNav }: Props) {
  const { roster } = useRoster();
  const { incidents } = useIncidents();
  const enrollmentAt = (id: string) => facilityEnrollment(id, roster);
  const openIncidents = incidents.filter((i) => !i.guardianSigned);

  const shortName = (id: string) => (facilities.find((f) => f.id === id)?.name ?? "").replace(" Center", "");
  /**
   * Everything currently out of compliance, gathered from the real records
   * rather than a fixed list — so fixing one makes it disappear.
   */
  const alerts = [
    ...roster
      .filter((c) => c.immunizationStatus !== "current")
      .map((c) => ({
        center: shortName(c.facilityId),
        issue: `${c.name} — DH 680 immunization ${c.immunizationStatus === "missing" ? "missing" : "expires soon"}`,
        severity: c.immunizationStatus === "missing" ? "alert" : "warning",
      })),
    ...staff.flatMap((s) =>
      s.certifications
        .filter((c) => c.status !== "valid")
        .map((c) => ({
          center: shortName(s.facilityId),
          issue: `${s.name} — ${c.name} ${c.status === "expired" ? "EXPIRED" : `expires ${c.expiry}`}`,
          severity: c.status === "expired" ? "alert" : "warning",
        })),
    ),
    ...staff
      .filter((s) => s.backgroundScreening.status !== "clear")
      .map((s) => ({
        center: shortName(s.facilityId),
        issue: `${s.name} — Level 2 background screening ${s.backgroundScreening.status}`,
        severity: "warning",
      })),
    ...openIncidents.map((i) => ({
      center: shortName(i.facilityId),
      issue: `${i.childName} — guardian signature pending on ${i.type.toLowerCase()}`,
      severity: "warning",
    })),
  ].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "alert" ? -1 : 1));
  const totalEnrollment = facilities.reduce((s, f) => s + enrollmentAt(f.id), 0);
  const totalCapacity = facilities.reduce((s, f) => s + f.capacity, 0);
  // Revenue comes from when payments actually arrived, not a stored monthly figure.
  const { payments } = useBilling();
  const weekAll = collections(payments, { period: "week", count: 2 });
  const monthFor = (id?: string) => collections(payments, { period: "month", count: 1, facilityId: id })[0].total;
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
          { label: "Collected this week", value: `$${weekAll[1].total.toLocaleString()}`, sub: `$${monthFor().toLocaleString()} so far this month`, color: "text-accent" },
          { label: "Avg Compliance", value: `${avgCompliance}%`, sub: "Florida rule pack", color: avgCompliance >= 95 ? "text-success" : "text-warning" },
          { label: "Open Incidents", value: `${incidents.length}`, sub: `${openIncidents.length} require signatures`, color: "text-danger" },
        ].map((k) => (
          <div key={k.label} className="bg-surface border border-line rounded-card p-5">
            <p className="text-xs font-mono uppercase tracking-widest text-muted mb-2">{k.label}</p>
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Money in across every center, by week or month */}
      <div className="mb-8">
        <Collections payments={payments} heading="Tuition collected · all centers" />
      </div>

      {/* Centers — cards */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-brand">Your centers</h2>
          <span className="text-xs font-mono text-muted">Live</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {facilities.map((f) => {
            const enrolled = enrollmentAt(f.id);
            const occupancy = Math.round((enrolled / f.capacity) * 100);
            const over = f.rooms.filter((r) => r.staffCount > 0 && roomOccupancy(f.id, r.name, roster).present / r.staffCount > r.ratioLimit).length;
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
                  <div className="bg-surface-2 rounded-card p-3"><p className="text-[11px] font-mono uppercase tracking-wider text-muted">Enrolled</p><p className="text-xl font-bold text-brand">{enrolled}<span className="text-xs font-normal text-muted">/{f.capacity}</span></p></div>
                  <div className="bg-surface-2 rounded-card p-3"><p className="text-[11px] font-mono uppercase tracking-wider text-muted">This month</p><p className="text-xl font-bold text-accent">${(monthFor(f.id) / 1000).toFixed(1).replace(/\.0$/, "")}k</p></div>
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
        <div className="bg-surface border border-line rounded-card overflow-hidden">
          <div className="px-6 py-4 border-b border-line">
            <h2 className="font-semibold text-brand">Compliance Alerts</h2>
          </div>
          <div className="divide-y divide-line">
            {alerts.length === 0 && <p className="px-6 py-8 text-center text-sm text-muted">Nothing needs attention right now.</p>}
            {alerts.map((a, i) => (
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

        <div className="bg-surface border border-line rounded-card overflow-hidden">
          <div className="px-6 py-4 border-b border-line">
            <h2 className="font-semibold text-brand">Live Ratios — All Centers</h2>
          </div>
          <div className="divide-y divide-line">
            {facilities.flatMap((f) =>
              f.rooms.map((r) => {
                const present = roomOccupancy(f.id, r.name, roster).present;
                const ratio = r.staffCount > 0 ? present / r.staffCount : Infinity;
                const over = ratio > r.ratioLimit;
                return (
                  <div key={r.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-brand">{r.name}</p>
                      <p className="text-xs text-muted">{f.name.split(" ")[0]}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted">{present} children / {r.staffCount} staff</span>
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
