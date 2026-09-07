import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Palette } from "lucide-react";

export type ThemeId = "classic" | "sky" | "sunrise";
export const THEMES: { id: ThemeId; label: string; blurb: string; swatch: [string, string, string] }[] = [
  { id: "classic", label: "Classic", blurb: "Navy sidebar, teal accent", swatch: ["#1e2d4e", "#0f7173", "#f3f2ee"] },
  { id: "sky", label: "Sky", blurb: "Light shell, blue accent", swatch: ["#ffffff", "#1d4ed8", "#0ea5e9"] },
  { id: "sunrise", label: "Sunrise", blurb: "Warm shell, coral accent", swatch: ["#fffdf9", "#0f766e", "#f97316"] },
];

const KEY = "nestly.theme";
const Ctx = createContext<{ theme: ThemeId; setTheme: (t: ThemeId) => void } | null>(null);

function read(): ThemeId {
  try {
    const v = localStorage.getItem(KEY) as ThemeId | null;
    return v && THEMES.some((t) => t.id === v) ? v : "sky";
  } catch { return "sky"; }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(read);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(KEY, theme); } catch { /* private mode */ }
  }, [theme]);
  return <Ctx.Provider value={{ theme, setTheme: setThemeState }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTheme must be used inside <ThemeProvider>");
  return c;
}

/** Segmented picker — used on the login page. */
export function ThemePicker({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  return (
    <div className="inline-flex gap-1 bg-line p-1 rounded-ctl" role="radiogroup" aria-label="Color theme">
      {THEMES.map((t) => (
        <button
          key={t.id}
          role="radio"
          aria-checked={theme === t.id}
          onClick={() => setTheme(t.id)}
          title={t.blurb}
          className={`flex items-center gap-2 px-3 py-1.5 min-h-9 rounded-ctl text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors ${theme === t.id ? "bg-surface text-brand shadow-sm" : "text-muted hover:text-brand"}`}
        >
          <span className="flex -space-x-1" aria-hidden>
            {t.swatch.map((c, i) => <span key={i} className="w-3 h-3 rounded-full border border-black/10" style={{ background: c }} />)}
          </span>
          {!compact && t.label}
        </button>
      ))}
    </div>
  );
}

/** Header button with a popover — available on every screen for the demo. */
export function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = () => setOpen(false);
    window.addEventListener("keydown", onKey); window.addEventListener("click", onClick);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("click", onClick); };
  }, [open]);
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label="Change look" title="Change look" className="w-11 h-11 flex items-center justify-center text-muted hover:text-brand rounded-ctl hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
        <Palette size={20} aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-1 w-56 bg-surface border border-line rounded-card shadow-lg p-1.5 z-50">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted px-2 py-1">Look</p>
          {THEMES.map((t) => (
            <button key={t.id} role="menuitemradio" aria-checked={theme === t.id} onClick={() => { setTheme(t.id); setOpen(false); }} className={`w-full flex items-center gap-3 px-2 py-2 rounded-ctl text-left min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${theme === t.id ? "bg-accent-soft" : "hover:bg-surface-2"}`}>
              <span className="flex -space-x-1" aria-hidden>{t.swatch.map((c, i) => <span key={i} className="w-4 h-4 rounded-full border border-black/10" style={{ background: c }} />)}</span>
              <span><span className="block text-sm font-medium text-ink">{t.label}</span><span className="block text-xs text-muted">{t.blurb}</span></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
