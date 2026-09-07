# Configurable Operations Platform — Foundational Design Spec & UX Architecture Blueprint

Prepared for Gene · August 31, 2026
Status: Foundational spec — precedes wireframes, prototype, and Figma build

---

## How to use this document (for other chats/sessions working on this project)

This is the shared reference brief for a single ongoing project: a configurable, multi-industry operations platform, launching with childcare as the first industry pack. If you are a different Claude session, designer, or collaborator picking this project up, read this section first.

**Confirmed decisions so far:**
- Long-term vision: one core platform, configurable per industry via "industry packs" (Section 4), not a single-purpose product.
- Near-term target user: **childcare industry** (Section 11) — build and validate this vertical before attempting schools or hospitals.
- Accessibility standard: **WCAG 2.2 AA**, designed in from the start, not retrofitted (Section 7).
- Deliverable so far: this foundational spec only — no wireframes, prototype, or Figma file exist yet (Section 8, Section 11 open questions).

**Core recurring patterns to reuse in any downstream work:**
- The universal-primitive table (Section 2) and core data model (Section 5) — use these entity names and mappings rather than inventing new ones per vertical.
- Core engine + industry pack + tenant layering (Section 4) — every new feature should be sorted into one of these three layers before being designed or built.
- Shared UX shell with swappable, pack-driven module sets (Section 6) — don't design a bespoke navigation structure per vertical.

**Key recommendations to carry forward:**
- Differentiate the childcare pack on accessibility, transparent pricing, offline reliability, and real support SLAs (Section 9) — every competitor researched is weak on at least one of these.
- Treat compliance (HIPAA/FERPA/state licensing) as architectural, not a feature toggle (Sections 3–4, 8) — this determines infrastructure decisions, not just UI.
- Don't build the second industry vertical until the childcare pack has been built and has produced real friction to learn from (Section 11).

**What NOT to assume:** don't assume Figma design work has started (Section 8 — the connector available in this project is read-only), and don't assume the hospital vertical's clinical scope has been decided (still an open question, Section 11).

---

## 1. Vision

Build one core software platform — shared data model, shared UX shell, shared accessibility and compliance foundation — that can be configured into a purpose-built vertical product for different industries (childcare centers, schools, hospitals/clinics, and others) without rebuilding the system from scratch each time.

This is the same architectural pattern used by vertical-agnostic platforms like ServiceNow, Salesforce, or Mindbody: one engine, many "industry packs." It is a materially different — and materially harder — project than building a single childcare competitor to Procare, Smartcare, or Playground. Section 8 (Risks) explains why, and gives a recommended phasing to make it achievable.

---

## 2. What's genuinely common across industries (the core)

Every operational vertical we're targeting — childcare, K-12 schools, hospitals/clinics — shares the same underlying shape, even though the vocabulary differs:

| Universal primitive | Childcare example | School example | Hospital/clinic example |
|---|---|---|---|
| **Person record** | Child + guardians | Student + guardians | Patient |
| **Facility/location** | Center, room | School, classroom | Hospital, unit/floor, bed |
| **Enrollment / admission** | Enrollment, waitlist | Enrollment, registration | Admission, scheduling |
| **Attendance / visit tracking** | Check-in/out | Attendance | Visit, check-in, discharge |
| **Staff-to-person ratio / capacity** | Staff-to-child ratio | Class size | Nurse-to-patient ratio, bed capacity |
| **Daily record / activity log** | Meals, naps, activities | Grades, behavior notes | Clinical notes, vitals, charting |
| **Billing & payments** | Tuition | Fees (lunch, activities) | Insurance claims, co-pays |
| **Messaging / communication** | Family messaging | Parent-teacher messaging | Patient/family communication |
| **Documents & records** | Immunizations, forms | IEPs, records | Medical records, consent forms |
| **Staff management** | Scheduling, certifications | Scheduling, credentials | Shift scheduling, licensure |
| **Compliance/reporting** | State licensing | State education reporting | HIPAA, Joint Commission, state health dept |
| **Reporting/analytics** | Occupancy, revenue | Attendance, performance | Census, utilization, billing |

This table is the single most important artifact in this document — it's the basis for the shared data model in Section 5. The core platform should be built against the **left-hand column** (the universal primitive), with each industry pack supplying its own vocabulary, workflow rules, and compliance layer on top.

