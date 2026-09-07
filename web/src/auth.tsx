import { createContext, useContext, useState, type ReactNode } from "react";
import { demoUsers, facilities, type DemoUser, type LoginRole, type Role } from "./data";

type AuthState = {
  user: DemoUser | null;
  /** `config` lets the Owner/Admin card refine the role and center for this session. */
  signIn: (email: string, secret: string, role: LoginRole, config?: { role: Role; facilityId?: string }) => { ok: true } | { ok: false; error: string };
  signInAs: (userId: string) => void;
  signOut: () => void;
  /** Staff first-time setup: validate email + invite code, store the chosen PIN, sign in. */
  setStaffPin: (email: string, inviteCode: string, pin: string) => { ok: true } | { ok: false; error: string };
  /** Look up whether an email + invite code pair is a valid staff invite (for step-1 validation). */
  findStaffInvite: (email: string, inviteCode: string) => DemoUser | null;
};

const CARD_LABEL: Record<LoginRole, string> = { admin: "Owner / Admin", staff: "Staff", parent: "Parent" };

/** Which sign-in card a given account uses. */
export function loginRoleOf(role: DemoUser["role"]): LoginRole {
  return role === "owner" || role === "director" || role === "office_admin" ? "admin" : role;
}

const AuthContext = createContext<AuthState | null>(null);

/** PINs created in-session (a real backend would hash and store these). */
const pinOverrides = new Map<string, string>();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);

  const findStaffInvite: AuthState["findStaffInvite"] = (email, inviteCode) => {
    const match = demoUsers.find((u) => u.role === "staff" && u.email.toLowerCase() === email.trim().toLowerCase());
    if (!match || !match.inviteCode) return null;
    return match.inviteCode.replace(/\s/g, "").toUpperCase() === inviteCode.replace(/\s/g, "").toUpperCase() ? match : null;
  };

  const setStaffPin: AuthState["setStaffPin"] = (email, inviteCode, pin) => {
    const match = findStaffInvite(email, inviteCode);
    if (!match) return { ok: false, error: "That email and invite code don't match. Check with your director." };
    if (!/^\d{4}$/.test(pin)) return { ok: false, error: "PIN must be exactly 4 digits." };
    if (/^(\d)\1{3}$/.test(pin) || ["1234", "4321", "0000"].includes(pin)) return { ok: false, error: "Pick a PIN that's harder to guess." };
    pinOverrides.set(match.id, pin);
    setUser({ ...match, secret: pin });
    return { ok: true };
  };

  const signIn: AuthState["signIn"] = (email, secret, role, config) => {
    const match = demoUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!match) return { ok: false, error: "We couldn't find an account with that email." };
    const card = loginRoleOf(match.role);
    if (card !== role) return { ok: false, error: `That account signs in under "${CARD_LABEL[card]}" — go back and choose that.` };
    const expected = pinOverrides.get(match.id) ?? match.secret;
    if (expected !== secret) return { ok: false, error: role === "staff" ? "That PIN doesn't match." : "That password doesn't match." };
    if (config) {
      const facilityId = config.role === "owner" ? match.facilityId : (config.facilityId ?? match.facilityId);
      const center = facilities.find((f) => f.id === facilityId)?.name.split(" ").slice(0, 2).join(" ");
      const label = config.role === "owner" ? "Owner / Operator" : config.role === "director" ? "Center Director" : "Office Admin";
      setUser({ ...match, role: config.role, facilityId, title: config.role === "owner" ? label : `${label} · ${center}` });
    } else {
      setUser(match);
    }
    return { ok: true };
  };

  const signInAs = (userId: string) => {
    const u = demoUsers.find((d) => d.id === userId);
    if (u) setUser(u);
  };

  return <AuthContext.Provider value={{ user, signIn, signInAs, signOut: () => setUser(null), setStaffPin, findStaffInvite }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
