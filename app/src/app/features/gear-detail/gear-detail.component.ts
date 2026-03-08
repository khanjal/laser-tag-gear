import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GearRepository } from '../../data-access/gear.repository';
import { GearItem } from '../../models/gear.model';

@Component({
  selector: 'app-gear-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './gear-detail.component.html'
})
export class GearDetailComponent {
  readonly gear?: GearItem;
  readonly related: GearItem[];

  constructor(route: ActivatedRoute, repository: GearRepository) {
    const slug = route.snapshot.paramMap.get('slug');
    this.gear = slug ? repository.getBySlug(slug) : undefined;

    if (!this.gear) {
      this.related = [];
      return;
    }

    this.related = repository
      .getAll()
      .filter((item) => item.slug !== this.gear?.slug)
      .filter((item) => item.family === this.gear?.family || item.manufacturer === this.gear?.manufacturer)
      .slice(0, 4);
  }
}
