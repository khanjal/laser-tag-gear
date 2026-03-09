import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GearRepository } from '@data-access/gear.repository';
import { GearItem } from '@models/gear.model';
import { getVariantLabel } from '@utils/taxonomy.util';

@Component({
  selector: 'app-gear-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './gear-detail.component.html'
})
export class GearDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly repository = inject(GearRepository);

  gear?: GearItem;
  related: GearItem[] = [];
  selectedImage?: string;
  private readonly linkableGearNames: Array<{ name: string; slug: string }>;

  constructor() {
    const allItems = this.repository.getAll();
    this.linkableGearNames = allItems
      .map((item) => ({ name: item.name, slug: item.slug }))
      .sort((a, b) => b.name.length - a.name.length);
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.loadGear(params.get('slug'));
      this.scrollToTop();
    });
  }

  private loadGear(slug: string | null): void {
    this.gear = slug ? this.repository.getBySlug(slug) : undefined;

    if (!this.gear) {
      this.related = [];
      return;
    }

    const sameSeriesAndLine = this.repository
      .getAll()
      .filter((item) => item.slug !== this.gear?.slug)
      .filter((item) => item.family === this.gear?.family)
      .filter((item) => (item.series?.trim() || '') === (this.gear?.series?.trim() || ''));

    const eraMatched = sameSeriesAndLine.filter((item) => this.isEraRelated(item, this.gear as GearItem));
    const fallback = sameSeriesAndLine.filter((item) => !eraMatched.some((m) => m.slug === item.slug));

    this.related = [...eraMatched, ...fallback].slice(0, 4);
  }

  private isEraRelated(candidate: GearItem, current: GearItem): boolean {
    const currentEnd = current.eraEnd ?? current.eraStart;
    const candidateEnd = candidate.eraEnd ?? candidate.eraStart;

    const overlaps = candidate.eraStart <= currentEnd && current.eraStart <= candidateEnd;
    if (overlaps) {
      return true;
    }

    const startGap = Math.abs(candidate.eraStart - current.eraStart);
    return startGap <= 3;
  }

  private scrollToTop(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  get series(): string | undefined {
    return this.gear?.series?.trim() || undefined;
  }

  get variant(): string {
    if (!this.gear) {
      return '';
    }

    return getVariantLabel(this.gear);
  }

  get activeYears(): string {
    if (!this.gear) {
      return '';
    }

    if (this.gear.eraEnd && this.gear.eraEnd >= this.gear.eraStart) {
      return `${this.gear.eraStart} - ${this.gear.eraEnd}`;
    }

    return `${this.gear.eraStart}`;
  }

  get eraLabel(): string {
    if (!this.gear) {
      return '';
    }

    const start = this.gear.eraStart;
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

  get displayTags(): string[] {
    return (this.gear?.tags ?? []).filter((tag) => tag === 'Set');
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

  openImageModal(imageUrl: string): void {
    this.selectedImage = imageUrl;
  }

  closeImageModal(): void {
    this.selectedImage = undefined;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.selectedImage) {
      this.closeImageModal();
    }
  }

  @HostListener('document:keydown.arrowleft')
  onArrowLeftKey(): void {
    if (this.selectedImage) {
      this.showPreviousImage();
    }
  }

  @HostListener('document:keydown.arrowright')
  onArrowRightKey(): void {
    if (this.selectedImage) {
      this.showNextImage();
    }
  }

  showPreviousImage(): void {
    if (!this.selectedImage || this.images.length < 2) {
      return;
    }

    const currentIndex = this.images.indexOf(this.selectedImage);
    const previousIndex = currentIndex <= 0 ? this.images.length - 1 : currentIndex - 1;
    this.selectedImage = this.images[previousIndex];
  }

  showNextImage(): void {
    if (!this.selectedImage || this.images.length < 2) {
      return;
    }

    const currentIndex = this.images.indexOf(this.selectedImage);
    const nextIndex = currentIndex < 0 || currentIndex === this.images.length - 1 ? 0 : currentIndex + 1;
    this.selectedImage = this.images[nextIndex];
  }

  get files(): Array<{ name: string; url: string }> {
    return (this.gear?.assets ?? [])
      .filter((a) => a.kind !== 'image')
      .map((a) => ({ name: a.name, url: a.url }));
  }

  getPreviewImage(item: GearItem): string | undefined {
    return item.assets?.find((asset) => asset.kind === 'image')?.url;
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

  getLinkedContentsParts(contents: string): Array<{ text: string; slug?: string }> {
    if (!contents || this.linkableGearNames.length === 0) {
      return [{ text: contents }];
    }

    const slugByName = new Map(this.linkableGearNames.map((item) => [item.name.toLowerCase(), item.slug]));
    const escapedNames = this.linkableGearNames
      .map((item) => item.name)
      .sort((a, b) => b.length - a.length)
      .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    const regex = new RegExp(`(${escapedNames.join('|')})`, 'gi');
    const parts: Array<{ text: string; slug?: string }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(contents)) !== null) {
      const index = match.index;
      if (index > lastIndex) {
        parts.push({ text: contents.slice(lastIndex, index) });
      }

      const token = match[0];
      const slug = slugByName.get(token.toLowerCase());
      parts.push(slug ? { text: token, slug } : { text: token });
      lastIndex = index + token.length;
    }

    if (lastIndex < contents.length) {
      parts.push({ text: contents.slice(lastIndex) });
    }

    return parts;
  }

  getContentsEntries(contents: string): string[] {
    if (!contents) {
      return [];
    }

    const entries: string[] = [];
    let current = '';
    let depth = 0;
    let index = 0;

    while (index < contents.length) {
      const char = contents[index];

      if (char === '(') {
        depth += 1;
        current += char;
        index += 1;
        continue;
      }

      if (char === ')') {
        depth = Math.max(0, depth - 1);
        current += char;
        index += 1;
        continue;
      }

      const andToken = contents.slice(index, index + 5).toLowerCase();
      if (depth === 0 && andToken === ' and ') {
        const trimmed = current.trim();
        if (trimmed) {
          entries.push(trimmed);
        }
        current = '';
        index += 5;
        continue;
      }

      if (depth === 0 && char === ',') {
        const trimmed = current.trim();
        if (trimmed) {
          entries.push(trimmed);
        }
        current = '';
        index += 1;
        continue;
      }

      current += char;
      index += 1;
    }

    const tail = current.trim();
    if (tail) {
      entries.push(tail);
    }

    return entries;
  }

  getSetEntries(setNames: string): string[] {
    return this.getContentsEntries(setNames);
  }

  getBatteryEntries(battery: string): Array<{ text: string; description?: string }> {
    if (!battery) {
      return [];
    }

    // If we have batteryPacks with structured data, use those
    const specData = this.gear?.specs;
    if (specData?.batteryPacks?.length) {
      return specData.batteryPacks.map(pack => {
        const text = pack.quantity ? `${pack.type} [${pack.quantity}]` : pack.type;
        return {
          text,
          description: pack.description
        };
      });
    }

    // Otherwise, parse the string (legacy format)
    return battery.split(/,\s*|\s+and\s+/i)
      .map(b => b.trim())
      .filter(b => b.length > 0)
      .map(b => ({ text: b }));
  }

  getSpecIcon(label: string): string {
    switch (label) {
      case 'Released':
        return 'calendar_month';
      case 'Model Number':
        return 'badge';
      case 'Battery':
        return 'battery_full';
      case 'Range':
        return 'straighten';
      case 'Ammo':
        return 'adjust';
      case 'Accessory Ports':
        return 'hub';
      case 'Set(s)':
        return 'inventory_2';
      case 'Contents':
        return 'list_alt';
      case 'Original Price':
        return 'sell';
      default:
        return 'label';
    }
  }
}
