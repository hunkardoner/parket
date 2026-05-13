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
import { ParkingPalette, Shadows } from '@/constants/brand';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { openWalkingDirections } from '@/services/directions';
import { distanceInMeters, fetchParkingLots, formatDistance } from '@/services/ispark';
import { loadLastKnownLocation, saveLastKnownLocation } from '@/services/location-store';
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
      const nextLots = await fetchParkingLots();
      setLots(nextLots);
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
        <View style={[styles.searchCard, Shadows.md]}>
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
          <ThemedText type="smallBold" style={{ color: ParkingPalette.ink }}>Sonuçlar</ThemedText>
          <View style={styles.resultsBadge}>
            <ThemedText type="caption" style={{ color: ParkingPalette.blue }}>
              {hasSearched ? `${results.length} uygun` : 'Arama bekleniyor'}
            </ThemedText>
          </View>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <ThemedText type="small" style={{ color: '#7A3B39' }}>⚠️  {error}</ThemedText>
          </View>
        ) : null}

        {/* ── Result cards ── */}
        <View style={styles.resultList}>
          {results.map((lot) => (
            <View key={lot.id} style={[styles.resultCard, Shadows.sm]}>
              <View style={styles.resultTop}>
                <View style={{ flex: 1, gap: 3 }}>
                  <ThemedText type="smallBold" style={{ color: ParkingPalette.ink, fontSize: 15 }}>{lot.name}</ThemedText>
                  <ThemedText type="caption" style={{ color: ParkingPalette.muted }}>
                    {lot.district} · {lot.type} · {formatDistance(lot.distanceMeters)}
                  </ThemedText>
                </View>
                <View style={styles.emptyBadge}>
                  <ThemedText type="smallBold" style={{ color: ParkingPalette.success }}>{lot.emptyCapacity} boş</ThemedText>
                </View>
              </View>
              <View style={styles.resultBottom}>
                <ThemedText type="caption" style={{ color: ParkingPalette.muted }}>
                  {lot.workHours} · {lot.freeTime} dk ücretsiz
                </ThemedText>
                <Pressable
                  style={styles.routeChip}
                  onPress={() => openWalkingDirections({ latitude: lot.latitude, longitude: lot.longitude }, lot.name)}>
                  <ThemedText type="smallBold" style={{ color: ParkingPalette.blue }}>🧭 Rota</ThemedText>
                </Pressable>
              </View>
            </View>
          ))}

          {hasSearched && results.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyEmoji}>🚫</ThemedText>
              <ThemedText type="smallBold" style={{ color: ParkingPalette.ink }}>Bu aralıkta uygun otopark yok</ThemedText>
              <ThemedText type="caption" style={{ color: ParkingPalette.muted }}>Mesafeyi artırıp tekrar arayabilirsin.</ThemedText>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F4F8' },
  content: {
    alignItems: 'center',
    paddingTop: Platform.select({ web: 80, default: 0 }),
    paddingBottom: BottomTabInset + Spacing.six,
  },
  safeArea: {
    width: '100%', maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three, gap: Spacing.three,
  },

  /* Header */
  header: { gap: 6, paddingTop: Spacing.two },
  overline: { color: ParkingPalette.violet },
  title: { color: ParkingPalette.ink },
  subtitle: { color: ParkingPalette.muted, fontSize: 14, lineHeight: 20 },

  /* Search */
  searchCard: {
    borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: ParkingPalette.ink,
  },
  sectionTitle: { color: '#FFFFFF', fontSize: 16, padding: Spacing.four, paddingBottom: 0 },
  radiusRow: { gap: Spacing.two, paddingHorizontal: Spacing.four, paddingVertical: Spacing.two },
  radiusChip: {
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'transparent',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  radiusChipActive: { borderColor: ParkingPalette.blue, backgroundColor: ParkingPalette.blue },
  radiusText: { color: 'rgba(255,255,255,0.65)' },
  radiusTextActive: { color: '#FFFFFF' },
  searchBtn: {
    margin: Spacing.four, marginTop: Spacing.two,
    minHeight: 48, borderRadius: Radius.full,
    backgroundColor: ParkingPalette.blue,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20, paddingVertical: 13,
    ...Shadows.glow(ParkingPalette.blue),
  },
  searchBtnText: { color: '#FFFFFF' },

  /* Map */
  mapWrap: { borderRadius: Radius.md, overflow: 'hidden', ...Shadows.md },

  /* Results */
  resultsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  resultsBadge: {
    borderRadius: Radius.full, backgroundColor: '#E6F2FB',
    paddingHorizontal: 10, paddingVertical: 3,
  },
  errorCard: {
    borderRadius: Radius.sm, borderWidth: 1, borderColor: ParkingPalette.coral,
    backgroundColor: ParkingPalette.coralLight, padding: Spacing.two,
  },
  resultList: { gap: Spacing.two },
  resultCard: {
    borderRadius: Radius.md, backgroundColor: ParkingPalette.surface,
    padding: Spacing.three, gap: Spacing.two,
  },
  resultTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  emptyBadge: {
    borderRadius: Radius.full, backgroundColor: ParkingPalette.successLight,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  resultBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two,
  },
  routeChip: {
    borderRadius: Radius.full, backgroundColor: '#EBF5FF',
    paddingHorizontal: 14, paddingVertical: 8,
  },
  emptyState: {
    borderRadius: Radius.md, backgroundColor: ParkingPalette.amberLight,
    borderWidth: 1, borderColor: ParkingPalette.amber,
    padding: Spacing.four, gap: 8, alignItems: 'center',
  },
  emptyEmoji: { fontSize: 36 },
});
