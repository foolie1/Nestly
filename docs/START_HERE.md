# Start Here — Nestly Project Brief

For a new Claude session (or Gene, picking this back up). Read this first — it's the fastest way to get oriented without re-deriving everything from scratch.

---

## What this project is

**Nestly** — a childcare center management platform for small multi-location operators (2–10 centers), positioned against Procare, Aaniie (formerly Smartcare), Playground, Brightwheel, Famly, and Lillio. Differentiated on genuine WCAG 2.2 AA accessibility (none of the six competitors have this), flat per-center pricing (not per-child), multi-site-native architecture, and traceable state compliance (first real rule pack built for **Florida**).

Current status: **design validated in Figma Make, backend not started.**

---

## The authoritative documents (read in this order)

1. **`unified_prd.md` / `unified_prd.pdf`** — the single source of truth for product scope, personas, workflows, data model, business model, and every confirmed decision. This *supersedes* two earlier documents that are now historical only: `platform_foundation_spec.md` (the original multi-industry architecture research) and `Childcare_Software_MVP_Build_Plan_final.docx` (the very first competitor-research-based plan). Don't build from those two — they're folded into the unified PRD.
2. **`build_phase_plan.md` / `build_phase_plan.pdf`** — the engineering follow-up, written once design was validated. Covers backend architecture (Node.js/TypeScript + PostgreSQL), the real API surface, the Florida compliance rule pack as an implementable schema, security requirements, and a phased engineering roadmap.
3. **This file** — status and immediate next actions.

An early standalone HTML prototype (`nestly_prototype.html`) also exists from before Figma Make was connected — superseded by the real Figma Make build, kept only for reference.

---

## The live design

Figma Make file ("Nestly" / "Rough Draft"): `https://www.figma.com/make/pS3jbaaQpn44ibHir8PUbQ/Rough-Draft`

Built as a real Vite + React + TypeScript + Tailwind codebase — 9 screens: Operator Dashboard (all-centers view), Center Dashboard, Enrollment (pipeline + roster), Check-in/Out, Daily Logs, Billing, Compliance, Staff & Schedule, Messaging. All were reviewed screen-by-screen against the PRD; the punch list from that review (color-semantic issues, missing empty states, enrollment pipeline stages) was addressed in a later Figma Make pass.

**The Figma MCP connector in this project is read-only for `/make/` files** — it can list the file's structure but can't pull raw source code into a session. That's why the code isn't already in a repo here.

---

## Immediate next action (blocking)

**Export the Figma Make code to GitHub.** In the Figma Make file: **Make settings → GitHub → Create Repository**. Nothing in the build-phase roadmap (Section 6, step 1) can start until this exists — once it does, share the repo (or connect it as a folder) and a session gets full file access instead of the connector's limited view.

---

## Key confirmed decisions (don't re-litigate these)

| Decision | Answer |
|---|---|
| Vertical focus | Childcare only (multi-industry vision exists but is Phase 3+, not active) |
| Target buyer | Small multi-location operators, 2–10 centers |
| Pricing | Flat monthly fee per center, not per child |
| First compliance state | Florida (real ratios, DH 680, Level 2 background screening researched and cited) |
| Accessibility bar | WCAG 2.2 AA, designed in from the start |
| Site scope | Multi-site is a v1 requirement (buyer-driven); detailed workflows still single-center-scoped per screen |
| Frontend stack | Keep the Figma Make output (Vite/React/TS/Tailwind) — don't restart on React Native |
| Backend stack | Node.js + TypeScript, REST + WebSockets, PostgreSQL |
| Payments | Stripe, deliberately sequenced late in the build roadmap |
| Current milestone | Validated prototype/design — no backend, no pilot, no fundraising deck yet |

---

## Genuinely open items

- Level 2 background-screening vendor — not yet chosen or researched
- Florida's specific incident-report field requirements — not conclusively found in research, needed before finalizing the Daily Logs incident sub-form
- Hosting provider — AWS vs. GCP not yet decided specifically
- Automated SMS/email reminders for enrollment inquiries — designed conceptually (Section 4/notifications service) but needs a provider choice (Twilio + SendGrid/Postmark/Resend) and, importantly, **TCPA consent-capture on the New Inquiry form before any SMS logic ships** — flagged as a legal question, not just an engineering one
- Product name "Nestly" — still effectively a working name, never explicitly confirmed as final branding
- Timeline/resourcing — the roadmap sequences work but doesn't estimate effort or assign owners

---

## For a new session picking this up

1. Connect the folder these files live in.
2. Read this file, then `unified_prd.md`, then `build_phase_plan.md`.
3. Ask Gene whether the GitHub export (above) has happened yet before assuming any code work can start.
