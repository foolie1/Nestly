# Product Requirements Document
## Configurable Operations Platform — Childcare Industry Pack (v1)

Prepared for Gene · August 31, 2026
Status: **Unified PRD — supersedes and consolidates the earlier "MVP Build Plan" and "Foundational Design Spec" documents.** This is the single source of truth going forward.

---

## 0. How to use this document

This PRD is written to be handed to three different consumers without modification:

1. **A future Claude session** picking up this project cold — Section 1–2 for context, Section 12 (Decision Log) for what's already settled, Section 14 for what's genuinely still open.
2. **Figma Make** — Sections 6–9 (personas, scope, workflows, data model) are written to be prompted directly for first-draft screens.
3. **Claude Design** (when/if available) or any designer — the same sections serve as the creative brief.

No screens, wireframes, or prototypes exist yet. This document is the foundation those will be built from.

---

## 1. Executive summary

Build a configurable operations platform — one shared core, "industry packs" for different verticals — launching with **childcare centers** as the first and only vertical for v1. The childcare pack targets **small multi-location operators (2–10 centers)**, priced as a **flat monthly fee per center**, differentiated from six researched competitors (Procare, Aaniie/Smartcare, Playground, Brightwheel, Famly, Lillio) primarily on genuine WCAG 2.2 AA accessibility, offline-first reliability, transparent pricing, and real support SLAs. The first compliance rule pack is built against **Florida** licensing requirements. The current milestone target is a **validated, polished prototype/design** — not a working backend, not a paying-customer pilot, not investor collateral (though it should be presentable if that becomes useful later).

---

## 2. Problem statement & opportunity

Childcare center operators — especially small multi-location operators who have outgrown a single-site tool — are underserved by the current market:

- **Procare** (the incumbent) has deep functionality but a Windows-only desktop app, dated UI, and only partial WCAG 2.1 AA conformance by its own admission.
- **Playground** has modern UX and transparent pricing but no public accessibility statement and cost that scales awkwardly at multi-site volume.
- **Aaniie (formerly Smartcare)** has pivoted away from classroom-based centers entirely toward placement/staffing agencies — a gap in the market its old positioning used to fill.
- **Brightwheel, Famly, and Lillio** each lead on a specific dimension (support responsiveness, curriculum, professional development) but none combine genuine accessibility conformance, multi-site-aware architecture, and transparent per-location pricing in one product.

No researched competitor has a real, current, product-wide accessibility commitment. That gap, combined with the multi-location operator segment being actively underserved on pricing transparency and cross-site tooling, is the opportunity this product targets.

---

## 3. Goals & success metrics for this milestone

Confirmed scope for "done" at this stage: **a validated prototype/design**, not a shipped product.

| Goal | Success looks like |
|---|---|
| Validate the information architecture | A reviewer (you, or a test user matching the target persona) can navigate the prototype and correctly predict where a given task lives, without training. |
| Validate the core workflows | Each of the 7 workflows in Section 9 can be walked through end-to-end in the prototype without a workflow-breaking gap being discovered. |
| Prove the multi-site + single-center balance | The prototype demonstrates both a single center's daily-operations view and the cross-center operator view, without either one feeling bolted on. |
| Prove accessibility intent, not just claim it | Design system tokens (color contrast, target sizes, focus states) are verifiably WCAG 2.2 AA-compliant in the design file itself — checkable, not just asserted. |
| Produce a real Figma Make / design brief | This document is complete and specific enough that Figma Make (or a designer) can generate first-draft screens from it with minimal follow-up questions. |

Explicitly **not** goals for this milestone: working backend, real payment processing, real state-reporting integrations, real background-screening API integration, or customer-facing launch readiness. Those are Section 11 (build-phase) concerns.

---

## 4. Target users

### 4.1 Primary buyer persona: the multi-location operator
Owns or manages **2–10 childcare centers**, evaluating or actively frustrated with Procare/Playground/Brightwheel. Cares about: consolidated visibility across centers (enrollment, revenue, compliance status), predictable per-location cost (not per-child, which punishes growth), and not having to train staff across sites on inconsistent tools. This persona's needs are why multi-site awareness is a **v1 requirement**, not a deferred phase — see Section 5's resolution of this point.

### 4.2 End-user personas (per center)
1. **Owner/Operator** (cross-center) — the buyer persona above, at the platform level.
2. **Center Director** — runs one facility day-to-day: enrollment, billing oversight, staffing, compliance readiness, parent relationships.
3. **Office Admin / Assistant Director** — enrollment processing, billing, messaging, document management.
4. **Teacher/Caregiver** — check-in/out, daily logs, room-scoped messaging.
5. **Family/Guardian** — views their own child's data, pays tuition, messages staff.

