# Laser Tag Gear

Workspace for the Laser Tag Gear catalog rebuild.

## Structure
- `app/`: Angular application scaffold (SSR enabled)
- `docs/PROJECT_PLAN.md`: living project plan and milestone tracker
- `Laser Tag Gear.pdf`: design/reference document

## Quick Start
```powershell
cd app
npm start
```

## Current App Routes
- `/`: home page
- `/catalog`: searchable/filterable gear list (seed data)
- `/gear/:slug`: gear detail page

## Seed Data Mode
Until backend wiring is complete, data comes from:
- `app/src/app/data/gear.seed.ts`

## Notes
This repository is in early setup. See `docs/PROJECT_PLAN.md` for decisions, open questions, and roadmap.

Primary domains for launch planning:
- `lasertaggear.com`
- `lasertagwiki.com`
