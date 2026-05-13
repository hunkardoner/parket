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
import { ParkingPalette } from '@/constants/brand';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
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

const filters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'nearby', label: 'Yakınımda' },
  { key: 'available', label: 'Boş yer var' },
  { key: 'street', label: 'Yol üstü' },
  { key: 'garage', label: 'Açık/Kapalı' },
];

function statusLabel(lot: ParkingLot) {
  if (lot.status === 'closed') {
    return 'Kapalı';
  }
  if (lot.status === 'full') {
    return 'Dolu';
  }
  if (lot.status === 'limited') {
    return 'Az yer';
  }
  return 'Müsait';
}

function statusColor(lot: ParkingLot) {
  if (lot.status === 'closed') {
    return '#6f7780';
  }
  if (lot.status === 'full') {
    return ParkingPalette.coral;
  }
  if (lot.status === 'limited') {
    return ParkingPalette.amber;
  }
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
      if (location) {
        setCurrentLocation(location);
      }
    });

    load()
      .catch((loadError: Error) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Veri yenilenemedi.');
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const locate = useCallback(async () => {
    try {
      const coordinates = await getCurrentCoordinates();
      await saveLastKnownLocation(coordinates);
      setCurrentLocation(coordinates);
    } catch (locationError) {
      Alert.alert(
        'Konum alınamadı',
        locationError instanceof Error ? locationError.message : 'Konum servisi kullanılamıyor.'
      );
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
        if (!normalizedQuery) {
          return true;
        }
        return [lot.name, lot.district, lot.type]
          .join(' ')
          .toLocaleLowerCase('tr-TR')
          .includes(normalizedQuery);
      })
      .filter((lot) => {
        if (filter === 'available') {
          return lot.isOpen && lot.emptyCapacity > 0;
        }
        if (filter === 'street') {
          return lot.type.toLocaleLowerCase('tr-TR').includes('yol');
        }
        if (filter === 'garage') {
          return !lot.type.toLocaleLowerCase('tr-TR').includes('yol');
        }
        return true;
      })
      .sort((a, b) => {
        if (filter === 'nearby' && a.distanceMeters !== undefined && b.distanceMeters !== undefined) {
          return a.distanceMeters - b.distanceMeters;
        }
        if (currentLocation && a.distanceMeters !== undefined && b.distanceMeters !== undefined) {
          return a.distanceMeters - b.distanceMeters;
        }
        return b.emptyCapacity - a.emptyCapacity;
      });
  }, [currentLocation, filter, lots, query]);

  const stats = useMemo(() => {
    const openLots = lots.filter((lot) => lot.isOpen);
    const emptyCapacity = lots.reduce((sum, lot) => sum + lot.emptyCapacity, 0);
    const totalCapacity = lots.reduce((sum, lot) => sum + lot.capacity, 0);
    return {
      total: lots.length,
      open: openLots.length,
      emptyCapacity,
      occupancy: totalCapacity > 0 ? 1 - emptyCapacity / totalCapacity : 0,
    };
  }, [lots]);

  const displayedLots = visibleLots.slice(0, 3);

  const markLotAsParked = useCallback(async (lot: ParkingLot) => {
    await saveParkedVehicle({
      id: makeVehicleId(),
      source: 'ispark',
      title: lot.name,
      latitude: lot.latitude,
      longitude: lot.longitude,
      addressHint: `${lot.district} - ${lot.type}`,
      lotId: lot.id,
      createdAt: new Date().toISOString(),
    });

    await notifyParkingSaved(lot.name);
    Alert.alert('Park konumu kaydedildi', 'Aracım sekmesinden yürüyüş rotasını açabilirsin.');
  }, []);

  const loadDetail = useCallback(
    async (lot: ParkingLot) => {
      if (detailsById[lot.id]) {
        return;
      }

      setDetailLoadingId(lot.id);
      try {
        const detail = await fetchParkingDetail(lot.id);
        if (detail) {
          setDetailsById((current) => ({ ...current, [lot.id]: detail }));
        }
      } catch (detailError) {
        Alert.alert(
          'Fiyat bilgisi alınamadı',
          detailError instanceof Error ? detailError.message : 'İSPARK detay servisi yanıt vermedi.'
        );
      } finally {
        setDetailLoadingId(null);
      }
    },
    [detailsById]
  );

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
      contentContainerStyle={styles.content}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.eyebrow}>En yakın 3 İSPARK</ThemedText>
            <ThemedText type="title" style={styles.title}>
              Parket!
            </ThemedText>
          </View>
        </View>

        <View style={styles.heroPanel}>
          <View style={styles.heroText}>
            <ThemedText type="subtitle" style={styles.heroTitle}>
              Sana en yakın otoparklar
            </ThemedText>
            <ThemedText style={styles.heroCopy}>
              Bütün İstanbul listesini dökmek yerine konumuna göre en yakın 3 otoparkın doluluk,
              çalışma saati ve fiyat detayını gösterir.
            </ThemedText>
          </View>
          <Pressable style={styles.primaryButton} onPress={locate}>
            <ThemedText type="smallBold" style={styles.primaryButtonText}>
              Konumuma göre sırala
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Otopark" value={stats.total.toString()} accent={ParkingPalette.blue} />
          <StatCard label="Açık" value={stats.open.toString()} accent={ParkingPalette.success} />
          <StatCard
            label="Boş kapasite"
            value={stats.emptyCapacity.toLocaleString('tr-TR')}
            accent={ParkingPalette.amber}
          />
          <StatCard
            label="Doluluk"
            value={formatPercent(stats.occupancy)}
            accent={ParkingPalette.coral}
          />
        </View>

        <View style={styles.searchPanel}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Otopark, ilçe veya tip ara"
            placeholderTextColor="#7a8790"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {filters.map((item) => (
              <Pressable
                key={item.key}
                style={[styles.filterButton, filter === item.key && styles.filterButtonActive]}
                onPress={() => {
                  setFilter(item.key);
                  if (item.key === 'nearby' && !currentLocation) {
                    void locate();
                  }
                }}>
                <ThemedText
                  type="smallBold"
                  style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
                  {item.label}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <Pressable
          style={[styles.streetButton, showStreetReports && styles.streetButtonActive]}
          onPress={() => setShowStreetReports((value) => !value)}>
          <View>
            <ThemedText type="smallBold" style={styles.streetTitle}>
              Sokakta park yeri arıyorum
            </ThemedText>
            <ThemedText type="small" style={styles.streetText}>
              Yakındaki kullanıcıların yanımda boş yer var bildirimlerini göster.
            </ThemedText>
          </View>
          <ThemedText type="smallBold" style={styles.streetCount}>
            {reports.length}
          </ThemedText>
        </Pressable>

        <View style={styles.mapPanel}>
          <ParkingMap
            lots={displayedLots}
            reports={showStreetReports ? reports : []}
            currentLocation={currentLocation}
            onLotPress={markLotAsParked}
          />
        </View>

        {error ? (
          <View style={styles.notice}>
            <ThemedText type="smallBold" style={styles.noticeTitle}>
              Veri alınamadı
            </ThemedText>
            <ThemedText type="small" style={styles.noticeText}>
              {error}
            </ThemedText>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={ParkingPalette.blue} />
            <ThemedText type="small">İSPARK verisi yükleniyor</ThemedText>
          </View>
        ) : (
          <View style={styles.list}>
            {displayedLots.map((lot) => (
              <LotCard
                key={lot.id}
                lot={lot}
                detail={detailsById[lot.id]}
                isDetailLoading={detailLoadingId === lot.id}
                onDetail={() => loadDetail(lot)}
                onPark={() => markLotAsParked(lot)}
                onDirections={() =>
                  openWalkingDirections(
                    { latitude: lot.latitude, longitude: lot.longitude },
                    lot.name
                  )
                }
              />
            ))}
          </View>
        )}
      </SafeAreaView>
    </ScrollView>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statAccent, { backgroundColor: accent }]} />
      <ThemedText type="small" style={styles.statLabel}>
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={styles.statValue}>
        {value}
      </ThemedText>
    </View>
  );
}

