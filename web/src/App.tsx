import { useState } from "react";
import { facilities } from "./data";
import OperatorDashboard from "./pages/OperatorDashboard";
import CenterDashboard from "./pages/CenterDashboard";
import Enrollment from "./pages/Enrollment";
import CheckIn from "./pages/CheckIn";
import DailyLogs from "./pages/DailyLogs";
import Billing from "./pages/Billing";
import Compliance from "./pages/Compliance";
import Staff from "./pages/Staff";
import Messaging from "./pages/Messaging";

type Page =
  | "operator-dashboard"
  | "center-dashboard"
  | "enrollment"
  | "checkin"
  | "logs"
  | "billing"
  | "compliance"
  | "staff"
  | "messaging";

const NAV_ITEMS: { id: Page; label: string; icon: string; group: string }[] = [
  { id: "operator-dashboard", label: "All Centers", icon: "⊞", group: "Overview" },
  { id: "center-dashboard", label: "Center Dashboard", icon: "⌂", group: "Overview" },
  { id: "enrollment", label: "Enrollment", icon: "✎", group: "Operations" },
  { id: "checkin", label: "Check-in / Out", icon: "✓", group: "Operations" },
  { id: "logs", label: "Daily Logs", icon: "≡", group: "Operations" },
  { id: "billing", label: "Billing", icon: "$", group: "Finance" },
  { id: "compliance", label: "Compliance", icon: "◉", group: "Compliance" },
  { id: "staff", label: "Staff & Schedule", icon: "⊙", group: "Compliance" },
  { id: "messaging", label: "Messaging", icon: "✉", group: "Communication" },
];

const GROUPS = ["Overview", "Operations", "Finance", "Compliance", "Communication"];

export default function App() {
  const [page, setPage] = useState<Page>("operator-dashboard");
  const [facilityId, setFacilityId] = useState("f1");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentFacility = facilities.find((f) => f.id === facilityId) ?? facilities[0];
  const isOperatorPage = page === "operator-dashboard";

  const handleNav = (p: string) => setPage(p as Page);
  const handleSelectFacility = (id: string) => setFacilityId(id);

  return (
    <div className="flex h-full bg-[#f3f2ee]">
      {/* Sidebar */}
      <aside className={`flex flex-col bg-[#1e2d4e] transition-all duration-200 ${sidebarOpen ? "w-56" : "w-14"} flex-shrink-0`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-white/10">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-[#0f7173] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            {sidebarOpen && (
              <div>
                <p className="text-white font-bold text-sm leading-none">Nestly</p>
                <p className="text-white/40 text-xs">Childcare Ops</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="ml-auto text-white/40 hover:text-white transition-colors text-sm"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? "‹" : "›"}
          </button>
        </div>

        {/* Facility Switcher */}
        {sidebarOpen && !isOperatorPage && (
          <div className="px-3 py-3 border-b border-white/10">
            <p className="text-white/40 text-xs font-mono uppercase tracking-widest mb-1.5 px-1">Center</p>
            <div className="space-y-0.5">
              {facilities.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFacilityId(f.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${facilityId === f.id ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/8 hover:text-white"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${f.status === "good" ? "bg-[#4ade80]" : "bg-[#fbbf24]"}`} />
                    <span className="truncate">{f.name.split(" ").slice(0, 2).join(" ")}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {GROUPS.map((group) => {
            const items = NAV_ITEMS.filter((n) => n.group === group);
            return (
              <div key={group}>
                {sidebarOpen && (
                  <p className="text-white/30 text-xs font-mono uppercase tracking-widest px-2 mb-1">{group}</p>
                )}
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        page === item.id ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/8 hover:text-white"
                      }`}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
                      {sidebarOpen && <span className="truncate">{item.label}</span>}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-white/10 px-3 py-3">
          <div className={`flex items-center gap-2.5 ${!sidebarOpen ? "justify-center" : ""}`}>
            <div className="w-7 h-7 rounded-full bg-[#0f7173] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">G</div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">Gene Operator</p>
                <p className="text-white/40 text-xs truncate">Owner/Operator</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-[#e2dfd8] flex items-center px-6 flex-shrink-0 gap-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#6b6860]">Sunshine Childcare Group</span>
            {!isOperatorPage && (
              <>
                <span className="text-[#e2dfd8]">/</span>
                <span className="text-[#1e2d4e] font-medium">{currentFacility.name.split(" ").slice(0, 2).join(" ")}</span>
              </>
            )}
            <span className="text-[#e2dfd8]">/</span>
            <span className="text-[#0f7173] font-medium">{NAV_ITEMS.find((n) => n.id === page)?.label}</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Compliance badge */}
            {!isOperatorPage && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                currentFacility.status === "good" ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#fef3c7] text-[#d97706]"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${currentFacility.status === "good" ? "bg-[#16a34a]" : "bg-[#d97706]"}`} />
                {currentFacility.complianceScore}% compliant
              </div>
            )}

            {/* Notification bell */}
            <button className="relative w-8 h-8 flex items-center justify-center text-[#6b6860] hover:text-[#1e2d4e] transition-colors">
              <span>🔔</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#dc2626] rounded-full" />
            </button>

            {/* Sync status */}
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#6b6860] bg-[#f3f2ee] px-2.5 py-1.5 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
              Online
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {page === "operator-dashboard" && (
            <OperatorDashboard onSelectFacility={handleSelectFacility} onNav={handleNav} />
          )}
          {page === "center-dashboard" && (
            <CenterDashboard facilityId={facilityId} onNav={handleNav} />
          )}
          {page === "enrollment" && <Enrollment facilityId={facilityId} />}
          {page === "checkin" && <CheckIn facilityId={facilityId} />}
          {page === "logs" && <DailyLogs facilityId={facilityId} />}
          {page === "billing" && <Billing facilityId={facilityId} />}
          {page === "compliance" && <Compliance facilityId={facilityId} />}
          {page === "staff" && <Staff facilityId={facilityId} />}
          {page === "messaging" && <Messaging facilityId={facilityId} />}
        </main>
      </div>
    </div>
  );
}
