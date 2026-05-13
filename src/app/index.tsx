import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ParkingMap } from '@/components/parking-map';
import { ThemedText } from '@/components/themed-text';
import { ParkingPalette, Shadows } from '@/constants/brand';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { openWalkingDirections } from '@/services/directions';
import {
  distanceInMeters,
  fetchParkingDetail,
  fetchParkingLots,
  formatDistance,
} from '@/services/ispark';
import { loadLastKnownLocation, saveLastKnownLocation } from '@/services/location-store';
import { saveParkedVehicle } from '@/services/local-store';
import { notifyParkingSaved } from '@/services/notifications';
import { listStreetReports } from '@/services/street-reports';
import { Coordinates, ParkingLot, ParkingLotDetail, StreetParkingReport } from '@/types/parking';

type FilterKey = 'all' | 'nearby' | 'available' | 'street' | 'garage';

const filters: { key: FilterKey; label: string; icon: string }[] = [
  { key: 'all', label: 'Tümü', icon: '📋' },
  { key: 'nearby', label: 'Yakınımda', icon: '📍' },
  { key: 'available', label: 'Boş yer var', icon: '✅' },
  { key: 'street', label: 'Yol üstü', icon: '🛣️' },
  { key: 'garage', label: 'Açık/Kapalı', icon: '🏗️' },
];

function statusLabel(lot: ParkingLot) {
  if (lot.status === 'closed') return 'Kapalı';
  if (lot.status === 'full') return 'Dolu';
  if (lot.status === 'limited') return 'Az yer';
  return 'Müsait';
}

function statusColor(lot: ParkingLot) {
  if (lot.status === 'closed') return ParkingPalette.muted;
  if (lot.status === 'full') return ParkingPalette.coral;
  if (lot.status === 'limited') return ParkingPalette.amber;
  return ParkingPalette.success;
}

function statusBg(lot: ParkingLot) {
  if (lot.status === 'closed') return '#F0F3F6';
  if (lot.status === 'full') return ParkingPalette.coralLight;
  if (lot.status === 'limited') return ParkingPalette.amberLight;
  return ParkingPalette.successLight;
}

