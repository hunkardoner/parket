import {
  useCallback,
  useEffect,
  useMemo,
  useState } from 'react';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './style';

import { ParkingMap } from '@/components/parking-map';
import { ThemedText } from '@/components/themed-text';
import { openInAppMap } from '@/services/directions';
import { distanceInMeters, fetchParkingLots, formatDistance } from '@/services/ispark';
import { loadLastKnownLocation, saveLastKnownLocation } from '@/services/location-store';
import { listCustomLots, CATEGORY_LABELS } from '@/services/custom-parking';
import { ParkingLot, Coordinates } from '@/types/parking';

const radiusOptions = [300, 500, 1000, 2000, 5000];

async function requestCurrentLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('Konum izni verilmedi.');
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

export default function ParkingSearchScreen() {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [radius, setRadius] = useState(1000);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLastKnownLocation().then((location) => { if (location) setCurrentLocation(location); });
  }, []);

  const findParking = useCallback(async () => {
    setSearching(true);
    setError(null);
    try {
      const coordinates = currentLocation ?? (await requestCurrentLocation());
      await saveLastKnownLocation(coordinates);
      setCurrentLocation(coordinates);
      const [isparkLots, customLots] = await Promise.all([fetchParkingLots(), listCustomLots()]);
      const convertedCustom: ParkingLot[] = customLots.map((cl) => ({
        id: -Math.abs(cl.name.length + cl.latitude * 1000),
        name: `${CATEGORY_LABELS[cl.category]} ${cl.name}`,
        latitude: cl.latitude,
        longitude: cl.longitude,
        capacity: cl.capacity,
        emptyCapacity: cl.emptyCapacity,
        occupiedCapacity: cl.capacity - cl.emptyCapacity,
        occupancyRate: cl.capacity > 0 ? (cl.capacity - cl.emptyCapacity) / cl.capacity : 0,
        workHours: cl.workHours ?? '24 Saat',
        type: cl.isFree ? 'Ücretsiz' : 'Ücretli',
        freeTime: cl.freeMinutes,
        district: cl.district ?? '',
        isOpen: true,
        status: cl.emptyCapacity === 0 ? 'full' : cl.emptyCapacity <= 5 ? 'limited' : 'open',
      }));
      setLots([...isparkLots, ...convertedCustom]);
      setHasSearched(true);
    } catch (searchError) {
      const message = searchError instanceof Error ? searchError.message : 'Otopark araması başlatılamadı.';
      setError(message);
      Alert.alert('Otopark bulunamadı', message);
    } finally { setSearching(false); }
  }, [currentLocation]);

  const results = useMemo(() => {
    if (!currentLocation) return [];
    return lots
      .map((lot) => ({
        ...lot,
        distanceMeters: distanceInMeters(currentLocation, { latitude: lot.latitude, longitude: lot.longitude }),
      }))
      .filter((lot) => lot.distanceMeters <= radius)
      .filter((lot) => lot.isOpen && lot.emptyCapacity > 0)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [currentLocation, lots, radius]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SafeAreaView style={styles.safeArea}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <ThemedText type="overline" style={styles.overline}>Otopark arama</ThemedText>
          <ThemedText type="title" style={styles.title}>Otopark arıyorum</ThemedText>
          <ThemedText style={styles.subtitle}>
            Mesafe aralığını seç, Parket sana açık ve boş kapasitesi olan yakındaki otoparkları listelesin.
          </ThemedText>
        </View>

        {/* ── Search card ── */}
        <View style={[styles.searchCard, styles.shadowMd]}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>📍  Kaç metre aralığında aransın?</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radiusRow}>
            {radiusOptions.map((option) => (
              <Pressable
                key={option}
                style={[styles.radiusChip, radius === option && styles.radiusChipActive]}
                onPress={() => setRadius(option)}>
                <ThemedText type="smallBold" style={[styles.radiusText, radius === option && styles.radiusTextActive]}>
                  {option < 1000 ? `${option} m` : `${option / 1000} km`}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable style={styles.searchBtn} onPress={findParking} disabled={isSearching}>
            {isSearching ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText type="smallBold" style={styles.searchBtnText}>🔍  Otopark arıyorum</ThemedText>
            )}
          </Pressable>
        </View>

        {/* ── Map ── */}
        <View style={styles.mapWrap}>
          <ParkingMap lots={results.slice(0, 10)} currentLocation={currentLocation} />
        </View>

        {/* ── Results header ── */}
        <View style={styles.resultsHeader}>
          <ThemedText type="smallBold" style={styles.resultsTitle}>Sonuçlar</ThemedText>
          <View style={styles.resultsBadge}>
            <ThemedText type="caption" style={styles.resultsBadgeText}>
              {hasSearched ? `${results.length} uygun` : 'Arama bekleniyor'}
            </ThemedText>
          </View>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <ThemedText type="small" style={styles.errorText}>⚠️  {error}</ThemedText>
          </View>
        ) : null}

        {/* ── Result cards ── */}
        <View style={styles.resultList}>
          {results.map((lot) => (
            <View key={lot.id} style={[styles.resultCard, styles.shadowSm]}>
              <View style={styles.resultTop}>
                <View style={styles.resultTitleBlock}>
                  <ThemedText type="smallBold" style={styles.resultTitle}>{lot.name}</ThemedText>
                  <ThemedText type="caption" style={styles.resultMeta}>
                    {lot.district} · {lot.type} · {formatDistance(lot.distanceMeters)}
                  </ThemedText>
                </View>
                <View style={styles.emptyBadge}>
                  <ThemedText type="smallBold" style={styles.emptyBadgeText}>{lot.emptyCapacity} boş</ThemedText>
                </View>
              </View>
              <View style={styles.resultBottom}>
                <ThemedText type="caption" style={styles.resultMeta}>
                  {lot.workHours} · {lot.freeTime} dk ücretsiz
                </ThemedText>
                <Pressable
                  style={styles.routeChip}
                  onPress={() => openInAppMap({ latitude: lot.latitude, longitude: lot.longitude }, lot.name)}>
                  <ThemedText type="smallBold" style={styles.routeChipText}>🗺 Harita</ThemedText>
                </Pressable>
              </View>
            </View>
          ))}

          {hasSearched && results.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyEmoji}>🚫</ThemedText>
              <ThemedText type="smallBold" style={styles.emptyTitle}>Bu aralıkta uygun otopark yok</ThemedText>
              <ThemedText type="caption" style={styles.emptySub}>Mesafeyi artırıp tekrar arayabilirsin.</ThemedText>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}
