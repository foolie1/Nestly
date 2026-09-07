import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  FolderHeart,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  UserPlus,
  Users,
  Wifi,
  X,
  type LucideIcon,
} from "lucide-react";
import { facilities, type Role } from "./data";
import { useAuth } from "./auth";
import { ThemeMenu } from "./theme";
import Login from "./pages/Login";
import OperatorDashboard from "./pages/OperatorDashboard";
import CenterDashboard from "./pages/CenterDashboard";
import Enrollment from "./pages/Enrollment";
import CheckIn from "./pages/CheckIn";
import DailyLogs from "./pages/DailyLogs";
import Billing from "./pages/Billing";
import Compliance from "./pages/Compliance";
import Staff from "./pages/Staff";
import Messaging from "./pages/Messaging";
import MyRoom from "./pages/staff/MyRoom";
import ParentHome from "./pages/parent/ParentHome";
import ParentMessages from "./pages/parent/ParentMessages";
import ParentBilling from "./pages/parent/ParentBilling";
import ParentFamily from "./pages/parent/ParentFamily";

export type Page =
  | "operator-dashboard"
  | "center-dashboard"
  | "enrollment"
  | "checkin"
  | "logs"
  | "billing"
  | "compliance"
  | "staff"
  | "messaging"
  | "my-room"
  | "p-home"
  | "p-messages"
  | "p-billing"
  | "p-family";

type NavItem = { id: Page; label: string; Icon: LucideIcon; group: string };

const ADMIN_NAV: NavItem[] = [
    { id: "operator-dashboard", label: "All Centers", Icon: LayoutGrid, group: "Overview" },
    { id: "center-dashboard", label: "Center Dashboard", Icon: Home, group: "Overview" },
    { id: "enrollment", label: "Enrollment", Icon: UserPlus, group: "Operations" },
    { id: "checkin", label: "Check-in / Out", Icon: CalendarCheck, group: "Operations" },
    { id: "logs", label: "Daily Logs", Icon: ClipboardList, group: "Operations" },
    { id: "billing", label: "Billing", Icon: CreditCard, group: "Finance" },
    { id: "compliance", label: "Compliance", Icon: ShieldCheck, group: "Compliance" },
    { id: "staff", label: "Staff & Schedule", Icon: Users, group: "Compliance" },
    { id: "messaging", label: "Messaging", Icon: MessageSquare, group: "Communication" },
];

const NAV: Record<Role, NavItem[]> = {
  owner: ADMIN_NAV,
  /** Directors run one center: no cross-center page, no facility switcher. */
  director: ADMIN_NAV.filter((n) => n.id !== "operator-dashboard"),
  /** Office admins: enrollment, check-in, logs, billing, messaging — no compliance/staff scheduling. */
  office_admin: ADMIN_NAV.filter((n) => !["operator-dashboard", "compliance", "staff"].includes(n.id)),
  staff: [
    { id: "my-room", label: "My Room", Icon: Home, group: "Today" },
    { id: "checkin", label: "Check-in / Out", Icon: CalendarCheck, group: "Today" },
    { id: "logs", label: "Daily Logs", Icon: ClipboardList, group: "Today" },
    { id: "messaging", label: "Messages", Icon: MessageSquare, group: "Families" },
  ],
  parent: [
    { id: "p-home", label: "Home", Icon: Home, group: "" },
    { id: "p-messages", label: "Messages", Icon: MessageSquare, group: "" },
    { id: "p-billing", label: "Billing", Icon: CreditCard, group: "" },
    { id: "p-family", label: "Family", Icon: FolderHeart, group: "" },
  ],
};

const HOME: Record<Role, Page> = { owner: "operator-dashboard", director: "center-dashboard", office_admin: "center-dashboard", staff: "my-room", parent: "p-home" };

export default function App() {
  const { user } = useAuth();
  if (!user) return <Login />;
  return <Shell key={user.id} role={user.role} />;
}

