export type GearMarketSegment = 'retail' | 'commercial' | 'military' | 'prosumer' | 'hobby' | 'homemade' | 'other';
export type GearPlayContext = 'home' | 'arena' | 'hybrid';

export interface GearManual {
  title: string;
  url: string;
}

export interface GearSource {
  sourceFile?: string;
  sourceAnchor?: string;
  sourceUrl?: string;
}

export interface GearAsset {
  name: string;
  url: string;
  kind: 'manual' | 'audio' | 'image' | 'archive' | 'document' | 'other';
  sourcePath?: string;
}

export interface GearBatteryPack {
  type: string;
  quantity?: number;
}

export interface GearSpecs {
  released?: string;
  modelNumber?: string;
  batteryRequirements?: string;
  batteryPacks?: GearBatteryPack[];
  range?: string;
  ammo?: string;
  accessoryPorts?: string;
  setNames?: string;
  contents?: string;
  originalPrice?: string;
  notes?: string;
  kind?: 'gear' | 'set';
}

export interface GearItem {
  id: string;
  slug: string;
  name: string;
  series?: string;
  family: string;
  manufacturer: string;
  colors?: string[];
  marketSegment: GearMarketSegment;
  playContext: GearPlayContext;
  eraStart: number;
  eraEnd?: number;
  compatibility: string[];
  tags: string[];
  description: string;
  manuals: GearManual[];
  specs?: GearSpecs;
  assets?: GearAsset[];

  source?: GearSource;
}
