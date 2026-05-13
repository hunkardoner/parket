import {
  useCallback,
  useEffect,
  useRef,
  useState } from 'react';
import * as Location from 'expo-location';
import {
  Alert,
  Pressable,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { styles } from './style';

import { ParkingMap } from '@/components/parking-map';
import { ThemedText } from '@/components/themed-text';
import { openWalkingDirections } from '@/services/directions';
import { distanceInMeters, formatDistance } from '@/services/ispark';
import { clearParkedVehicle, loadParkedVehicle } from '@/services/local-store';
import { createStreetReport } from '@/services/street-reports';
import { endHistorySession } from '@/services/parking-history';
import { useAuthSession } from '@/hooks/use-auth-session';
import { Coordinates, ParkedVehicle } from '@/types/parking';

const AUTO_FREE_DISTANCE_METERS = 20;

export default function VehicleActiveScreen() {
  const router = useRouter();
  const auth = useAuthSession();
  const [vehicle, setVehicle] = useState<ParkedVehicle | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [distanceToVehicle, setDistanceToVehicle] = useState<number | undefined>(undefined);
  const [hasAutoFreed, setHasAutoFreed] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  // Load the parked vehicle
  useEffect(() => {
    loadParkedVehicle().then((v) => {
      if (v) {
        setVehicle(v);
      } else {
        // No vehicle parked, go back
        router.replace('/explore');
      }
    });
  }, [router]);

  // Watch user position
  useEffect(() => {
    let isMounted = true;

    async function startWatching() {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') return;

      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5 },
        (loc) => {
          if (!isMounted) return;
          const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setUserLocation(coords);
        }
      );
      if (isMounted) watchRef.current = sub;
    }

    void startWatching();
    return () => {
      isMounted = false;
      watchRef.current?.remove();
    };
  }, []);

  // Calculate distance to vehicle whenever locations change
  useEffect(() => {
    if (!userLocation || !vehicle) return;
    const dist = distanceInMeters(userLocation, { latitude: vehicle.latitude, longitude: vehicle.longitude });
    setDistanceToVehicle(dist);
  }, [userLocation, vehicle]);

  // Auto-free when within 20m
  useEffect(() => {
    if (hasAutoFreed || !vehicle || distanceToVehicle === undefined) return;
    if (distanceToVehicle <= AUTO_FREE_DISTANCE_METERS) {
      setHasAutoFreed(true);
      void handleAutoFree();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distanceToVehicle, hasAutoFreed, vehicle]);

  const handleAutoFree = useCallback(async () => {
    if (!vehicle) return;

    // Report the spot as free
    try {
      await createStreetReport({
        coordinates: { latitude: vehicle.latitude, longitude: vehicle.longitude },
        note: 'Park alanı boşaldı (otomatik bildirim)',
        userId: auth.user?.id,
      });
    } catch {
      // silently fail - best effort
    }

    // End history session and clear the parked vehicle
    await endHistorySession(vehicle.id);
    await clearParkedVehicle();

    Alert.alert(
      '🎉 Aracına ulaştın!',
      'Park alanı boş olarak bildirildi. İyi yolculuklar!',
      [{ text: 'Tamam', onPress: () => router.replace('/explore') }]
    );
  }, [vehicle, auth.user?.id, router]);

  const handleEndParking = useCallback(async () => {
    if (vehicle?.id) await endHistorySession(vehicle.id);
    await clearParkedVehicle();
    setVehicle(null);
    router.replace('/explore');
  }, [vehicle?.id, router]);

  const handleNavigate = useCallback(async () => {
    if (!vehicle) return;
    await openWalkingDirections(
      { latitude: vehicle.latitude, longitude: vehicle.longitude },
      vehicle.title
    );
  }, [vehicle]);

  if (!vehicle) return null;

  const distText = formatDistance(distanceToVehicle);
  const isClose = distanceToVehicle !== undefined && distanceToVehicle <= 50;

  return (
    <View style={styles.screen}>
      {/* Full-screen map */}
      <View style={styles.mapContainer}>
        <ParkingMap
          currentLocation={userLocation}
          parkedVehicle={vehicle}
          reports={[]}
        />
      </View>

      {/* Overlay card */}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        {/* Distance badge */}
        <View style={[styles.distanceBadge, isClose && styles.distanceBadgeClose, styles.shadowMd]}>
          <ThemedText type="overline" style={styles.distanceLabel}>
            {isClose ? '🎯 YAKINDASIN' : '📍 MESAFE'}
          </ThemedText>
          <ThemedText type="title" style={styles.distanceValue}>
            {distText ?? '—'}
          </ThemedText>
        </View>

        {/* Bottom info card */}
        <View style={[styles.infoCard, styles.shadowLg]}>
          <View style={styles.infoHeader}>
            <View style={styles.vehicleDot} />
            <View style={styles.vehicleInfo}>
              <ThemedText type="smallBold" style={styles.vehicleName}>
                {vehicle.title}
              </ThemedText>
              <ThemedText type="caption" style={styles.vehicleMeta}>
                {vehicle.source === 'ispark' ? '🅿️ İSPARK' : '🚗 Sokak parkı'} ·{' '}
                {new Date(vehicle.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </ThemedText>
            </View>
          </View>

          {distanceToVehicle !== undefined && distanceToVehicle <= AUTO_FREE_DISTANCE_METERS ? (
            <View style={styles.arrivedBanner}>
              <ThemedText type="smallBold" style={styles.arrivedText}>
                🎉 Aracına ulaştın! Park alanı boş olarak bildirildi.
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.buttonRow}>
            <Pressable style={styles.navButton} onPress={handleNavigate}>
              <ThemedText type="smallBold" style={styles.navButtonText}>
                🧭  Aracıma git
              </ThemedText>
            </Pressable>
            <Pressable style={styles.endButton} onPress={handleEndParking}>
              <ThemedText type="smallBold" style={styles.endButtonText}>
                ⏹  Parkı bitir
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
