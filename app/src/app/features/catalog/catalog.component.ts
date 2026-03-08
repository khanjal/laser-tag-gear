import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GearRepository } from '../../data-access/gear.repository';
import { GearItem, GearType } from '../../models/gear.model';

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
  selectedType = 'all';

  readonly typeOptions: Array<GearType | 'all'> = ['all', 'home', 'arena', 'hybrid'];
  readonly allItems = this.repository.getAll();
  readonly manufacturers = this.repository.getManufacturers();
  readonly families = this.repository.getFamilies();

  get filteredItems(): GearItem[] {
    const query = this.searchTerm.trim().toLowerCase();

    return this.allItems.filter((item) => {
      const matchesManufacturer = this.selectedManufacturer === 'all' || item.manufacturer === this.selectedManufacturer;
      const matchesFamily = this.selectedFamily === 'all' || item.family === this.selectedFamily;
      const matchesType = this.selectedType === 'all' || item.type === this.selectedType;
      const matchesQuery =
        query.length === 0 ||
        item.name.toLowerCase().includes(query) ||
        item.manufacturer.toLowerCase().includes(query) ||
        item.family.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        item.compatibility.some((group) => group.toLowerCase().includes(query));

      return matchesManufacturer && matchesFamily && matchesType && matchesQuery;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedManufacturer = 'all';
    this.selectedFamily = 'all';
    this.selectedType = 'all';
  }
}
