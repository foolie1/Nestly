import { useState } from "react";
import {
  ArrowLeft,
  Baby,
  Building2,
  Check,
  Delete,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Sparkles,
  Check as CheckIcon,
} from "lucide-react";
import { ADMIN_ROLES, demoUsers, facilities, type LoginRole as Role, type Role as AppRole } from "../data";
import { loginRoleOf, useAuth } from "../auth";

const ROLES: { id: Role; label: string; blurb: string; Icon: typeof Baby; accent: string }[] = [
  { id: "parent", label: "Parent", blurb: "See your child's day, pay tuition, message teachers", Icon: Baby, accent: "bg-[#e8f4f4] text-[#0f7173]" },
  { id: "staff", label: "Staff", blurb: "Check kids in, log activities, message families", Icon: GraduationCap, accent: "bg-[#fef3c7] text-[#d97706]" },
  { id: "admin", label: "Owner / Admin", blurb: "Owners, center directors, and office admins", Icon: Building2, accent: "bg-[#e0e7ff] text-[#1e2d4e]" },
];

const inputCls =
  "w-full min-h-11 border border-[#e2dfd8] rounded-xl px-3.5 py-2.5 text-base bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173] focus-visible:border-[#0f7173] transition-shadow";
const labelCls = "text-xs font-mono uppercase tracking-widest text-[#6b6860] block mb-1.5";
const primaryBtn =
  "w-full min-h-12 rounded-xl text-base font-semibold text-white bg-[#1e2d4e] hover:bg-[#2a3f6b] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0f7173] transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export default function Login() {
  const [role, setRole] = useState<Role | null>(null);

  return (
    <div className="min-h-full bg-[#f3f2ee] flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8 sm:mb-10 justify-center">
            <div className="w-11 h-11 rounded-2xl bg-[#0f7173] flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <div>
              <p className="text-[#1e2d4e] font-bold text-xl leading-none">Nestly</p>
              <p className="text-[#6b6860] text-sm">Sunshine Childcare Group</p>
            </div>
          </div>

          {role === null ? <RolePicker onPick={setRole} /> : <RoleForm role={role} onBack={() => setRole(null)} />}
        </div>
      </div>
      <p className="text-center text-xs text-[#6b6860] pb-5 px-4">
        Demo environment · no real data · WCAG 2.2 AA target
      </p>
    </div>
  );
}

