$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$legacyRoot = Join-Path $repoRoot 'old_lasertag_html'
if (-not (Test-Path $legacyRoot)) {
  throw "Missing legacy source directory: $legacyRoot"
}

$publicLegacyRoot = Join-Path $repoRoot 'app/public/legacy'
$legacyDataRoot = Join-Path $repoRoot 'app/src/assets/data/legacy'
$seedPath = Join-Path $repoRoot 'app/src/app/data/gear.seed.json'

New-Item -ItemType Directory -Force -Path $publicLegacyRoot | Out-Null
New-Item -ItemType Directory -Force -Path $legacyDataRoot | Out-Null

function Clean-Text {
  param([string]$Html)

  $text = $Html
  $text = $text -replace '(?is)<script.*?</script>', ' '
  $text = $text -replace '(?is)<style.*?</style>', ' '
  $text = $text -replace '(?i)<br\s*/?>', ' '
  $text = $text -replace '(?i)</p>|</tr>|</table>|</li>|</h\d>|</td>|</font>', "`n"
  $text = $text -replace '(?i)<p>|<li>|<tr>|<h\d[^>]*>|<td[^>]*>|<font[^>]*>', "`n"
  $text = $text -replace '(?is)<[^>]+>', ' '
  $text = [System.Net.WebUtility]::HtmlDecode($text)
  return ($text -replace '\s+', ' ').Trim()
}

function Slugify {
  param([string]$Value)

  $slug = $Value.ToLowerInvariant()
  $slug = $slug -replace '[^a-z0-9]+', '-'
  $slug = $slug.Trim('-')
  if ([string]::IsNullOrWhiteSpace($slug)) { return 'item' }
  return $slug
}

function Parse-Year {
  param([string]$Raw)

  $m = [regex]::Match($Raw, '(19|20)\d{2}')
  if ($m.Success) {
    return [int]$m.Value
  }
  return 0
}

function Extract-Spec {
  param([string]$Raw)

  if ([string]::IsNullOrWhiteSpace($Raw) -or $Raw -eq '?' -or $Raw -eq '--None--' -or $Raw -eq '-?-') {
    return $null
  }
  return $Raw.Trim()
}

