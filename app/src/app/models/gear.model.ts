export type GearMarketSegment = 'retail' | 'commercial' | 'military' | 'prosumer';
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

export interface GearLegacyData {
  releasedRaw?: string | null;
  modelNumberRaw?: string | null;
  batteryRequirementRaw?: string | null;
  rangeRaw?: string | null;
  ammoRaw?: string | null;
  accessoryPortsRaw?: string | null;
  setNamesRaw?: string | null;
  contentsRaw?: string | null;
  originalPriceRaw?: string | null;
  notesRaw?: string | null;
  assetLinks?: string[];
}

export interface GearItem {
  id: string;
  slug: string;
  name: string;
  family: string;
  manufacturer: string;
  marketSegment: GearMarketSegment;
  playContext: GearPlayContext;
  eraStart: number;
  eraEnd?: number;
  compatibility: string[];
  tags: string[];
  description: string;
  manuals: GearManual[];
  source?: GearSource;
  legacy?: GearLegacyData;
}
