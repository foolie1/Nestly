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
import { ThemePicker } from "../theme";

const ROLES: { id: Role; label: string; blurb: string; Icon: typeof Baby; accent: string }[] = [
  { id: "parent", label: "Parent", blurb: "See your child's day, pay tuition, message teachers", Icon: Baby, accent: "bg-accent-soft text-accent" },
  { id: "staff", label: "Staff", blurb: "Check kids in, log activities, message families", Icon: GraduationCap, accent: "bg-warning-soft text-warning" },
  { id: "admin", label: "Owner / Admin", blurb: "Owners, center directors, and office admins", Icon: Building2, accent: "bg-brand-soft text-brand" },
];

const inputCls =
  "w-full min-h-11 border border-line rounded-card px-3.5 py-2.5 text-base bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent transition-shadow";
const labelCls = "text-xs font-mono uppercase tracking-widest text-muted block mb-1.5";
const primaryBtn =
  "w-full min-h-12 rounded-card text-base font-semibold text-white bg-brand hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export default function Login() {
  const [role, setRole] = useState<Role | null>(null);

  return (
    <div className="min-h-full bg-page flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8 sm:mb-10 justify-center">
            <div className="w-11 h-11 rounded-[calc(var(--t-radius)+0.25rem)] bg-accent flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <div>
              <p className="text-brand font-bold text-xl leading-none">Nestly</p>
              <p className="text-muted text-sm">Sunshine Childcare Group</p>
            </div>
          </div>

          {role === null ? <RolePicker onPick={setRole} /> : <RoleForm role={role} onBack={() => setRole(null)} />}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pb-5 px-4">
        <ThemePicker />
        <p className="text-center text-xs text-muted">Demo environment · no real data · WCAG 2.2 AA target</p>
      </div>
    </div>
  );
}

