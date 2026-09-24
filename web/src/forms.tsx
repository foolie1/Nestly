/**
 * Online paperwork.
 *
 * Templates describe a form; submissions are what a family actually sent.
 * A submission is never the source of truth for a child — approval by the
 * office is what writes it onto the child's record. That review step matters
 * more than it looks: a parent typing "none" into the allergy form should not
 * be able to erase a severe allergy the office already has on file without a
 * person seeing the change first.
 *
 * Status is derived from the latest submission per child and form, so nothing
 * here needs to be kept in step by hand.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { children as seedChildren, type Allergy, type Child, type EmergencyContact, type Medication } from "./data";
import { useRoster } from "./roster";
import { useAuth } from "./auth";

// ─── Field model ────────────────────────────────────────────────

export type AllergyRow = Omit<Allergy, "id">;

export type FieldType =
  | "text"
  | "tel"
  | "email"
  | "date"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "contacts"
  | "allergies";

export type Field = {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  help?: string;
  placeholder?: string;
  /** Only shown, and only validated, when another field has this value. */
  showIf?: { field: string; equals: string };
  /** For contacts: how many rows are required. */
  min?: number;
};

export type FormId = "enrollment" | "emergency" | "health" | "photo" | "medication";

export type FormTemplate = {
  id: FormId;
  name: string;
  blurb: string;
  /** Every enrolled child must have an approved one. */
  required: boolean;
  /** Families can submit several — one per medication. */
  repeatable?: boolean;
  /** Roughly how long it takes, so nobody opens it at a red light. */
  minutes: number;
  sections: { title: string; intro?: string; fields: Field[] }[];
  /** What the signer is attesting to. */
  attestation: string;
};

export type FormData = Record<string, unknown>;

export type SubmissionStatus = "submitted" | "approved" | "returned";

export type Submission = {
  id: string;
  formId: FormId;
  childId: string;
  facilityId: string;
  data: FormData;
  /** PNG data URL of the drawn signature. */
  signature?: string;
  /** The name typed alongside the signature. */
  signedName: string;
  submittedBy: string;
  submittedAt: string;
  status: SubmissionStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  /** Required when returning — tells the family what to fix. */
  reviewNote?: string;
};

export type FormStatus = "not-started" | SubmissionStatus;

// ─── Templates ──────────────────────────────────────────────────