function RolePicker({ onPick }: { onPick: (r: Role) => void }) {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-[#1e2d4e] text-center">Welcome</h1>
      <p className="text-[#6b6860] text-center mt-2 mb-8">Who's signing in today?</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ROLES.map(({ id, label, blurb, Icon, accent }) => (
          <button
            key={id}
            onClick={() => onPick(id)}
            className="group bg-white border-2 border-[#e2dfd8] rounded-2xl p-6 text-left hover:border-[#0f7173] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0f7173] transition-all min-h-[140px] flex md:flex-col items-center md:items-start gap-4"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${accent}`}>
              <Icon size={28} strokeWidth={2} aria-hidden />
            </div>
            <div>
              <p className="font-bold text-lg text-[#1e2d4e] group-hover:text-[#0f7173] transition-colors">{label}</p>
              <p className="text-sm text-[#6b6860] mt-1">{blurb}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function RoleForm({ role, onBack }: { role: Role; onBack: () => void }) {
  const meta = ROLES.find((r) => r.id === role)!;
  const { signInAs } = useAuth();
  const demos = demoUsers.filter((u) => loginRoleOf(u.role) === role);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
      <div className="lg:col-span-3 bg-white border border-[#e2dfd8] rounded-2xl p-6 sm:p-8 shadow-sm">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-[#6b6860] hover:text-[#1e2d4e] min-h-11 -ml-1 px-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173]"
        >
          <ArrowLeft size={16} aria-hidden /> Choose a different role
        </button>
        <div className="flex items-center gap-3 mt-3 mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.accent}`}>
            <meta.Icon size={20} aria-hidden />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e2d4e]">{meta.label} sign in</h1>
        </div>

        {role === "admin" && <AdminForm />}
        {role === "staff" && <StaffForm />}
        {role === "parent" && <ParentForm />}
      </div>

      {/* Demo accounts */}
      <div className="lg:col-span-2 bg-[#1e2d4e] text-white rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-[#fbbf24]" aria-hidden />
          <p className="font-semibold">Try a demo account</p>
        </div>
        <p className="text-white/60 text-sm mb-4">One click, no password needed.</p>
        <div className="space-y-2">
          {demos.map((u) => (
            <button
              key={u.id}
              onClick={() => signInAs(u.id)}
              className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-3 text-left min-h-14 focus:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors"
            >
              <span className="w-9 h-9 rounded-full bg-[#0f7173] flex items-center justify-center text-sm font-bold flex-shrink-0">{u.initials}</span>
              <span className="min-w-0">
                <span className="block font-medium truncate">{u.name}</span>
                <span className="block text-xs text-white/60 truncate">{u.title}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="mt-5 pt-4 border-t border-white/10 text-xs text-white/50 space-y-1">
          <p className="font-mono">Or type it in:</p>
          {demos.slice(0, 1).map((u) => (
            <p key={u.id} className="font-mono break-all">
              {u.email} · {role === "staff" ? `PIN ${u.secret}` : u.secret}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Owner / Admin: pick your role + center, then work email + password ──
function AdminForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subRole, setSubRole] = useState<AppRole>("owner");
  const [facilityId, setFacilityId] = useState(facilities[0].id);
  const needsCenter = !ADMIN_ROLES.find((r) => r.id === subRole)?.allCenters;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const r = signIn(email, pw, "admin", { role: subRole, facilityId: needsCenter ? facilityId : undefined });
        if (!r.ok) setError(r.error);
      }}
      className="space-y-4"
      noValidate
    >
      <div>
        <p className={labelCls}>I am the…</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Your role">
          {ADMIN_ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={subRole === r.id}
              onClick={() => setSubRole(r.id)}
              className={`text-left border-2 rounded-xl p-3 min-h-[72px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173] transition-colors ${subRole === r.id ? "border-[#0f7173] bg-[#e8f4f4]" : "border-[#e2dfd8] hover:border-[#c9c5bc]"}`}
            >
              <span className="flex items-center gap-1.5 font-semibold text-sm text-[#1e2d4e]">
                {subRole === r.id && <CheckIcon size={14} className="text-[#0f7173]" aria-hidden />}
                {r.label}
              </span>
              <span className="block text-xs text-[#6b6860] mt-0.5 leading-snug">{r.blurb}</span>
            </button>
          ))}
        </div>
      </div>
      {needsCenter && (
        <div>
          <label htmlFor="admin-center" className={labelCls}>Your center</label>
          <select id="admin-center" value={facilityId} onChange={(e) => setFacilityId(e.target.value)} className={inputCls}>
            {facilities.map((f) => <option key={f.id} value={f.id}>{f.name} — {f.city}</option>)}
          </select>
        </div>
      )}
      <div>
        <label htmlFor="admin-email" className={labelCls}>Work email</label>
        <input id="admin-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourcenter.com" className={inputCls} />
      </div>
      <div>
        <label htmlFor="admin-pw" className={labelCls}>Password</label>
        <div className="relative">
          <input id="admin-pw" type={show ? "text" : "password"} autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} className={`${inputCls} pr-12`} />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[#6b6860] hover:text-[#1e2d4e] rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173]">
            {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-[#6b6860] cursor-pointer min-h-11">
          <input type="checkbox" className="w-4 h-4 accent-[#0f7173]" /> Keep me signed in
        </label>
        <button type="button" className="text-[#0f7173] hover:underline min-h-11 px-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173]">Forgot password?</button>
      </div>
      {error && <ErrorBox msg={error} />}
      <button type="submit" className={primaryBtn} disabled={!email || !pw}>Sign in</button>
      <p className="text-xs text-[#6b6860] text-center">Director and office admin accounts are created by the organization's owner. Your role and center are confirmed against your account when a real backend is connected.</p>
    </form>
  );
}

// ─── Staff: email + 4-digit PIN (kiosk-friendly keypad) ──────
function StaffForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const push = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(null);
    if (next.length === 4) {
      const r = signIn(email, next, "staff");
      if (!r.ok) { setError(r.error); setTimeout(() => setPin(""), 350); }
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="staff-email" className={labelCls}>Staff email</label>
        <input id="staff-email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} placeholder="you@yourcenter.com" className={inputCls} />
      </div>
      <div>
        <p className={labelCls}>4-digit PIN</p>
        <div className="flex gap-3 justify-center mb-4" aria-live="polite" aria-label={`${pin.length} of 4 digits entered`}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`w-4 h-4 rounded-full border-2 transition-colors ${i < pin.length ? "bg-[#1e2d4e] border-[#1e2d4e]" : "border-[#c9c5bc]"}`} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <KeypadBtn key={d} onClick={() => push(d)} disabled={!email}>{d}</KeypadBtn>
          ))}
          <KeypadBtn onClick={() => setPin("")} disabled={!email} aria-label="Clear"><span className="text-sm font-medium">Clear</span></KeypadBtn>
          <KeypadBtn onClick={() => push("0")} disabled={!email}>0</KeypadBtn>
          <KeypadBtn onClick={() => setPin((p) => p.slice(0, -1))} disabled={!email} aria-label="Delete last digit"><Delete size={20} aria-hidden /></KeypadBtn>
        </div>
      </div>
      {error && <ErrorBox msg={error} />}
      <p className="text-xs text-[#6b6860] text-center flex items-center justify-center gap-1.5">
        <KeyRound size={14} aria-hidden /> PINs are set by your center director. Works on the classroom tablet too.
      </p>
    </div>
  );
}

