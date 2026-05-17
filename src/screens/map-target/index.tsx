import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { activityIndicatorColor, styles } from './style';

import { ParkingMap } from '@/components/parking-map';
import { ThemedText } from '@/components/themed-text';
import { distanceInMeters, formatDistance } from '@/services/ispark';
import { Coordinates } from '@/types/parking';

type MapTargetParams = {
  latitude?: string | string[];
  longitude?: string | string[];
  label?: string | string[];
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

async function requestCurrentLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('Konum izni verilmedi.');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

export default function MapTargetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<MapTargetParams>();
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [isLocating, setLocating] = useState(false);

  const target = useMemo(() => {
    const latitude = Number(firstParam(params.latitude));
    const longitude = Number(firstParam(params.longitude));

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return {
      id: 'route-target',
      latitude,
      longitude,
      title: firstParam(params.label) || 'Parket konumu',
      description: 'Uygulama içi harita hedefi',
    };
  }, [params.label, params.latitude, params.longitude]);

  const locate = useCallback(async () => {
    setLocating(true);
    try {
      const coordinates = await requestCurrentLocation();
      setCurrentLocation(coordinates);
    } catch (error) {
      Alert.alert(
        'Konum alınamadı',
        error instanceof Error ? error.message : 'Konum servisi kullanılamıyor.'
      );
    } finally {
      setLocating(false);
    }
  }, []);

  useEffect(() => {
    void locate();
  }, [locate]);

  const distanceText =
    currentLocation && target
      ? formatDistance(distanceInMeters(currentLocation, target))
      : undefined;

  if (!target) {
    return (
      <SafeAreaView style={styles.emptyScreen}>
        <ThemedText type="smallBold" style={styles.emptyTitle}>Harita hedefi eksik</ThemedText>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <ThemedText type="smallBold" style={styles.secondaryButtonText}>Geri dön</ThemedText>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.mapContainer}>
        <ParkingMap currentLocation={currentLocation} target={target} style={styles.map} />
      </View>

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar} pointerEvents="auto">
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <ThemedText type="smallBold" style={styles.iconButtonText}>‹</ThemedText>
          </Pressable>
          <View style={styles.topTitleBlock}>
            <ThemedText type="caption" style={styles.overline}>Uygulama içi harita</ThemedText>
            <ThemedText type="smallBold" style={styles.topTitle} numberOfLines={1}>
              {target.title}
            </ThemedText>
          </View>
          <Pressable style={styles.iconButton} onPress={locate} disabled={isLocating}>
            {isLocating ? (
              <ActivityIndicator color={activityIndicatorColor} size="small" />
            ) : (
              <ThemedText type="smallBold" style={styles.iconButtonText}>◎</ThemedText>
            )}
          </Pressable>
        </View>

        <View style={styles.infoCard} pointerEvents="auto">
          <View style={styles.infoCopy}>
            <ThemedText type="smallBold" style={styles.infoTitle}>
              {target.title}
            </ThemedText>
            <ThemedText type="caption" style={styles.infoMeta}>
              {distanceText ? `${distanceText} uzaklıkta` : 'Konumun alındığında mesafe gösterilir'}
            </ThemedText>
          </View>
          <Pressable style={styles.primaryButton} onPress={locate} disabled={isLocating}>
            <ThemedText type="smallBold" style={styles.primaryButtonText}>
              {isLocating ? 'Konum alınıyor' : 'Konumuma göre ortala'}
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