function Shell({ role }: { role: Role }) {
  const { user, signOut } = useAuth();
  const [page, setPage] = useState<Page>(HOME[role]);
  const [facilityId, setFacilityId] = useState(user?.facilityId ?? "f1");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const nav = NAV[role];
  const groups = [...new Set(nav.map((n) => n.group))];
  const currentFacility = facilities.find((f) => f.id === facilityId) ?? facilities[0];
  const isOperatorPage = page === "operator-dashboard";
  const isParent = role === "parent";
  const isAdmin = role === "owner" || role === "director" || role === "office_admin";

  /**
   * Screen history. Every in-app navigation also pushes onto the browser's
   * history, so the phone's back gesture and the browser back button behave
   * the same as the in-app arrow. popstate is what actually changes the page,
   * which keeps the two stacks from drifting apart.
   */
  const backStack = useRef<Page[]>([]);
  const [canGoBack, setCanGoBack] = useState(false);

  const handleNav = (p: string) => {
    const next = p as Page;
    setDrawerOpen(false);
    if (next === page) return;
    backStack.current = [...backStack.current, page];
    setCanGoBack(true);
    setPage(next);
    window.history.pushState({ nestly: true }, "");
  };

  const goBack = () => {
    if (backStack.current.length === 0) return;
    window.history.back();
  };

  useEffect(() => {
    const onPop = () => {
      const stack = backStack.current;
      if (stack.length === 0) return;
      const previous = stack[stack.length - 1]!;
      backStack.current = stack.slice(0, -1);
      setCanGoBack(backStack.current.length > 0);
      setDrawerOpen(false);
      setPage(previous);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const handleSelectFacility = (id: string) => setFacilityId(id);

  // Close the mobile drawer on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const content = (
    <>
      {page === "operator-dashboard" && <OperatorDashboard onSelectFacility={handleSelectFacility} onNav={handleNav} />}
      {page === "center-dashboard" && <CenterDashboard facilityId={facilityId} onNav={handleNav} />}
      {page === "enrollment" && <Enrollment facilityId={facilityId} />}
      {page === "checkin" && <CheckIn facilityId={facilityId} roomFilter={user?.room} />}
      {page === "logs" && <DailyLogs facilityId={facilityId} roomFilter={user?.room} />}
      {page === "billing" && <Billing facilityId={facilityId} />}
      {page === "compliance" && <Compliance facilityId={facilityId} />}
      {page === "staff" && <Staff facilityId={facilityId} />}
      {page === "messaging" && <Messaging facilityId={facilityId} />}
      {page === "my-room" && <MyRoom onNav={handleNav} />}
      {page === "p-home" && <ParentHome onNav={handleNav} />}
      {page === "p-messages" && <ParentMessages />}
      {page === "p-billing" && <ParentBilling />}
      {page === "p-family" && <ParentFamily />}
    </>
  );

  const sidebarInner = (expanded: boolean) => (
    <>
      {/* Facility switcher (admin only) */}
      {expanded && role === "owner" && !isOperatorPage && (
        <div className="px-3 py-3 border-b border-side-line">
          <p className="text-side-faint text-xs font-mono uppercase tracking-widest mb-1.5 px-1">Center</p>
          <div className="space-y-0.5">
            {facilities.map((f) => (
              <button
                key={f.id}
                onClick={() => setFacilityId(f.id)}
                aria-current={facilityId === f.id ? "true" : undefined}
                className={`w-full text-left px-2.5 py-2.5 rounded-ctl text-sm font-medium transition-colors min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${facilityId === f.id ? "bg-side-active text-side-fg" : "text-side-muted hover:bg-side-hover hover:text-side-fg"}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${f.status === "good" ? "bg-success" : "bg-warning"}`} />
                  <span className="truncate">{f.name.split(" ").slice(0, 2).join(" ")}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {groups.map((group) => (
          <div key={group || "main"}>
            {expanded && group && <p className="text-side-faint text-xs font-mono uppercase tracking-widest px-2 mb-1">{group}</p>}
            <div className="space-y-0.5">
              {nav.filter((n) => n.group === group).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  aria-current={page === item.id ? "page" : undefined}
                  className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-ctl text-sm font-medium transition-colors min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${page === item.id ? "bg-side-active text-side-fg" : "text-side-muted hover:bg-side-hover hover:text-side-fg"}`}
                  title={!expanded ? item.label : undefined}
                >
                  <item.Icon size={20} className="flex-shrink-0" aria-hidden />
                  {expanded && <span className="truncate">{item.label}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-side-line px-3 py-3">
        <div className={`flex items-center gap-2.5 ${!expanded ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-side-logo flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{user?.initials}</div>
          {expanded && (
            <div className="flex-1 min-w-0">
              <p className="text-side-fg text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-side-faint text-xs truncate">{user?.title}</p>
            </div>
          )}
          <button
            onClick={signOut}
            aria-label="Sign out"
            title="Sign out"
            className="w-9 h-9 flex items-center justify-center rounded-ctl text-side-faint hover:text-side-fg hover:bg-side-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent flex-shrink-0"
          >
            <LogOut size={18} aria-hidden />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-full bg-page">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col bg-side border-r border-side-line transition-all duration-200 ${sidebarOpen ? "w-60" : "w-16"} flex-shrink-0`}>
        <div className="h-16 flex items-center px-3 border-b border-side-line gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0 pl-1">
            <div className="w-8 h-8 rounded-ctl bg-side-logo flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-side-fg font-bold text-sm leading-none">Nestly</p>
                <p className="text-side-faint text-xs truncate">{isParent ? "Family" : "Childcare Ops"}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="w-9 h-9 flex items-center justify-center text-side-faint hover:text-side-fg rounded-ctl hover:bg-side-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent flex-shrink-0"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <PanelLeftClose size={18} aria-hidden /> : <PanelLeftOpen size={18} aria-hidden />}
          </button>
        </div>
        {sidebarInner(sidebarOpen)}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] bg-side flex flex-col h-full shadow-2xl">
            <div className="h-16 flex items-center px-4 border-b border-side-line gap-3">
              <div className="w-8 h-8 rounded-ctl bg-side-logo flex items-center justify-center"><span className="text-white font-bold text-sm">N</span></div>
              <p className="text-side-fg font-bold flex-1">Nestly</p>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="w-10 h-10 flex items-center justify-center text-side-muted hover:text-side-fg rounded-ctl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><X size={20} aria-hidden /></button>
            </div>
            {sidebarInner(true)}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-line flex items-center px-3 sm:px-6 flex-shrink-0 gap-2 sm:gap-4">
          <button onClick={() => setDrawerOpen(true)} aria-label="Open menu" className="md:hidden w-11 h-11 -ml-1 flex items-center justify-center text-brand rounded-ctl hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <Menu size={22} aria-hidden />
          </button>

          <button
            onClick={goBack}
            disabled={!canGoBack}
            aria-label="Go back to the previous screen"
            title="Back"
            className="w-11 h-11 flex items-center justify-center rounded-ctl text-muted enabled:hover:text-brand enabled:hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent flex-shrink-0 transition-colors"
          >
            <ArrowLeft size={20} aria-hidden />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm min-w-0">
            {isParent ? (
              <span className="text-brand font-semibold truncate">{currentFacility.name}</span>
            ) : (
              <>
                <span className="text-muted hidden lg:inline">Sunshine Childcare Group</span>
                {!isOperatorPage && (
                  <>
                    <span className="text-line hidden lg:inline">/</span>
                    <span className="text-brand font-medium truncate">{currentFacility.name.split(" ").slice(0, 2).join(" ")}</span>
                  </>
                )}
                <span className={`text-line ${isOperatorPage ? "hidden lg:inline" : ""}`}>/</span>
                <span className="text-accent font-medium truncate">{nav.find((n) => n.id === page)?.label}</span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {isAdmin && !isOperatorPage && (
              <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${currentFacility.status === "good" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${currentFacility.status === "good" ? "bg-success" : "bg-warning"}`} />
                {currentFacility.complianceScore}% compliant
              </div>
            )}
            <ThemeMenu />
            <button aria-label="Notifications, 1 unread" className="relative w-11 h-11 flex items-center justify-center text-muted hover:text-brand rounded-ctl hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <Bell size={20} aria-hidden />
              <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full" />
            </button>
            {!isParent && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-muted bg-surface-2 px-2.5 py-1.5 rounded-ctl" title="Sync status">
                <Wifi size={14} className="text-success" aria-hidden /> Online
              </div>
            )}
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto ${isParent ? "pb-20 md:pb-0" : ""}`}>{content}</main>

        {/* Parent: mobile bottom tab bar */}
        {isParent && (
          <nav aria-label="Primary" className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-line flex z-40 pb-[env(safe-area-inset-bottom)]">
            {nav.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                aria-current={page === item.id ? "page" : undefined}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-16 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${page === item.id ? "text-accent" : "text-muted"}`}
              >
                <item.Icon size={22} aria-hidden strokeWidth={page === item.id ? 2.5 : 2} />
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