---

## 3. What must NOT be shared (the hard part)

This is where a one-size-fits-all platform breaks if it isn't designed carefully:

- **Regulatory frameworks are not just "different rules" — they're different legal regimes.** Childcare licensing is state-by-state administrative law. Schools are governed by FERPA (student record privacy) and IDEA (special education). Hospitals are governed by HIPAA (protected health information), and depending on scope, potentially Joint Commission accreditation standards and CMS conditions of participation. A childcare-grade security posture is not sufficient for a hospital; building healthcare features means the whole platform inherits HIPAA obligations (Business Associate Agreements, audit logging, breach notification, encryption-at-rest requirements) even for the childcare and school tenants sharing the same codebase.
- **Clinical workflows are categorically different from operational workflows.** A hospital module touching anything clinical (charting, medication administration, vitals) is a different product with different liability exposure than attendance and billing. If "hospitals" in your vision means the *administrative/operational* side (visitor management, scheduling, non-clinical patient communication, billing) rather than clinical/EHR functionality, the platform is far more feasible. This needs to be pinned down before design goes further (see Section 8 and the open question at the end).
- **Buyer and end-user personas differ sharply.** A childcare director evaluating software cares about parent engagement and licensing headaches. A hospital administrator cares about compliance risk and integration with existing clinical systems (Epic, Cerner). A school administrator cares about integration with a Student Information System (SIS) and state reporting. Marketing, sales, and onboarding flows will need to be industry-specific even though the underlying product is shared.
- **Terminology must be fully abstracted, not hardcoded.** "Child" vs "student" vs "patient," "guardian" vs "parent" vs "next of kin," "center" vs "school" vs "facility" — every user-facing string needs to route through an industry-configuration layer rather than being hardcoded, or the product will feel wrong to every vertical except whichever one was built first.

---

## 4. Recommended architecture pattern

**Core engine + industry packs**, configuration-as-data rather than configuration-as-code:

- **Core engine**: person records, relationships, locations, scheduling/attendance, billing ledger, messaging, document storage, permissions/roles, audit logging, reporting engine. Industry-agnostic, built once.
- **Industry pack** (data-driven configuration, not a fork): terminology/localization strings, required fields and validation rules, compliance rule sets (e.g., ratio calculation logic, required document types, retention periods), workflow templates (e.g., daily log fields for childcare vs. discharge summary fields for a clinic), default report templates, and branding.
- **Tenant layer**: each customer (a specific center, school, or hospital unit) selects an industry pack and further customizes within the bounds that pack allows — colors/logo, custom fields, specific compliance jurisdiction (state).
- **Compliance boundary is architectural, not cosmetic.** If a hospital tenant is provisioned, the platform must enforce HIPAA-grade controls (encryption, audit trails, access logging, BAA-eligible infrastructure) at the infrastructure level for that tenant's data — this can't be a settings toggle bolted onto a childcare-grade backend. Practically, this likely means hospital/clinical tenants sit on a stricter infrastructure tier than childcare/school tenants from day one.

---

## 5. Core data model (foundational entities)

This is deliberately industry-agnostic. Names below are the *internal* model; industry packs remap these to user-facing terms (e.g., `Person` → "Child" in the childcare pack, "Patient" in the hospital pack).

- **Tenant** — the customer organization; holds industry pack selection, jurisdiction/state, branding, compliance tier.
- **Facility** — physical or logical location(s) under a tenant (a center, a school building, a clinic).
- **Group** — a subdivision of a facility (classroom, grade, unit/ward).
- **Person** — the primary care/service recipient (child, student, patient), with relationships to...
- **Guardian/Related Party** — linked people with defined relationship types and access permissions.
- **Staff** — employees/caregivers, with role, certifications/licensure, and assigned groups.
- **Enrollment/Admission** — the record linking a Person to a Facility/Group over a time period, with status (waitlisted, active, discharged/withdrawn).
- **Attendance/Visit Event** — timestamped check-in/out or visit record, tied to Person + Facility + Staff-on-duty.
- **Daily Record** — flexible, industry-pack-defined structured log entry (meal/nap for childcare; grade/behavior for school; vitals/note for clinic) tied to a Person and timestamp.
- **Document** — uploaded or generated file tied to a Person or Staff, with type, retention rule, and access-control list.
- **Billing Account / Ledger / Transaction** — financial records tied to a Person or Guardian.
- **Message / Thread** — communication records tied to People, Guardians, and Staff.
- **Compliance Rule** — industry-pack-defined rule (e.g., ratio thresholds, required document types, retention periods) evaluated against live data to drive alerts.
- **Audit Log** — immutable record of who accessed or changed what, required universally but enforced most strictly for HIPAA-tier tenants.

