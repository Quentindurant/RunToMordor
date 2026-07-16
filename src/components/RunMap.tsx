import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Polyline, Marker, Region, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { Waypoint } from '../hooks/useRunTracker';

interface RunMapProps {
  waypoints: Waypoint[];
  isTracking: boolean;
  routeColor: string;
  hasPermission: boolean | null;
}

// Paris comme région par défaut si pas de GPS
const DEFAULT_REGION: Region = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export const RunMap: React.FC<RunMapProps> = ({
  waypoints,
  isTracking,
  routeColor,
  hasPermission,
}) => {
  const mapRef = useRef<MapView>(null);

  const coordinates = waypoints.map((wp) => ({
    latitude: wp.latitude,
    longitude: wp.longitude,
  }));

  const lastPoint = coordinates[coordinates.length - 1];

  // Recentre la carte sur la dernière position connue
  useEffect(() => {
    if (!mapRef.current || !lastPoint) return;
    mapRef.current.animateToRegion(
      {
        latitude: lastPoint.latitude,
        longitude: lastPoint.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      800
    );
  }, [lastPoint?.latitude, lastPoint?.longitude]);

  if (hasPermission === false) {
    return (
      <View style={[styles.container, styles.placeholder]}>
        <Text style={styles.placeholderText}>📍 Permission GPS refusée</Text>
        <Text style={styles.placeholderSub}>Activez la localisation dans les réglages</Text>
      </View>
    );
  }

  if (hasPermission === null) {
    return (
      <View style={[styles.container, styles.placeholder]}>
        <Text style={styles.placeholderText}>Chargement de la carte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        // iOS utilise Apple Maps (pas de clé nécessaire), Android utilise Google Maps
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        followsUserLocation={isTracking && waypoints.length < 3}
        mapType="standard"
      >
        {/* Tracé du parcours */}
        {coordinates.length >= 2 && (
          <Polyline
            coordinates={coordinates}
            strokeColor={routeColor}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Marqueur de départ */}
        {coordinates.length > 0 && (
          <Marker
            coordinate={coordinates[0]}
            anchor={{ x: 0.5, y: 0.5 }}
            title="Départ"
          >
            <View style={[styles.markerDot, { backgroundColor: '#4ade80' }]} />
          </Marker>
        )}

        {/* Marqueur de position actuelle */}
        {lastPoint && coordinates.length > 1 && (
          <Marker
            coordinate={lastPoint}
            anchor={{ x: 0.5, y: 0.5 }}
            title="Position actuelle"
          >
            <View style={[styles.markerCurrent, { borderColor: routeColor }]}>
              <View style={[styles.markerDotInner, { backgroundColor: routeColor }]} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Badge distance dans un coin de la carte */}
      {!isTracking && waypoints.length === 0 && (
        <View style={styles.idleBadge}>
          <Text style={styles.idleText}>Démarrez le run pour tracer votre parcours</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { height: 240, borderRadius: 14, overflow: 'hidden' },
  map: { flex: 1 },
  placeholder: {
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  placeholderText: { color: '#9ca3af', fontSize: 15, fontWeight: '600' },
  placeholderSub: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  markerDot: { width: 12, height: 12, borderRadius: 6 },
  markerCurrent: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerDotInner: { width: 10, height: 10, borderRadius: 5 },
  idleBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  idleText: { color: '#9ca3af', fontSize: 12 },
});
