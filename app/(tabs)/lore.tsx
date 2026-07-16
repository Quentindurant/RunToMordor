import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useGameState } from '../../src/hooks/useGameState';
import { fetchRandomQuote, fetchFellowshipCharacters, Quote, ApiCharacter } from '../../src/services/oneRingApi';
import { BIOMES, BIOME_ORDER } from '../../src/constants/biomes';

export default function LoreScreen() {
  const { state, currentBiome } = useGameState();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [characters, setCharacters] = useState<ApiCharacter[]>([]);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [isCharLoading, setIsCharLoading] = useState(false);

  const loadQuote = useCallback(async () => {
    setIsQuoteLoading(true);
    const q = await fetchRandomQuote();
    setQuote(q);
    setIsQuoteLoading(false);
  }, []);

  const loadCharacters = useCallback(async () => {
    setIsCharLoading(true);
    const chars = await fetchFellowshipCharacters();
    setCharacters(chars);
    setIsCharLoading(false);
  }, []);

  useEffect(() => {
    loadQuote();
    loadCharacters();
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: currentBiome.bgColor }]}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <Text style={[styles.screenTitle, { color: currentBiome.primaryColor }]}>
          📜 Lore & Statistiques
        </Text>

        {/* Résumé joueur */}
        <View style={[styles.card, { borderColor: currentBiome.primaryColor + '40' }]}>
          <Text style={[styles.cardTitle, { color: currentBiome.primaryColor }]}>Votre Voyage</Text>
          <StatRow label="Distance totale" value={`${state.totalDistance.toFixed(1)} km`} color={currentBiome.textColor} />
          <StatRow label="Points de vie" value={`${state.playerHP}/100`} color={currentBiome.textColor} />
          <StatRow label="Réserve de Lembas" value={`${state.lembasCount} pain(s)`} color={currentBiome.textColor} />
          <StatRow label="Biome actuel" value={currentBiome.name} color={currentBiome.primaryColor} />
        </View>

        {/* Carte des biomes */}
        <View style={[styles.card, { borderColor: currentBiome.primaryColor + '40' }]}>
          <Text style={[styles.cardTitle, { color: currentBiome.primaryColor }]}>
            Carte de la Terre du Milieu
          </Text>
          {BIOME_ORDER.map((id) => {
            const biome = BIOMES[id];
            const traversed = state.traversedBiomes.includes(id);
            const isCurrently = state.currentBiomeId === id;
            return (
              <View
                key={id}
                style={[
                  styles.biomeRow,
                  isCurrently && { backgroundColor: biome.primaryColor + '20', borderRadius: 8 },
                ]}
              >
                <Text style={styles.biomeRowEmoji}>{biome.emoji}</Text>
                <View style={styles.biomeRowInfo}>
                  <Text style={[styles.biomeRowName, { color: traversed ? biome.primaryColor : '#4b5563' }]}>
                    {biome.name}
                    {isCurrently ? ' ← Vous êtes ici' : ''}
                  </Text>
                  <Text style={styles.biomeRowKm}>
                    {id === 'mordor' ? '≥ 70 km' : `< ${biome.maxKm} km`}
                  </Text>
                </View>
                <Text style={styles.biomeStatus}>
                  {traversed ? (isCurrently ? '🏃' : '✅') : '🔒'}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Citation */}
        <View style={[styles.card, { borderColor: currentBiome.primaryColor + '40' }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: currentBiome.primaryColor }]}>
              Sagesse de la Terre du Milieu
            </Text>
            <TouchableOpacity onPress={loadQuote} disabled={isQuoteLoading}>
              <Text style={[styles.refresh, { color: currentBiome.primaryColor }]}>↻</Text>
            </TouchableOpacity>
          </View>
          {isQuoteLoading ? (
            <ActivityIndicator color={currentBiome.primaryColor} />
          ) : quote ? (
            <View>
              <Text style={styles.quoteText}>« {quote.dialog} »</Text>
              <Text style={styles.quoteAuthor}>— {quote.character}</Text>
            </View>
          ) : (
            <Text style={styles.apiHint}>
              Configurez BEARER_TOKEN dans src/services/oneRingApi.ts pour accéder à l'API.
            </Text>
          )}
        </View>

        {/* Personnages */}
        {characters.length > 0 && (
          <View style={[styles.card, { borderColor: currentBiome.primaryColor + '40' }]}>
            <Text style={[styles.cardTitle, { color: currentBiome.primaryColor }]}>
              La Communauté de l'Anneau
            </Text>
            {isCharLoading ? (
              <ActivityIndicator color={currentBiome.primaryColor} />
            ) : (
              characters.map((c) => (
                <View key={c._id} style={styles.charRow}>
                  <Text style={styles.charName}>{c.name}</Text>
                  <Text style={styles.charRace}>{c.race}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Note API si pas configurée */}
        {characters.length === 0 && !isCharLoading && (
          <View style={[styles.card, { borderColor: '#374151' }]}>
            <Text style={styles.apiHint}>
              🔑 Ajoutez votre Bearer Token dans{'\n'}
              <Text style={{ fontFamily: 'monospace', color: '#60a5fa' }}>
                src/services/oneRingApi.ts
              </Text>
              {'\n'}pour activer les données Tolkien live.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },

  screenTitle: { fontSize: 24, fontWeight: '800', marginBottom: 20 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  refresh: { fontSize: 22, fontWeight: '700' },

  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  statLabel: { color: '#6b7280', fontSize: 14 },
  statValue: { fontSize: 14, fontWeight: '600' },

  biomeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, marginBottom: 2 },
  biomeRowEmoji: { fontSize: 22, marginRight: 10 },
  biomeRowInfo: { flex: 1 },
  biomeRowName: { fontSize: 14, fontWeight: '600' },
  biomeRowKm: { fontSize: 11, color: '#6b7280', marginTop: 1 },
  biomeStatus: { fontSize: 18 },

  quoteText: { color: '#e5e7eb', fontSize: 15, fontStyle: 'italic', lineHeight: 22, marginBottom: 8 },
  quoteAuthor: { color: '#6b7280', fontSize: 13, textAlign: 'right' },

  charRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  charName: { color: '#e5e7eb', fontWeight: '600', fontSize: 14 },
  charRace: { color: '#6b7280', fontSize: 13 },

  apiHint: { color: '#6b7280', fontSize: 13, textAlign: 'center', lineHeight: 20, paddingVertical: 8 },
});
