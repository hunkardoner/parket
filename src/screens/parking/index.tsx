import {
  useCallback,
  useEffect,
  useMemo,
  useState } from 'react';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  activityIndicatorColor,
  getCapacityFillStyle,
  getStatAccentStyle,
  getStatValueStyle,
  getStatusPillStyle,
  getStatusTextStyle,
  inputPlaceholderColor,
  refreshControlColor,
  statAccentColors,
  styles,
} from './style';

import { ParkingMap } from '@/components/parking-map';
import { ThemedText } from '@/components/themed-text';
import { openInAppMap } from '@/services/directions';
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
import { askNearbyFreeSpot } from '@/services/nearby-prompt';
import { addToHistory } from '@/services/parking-history';
import { listCustomLots, CATEGORY_LABELS } from '@/services/custom-parking';
import { useAuthSession } from '@/hooks/use-auth-session';
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
  const auth = useAuthSession();
  const router = useRouter();
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
    const [isparkLots, nextReports, customLots] = await Promise.all([
      fetchParkingLots(),
      listStreetReports(),
      listCustomLots(),
    ]);
    // Convert custom lots to ParkingLot format for unified display
    const convertedCustom: ParkingLot[] = customLots.map((cl) => ({
      id: -Math.abs(cl.name.length + cl.latitude * 1000), // negative ID to avoid collision with İSPARK
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
    const vehicle = {
      id: makeVehicleId(), source: 'ispark' as const, title: lot.name,
      latitude: lot.latitude, longitude: lot.longitude,
      addressHint: `${lot.district} - ${lot.type}`, lotId: lot.id,
      createdAt: new Date().toISOString(),
    };
    await saveParkedVehicle(vehicle);
    await notifyParkingSaved(lot.name);
    if (auth.user?.id) await addToHistory(vehicle, auth.user.id);
    // Always ask about nearby free spots
    askNearbyFreeSpot(
      { latitude: lot.latitude, longitude: lot.longitude },
      auth.user?.id,
      () => {
        Alert.alert('Park konumu kaydedildi', 'Aracım sekmesinden uygulama içi haritada görebilirsin.');
      },
    );
  }, [auth.user?.id]);

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
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={refreshControlColor} />}
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

        {/* ── Manager panel button (only for managers) ── */}
        {auth.isManager ? (
          <Pressable style={[styles.managerCard, styles.shadowMd]} onPress={() => router.push('/manager')}>
            <View style={styles.managerCardInner}>
              <View style={styles.managerIcon}>
                <ThemedText style={{ fontSize: 22 }}>⚙️</ThemedText>
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold" style={styles.managerTitle}>Yönetici Paneli</ThemedText>
                <ThemedText type="caption" style={styles.managerSub}>Otoparkınızı yönetin · Kapasite ve fiyat kontrolü</ThemedText>
              </View>
              <ThemedText style={styles.managerArrow}>→</ThemedText>
            </View>
          </Pressable>
        ) : null}

        {/* ── Stats grid ── */}
        <View style={styles.statsGrid}>
          <StatCard icon="🅿️" label="Otopark" value={stats.total.toString()} accent={statAccentColors.parking} />
          <StatCard icon="🟢" label="Açık" value={stats.open.toString()} accent={statAccentColors.open} />
          <StatCard icon="🔓" label="Boş kapasite" value={stats.emptyCapacity.toLocaleString('tr-TR')} accent={statAccentColors.empty} />
          <StatCard icon="📊" label="Doluluk" value={formatPercent(stats.occupancy)} accent={statAccentColors.occupancy} />
        </View>

        {/* ── Search & filters ── */}
        <View style={styles.searchCard}>
          <View style={styles.searchInputWrap}>
            <ThemedText style={styles.searchIcon}>🔍</ThemedText>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Otopark, ilçe veya tip ara…"
              placeholderTextColor={inputPlaceholderColor}
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
            <View style={styles.streetCopy}>
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
            <ActivityIndicator color={activityIndicatorColor} size="large" />
            <ThemedText type="small" style={styles.loadingText}>İSPARK verisi yükleniyor…</ThemedText>
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
                onDirections={() => openInAppMap({ latitude: lot.latitude, longitude: lot.longitude }, lot.name)}
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
    <View style={[styles.statCard, styles.shadowSm]}>
      <View style={[styles.statAccent, getStatAccentStyle(accent)]} />
      <ThemedText style={styles.statIcon}>{icon}</ThemedText>
      <ThemedText type="caption" style={styles.statLabel}>{label}</ThemedText>
      <ThemedText type="subtitle" style={[styles.statValue, getStatValueStyle(accent)]}>{value}</ThemedText>
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
    <View style={[styles.lotCard, styles.shadowMd]}>
      {/* Header */}
      <View style={styles.lotHeader}>
        <View style={styles.lotTitleBlock}>
          <ThemedText type="smallBold" style={styles.lotName}>{lot.name}</ThemedText>
          <ThemedText type="caption" style={styles.lotMeta}>
            {lot.district} · {lot.type}{distance ? ` · ${distance}` : ''}
          </ThemedText>
        </View>
        <View style={[styles.statusPill, getStatusPillStyle(lot.status)]}>
          <ThemedText type="caption" style={[styles.statusText, getStatusTextStyle(lot.status)]}>
            {statusLabel(lot)}
          </ThemedText>
        </View>
      </View>

      {/* Capacity bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, getCapacityFillStyle(fillPct, lot.occupancyRate)]} />
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
          <ThemedText type="smallBold" style={styles.actionBtnText}>🗺  Harita</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────── */
