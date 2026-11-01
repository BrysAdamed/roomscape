export type MaterialCategory =
  'paint' | 'wood' | 'tile' | 'stone' | 'fabric' | 'metal' | 'glass' | 'ceramic';

export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  color: string;
  roughness: number;
  metalness: number;
  opacity?: number;
}

export const materials: readonly Material[] = [
  {
    id: 'paint-white',
    name: 'White paint',
    category: 'paint',
    color: '#f2f0eb',
    roughness: 0.9,
    metalness: 0,
  },
  {
    id: 'paint-warm-grey',
    name: 'Warm grey paint',
    category: 'paint',
    color: '#c9c3b8',
    roughness: 0.9,
    metalness: 0,
  },
  {
    id: 'paint-sage',
    name: 'Sage green paint',
    category: 'paint',
    color: '#a8b5a0',
    roughness: 0.9,
    metalness: 0,
  },
  {
    id: 'paint-dusty-blue',
    name: 'Dusty blue paint',
    category: 'paint',
    color: '#8fa3b5',
    roughness: 0.9,
    metalness: 0,
  },
  {
    id: 'paint-terracotta',
    name: 'Terracotta paint',
    category: 'paint',
    color: '#c47a5a',
    roughness: 0.9,
    metalness: 0,
  },
  {
    id: 'paint-charcoal',
    name: 'Charcoal paint',
    category: 'paint',
    color: '#45464a',
    roughness: 0.9,
    metalness: 0,
  },
  {
    id: 'wood-oak-natural',
    name: 'Natural oak',
    category: 'wood',
    color: '#c8a27a',
    roughness: 0.7,
    metalness: 0,
  },
  {
    id: 'wood-oak-light',
    name: 'Light oak',
    category: 'wood',
    color: '#dcc5a2',
    roughness: 0.7,
    metalness: 0,
  },
  {
    id: 'wood-walnut',
    name: 'Walnut',
    category: 'wood',
    color: '#6e4b32',
    roughness: 0.65,
    metalness: 0,
  },
  {
    id: 'wood-ash-grey',
    name: 'Grey ash',
    category: 'wood',
    color: '#a39a8e',
    roughness: 0.7,
    metalness: 0,
  },
  {
    id: 'wood-white-lacquer',
    name: 'White lacquer',
    category: 'wood',
    color: '#f5f4f0',
    roughness: 0.35,
    metalness: 0,
  },
  {
    id: 'tile-white-matte',
    name: 'White matte tile',
    category: 'tile',
    color: '#ecebe7',
    roughness: 0.6,
    metalness: 0,
  },
  {
    id: 'tile-grey-concrete',
    name: 'Concrete-look tile',
    category: 'tile',
    color: '#9c9a96',
    roughness: 0.8,
    metalness: 0,
  },
  {
    id: 'tile-black-slate',
    name: 'Black slate tile',
    category: 'tile',
    color: '#2f3033',
    roughness: 0.75,
    metalness: 0,
  },
  {
    id: 'stone-marble-white',
    name: 'White marble',
    category: 'stone',
    color: '#e9e6e1',
    roughness: 0.3,
    metalness: 0,
  },
  {
    id: 'fabric-linen',
    name: 'Linen',
    category: 'fabric',
    color: '#d9d1c3',
    roughness: 1,
    metalness: 0,
  },
  {
    id: 'fabric-charcoal',
    name: 'Charcoal fabric',
    category: 'fabric',
    color: '#4a4a4e',
    roughness: 1,
    metalness: 0,
  },
  {
    id: 'fabric-mustard',
    name: 'Mustard fabric',
    category: 'fabric',
    color: '#c9a03d',
    roughness: 1,
    metalness: 0,
  },
  {
    id: 'fabric-navy',
    name: 'Navy fabric',
    category: 'fabric',
    color: '#2e3d57',
    roughness: 1,
    metalness: 0,
  },
  {
    id: 'metal-black',
    name: 'Black metal',
    category: 'metal',
    color: '#222222',
    roughness: 0.5,
    metalness: 0.8,
  },
  {
    id: 'metal-brushed-steel',
    name: 'Brushed steel',
    category: 'metal',
    color: '#b8b9bb',
    roughness: 0.4,
    metalness: 0.9,
  },
  {
    id: 'glass-clear',
    name: 'Clear glass',
    category: 'glass',
    color: '#d6e6ee',
    roughness: 0.05,
    metalness: 0,
    opacity: 0.25,
  },
  {
    id: 'glass-black',
    name: 'Black glass',
    category: 'glass',
    color: '#141516',
    roughness: 0.08,
    metalness: 0.2,
  },
  {
    id: 'ceramic-white',
    name: 'White ceramic',
    category: 'ceramic',
    color: '#f4f4f2',
    roughness: 0.15,
    metalness: 0,
  },
  {
    id: 'ceramic-grey',
    name: 'Grey ceramic',
    category: 'ceramic',
    color: '#9c9d9b',
    roughness: 0.2,
    metalness: 0,
  },
];

const byId = new Map(materials.map((material) => [material.id, material]));

export function findMaterial(id: string): Material | undefined {
  return byId.get(id);
}

export function materialsInCategories(categories: readonly MaterialCategory[]): Material[] {
  return materials.filter((material) => categories.includes(material.category));
}
