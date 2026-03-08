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
- `app/src/app/data/gear.seed.json`

## Legacy Data + Asset Import (Local)
If `old_lasertag_html/` exists in the repo root, run:

```powershell
.\scripts\import_local_legacy_data.ps1
```

This will:
- Mirror the full legacy site to `app/public/legacy/site`
- Copy linked files to `app/public/legacy/site-linked`
- Generate raw extracted data in `app/src/assets/data/legacy/`
- Regenerate app seed at `app/src/app/data/gear.seed.json`

Generated legacy data files:
- `app/src/assets/data/legacy/pages.raw.json`
- `app/src/assets/data/legacy/gear.records.raw.json`
- `app/src/assets/data/legacy/missing-links.json`
- `app/src/assets/data/legacy/summary.json`

## Notes
This repository is in early setup. See `docs/PROJECT_PLAN.md` for decisions, open questions, and roadmap.

Primary domains for launch planning:
- `lasertaggear.com`
- `lasertagwiki.com`
