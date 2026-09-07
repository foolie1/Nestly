# Nestly

Childcare center management for small multi-location operators (2–10 centers).
Florida rule pack first. Genuinely WCAG 2.2 AA. Flat per-center pricing.

| Directory | What it is |
|---|---|
| `web/` | The frontend — Vite + React 19 + TypeScript + Tailwind v4. Pulled verbatim from the Figma Make build ("Rough Draft"). 9 screens, mock data in `src/data.ts`. **This is the active work.** |
| `nestly-api/` | Backend foundation (Fastify + Drizzle + Postgres). Parked — schema and migration exist, nothing else is wired up yet. Ignore until the frontend is settled. |
| `docs/` | The authoritative project docs. Read `START_HERE.md` first, then `unified_prd.md`, then `build_phase_plan.md`. `docs/archive/` is historical only. |

## Run the frontend

```bash
cd web
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle in web/dist
```

## Figma Make

Live design file: https://www.figma.com/make/pS3jbaaQpn44ibHir8PUbQ/Rough-Draft

`web/` was exported from that file on 2026-09-07. If you keep editing in Figma Make, either re-export or treat this repo as the source of truth going forward — don't do both.
