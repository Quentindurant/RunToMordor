import { Biome, BiomeId, GameState } from '../types/game.types';

export const BIOMES: Record<BiomeId, Biome> = {
  shire: {
    id: 'shire',
    name: 'La Comté',
    description: 'Les vertes collines du pays Hobbit. Pipeweed et second breakfast vous attendent.',
    maxKm: 15,
    primaryColor: '#4ade80',
    bgColor: '#052e16',
    textColor: '#bbf7d0',
    emoji: '🌿',
  },
  rivendell: {
    id: 'rivendell',
    name: 'Fondcombe',
    description: 'La dernière demeure homogène des Elfes. Elrond veille sur votre chemin.',
    maxKm: 40,
    primaryColor: '#60a5fa',
    bgColor: '#0c1a2e',
    textColor: '#bfdbfe',
    emoji: '🌊',
  },
  moria: {
    id: 'moria',
    name: 'Les Mines de la Moria',
    description: 'Les sombres profondeurs naines. Vous ne passerez pas... ou peut-être.',
    maxKm: 70,
    primaryColor: '#f59e0b',
    bgColor: '#1c0a00',
    textColor: '#fde68a',
    emoji: '⚒️',
  },
  mordor: {
    id: 'mordor',
    name: 'Le Mordor',
    description: 'Un endroit où l\'ombre règne. Mont Destin en vue.',
    maxKm: Infinity,
    primaryColor: '#ef4444',
    bgColor: '#1a0000',
    textColor: '#fecaca',
    emoji: '🌋',
  },
};

export const BIOME_ORDER: BiomeId[] = ['shire', 'rivendell', 'moria', 'mordor'];

export const TOTAL_JOURNEY_KM = 70;

export const getBiomeByDistance = (km: number): Biome => {
  if (km < BIOMES.shire.maxKm) return BIOMES.shire;
  if (km < BIOMES.rivendell.maxKm) return BIOMES.rivendell;
  if (km < BIOMES.moria.maxKm) return BIOMES.moria;
  return BIOMES.mordor;
};

export const getProgressPercent = (state: GameState): number => {
  return Math.min(100, (state.totalDistance / TOTAL_JOURNEY_KM) * 100);
};
