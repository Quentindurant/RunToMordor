import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { GameEvent } from '../types/game.types';

interface EventModalProps {
  event: GameEvent | null;
  onResolve: (success: boolean) => void;
}

const EVENT_CONFIG = {
  orc_ambush: {
    emoji: '⚔️',
    title: 'Embuscade d\'Orques !',
    description: 'Une horde d\'Orques surgit ! SPRINTEZ pour les semer !',
    successLabel: '🏃 Je sprinte !',
    failLabel: '💀 Pas le temps...',
    successColor: '#4ade80',
    failColor: '#ef4444',
  },
  nazgul_scan: {
    emoji: '👁️',
    title: 'Scan de Nazgûl !',
    description: 'Un Nazgûl plane au-dessus. Ralentissez et restez discret !',
    successLabel: '🚶 Je ralentis',
    failLabel: '💨 Je continue',
    successColor: '#60a5fa',
    failColor: '#f59e0b',
  },
};

export const EventModal: React.FC<EventModalProps> = ({ event, onResolve }) => {
  if (!event) return null;
  const cfg = EVENT_CONFIG[event.type];

  return (
    <Modal transparent animationType="fade" visible={!!event}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>{cfg.emoji}</Text>
          <Text style={styles.title}>{cfg.title}</Text>
          <Text style={styles.description}>{cfg.description}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: cfg.successColor }]}
              onPress={() => onResolve(true)}
            >
              <Text style={styles.btnText}>{cfg.successLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: cfg.failColor }]}
              onPress={() => onResolve(false)}
            >
              <Text style={styles.btnText}>{cfg.failLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1e1e2e',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emoji: { fontSize: 52, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 8 },
  description: { fontSize: 15, color: '#aaa', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 12, width: '100%' },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
