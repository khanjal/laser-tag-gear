import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GearRepository } from '../../data-access/gear.repository';
import { GearItem, GearMarketSegment, GearPlayContext } from '../../models/gear.model';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './catalog.component.html'
})
export class CatalogComponent {
  private readonly repository = inject(GearRepository);
  private readonly route = inject(ActivatedRoute);

  searchTerm = '';
  selectedManufacturer = 'all';
  selectedFamily = 'all';
  selectedSeries = 'all';
  selectedMarketSegment = 'all';
  selectedPlayContext = 'all';

  readonly marketSegmentOptions: Array<GearMarketSegment | 'all'> = ['all', 'retail', 'commercial', 'military', 'prosumer'];
  readonly playContextOptions: Array<GearPlayContext | 'all'> = ['all', 'home', 'arena', 'hybrid'];
  readonly allItems = this.repository.getAll();
  readonly manufacturers = this.repository.getManufacturers();
  readonly families = this.repository.getFamilies();
  readonly seriesOptions = Array.from(new Set(this.allItems.map((item) => item.series).filter((series): series is string => !!series))).sort((a, b) =>
    a.localeCompare(b)
  );

  constructor() {
    const family = this.route.snapshot.queryParamMap.get('family');
    const series = this.route.snapshot.queryParamMap.get('series');
    const manufacturer = this.route.snapshot.queryParamMap.get('manufacturer');
    const q = this.route.snapshot.queryParamMap.get('q');

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
}