---

## 5. Resolving the multi-site vs. single-center question

Two earlier rounds of input created an apparent tension worth resolving explicitly: multi-site was called out as important ("so we do not have to work backwards"), while the *initial prototype scope* was set to single-center; then the confirmed buyer persona (Section 4.1) turned out to be a 2–10 center operator.

**Resolution:** the confirmed buyer persona settles this. Multi-site is a **v1 design requirement**, not deferred. Concretely:

- The data model (Section 8) has always supported a Tenant owning multiple Facilities — nothing here changes.
- The **prototype must include** a facility/location switcher and a basic cross-center dashboard (aggregate enrollment, revenue, compliance status) — matching the Mindbody "datashare" pattern referenced in the earlier foundation research.
- The **detailed, fully-fleshed-out workflows** (check-in/out, daily logs, billing entry) are still designed and demonstrated within a single facility's view, exactly as before — a teacher or office admin at one center never needs to think about other centers to do their job.
- In short: **single-center depth, multi-center shell** — both requirements are satisfied simultaneously, and neither was actually wrong; they apply at different zoom levels of the same product.

---

## 6. Competitive landscape (condensed)

| Platform | Primary strength | Primary gap this product exploits |
|---|---|---|
| Procare | Deep financial/compliance features, 40,000+ centers | Windows-only desktop app; partial, self-admitted WCAG 2.1 AA conformance |
| Aaniie (fka Smartcare) | Strong for placement/staffing agencies | No longer serves classroom-based centers |
| Playground | Modern UX, transparent pricing | No public accessibility statement; cost scales per-child |
| Brightwheel | Best-in-class support responsiveness | No accessibility statement found; heavy lead-gen marketing over substance |
| Famly | Strong curriculum/EYFS tooling (UK-focused) | Not a direct US structural competitor |
| Lillio (fka HiMama) | Curriculum depth, professional development/CDA credit | Published "accessibility" page is an outdated Ontario legal policy (WCAG 2.0, not 2.1/2.2), not a real product commitment |
| *(precedent, not competitor)* Mindbody | Proves core-engine + industry-pack + multi-location architecture works at scale (40,000+ businesses) | Its verticals carry none of childcare's regulatory stakes — architecture proof only, not a compliance-model proof |

**Positioning:** ops/compliance-first (not curriculum-led), genuinely WCAG 2.2 AA accessible, flat per-center pricing, multi-site-aware from v1.

---

## 7. Scope

### 7.1 In scope for v1 (design/prototype milestone)
- Childcare industry pack only (no school or hospital vertical work)
- Single-tenant, multi-facility support (Section 5)
- Core workflows: enrollment, check-in/out with ratio enforcement, daily activity logs, billing (flat per-center, simulated/mocked payment flow), incident/compliance logging, staff scheduling with certification tracking, messaging
- Roles: Owner/Operator, Center Director, Office Admin, Teacher/Caregiver, Family/Guardian (Section 4.2)
- One real, concrete compliance rule pack: **Florida** (Section 10)
- A design system meeting WCAG 2.2 AA, verifiable at the token level
- A Figma Make / design brief (this document) specific enough to generate first-draft screens

### 7.2 Explicitly out of scope for v1
- School and hospital industry packs (Phase 3+, per original foundation doc)
- Curriculum/lesson-planning depth (positioned as a later differentiator, Section 6)
- Real backend, database, or hosting
- Real payment processing (Stripe/other) — simulated in prototype only
- Real state-reporting or background-screening API integrations — represented in the design as UI affordances, not working integrations
- Clinical/EHR functionality (not applicable to childcare; noted for future hospital-vertical scoping)
- Tiered or per-child pricing models (flat per-center only, Section 3/11)

---

## 8. Data model (unchanged from foundation research, restated for completeness)

Internal, industry-agnostic entity names; the childcare pack maps them to user-facing terms in Section 9.1.

`Tenant` → `Facility` (1-to-many) → `Group` (classroom/room) → `Person` (child) with `Guardian/Related Party` links → `Enrollment` (links Person to Facility/Group over time) → `Attendance/Visit Event` → `Daily Record` → `Document` → `Billing Account/Ledger/Transaction` → `Message/Thread` → `Compliance Rule` → `Audit Log`.

A Tenant in this product **is** the multi-location operator (Section 4.1); each of their centers is a Facility.

---

## 9. Functional requirements — core workflows