function Parse-BatteryPacks {
  param([string]$Raw)

  if ([string]::IsNullOrWhiteSpace($Raw)) {
    return @()
  }

  $normalized = ($Raw -replace '(?i)volt(s)?', 'V') -replace '(?i)and', ','
  $segments = @($normalized -split '[,;/]' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
  $packs = @()

  foreach ($segment in $segments) {
    $upper = $segment.ToUpperInvariant()
    $type = $null

    if ($upper -match 'AAA') { $type = 'AAA' }
    elseif ($upper -match '\bAA\b') { $type = 'AA' }
    elseif ($upper -match '\bC\b') { $type = 'C' }
    elseif ($upper -match '\bD\b') { $type = 'D' }
    elseif ($upper -match '9\s*-?\s*V') { $type = '9V' }
    elseif ($upper -match 'RECHARGE') { $type = 'rechargeable' }

    if (-not $type) {
      continue
    }

    $quantity = $null
    $match = [regex]::Match($segment, '\d+')
    if ($match.Success) {
      $quantity = [int]$match.Value
    }

    $packs += [pscustomobject]@{
      type = $type
      quantity = $quantity
    }
  }

  return @($packs)
}

function Get-AssetKind {
  param([string]$Path)

  $ext = [System.IO.Path]::GetExtension($Path).ToLowerInvariant()
  switch ($ext) {
    '.pdf' { return 'manual' }
    '.wav' { return 'audio' }
    '.mp3' { return 'audio' }
    '.ogg' { return 'audio' }
    '.jpg' { return 'image' }
    '.jpeg' { return 'image' }
    '.png' { return 'image' }
    '.gif' { return 'image' }
    '.zip' { return 'archive' }
    '.doc' { return 'document' }
    '.docx' { return 'document' }
    '.txt' { return 'document' }
    default { return 'other' }
  }
}

function Normalize-AssetLink {
  param([string]$Link)

  if ([string]::IsNullOrWhiteSpace($Link)) {
    return $null
  }

  $normalized = $Link.Trim().Replace('\\', '/')

  if ($normalized -match '^(?i)(javascript:|mailto:|#)') {
    return $null
  }

  $legacyUrl = [regex]::Match($normalized, '^(?i)https?://(?:www\.)?khanjal\.com/lasertag/(?<p>.+)$')
  if ($legacyUrl.Success) {
    return $legacyUrl.Groups['p'].Value.TrimStart('/')
  }

  $normalized = $normalized.TrimStart('.').TrimStart('/')
  return $normalized
}

function Clean-DescriptionText {
  param([string]$Text)

  if ([string]::IsNullOrWhiteSpace($Text)) {
    return $Text
  }

  $clean = $Text
  # Remove embedded filename + size mentions; files are surfaced in dedicated sections.
  $clean = $clean -replace '(?i)\b[\w\-]+\.(pdf|zip|doc|docx|txt|wav|mp3|ogg)\s*\(\d+\s*KB\)', ''
  $clean = $clean -replace '\s{2,}', ' '
  $clean = $clean -replace '\s+([,.;:!?])', '$1'
  return $clean.Trim()
}

function Get-FieldValue {
  param(
    [string]$Block,
    [string]$LabelRegex
  )

  $next = 'Model Number\s*\:|Battery Req\.\s*\:|Range\s*\:|Ammo\s*\:|Accessory Port\(s\)\s*\:|Set\(s\)\s*\:|Contents\s*\:|Original Price\s*\:|Info\s*\:|$'
  $m = [regex]::Match($Block, "(?is)$LabelRegex\s*\:\s*(?<v>.*?)(?=$next)")
  if ($m.Success) {
    return ($m.Groups['v'].Value -replace '\s+', ' ').Trim()
  }
  return $null
}

function Get-InfoValueFromHtml {
  param([string]$BlockHtml)

  if ([string]::IsNullOrWhiteSpace($BlockHtml)) {
    return $null
  }

  # Info text is usually followed by a blank line and then script/img/link blocks.
  $m = [regex]::Match(
    $BlockHtml,
    '(?is)<u>\s*<b>\s*Info\s*</b>\s*</u>\s*:\s*(?<v>.*?)(?=<br\s*/?>\s*<br\s*/?>\s*(?:<script|<img|<a)|$)'
  )

  if (-not $m.Success) {
    $m = [regex]::Match($BlockHtml, '(?is)<u>\s*<b>\s*Info\s*</b>\s*</u>\s*:\s*(?<v>.*)$')
  }

  if (-not $m.Success) {
    return $null
  }

  return Clean-Text $m.Groups['v'].Value
}

function Extract-Color {
  param([string]$Title)

  $colorPatterns = @(
    @{ pattern = '\b(Red|Blue|Black|White|Yellow|Green|Orange|Purple|Silver|Gold|Gray|Grey|Cammo|Camo)\s*(?:Vest|Pistol|Gun|Blaster|Rifle|Laser|Marker|Badge|Hat|Set|Pack)'; name = 1 },
    @{ pattern = '\((\w+(?:\s+\w+)?)\)\s*$'; name = 1 }
  )

  foreach ($cp in $colorPatterns) {
    $m = [regex]::Match($Title, $cp.pattern, 'IgnoreCase')
    if ($m.Success) {
      $color = $m.Groups[$cp.name].Value.Trim()
      if ($color -and $color -notmatch '(?i)^(set|pack|gear|vest|pistol|gun|blaster|rifle|laser|marker|badge|hat)$') {
        return $color
      }
    }
  }

  return $null
}

function Get-BaseName {
  param([string]$Title)

  # Try to extract base name by removing color+equipment term
  $colorEquipPattern = '\s+(Red|Blue|Black|White|Yellow|Green|Orange|Purple|Silver|Gold|Gray|Grey|Cammo|Camo)\s+(Vest|Pistol|Gun|Blaster|Rifle|Laser|Marker|Badge|Hat|Set|Pack)\s*$'
  $renamed = $Title -replace $colorEquipPattern, ' $2'
  if ($renamed -ne $Title) {
    return $renamed.Trim()
  }

  # Try to remove parenthetical color
  $parenColorPattern = '\s*\([A-Za-z\s]+\)\s*$'
  $renamed = $Title -replace $parenColorPattern, ''
  if ($renamed -ne $Title) {
    return $renamed.Trim()
  }

  return $Title
}

$sourceMap = @{
  'gear_laserchallenge_original' = @{ series = 'Laser Challenge'; family = 'Original'; manufacturer = 'ToyMax'; marketSegment = 'retail'; playContext = 'home' }
  'gear_laserchallenge_pro' = @{ series = 'Laser Challenge'; family = 'Pro'; manufacturer = 'ToyMax'; marketSegment = 'retail'; playContext = 'home' }
  'gear_laserchallenge_v2' = @{ series = 'Laser Challenge'; family = 'V2'; manufacturer = 'ToyMax'; marketSegment = 'retail'; playContext = 'home' }
  'gear_laserchallenge_extreme' = @{ series = 'Laser Challenge'; family = 'Extreme'; manufacturer = 'ToyMax'; marketSegment = 'retail'; playContext = 'home' }
  'gear_lasercommand' = @{ series = 'Laser Command'; family = 'Laser Attack'; manufacturer = 'Astronomical Toys'; marketSegment = 'retail'; playContext = 'home' }
  'gear_quickshot' = @{ series = 'Quick Shot'; family = 'Quick Shot'; manufacturer = 'Radio Shack'; marketSegment = 'retail'; playContext = 'home' }
  'gear_segalockon' = @{ series = 'Lock-On'; family = 'SEGA Lock-On'; manufacturer = 'SEGA'; marketSegment = 'retail'; playContext = 'home' }
  'gear_voicecommandlockon' = @{ series = 'Lock-On'; family = 'Voice Command Lock-On'; manufacturer = 'Playmates Toys'; marketSegment = 'retail'; playContext = 'home' }
}

# 1) Mirror legacy site content to app/public/legacy/site.
$legacySiteMirror = Join-Path $publicLegacyRoot 'site'
if (Test-Path $legacySiteMirror) {
  Remove-Item -Recurse -Force $legacySiteMirror
}
Copy-Item -Path $legacyRoot -Destination $legacySiteMirror -Recurse -Force

# 2) Extract page text/links and gear records from local HTML.
$htmlFiles = Get-ChildItem -Path $legacyRoot -File -Filter '*.html' | Sort-Object Name
$pageRecords = @()
$gearRecords = @()
$linkedAssets = New-Object System.Collections.Generic.HashSet[string]
$missingAssets = New-Object System.Collections.Generic.HashSet[string]

foreach ($file in $htmlFiles) {
  $html = Get-Content -Raw -Path $file.FullName

  $titleMatch = [regex]::Match($html, '(?is)<title>(?<t>.*?)</title>')
  $title = if ($titleMatch.Success) { (Clean-Text $titleMatch.Groups['t'].Value) } else { $file.BaseName }

  $linkMatches = [regex]::Matches($html, '(?is)(?:href|src)\s*=\s*["''](?<u>[^"''#]+)["'']')
  $links = @()
  foreach ($m in $linkMatches) {
    $u = $m.Groups['u'].Value.Trim()
    if ($u -match '^(javascript:|mailto:|https?://|tel:)') { continue }
    if ([string]::IsNullOrWhiteSpace($u)) { continue }

    $resolved = Join-Path $file.DirectoryName $u
    try {
      $resolved = (Resolve-Path -LiteralPath $resolved -ErrorAction Stop).Path
      $null = $linkedAssets.Add($resolved)
    }
    catch {
      $null = $missingAssets.Add($u)
    }

    $links += $u
  }

  $pageText = Clean-Text $html
  $pageRecords += [pscustomobject]@{
    fileName = $file.Name
    fileBase = $file.BaseName
    title = $title
    links = $links | Sort-Object -Unique
    text = $pageText
  }

  if ($file.BaseName -notmatch '^gear_') { continue }

  $anchorBlocks = [regex]::Matches($html, '(?is)<a\s+name="(?<anchor>[^"]+)"></a>(?<block>.*?)(?=<a\s+name="|$)')
  foreach ($ab in $anchorBlocks) {
    $anchor = $ab.Groups['anchor'].Value.Trim().ToLowerInvariant()
    if ($anchor -in @('top', 'overview', 'gear', 'sets')) { continue }

    $blockHtml = $ab.Groups['block'].Value
    $blockText = Clean-Text $blockHtml

    if ($blockText -notmatch 'Released\s*[-:]' -or $blockText -notmatch 'Battery Req\.\s*:') { continue }

    $titleMatch2 = [regex]::Match($blockText, '^(?<t>.*?)\s+top\s+Released\s*[-:]', 'IgnoreCase')
    if (-not $titleMatch2.Success) {
      $titleMatch2 = [regex]::Match($blockText, '^(?<t>.*?)\s+Released\s*[-:]', 'IgnoreCase')
    }
    $entryTitle = if ($titleMatch2.Success) { ($titleMatch2.Groups['t'].Value -replace '\s+', ' ').Trim() } else { $anchor }
    if ($entryTitle -match '^\(\d+\s*KB\)\s*') {
      $entryTitle = $entryTitle -replace '^\(\d+\s*KB\)\s*', ''
    }

    $releasedMatch = [regex]::Match($blockText, '(?is)Released\s*[-:]\s*(?<v>.*?)(?=Model Number\s*\:|Battery Req\.\s*\:|Range\s*\:|Ammo\s*\:|Accessory Port\(s\)\s*\:|Set\(s\)\s*\:|Contents\s*\:|Original Price\s*\:|Info\s*\:|$)')
    $releasedRaw = if ($releasedMatch.Success) { ($releasedMatch.Groups['v'].Value -replace '\s+', ' ').Trim() } else { '' }

    $modelRaw = Get-FieldValue -Block $blockText -LabelRegex 'Model Number'
    $batteryRaw = Get-FieldValue -Block $blockText -LabelRegex 'Battery Req\.'
    $rangeRaw = Get-FieldValue -Block $blockText -LabelRegex 'Range'
    $ammoRaw = Get-FieldValue -Block $blockText -LabelRegex 'Ammo'
    $portsRaw = Get-FieldValue -Block $blockText -LabelRegex 'Accessory Port\(s\)'
    $setNamesRaw = Get-FieldValue -Block $blockText -LabelRegex 'Set\(s\)'
    $contentsRaw = Get-FieldValue -Block $blockText -LabelRegex 'Contents'
    $priceRaw = Get-FieldValue -Block $blockText -LabelRegex 'Original Price'
    $notesRaw = Get-InfoValueFromHtml -BlockHtml $blockHtml
    if (-not $notesRaw) {
      $notesRaw = Get-FieldValue -Block $blockText -LabelRegex 'Info'
    }

    $kind = if ($contentsRaw -or $entryTitle -match '(?i)\b(Set|Pak)\b$') { 'set' } else { 'gear' }

    $assetLinks = @()
    $manualMatches = [regex]::Matches($blockHtml, '(?is)(?:href|src)\s*=\s*["''](?<u>[^"'']+)["'']')
    foreach ($mm in $manualMatches) {
      $u = $mm.Groups['u'].Value.Trim()
      if ($u -match '(?i)\.(html?)$') { continue }

      $normalizedAsset = Normalize-AssetLink $u
      if (-not $normalizedAsset) { continue }
      $assetLinks += $normalizedAsset
    }

    # Legacy image links are often embedded in JavaScript popup handlers.
    $popupMatches = [regex]::Matches($blockHtml, '(?is)window\.open\(\s*["''](?<u>[^"'']+)["'']')
    foreach ($pm in $popupMatches) {
      $u = $pm.Groups['u'].Value.Trim()
      $normalizedAsset = Normalize-AssetLink $u
      if (-not $normalizedAsset) { continue }
      if ($normalizedAsset -match '(?i)\.(html?)$') { continue }
      $assetLinks += $normalizedAsset
    }

    $gearRecords += [pscustomobject]@{
      sourceFile = $file.Name
      sourcePath = "old_lasertag_html/$($file.Name)"
      sourceUrl = "https://khanjal.com/lasertag/$($file.Name)"
      anchor = $anchor
      title = $entryTitle
      kind = $kind
      releasedRaw = $releasedRaw
      modelNumberRaw = $modelRaw
      batteryRequirementRaw = $batteryRaw
      rangeRaw = $rangeRaw
      ammoRaw = $ammoRaw
      accessoryPortsRaw = $portsRaw
      setNamesRaw = $setNamesRaw
      contentsRaw = $contentsRaw
      originalPriceRaw = $priceRaw
      notesRaw = $notesRaw
      assetLinks = $assetLinks | Sort-Object -Unique
    }
  }
}

# 3) Copy all linked assets into app/public/legacy/site-linked.
$linkedOut = Join-Path $publicLegacyRoot 'site-linked'
if (Test-Path $linkedOut) {
  Remove-Item -Recurse -Force $linkedOut
}
New-Item -ItemType Directory -Force -Path $linkedOut | Out-Null

foreach ($asset in $linkedAssets) {
  if ([string]::IsNullOrWhiteSpace($asset)) { continue }
  if (-not (Test-Path $asset)) { continue }
  $relative = $asset.Replace($legacyRoot, '').TrimStart([char[]]@([char]92, [char]47))
  if ($relative.StartsWith('..')) { continue }
  $dest = Join-Path $linkedOut $relative
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
  Copy-Item -Path $asset -Destination $dest -Force
}

# 4) Build app seed JSON from extracted gear records.
$seed = @()
foreach ($r in $gearRecords) {
  $base = [System.IO.Path]::GetFileNameWithoutExtension($r.sourceFile)
  $map = $sourceMap[$base]
  if (-not $map) { continue }

  $id = Slugify("$base-$($r.anchor)")
  $slug = Slugify("$($r.title)-$($r.anchor)")
  $year = Parse-Year $r.releasedRaw

  $assets = @()
  foreach ($assetLink in $r.assetLinks) {
    $clean = $assetLink.Trim()
    if ([string]::IsNullOrWhiteSpace($clean)) { continue }

    $normalized = $clean.Replace('\\', '/').TrimStart('.')
    $normalized = $normalized.TrimStart('/')

    if ($normalized -match '^(?i)images/(t|image|manual|sound|winzip|curve|curve2)\.gif$') {
      continue
    }
    if ($normalized -match '^(?i)images/icon_khanjal_lasertag\.ico$') {
      continue
    }

    $kind = Get-AssetKind $normalized
    $assets += [pscustomobject]@{
      name = [System.IO.Path]::GetFileName($normalized)
      url = "/legacy/site/$normalized"
      kind = $kind
      sourcePath = $clean
    }
  }

  $assets = @($assets | Sort-Object kind, name -Unique)
  $manuals = @($assets | Where-Object { $_.kind -eq 'manual' } | ForEach-Object {
      [pscustomobject]@{
        title = $_.name
        url = $_.url
      }
    })

  $desc = if ($r.notesRaw) { Clean-DescriptionText $r.notesRaw } else { "Legacy imported entry for $($r.title)." }

  $releasedValue = Extract-Spec $r.releasedRaw
  $modelValue = Extract-Spec $r.modelNumberRaw
  $batteryValue = Extract-Spec $r.batteryRequirementRaw
  $batteryPacks = Parse-BatteryPacks $batteryValue
  $rangeValue = Extract-Spec $r.rangeRaw
  $ammoValue = Extract-Spec $r.ammoRaw
  $portValue = Extract-Spec $r.accessoryPortsRaw
  $setNamesValue = Extract-Spec $r.setNamesRaw
  $contentsValue = Extract-Spec $r.contentsRaw
  $priceValue = Extract-Spec $r.originalPriceRaw
  $notesValue = Clean-DescriptionText (Extract-Spec $r.notesRaw)

  # Keep tags focused on product-level classification only.
  $tagSet = New-Object 'System.Collections.Generic.HashSet[string]'

  if ($r.kind -eq 'set') {
    $null = $tagSet.Add('Set')
  }

  $lineLabel = if ($map.series -and $map.family -and $map.series -ne $map.family) {
    "$($map.series) $($map.family)"
  } else {
    $map.family
  }

  $seedItem = [pscustomobject]@{
    id = $id
    slug = $slug
    name = $r.title
    series = $map.series
    family = $map.family
    manufacturer = $map.manufacturer
    marketSegment = $map.marketSegment
    playContext = $map.playContext
    eraStart = if ($year -gt 0) { $year } else { 0 }
    compatibility = @($lineLabel)
    tags = @($tagSet | Sort-Object)
    description = $desc
    manuals = $manuals
    specs = [pscustomobject]@{
      released = $releasedValue
      modelNumber = $modelValue
      batteryRequirements = $batteryValue
      batteryPacks = @($batteryPacks)
      range = $rangeValue
      ammo = $ammoValue
      accessoryPorts = $portValue
      setNames = $setNamesValue
      contents = $contentsValue
      originalPrice = $priceValue
      notes = $notesValue
      kind = $r.kind
    }
    assets = $assets
    source = [pscustomobject]@{
      sourceFile = $r.sourceFile
      sourceAnchor = $r.anchor
      sourceUrl = $r.sourceUrl
    }
  }

  # Remove null and empty-array spec fields for cleaner payloads.
  if ($seedItem.specs) {
    $seedItem.specs.PSObject.Properties | Where-Object {
      $_.Value -eq $null -or ($_.Value -is [array] -and $_.Value.Count -eq 0)
    } | ForEach-Object { $seedItem.specs.PSObject.Properties.Remove($_.Name) }
  }

  # Remove null top-level fields to keep JSON clean
  $seedItem.PSObject.Properties | Where-Object Value -eq $null | ForEach-Object { $seedItem.PSObject.Properties.Remove($_.Name) }

  $seed += $seedItem
}

# 4b) Consolidate color variants into a single item with colors array.
$colorGroups = @{}
$consolidatedSeed = @()
$usedIndices = New-Object System.Collections.Generic.HashSet[int]

for ($i = 0; $i -lt $seed.Count; $i++) {
  if ($usedIndices.Contains($i)) { continue }

  $item = $seed[$i]
  $baseName = Get-BaseName $item.name
  $color = Extract-Color $item.name
  $groupKey = "$($item.series)::$($item.family)::$($item.manufacturer)::$baseName"

  $groupItems = @()
  $groupItems += $i
  $null = $usedIndices.Add($i)

  # Find other items in the same group
  for ($j = $i + 1; $j -lt $seed.Count; $j++) {
    if ($usedIndices.Contains($j)) { continue }
    $otherItem = $seed[$j]
    $otherBaseName = Get-BaseName $otherItem.name
    $otherKey = "$($otherItem.series)::$($otherItem.family)::$($otherItem.manufacturer)::$otherBaseName"

    if ($otherKey -eq $groupKey) {
      $groupItems += $j
      $null = $usedIndices.Add($j)
    }
  }

  # If we found color variants, consolidate them
  if ($groupItems.Count -gt 1) {
    $primary = $seed[$groupItems[0]]
    $colors = New-Object System.Collections.Generic.HashSet[string]

    $allAssets = @()
    $allManuals = @()
    $allTags = New-Object System.Collections.Generic.HashSet[string]

    foreach ($idx in $groupItems) {
      $variant = $seed[$idx]
      $variantColor = Extract-Color $variant.name

      if ($variantColor) {
        $null = $colors.Add($variantColor)
      }

      # Merge assets and manuals from all variants
      if ($variant.assets) {
        $allAssets += $variant.assets
      }
      if ($variant.manuals) {
        $allManuals += $variant.manuals
      }
      if ($variant.tags) {
        foreach ($tag in $variant.tags) {
          $null = $allTags.Add($tag)
        }
      }
    }

    # Update primary item with consolidated data
    $primary.colors = @($colors | Sort-Object)
    $primary.assets = @($allAssets | Sort-Object -Property kind, name -Unique)
    $primary.manuals = @($allManuals | Sort-Object -Property title -Unique)
    $primary.tags = @($allTags | Sort-Object)

    # Update name to base name if it had a color suffix
    if ($color) {
      $primary.name = $baseName
      $primary.slug = Slugify($baseName)
    }

    $consolidatedSeed += $primary
  } else {
    # No variants found, keep as-is
    $consolidatedSeed += $item
  }
}

$seed = $consolidatedSeed

$seed = $seed | Sort-Object family, name

# 5) Write outputs.
$pageOut = Join-Path $legacyDataRoot 'pages.raw.json'
$recordsOut = Join-Path $legacyDataRoot 'gear.records.raw.json'
$missingOut = Join-Path $legacyDataRoot 'missing-links.json'
$summaryOut = Join-Path $legacyDataRoot 'summary.json'

$pageRecords | ConvertTo-Json -Depth 6 | Set-Content -Path $pageOut -Encoding UTF8
$gearRecords | ConvertTo-Json -Depth 7 | Set-Content -Path $recordsOut -Encoding UTF8
@($missingAssets) | Sort-Object -Unique | ConvertTo-Json -Depth 3 | Set-Content -Path $missingOut -Encoding UTF8
$seed | ConvertTo-Json -Depth 8 | Set-Content -Path $seedPath -Encoding UTF8

$summary = [pscustomobject]@{
  htmlPages = $htmlFiles.Count
  gearRecords = $gearRecords.Count
  seedItems = $seed.Count
  linkedAssetsFound = $linkedAssets.Count
  missingLinkCount = @($missingAssets).Count
  generatedAt = (Get-Date).ToString('s')
}
$summary | ConvertTo-Json -Depth 4 | Set-Content -Path $summaryOut -Encoding UTF8

Write-Output "Wrote: $pageOut"
Write-Output "Wrote: $recordsOut"
Write-Output "Wrote: $missingOut"
Write-Output "Wrote: $seedPath"
Write-Output "Wrote: $summaryOut"
Write-Output "Mirrored full legacy site to: $legacySiteMirror"
Write-Output "Copied linked files to: $linkedOut"
Write-Output ("Summary: pages={0}, records={1}, seed={2}, linkedAssets={3}, missing={4}" -f $summary.htmlPages, $summary.gearRecords, $summary.seedItems, $summary.linkedAssetsFound, $summary.missingLinkCount)