export const TEMPLATES: FormTemplate[] = [
  {
    id: "enrollment",
    name: "Enrollment Agreement 2026–27",
    blurb: "Schedule, tuition terms and center policies for this school year.",
    required: true,
    minutes: 5,
    attestation:
      "I have read the policies above, agree to the tuition terms, and confirm the information I've given is accurate. I understand this agreement renews each school year.",
    sections: [
      {
        title: "Your family",
        fields: [
          { id: "guardian", label: "Your full name", type: "text", required: true },
          { id: "phone", label: "Best phone number", type: "tel", required: true },
          { id: "email", label: "Email", type: "email", required: true, help: "Invoices and announcements go here." },
          { id: "guardian2", label: "Second parent or guardian (optional)", type: "text" },
          { id: "phone2", label: "Their phone (optional)", type: "tel" },
        ],
      },
      {
        title: "Schedule",
        fields: [
          { id: "schedule", label: "Attendance", type: "radio", required: true, options: ["Full-time · 5 days", "Part-time · 3 days (M/W/F)", "Part-time · 2 days (T/Th)"] },
          { id: "dropoff", label: "Usual drop-off", type: "select", required: true, options: ["7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM", "9:00 AM"] },
          { id: "pickup", label: "Usual pickup", type: "select", required: true, options: ["3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM"] },
        ],
      },
      {
        title: "Policies",
        intro: "Please read each one — ticking the box means you agree to it.",
        fields: [
          { id: "p_tuition", label: "Tuition is due on the 1st of each month. A late fee applies after the 5th.", type: "checkbox", required: true },
          { id: "p_pickup", label: "The center closes at 6:00 PM. A per-minute late pickup fee applies after closing.", type: "checkbox", required: true },
          { id: "p_illness", label: "My child stays home with a fever, vomiting or diarrhea, and returns only after 24 hours symptom-free without medication.", type: "checkbox", required: true },
          { id: "p_notice", label: "I'll give two weeks' written notice before withdrawing.", type: "checkbox", required: true },
        ],
      },
    ],
  },
  {
    id: "emergency",
    name: "Emergency Contacts",
    blurb: "Who we call when we can't reach you, and who treats your child.",
    required: true,
    minutes: 3,
    attestation:
      "The people listed may be contacted in an emergency. I authorize the center to obtain emergency medical treatment for my child if I cannot be reached.",
    sections: [
      {
        title: "People we can call",
        intro: "At least two, in the order we should try them. Include someone who isn't a parent — in a real emergency both parents are often unreachable at the same time.",
        fields: [{ id: "contacts", label: "Emergency contacts", type: "contacts", required: true, min: 2 }],
      },
      {
        title: "Medical",
        fields: [
          { id: "physician", label: "Pediatrician's name", type: "text", required: true },
          { id: "physicianPhone", label: "Pediatrician's phone", type: "tel", required: true },
          { id: "hospital", label: "Preferred hospital (optional)", type: "text", placeholder: "e.g. Wolfson Children's" },
          { id: "consent", label: "I authorize emergency medical treatment for my child if I can't be reached.", type: "checkbox", required: true },
        ],
      },
    ],
  },
  {
    id: "health",
    name: "Health, Allergies & Diet",
    blurb: "What teachers need to know to keep your child safe at meals and outside.",
    required: true,
    minutes: 4,
    attestation:
      "This is complete and accurate to the best of my knowledge. I'll update it through the app as soon as anything changes.",
    sections: [
      {
        title: "Allergies",
        intro: "Food, medication, insects, latex — anything. Mild ones matter too: they tell teachers what to watch for.",
        fields: [
          { id: "hasAllergies", label: "Does your child have any allergies?", type: "radio", required: true, options: ["Yes", "No"] },
          { id: "allergies", label: "Allergies", type: "allergies", required: true, showIf: { field: "hasAllergies", equals: "Yes" } },
        ],
      },
      {
        title: "Diet and conditions",
        fields: [
          { id: "dietaryNotes", label: "Dietary needs (optional)", type: "textarea", placeholder: "Vegetarian, no pork, whole milk only…" },
          { id: "conditions", label: "Anything else teachers should know (optional)", type: "textarea", placeholder: "Asthma, seizures, a recent surgery…", help: "Only the staff caring for your child can see this." },
        ],
      },
    ],
  },
  {
    id: "photo",
    name: "Photo & Media Consent",
    blurb: "Whether teachers may photograph your child, and where photos can appear.",
    required: true,
    minutes: 1,
    attestation: "This is my decision about photographs of my child. I can change it any time from the app.",
    sections: [
      {
        title: "Photos of your child",
        intro: "Teachers take photos during the day and share them with you in the app. Nothing is ever posted with your child's name.",
        fields: [
          {
            id: "consent",
            label: "What's OK with you?",
            type: "radio",
            required: true,
            options: [
              "Yes — my family's feed, plus center newsletters and social media",
              "Only my family's private feed in the app",
              "No photos of my child",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "medication",
    name: "Medication Authorization",
    blurb: "Required before staff can give any medication, including over-the-counter.",
    required: false,
    repeatable: true,
    minutes: 3,
    attestation:
      "I authorize center staff to give this medication as described, until the end date above. The medication is in its original labeled container.",
    sections: [
      {
        title: "The medication",
        fields: [
          { id: "name", label: "Medication name", type: "text", required: true, placeholder: "e.g. Albuterol inhaler" },
          { id: "dose", label: "Dose", type: "text", required: true, placeholder: "e.g. 2 puffs with spacer" },
          { id: "route", label: "How it's given", type: "select", required: true, options: ["By mouth", "Inhaled", "On the skin", "Auto-injector (e.g. EpiPen)", "Eye or ear drops", "Other"] },
          { id: "schedule", label: "When to give it", type: "text", required: true, placeholder: "e.g. As needed for wheezing, no more than every 4 hours" },
          { id: "reason", label: "What it's for", type: "text", required: true },
        ],
      },
      {
        title: "Prescriber and dates",
        fields: [
          { id: "prescriber", label: "Prescribing doctor", type: "text", required: true, help: "For over-the-counter medication, your pediatrician." },
          { id: "start", label: "Start date", type: "date", required: true },
          { id: "end", label: "End date", type: "date", required: true, help: "Staff can't give it after this date without a new form." },
          { id: "notes", label: "Where it's kept, and anything else (optional)", type: "textarea", placeholder: "e.g. Front pocket of her backpack" },
          { id: "labeled", label: "The medication is in its original pharmacy-labeled container with my child's name on it.", type: "checkbox", required: true },
        ],
      },
    ],
  },
];

export const TEMPLATE: Record<FormId, FormTemplate> = Object.fromEntries(TEMPLATES.map((t) => [t.id, t])) as Record<FormId, FormTemplate>;

export const REQUIRED_FORMS = TEMPLATES.filter((t) => t.required);

const PHOTO_CHOICE: Record<string, NonNullable<Child["photoConsent"]>> = {
  [TEMPLATE.photo.sections[0].fields[0].options![0]]: "granted",
  [TEMPLATE.photo.sections[0].fields[0].options![1]]: "feed-only",
  [TEMPLATE.photo.sections[0].fields[0].options![2]]: "denied",
};

export const PHOTO_LABEL: Record<NonNullable<Child["photoConsent"]>, string> = {
  granted: "Photos allowed, including center materials",
  "feed-only": "Photos in the family feed only",
  denied: "No photos",
};

// ─── Validation ─────────────────────────────────────────────────

export function isVisible(field: Field, data: FormData) {
  return !field.showIf || data[field.showIf.field] === field.showIf.equals;
}

const PHONE = /^\D*(\d\D*){10}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns a message per failing field id. Empty object means valid. */
export function validate(template: FormTemplate, data: FormData): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const section of template.sections) {
    for (const f of section.fields) {
      if (!isVisible(f, data)) continue;
      const v = data[f.id];
      if (f.type === "checkbox") {
        if (f.required && v !== true) errors[f.id] = "Tick this to continue.";
        continue;
      }
      if (f.type === "contacts") {
        const rows = (v as EmergencyContact[] | undefined) ?? [];
        const complete = rows.filter((r) => r.name.trim() && r.relationship.trim() && PHONE.test(r.phone));
        if (complete.length < (f.min ?? 1)) errors[f.id] = `Add at least ${f.min ?? 1} contacts with a name, relationship and 10-digit phone.`;
        else if (rows.some((r) => (r.name || r.phone) && !PHONE.test(r.phone))) errors[f.id] = "One of the phone numbers isn't 10 digits.";
        continue;
      }
      if (f.type === "allergies") {
        const rows = (v as AllergyRow[] | undefined) ?? [];
        if (rows.length === 0) errors[f.id] = "Add each allergy, or go back and answer No.";
        else if (rows.some((r) => !r.name.trim() || !r.reaction.trim() || !r.response.trim()))
          errors[f.id] = "Each allergy needs what it is, what a reaction looks like, and what staff should do.";
        continue;
      }
      const s = typeof v === "string" ? v.trim() : "";
      if (f.required && !s) {
        errors[f.id] = "Required.";
        continue;
      }
      if (s && f.type === "tel" && !PHONE.test(s)) errors[f.id] = "Enter a 10-digit phone number.";
      if (s && f.type === "email" && !EMAIL.test(s)) errors[f.id] = "That doesn't look like an email address.";
    }
  }
  if (template.id === "medication" && data.start && data.end && String(data.end) < String(data.start)) {
    errors.end = "The end date is before the start date.";
  }
  return errors;
}

/** Start a form with whatever the center already knows, so nobody retypes it. */
export function prefill(template: FormTemplate, child: Child, previous?: Submission): FormData {
  if (previous) return { ...previous.data };
  switch (template.id) {
    case "enrollment":
      return { guardian: child.guardian, phone: child.guardianPhone };
    case "emergency":
      return {
        contacts: child.emergencyContacts?.length
          ? child.emergencyContacts
          : [
              { name: child.guardian, relationship: "Parent", phone: child.guardianPhone },
              { name: "", relationship: "", phone: "" },
            ],
      };
    case "health":
      if (!child.allergies) return { dietaryNotes: child.dietaryNotes ?? "" };
      return {
        hasAllergies: child.allergies.length ? "Yes" : "No",
        allergies: child.allergies.map(({ id: _id, ...rest }) => rest),
        dietaryNotes: child.dietaryNotes ?? "",
      };
    default:
      return {};
  }
}

// ─── Store ──────────────────────────────────────────────────────

type Store = {
  submissions: Submission[];
  latest: (childId: string, formId: FormId) => Submission | undefined;
  statusFor: (childId: string, formId: FormId) => FormStatus;
  forChild: (childId: string) => Submission[];
  /** Everything waiting on the office at one center, oldest first. */
  pendingAt: (facilityId: string) => Submission[];
  /** Required forms this child is still missing (not approved and not awaiting review). */
  outstanding: (child: Child) => FormTemplate[];
  submit: (input: { formId: FormId; child: Child; data: FormData; signature: string; signedName: string }) => string;
  approve: (submissionId: string) => void;
  returnForChanges: (submissionId: string, note: string) => void;
};

const Ctx = createContext<Store | null>(null);

const nowISO = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);

export function FormsProvider({ children: kids }: { children: ReactNode }) {
  const { user } = useAuth();
  const { roster, updateChild } = useRoster();
  const [submissions, setSubmissions] = useState<Submission[]>(SEED);

  const forChild: Store["forChild"] = (childId) =>
    submissions.filter((s) => s.childId === childId).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  const latest: Store["latest"] = (childId, formId) => forChild(childId).find((s) => s.formId === formId);

  const statusFor: Store["statusFor"] = (childId, formId) => {
    const all = forChild(childId).filter((s) => s.formId === formId);
    if (all.length === 0) return "not-started";
    // A newer submission waiting on review shouldn't hide that an older one
    // is still on file — but for status, the newest is what the family acts on.
    return all[0].status;
  };

  const pendingAt: Store["pendingAt"] = (facilityId) =>
    submissions.filter((s) => s.facilityId === facilityId && s.status === "submitted").sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

  const outstanding: Store["outstanding"] = (child) =>
    REQUIRED_FORMS.filter((t) => {
      const all = forChild(child.id).filter((s) => s.formId === t.id);
      return !all.some((s) => s.status === "approved" || s.status === "submitted");
    });

  const submit: Store["submit"] = ({ formId, child, data, signature, signedName }) => {
    const id = `sub-${Date.now()}`;
    setSubmissions((list) => [
      {
        id,
        formId,
        childId: child.id,
        facilityId: child.facilityId,
        data,
        signature,
        signedName: signedName.trim(),
        submittedBy: user?.name ?? signedName.trim(),
        submittedAt: nowISO(),
        status: "submitted",
      },
      ...list,
    ]);
    return id;
  };

  /** The one place a family's answers become the child's record. */
  const apply = (s: Submission) => {
    const d = s.data;
    switch (s.formId) {
      case "enrollment":
        updateChild(s.childId, () => ({ agreementSigned: today() }));
        break;
      case "emergency":
        updateChild(s.childId, () => ({
          emergencyContacts: ((d.contacts as EmergencyContact[]) ?? []).filter((c) => c.name.trim()),
        }));
        break;
      case "health":
        updateChild(s.childId, () => ({
          allergies:
            d.hasAllergies === "Yes"
              ? ((d.allergies as AllergyRow[]) ?? []).map((a, i) => ({ ...a, id: `${s.id}-a${i}` }))
              : [],
          dietaryNotes: String(d.dietaryNotes ?? "").trim() || undefined,
        }));
        break;
      case "photo":
        updateChild(s.childId, () => ({ photoConsent: PHOTO_CHOICE[String(d.consent)] }));
        break;
      case "medication": {
        const med: Medication = {
          id: `${s.id}-m`,
          name: String(d.name),
          dose: String(d.dose),
          schedule: String(d.schedule),
          route: String(d.route),
          prescriber: String(d.prescriber),
          authorizedUntil: String(d.end),
          notes: String(d.notes ?? "").trim() || undefined,
        };
        updateChild(s.childId, (c) => ({ medications: [...(c.medications ?? []), med] }));
        break;
      }
    }
  };

  const approve: Store["approve"] = (submissionId) => {
    const s = submissions.find((x) => x.id === submissionId);
    if (!s || s.status !== "submitted") return;
    apply(s);
    setSubmissions((list) =>
      list.map((x) => (x.id === submissionId ? { ...x, status: "approved", reviewedBy: user?.name, reviewedAt: nowISO() } : x)),
    );
  };

  const returnForChanges: Store["returnForChanges"] = (submissionId, note) => {
    if (!note.trim()) return;
    setSubmissions((list) =>
      list.map((x) =>
        x.id === submissionId ? { ...x, status: "returned", reviewedBy: user?.name, reviewedAt: nowISO(), reviewNote: note.trim() } : x,
      ),
    );
  };

  const value = useMemo<Store>(
    () => ({ submissions, latest, statusFor, forChild, pendingAt, outstanding, submit, approve, returnForChanges }),
    [submissions, roster, user],
  );
  return <Ctx.Provider value={value}>{kids}</Ctx.Provider>;
}

export function useForms() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useForms must be used inside <FormsProvider>");
  return ctx;
}

// ─── Seed ───────────────────────────────────────────────────────
//
// Mirrors the state already on the seeded children, with deliberate gaps so
// every screen has something real to show: two forms waiting on the office,
// one returned to a family, and a few never started.

const kid = (id: string) => seedChildren.find((c) => c.id === id)!;

function seed(
  childId: string,
  formId: FormId,
  status: SubmissionStatus,
  data: FormData,
  daysAgo: number,
  extra: Partial<Submission> = {},
): Submission {
  const c = kid(childId);
  const at = new Date(Date.now() - daysAgo * 86_400_000).toISOString();
  return {
    id: `seed-${childId}-${formId}-${daysAgo}`,
    formId,
    childId,
    facilityId: c.facilityId,
    data,
    signedName: c.guardian,
    submittedBy: c.guardian,
    submittedAt: at,
    status,
    ...(status !== "submitted" ? { reviewedBy: "Patricia Lane", reviewedAt: at } : {}),
    ...extra,
  };
}

const ALL = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "c10"];