### 9.1 Terminology map (childcare pack)
`Person` → Child · `Guardian` → Parent/Guardian · `Facility` → Center · `Group` → Classroom/Room · `Staff` → Teacher/Caregiver · `Tenant` → Operator/Organization

### 9.2 Workflows (each becomes one or more prototype screens)

1. **Enrollment** — inquiry/lead → tour/waitlist → application → digital paperwork + e-signature (immunization, emergency contacts, authorized pickups) → room assignment → active. Compliance documents required before first Attendance event (see Florida DH 680 rule, Section 10).
2. **Check-in/out** — staff checks in a child at their facility → ratio rules engine recalculates that room's live ratio against Florida thresholds (Section 10) → over-threshold triggers immediate alert → guardian ETA sharing → check-out requires an authorized-pickup match.
3. **Daily activity log** — meals, naps, diapering/bathroom, incidents logged as timestamped entries → auto-compiled into a daily report delivered to guardians.
4. **Billing** — flat monthly fee per center (Section 11) drives the operator's own invoice to the platform; **within** a center, tuition billing to families still needs a schedule/invoice/payment model — recurring tuition schedule → invoice generation → payment collection (simulated in prototype) → late-payment escalation.
5. **Incident & compliance** — incident logged by staff → required fields enforced per Florida's rules → guardian notified + e-signature where required → retained per policy → surfaces in the Center Director's and Owner/Operator's compliance dashboards (single-center and cross-center views respectively).
6. **Staff scheduling & certification** — shift scheduling checked against live ratio needs → certification records (Level 2 background screening status + 5-year rescreening date, CPR/first aid) tracked with expiration alerts → scheduling blocked if a ratio-critical certification has lapsed.
7. **Messaging** — routes by child/room so guardians see only their own child's threads; admin has an emergency broadcast override; Owner/Operator has a cross-center announcement capability.

### 9.3 Multi-site-specific requirements (per Section 5's resolution)
- Facility switcher in the primary navigation for any user with more than one assigned facility.
- Cross-center dashboard for Owner/Operator role: aggregate enrollment, revenue, and compliance-status-at-a-glance across all facilities, with drill-down into any single center's full detail view.
- Staff and billing records remain facility-scoped by default; cross-facility staff reassignment is a stretch goal for the prototype, not a hard requirement.

---

## 10. Compliance requirements — Florida (first real rule pack)

Researched directly from Florida sources rather than assumed, per project standard:

- **Staff-to-child ratios** (Florida Statute §402.305; Fla. Admin. Code Ch. 65C-22): infants (under 18 months) 1:4 · toddlers (18–36 months) 1:6 · preschool (3–5 years) 1:15 · school-age 1:20. Ratios apply at all times including naps, transitions, and outdoor play; in mixed-age rooms, the youngest child's ratio governs the whole room.
- **Immunization documentation**: a completed Florida Certification of Immunization (**Form DH 680**) is required for each enrolled child (except school-age); if not provided within **30 days** of enrollment, the child must be excluded from care. This directly drives the Enrollment workflow's compliance gate (Section 9.2, step 1).
- **Staff background screening**: **Level 2 background screening** (FBI/FDLE, child abuse registry, adult protective services registry, local criminal records) required prior to employment for all personnel with 10+ hours/week of child contact, with **rescreening every 5 years**. This drives the Staff Scheduling & Certification workflow (Section 9.2, step 6) — a certification-tracking field should specifically model background-screening status and its 5-year expiration, not just training certificates.
- **Records retention**: Florida does not publish a single statewide retention period for immunization/medical records; common provider practice is indefinite retention. The compliance rule pack should default to "retain indefinitely unless otherwise configured" for this document type rather than inventing a specific period.
- **Incident reporting**: specific Florida incident-report field requirements were not conclusively found in this research pass — flagged as an open item (Section 14) rather than guessed at.

This rule pack is built as data against the schema proposed in the earlier foundation research (a state selects its rule pack at Tenant setup); adding a second state later means authoring a new data file, not re-engineering the ratio engine or compliance dashboard.

