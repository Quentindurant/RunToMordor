export type BiomeId = 'shire' | 'rivendell' | 'moria' | 'mordor';

export interface Biome {
  id: BiomeId;
  name: string;
  description: string;
  maxKm: number;
  primaryColor: string;
  bgColor: string;
  textColor: string;
  emoji: string;
}

export type GameEventType = 'orc_ambush' | 'nazgul_scan';

export interface GameEvent {
  id: string;
  type: GameEventType;
  timestamp: number;
}

export interface GameState {
  totalDistance: number;
  playerHP: number;
  lembasCount: number;
  currentBiomeId: BiomeId;
  traversedBiomes: BiomeId[];
}
