import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ParkingMap } from '@/components/parking-map';
import { ThemedText } from '@/components/themed-text';
import { ParkingPalette } from '@/constants/brand';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { openWalkingDirections } from '@/services/directions';
import { distanceInMeters, fetchParkingLots, formatDistance } from '@/services/ispark';
import { loadLastKnownLocation, saveLastKnownLocation } from '@/services/location-store';
import { ParkingLot, Coordinates } from '@/types/parking';

const radiusOptions = [300, 500, 1000, 2000, 5000];

async function requestCurrentLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('Konum izni verilmedi.');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

export default function ParkingSearchScreen() {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [radius, setRadius] = useState(1000);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLastKnownLocation().then((location) => {
      if (location) {
        setCurrentLocation(location);
      }
    });
  }, []);

  const findParking = useCallback(async () => {
    setSearching(true);
    setError(null);
    try {
      const coordinates = currentLocation ?? (await requestCurrentLocation());
      await saveLastKnownLocation(coordinates);
      setCurrentLocation(coordinates);
      const nextLots = await fetchParkingLots();
      setLots(nextLots);
      setHasSearched(true);
    } catch (searchError) {
      const message =
        searchError instanceof Error ? searchError.message : 'Otopark araması başlatılamadı.';
      setError(message);
      Alert.alert('Otopark bulunamadı', message);
    } finally {
      setSearching(false);
    }
  }, [currentLocation]);

  const results = useMemo(() => {
    if (!currentLocation) {
      return [];
    }

    return lots
      .map((lot) => ({
        ...lot,
        distanceMeters: distanceInMeters(currentLocation, {
          latitude: lot.latitude,
          longitude: lot.longitude,
        }),
      }))
      .filter((lot) => lot.distanceMeters <= radius)
      .filter((lot) => lot.isOpen && lot.emptyCapacity > 0)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [currentLocation, lots, radius]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText style={styles.eyebrow}>Otopark arama</ThemedText>
          <ThemedText type="title" style={styles.title}>
            Otopark arıyorum
          </ThemedText>
          <ThemedText style={styles.copy}>
            Mesafe aralığını seç, Parket sana açık ve boş kapasitesi olan yakındaki otoparkları
            listelesin.
          </ThemedText>
        </View>

        <View style={styles.searchCard}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Kaç metre aralığında aransın?
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radiusRow}>
            {radiusOptions.map((option) => (
              <Pressable
                key={option}
                style={[styles.radiusButton, radius === option && styles.radiusButtonActive]}
                onPress={() => setRadius(option)}>
                <ThemedText
                  type="smallBold"
                  style={[styles.radiusText, radius === option && styles.radiusTextActive]}>
                  {option < 1000 ? `${option} m` : `${option / 1000} km`}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable style={styles.primaryButton} onPress={findParking} disabled={isSearching}>
            {isSearching ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText type="smallBold" style={styles.primaryButtonText}>
                Otopark arıyorum
              </ThemedText>
            )}
          </Pressable>
        </View>

        <ParkingMap lots={results.slice(0, 10)} currentLocation={currentLocation} />

        <View style={styles.resultsHeader}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            Sonuçlar
          </ThemedText>
          <ThemedText type="small" style={styles.resultMeta}>
            {hasSearched ? `${results.length} uygun otopark` : 'Arama bekleniyor'}
          </ThemedText>
        </View>

        {error ? (
          <View style={styles.notice}>
            <ThemedText type="small" style={styles.noticeText}>
              {error}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.resultList}>
          {results.map((lot) => (
            <View key={lot.id} style={styles.resultCard}>
              <View style={styles.resultTop}>
                <View style={styles.resultTitleBlock}>
                  <ThemedText type="smallBold" style={styles.resultTitle}>
                    {lot.name}
                  </ThemedText>
                  <ThemedText type="small" style={styles.resultSubtitle}>
                    {lot.district} - {lot.type} - {formatDistance(lot.distanceMeters)}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold" style={styles.emptyText}>
                  {lot.emptyCapacity} boş
                </ThemedText>
              </View>
              <View style={styles.resultBottom}>
                <ThemedText type="small" style={styles.resultSubtitle}>
                  {lot.workHours} - {lot.freeTime} dk ücretsiz
                </ThemedText>
                <Pressable
                  style={styles.routeButton}
                  onPress={() =>
                    openWalkingDirections(
                      { latitude: lot.latitude, longitude: lot.longitude },
                      lot.name
                    )
                  }>
                  <ThemedText type="smallBold" style={styles.routeText}>
                    Rota
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          ))}

          {hasSearched && results.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText type="smallBold" style={styles.resultTitle}>
                Bu aralıkta uygun otopark yok
              </ThemedText>
              <ThemedText type="small" style={styles.resultSubtitle}>
                Mesafeyi artırıp tekrar arayabilirsin.
              </ThemedText>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fbfdff',
  },
  content: {
    alignItems: 'center',
    paddingTop: Platform.select({ web: 74, default: 0 }),
    paddingBottom: BottomTabInset + Spacing.five,
  },
  safeArea: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
    paddingTop: Spacing.two,
  },
  eyebrow: {
    color: ParkingPalette.violet,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: ParkingPalette.ink,
    fontSize: 40,
    lineHeight: 44,
  },
  copy: {
    color: '#4d5963',
  },
  searchCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    backgroundColor: '#ffffff',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  sectionTitle: {
    color: ParkingPalette.ink,
    fontSize: 18,
  },
  radiusRow: {
    gap: Spacing.two,
  },
  radiusButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  radiusButtonActive: {
    borderColor: ParkingPalette.blue,
    backgroundColor: ParkingPalette.blue,
  },
  radiusText: {
    color: ParkingPalette.ink,
  },
  radiusTextActive: {
    color: '#ffffff',
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: ParkingPalette.blue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  resultMeta: {
    color: '#687783',
  },
  notice: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffd2c6',
    backgroundColor: '#fff3ef',
    padding: Spacing.two,
  },
  noticeText: {
    color: '#755045',
  },
  resultList: {
    gap: Spacing.two,
  },
  resultCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    backgroundColor: '#ffffff',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  resultTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  resultTitleBlock: {
    flex: 1,
    gap: 4,
  },
  resultTitle: {
    color: ParkingPalette.ink,
    fontSize: 17,
  },
  resultSubtitle: {
    color: '#687783',
  },
  emptyText: {
    color: ParkingPalette.success,
  },
  resultBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  routeButton: {
    borderRadius: 8,
    backgroundColor: '#edf6fb',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  routeText: {
    color: ParkingPalette.blue,
  },
  emptyState: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3c986',
    backgroundColor: ParkingPalette.sand,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
