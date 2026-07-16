import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState, BiomeId } from '../types/game.types';
import { getBiomeByDistance, BIOME_ORDER } from '../constants/biomes';

const STORAGE_KEY = '@run_to_mordor_v1';
const MAX_HP = 100;
const LEMBAS_HP_RESTORE = 10;
const KM_PER_LEMBAS = 1;

const DEFAULT_STATE: GameState = {
  totalDistance: 0,
  playerHP: MAX_HP,
  lembasCount: 0,
  currentBiomeId: 'shire',
  traversedBiomes: ['shire'],
};

export interface UseGameStateReturn {
  state: GameState;
  isLoading: boolean;
  maxHP: number;
  currentBiome: ReturnType<typeof getBiomeByDistance>;
  progressPercent: number;
  /** Ajoute de la distance (simulation ou GPS) et calcule le lembas gagné */
  addDistance: (km: number) => void;
  /** Applique un delta de HP (positif ou négatif), clampé à [0, MAX_HP] */
  applyHpDelta: (delta: number) => void;
  consumeLembas: () => void;
  resetGame: () => void;
}

export const useGameState = (): UseGameStateReturn => {
  const [state, setState] = useState<GameState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(true);

  // --- Persistance ---

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setState(JSON.parse(raw) as GameState);
      } catch (e) {
        console.warn('[GameState] load error:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persist = useCallback((next: GameState) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(
      (e) => console.warn('[GameState] save error:', e)
    );
  }, []);

  const update = useCallback(
    (updater: (prev: GameState) => GameState) => {
      setState((prev) => {
        const next = updater(prev);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  // --- Helpers ---

  const mergeTraversedBiomes = (current: BiomeId[], newId: BiomeId): BiomeId[] => {
    if (current.includes(newId)) return current;
    return BIOME_ORDER.filter((b) => current.includes(b) || b === newId);
  };

  // --- Actions ---

  const addDistance = useCallback(
    (km: number) => {
      update((prev) => {
        const newDist = prev.totalDistance + km;
        const newBiome = getBiomeByDistance(newDist);
        const newLembas = prev.lembasCount + Math.floor(km * KM_PER_LEMBAS);
        return {
          ...prev,
          totalDistance: newDist,
          lembasCount: newLembas,
          currentBiomeId: newBiome.id,
          traversedBiomes: mergeTraversedBiomes(prev.traversedBiomes, newBiome.id),
        };
      });
    },
    [update]
  );

  const applyHpDelta = useCallback(
    (delta: number) => {
      update((prev) => ({
        ...prev,
        playerHP: Math.min(MAX_HP, Math.max(0, prev.playerHP + delta)),
      }));
    },
    [update]
  );

  const consumeLembas = useCallback(() => {
    update((prev) => {
      if (prev.lembasCount <= 0) return prev;
      return {
        ...prev,
        lembasCount: prev.lembasCount - 1,
        playerHP: Math.min(MAX_HP, prev.playerHP + LEMBAS_HP_RESTORE),
      };
    });
  }, [update]);

  const resetGame = useCallback(() => {
    update(() => DEFAULT_STATE);
  }, [update]);

  // --- Valeurs dérivées ---

  const currentBiome = getBiomeByDistance(state.totalDistance);
  const progressPercent = Math.min(100, (state.totalDistance / 70) * 100);

  return {
    state,
    isLoading,
    maxHP: MAX_HP,
    currentBiome,
    progressPercent,
    addDistance,
    applyHpDelta,
    consumeLembas,
    resetGame,
  };
};
