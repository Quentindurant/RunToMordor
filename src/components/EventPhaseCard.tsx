import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ActiveRunEvent } from '../hooks/useRunEvent';

interface EventPhaseCardProps {
  event: ActiveRunEvent;
  countdownSec: number;
  currentSpeedKmh: number;
}

const formatCountdown = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const EventPhaseCard: React.FC<EventPhaseCardProps> = ({
  event,
  countdownSec,
  currentSpeedKmh,
}) => {
  const { config, phase, isSpeedCompliant } = event;

  const isChallenge = phase === 'challenge';
  const borderColor = isChallenge
    ? isSpeedCompliant ? '#4ade80' : '#ef4444'
    : '#60a5fa';
  const bgColor = isChallenge
    ? isSpeedCompliant ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)'
    : 'rgba(96,165,250,0.08)';

  const phaseLabel = isChallenge ? '⚡ DÉFI' : '💤 RÉCUPÉRATION';
  const phaseColor = isChallenge ? (isSpeedCompliant ? '#4ade80' : '#ef4444') : '#60a5fa';

  const speedDiff = isChallenge
    ? config.isUpperBound
      ? config.targetSpeedKmh - currentSpeedKmh  // négatif = bien
      : currentSpeedKmh - config.targetSpeedKmh  // positif = bien
    : 0;

  return (
    <View style={[styles.card, { borderColor, backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>{config.emoji}</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.eventLabel}>{config.label}</Text>
          <Text style={[styles.phaseLabel, { color: phaseColor }]}>{phaseLabel}</Text>
        </View>
        <View style={styles.countdown}>
          <Text style={[styles.countdownValue, { color: borderColor }]}>
            {formatCountdown(countdownSec)}
          </Text>
          <Text style={styles.countdownUnit}>restant</Text>
        </View>
      </View>

      {/* Barre de progression de la phase */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(100, (countdownSec / (isChallenge ? 120 : 60)) * 100)}%`,
              backgroundColor: borderColor,
            },
          ]}
        />
      </View>

      {/* Indicateur de vitesse */}
      {isChallenge && (
        <View style={styles.speedRow}>
          <Text style={styles.speedRowText}>
            {config.isUpperBound ? 'Restez sous' : 'Atteignez'}
            <Text style={{ color: borderColor, fontWeight: '700' }}>
              {' '}{config.isUpperBound ? '≤' : '≥'} {config.targetSpeedKmh} km/h
            </Text>
          </Text>
          <Text style={[styles.complianceText, { color: isSpeedCompliant ? '#4ade80' : '#ef4444' }]}>
            {isSpeedCompliant ? '✓ Allure OK' : `✗ ${Math.abs(speedDiff).toFixed(1)} km/h ${speedDiff < 0 ? 'trop vite' : 'manquant'}`}
          </Text>
        </View>
      )}

      {!isChallenge && (
        <Text style={styles.recoveryText}>
          Récupérez de la vie : +{config.hpRecoveryPer10s} HP toutes les 10s
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 28 },
  headerInfo: { flex: 1 },
  eventLabel: { color: '#f3f4f6', fontWeight: '700', fontSize: 15 },
  phaseLabel: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  countdown: { alignItems: 'center' },
  countdownValue: { fontSize: 22, fontWeight: '800' },
  countdownUnit: { fontSize: 10, color: '#6b7280' },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  speedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  speedRowText: { color: '#9ca3af', fontSize: 13 },
  complianceText: { fontSize: 13, fontWeight: '700' },
  recoveryText: { color: '#60a5fa', fontSize: 13 },
});
