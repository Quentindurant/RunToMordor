import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';

export interface Waypoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number; // m/s brut GPS
}

export interface RunStats {
  distanceKm: number;
  durationSec: number;
  currentSpeedKmh: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  pace: string; // "X:XX min/km"
  calories: number;
  waypoints: Waypoint[];
}

// Formule Haversine — distance en km entre deux points GPS
const haversineKm = (a: Waypoint, b: Waypoint): number => {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const c =
    sinLat * sinLat +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      sinLon *
      sinLon;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
};

const formatPace = (speedKmh: number): string => {
  if (speedKmh < 0.8) return '--:--';
  const secsPerKm = 3600 / speedKmh;
  const mins = Math.floor(secsPerKm / 60);
  const secs = Math.floor(secsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const DEFAULT_STATS: RunStats = {
  distanceKm: 0,
  durationSec: 0,
  currentSpeedKmh: 0,
  avgSpeedKmh: 0,
  maxSpeedKmh: 0,
  pace: '--:--',
  calories: 0,
  waypoints: [],
};

export interface UseRunTrackerReturn {
  stats: RunStats;
  isTracking: boolean;
  hasPermission: boolean | null;
  requestPermission: () => Promise<boolean>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
}

export const useRunTracker = (): UseRunTrackerReturn => {
  const [stats, setStats] = useState<RunStats>(DEFAULT_STATS);
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  // Intervalle de mise à jour des annonces de pace (toutes les 5 min)
  const lastPaceAnnouncedKmRef = useRef<number>(0);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';
    setHasPermission(granted);
    return granted;
  }, []);

  // Vérification initiale de la permission
  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted');
    });
  }, []);

  const stopTracking = useCallback(() => {
    locationSubRef.current?.remove();
    locationSubRef.current = null;
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setIsTracking(false);
  }, []);

  const startTracking = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    // Reset stats
    setStats(DEFAULT_STATS);
    startTimeRef.current = Date.now();
    lastPaceAnnouncedKmRef.current = 0;
    setIsTracking(true);

    // Timer de durée (toutes les secondes)
    durationIntervalRef.current = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        durationSec: Math.floor((Date.now() - startTimeRef.current) / 1000),
      }));
    }, 1000);

    // Abonnement GPS
    locationSubRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 3, // minimum 3m entre deux points
      },
      ({ coords, timestamp }) => {
        const { latitude, longitude, speed, altitude } = coords;
        // expo-location retourne speed en m/s (peut être null sur certains devices)
        const rawSpeedMs = Math.max(0, speed ?? 0);
        const speedKmh = rawSpeedMs * 3.6;

        const wp: Waypoint = { latitude, longitude, timestamp, speed: rawSpeedMs };

        setStats((prev) => {
          const newWaypoints = [...prev.waypoints, wp];

          // Calcul de la distance incrémentale
          let addedKm = 0;
          if (newWaypoints.length >= 2) {
            addedKm = haversineKm(
              newWaypoints[newWaypoints.length - 2],
              newWaypoints[newWaypoints.length - 1]
            );
          }
          const newDist = prev.distanceKm + addedKm;

          // Moyenne des vitesses > 0.5 km/h (filtre l'arrêt)
          const movingSpeeds = newWaypoints
            .map((w) => w.speed * 3.6)
            .filter((s) => s > 0.5);
          const avgSpeed =
            movingSpeeds.length > 0
              ? movingSpeeds.reduce((a, b) => a + b, 0) / movingSpeeds.length
              : 0;

          return {
            ...prev,
            distanceKm: newDist,
            currentSpeedKmh: speedKmh,
            avgSpeedKmh: avgSpeed,
            maxSpeedKmh: Math.max(prev.maxSpeedKmh, speedKmh),
            pace: formatPace(speedKmh),
            // ~65 kcal/km pour un coureur de 70kg
            calories: Math.round(newDist * 65),
            waypoints: newWaypoints,
          };
        });
      }
    );
  }, [hasPermission, requestPermission]);

  // Cleanup à l'unmount
  useEffect(() => () => stopTracking(), []);

  return { stats, isTracking, hasPermission, requestPermission, startTracking, stopTracking };
};
