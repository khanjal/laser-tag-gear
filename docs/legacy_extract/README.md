# Legacy Extract Output

Generated from legacy `khanjal.com` gear pages for later DB import.

## Files
- `legacy_gear_records.raw.json`: full extraction as JSON array.
- `legacy_gear_records.raw.csv`: tabular export for spreadsheet/DB prep.
- `legacy_gear_records.summary.txt`: record counts by source page.

## Columns
- `sourceUrl`: source detail page
- `title`: gear/set title block
- `kind`: `gear`, `set`, or `unknown`
- `releasedRaw`
- `modelNumberRaw`
- `batteryRequirementRaw`
- `rangeRaw`
- `ammoRaw`
- `accessoryPortsRaw`
- `setNamesRaw`
- `contentsRaw`
- `originalPriceRaw`
- `notesRaw`

## Notes
- Values are intentionally kept raw from source text for data preservation.
- Unknown values like `?` and `$?` are preserved as-is.
- Approximate years and freeform notes are not normalized yet.

## Regenerate
From repository root:

```powershell
.\scripts\extract_legacy_gear.ps1
```
