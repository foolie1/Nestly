/**
 * Nestly — Postgres schema (Drizzle ORM)
 *
 * Implements Build-Phase Plan §3 / Unified PRD §8:
 *   Tenant → Facility → Group → Person (child) ⇄ Guardian
 *   → Enrollment → Attendance Event → Daily Record → Document
 *   → Billing Account / Invoice / Transaction → Thread / Message
 *   → Compliance Rule → Audit Log
 *
 * Naming: internal, industry-agnostic entity names (PRD §8). The childcare
 * pack maps them to user-facing terms (PRD §9.1): person=child, group=room,
 * facility=center, tenant=operator.
 */
import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  timestamp,
  date,
  integer,
  boolean,
  jsonb,
  numeric,
  index,
  uniqueIndex,
  primaryKey,
  check,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** PRD §4.2 role matrix. Enforced server-side (Build Plan §7). */
export const roleEnum = pgEnum('role', [
  'owner_operator', // cross-center, the buyer persona
  'center_director', // runs one facility
  'office_admin', // enrollment/billing/messaging at one facility
  'teacher', // check-in/out, daily logs, room-scoped
  'guardian', // own children only
]);

export const ageBandEnum = pgEnum('age_band', ['infant', 'toddler', 'preschool', 'school_age']);

/** PRD §9.2 workflow 1 pipeline stages. */
export const enrollmentStatusEnum = pgEnum('enrollment_status', [
  'inquiry',
  'tour_scheduled',
  'waitlisted',
  'application',
  'paperwork', // digital paperwork + e-signature in progress
  'active',
  'withdrawn',
]);

export const attendanceTypeEnum = pgEnum('attendance_type', ['check_in', 'check_out']);

export const dailyRecordTypeEnum = pgEnum('daily_record_type', [
  'meal',
  'nap',
  'diaper',
  'bathroom',
  'incident',
  'note',
  'photo',
]);

export const documentTypeEnum = pgEnum('document_type', [
  'immunization', // FL DH 680
  'emergency_contacts',
  'authorized_pickups',
  'enrollment_agreement',
  'medical',
  'incident_report',
  'staff_screening',
  'staff_certification',
  'other',
]);

export const certificationTypeEnum = pgEnum('certification_type', [
  'background_screening', // FL Level 2 — 5-year rescreen
  'cpr',
  'first_aid',
  'training_hours',
  'director_credential',
  'other',
]);

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'open',
  'paid',
  'past_due',
  'void',
]);

export const transactionTypeEnum = pgEnum('transaction_type', [
  'charge',
  'payment',
  'refund',
  'credit',
  'late_fee',
]);

export const threadScopeEnum = pgEnum('thread_scope', [
  'child', // guardians of one child + staff
  'group', // one room
  'facility', // one center broadcast
  'tenant', // cross-center announcement (owner/operator)
]);

export const auditActionEnum = pgEnum('audit_action', ['read', 'create', 'update', 'delete', 'login', 'export']);

// ---------------------------------------------------------------------------
// Shared column helpers
// ---------------------------------------------------------------------------

const id = () => uuid('id').primaryKey().defaultRandom();
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

// ---------------------------------------------------------------------------
// Tenancy
// ---------------------------------------------------------------------------

