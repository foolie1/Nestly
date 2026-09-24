/**
 * Allergy display, shared by every surface that shows a child.
 *
 * The rule these components follow: an allergy is never behind a tap. A
 * teacher covering an unfamiliar room, a floater, or a substitute has to be
 * able to see it on the roster card without knowing to look for it.
 */
import { AlertTriangle } from "lucide-react";
import type { Allergy, Child } from "../data";

/** Food allergies only — the ones that matter at a meal. */
export function foodAllergies(child: Child): Allergy[] {
  return (child.allergies ?? []).filter((a) => a.kind === "food");
}

export function hasSevere(child: Child): boolean {
  return (child.allergies ?? []).some((a) => a.severity === "severe");
}

/** Compact pills for roster cards and lists. */
export function AllergyBadges({ child, className = "" }: { child: Child; className?: string }) {
  const allergies = child.allergies ?? [];
  if (allergies.length === 0) return null;
  return (
    <ul className={`flex flex-wrap gap-1 mt-1.5 ${className}`}>
      {allergies.map((a) => (
        <li
          key={a.id}
          title={`${a.severity} · ${a.reaction}`}
          className={`inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded ${
            a.severity === "severe" ? "bg-danger text-white" : "bg-danger-soft text-danger"
          }`}
        >
          <AlertTriangle size={11} aria-hidden />
          {a.name}
        </li>
      ))}
    </ul>
  );
}

/**
 * The full-width warning shown when a teacher is about to log a meal for a
 * child with a food allergy. It repeats the response instructions rather than
 * just naming the allergen, because naming it isn't the useful part.
 */
export function AllergyWarning({ children_ }: { children_: Child[] }) {
  if (children_.length === 0) return null;
  return (
    <div role="alert" className="bg-danger-soft border-2 border-danger-line rounded-card p-3.5 mb-4">
      <p className="text-sm font-bold text-danger flex items-center gap-2 mb-2">
        <AlertTriangle size={16} aria-hidden />
        Check before you feed {children_.length === 1 ? children_[0].name.split(" ")[0] : "these children"}
      </p>
      <ul className="space-y-2">
        {children_.map((c) => (
          <li key={c.id} className="text-sm">
            <span className="font-semibold text-brand">{c.name}</span>
            <ul className="mt-0.5 space-y-0.5">
              {foodAllergies(c).map((a) => (
                <li key={a.id} className="text-danger-strong">
                  <span className="font-semibold">{a.name}</span>
                  {a.severity === "severe" && <span className="ml-1 text-xs font-bold uppercase tracking-wide">severe</span>}
                  <span className="block text-xs mt-0.5">{a.response}</span>
                </li>
              ))}
            </ul>
            {c.dietaryNotes && <p className="text-xs text-muted mt-1">{c.dietaryNotes}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Read-only detail block for the parent portal and the child's record. */
export function AllergyDetail({ child }: { child: Child }) {
  const allergies = child.allergies ?? [];
  if (allergies.length === 0) {
    return <p className="text-sm text-muted">No allergies on file.</p>;
  }
  return (
    <ul className="space-y-2.5">
      {allergies.map((a) => (
        <li key={a.id} className="border-l-2 border-danger pl-3">
          <p className="text-sm font-semibold text-brand">
            {a.name}
            <span className={`ml-2 text-xs font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${a.severity === "severe" ? "bg-danger text-white" : "bg-danger-soft text-danger"}`}>
              {a.severity}
            </span>
          </p>
          <p className="text-xs text-muted mt-0.5">Reaction: {a.reaction}</p>
          <p className="text-xs text-ink mt-0.5">{a.response}</p>
        </li>
      ))}
    </ul>
  );
}
