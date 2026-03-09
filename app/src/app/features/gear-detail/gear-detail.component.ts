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

  get series(): string | undefined {
    const explicitSeries = this.gear?.series?.trim();
    if (explicitSeries) {
      return explicitSeries;
    }

    // Backward-compatible fallback for any old records without explicit series.
    const family = this.gear?.family;
    if (!family) {
      return undefined;
    }

    if (/^laser challenge\b/i.test(family)) {
      return 'Laser Challenge';
    }
    if (family.includes('/')) {
      return family.split('/')[0]?.trim();
    }

    return undefined;
  }

  get specs(): Array<{ label: string; value: string }> {
    if (!this.gear) {
      return [];
    }

    const specData = this.gear.specs;
    const batterySummary = specData?.batteryPacks?.length
      ? specData.batteryPacks
          .map((p) => (p.quantity ? `${p.type} [${p.quantity}]` : p.type))
          .join(', ')
      : specData?.batteryRequirements;
    const specs: Array<{ label: string; value: string | undefined }> = [
      { label: 'Released', value: specData?.released ?? this.gear.eraStart?.toString() },
      { label: 'Model Number', value: specData?.modelNumber },
      { label: 'Battery', value: batterySummary },
      { label: 'Range', value: specData?.range },
      { label: 'Ammo', value: specData?.ammo },
      { label: 'Accessory Ports', value: specData?.accessoryPorts },
      { label: 'Set(s)', value: specData?.setNames },
      { label: 'Contents', value: specData?.contents },
      { label: 'Original Price', value: specData?.originalPrice }
    ];

    return specs
      .filter((s) => !!s.value && s.value !== '?')
      .map((s) => ({ label: s.label, value: s.value as string }));
  }

  get images(): string[] {
    return (this.gear?.assets ?? []).filter((a) => a.kind === 'image').map((a) => a.url);
  }

  get files(): Array<{ name: string; url: string }> {
    return (this.gear?.assets ?? [])
      .filter((a) => a.kind !== 'image')
      .map((a) => ({ name: a.name, url: a.url }));
  }

  get linkedDescriptionParts(): Array<{ text: string; href?: string }> {
    const text = this.gear?.description ?? '';
    if (!text) {
      return [];
    }

    const files = this.files;
    if (files.length === 0) {
      return [{ text }];
    }

    const map = new Map(files.map((f) => [f.name.toLowerCase(), f.url]));
    const escapedNames = files
      .map((f) => f.name)
      .sort((a, b) => b.length - a.length)
      .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    const regex = new RegExp(`(${escapedNames.join('|')})`, 'gi');
    const parts: Array<{ text: string; href?: string }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const index = match.index;
      if (index > lastIndex) {
        parts.push({ text: text.slice(lastIndex, index) });
      }

      const token = match[0];
      const href = map.get(token.toLowerCase());
      parts.push(href ? { text: token, href } : { text: token });
      lastIndex = index + token.length;
    }

    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex) });
    }

    return parts;
  }
}