function RolePicker({ onPick }: { onPick: (r: Role) => void }) {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-brand text-center">Welcome</h1>
      <p className="text-muted text-center mt-2 mb-8">Who's signing in today?</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ROLES.map(({ id, label, blurb, Icon, accent }) => (
          <button
            key={id}
            onClick={() => onPick(id)}
            className="group bg-white border-2 border-line rounded-[calc(var(--t-radius)+0.25rem)] p-6 text-left hover:border-accent hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent transition-all min-h-[140px] flex md:flex-col items-center md:items-start gap-4"
          >
            <div className={`w-14 h-14 rounded-[calc(var(--t-radius)+0.25rem)] flex items-center justify-center flex-shrink-0 ${accent}`}>
              <Icon size={28} strokeWidth={2} aria-hidden />
            </div>
            <div>
              <p className="font-bold text-lg text-brand group-hover:text-accent transition-colors">{label}</p>
              <p className="text-sm text-muted mt-1">{blurb}</p>
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
      <div className="lg:col-span-3 bg-white border border-line rounded-[calc(var(--t-radius)+0.25rem)] p-6 sm:p-8 shadow-sm">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand min-h-11 -ml-1 px-1 rounded-ctl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ArrowLeft size={16} aria-hidden /> Choose a different role
        </button>
        <div className="flex items-center gap-3 mt-3 mb-6">
          <div className={`w-10 h-10 rounded-card flex items-center justify-center ${meta.accent}`}>
            <meta.Icon size={20} aria-hidden />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand">{meta.label} sign in</h1>
        </div>

        {role === "admin" && <AdminForm />}
        {role === "staff" && <StaffForm />}
        {role === "parent" && <ParentForm />}
      </div>

      {/* Demo accounts */}
      <div className="lg:col-span-2 bg-brand text-white rounded-[calc(var(--t-radius)+0.25rem)] p-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-warning" aria-hidden />
          <p className="font-semibold">Try a demo account</p>
        </div>
        <p className="text-white/60 text-sm mb-4">One click, no password needed.</p>
        <div className="space-y-2">
          {demos.map((u) => (
            <button
              key={u.id}
              onClick={() => signInAs(u.id)}
              className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-card px-3 py-3 text-left min-h-14 focus:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors"
            >
              <span className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-sm font-bold flex-shrink-0">{u.initials}</span>
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
              className={`text-left border-2 rounded-card p-3 min-h-[72px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors ${subRole === r.id ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong"}`}
            >
              <span className="flex items-center gap-1.5 font-semibold text-sm text-brand">
                {subRole === r.id && <CheckIcon size={14} className="text-accent" aria-hidden />}
                {r.label}
              </span>
              <span className="block text-xs text-muted mt-0.5 leading-snug">{r.blurb}</span>
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
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-muted hover:text-brand rounded-ctl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-muted cursor-pointer min-h-11">
          <input type="checkbox" className="w-4 h-4 accent-accent" /> Keep me signed in
        </label>
        <button type="button" className="text-accent hover:underline min-h-11 px-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Forgot password?</button>
      </div>
      {error && <ErrorBox msg={error} />}
      <button type="submit" className={primaryBtn} disabled={!email || !pw}>Sign in</button>
      <p className="text-xs text-muted text-center">Director and office admin accounts are created by the organization's owner. Your role and center are confirmed against your account when a real backend is connected.</p>
    </form>
  );
}

// ─── Staff: email + 4-digit PIN (kiosk-friendly keypad) ──────
function PinPad({ value, onChange, disabled, label }: { value: string; onChange: (v: string) => void; disabled?: boolean; label: string }) {
  const push = (d: string) => value.length < 4 && onChange(value + d);
  return (
    <div>
      <p className={labelCls}>{label}</p>
      <div className="flex gap-3 justify-center mb-4" aria-live="polite" aria-label={`${value.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`w-4 h-4 rounded-full border-2 transition-colors ${i < value.length ? "bg-brand border-brand" : "border-line-strong"}`} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <KeypadBtn key={d} onClick={() => push(d)} disabled={disabled}>{d}</KeypadBtn>
        ))}
        <KeypadBtn onClick={() => onChange("")} disabled={disabled} aria-label="Clear"><span className="text-sm font-medium">Clear</span></KeypadBtn>
        <KeypadBtn onClick={() => push("0")} disabled={disabled}>0</KeypadBtn>
        <KeypadBtn onClick={() => onChange(value.slice(0, -1))} disabled={disabled} aria-label="Delete last digit"><Delete size={20} aria-hidden /></KeypadBtn>
      </div>
    </div>
  );
}

function StaffForm() {
  const { signIn, setStaffPin, findStaffInvite } = useAuth();
  const [mode, setMode] = useState<"signin" | "setup">("signin");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  // first-time setup
  const [step, setStep] = useState(1);
  const [invite, setInvite] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const inviteOk = !!findStaffInvite(email, invite);

  const handleSignInPin = (next: string) => {
    setPin(next);
    setError(null);
    if (next.length === 4) {
      const r = signIn(email, next, "staff");
      if (!r.ok) { setError(r.error); setTimeout(() => setPin(""), 350); }
    }
  };

  const handleConfirmPin = (next: string) => {
    setConfirmPin(next);
    setError(null);
    if (next.length === 4) {
      if (next !== newPin) { setError("PINs don't match — try again."); setTimeout(() => setConfirmPin(""), 350); return; }
      const r = setStaffPin(email, invite, next);
      if (!r.ok) { setError(r.error); setStep(2); setNewPin(""); setConfirmPin(""); }
    }
  };

  const reset = () => { setMode("signin"); setStep(1); setInvite(""); setNewPin(""); setConfirmPin(""); setPin(""); setError(null); };

  if (mode === "setup") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-xs font-mono text-muted">
          {[1, 2, 3].map((n) => (
            <span key={n} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step >= n ? "bg-accent text-white" : "bg-line text-muted"}`}>{step > n ? <Check size={14} aria-hidden /> : n}</span>
              {n < 3 && <span className="w-6 h-px bg-line" />}
            </span>
          ))}
          <span className="ml-1">Step {step} of 3</span>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-brand">Find your invite</h2>
              <p className="text-sm text-muted mt-1">Your director added you to Nestly and gave you an invite code. Enter it with your work email.</p>
            </div>
            <div>
              <label htmlFor="su-email" className={labelCls}>Staff email</label>
              <input id="su-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourcenter.com" className={inputCls} />
            </div>
            <div>
              <label htmlFor="su-invite" className={labelCls}>Invite code</label>
              <input id="su-invite" value={invite} onChange={(e) => setInvite(e.target.value)} placeholder="CS-0000" className={`${inputCls} font-mono tracking-widest uppercase`} />
              {invite.length >= 6 && email && !inviteOk && <p className="text-sm text-danger mt-1.5">No invite found for that email and code.</p>}
              {inviteOk && <p className="text-sm text-success mt-1.5 flex items-center gap-1"><Check size={16} aria-hidden /> Found: {findStaffInvite(email, invite)?.title}</p>}
            </div>
            <button className={primaryBtn} disabled={!inviteOk} onClick={() => setStep(2)}>Continue</button>
            <p className="text-xs text-muted text-center font-mono">Demo: denise@sunshinechildcare.com · CS-4471</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-brand">Choose your PIN</h2>
              <p className="text-sm text-muted mt-1">4 digits. You'll use it on the classroom tablet, so pick something you can tap fast but others can't guess.</p>
            </div>
            <PinPad label="New PIN" value={newPin} onChange={(v) => { setNewPin(v); setError(null); }} />
            {error && <ErrorBox msg={error} />}
            <div className="flex gap-3">
              <button className="flex-1 min-h-12 rounded-card border border-line text-muted hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" onClick={() => setStep(1)}>Back</button>
              <button className={`${primaryBtn} flex-1`} disabled={newPin.length !== 4} onClick={() => { setStep(3); setConfirmPin(""); }}>Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-brand">Confirm your PIN</h2>
              <p className="text-sm text-muted mt-1">Enter it once more. You'll be signed in as soon as it matches.</p>
            </div>
            <PinPad label="Confirm PIN" value={confirmPin} onChange={handleConfirmPin} />
            {error && <ErrorBox msg={error} />}
            <button className="w-full min-h-11 text-sm text-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-ctl" onClick={() => { setStep(2); setNewPin(""); setConfirmPin(""); setError(null); }}>Start over</button>
          </div>
        )}

        <button type="button" onClick={reset} className="w-full text-sm text-muted hover:text-brand min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-ctl">
          Already have a PIN? Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="staff-email" className={labelCls}>Staff email</label>
        <input id="staff-email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} placeholder="you@yourcenter.com" className={inputCls} />
      </div>
      <PinPad label="4-digit PIN" value={pin} onChange={handleSignInPin} disabled={!email} />
      {error && <ErrorBox msg={error} />}
      <p className="text-xs text-muted text-center flex items-center justify-center gap-1.5">
        <KeyRound size={14} aria-hidden /> Works on the classroom tablet too.
      </p>
      <div className="relative py-1"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-line" /></div><p className="relative text-center text-xs text-muted"><span className="bg-white px-2">First day?</span></p></div>
      <button type="button" onClick={() => { setMode("setup"); setError(null); setPin(""); }} className="w-full min-h-12 rounded-card border-2 border-accent text-accent font-semibold hover:bg-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent transition-colors">
        Create my PIN
      </button>
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
      className="h-14 rounded-card bg-surface-2 hover:bg-line active:bg-line-strong text-2xl font-semibold text-brand flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40 transition-colors"
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
        <div className="flex items-center gap-2 text-xs font-mono text-muted">
          {[1, 2, 3].map((s) => (
            <span key={s} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${step >= s ? "bg-accent text-white" : "bg-line text-muted"}`}>{step > s ? <Check size={14} aria-hidden /> : s}</span>
              {s < 3 && <span className="w-6 h-px bg-line" />}
            </span>
          ))}
          <span className="ml-1">Step {step} of 3</span>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-brand">Enter your family code</h2>
              <p className="text-sm text-muted mt-1">Your center gave you a 10-digit code when your child was enrolled. It links your account to your child.</p>
            </div>
            <div>
              <label htmlFor="fam-code" className={labelCls}>Family code</label>
              <input id="fam-code" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="0000-0000-00" className={`${inputCls} font-mono tracking-widest text-lg`} />
              {code.length >= 12 && !matchedFamily && <p className="text-sm text-danger mt-1.5">We couldn't find that code. Double-check it with your center.</p>}
              {matchedFamily && <p className="text-sm text-success mt-1.5 flex items-center gap-1"><Check size={16} aria-hidden /> Found: {matchedFamily.title} · Coral Springs Center</p>}
            </div>
            <button className={primaryBtn} disabled={!matchedFamily} onClick={() => setStep(2)}>Continue</button>
            <p className="text-xs text-muted text-center font-mono">Demo code: 4471-2290-58</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-brand">Tell us about you</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label htmlFor="s-first" className={labelCls}>First name</label><input id="s-first" autoComplete="given-name" value={setup.first} onChange={(e) => setSetup((s) => ({ ...s, first: e.target.value }))} className={inputCls} /></div>
              <div><label htmlFor="s-last" className={labelCls}>Last name</label><input id="s-last" autoComplete="family-name" value={setup.last} onChange={(e) => setSetup((s) => ({ ...s, last: e.target.value }))} className={inputCls} /></div>
            </div>
            <div><label htmlFor="s-phone" className={labelCls}>Mobile phone</label><input id="s-phone" type="tel" autoComplete="tel" value={setup.phone} onChange={(e) => setSetup((s) => ({ ...s, phone: e.target.value }))} placeholder="(000) 000-0000" className={inputCls} /></div>
            <div><label htmlFor="s-email" className={labelCls}>Email</label><input id="s-email" type="email" autoComplete="email" value={setup.email} onChange={(e) => setSetup((s) => ({ ...s, email: e.target.value }))} className={inputCls} /></div>
            <label className="flex items-start gap-3 text-sm text-ink cursor-pointer">
              <input type="checkbox" checked={setup.sms} onChange={(e) => setSetup((s) => ({ ...s, sms: e.target.checked }))} className="mt-1 w-4 h-4 accent-accent flex-shrink-0" />
              <span>Text me updates about my child (check-in confirmations, incident alerts, reminders). Message &amp; data rates may apply. Reply STOP to opt out. <span className="text-muted">Optional — required for SMS by U.S. law (TCPA).</span></span>
            </label>
            <div className="flex gap-3">
              <button className="flex-1 min-h-12 rounded-card border border-line text-muted hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" onClick={() => setStep(1)}>Back</button>
              <button className={`${primaryBtn} flex-1`} disabled={!setup.first || !setup.last || !setup.email} onClick={() => setStep(3)}>Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-brand">Create a password</h2>
            <div><label htmlFor="s-pw" className={labelCls}>Password</label><input id="s-pw" type="password" autoComplete="new-password" value={setup.pw} onChange={(e) => setSetup((s) => ({ ...s, pw: e.target.value }))} className={inputCls} /><p className="text-xs text-muted mt-1">At least 8 characters.</p></div>
            <div><label htmlFor="s-pw2" className={labelCls}>Confirm password</label><input id="s-pw2" type="password" autoComplete="new-password" value={setup.pw2} onChange={(e) => setSetup((s) => ({ ...s, pw2: e.target.value }))} className={inputCls} />{setup.pw2 && setup.pw !== setup.pw2 && <p className="text-sm text-danger mt-1">Passwords don't match.</p>}</div>
            <label className="flex items-start gap-3 text-sm text-ink cursor-pointer">
              <input type="checkbox" checked={setup.terms} onChange={(e) => setSetup((s) => ({ ...s, terms: e.target.checked }))} className="mt-1 w-4 h-4 accent-accent flex-shrink-0" />
              <span>I agree to the <button type="button" className="text-accent underline">Terms</button> and <button type="button" className="text-accent underline">Privacy Policy</button>.</span>
            </label>
            <div className="flex gap-3">
              <button className="flex-1 min-h-12 rounded-card border border-line text-muted hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" onClick={() => setStep(2)}>Back</button>
              <button
                className={`${primaryBtn} flex-1`}
                disabled={setup.pw.length < 8 || setup.pw !== setup.pw2 || !setup.terms}
                onClick={() => { const r = signIn(matchedFamily!.email, matchedFamily!.secret, "parent"); if (!r.ok) setError(r.error); }}
              >
                Create account
              </button>
            </div>
            {error && <ErrorBox msg={error} />}
            <p className="text-xs text-muted text-center">Demo: this signs you in as the family linked to your code.</p>
          </div>
        )}

        <button type="button" onClick={() => { setMode("signin"); setStep(1); }} className="w-full text-sm text-muted hover:text-brand min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-ctl">
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
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-muted hover:text-brand rounded-ctl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-muted cursor-pointer min-h-11">
          <input type="checkbox" className="w-4 h-4 accent-accent" /> Keep me signed in
        </label>
        <button type="button" className="text-accent hover:underline min-h-11 px-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Forgot password?</button>
      </div>
      {error && <ErrorBox msg={error} />}
      <button type="submit" className={primaryBtn} disabled={!email || !pw}>Sign in</button>
      <div className="relative py-1"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-line" /></div><p className="relative text-center text-xs text-muted"><span className="bg-white px-2">New to Nestly?</span></p></div>
      <button type="button" onClick={() => setMode("setup")} className="w-full min-h-12 rounded-card border-2 border-accent text-accent font-semibold hover:bg-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent transition-colors">
        Set up with my family code
      </button>
    </form>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div role="alert" className="bg-danger-soft border border-danger-line text-danger-strong text-sm rounded-card px-4 py-3">
      {msg}
    </div>
  );
}