/** The multi-location operator (PRD §4.1). Selects its compliance rule pack by state. */
export const tenants = pgTable('tenants', {
  id: id(),
  name: text('name').notNull(),
  slug: varchar('slug', { length: 64 }).notNull().unique(),
  /** Two-letter state code; FK to compliance_rules.state (rule pack lookup). */
  state: varchar('state', { length: 2 }).notNull(),
  /** Flat per-center plan (PRD §11). Dollar amount deliberately undecided → nullable. */
  planName: text('plan_name').notNull().default('standard'),
  perCenterMonthlyCents: integer('per_center_monthly_cents'),
  branding: jsonb('branding').$type<{ primaryColor?: string; logoUrl?: string }>(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** A center. Everything operational is facility-scoped by default (PRD §9.3). */
export const facilities = pgTable(
  'facilities',
  {
    id: id(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** Florida DCF license number, if known. */
    licenseNumber: text('license_number'),
    addressLine1: text('address_line1'),
    addressLine2: text('address_line2'),
    city: text('city'),
    state: varchar('state', { length: 2 }),
    postalCode: varchar('postal_code', { length: 10 }),
    timezone: text('timezone').notNull().default('America/New_York'),
    /** Licensed capacity (total children). */
    licensedCapacity: integer('licensed_capacity'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('facilities_tenant_idx').on(t.tenantId)],
);

/** A classroom/room. Holds its age band; ratio max comes from the rule pack. */
export const groups = pgTable(
  'groups',
  {
    id: id(),
    facilityId: uuid('facility_id')
      .notNull()
      .references(() => facilities.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    ageBand: ageBandEnum('age_band').notNull(),
    /** Room capacity (physical), distinct from ratio-derived capacity. */
    capacity: integer('capacity'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('groups_facility_idx').on(t.facilityId)],
);

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

/**
 * Login identity. One row per human who can sign in (staff or guardian).
 * Role assignment is via `memberships`, so one user can be a director at
 * two centers, or a teacher who is also a guardian.
 */
export const users = pgTable('users', {
  id: id(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/**
 * Role-scoped membership: user × tenant × (optional facility) × role.
 * facilityId NULL ⇒ tenant-wide (only meaningful for owner_operator).
 * Guardians get a membership with role='guardian' and scope via person_guardians.
 */
export const memberships = pgTable(
  'memberships',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    facilityId: uuid('facility_id').references(() => facilities.id, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('memberships_unique').on(t.userId, t.tenantId, t.facilityId, t.role),
    index('memberships_user_idx').on(t.userId),
    index('memberships_facility_idx').on(t.facilityId),
  ],
);

/** Staff profile — belongs to a tenant, assignable to facilities/groups (Build Plan §3). */
export const staff = pgTable(
  'staff',
  {
    id: id(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    /** Home facility; cross-facility reassignment is a stretch goal (PRD §9.3). */
    facilityId: uuid('facility_id').references(() => facilities.id, { onDelete: 'set null' }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    title: text('title'),
    hireDate: date('hire_date'),
    /** FL: Level 2 screening required at ≥10 child-contact hours/week. */
    weeklyChildContactHours: integer('weekly_child_contact_hours').notNull().default(40),
    /** Counts toward ratio when on the floor. */
    countsTowardRatio: boolean('counts_toward_ratio').notNull().default(true),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('staff_tenant_idx').on(t.tenantId), index('staff_facility_idx').on(t.facilityId)],
);

export const staffGroupAssignments = pgTable(
  'staff_group_assignments',
  {
    staffId: uuid('staff_id')
      .notNull()
      .references(() => staff.id, { onDelete: 'cascade' }),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    isPrimary: boolean('is_primary').notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.staffId, t.groupId] })],
);

/**
 * Certifications & screenings (Build Plan §3). Background-screening rows carry
 * the FL 5-year rescreen date in expiresAt; the compliance service computes
 * "ratio-critical lapse" from certification_type + rule pack.
 */
export const certifications = pgTable(
  'certifications',
  {
    id: id(),
    staffId: uuid('staff_id')
      .notNull()
      .references(() => staff.id, { onDelete: 'cascade' }),
    type: certificationTypeEnum('type').notNull(),
    /** e.g. "Level 2", "CPR/AED Adult+Pediatric" */
    label: text('label'),
    issuedAt: date('issued_at'),
    expiresAt: date('expires_at'),
    /** Screening clearinghouse / provider reference, when applicable. */
    referenceNumber: text('reference_number'),
    documentId: uuid('document_id'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('certifications_staff_idx').on(t.staffId), index('certifications_expiry_idx').on(t.expiresAt)],
);

/** A child. Age band / ratio bucket is derived from dob at query time. */
export const people = pgTable(
  'people',
  {
    id: id(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    preferredName: text('preferred_name'),
    dob: date('dob').notNull(),
    /** Free-text, minimum-necessary (Build Plan §7). Structured medical goes in documents. */
    allergiesNote: text('allergies_note'),
    photoConsent: boolean('photo_consent').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('people_tenant_idx').on(t.tenantId)],
);

export const guardians = pgTable(
  'guardians',
  {
    id: id(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    /** Set when the guardian has a login. */
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email'),
    phone: text('phone'),
    /** TCPA: explicit SMS consent must be captured before any SMS logic ships (START_HERE open item). */
    smsConsentAt: timestamp('sms_consent_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('guardians_tenant_idx').on(t.tenantId), index('guardians_user_idx').on(t.userId)],
);

/** Guardian ⇄ child link with relationship + permissions (authorized pickup, billing). */
export const personGuardians = pgTable(
  'person_guardians',
  {
    personId: uuid('person_id')
      .notNull()
      .references(() => people.id, { onDelete: 'cascade' }),
    guardianId: uuid('guardian_id')
      .notNull()
      .references(() => guardians.id, { onDelete: 'cascade' }),
    relationship: text('relationship').notNull(), // mother, father, grandparent, ...
    isPrimary: boolean('is_primary').notNull().default(false),
    /** Check-out requires an authorized-pickup match (PRD §9.2 workflow 2). */
    isAuthorizedPickup: boolean('is_authorized_pickup').notNull().default(true),
    isBillingContact: boolean('is_billing_contact').notNull().default(false),
    isEmergencyContact: boolean('is_emergency_contact').notNull().default(true),
  },
  (t) => [primaryKey({ columns: [t.personId, t.guardianId] })],
);

// ---------------------------------------------------------------------------
// Enrollment & attendance
// ---------------------------------------------------------------------------

/** Links a person to a facility/group over time (Build Plan §3). */
export const enrollments = pgTable(
  'enrollments',
  {
    id: id(),
    personId: uuid('person_id')
      .notNull()
      .references(() => people.id, { onDelete: 'cascade' }),
    facilityId: uuid('facility_id')
      .notNull()
      .references(() => facilities.id, { onDelete: 'cascade' }),
    groupId: uuid('group_id').references(() => groups.id, { onDelete: 'set null' }),
    status: enrollmentStatusEnum('status').notNull().default('inquiry'),
    /** Date the child first attends / paperwork clock starts (FL DH 680: 30 days). */
    startDate: date('start_date'),
    endDate: date('end_date'),
    /** Where the lead came from (website, referral, walk-in...). */
    source: text('source'),
    notes: text('notes'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('enrollments_facility_status_idx').on(t.facilityId, t.status),
    index('enrollments_person_idx').on(t.personId),
  ],
);

/**
 * Append-only check-in/out events. Live ratio = (children with last event
 * check_in per group) vs (staff on duty in that group). Build Plan §4 (2).
 */
export const attendanceEvents = pgTable(
  'attendance_events',
  {
    id: id(),
    personId: uuid('person_id')
      .notNull()
      .references(() => people.id, { onDelete: 'cascade' }),
    facilityId: uuid('facility_id')
      .notNull()
      .references(() => facilities.id, { onDelete: 'cascade' }),
    groupId: uuid('group_id').references(() => groups.id, { onDelete: 'set null' }),
    type: attendanceTypeEnum('type').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    /** Staff member who recorded it. */
    recordedByStaffId: uuid('recorded_by_staff_id').references(() => staff.id, { onDelete: 'set null' }),
    /** For check_out: the guardian who picked up — must be an authorized pickup. */
    pickupGuardianId: uuid('pickup_guardian_id').references(() => guardians.id, { onDelete: 'set null' }),
    /** Offline-first: client-generated id for idempotent sync (PRD §12). */
    clientEventId: uuid('client_event_id'),
    syncedAt: timestamp('synced_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index('attendance_facility_time_idx').on(t.facilityId, t.occurredAt),
    index('attendance_person_time_idx').on(t.personId, t.occurredAt),
    uniqueIndex('attendance_client_event_unique').on(t.clientEventId),
  ],
);

/** Staff on-the-floor presence — needed for the ratio denominator. */
export const staffAttendanceEvents = pgTable(
  'staff_attendance_events',
  {
    id: id(),
    staffId: uuid('staff_id')
      .notNull()
      .references(() => staff.id, { onDelete: 'cascade' }),
    facilityId: uuid('facility_id')
      .notNull()
      .references(() => facilities.id, { onDelete: 'cascade' }),
    groupId: uuid('group_id').references(() => groups.id, { onDelete: 'set null' }),
    type: attendanceTypeEnum('type').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (t) => [index('staff_attendance_facility_time_idx').on(t.facilityId, t.occurredAt)],
);

/** Shift schedule — validated server-side against ratio needs + cert lapses (Build Plan §4 (6)). */
export const shifts = pgTable(
  'shifts',
  {
    id: id(),
    staffId: uuid('staff_id')
      .notNull()
      .references(() => staff.id, { onDelete: 'cascade' }),
    facilityId: uuid('facility_id')
      .notNull()
      .references(() => facilities.id, { onDelete: 'cascade' }),
    groupId: uuid('group_id').references(() => groups.id, { onDelete: 'set null' }),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('shifts_facility_time_idx').on(t.facilityId, t.startsAt),
    check('shifts_time_order', sql`${t.endsAt} > ${t.startsAt}`),
  ],
);

// ---------------------------------------------------------------------------
// Daily records & documents
// ---------------------------------------------------------------------------

/**
 * Timestamped entries (meal/nap/diaper/incident/note). `data` is typed per
 * record type in src/modules/daily-records/types.ts. Incident required fields
 * are configurable per state via the rule pack (Build Plan §5 open item).
 */
export const dailyRecords = pgTable(
  'daily_records',
  {
    id: id(),
    personId: uuid('person_id')
      .notNull()
      .references(() => people.id, { onDelete: 'cascade' }),
    facilityId: uuid('facility_id')
      .notNull()
      .references(() => facilities.id, { onDelete: 'cascade' }),
    groupId: uuid('group_id').references(() => groups.id, { onDelete: 'set null' }),
    type: dailyRecordTypeEnum('type').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    authorStaffId: uuid('author_staff_id').references(() => staff.id, { onDelete: 'set null' }),
    data: jsonb('data').notNull().$type<Record<string, unknown>>(),
    /** Incident workflow: guardian notified / e-signed (PRD §9.2 workflow 5). */
    guardianNotifiedAt: timestamp('guardian_notified_at', { withTimezone: true }),
    guardianSignedAt: timestamp('guardian_signed_at', { withTimezone: true }),
    clientEventId: uuid('client_event_id'),
    syncedAt: timestamp('synced_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('daily_records_person_time_idx').on(t.personId, t.occurredAt),
    index('daily_records_facility_type_time_idx').on(t.facilityId, t.type, t.occurredAt),
    uniqueIndex('daily_records_client_event_unique').on(t.clientEventId),
  ],
);

/** Uploaded files with retention metadata. Exactly one of personId/staffId is set. */
export const documents = pgTable(
  'documents',
  {
    id: id(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').references(() => people.id, { onDelete: 'cascade' }),
    staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'cascade' }),
    type: documentTypeEnum('type').notNull(),
    /** e.g. "DH 680" */
    formCode: text('form_code'),
    fileName: text('file_name').notNull(),
    mimeType: text('mime_type').notNull(),
    /** Object-storage key (S3/GCS); never a public URL. */
    storageKey: text('storage_key').notNull(),
    sizeBytes: integer('size_bytes'),
    /** Document validity (e.g. immunization expiry). */
    effectiveAt: date('effective_at'),
    expiresAt: date('expires_at'),
    /** NULL ⇒ retain indefinitely (FL default, PRD §10). */
    retainUntil: date('retain_until'),
    uploadedByUserId: uuid('uploaded_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
  },
  (t) => [
    index('documents_person_idx').on(t.personId),
    index('documents_staff_idx').on(t.staffId),
    check('documents_owner_xor', sql`(${t.personId} IS NULL) <> (${t.staffId} IS NULL)`),
  ],
);

// ---------------------------------------------------------------------------
// Billing (family tuition — separate from the tenant's platform subscription)
// ---------------------------------------------------------------------------

export const billingAccounts = pgTable(
  'billing_accounts',
  {
    id: id(),
    facilityId: uuid('facility_id')
      .notNull()
      .references(() => facilities.id, { onDelete: 'cascade' }),
    /** The family's billing contact. */
    guardianId: uuid('guardian_id')
      .notNull()
      .references(() => guardians.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    /** Recurring tuition: amount + cadence. Per-child lines live on invoices. */
    tuitionCents: integer('tuition_cents').notNull().default(0),
    billingCadence: text('billing_cadence').notNull().default('monthly'), // weekly|biweekly|monthly
    autopayEnabled: boolean('autopay_enabled').notNull().default(false),
    /** Stripe customer id — populated in roadmap step 8, NULL until then. */
    stripeCustomerId: text('stripe_customer_id'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('billing_accounts_facility_idx').on(t.facilityId)],
);

export const invoices = pgTable(
  'invoices',
  {
    id: id(),
    billingAccountId: uuid('billing_account_id')
      .notNull()
      .references(() => billingAccounts.id, { onDelete: 'cascade' }),
    facilityId: uuid('facility_id')
      .notNull()
      .references(() => facilities.id, { onDelete: 'cascade' }),
    number: text('number').notNull(),
    status: invoiceStatusEnum('status').notNull().default('draft'),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    dueDate: date('due_date').notNull(),
    subtotalCents: integer('subtotal_cents').notNull().default(0),
    lateFeeCents: integer('late_fee_cents').notNull().default(0),
    totalCents: integer('total_cents').notNull().default(0),
    paidCents: integer('paid_cents').notNull().default(0),
    lineItems: jsonb('line_items')
      .notNull()
      .$type<Array<{ personId?: string; description: string; amountCents: number }>>()
      .default(sql`'[]'::jsonb`),
    issuedAt: timestamp('issued_at', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('invoices_number_unique').on(t.facilityId, t.number),
    index('invoices_account_idx').on(t.billingAccountId),
    index('invoices_facility_status_idx').on(t.facilityId, t.status),
  ],
);

export const transactions = pgTable(
  'transactions',
  {
    id: id(),
    billingAccountId: uuid('billing_account_id')
      .notNull()
      .references(() => billingAccounts.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'set null' }),
    type: transactionTypeEnum('type').notNull(),
    amountCents: integer('amount_cents').notNull(),
    /** 'simulated' until Stripe is wired in (Build Plan §6 step 5 vs 8). */
    method: text('method').notNull().default('simulated'),
    externalRef: text('external_ref'),
    memo: text('memo'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (t) => [index('transactions_account_time_idx').on(t.billingAccountId, t.occurredAt)],
);

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

/** Routed by child/room so guardians only see their own child's threads (PRD §9.2 workflow 7). */
export const threads = pgTable(
  'threads',
  {
    id: id(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    facilityId: uuid('facility_id').references(() => facilities.id, { onDelete: 'cascade' }),
    scope: threadScopeEnum('scope').notNull(),
    personId: uuid('person_id').references(() => people.id, { onDelete: 'cascade' }),
    groupId: uuid('group_id').references(() => groups.id, { onDelete: 'cascade' }),
    subject: text('subject'),
    /** Emergency broadcast override / cross-center announcement flag. */
    isBroadcast: boolean('is_broadcast').notNull().default(false),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index('threads_facility_idx').on(t.facilityId),
    index('threads_person_idx').on(t.personId),
    index('threads_group_idx').on(t.groupId),
  ],
);

export const messages = pgTable(
  'messages',
  {
    id: id(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => threads.id, { onDelete: 'cascade' }),
    senderUserId: uuid('sender_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    body: text('body').notNull(),
    attachments: jsonb('attachments').$type<Array<{ documentId: string }>>(),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('messages_thread_time_idx').on(t.threadId, t.sentAt)],
);

// ---------------------------------------------------------------------------
// Compliance & audit
// ---------------------------------------------------------------------------

/**
 * State rule packs as data, not code (PRD §10, Build Plan §5).
 * `pack` is validated against src/compliance/schema.ts (Zod) on load.
 * Adding a state = inserting a row. Versioned so rule changes are auditable.
 */
export const complianceRules = pgTable(
  'compliance_rules',
  {
    state: varchar('state', { length: 2 }).notNull(),
    version: integer('version').notNull().default(1),
    effectiveFrom: date('effective_from').notNull(),
    pack: jsonb('pack').notNull().$type<unknown>(),
    /** Citation list, kept alongside the data so every rule is traceable. */
    sources: jsonb('sources').notNull().$type<Array<{ title: string; url: string }>>(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.state, t.version] })],
);

/**
 * Append-only. Covers every read AND write to child records (Build Plan §7).
 * No updatedAt, no FK cascades — rows must outlive what they describe.
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    facilityId: uuid('facility_id'),
    actorUserId: uuid('actor_user_id'),
    action: auditActionEnum('action').notNull(),
    /** Table name of the touched entity. */
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id'),
    /** For updates: a before/after diff of changed fields (never full PII dumps). */
    diff: jsonb('diff').$type<Record<string, { before: unknown; after: unknown }>>(),
    ip: text('ip'),
    userAgent: text('user_agent'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('audit_tenant_time_idx').on(t.tenantId, t.occurredAt),
    index('audit_entity_idx').on(t.entityType, t.entityId),
    index('audit_actor_idx').on(t.actorUserId),
  ],
);

// Convenience type exports
export type Tenant = typeof tenants.$inferSelect;
export type Facility = typeof facilities.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type User = typeof users.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Staff = typeof staff.$inferSelect;
export type Certification = typeof certifications.$inferSelect;
export type Person = typeof people.$inferSelect;
export type Guardian = typeof guardians.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type AttendanceEvent = typeof attendanceEvents.$inferSelect;
export type DailyRecord = typeof dailyRecords.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Thread = typeof threads.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type ComplianceRule = typeof complianceRules.$inferSelect;
export type AuditEntry = typeof auditLog.$inferSelect;
export type Role = (typeof roleEnum.enumValues)[number];
export type AgeBand = (typeof ageBandEnum.enumValues)[number];
