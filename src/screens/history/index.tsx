import {
  useCallback,
  useEffect,
  useMemo,
  useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { activityIndicatorColor, styles } from './style';

import { ThemedText } from '@/components/themed-text';
import { useAuthSession } from '@/hooks/use-auth-session';
import { openWalkingDirections } from '@/services/directions';
import {
  deleteHistoryEntry,
  listHistory,
  ParkingHistoryEntry,
  toggleFavorite,
} from '@/services/parking-history';

type FilterMode = 'all' | 'favorites';

export default function HistoryScreen() {
  const auth = useAuthSession();
  const [entries, setEntries] = useState<ParkingHistoryEntry[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');

  const load = useCallback(async () => {
    if (!auth.user?.id) return;
    setLoading(true);
    const data = await listHistory(auth.user.id, 100);
    setEntries(data);
    setLoading(false);
  }, [auth.user?.id]);

  useEffect(() => { void load(); }, [load]);

  const handleToggleFav = useCallback(async (entry: ParkingHistoryEntry) => {
    const next = !entry.isFavorite;
    await toggleFavorite(entry.id, next);
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, isFavorite: next } : e))
    );
  }, []);

  const handleDelete = useCallback(async (entry: ParkingHistoryEntry) => {
    await deleteHistoryEntry(entry.id);
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
  }, []);

  const displayed = useMemo(() => {
    if (filter === 'favorites') return entries.filter((e) => e.isFavorite);
    return entries;
  }, [entries, filter]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="overline" style={styles.overline}>Park geçmişi</ThemedText>
          <ThemedText type="title" style={styles.title}>Geçmiş</ThemedText>
        </View>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          <Pressable
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}>
            <ThemedText type="smallBold" style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              📋  Tümü ({entries.length})
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.filterChip, filter === 'favorites' && styles.filterChipActive]}
            onPress={() => setFilter('favorites')}>
            <ThemedText type="smallBold" style={[styles.filterText, filter === 'favorites' && styles.filterTextActive]}>
              ⭐  Favoriler ({entries.filter((e) => e.isFavorite).length})
            </ThemedText>
          </Pressable>
        </View>

        {/* Loading */}
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={activityIndicatorColor} size="large" />
          </View>
        ) : null}

        {/* Empty state */}
        {!isLoading && displayed.length === 0 ? (
          <View style={styles.emptyCard}>
            <ThemedText style={styles.emptyEmoji}>🚗</ThemedText>
            <ThemedText type="smallBold" style={styles.emptyTitle}>
              {filter === 'favorites' ? 'Henüz favori yok' : 'Henüz park geçmişi yok'}
            </ThemedText>
            <ThemedText type="caption" style={styles.emptyText}>
              {filter === 'favorites'
                ? 'Park ettiğin yerleri favorilere ekleyerek hızla ulaşabilirsin.'
                : 'Park ettiğinde burada geçmiş kayıtların görünür.'}
            </ThemedText>
          </View>
        ) : null}

        {/* History list */}
        <View style={styles.list}>
          {displayed.map((entry) => (
            <View key={entry.id} style={[styles.card, styles.shadowSm]}>
              <View style={styles.cardHeader}>
                <View style={[styles.sourceBadge, entry.source === 'ispark' && styles.sourceBadgeIspark]}>
                <ThemedText type="caption" style={styles.sourceBadgeText}>
                  {entry.source === 'ispark' ? '🅿️ İSPARK' : entry.source === 'custom' ? '🏬 Özel' : '🚗 Sokak'}
                </ThemedText>
              </View>
                <ThemedText type="caption" style={styles.entryDate}>
                  {new Date(entry.parkedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {' · '}
                  {new Date(entry.parkedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </ThemedText>
              </View>

              <ThemedText type="smallBold" style={styles.entryTitle}>
                {entry.title}
              </ThemedText>
              {entry.addressHint ? (
                <ThemedText type="caption" style={styles.entryAddress}>
                  {entry.addressHint}
                </ThemedText>
              ) : null}

              {entry.endedAt ? (
                <ThemedText type="caption" style={styles.entryComplete}>
                  ✅ Tamamlandı · {new Date(entry.endedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </ThemedText>
              ) : (
                <ThemedText type="caption" style={styles.entryOngoing}>
                  🔶 Devam ediyor
                </ThemedText>
              )}

              <View style={styles.cardActions}>
                <Pressable style={styles.favBtn} onPress={() => handleToggleFav(entry)}>
                  <ThemedText style={styles.favIcon}>{entry.isFavorite ? '⭐' : '☆'}</ThemedText>
                </Pressable>
                <Pressable
                  style={styles.routeBtn}
                  onPress={() => openWalkingDirections({ latitude: entry.latitude, longitude: entry.longitude }, entry.title)}>
                  <ThemedText type="smallBold" style={styles.routeBtnText}>🧭 Rota aç</ThemedText>
                </Pressable>
                <Pressable style={styles.deleteBtn} onPress={() => handleDelete(entry)}>
                  <ThemedText type="caption" style={styles.deleteIcon}>🗑</ThemedText>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}
