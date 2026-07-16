import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  percent: number;
  totalKm: number;
  currentKm: number;
  accentColor: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percent,
  totalKm,
  currentKm,
  accentColor,
}) => (
  <View style={styles.wrapper}>
    <View style={styles.labelRow}>
      <Text style={[styles.label, { color: accentColor }]}>
        Progression vers le Mordor
      </Text>
      <Text style={[styles.value, { color: accentColor }]}>
        {currentKm.toFixed(1)} / {totalKm} km
      </Text>
    </View>
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          { width: `${percent}%`, backgroundColor: accentColor },
        ]}
      />
      {/* Marqueur Mordor */}
      <Text style={styles.flag}>🌋</Text>
    </View>
    <Text style={[styles.pct, { color: accentColor }]}>{percent.toFixed(1)}%</Text>
  </View>
);

const styles = StyleSheet.create({
  wrapper: { marginVertical: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600' },
  value: { fontSize: 13, fontWeight: '700' },
  track: {
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 7,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: { height: '100%', borderRadius: 7 },
  flag: { position: 'absolute', right: 2, fontSize: 10 },
  pct: { fontSize: 11, textAlign: 'right', marginTop: 2, opacity: 0.8 },
});
