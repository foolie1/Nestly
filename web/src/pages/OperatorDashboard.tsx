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
        <p className="text-sm font-mono text-[#6b6860] uppercase tracking-widest mb-1">Operator View</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1e2d4e]">Sunshine Childcare Group</h1>
        <p className="text-[#6b6860] mt-1">All 3 centers · Florida · Flat per-center billing</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {[
          { label: "Total Enrollment", value: `${totalEnrollment}`, sub: `of ${totalCapacity} seats`, color: "text-[#1e2d4e]" },
          { label: "Monthly Revenue", value: `$${totalRevenue.toLocaleString()}`, sub: "across all centers", color: "text-[#0f7173]" },
          { label: "Avg Compliance", value: `${avgCompliance}%`, sub: "Florida rule pack", color: avgCompliance >= 95 ? "text-[#16a34a]" : "text-[#d97706]" },
          { label: "Open Incidents", value: "4", sub: "2 require signatures", color: "text-[#dc2626]" },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-[#e2dfd8] rounded-xl p-5">
            <p className="text-xs font-mono uppercase tracking-widest text-[#6b6860] mb-2">{k.label}</p>
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-[#6b6860] mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Centers Table */}
      <div className="bg-white border border-[#e2dfd8] rounded-xl overflow-hidden mb-8">
        <div className="px-4 sm:px-6 py-4 border-b border-[#e2dfd8] flex items-center justify-between">
          <h2 className="font-semibold text-[#1e2d4e]">Center Overview</h2>
          <span className="text-xs font-mono text-[#6b6860]">LIVE · Updated 8:47 AM</span>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[720px]">
          <thead>
            <tr className="bg-[#f3f2ee] text-xs font-mono uppercase tracking-wider text-[#6b6860]">
              <th className="px-6 py-3 text-left">Center</th>
              <th className="px-6 py-3 text-right">Enrolled</th>
              <th className="px-6 py-3 text-right">Capacity</th>
              <th className="px-6 py-3 text-right">Occupancy</th>
              <th className="px-6 py-3 text-right">Revenue</th>
              <th className="px-6 py-3 text-center">Compliance</th>
              <th className="px-6 py-3 text-center">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((f, i) => {
              const occupancy = Math.round((f.enrollment / f.capacity) * 100);
              return (
                <tr key={f.id} className={`border-t border-[#e2dfd8] hover:bg-[#f9f8f5] transition-colors ${i % 2 === 0 ? "" : ""}`}>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[#1e2d4e]">{f.name}</p>
                    <p className="text-xs text-[#6b6860]">{f.city}</p>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm">{f.enrollment}</td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-[#6b6860]">{f.capacity}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 bg-[#e2dfd8] rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-[#0f7173] rounded-full" style={{ width: `${occupancy}%` }} />
                      </div>
                      <span className="font-mono text-sm">{occupancy}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm">${f.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-mono text-sm font-medium ${f.status === "good" ? "text-[#16a34a]" : f.status === "warning" ? "text-[#d97706]" : "text-[#dc2626]"}`}>
                      {f.complianceScore}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      f.status === "good" ? "bg-[#dcfce7] text-[#16a34a]" :
                      f.status === "warning" ? "bg-[#fef3c7] text-[#d97706]" : "bg-[#fee2e2] text-[#dc2626]"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        f.status === "good" ? "bg-[#16a34a]" : f.status === "warning" ? "bg-[#d97706]" : "bg-[#dc2626]"
                      }`} />
                      {f.status === "good" ? "Compliant" : f.status === "warning" ? "Attention" : "Alert"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => { onSelectFacility(f.id); onNav("center-dashboard"); }}
                      className="text-xs font-medium text-[#0f7173] hover:text-[#1e2d4e] transition-colors"
                    >
                      View →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>

      {/* Compliance Alerts + Room Ratios side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-white border border-[#e2dfd8] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e2dfd8]">
            <h2 className="font-semibold text-[#1e2d4e]">Compliance Alerts</h2>
          </div>
          <div className="divide-y divide-[#e2dfd8]">
            {[
              { center: "Coral Springs", issue: "Rashida Okafor — CPR cert expires in 20 days", severity: "warning" },
              { center: "Coral Springs", issue: "Gloria Sánchez — CPR cert EXPIRED", severity: "alert" },
              { center: "Coral Springs", issue: "James Williams — DH 680 immunization missing", severity: "alert" },
              { center: "Boca Raton", issue: "Marcus Webb — Level 2 background screening pending", severity: "warning" },
              { center: "Boca Raton", issue: "Sofia Reyes — guardian signature pending on incident", severity: "warning" },
            ].map((a, i) => (
              <div key={i} className="px-6 py-3.5 flex items-start gap-3">
                <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${a.severity === "alert" ? "bg-[#dc2626]" : "bg-[#d97706]"}`} />
                <div>
                  <p className="text-xs font-mono text-[#6b6860] mb-0.5">{a.center}</p>
                  <p className="text-sm text-[#1a1a1a]">{a.issue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#e2dfd8] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e2dfd8]">
            <h2 className="font-semibold text-[#1e2d4e]">Live Ratios — All Centers</h2>
          </div>
          <div className="divide-y divide-[#e2dfd8]">
            {facilities.flatMap((f) =>
              f.rooms.map((r) => {
                const ratio = r.staffCount > 0 ? r.childrenPresent / r.staffCount : Infinity;
                const over = ratio > r.ratioLimit;
                return (
                  <div key={r.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#1e2d4e]">{r.name}</p>
                      <p className="text-xs text-[#6b6860]">{f.name.split(" ")[0]}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-[#6b6860]">{r.childrenPresent} children / {r.staffCount} staff</span>
                      <span className={`font-mono text-sm font-semibold px-2 py-0.5 rounded ${over ? "bg-[#fee2e2] text-[#dc2626]" : "bg-[#dcfce7] text-[#16a34a]"}`}>
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
