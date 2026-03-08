# Legacy Site Deep Dive (khanjal.com)

## Scope Crawled
- https://khanjal.com/lasertag/gear_lasertag.html
- https://khanjal.com/lasertag/gear_laserchallenge.html
- https://khanjal.com/lasertag/gear_laserchallenge_original.html
- https://khanjal.com/lasertag/gear_laserchallenge_pro.html
- https://khanjal.com/lasertag/gear_laserchallenge_v2.html
- https://khanjal.com/lasertag/gear_laserchallenge_extreme.html
- https://khanjal.com/lasertag/gear_lasercommand.html
- https://khanjal.com/lasertag/gear_quickshot.html
- https://khanjal.com/lasertag/gear_segalockon.html
- https://khanjal.com/lasertag/gear_voicecommandlockon.html

## What Data Exists On The Legacy Pages
The legacy pages are richer than a simple list and contain structured product metadata that can be imported.

Common fields present:
- `Released` (single year or range)
- `Model Number` (many items)
- `Battery Req.`
- `Range`
- `Ammo`
- `Accessory Port(s)`
- `Set(s)` (cross-link between standalone gear and bundled sets)
- `Contents` (for sets)
- `Original Price`
- Freeform `Info` notes (often very useful)
- Manual file links (PDF/ZIP), plus occasional audio links

## High-Value Findings By Family

### Laser Command / Laser Attack
- Laser Command/Attack Pistol: released 1997, 2 AA, 100 ft, ammo 5, in both Laser Attack and Laser Command sets.
- Stealth Atomizer: released 1998, 2 AA, 200 ft, ammo 5 semi / 15 full auto, original price $12.99, has manual PDF.
- Laser Command/Attack Vest and Advanced Vest: set-linked, battery unknown (`?`), compatibility notes with Laser Challenge.
- Sets are explicitly listed with contents and release years.

### Quick Shot
- Lazer Pistol: released 1990, 4 AA, 100 ft, unlimited ammo.
- Lock-On target unit: released 1990, 4 AA, unlimited-hit target behavior.
- Sensor: no battery, plugs into target or pistol.
- Quick Shot Set: model QS2040, 8 AA total, includes pistol + target + sensor.

### SEGA Lock-On / Voice Command Lock-On
- Lock-On (listed as 1980): 1x9V + 2xC, range 350 ft, rapid/single + high power shots.
- Lock-On 2 (1985): 4 AA + 2 C, 350 ft, similar feature set and compatibility.
- Voice Command Lock-On (1990): 4 AA + 2 C, with detailed mode behavior in notes.
- Notable likely data quality issue: Lock-On "1980" may be a legacy typo; should be flagged for verification.

### Laser Challenge Original
- Very detailed per-item and per-set records.
- Example gear entries:
  - EX-D Super Laser (1998, model 80514, 4 AA, 200 ft, ammo 25, $19.99)
  - Laser Pistol (1997, 2 AA, 50 ft, ammo 6)
  - Micromax Blaster (1998, model 80543, 5 AAA, 50-150 ft, ammo 12, $19.99/2 units)
  - Capture The Flag (1998, model 80519, 2 AA per flag, $34.99)
- Example set entries:
  - Team Force Set (1997, model 80504, 10 AA, contents listed, $34.99)
  - Super Comp Set (1997, 7 AA, contents listed, $29.99)
- Multiple manual links are available for this family.

### Laser Challenge Pro
- Explicitly described as arena-style attempt for home users.
- Main vest/gun unit: 1997, 7 AA, 200 ft, 3 accessory ports, in Clash and Competitor packs.
- Walkie Talkie accessory: 1998, 1x9V, 900 ft, $24.99.
- Set prices and batteries are available (e.g., Clash Pak $119.99, Competitor Pak $69.99).

### Laser Challenge V2
- Most complete/clean data set in the legacy site.
- Example gear entries:
  - Firestorm: model 80613, 6 AA, 1000 ft, ammo 25, $29.99
  - Ultrawide: model 80614, 3 AA, 350 ft, max spread 50 ft, ammo 25/ultrawide mode, $29.99
  - V2 Pistol: 3 AA, 350 ft, ammo 25
- ELS adapter/computer flow includes gameplay metadata and supporting ZIP/PDF files.
- Sets include clear contents and prices (Solo/Twin/Ultrawide, etc.).

### Laser Challenge Extreme (Radar/Gotcha)
- Good detail across both standalone gear and sets.
- Radar Extreme Set: model 80632T/1, 10 AA, 2 vests + 2 pistols, $34.99.
- Gotcha Extreme Set: model 80634T/1, 6 AA, 2 vests + 2 pistols, $29.99.
- Team Force 250 and Mini Mayhem include notable behavior differences and hybridized V2/Radar traits.

## Data Quality Observations
- Many fields intentionally unknown in source (`?`, `$?`).
- Some probable date anomalies (example: SEGA Lock-On release year shown as 1980).
- Some naming drift/variants (Laser Command vs Laser Attack, Team Force naming variants).
- Battery and range are often freeform strings that need normalization.
- Links to manuals are strong authoritative artifacts and should be preserved as first-class metadata.

## Recommended Schema Additions For New Catalog
Current seed schema is good for discovery but too coarse for legacy technical detail.

Add these optional fields to `GearItem`:
- `variant` (string)
- `modelNumber` (string)
- `releaseYearStart` / `releaseYearEnd` (number)
- `batteryRequirementRaw` (string)
- `rangeRaw` (string)
- `ammoRaw` (string)
- `accessoryPortsRaw` (string)
- `setNames` (string[])
- `contentsRaw` (string)
- `originalPriceRaw` (string)
- `notes` (string)
- `sourceUrl` (string)
- `manuals` (already present)
- `dataConfidence` (`high` | `medium` | `low`)

## Import Strategy
1. Keep raw legacy values in `*Raw` fields first (no data loss).
2. Add parsed/normalized fields later (`batteryAA`, `rangeFtMin`, `rangeFtMax`, etc.).
3. Store unknown explicitly as `null` plus `raw='?'` where present.
4. Track source page and extraction date for every imported row.

## Suggested Next Step
- Build a one-time import file: `docs/legacy_import_seed.csv` or `app/src/app/data/legacy-detailed.seed.ts` with the Laser Challenge Original/V2 families first (best data density).