function LotCard({
  lot,
  detail,
  isDetailLoading,
  onDetail,
  onPark,
  onDirections,
}: {
  lot: ParkingLot;
  detail?: ParkingLotDetail;
  isDetailLoading: boolean;
  onDetail: () => void;
  onPark: () => void;
  onDirections: () => void;
}) {
  const distance = formatDistance(lot.distanceMeters);
  const tariffLines = detail?.tariff?.split(';').filter(Boolean) ?? [];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <ThemedText type="smallBold" style={styles.cardTitle}>
            {lot.name}
          </ThemedText>
          <ThemedText type="small" style={styles.cardMeta}>
            {lot.district} - {lot.type} {distance ? `- ${distance}` : ''}
          </ThemedText>
        </View>
        <View style={[styles.statusPill, { borderColor: statusColor(lot) }]}>
          <ThemedText type="smallBold" style={[styles.statusText, { color: statusColor(lot) }]}>
            {statusLabel(lot)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.capacityBar}>
        <View style={[styles.capacityFill, { width: `${Math.round(lot.occupancyRate * 100)}%` }]} />
      </View>

      <View style={styles.cardMetrics}>
        <ThemedText type="small">
          <ThemedText type="smallBold">{lot.emptyCapacity}</ThemedText> / {lot.capacity} boş
        </ThemedText>
        <ThemedText type="small">{lot.workHours}</ThemedText>
        <ThemedText type="small">{lot.freeTime} dk ücretsiz</ThemedText>
      </View>

      {detail ? (
        <View style={styles.detailPanel}>
          {detail.address ? (
            <ThemedText type="small" style={styles.detailText}>
              {detail.address}
            </ThemedText>
          ) : null}
          {tariffLines.length > 0 ? (
            <View style={styles.tariffGrid}>
              {tariffLines.slice(0, 6).map((line) => (
                <View key={line} style={styles.tariffItem}>
                  <ThemedText type="small" style={styles.tariffText}>
                    {line.trim()}
                  </ThemedText>
                </View>
              ))}
            </View>
          ) : null}
          {detail.monthlyFee ? (
            <ThemedText type="smallBold" style={styles.detailText}>
              Aylık abonman: {detail.monthlyFee.toLocaleString('tr-TR')} TL
            </ThemedText>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={onDetail}>
          <ThemedText type="smallBold" style={styles.actionText}>
            {isDetailLoading ? 'Yükleniyor' : 'Fiyatı göster'}
          </ThemedText>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.actionPrimary]} onPress={onPark}>
          <ThemedText type="smallBold" style={styles.actionPrimaryText}>
            Buraya park ettim
          </ThemedText>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={onDirections}>
          <ThemedText type="smallBold" style={styles.actionText}>
            Rota
          </ThemedText>
        </Pressable>
      </View>
    </View>
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
    paddingTop: Spacing.two,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  eyebrow: {
    color: ParkingPalette.violet,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: ParkingPalette.ink,
    fontSize: 44,
    lineHeight: 48,
  },
  authPanel: {
    alignItems: 'flex-end',
    gap: Spacing.one,
    maxWidth: 190,
  },
  authTitle: {
    color: ParkingPalette.ink,
  },
  authMessage: {
    color: '#6f7780',
    textAlign: 'right',
  },
  oauthButton: {
    minWidth: 88,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  oauthText: {
    color: ParkingPalette.blue,
  },
  appleButton: {
    backgroundColor: ParkingPalette.ink,
    borderColor: ParkingPalette.ink,
  },
  appleText: {
    color: '#ffffff',
  },
  primaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: ParkingPalette.blue,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  secondaryButton: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: ParkingPalette.coral,
  },
  heroPanel: {
    borderRadius: 8,
    backgroundColor: ParkingPalette.sand,
    padding: Spacing.three,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: '#e3c986',
  },
  heroText: {
    gap: Spacing.one,
  },
  heroTitle: {
    color: ParkingPalette.ink,
    fontSize: 28,
    lineHeight: 34,
  },
  heroCopy: {
    color: '#45525c',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  statCard: {
    minWidth: 134,
    flexGrow: 1,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    padding: Spacing.three,
    gap: 6,
  },
  statAccent: {
    width: 28,
    height: 4,
    borderRadius: 2,
  },
  statLabel: {
    color: '#687783',
  },
  statValue: {
    color: ParkingPalette.ink,
    fontSize: 20,
  },
  searchPanel: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    padding: Spacing.two,
    gap: Spacing.two,
  },
  searchInput: {
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: '#f4f9fc',
    color: ParkingPalette.ink,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  filterRow: {
    gap: Spacing.two,
  },
  filterButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#ffffff',
  },
  filterButtonActive: {
    backgroundColor: ParkingPalette.blue,
    borderColor: ParkingPalette.blue,
  },
  filterText: {
    color: ParkingPalette.ink,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  streetButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d7c0ef',
    backgroundColor: '#fbf8ff',
    padding: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  streetButtonActive: {
    backgroundColor: '#f1eafe',
    borderColor: ParkingPalette.violet,
  },
  streetTitle: {
    color: ParkingPalette.violet,
  },
  streetText: {
    color: '#665f70',
  },
  streetCount: {
    color: ParkingPalette.violet,
    fontSize: 22,
  },
  mapPanel: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  notice: {
    borderRadius: 8,
    backgroundColor: '#fff3ef',
    borderWidth: 1,
    borderColor: '#ffd2c6',
    padding: Spacing.three,
    gap: 4,
  },
  noticeTitle: {
    color: ParkingPalette.coral,
  },
  noticeText: {
    color: '#755045',
  },
  loading: {
    alignItems: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  list: {
    gap: Spacing.three,
  },
  card: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  cardTitleBlock: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: ParkingPalette.ink,
    fontSize: 17,
  },
  cardMeta: {
    color: '#6a7680',
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 13,
  },
  capacityBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e9f2f7',
    overflow: 'hidden',
  },
  capacityFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: ParkingPalette.coral,
  },
  cardMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  detailPanel: {
    borderRadius: 8,
    backgroundColor: '#f6fbfd',
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    padding: Spacing.two,
    gap: Spacing.two,
  },
  detailText: {
    color: '#43515b',
  },
  tariffGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tariffItem: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  tariffText: {
    color: ParkingPalette.ink,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actionButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionPrimary: {
    borderColor: ParkingPalette.blue,
    backgroundColor: ParkingPalette.blue,
  },
  actionText: {
    color: ParkingPalette.ink,
  },
  actionPrimaryText: {
    color: '#ffffff',
  },
});