const SEED: Submission[] = [
  // Enrollment agreements — Amelia's and Emma's haven't been started.
  ...ALL.filter((id) => !["c1", "c9"].includes(id)).map((id) =>
    seed(id, "enrollment", "approved", { guardian: kid(id).guardian, phone: kid(id).guardianPhone, schedule: "Full-time · 5 days" }, 20),
  ),

  // Emergency contacts — Sofia's came back to the family for a second contact.
  ...ALL.filter((id) => id !== "c3").map((id) =>
    seed(id, "emergency", "approved", { contacts: kid(id).emergencyContacts ?? [], physician: "On file", physicianPhone: "(904) 555-0100" }, 40),
  ),
  seed(
    "c3",
    "emergency",
    "returned",
    { contacts: [{ name: "Carlos Reyes", relationship: "Father", phone: "(954) 555-0267" }], physician: "Dr. R. Alvarez", physicianPhone: "(954) 555-0410" },
    3,
    { reviewNote: "We need at least one more contact who isn't a parent — a grandparent, neighbor or family friend we could reach if you're both unavailable." },
  ),

  // Health — Ethan's update is waiting on review.
  ...ALL.filter((id) => id !== "c10").map((id) =>
    seed(
      id,
      "health",
      "approved",
      {
        hasAllergies: kid(id).allergies?.length ? "Yes" : "No",
        allergies: (kid(id).allergies ?? []).map(({ id: _i, ...r }) => r),
        dietaryNotes: kid(id).dietaryNotes ?? "",
      },
      40,
    ),
  ),
  seed(
    "c10",
    "health",
    "submitted",
    {
      hasAllergies: "Yes",
      allergies: [{ name: "Amoxicillin", kind: "medication", severity: "moderate", reaction: "Full-body rash within a day", response: "Don't give it. Call Karen if he's been given any penicillin-family antibiotic." }],
      dietaryNotes: "",
      conditions: "",
    },
    1,
  ),

  // Photo consent — Liam's is waiting; Noah, James, Emma and Ethan haven't answered.
  ...["c1", "c3", "c5", "c7", "c8"].map((id) =>
    seed(id, "photo", "approved", { consent: TEMPLATE.photo.sections[0].fields[0].options![0] }, 30),
  ),
  seed("c4", "photo", "submitted", { consent: TEMPLATE.photo.sections[0].fields[0].options![1] }, 0),

  // Medication authorizations already on file.
  seed("c2", "medication", "approved", { name: "EpiPen Jr", dose: "0.15 mg auto-injector", route: "Auto-injector (e.g. EpiPen)", schedule: "Emergency use only", reason: "Cow's milk protein allergy", prescriber: "Dr. A. Whitfield", start: "2026-03-01", end: "2027-03-01" }, 60),
  seed("c5", "medication", "approved", { name: "EpiPen", dose: "0.3 mg auto-injector", route: "Auto-injector (e.g. EpiPen)", schedule: "Emergency use only", reason: "Peanut and tree nut allergy", prescriber: "Dr. L. Moreno", start: "2025-11-15", end: "2026-11-15" }, 60),
  seed("c6", "medication", "approved", { name: "Albuterol inhaler", dose: "2 puffs with spacer", route: "Inhaled", schedule: "As needed for coughing or wheezing, max every 4 hours", reason: "Asthma", prescriber: "Dr. S. Patel", start: "2025-09-30", end: "2026-09-30" }, 60),
];
