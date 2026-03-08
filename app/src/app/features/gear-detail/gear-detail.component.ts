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

  private readonly ignoredAssetLinks = new Set([
    '../images/t.gif',
    '../images/curve.gif',
    '../images/curve2.gif',
    '../images/icon_khanjal_lasertag.ico',
    'images/t.gif',
    'images/image.gif',
    'images/manual.gif',
    'images/sound.gif',
    'images/winzip.gif'
  ]);

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

  get legacySpecs(): Array<{ label: string; value: string }> {
    if (!this.gear?.legacy) {
      return [];
    }

    const l = this.gear.legacy;
    const specs: Array<{ label: string; value: string | null | undefined }> = [
      { label: 'Released', value: l.releasedRaw },
      { label: 'Model Number', value: l.modelNumberRaw },
      { label: 'Battery Requirements', value: l.batteryRequirementRaw },
      { label: 'Range', value: l.rangeRaw },
      { label: 'Ammo', value: l.ammoRaw },
      { label: 'Accessory Ports', value: l.accessoryPortsRaw },
      { label: 'Set(s)', value: l.setNamesRaw },
      { label: 'Contents', value: l.contentsRaw },
      { label: 'Original Price', value: l.originalPriceRaw }
    ];

    return specs
      .filter((s) => !!s.value && s.value !== '?')
      .map((s) => ({ label: s.label, value: s.value as string }));
  }

  get legacyImages(): string[] {
    return this.toAssetUrls(['.jpg', '.jpeg', '.png', '.gif']).filter((url) => !url.endsWith('/images/image.gif'));
  }

  get legacyFiles(): Array<{ name: string; url: string }> {
    const urls = this.toAssetUrls(['.pdf', '.zip', '.wav', '.mp3', '.ogg', '.txt', '.doc']);
    return urls.map((url) => ({ name: this.fileNameFromUrl(url), url }));
  }

  private toAssetUrls(extensions: string[]): string[] {
    const links = this.gear?.legacy?.assetLinks ?? [];
    const result: string[] = [];

    for (const rawLink of links) {
      const link = rawLink.trim();
      if (!link || this.ignoredAssetLinks.has(link)) {
        continue;
      }

      const lower = link.toLowerCase();
      if (!extensions.some((ext) => lower.endsWith(ext))) {
        continue;
      }

      const normalized = link.replace(/^\.\//, '').replace(/^\.\.\//, '');
      const url = `/legacy/site/${normalized}`;
      if (!result.includes(url)) {
        result.push(url);
      }
    }

    return result;
  }

  private fileNameFromUrl(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1] ?? url;
  }
}
