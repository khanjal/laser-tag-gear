import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { GearRepository } from '../../data-access/gear.repository';
import { GearItem, GearMarketSegment, GearPlayContext } from '../../models/gear.model';
import { getVariantLabel } from '../../shared/utils/taxonomy.util';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './catalog.component.html'
})
export class CatalogComponent implements OnInit {
  private readonly repository = inject(GearRepository);
  private readonly route = inject(ActivatedRoute);

  searchTerm = '';
  selectedManufacturer = 'all';
  selectedFamily = 'all';
  selectedSeries = 'all';
  selectedMarketSegment = 'all';
  selectedPlayContext = 'all';

  readonly marketSegmentOptions: Array<GearMarketSegment | 'all'> = ['all', 'retail', 'commercial', 'military', 'prosumer', 'hobby', 'homemade', 'other'];
  readonly playContextOptions: Array<GearPlayContext | 'all'> = ['all', 'home', 'arena', 'hybrid'];
  readonly allItems = this.repository.getAll();
  readonly manufacturers = this.repository.getManufacturers();
  readonly families = this.repository.getFamilies();
  readonly seriesOptions = Array.from(new Set(this.allItems.map((item) => item.series).filter((series): series is string => !!series))).sort((a, b) =>
    a.localeCompare(b)
  );

  constructor() {
    this.applyFromQueryParams(this.route.snapshot.queryParamMap);
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.applyFromQueryParams(params);
    });
  }

  get filteredItems(): GearItem[] {
    const query = this.searchTerm.trim().toLowerCase();

    return this.allItems.filter((item) => {
      const matchesManufacturer = this.selectedManufacturer === 'all' || item.manufacturer === this.selectedManufacturer;
      const matchesFamily = this.selectedFamily === 'all' || item.family === this.selectedFamily;
      const matchesSeries = this.selectedSeries === 'all' || item.series === this.selectedSeries;
      const matchesMarketSegment = this.selectedMarketSegment === 'all' || item.marketSegment === this.selectedMarketSegment;
      const matchesPlayContext = this.selectedPlayContext === 'all' || item.playContext === this.selectedPlayContext;
      const specValues = item.specs
        ? this.collectSearchStrings(item.specs)
        : [];
      const assetValues = item.assets
        ? item.assets
          .flatMap((asset) => [asset.name, asset.kind, asset.url])
          .map((value) => value.toLowerCase())
        : [];
      const matchesQuery =
        query.length === 0 ||
        item.name.toLowerCase().includes(query) ||
        item.manufacturer.toLowerCase().includes(query) ||
        item.family.toLowerCase().includes(query) ||
        (!!item.series && item.series.toLowerCase().includes(query)) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        item.compatibility.some((group) => group.toLowerCase().includes(query)) ||
        specValues.some((value) => value.includes(query)) ||
        assetValues.some((value) => value.includes(query));

      return matchesManufacturer && matchesFamily && matchesSeries && matchesMarketSegment && matchesPlayContext && matchesQuery;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedManufacturer = 'all';
    this.selectedFamily = 'all';
    this.selectedSeries = 'all';
    this.selectedMarketSegment = 'all';
    this.selectedPlayContext = 'all';
  }

  getLineLabel(item: GearItem): string {
    return getVariantLabel(item);
  }

  getYearRangeLabel(item: GearItem): string {
    if (item.eraEnd && item.eraEnd >= item.eraStart) {
      return `${item.eraStart} - ${item.eraEnd}`;
    }

    return `${item.eraStart}`;
  }

  getEraLabel(item: GearItem): string {
    const start = item.eraStart;
    const decadeBase = Math.floor(start / 10) * 10;
    const suffix = decadeBase % 100;
    const decadeLabel = `${suffix}s`;
    const yearInDecade = start - decadeBase;

    if (yearInDecade <= 2) {
      return `Early ${decadeLabel}`;
    }

    if (yearInDecade <= 6) {
      return `Mid ${decadeLabel}`;
    }

    return `Late ${decadeLabel}`;
  }

  getModelNumber(item: GearItem): string | undefined {
    const model = item.specs?.modelNumber?.trim();
    return model && model !== '?' ? model : undefined;
  }

  getPreviewImage(item: GearItem): string | undefined {
    return item.assets?.find((asset) => asset.kind === 'image')?.url;
  }

  getDisplayTags(item: GearItem): string[] {
    return item.tags.filter((tag) => tag === 'Set');
  }

  getVariantLabel(item: GearItem): string {
    return getVariantLabel(item);
  }

  shouldShowSeries(item: GearItem): boolean {
    const series = item.series?.trim();
    if (!series) {
      return false;
    }

    return this.getVariantLabel(item).toLowerCase() !== series.toLowerCase();
  }

  private collectSearchStrings(value: unknown): string[] {
    if (value === null || value === undefined) {
      return [];
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return [String(value).toLowerCase()];
    }

    if (Array.isArray(value)) {
      return value.flatMap((entry) => this.collectSearchStrings(entry));
    }

    if (typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).flatMap((entry) => this.collectSearchStrings(entry));
    }

    return [];
  }

  private applyFromQueryParams(params: ParamMap): void {
    this.searchTerm = '';
    this.selectedManufacturer = 'all';
    this.selectedFamily = 'all';
    this.selectedSeries = 'all';
    this.selectedMarketSegment = 'all';
    this.selectedPlayContext = 'all';

    const family = params.get('family');
    const series = params.get('series');
    const manufacturer = params.get('manufacturer');
    const q = params.get('q');

    if (family) {
      if (this.families.includes(family)) {
        this.selectedFamily = family;
      } else {
        this.searchTerm = family;
      }
    }

    if (manufacturer) {
      if (this.manufacturers.includes(manufacturer)) {
        this.selectedManufacturer = manufacturer;
      } else {
        this.searchTerm = this.searchTerm ? `${this.searchTerm} ${manufacturer}` : manufacturer;
      }
    }

    if (series) {
      if (this.seriesOptions.includes(series)) {
        this.selectedSeries = series;
      } else {
        this.searchTerm = this.searchTerm ? `${this.searchTerm} ${series}` : series;
      }
    }

    if (q) {
      this.searchTerm = this.searchTerm ? `${this.searchTerm} ${q}` : q;
    }
  }
}
