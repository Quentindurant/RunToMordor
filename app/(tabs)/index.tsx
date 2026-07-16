import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';

import { useGameState } from '../../src/hooks/useGameState';
import { useRunTracker } from '../../src/hooks/useRunTracker';
import { useRunEvent } from '../../src/hooks/useRunEvent';
import { useAudioAnnouncer } from '../../src/hooks/useAudioAnnouncer';

import { RunMap } from '../../src/components/RunMap';
import { HpBar } from '../../src/components/HpBar';
import { ProgressBar } from '../../src/components/ProgressBar';
import { SpeedGauge } from '../../src/components/SpeedGauge';
import { EventPhaseCard } from '../../src/components/EventPhaseCard';

import { TOTAL_JOURNEY_KM } from '../../src/constants/biomes';

const formatDuration = (sec: number): string => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function DashboardScreen() {
  // Empêche l'écran de s'éteindre pendant le run
  useKeepAwake();

  const { state, isLoading, maxHP, currentBiome, progressPercent, addDistance, applyHpDelta, consumeLembas, resetGame } =
    useGameState();

  const tracker = useRunTracker();
  const announcer = useAudioAnnouncer();

  const { activeEvent, countdownSec } = useRunEvent(
    tracker.isTracking,
    tracker.stats.currentSpeedKmh,
    applyHpDelta,
    announcer
  );

  // Sync la distance GPS → état de jeu (toutes les 50m soit ~0.05km)
  const lastSyncedKmRef = useRef(0);
  useEffect(() => {
    const diff = tracker.stats.distanceKm - lastSyncedKmRef.current;
    if (diff >= 0.05) {
      addDistance(diff);
      lastSyncedKmRef.current = tracker.stats.distanceKm;
    }
  }, [tracker.stats.distanceKm]);

  // Annonce de pace toutes les 500m
  const lastPaceAnnounceRef = useRef(0);
  useEffect(() => {
    if (!tracker.isTracking) return;
    const km = tracker.stats.distanceKm;
    if (km - lastPaceAnnounceRef.current >= 0.5) {
      announcer.announcePaceUpdate(km, tracker.stats.pace);
      lastPaceAnnounceRef.current = km;
    }
  }, [tracker.stats.distanceKm, tracker.isTracking]);

  const handleStartRun = async () => {
    lastSyncedKmRef.current = 0;
    lastPaceAnnounceRef.current = 0;
    await tracker.startTracking();
    announcer.announceRunStart();
  };

  const handleStopRun = () => {
    tracker.stopTracking();
    announcer.announceRunStop(tracker.stats.distanceKm);
    // Sync finale
    const diff = tracker.stats.distanceKm - lastSyncedKmRef.current;
    if (diff > 0) addDistance(diff);
  };

  const handleReset = () => {
    Alert.alert('Recommencer ?', 'Toute la progression sera effacée.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Recommencer', style: 'destructive', onPress: resetGame },
    ]);
  };

  const handleRequestPermission = async () => {
    const granted = await tracker.requestPermission();
    if (!granted) {
      Alert.alert(
        'Permission GPS requise',
        'Run to Mordor a besoin de votre position pour tracer votre parcours. Activez-la dans les réglages.'
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <Text style={styles.loaderText}>Chargement de la Terre du Milieu...</Text>
      </View>
    );
  }

  const isDead = state.playerHP <= 0;
  const { primaryColor, bgColor, textColor, emoji, name } = currentBiome;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header biome compact ── */}
        <View style={[styles.biomeBar, { borderColor: primaryColor + '40' }]}>
          <Text style={styles.biomeEmoji}>{emoji}</Text>
          <Text style={[styles.biomeName, { color: primaryColor }]}>{name}</Text>
          <Text style={[styles.biomeKm, { color: textColor }]}>
            {state.totalDistance.toFixed(1)} km
          </Text>
        </View>

        {/* ── Carte GPS ── */}
        <View style={styles.mapWrapper}>
          {tracker.hasPermission === false ? (
            <TouchableOpacity
              style={styles.permissionBanner}
              onPress={handleRequestPermission}
            >
              <Text style={styles.permissionText}>
                📍 Autoriser le GPS pour tracer votre parcours
              </Text>
            </TouchableOpacity>
          ) : (
            <RunMap
              waypoints={tracker.stats.waypoints}
              isTracking={tracker.isTracking}
              routeColor={primaryColor}
              hasPermission={tracker.hasPermission}
            />
          )}
        </View>

        {/* ── Vitesse + Pace ── */}
        <View style={[styles.card, { borderColor: primaryColor + '30' }]}>
          <SpeedGauge
            currentSpeedKmh={tracker.stats.currentSpeedKmh}
            pace={tracker.stats.pace}
            activeEvent={activeEvent}
            accentColor={primaryColor}
          />
        </View>

        {/* ── Stats Strava-style ── */}
        <View style={styles.statsGrid}>
          <StatCell label="⏱ Durée" value={formatDuration(tracker.stats.durationSec)} color={textColor} />
          <StatCell label="📍 Distance" value={`${tracker.stats.distanceKm.toFixed(2)} km`} color={textColor} />
          <StatCell label="💨 Moy." value={`${tracker.stats.avgSpeedKmh.toFixed(1)} km/h`} color={textColor} />
          <StatCell label="🔥 Kcal" value={`${tracker.stats.calories}`} color={textColor} />
        </View>

        {/* ── HP + Progression ── */}
        <View style={[styles.card, { borderColor: primaryColor + '30' }]}>
          <HpBar current={state.playerHP} max={maxHP} accentColor={primaryColor} />
          <ProgressBar
            percent={progressPercent}
            totalKm={TOTAL_JOURNEY_KM}
            currentKm={state.totalDistance}
            accentColor={primaryColor}
          />
          {/* Lembas */}
          <View style={styles.lembasRow}>
            <Text style={[styles.lembasLabel, { color: textColor }]}>🍞 Lembas</Text>
            <TouchableOpacity
              style={[
                styles.lembasBtn,
                (state.lembasCount === 0 || isDead) && styles.btnDisabled,
              ]}
              onPress={consumeLembas}
              disabled={state.lembasCount === 0 || isDead}
            >
              <Text style={styles.lembasBtnText}>
                Consommer (+10 HP) — {state.lembasCount} restant(s)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Événement actif ── */}
        {activeEvent && (
          <EventPhaseCard
            event={activeEvent}
            countdownSec={countdownSec}
            currentSpeedKmh={tracker.stats.currentSpeedKmh}
          />
        )}

        {/* ── Mort ── */}
        {isDead && (
          <View style={styles.deathBanner}>
            <Text style={styles.deathText}>
              💀 Vous avez succombé... Sauron a triomphé.
            </Text>
          </View>
        )}

        {/* ── Bouton principal ── */}
        <TouchableOpacity
          style={[
            styles.mainBtn,
            tracker.isTracking ? styles.btnStop : styles.btnStart,
            isDead && styles.btnDisabled,
          ]}
          onPress={tracker.isTracking ? handleStopRun : handleStartRun}
          disabled={isDead}
        >
          <Text style={styles.mainBtnText}>
            {tracker.isTracking ? '⏹  Terminer le Run' : '▶  Démarrer le Run'}
          </Text>
        </TouchableOpacity>

        {/* Simulation pour les tests sans GPS */}
        {__DEV__ && (
          <TouchableOpacity
            style={styles.devBtn}
            onPress={() => addDistance(1)}
          >
            <Text style={styles.devBtnText}>🛠 +1 km (dev)</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetText}>↺ Recommencer depuis La Comté</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Cellule de statistique
function StatCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d0d0d' },
  loaderText: { color: '#888', fontSize: 16 },
  scroll: { padding: 16, paddingBottom: 48, gap: 12 },

  biomeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  biomeEmoji: { fontSize: 24 },
  biomeName: { fontSize: 18, fontWeight: '700', flex: 1 },
  biomeKm: { fontSize: 14, fontWeight: '600' },

  mapWrapper: { borderRadius: 14, overflow: 'hidden' },
  permissionBanner: {
    height: 100,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  permissionText: { color: '#60a5fa', fontSize: 14, fontWeight: '600' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCell: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 10,
  },
  statLabel: { color: '#6b7280', fontSize: 11, marginBottom: 2 },
  statValue: { fontSize: 16, fontWeight: '700' },

  lembasRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  lembasLabel: { fontSize: 14, fontWeight: '600' },
  lembasBtn: { backgroundColor: '#92400e', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  lembasBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  deathBanner: {
    backgroundColor: '#7f1d1d',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deathText: { color: '#fca5a5', fontWeight: '700', textAlign: 'center', fontSize: 15 },

  mainBtn: { paddingVertical: 18, borderRadius: 14, alignItems: 'center' },
  btnStart: { backgroundColor: '#166534' },
  btnStop: { backgroundColor: '#7f1d1d' },
  btnDisabled: { opacity: 0.4 },
  mainBtnText: { color: '#fff', fontWeight: '800', fontSize: 17 },

  devBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  devBtnText: { color: '#94a3b8', fontSize: 13 },

  resetBtn: { alignItems: 'center', paddingVertical: 12 },
  resetText: { color: '#4b5563', fontSize: 13 },
});
