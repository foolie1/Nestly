/**
 * Rule-pack schema — the contract every state pack must satisfy.
 *
 * Build Plan §5: compliance is data, not code. The ratio engine, compliance
 * dashboard and incident validation all read from a validated RulePack.
 * Adding a state = author a new JSON file in ./packs and seed it.
 */
import { z } from 'zod';

export const ageBandSchema = z.enum(['infant', 'toddler', 'preschool', 'school_age']);
export type AgeBand = z.infer<typeof ageBandSchema>;

/**
 * One ratio tier. `maxAgeMonths` is exclusive upper bound (child is in this
 * band while ageMonths < maxAgeMonths). The last band omits it (open-ended).
 * `maxChildrenPerStaff` is the N in "1:N".
 */
export const ratioRuleSchema = z.object({
  ageBand: ageBandSchema,
  label: z.string(),
  maxAgeMonths: z.number().int().positive().optional(),
  maxChildrenPerStaff: z.number().int().positive(),
  /** Max group size, where the state defines one (FL does not for most bands). */
  maxGroupSize: z.number().int().positive().optional(),
  citation: z.string(),
});
export type RatioRule = z.infer<typeof ratioRuleSchema>;

export const requiredDocumentSchema = z.object({
  type: z.enum([
    'immunization',
    'emergency_contacts',
    'authorized_pickups',
    'enrollment_agreement',
    'medical',
  ]),
  formCode: z.string().optional(),
  label: z.string(),
  /** Days after enrollment start by which the doc must be on file. */
  deadlineDays: z.number().int().nonnegative(),
  /** If true, the child must be excluded from care once the deadline passes. */
  exclusionOnMiss: z.boolean(),
  /** Age bands this requirement applies to (omit = all). */
  appliesToAgeBands: z.array(ageBandSchema).optional(),
  citation: z.string(),
});
export type RequiredDocument = z.infer<typeof requiredDocumentSchema>;

export const staffScreeningSchema = z.object({
  /** e.g. 2 for Florida Level 2 */
  level: z.number().int().positive(),
  label: z.string(),
  /** Screening required at or above this many weekly child-contact hours. */
  minWeeklyContactHours: z.number().int().nonnegative(),
  rescreenIntervalYears: z.number().int().positive(),
  requiredBeforeStart: z.boolean(),
  components: z.array(z.string()),
  citation: z.string(),
});

export const certificationRequirementSchema = z.object({
  type: z.enum(['cpr', 'first_aid', 'training_hours', 'director_credential']),
  label: z.string(),
  /** If true, a lapse blocks the staff member from counting toward ratio. */
  ratioCritical: z.boolean(),
  renewalIntervalMonths: z.number().int().positive().optional(),
  citation: z.string(),
});

export const incidentFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  kind: z.enum(['text', 'longtext', 'datetime', 'select', 'boolean', 'signature']),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
});

export const retentionRuleSchema = z.object({
  documentType: z.string(),
  /** null ⇒ indefinite */
  retainYears: z.number().int().positive().nullable(),
  citation: z.string(),
});

export const rulePackSchema = z.object({
  state: z.string().length(2),
  stateName: z.string(),
  version: z.number().int().positive(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Set to false while any section is still marked provisional. */
  reviewed: z.boolean(),
  ratios: z.array(ratioRuleSchema).min(1),
  /** "In mixed-age rooms the youngest child's ratio governs." */
  mixedAgeRule: z.enum(['youngest_governs', 'weighted', 'none']),
  requiredDocuments: z.array(requiredDocumentSchema),
  staffScreening: staffScreeningSchema,
  certifications: z.array(certificationRequirementSchema),
  incidentReport: z.object({
    /** true until the FL field list is confirmed (START_HERE open item). */
    provisional: z.boolean(),
    notifyGuardianWithinHours: z.number().positive().optional(),
    requireGuardianSignature: z.boolean(),
    fields: z.array(incidentFieldSchema),
    citation: z.string(),
  }),
  retention: z.array(retentionRuleSchema),
  sources: z.array(z.object({ title: z.string(), url: z.string().url() })),
});
export type RulePack = z.infer<typeof rulePackSchema>;

/** Parse + validate an untrusted pack (e.g. from the compliance_rules table). */
export function parseRulePack(input: unknown): RulePack {
  const pack = rulePackSchema.parse(input);
  // Ratios must be sorted ascending by maxAgeMonths with exactly one open-ended band last.
  const openEnded = pack.ratios.filter((r) => r.maxAgeMonths === undefined);
  if (openEnded.length !== 1 || pack.ratios[pack.ratios.length - 1]?.maxAgeMonths !== undefined) {
    throw new Error(`Rule pack ${pack.state}: exactly one open-ended ratio band must be last`);
  }
  for (let i = 1; i < pack.ratios.length - 1; i++) {
    const prev = pack.ratios[i - 1]!.maxAgeMonths!;
    const cur = pack.ratios[i]!.maxAgeMonths!;
    if (cur <= prev) throw new Error(`Rule pack ${pack.state}: ratio bands must be ascending by age`);
  }
  return pack;
}
