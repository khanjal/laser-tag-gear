$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$urlFile = Join-Path $root 'docs/legacy_gear_urls.txt'
if (-not (Test-Path $urlFile)) {
  throw "Missing URL list at $urlFile"
}

$urls = Get-Content $urlFile | Where-Object { $_ -and $_.Trim().Length -gt 0 } | ForEach-Object {
  $_.Trim().Replace('http://www.khanjal.com', 'https://khanjal.com')
} | Sort-Object -Unique

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

function Get-CleanText {
  param([string]$HtmlFragment)

  $text = $HtmlFragment
  $text = $text -replace '(?is)<script.*?</script>', ' '
  $text = $text -replace '(?is)<style.*?</style>', ' '
  $text = $text -replace '(?i)<br\s*/?>', ' '
  $text = $text -replace '(?i)</p>|</tr>|</table>|</li>|</h\d>|</td>|</font>', "`n"
  $text = $text -replace '(?i)<p>|<li>|<tr>|<h\d[^>]*>|<td[^>]*>|<font[^>]*>', "`n"
  $text = $text -replace '(?is)<[^>]+>', ' '
  $text = [System.Net.WebUtility]::HtmlDecode($text)
  return ($text -replace '\s+', ' ').Trim()
}

$all = @()

foreach ($url in $urls) {
  try {
    $html = (Invoke-WebRequest -Uri $url -UseBasicParsing).Content
  }
  catch {
    Write-Warning "Failed to fetch $url"
    continue
  }

  $blocks = [regex]::Matches($html, '(?is)<a\s+name="(?<anchor>[^"]+)"></a>(?<block>.*?)(?=<a\s+name="|$)')

  foreach ($m in $blocks) {
    $anchor = $m.Groups['anchor'].Value.Trim().ToLowerInvariant()
    if ($anchor -in @('top', 'overview', 'gear', 'sets')) { continue }

    $text = Get-CleanText -HtmlFragment $m.Groups['block'].Value
    if ($text -notmatch 'Released\s*[-:]' -or $text -notmatch 'Battery Req\.\s*:') { continue }

    $titleMatch = [regex]::Match($text, '^(?<t>.*?)\s+top\s+Released\s*[-:]', 'IgnoreCase')
    if (-not $titleMatch.Success) {
      $titleMatch = [regex]::Match($text, '^(?<t>.*?)\s+Released\s*[-:]', 'IgnoreCase')
    }
    $title = if ($titleMatch.Success) { ($titleMatch.Groups['t'].Value -replace '\s+', ' ').Trim() } else { $anchor }

    if ($title -match '^\(\d+\s*KB\)\s*') {
      $title = $title -replace '^\(\d+\s*KB\)\s*', ''
    }

    $released = Get-FieldValue -Block $text -LabelRegex 'Released\s*[-]'
    if (-not $released) {
      $releasedMatch = [regex]::Match($text, '(?is)Released\s*[-:]\s*(?<v>.*?)(?=Model Number\s*\:|Battery Req\.\s*\:|Range\s*\:|Ammo\s*\:|Accessory Port\(s\)\s*\:|Set\(s\)\s*\:|Contents\s*\:|Original Price\s*\:|Info\s*\:|$)')
      if ($releasedMatch.Success) {
        $released = ($releasedMatch.Groups['v'].Value -replace '\s+', ' ').Trim()
      }
    }

    $rest = $text

    if ($title.Length -lt 3) { continue }

    $battery = Get-FieldValue -Block $rest -LabelRegex 'Battery Req\.'
    $model = Get-FieldValue -Block $rest -LabelRegex 'Model Number'
    $range = Get-FieldValue -Block $rest -LabelRegex 'Range'
    $ammo = Get-FieldValue -Block $rest -LabelRegex 'Ammo'
    $ports = Get-FieldValue -Block $rest -LabelRegex 'Accessory Port\(s\)'
    $sets = Get-FieldValue -Block $rest -LabelRegex 'Set\(s\)'
    $contents = Get-FieldValue -Block $rest -LabelRegex 'Contents'
    $price = Get-FieldValue -Block $rest -LabelRegex 'Original Price'
    $info = Get-FieldValue -Block $rest -LabelRegex 'Info'

    $kind = if ($contents -or $title -match '(?i)\b(Set|Pak)\b$') { 'set' } else { 'gear' }

    $all += [pscustomobject]@{
      sourceUrl = $url
      anchor = $anchor
      title = $title
      kind = $kind
      releasedRaw = $released
      modelNumberRaw = $model
      batteryRequirementRaw = $battery
      rangeRaw = $range
      ammoRaw = $ammo
      accessoryPortsRaw = $ports
      setNamesRaw = $sets
      contentsRaw = $contents
      originalPriceRaw = $price
      notesRaw = $info
    }
  }
}

$outDir = Join-Path $root 'docs/legacy_extract'
$jsonPath = Join-Path $outDir 'legacy_gear_records.raw.json'
$csvPath = Join-Path $outDir 'legacy_gear_records.raw.csv'
$summaryPath = Join-Path $outDir 'legacy_gear_records.summary.txt'

$all = $all | Sort-Object sourceUrl, title -Unique

$all | ConvertTo-Json -Depth 5 | Set-Content -Path $jsonPath -Encoding UTF8
$all | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8

$byUrl = $all | Group-Object sourceUrl | Sort-Object Name
$lines = @()
$lines += "Total records: $($all.Count)"
$lines += ""
foreach ($g in $byUrl) {
  $lines += "$($g.Name) => $($g.Count)"
}
$lines | Set-Content -Path $summaryPath -Encoding UTF8

Write-Output "Wrote: $jsonPath"
Write-Output "Wrote: $csvPath"
Write-Output "Wrote: $summaryPath"
Write-Output "Total records: $($all.Count)"
