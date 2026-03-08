import { Injectable } from '@angular/core';
import { GearItem } from '../models/gear.model';
import gearSeed from '../data/gear.seed.json';

@Injectable({ providedIn: 'root' })
export class GearRepository {
  private readonly items: GearItem[] = gearSeed as GearItem[];

  getAll(): GearItem[] {
    return [...this.items].sort((a, b) => a.name.localeCompare(b.name));
  }

  getBySlug(slug: string): GearItem | undefined {
    return this.items.find((item) => item.slug === slug);
  }

  getManufacturers(): string[] {
    return [...new Set(this.items.map((item) => item.manufacturer))].sort((a, b) => a.localeCompare(b));
  }

  getFamilies(): string[] {
    return [...new Set(this.items.map((item) => item.family))].sort((a, b) => a.localeCompare(b));
  }
}