---

## 6. UX architecture

### 6.1 Shared shell, swappable modules
Every tenant gets the same navigational skeleton — sidebar with primary sections, a top bar with facility/location switcher, notification and profile controls — but the sidebar's *labels and module set* are driven by the industry pack. This keeps the product feeling coherent across verticals while letting each one surface only what's relevant (a childcare tenant doesn't see "clinical notes"; a hospital tenant doesn't see "meal planning").

### 6.2 Core personas across every industry pack
1. **Administrator/Director** — oversees the facility, compliance, billing, staffing. Needs dashboards, reporting, alerts.
2. **Frontline staff** — caregiver, teacher, nurse. Needs fast, low-friction daily workflows (check-in, logging, messaging) — this persona is the most time-pressured and the one most legacy platforms (per our Procare/Playground research) get right on desktop but fail on mobile.
3. **Client/family** — guardian, patient, family member. Needs a simple, mobile-first view: schedule, messages, billing, and relevant records — deliberately limited compared to staff views.

### 6.3 Core information architecture (applies to every industry pack)
- Dashboard (role-specific summary)
- People directory (children/students/patients + guardians)
- Attendance/visit tracking
- Scheduling (staff and/or service scheduling)
- Daily records / activity logs (industry-specific fields)
- Messaging
- Billing & payments
- Documents & compliance
- Staff management
- Reporting

This mirrors the MVP structure already validated in our earlier childcare-specific prototype (dashboard, check-in/out, families, billing, messages, daily logs, staff/scheduling) — that prototype effectively **is** a fully-built-out example of one industry pack (childcare) instantiated from this shared architecture. It's a useful reference point once we resume prototype work.

---

## 7. Accessibility foundation (WCAG 2.2 AA, by design decision)

Since this is being decided at the foundation stage rather than retrofitted (unlike all three competitors researched, per Section 9), these rules should be treated as non-negotiable constraints on the design system, not aspirational guidelines:

- **Color contrast**: minimum 4.5:1 for normal text, 3:1 for large text and UI components, verified for every token pair in the design system before a single screen is built.
- **Keyboard navigation**: every interactive element reachable and operable via keyboard alone, with a visible focus indicator (WCAG 2.2 adds explicit focus-appearance minimums beyond 2.1).
- **Target size**: interactive targets at least 24×24px (WCAG 2.2 new criterion) — directly relevant given how dense some competitor screens are (e.g., dense tables of children/rooms/invoices).
- **Text alternatives**: mandatory alt text fields for all uploaded images (Procare explicitly flags this as an unresolved gap in their own accessibility statement — this is a direct opportunity to differentiate).
- **Forms and errors**: labeled fields, clear inline error identification and suggestions (not color-alone), and no reliance on placeholder text as a label substitute.
- **Screen reader support**: semantic HTML/ARIA roles throughout, tested with at least one screen reader (VoiceOver or NVDA) as part of QA, not just automated scanning.
- **Motion and animation**: respect `prefers-reduced-motion`; no essential information conveyed only through animation.
- **Consistent navigation and predictability**: required across an industry-pack system specifically because layouts shift per vertical — the *shell* must stay predictable even when *module content* changes.
- **Formal conformance testing**: automated scanning (axe, Lighthouke) catches roughly 30-40% of issues; manual audit and assistive-technology testing are required for genuine WCAG 2.2 AA conformance — budget for this as a real workstream, not a design checkbox.

Note the compliance-vs-accessibility distinction: WCAG is about *usability for people with disabilities* and applies to every industry pack. HIPAA/FERPA/state licensing are about *data privacy and regulatory reporting* and differ sharply per industry (Section 3). Both need to be foundational, but they are separate concerns solved by different mechanisms.

