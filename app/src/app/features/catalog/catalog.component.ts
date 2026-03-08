import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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

  searchTerm = '';
  selectedManufacturer = 'all';
  selectedFamily = 'all';
  selectedMarketSegment = 'all';
  selectedPlayContext = 'all';

  readonly marketSegmentOptions: Array<GearMarketSegment | 'all'> = ['all', 'retail', 'commercial', 'military', 'prosumer'];
  readonly playContextOptions: Array<GearPlayContext | 'all'> = ['all', 'home', 'arena', 'hybrid'];
  readonly allItems = this.repository.getAll();
  readonly manufacturers = this.repository.getManufacturers();
  readonly families = this.repository.getFamilies();

  get filteredItems(): GearItem[] {
    const query = this.searchTerm.trim().toLowerCase();

    return this.allItems.filter((item) => {
      const matchesManufacturer = this.selectedManufacturer === 'all' || item.manufacturer === this.selectedManufacturer;
      const matchesFamily = this.selectedFamily === 'all' || item.family === this.selectedFamily;
      const matchesMarketSegment = this.selectedMarketSegment === 'all' || item.marketSegment === this.selectedMarketSegment;
      const matchesPlayContext = this.selectedPlayContext === 'all' || item.playContext === this.selectedPlayContext;
      const matchesQuery =
        query.length === 0 ||
        item.name.toLowerCase().includes(query) ||
        item.manufacturer.toLowerCase().includes(query) ||
        item.family.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        item.compatibility.some((group) => group.toLowerCase().includes(query));

      return matchesManufacturer && matchesFamily && matchesMarketSegment && matchesPlayContext && matchesQuery;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedManufacturer = 'all';
    this.selectedFamily = 'all';
    this.selectedMarketSegment = 'all';
    this.selectedPlayContext = 'all';
  }
}
