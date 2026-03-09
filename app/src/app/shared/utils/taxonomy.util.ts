import { GearItem } from '../../models/gear.model';

/**
 * Returns a non-redundant variant label by removing the series prefix when present.
 * Example: series="Laser Challenge", family="Laser Challenge V2" -> "V2"
 */
export function getVariantLabel(item: Pick<GearItem, 'series' | 'family'>): string {
  const family = item.family?.trim() ?? '';
  const series = item.series?.trim() ?? '';

  if (!family || !series) {
    return family;
  }

  const escapedSeries = series.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let stripped = family.replace(new RegExp(`^${escapedSeries}`, 'i'), '').trimStart();

  while (stripped.startsWith('-') || stripped.startsWith(':') || stripped.startsWith('/')) {
    stripped = stripped.slice(1).trimStart();
  }

  return stripped || family;
}
