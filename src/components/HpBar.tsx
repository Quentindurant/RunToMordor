import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HpBarProps {
  current: number;
  max: number;
  accentColor: string;
}

export const HpBar: React.FC<HpBarProps> = ({ current, max, accentColor }) => {
  const pct = Math.max(0, Math.min(1, current / max));
  const color = pct > 0.5 ? '#4ade80' : pct > 0.25 ? '#facc15' : '#ef4444';

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: accentColor }]}>❤️ Points de Vie</Text>
        <Text style={[styles.value, { color: accentColor }]}>
          {current}/{max}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginVertical: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600' },
  value: { fontSize: 13, fontWeight: '700' },
  track: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 5 },
});
