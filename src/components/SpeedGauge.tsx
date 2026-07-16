import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ActiveRunEvent } from '../hooks/useRunEvent';

interface SpeedGaugeProps {
  currentSpeedKmh: number;
  pace: string;
  activeEvent: ActiveRunEvent | null;
  accentColor: string;
}

export const SpeedGauge: React.FC<SpeedGaugeProps> = ({
  currentSpeedKmh,
  pace,
  activeEvent,
  accentColor,
}) => {
  // Couleur selon conformité vitesse si événement actif
  const getSpeedColor = (): string => {
    if (!activeEvent || activeEvent.phase === 'recovery') return accentColor;
    return activeEvent.isSpeedCompliant ? '#4ade80' : '#ef4444';
  };

  const speedColor = getSpeedColor();

  // Indicateur de direction (monter/descendre la vitesse)
  const getSpeedHint = (): string | null => {
    if (!activeEvent || activeEvent.phase === 'recovery') return null;
    const { config, isSpeedCompliant } = activeEvent;
    if (isSpeedCompliant) return null;
    return config.isUpperBound ? '▼ Ralentissez' : '▲ Accélérez';
  };

  const speedHint = getSpeedHint();

  return (
    <View style={styles.wrapper}>
      {/* Vitesse principale */}
      <View style={styles.speedBlock}>
        <Text style={[styles.speedValue, { color: speedColor }]}>
          {currentSpeedKmh.toFixed(1)}
        </Text>
        <Text style={[styles.speedUnit, { color: speedColor }]}>km/h</Text>
      </View>

      {/* Allure */}
      <View style={styles.paceBlock}>
        <Text style={styles.paceValue}>{pace}</Text>
        <Text style={styles.paceUnit}>min/km</Text>
      </View>

      {/* Cible de vitesse si événement actif */}
      {activeEvent && activeEvent.phase === 'challenge' && (
        <View style={[styles.targetBlock, { borderColor: activeEvent.isSpeedCompliant ? '#4ade80' : '#ef4444' }]}>
          <Text style={styles.targetLabel}>Cible</Text>
          <Text style={[styles.targetValue, { color: activeEvent.isSpeedCompliant ? '#4ade80' : '#ef4444' }]}>
            {activeEvent.config.isUpperBound ? '≤' : '≥'} {activeEvent.config.targetSpeedKmh}
          </Text>
          <Text style={styles.targetUnit}>km/h</Text>
        </View>
      )}

      {/* Hint directionnel */}
      {speedHint && (
        <View style={styles.hintBlock}>
          <Text style={styles.hintText}>{speedHint}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  speedBlock: { alignItems: 'flex-end' },
  speedValue: { fontSize: 42, fontWeight: '800', lineHeight: 46 },
  speedUnit: { fontSize: 12, fontWeight: '600', opacity: 0.8 },
  paceBlock: { alignItems: 'flex-start', justifyContent: 'center' },
  paceValue: { fontSize: 18, fontWeight: '700', color: '#d1d5db' },
  paceUnit: { fontSize: 11, color: '#6b7280' },
  targetBlock: {
    marginLeft: 'auto',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  targetLabel: { fontSize: 10, color: '#6b7280', marginBottom: 1 },
  targetValue: { fontSize: 16, fontWeight: '800' },
  targetUnit: { fontSize: 10, color: '#6b7280' },
  hintBlock: {
    position: 'absolute',
    right: 0,
    bottom: -18,
  },
  hintText: { color: '#ef4444', fontSize: 11, fontWeight: '700' },
});