function capacityColor(rate: number) {
  if (rate > 0.85) return ParkingPalette.coral;
  if (rate > 0.6) return ParkingPalette.amber;
  return ParkingPalette.success;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function makeVehicleId() {
  return `vehicle-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

async function getCurrentCoordinates() {
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

export default function ParkingScreen() {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [reports, setReports] = useState<StreetParkingReport[]>([]);
  const [detailsById, setDetailsById] = useState<Record<number, ParkingLotDetail>>({});
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [showStreetReports, setShowStreetReports] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [nextLots, nextReports] = await Promise.all([fetchParkingLots(), listStreetReports()]);
    setLots(nextLots);
    setReports(nextReports);
  }, []);

  useEffect(() => {
    loadLastKnownLocation().then((location) => {
      if (location) setCurrentLocation(location);
    });
    load()
      .catch((loadError: Error) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); }
    catch (refreshError) { setError(refreshError instanceof Error ? refreshError.message : 'Veri yenilenemedi.'); }
    finally { setRefreshing(false); }
  }, [load]);

  const locate = useCallback(async () => {
    try {
      const coordinates = await getCurrentCoordinates();
      await saveLastKnownLocation(coordinates);
      setCurrentLocation(coordinates);
    } catch (locationError) {
      Alert.alert('Konum alınamadı', locationError instanceof Error ? locationError.message : 'Konum servisi kullanılamıyor.');
    }
  }, []);

  const visibleLots = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR');
    const decorated = lots.map((lot) => ({
      ...lot,
      distanceMeters: currentLocation
        ? distanceInMeters(currentLocation, { latitude: lot.latitude, longitude: lot.longitude })
        : undefined,
    }));

    return decorated
      .filter((lot) => {
        if (!normalizedQuery) return true;
        return [lot.name, lot.district, lot.type].join(' ').toLocaleLowerCase('tr-TR').includes(normalizedQuery);
      })
      .filter((lot) => {
        if (filter === 'available') return lot.isOpen && lot.emptyCapacity > 0;
        if (filter === 'street') return lot.type.toLocaleLowerCase('tr-TR').includes('yol');
        if (filter === 'garage') return !lot.type.toLocaleLowerCase('tr-TR').includes('yol');
        return true;
      })
      .sort((a, b) => {
        if (filter === 'nearby' && a.distanceMeters !== undefined && b.distanceMeters !== undefined) return a.distanceMeters - b.distanceMeters;
        if (currentLocation && a.distanceMeters !== undefined && b.distanceMeters !== undefined) return a.distanceMeters - b.distanceMeters;
        return b.emptyCapacity - a.emptyCapacity;
      });
  }, [currentLocation, filter, lots, query]);

  const stats = useMemo(() => {
    const openLots = lots.filter((lot) => lot.isOpen);
    const emptyCapacity = lots.reduce((sum, lot) => sum + lot.emptyCapacity, 0);
    const totalCapacity = lots.reduce((sum, lot) => sum + lot.capacity, 0);
    return { total: lots.length, open: openLots.length, emptyCapacity, occupancy: totalCapacity > 0 ? 1 - emptyCapacity / totalCapacity : 0 };
  }, [lots]);

  const displayedLots = visibleLots.slice(0, 3);

  const markLotAsParked = useCallback(async (lot: ParkingLot) => {
    await saveParkedVehicle({
      id: makeVehicleId(), source: 'ispark', title: lot.name,
      latitude: lot.latitude, longitude: lot.longitude,
      addressHint: `${lot.district} - ${lot.type}`, lotId: lot.id,
      createdAt: new Date().toISOString(),
    });
    await notifyParkingSaved(lot.name);
    Alert.alert('Park konumu kaydedildi', 'Aracım sekmesinden yürüyüş rotasını açabilirsin.');
  }, []);

  const loadDetail = useCallback(async (lot: ParkingLot) => {
    if (detailsById[lot.id]) return;
    setDetailLoadingId(lot.id);
    try {
      const detail = await fetchParkingDetail(lot.id);
      if (detail) setDetailsById((current) => ({ ...current, [lot.id]: detail }));
    } catch (detailError) {
      Alert.alert('Fiyat bilgisi alınamadı', detailError instanceof Error ? detailError.message : 'İSPARK detay servisi yanıt vermedi.');
    } finally { setDetailLoadingId(null); }
  }, [detailsById]);

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={ParkingPalette.blue} />}
      contentContainerStyle={styles.content}>
      <SafeAreaView style={styles.safeArea}>
        {/* ── Hero section ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroInner}>
            <ThemedText type="overline" style={styles.heroOverline}>İstanbul park asistanı</ThemedText>
            <ThemedText type="title" style={styles.heroTitle}>Parket!</ThemedText>
            <ThemedText style={styles.heroCopy}>
              Konumuna göre en yakın 3 otoparkın doluluk, çalışma saati ve fiyat detayını gösterir.
            </ThemedText>
            <Pressable style={styles.heroCta} onPress={locate}>
              <ThemedText type="smallBold" style={styles.heroCtaText}>📍  Konumuma göre sırala</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* ── Stats grid ── */}
        <View style={styles.statsGrid}>
          <StatCard icon="🅿️" label="Otopark" value={stats.total.toString()} accent={ParkingPalette.blue} />
          <StatCard icon="🟢" label="Açık" value={stats.open.toString()} accent={ParkingPalette.success} />
          <StatCard icon="🔓" label="Boş kapasite" value={stats.emptyCapacity.toLocaleString('tr-TR')} accent={ParkingPalette.amber} />
          <StatCard icon="📊" label="Doluluk" value={formatPercent(stats.occupancy)} accent={ParkingPalette.coral} />
        </View>

        {/* ── Search & filters ── */}
        <View style={styles.searchCard}>
          <View style={styles.searchInputWrap}>
            <ThemedText style={styles.searchIcon}>🔍</ThemedText>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Otopark, ilçe veya tip ara…"
              placeholderTextColor={ParkingPalette.muted}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {filters.map((item) => (
              <Pressable
                key={item.key}
                style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
                onPress={() => { setFilter(item.key); if (item.key === 'nearby' && !currentLocation) void locate(); }}>
                <ThemedText style={styles.filterEmoji}>{item.icon}</ThemedText>
                <ThemedText type="smallBold" style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
                  {item.label}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── Street reports toggle ── */}
        <Pressable
          style={[styles.streetCard, showStreetReports && styles.streetCardActive]}
          onPress={() => setShowStreetReports((v) => !v)}>
          <View style={styles.streetCardInner}>
            <View style={styles.streetIconBadge}>
              <ThemedText style={styles.streetEmoji}>🚗</ThemedText>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold" style={styles.streetTitle}>Sokakta park yeri arıyorum</ThemedText>
              <ThemedText type="caption" style={styles.streetSub}>Yakındaki boş yer bildirimlerini göster</ThemedText>
            </View>
            <View style={styles.streetBadge}>
              <ThemedText type="smallBold" style={styles.streetBadgeText}>{reports.length}</ThemedText>
            </View>
          </View>
        </Pressable>

        {/* ── Map ── */}
        <View style={styles.mapWrap}>
          <ParkingMap
            lots={displayedLots}
            reports={showStreetReports ? reports : []}
            currentLocation={currentLocation}
            onLotPress={markLotAsParked}
          />
        </View>

        {/* ── Error ── */}
        {error ? (
          <View style={styles.errorCard}>
            <ThemedText type="smallBold" style={styles.errorTitle}>⚠️  Veri alınamadı</ThemedText>
            <ThemedText type="small" style={styles.errorText}>{error}</ThemedText>
          </View>
        ) : null}

        {/* ── Lot list ── */}
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={ParkingPalette.blue} size="large" />
            <ThemedText type="small" style={{ color: ParkingPalette.muted }}>İSPARK verisi yükleniyor…</ThemedText>
          </View>
        ) : (
          <View style={styles.lotList}>
            {displayedLots.map((lot) => (
              <LotCard
                key={lot.id}
                lot={lot}
                detail={detailsById[lot.id]}
                isDetailLoading={detailLoadingId === lot.id}
                onDetail={() => loadDetail(lot)}
                onPark={() => markLotAsParked(lot)}
                onDirections={() => openWalkingDirections({ latitude: lot.latitude, longitude: lot.longitude }, lot.name)}
              />
            ))}
          </View>
        )}
      </SafeAreaView>
    </ScrollView>
  );
}

/* ── Sub-components ──────────────────────────────── */

function StatCard({ icon, label, value, accent }: { icon: string; label: string; value: string; accent: string }) {
  return (
    <View style={[styles.statCard, Shadows.sm]}>
      <View style={[styles.statAccent, { backgroundColor: accent }]} />
      <ThemedText style={styles.statIcon}>{icon}</ThemedText>
      <ThemedText type="caption" style={styles.statLabel}>{label}</ThemedText>
      <ThemedText type="subtitle" style={[styles.statValue, { color: accent }]}>{value}</ThemedText>
    </View>
  );
}

function LotCard({ lot, detail, isDetailLoading, onDetail, onPark, onDirections }: {
  lot: ParkingLot; detail?: ParkingLotDetail; isDetailLoading: boolean;
  onDetail: () => void; onPark: () => void; onDirections: () => void;
}) {
  const distance = formatDistance(lot.distanceMeters);
  const tariffLines = detail?.tariff?.split(';').filter(Boolean) ?? [];
  const fillPct = Math.round(lot.occupancyRate * 100);

  return (
    <View style={[styles.lotCard, Shadows.md]}>
      {/* Header */}
      <View style={styles.lotHeader}>
        <View style={styles.lotTitleBlock}>
          <ThemedText type="smallBold" style={styles.lotName}>{lot.name}</ThemedText>
          <ThemedText type="caption" style={styles.lotMeta}>
            {lot.district} · {lot.type}{distance ? ` · ${distance}` : ''}
          </ThemedText>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusBg(lot) }]}>
          <ThemedText type="caption" style={[styles.statusText, { color: statusColor(lot) }]}>
            {statusLabel(lot)}
          </ThemedText>
        </View>
      </View>

      {/* Capacity bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${fillPct}%`, backgroundColor: capacityColor(lot.occupancyRate) }]} />
      </View>

      {/* Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <ThemedText type="caption" style={styles.metricLabel}>Boş</ThemedText>
          <ThemedText type="smallBold" style={styles.metricValue}>{lot.emptyCapacity}/{lot.capacity}</ThemedText>
        </View>
        <View style={styles.metricItem}>
          <ThemedText type="caption" style={styles.metricLabel}>Saat</ThemedText>
          <ThemedText type="smallBold" style={styles.metricValue}>{lot.workHours}</ThemedText>
        </View>
        <View style={styles.metricItem}>
          <ThemedText type="caption" style={styles.metricLabel}>Ücretsiz</ThemedText>
          <ThemedText type="smallBold" style={styles.metricValue}>{lot.freeTime} dk</ThemedText>
        </View>
      </View>

      {/* Detail panel */}
      {detail ? (
        <View style={styles.detailPanel}>
          {detail.address ? <ThemedText type="small" style={styles.detailAddr}>{detail.address}</ThemedText> : null}
          {tariffLines.length > 0 ? (
            <View style={styles.tariffGrid}>
              {tariffLines.slice(0, 6).map((line) => (
                <View key={line} style={styles.tariffChip}>
                  <ThemedText type="caption" style={styles.tariffText}>{line.trim()}</ThemedText>
                </View>
              ))}
            </View>
          ) : null}
          {detail.monthlyFee ? (
            <ThemedText type="smallBold" style={styles.monthlyFee}>
              Aylık abonman: {detail.monthlyFee.toLocaleString('tr-TR')} ₺
            </ThemedText>
          ) : null}
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.lotActions}>
        <Pressable style={styles.actionBtn} onPress={onDetail}>
          <ThemedText type="smallBold" style={styles.actionBtnText}>
            {isDetailLoading ? '⏳' : '💰'}  {isDetailLoading ? 'Yükleniyor' : 'Fiyat'}
          </ThemedText>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={onPark}>
          <ThemedText type="smallBold" style={styles.actionBtnPrimaryText}>🅿️  Park ettim</ThemedText>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={onDirections}>
          <ThemedText type="smallBold" style={styles.actionBtnText}>🧭  Rota</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────── */

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

  /* Hero */
  heroCard: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: ParkingPalette.ink,
    ...Shadows.lg,
  },
  heroInner: {
    padding: Spacing.four, gap: 12,
    experimental_backgroundImage: ParkingPalette.gradientHero,
  },
  heroOverline: { color: ParkingPalette.blueLight },
  heroTitle: { color: '#FFFFFF', fontSize: 38, lineHeight: 44 },
  heroCopy: { color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 20 },
  heroCta: {
    alignSelf: 'flex-start', marginTop: 4,
    borderRadius: Radius.full,
    backgroundColor: ParkingPalette.blue,
    paddingHorizontal: 20, paddingVertical: 12,
    ...Shadows.glow(ParkingPalette.blue),
  },
  heroCtaText: { color: '#FFFFFF' },

  /* Stats */
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  statCard: {
    minWidth: 148, flexGrow: 1,
    borderRadius: Radius.md, backgroundColor: ParkingPalette.surface,
    padding: Spacing.three, gap: 4,
  },
  statAccent: { width: 32, height: 4, borderRadius: 2, marginBottom: 4 },
  statIcon: { fontSize: 18 },
  statLabel: { color: ParkingPalette.muted },
  statValue: { fontSize: 22 },

  /* Search */
  searchCard: {
    borderRadius: Radius.md, backgroundColor: ParkingPalette.surface,
    padding: Spacing.three, gap: Spacing.two,
    ...Shadows.sm,
  },
  searchInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.sm, backgroundColor: '#F0F5FA',
    paddingHorizontal: 14, gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1, minHeight: 46,
    color: ParkingPalette.ink, fontSize: 15, fontWeight: '600',
  },
  filterRow: { gap: Spacing.two, paddingVertical: 2 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: ParkingPalette.lineSoft,
    backgroundColor: ParkingPalette.surface,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: ParkingPalette.blue, borderColor: ParkingPalette.blue,
  },
  filterEmoji: { fontSize: 14 },
  filterText: { color: ParkingPalette.inkSecondary },
  filterTextActive: { color: '#FFFFFF' },

  /* Street reports */
  streetCard: {
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: ParkingPalette.violetLight,
    backgroundColor: '#F9F7FF', padding: Spacing.three,
  },
  streetCardActive: { backgroundColor: '#EEEAFF', borderColor: ParkingPalette.violet },
  streetCardInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streetIconBadge: {
    width: 40, height: 40, borderRadius: Radius.sm,
    backgroundColor: ParkingPalette.violetLight,
    alignItems: 'center', justifyContent: 'center',
  },
  streetEmoji: { fontSize: 18 },
  streetTitle: { color: ParkingPalette.ink },
  streetSub: { color: ParkingPalette.muted, marginTop: 2 },
  streetBadge: {
    minWidth: 32, height: 32, borderRadius: Radius.full,
    backgroundColor: ParkingPalette.violet,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
  },
  streetBadgeText: { color: '#FFFFFF', fontSize: 14 },

  /* Map */
  mapWrap: { borderRadius: Radius.md, overflow: 'hidden', ...Shadows.md },

  /* Error */
  errorCard: {
    borderRadius: Radius.md, backgroundColor: ParkingPalette.coralLight,
    borderWidth: 1, borderColor: ParkingPalette.coral,
    padding: Spacing.three, gap: 6,
  },
  errorTitle: { color: ParkingPalette.coral },
  errorText: { color: '#7A3B39' },

  /* Loading */
  loadingWrap: { alignItems: 'center', padding: Spacing.five, gap: Spacing.three },

  /* Lot list */
  lotList: { gap: Spacing.three },
  lotCard: {
    borderRadius: Radius.md, backgroundColor: ParkingPalette.surface,
    padding: Spacing.three, gap: 14,
  },
  lotHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  lotTitleBlock: { flex: 1, gap: 3 },
  lotName: { color: ParkingPalette.ink, fontSize: 16 },
  lotMeta: { color: ParkingPalette.muted },
  statusPill: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 11 },

  /* Capacity bar */
  barTrack: { height: 6, borderRadius: 3, backgroundColor: '#EDF2F7', overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },

  /* Metrics */
  metricsRow: { flexDirection: 'row', gap: Spacing.two },
  metricItem: {
    flex: 1, borderRadius: Radius.xs, backgroundColor: '#F5F8FB',
    padding: Spacing.two, gap: 2, alignItems: 'center',
  },
  metricLabel: { color: ParkingPalette.muted },
  metricValue: { color: ParkingPalette.ink, fontSize: 13 },

  /* Detail */
  detailPanel: {
    borderRadius: Radius.sm, backgroundColor: '#F5F8FB',
    borderWidth: 1, borderColor: ParkingPalette.lineSoft,
    padding: Spacing.two, gap: Spacing.two,
  },
  detailAddr: { color: ParkingPalette.inkSecondary },
  tariffGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tariffChip: {
    borderRadius: Radius.xs, backgroundColor: ParkingPalette.surface,
    borderWidth: 1, borderColor: ParkingPalette.lineSoft,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  tariffText: { color: ParkingPalette.ink },
  monthlyFee: { color: ParkingPalette.blue },

  /* Actions */
  lotActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  actionBtn: {
    borderRadius: Radius.sm, borderWidth: 1.5, borderColor: ParkingPalette.lineSoft,
    backgroundColor: ParkingPalette.surface,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  actionBtnText: { color: ParkingPalette.ink },
  actionBtnPrimary: {
    backgroundColor: ParkingPalette.blue, borderColor: ParkingPalette.blue,
    ...Shadows.glow(ParkingPalette.blue),
  },
  actionBtnPrimaryText: { color: '#FFFFFF' },
});
