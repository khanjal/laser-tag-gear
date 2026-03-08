export type GearMarketSegment = 'retail' | 'commercial' | 'military' | 'prosumer';
export type GearPlayContext = 'home' | 'arena' | 'hybrid';

export interface GearManual {
  title: string;
  url: string;
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
}