function KeypadBtn({ children, onClick, disabled, ...rest }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; "aria-label"?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      {...rest}
      className="h-14 rounded-xl bg-[#f3f2ee] hover:bg-[#e2dfd8] active:bg-[#d1cfc9] text-2xl font-semibold text-[#1e2d4e] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173] disabled:opacity-40 transition-colors"
    >
      {children}
    </button>
  );
}

// ─── Parent: sign in, or first-time setup with a family code ─
function ParentForm() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<"signin" | "setup">("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // first-time setup
  const [step, setStep] = useState(1);
  const [code, setCode] = useState("");
  const [setup, setSetup] = useState({ first: "", last: "", phone: "", email: "", pw: "", pw2: "", sms: false, terms: false });
  const matchedFamily = demoUsers.find((u) => u.familyCode === code.trim());

  if (mode === "setup") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-xs font-mono text-[#6b6860]">
          {[1, 2, 3].map((s) => (
            <span key={s} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step >= s ? "bg-[#0f7173] text-white" : "bg-[#e2dfd8] text-[#6b6860]"}`}>{step > s ? <Check size={14} aria-hidden /> : s}</span>
              {s < 3 && <span className="w-6 h-px bg-[#e2dfd8]" />}
            </span>
          ))}
          <span className="ml-1">Step {step} of 3</span>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-[#1e2d4e]">Enter your family code</h2>
              <p className="text-sm text-[#6b6860] mt-1">Your center gave you a 10-digit code when your child was enrolled. It links your account to your child.</p>
            </div>
            <div>
              <label htmlFor="fam-code" className={labelCls}>Family code</label>
              <input id="fam-code" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="0000-0000-00" className={`${inputCls} font-mono tracking-widest text-lg`} />
              {code.length >= 12 && !matchedFamily && <p className="text-sm text-[#dc2626] mt-1.5">We couldn't find that code. Double-check it with your center.</p>}
              {matchedFamily && <p className="text-sm text-[#16a34a] mt-1.5 flex items-center gap-1"><Check size={16} aria-hidden /> Found: {matchedFamily.title} · Coral Springs Center</p>}
            </div>
            <button className={primaryBtn} disabled={!matchedFamily} onClick={() => setStep(2)}>Continue</button>
            <p className="text-xs text-[#6b6860] text-center font-mono">Demo code: 4471-2290-58</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-[#1e2d4e]">Tell us about you</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label htmlFor="s-first" className={labelCls}>First name</label><input id="s-first" autoComplete="given-name" value={setup.first} onChange={(e) => setSetup((s) => ({ ...s, first: e.target.value }))} className={inputCls} /></div>
              <div><label htmlFor="s-last" className={labelCls}>Last name</label><input id="s-last" autoComplete="family-name" value={setup.last} onChange={(e) => setSetup((s) => ({ ...s, last: e.target.value }))} className={inputCls} /></div>
            </div>
            <div><label htmlFor="s-phone" className={labelCls}>Mobile phone</label><input id="s-phone" type="tel" autoComplete="tel" value={setup.phone} onChange={(e) => setSetup((s) => ({ ...s, phone: e.target.value }))} placeholder="(000) 000-0000" className={inputCls} /></div>
            <div><label htmlFor="s-email" className={labelCls}>Email</label><input id="s-email" type="email" autoComplete="email" value={setup.email} onChange={(e) => setSetup((s) => ({ ...s, email: e.target.value }))} className={inputCls} /></div>
            <label className="flex items-start gap-3 text-sm text-[#1a1a1a] cursor-pointer">
              <input type="checkbox" checked={setup.sms} onChange={(e) => setSetup((s) => ({ ...s, sms: e.target.checked }))} className="mt-1 w-4 h-4 accent-[#0f7173] flex-shrink-0" />
              <span>Text me updates about my child (check-in confirmations, incident alerts, reminders). Message &amp; data rates may apply. Reply STOP to opt out. <span className="text-[#6b6860]">Optional — required for SMS by U.S. law (TCPA).</span></span>
            </label>
            <div className="flex gap-3">
              <button className="flex-1 min-h-12 rounded-xl border border-[#e2dfd8] text-[#6b6860] hover:border-[#1e2d4e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173]" onClick={() => setStep(1)}>Back</button>
              <button className={`${primaryBtn} flex-1`} disabled={!setup.first || !setup.last || !setup.email} onClick={() => setStep(3)}>Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-[#1e2d4e]">Create a password</h2>
            <div><label htmlFor="s-pw" className={labelCls}>Password</label><input id="s-pw" type="password" autoComplete="new-password" value={setup.pw} onChange={(e) => setSetup((s) => ({ ...s, pw: e.target.value }))} className={inputCls} /><p className="text-xs text-[#6b6860] mt-1">At least 8 characters.</p></div>
            <div><label htmlFor="s-pw2" className={labelCls}>Confirm password</label><input id="s-pw2" type="password" autoComplete="new-password" value={setup.pw2} onChange={(e) => setSetup((s) => ({ ...s, pw2: e.target.value }))} className={inputCls} />{setup.pw2 && setup.pw !== setup.pw2 && <p className="text-sm text-[#dc2626] mt-1">Passwords don't match.</p>}</div>
            <label className="flex items-start gap-3 text-sm text-[#1a1a1a] cursor-pointer">
              <input type="checkbox" checked={setup.terms} onChange={(e) => setSetup((s) => ({ ...s, terms: e.target.checked }))} className="mt-1 w-4 h-4 accent-[#0f7173] flex-shrink-0" />
              <span>I agree to the <button type="button" className="text-[#0f7173] underline">Terms</button> and <button type="button" className="text-[#0f7173] underline">Privacy Policy</button>.</span>
            </label>
            <div className="flex gap-3">
              <button className="flex-1 min-h-12 rounded-xl border border-[#e2dfd8] text-[#6b6860] hover:border-[#1e2d4e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173]" onClick={() => setStep(2)}>Back</button>
              <button
                className={`${primaryBtn} flex-1`}
                disabled={setup.pw.length < 8 || setup.pw !== setup.pw2 || !setup.terms}
                onClick={() => { const r = signIn(matchedFamily!.email, matchedFamily!.secret, "parent"); if (!r.ok) setError(r.error); }}
              >
                Create account
              </button>
            </div>
            {error && <ErrorBox msg={error} />}
            <p className="text-xs text-[#6b6860] text-center">Demo: this signs you in as the family linked to your code.</p>
          </div>
        )}

        <button type="button" onClick={() => { setMode("signin"); setStep(1); }} className="w-full text-sm text-[#6b6860] hover:text-[#1e2d4e] min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173] rounded-lg">
          Already have an account? Sign in
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); const r = signIn(email, pw, "parent"); if (!r.ok) setError(r.error); }}
      className="space-y-4"
      noValidate
    >
      <div>
        <label htmlFor="parent-email" className={labelCls}>Email</label>
        <input id="parent-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className={inputCls} />
      </div>
      <div>
        <label htmlFor="parent-pw" className={labelCls}>Password</label>
        <div className="relative">
          <input id="parent-pw" type={show ? "text" : "password"} autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} className={`${inputCls} pr-12`} />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[#6b6860] hover:text-[#1e2d4e] rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173]">
            {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-[#6b6860] cursor-pointer min-h-11">
          <input type="checkbox" className="w-4 h-4 accent-[#0f7173]" /> Keep me signed in
        </label>
        <button type="button" className="text-[#0f7173] hover:underline min-h-11 px-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7173]">Forgot password?</button>
      </div>
      {error && <ErrorBox msg={error} />}
      <button type="submit" className={primaryBtn} disabled={!email || !pw}>Sign in</button>
      <div className="relative py-1"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e2dfd8]" /></div><p className="relative text-center text-xs text-[#6b6860]"><span className="bg-white px-2">New to Nestly?</span></p></div>
      <button type="button" onClick={() => setMode("setup")} className="w-full min-h-12 rounded-xl border-2 border-[#0f7173] text-[#0f7173] font-semibold hover:bg-[#e8f4f4] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0f7173] transition-colors">
        Set up with my family code
      </button>
    </form>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div role="alert" className="bg-[#fee2e2] border border-[#fca5a5] text-[#991b1b] text-sm rounded-xl px-4 py-3">
      {msg}
    </div>
  );
}