---

## 8. Key risks and limitations (read before scoping further)

- **Industry breadth is the single biggest risk to this project succeeding.** Childcare, schools, and hospitals are each large, mature software categories with entrenched, specialized incumbents (Procare/Playground for childcare; PowerSchool/Infinite Campus for K-12; Epic/Cerner for hospitals). A platform that tries to be credible in all three simultaneously, from a standing start, is a multi-year, well-capitalized undertaking even with the shared-core architecture in Section 4 — not something that gets designed and validated as a side project. This isn't a reason not to pursue it, but the phasing in the recommendation below matters.
- **"Hospitals" needs precise scoping.** If it means clinical/EHR functionality, that's a fundamentally different (and far more regulated, far more liability-exposed) product than the operational/administrative layer described in this document. Recommend explicitly excluding clinical/EHR scope unless that's genuinely intended — see the open question below.
- **Compliance work is not deferrable.** Unlike features, which can be added incrementally, the HIPAA-grade infrastructure decisions (audit logging, encryption, access controls, BAA-eligible hosting) have to be architected in from the first hospital-tenant line of code — retrofitting compliance after the fact is one of the most common and expensive mistakes in vertical SaaS.
- **The Figma connector available in this session is read-only** (see our earlier discussion) — it can pull specs and generate code from an existing Figma file, but can't generate a new Figma file from this spec directly. Turning this document into an actual Figma file will need either manual Figma work (by you or a designer, using this spec as the brief) or a different tool/workflow than what's connected here.
- **This document is a foundation, not a finished IA or wireframe set.** Per your direction, the actual screen-level UX architecture, wireframes, and prototype are intentionally deferred to a follow-up session once the scope questions below are resolved — building those before the industry-scope question is answered risks having to redo them.

---

## 9. All-in-one childcare competitive landscape (near-term target vertical)

Childcare is now confirmed as the near-term target user (see Section 11). This section widens the research beyond Procare / Aaniie(Smartcare) / Playground to the rest of the "all-in-one" childcare category, so the childcare industry pack is designed against the full competitive field, not just three players.

| Platform | Positioning | Notable strengths (from their own sites) | Notable gaps / openings |
|---|---|---|---|
| **Procare** | Category incumbent, 30 yrs, 40,000+ centers | Deep financial/compliance features, new AI enrollment tool (RoomRunner), live phone support | Desktop app is Windows-only (not compatible with tablets, phones, or ARM Macs per their own accessibility statement); dated UI reported in reviews |
| **Aaniie (formerly Smartcare)** | Rebranded, now split into Aaniie Care (home/senior care) and Aaniie Kids | Strong for placement/staffing agencies (bookings, ATS, CRM, payroll) | No longer serves classroom-based centers the way it used to — a gap in the "traditional Smartcare" space that a modern classroom-based entrant can fill |
| **Playground** | Modern challenger, 500,000+ claimed users | Transparent security page, new AI feature "Camber," broad module set (marketing, predictive enrollment, API) | **No public accessibility/WCAG statement found anywhere on their site** — a clear, low-cost trust gap to close |
| **Brightwheel** | Self-described "#1 childcare management software," Shark Tank alumnus | Very strong support metrics (live chat under 30 seconds, 1:1 onboarding, AI assistant for support), heavy quantified ROI marketing (savings calculator), broad feature set incl. payroll, CACFP menus, professional development/CDA credit | Marketing-heavy site leans hard on lead-gen forms and ROI calculators; no accessibility statement found in the fetched footer (only Security & Safety) |
| **Famly** | UK/Ireland-focused, "Early Childhood Platform," 1M+ users | Strong EYFS-specific curriculum tooling, occupancy prediction, staffing/ratio automation, well-regarded customer support (called out repeatedly in testimonials) | UK-market-specific (EYFS framework) — not a direct US structural competitor, but its curriculum/observation UX patterns are worth studying for the "learning" module |
| **Lillio (formerly HiMama)** | Curriculum-led, 35,000+ customers, partnered with Funshine Express curriculum | Strong professional development angle (CEUs, Lillio Academy), does publish an accessibility page | Their published "Accessibility Policy" is actually an **Ontario AODA legal-compliance policy**, not a genuine product WCAG audit — it commits only to WCAG **2.0** Level AA (an older, less strict standard than 2.1 or 2.2) and is scoped to Canadian legal obligations. This is a good example of an accessibility statement that looks substantive but is narrower than it first appears — worth avoiding that pattern ourselves. |