Sources: [Florida Childcare Ratios – CentreCareOS](https://www.centrecareos.com/resources/ratios/florida) · [Florida Staff-to-Child Ratio Requirements – ChildcareComp](https://childcarecomp.com/articles/licensing-requirements/florida-staff-child-ratio-requirements) · [Florida Childcare Licensing Requirements – Brightwheel](https://mybrightwheel.com/licensing-requirements/florida/) · [Florida DCF Background Screening](https://www.myflfamilies.com/services/background-screening) · [Florida DCF Background Screening FAQ – Child Care Licensing](https://www.myflfamilies.com/services/background-screening/frequently-asked-questions-specific-child-care-licensing)

---

## 11. Business model

- **Pricing**: flat monthly fee **per center** (per Facility), not per child — directly counter-positioned against Playground's per-child model, which penalizes growth. A 5-center operator pays 5× the per-center fee; this needs an explicit number decided during the build phase (not required for the design milestone).
- **Target segment**: small multi-location operators (2–10 centers) — large enough to value cross-center tooling, small enough to still be underserved by enterprise-focused options.
- **What's still undecided and intentionally deferred**: the actual per-center dollar amount, discount structure for larger center counts, and payment processor choice (Stripe was suggested in earlier research as the default, matching Playground and Mindbody's own choice, but not finalized).

---

## 12. Non-functional requirements

- **Accessibility**: WCAG 2.2 AA, verified at the design-token level (color contrast ratios, 24×24px minimum target sizes, visible focus states) before screens are built — not retrofitted. This is the product's primary differentiator (Section 6) and must be checkable in the design file itself, not just asserted in this document.
- **Offline-first**: check-in/out and daily-log entry should be designed assuming intermittent connectivity at the center level; this affects interaction design (optimistic UI, sync-status indicators) even at the prototype stage, though real sync logic is a build-phase concern.
- **Multi-site performance**: the cross-center dashboard (Section 9.3) should be designed to scale visually to at least 10 facilities without becoming unusable — test the design with realistic data volume, not 2–3 placeholder rows.
- **Consistency across the shared shell**: per the original foundation research, the navigational shell (sidebar, top bar, facility switcher) must stay structurally consistent even though it's designed for a single vertical right now — this is what makes future industry packs additive later rather than a redesign.

---

## 13. Design & prototyping plan

1. **This PRD is the brief.** Sections 4, 6, 7, 9, and 10 are written to be prompted into Figma Make directly, in roughly that order (personas → scope → workflows → compliance specifics).
2. **You drive Figma Make** inside Figma itself — this is a first-party Figma capability not exposed through the read-only Figma connector available in this project.
3. **Once real frames exist**, connect the Figma file here; the read-only Dev Mode connector can pull design context, tokens, and screenshots from it, and generate matching production code when the project moves to the build phase.
4. **Claude Design**, if and when available in a given session, can be used as an alternate or parallel path using the same brief — no rework of this document should be needed to hand it to either tool.
5. In parallel, fast clickable HTML prototypes can still be built directly in a Claude session for quick workflow validation before committing to polished Figma screens, as demonstrated earlier in this project.

---

## 14. Assumptions, risks, and open items

**Carried forward from the foundation research (still true):**
- Compliance work (background screening, licensing rule packs) is architectural and must be designed for from the start, even though real integrations are out of scope for this milestone.
- Multi-industry expansion (schools, hospitals) remains a Phase 3+ concern; the hospital vertical's clinical-vs-administrative scope is still undecided and not urgent.

**New from this round:**
- Florida incident-reporting field requirements were not conclusively found — needs a follow-up research pass before the incident-logging screen's exact fields are finalized (Section 10).
- The exact per-center price point and any volume-discount structure (Section 11) are undecided — fine for the design milestone, blocking for anything past it.
- Product/brand name is still a placeholder from earlier prototyping ("Nestly") — confirm or replace before it appears in final design assets.
- "Validated prototype/design" (Section 3) as the success target means this document intentionally does not specify hosting, backend, or real integration details — those belong in a follow-up build-phase PRD once design is validated, not this one.

---

## 15. Decision log (for fast onboarding of future sessions)

| Decision | Answer | Source |
|---|---|---|
| Long-term product vision | One core platform, configurable per industry via "packs" | Foundation research |
| Near-term industry focus | Childcare only | Confirmed |
| Accessibility standard | WCAG 2.2 AA, designed-in from the start | Confirmed |
| Childcare positioning | Ops/compliance-first, not curriculum-led | Confirmed |
| Site scope | Multi-site is a v1 requirement (buyer-driven); detailed workflows still single-center-scoped | Resolved in Section 5 |
| Pricing model | Flat fee per center | Confirmed |
| Target buyer | Small multi-location operators, 2–10 centers | Confirmed |
| First compliance state | Florida | Confirmed, researched in Section 10 |
| Current milestone target | Validated prototype/design only — no backend, no pilot, no fundraising deck | Confirmed |
| Figma/Claude Design workflow | This document is the brief; user drives Figma Make directly; Claude reads back finished Figma files via the read-only connector when ready | Confirmed |
