import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioAnnouncer } from './useAudioAnnouncer';

// En dev, délais courts pour tester facilement
const IS_DEV = __DEV__;

const FIRST_EVENT_DELAY_MS = IS_DEV ? 30_000 : 3 * 60_000; // 30s dev / 3min prod
const EVENT_INTERVAL_MS = IS_DEV ? 90_000 : 7 * 60_000;    // 90s dev / 7min prod
const CHALLENGE_DURATION_MS = IS_DEV ? 60_000 : 2 * 60_000; // 1min dev / 2min prod
const RECOVERY_DURATION_MS = IS_DEV ? 30_000 : 2 * 60_000;  // 30s dev / 2min prod
const HP_TICK_INTERVAL_MS = 10_000; // vérif vitesse toutes les 10s
const WARN_EVERY_N_TICKS = 3;       // avertissement audio toutes les 30s

export type RunEventType = 'orc_ambush' | 'nazgul_scan';
export type EventPhase = 'challenge' | 'recovery';

export interface RunEventConfig {
  type: RunEventType;
  emoji: string;
  label: string;
  /** km/h : pour orc_ambush, il faut ALLER AU-DESSUS. Pour nazgul, EN-DESSOUS. */
  targetSpeedKmh: number;
  isUpperBound: boolean; // true = doit aller SOUS la vitesse cible (nazgûl)
  hpDrainPer10s: number;
  hpRecoveryPer10s: number;
}

export const EVENT_CONFIGS: RunEventConfig[] = [
  {
    type: 'orc_ambush',
    emoji: '⚔️',
    label: "Embuscade d'Orques",
    targetSpeedKmh: 8,
    isUpperBound: false,
    hpDrainPer10s: 8,
    hpRecoveryPer10s: 5,
  },
  {
    type: 'nazgul_scan',
    emoji: '👁️',
    label: 'Scan de Nazgûl',
    targetSpeedKmh: 5,
    isUpperBound: true,
    hpDrainPer10s: 6,
    hpRecoveryPer10s: 5,
  },
];

export interface ActiveRunEvent {
  config: RunEventConfig;
  phase: EventPhase;
  phaseEndTime: number;
  isSpeedCompliant: boolean;
}

type EventStatus = 'idle' | 'challenge' | 'recovery';

interface InternalState {
  status: EventStatus;
  config: RunEventConfig | null;
  phaseStartedAt: number;
}

export interface UseRunEventReturn {
  activeEvent: ActiveRunEvent | null;
  countdownSec: number;
}

export const useRunEvent = (
  isRunning: boolean,
  currentSpeedKmh: number,
  onHpChange: (delta: number) => void,
  announcer: AudioAnnouncer
): UseRunEventReturn => {
  const [internal, setInternal] = useState<InternalState>({
    status: 'idle',
    config: null,
    phaseStartedAt: 0,
  });
  const [countdownSec, setCountdownSec] = useState(0);

  // Tous les refs pour éviter les stale closures ET stabiliser les deps arrays
  const currentSpeedRef = useRef(currentSpeedKmh);
  currentSpeedRef.current = currentSpeedKmh;

  const onHpChangeRef = useRef(onHpChange);
  onHpChangeRef.current = onHpChange;

  const announcerRef = useRef(announcer);
  announcerRef.current = announcer;

  const internalRef = useRef(internal);
  internalRef.current = internal;

  const isCompliant = useCallback((speedKmh: number, config: RunEventConfig): boolean => {
    return config.isUpperBound
      ? speedKmh <= config.targetSpeedKmh
      : speedKmh >= config.targetSpeedKmh;
  }, []);

  // Stable — n'a aucune dépendance externe grâce aux refs
  const startChallenge = useCallback((config: RunEventConfig) => {
    setInternal({ status: 'challenge', config, phaseStartedAt: Date.now() });
    if (config.type === 'orc_ambush') {
      announcerRef.current.announceOrcAmbush(config.targetSpeedKmh);
    } else {
      announcerRef.current.announceNazgulScan(config.targetSpeedKmh);
    }
  }, []);

  const scheduleNext = useCallback(() => {
    const delay = EVENT_INTERVAL_MS * (0.7 + Math.random() * 0.6);
    setTimeout(() => {
      if (internalRef.current.status === 'idle') {
        const config = EVENT_CONFIGS[Math.floor(Math.random() * EVENT_CONFIGS.length)];
        startChallenge(config);
      }
    }, delay);
  }, [startChallenge]);

  // --- Transitions de phase ---

  useEffect(() => {
    if (!isRunning) {
      // Updater fonctionnel : ne change l'état que si nécessaire → évite la boucle infinie
      setInternal((prev) =>
        prev.status === 'idle' ? prev : { status: 'idle', config: null, phaseStartedAt: 0 }
      );
      return;
    }
    const timer = setTimeout(() => {
      const config = EVENT_CONFIGS[Math.floor(Math.random() * EVENT_CONFIGS.length)];
      startChallenge(config);
    }, FIRST_EVENT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isRunning, startChallenge]);

  useEffect(() => {
    if (internal.status !== 'challenge' || !internal.config) return;
    const timer = setTimeout(() => {
      announcerRef.current.announceRecovery(internalRef.current.config!.type);
      setInternal((prev) => ({ ...prev, status: 'recovery', phaseStartedAt: Date.now() }));
    }, CHALLENGE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [internal.status, internal.config]);

  useEffect(() => {
    if (internal.status !== 'recovery') return;
    const timer = setTimeout(() => {
      announcerRef.current.announceEventComplete();
      setInternal({ status: 'idle', config: null, phaseStartedAt: 0 });
      scheduleNext();
    }, RECOVERY_DURATION_MS);
    return () => clearTimeout(timer);
  }, [internal.status, scheduleNext]);

  useEffect(() => {
    if (internal.status === 'idle' || !internal.config) return;
    let tickCount = 0;
    const interval = setInterval(() => {
      tickCount++;
      const speed = currentSpeedRef.current;
      const config = internalRef.current.config!;
      const status = internalRef.current.status;

      if (status === 'challenge') {
        const compliant = isCompliant(speed, config);
        if (!compliant) {
          onHpChangeRef.current(-config.hpDrainPer10s);
          if (tickCount % WARN_EVERY_N_TICKS === 0) {
            announcerRef.current.announceSpeedWarning(config.type);
          }
        }
      } else if (status === 'recovery') {
        onHpChangeRef.current(config.hpRecoveryPer10s);
      }
    }, HP_TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [internal.status, internal.config, isCompliant]);

  // Countdown tick (toutes les 500ms)
  useEffect(() => {
    if (internal.status === 'idle') {
      setCountdownSec(0);
      return;
    }
    const duration = internal.status === 'challenge' ? CHALLENGE_DURATION_MS : RECOVERY_DURATION_MS;
    const endTime = internal.phaseStartedAt + duration;

    const interval = setInterval(() => {
      setCountdownSec(Math.max(0, Math.ceil((endTime - Date.now()) / 1000)));
    }, 500);
    return () => clearInterval(interval);
  }, [internal.status, internal.phaseStartedAt]);

  // Valeur dérivée exposée à l'UI
  const activeEvent: ActiveRunEvent | null =
    internal.status !== 'idle' && internal.config
      ? {
          config: internal.config,
          phase: internal.status as EventPhase,
          phaseEndTime: internal.phaseStartedAt + (internal.status === 'challenge' ? CHALLENGE_DURATION_MS : RECOVERY_DURATION_MS),
          isSpeedCompliant: isCompliant(currentSpeedKmh, internal.config),
        }
      : null;

  return { activeEvent, countdownSec };
};