**What this widened field confirms for the childcare industry pack:**

- **Nobody in the category has a genuine, current (WCAG 2.1/2.2) accessibility commitment.** Procare is honestly partial; Lillio's statement is real but outdated and jurisdiction-limited; Playground and Brightwheel appear to have none published at all. This is the single clearest, most defensible differentiator available — not just a design nicety.
- **Support responsiveness is a competitive battleground, not a footnote.** Brightwheel, Famly, and Procare all lead with support metrics in their own marketing (sub-30-second live chat, 1:1 onboarding coaches, "genuinely care" testimonials). Any new entrant needs a real support-quality plan, not just a support *feature*.
- **AI features are now table stakes at the marketing level** (Procare's RoomRunner, Playground's Camber, Aaniie's Ally Insights) even where the underlying capability is thin. Section 4's industry-pack architecture should treat "AI-assisted admin" as a first-class capability of the core engine (already reflected in Section 3 of the original MVP plan and the earlier prototype), not a bolt-on.
- **Curriculum/learning depth varies a lot** — Lillio and Brightwheel invest heavily here (lesson plans, CDA credit, professional development); Playground and Procare are comparatively billing/ops-first. This is a positioning choice for the childcare pack: compete on ops/compliance/accessibility first, treat curriculum depth as a later differentiator rather than a day-one requirement.

---

## 10. Cross-industry precedent: Mindbody validates the core + industry-pack model

Section 4 proposed a core-engine-plus-industry-packs architecture as a *recommendation*. It's worth being explicit that this is not a novel or unproven pattern — **Mindbody is a real, large-scale example of exactly this model, operating today.**

Mindbody runs one shared platform — payments, scheduling, staff management, marketing, reporting, a branded app/website builder — underneath dozens of named "business types" across three broad verticals: fitness (yoga, gyms, martial arts, Pilates, dance studios...), beauty (salons, barbershops, lash studios...), and wellness (spas, massage, chiropractic, physical therapy...). Each vertical gets its own marketing page and some tailored feature framing, but the underlying scheduling/payments/reporting engine is shared across all of them — 40,000+ businesses, 3M+ active consumer users, all on one core system. They also publish an explicit multi-location/enterprise tier (a corporate dashboard with network-wide reporting) that's directly analogous to Section 4's tenant layer.

Two things from Mindbody's approach are directly reusable for our architecture:

- **Business-type as a first-class configuration concept**, not a marketing label bolted on after the fact — Mindbody's site structure (Business type → Fitness/Wellness/Beauty → specific business type) mirrors exactly the Tenant → Industry Pack → configuration relationship in Section 4.
- **A two-tier multi-location model** — a lighter "datashare" tier for closely related locations that share clients/staff/pricing, and a heavier "Enterprise" tier with a full corporate dashboard and cross-location reporting. This is a useful, already-market-tested pattern for how our Tenant layer (Section 5) should scale from a single center to a multi-site operator.

The important caveat: Mindbody's verticals (fitness/beauty/wellness) are all *low-regulatory-stakes, adult-consumer, appointment-based* businesses. None of them carry anything close to HIPAA, FERPA, or child-specific licensing obligations. So Mindbody proves the **architecture** works at scale — it does not prove that the **compliance boundary problem** described in Sections 3–4 (childcare/school/hospital data sensitivity) is solved by this pattern. That risk is specific to our vertical mix and remains exactly as described in Section 8.

---

## 11. Recommended phasing (confirmed near-term focus: childcare)

Per direction, **the near-term target user is the childcare industry.** Phasing below reflects that decision:

1. **Foundation** (this document) — shared data model, architecture pattern, accessibility standard, competitive landscape.
2. **Build the childcare industry pack as the real, first product** — not a demo. It should be a full instantiation of the Section 4/5 architecture (Tenant, Facility, Person, Enrollment, Attendance, Daily Record, Billing, Message, Compliance Rule, Audit Log all genuinely implemented, not hardcoded to childcare), positioned directly against the six competitors in Section 9, differentiated primarily on: genuine WCAG 2.2 AA accessibility, transparent pricing, offline-first reliability, and real support SLAs.
3. **Generalize from real friction, not assumption.** Only after the childcare pack is built and validated should a second vertical (school, or the non-clinical slice of hospital/administrative operations) be attempted — the friction points found in step 2 will reveal which parts of Section 5's data model were wrong or childcare-specific in disguise.
4. **Expand compliance tier by tier**, adding HIPAA-grade infrastructure only when/if a healthcare-adjacent pack is actually greenlit — see Section 8's warning that this cannot be retrofitted.

---

## 12. Childcare industry pack — detailed workflows & layer specification

Confirmed direction: **no screens or prototype yet.** This section goes one level deeper than Sections 4–6 — from architectural principle to childcare-specific behavior — so that when visual design does start (Figma Make and/or a clickable prototype), it's translating an already-settled structure rather than inventing one on the fly. Positioning is confirmed as **ops/compliance-first** (Section 9), and the v1 prototype scope is confirmed as **single-center**, while the underlying data model remains multi-site-capable from day one — see 12.1.

### 12.1 The layers, applied specifically to childcare

| Layer | What it holds for the childcare pack |
|---|---|
| **Core engine** (Section 4/5, unmodified) | `Person`, `Facility`, `Group`, `Enrollment`, `Attendance/Visit Event`, `Daily Record`, `Document`, `Billing Account/Ledger/Transaction`, `Message/Thread`, `Compliance Rule`, `Audit Log` — all generic, shared with every future vertical. |
| **Childcare industry pack** | Terminology map (`Person`→"Child", `Guardian`→"Parent/Guardian", `Facility`→"Center", `Group`→"Classroom/Room", `Staff`→"Teacher/Caregiver"); the **ratio rules engine** (staff-to-child ratio thresholds by age band, evaluated live against Attendance events); a library of **state compliance rule packs** (see 12.4); default Daily Record field sets (meals, naps, diapering, incidents, mood/behavior); default billing cycle templates (weekly/monthly tuition, late-fee rules, CACFP/subsidy fields); default report templates (attendance summary, ratio compliance log, aging receivables). |
| **Tenant layer** (a specific center) | Selected state/jurisdiction (drives which compliance rule pack applies), branding, room/classroom setup (names, capacity, assigned staff), staff roster, family roster, pricing configuration, and — critically — **the Tenant record already supports owning more than one Facility**, even though v1's UI only exposes a single Facility per tenant. Multi-site is a UI/workflow expansion later (adding the location switcher and cross-site reporting from the Mindbody-precedent pattern in Section 10), not a data-model change. This is what "don't work backwards" means concretely: nothing about shipping single-center UI first requires the underlying Tenant/Facility relationship to be rebuilt later. |

### 12.2 Roles and permissions (v1)

| Role | Can | Cannot |
|---|---|---|
| **Owner/Director** | Everything: enrollment, billing, staff management, compliance dashboard, reporting, tenant settings | — |
| **Office Admin / Assistant Director** | Enrollment, billing, messaging, compliance documents, reporting | Tenant-level settings (branding, state/jurisdiction change), staff termination |
| **Teacher/Caregiver** | Check-in/out for their assigned room(s), daily records, messaging with families in their room(s), view their own schedule | Billing, other rooms' children/families, compliance dashboard, reporting |
| **Family/Guardian** | View their own child(ren)'s records, daily reports, messages, and billing; make payments; update authorized-pickup list | Any other child's data, staff/admin views, anything center-wide |
| *(Post-v1)* **Regional/Corporate Admin** | Cross-site reporting, multi-site staff/billing oversight | Explicitly deferred — flagged here so the permission model doesn't need to be redesigned when multi-site UI is added |

### 12.3 Core workflows

These are the behaviors the childcare pack must support; each becomes one or more screens once visual design starts.

1. **Enrollment**: inquiry/lead → tour scheduling / waitlist placement → application → digital paperwork and e-signature (immunization records, emergency contacts, authorized pickups collected here) → room/classroom assignment → status moves to active. Compliance documents required by the applicable state rule pack must be complete before a child's first Attendance event is allowed.
2. **Daily check-in/out**: staff opens their room view → checks in a child (timestamp, staff-on-duty recorded) → ratio rules engine recalculates that room's live ratio → over-threshold triggers an immediate alert to admin, not just a log entry → guardians can share pickup ETA → check-out requires the picking-up adult to be on the authorized-pickup list (or an override with admin confirmation).
3. **Daily activity log**: staff logs meals, naps, diapering/bathroom, and incidents through the day as discrete, timestamped entries against the Daily Record entity → entries compile automatically into that child's daily report → delivered to guardians at pickup or via the family app view.
4. **Billing cycle**: enrollment status change triggers a recurring tuition schedule → invoices generate automatically on the tenant's configured cycle → payment collection (autopay or manual) → late-payment escalation per configurable rules → subsidy/CACFP-eligible families reconcile against program-specific reporting requirements from the compliance rule pack.
5. **Incident and compliance**: an incident logged by staff enforces required fields from the applicable state compliance rule pack (what must be documented, e.g., injury type, witnesses, notification timing) → guardian is notified and, where required, must e-sign acknowledgment → record is retained per the state's retention period → surfaces directly in the Owner/Director's compliance dashboard so it's ready before a licensing visit, not reconstructed after one.
6. **Staff scheduling and certification**: shift scheduling is checked live against the ratio rules engine for each room's enrolled/expected children → certification records (CPR, first aid, state-required training hours) are tracked with expiration dates → the system alerts before expiry and can block scheduling a staff member into a ratio-critical role if a required certification has lapsed.
7. **Messaging and family engagement**: messages route by child/room so a guardian only ever sees threads relevant to their own child → admin has an emergency broadcast path (closures, alerts) that overrides normal per-room routing.

### 12.4 Making state-by-state compliance configurable, not hardcoded

Since childcare licensing rules vary by state (Section 3), the compliance layer needs to be data, not code: each state gets a **compliance rule pack** — a structured data file defining ratio thresholds by age band, required document types and their retention periods, required incident-report fields, and any state-specific reporting formats. A Tenant selects its state at setup and the correct rule pack applies automatically. Adding a new state later means authoring a new data file against the existing schema, not re-engineering the ratio engine, the compliance dashboard, or the incident workflow. This is the same "core engine vs. configuration" principle from Section 4, applied one level deeper.

### 12.5 Tooling reality check — Figma Make and Claude Design

Two corrections worth making explicit before we lean on either tool:

- **Claude Design** (a ready-made artifact type in some Claude/Cowork environments) **is not available as a tool in this session** — I checked, and only a hosted-HTML artifact tool is exposed here, not a Figma-style design surface. If it's available to you elsewhere (e.g., directly in claude.ai), that's a separate surface I can't drive from inside this project session.
- **Figma Make** (Figma's own AI design/prototyping generator, used by prompting directly inside Figma) is a first-party Figma product feature — it isn't exposed through the Figma MCP connector available here. The connector in this session is the **read-only Dev Mode connector**: it can pull design context, screenshots, tokens, and generate code *from an existing Figma file*, but it cannot drive Figma Make or create new frames itself.

Practical division of labor that actually matches what each tool can do: this document (and its expansions) is the brief. When you're ready to visualize, you drive **Figma Make directly inside Figma**, feeding it sections of this spec (Section 12's workflows are written to be promptable as-is). Once real frames exist in a Figma file, connect it here and I can pull design context/tokens/screenshots through the read-only connector and generate matching production code — closing the loop without needing write access to Figma. Separately, and not mutually exclusive, I can also build fast clickable HTML prototypes directly (as done earlier for a single-vertical example) any time you want to validate a workflow before it's worth polishing in Figma.

---

## Open questions for next session

- Confirmed this round: childcare positioning is ops/compliance-first; v1 prototype scope is single-center (data model remains multi-site-capable per 12.1).
- For the eventual "hospitals" vertical: administrative/operational scope only, or does this include clinical/EHR functionality? Not urgent now, but worth deciding before Phase 3 (Section 11).
- Is there a confirmed product/working name yet, or should design work continue with a placeholder until branding is decided?
- When Figma Make screens exist, should the next Claude session focus on reading them back through the connector to generate production code, or on continuing foundation work (e.g., fleshing out additional workflows, report templates, or the compliance rule pack schema in 12.4)?
