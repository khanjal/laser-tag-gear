export type GearType = 'home' | 'arena' | 'hybrid';

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
  type: GearType;
  eraStart: number;
  eraEnd?: number;
  compatibility: string[];
  tags: string[];
  description: string;
  manuals: GearManual[];
}
