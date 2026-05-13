import {
  useCallback,
  useEffect,
  useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  activityIndicatorColor,
  getOccupancyFillStyle,
  inputPlaceholderColor,
  styles,
} from './style';

import { ThemedText } from '@/components/themed-text';
import { useAuthSession } from '@/hooks/use-auth-session';
import {
  CustomParkingLot,
  getManagerLot,
  updateLotCapacity,
  updateLotPricing,
} from '@/services/custom-parking';

export default function ManagerScreen() {
  const auth = useAuthSession();
  const [lot, setLot] = useState<CustomParkingLot | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);

  // Pricing form state
  const [hourlyRate, setHourlyRate] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('');
  const [tariffText, setTariffText] = useState('');
  const [freeMinutes, setFreeMinutes] = useState('');

  const loadLot = useCallback(async () => {
    if (!auth.user?.id) return;
    setLoading(true);
    const data = await getManagerLot(auth.user.id);
    if (data) {
      setLot(data);
      setHourlyRate(data.hourlyRate?.toString() ?? '');
      setDailyRate(data.dailyRate?.toString() ?? '');
      setMonthlyRate(data.monthlyRate?.toString() ?? '');
      setTariffText(data.tariffText ?? '');
      setFreeMinutes(data.freeMinutes?.toString() ?? '0');
    }
    setLoading(false);
  }, [auth.user?.id]);

  useEffect(() => { void loadLot(); }, [loadLot]);

  const adjustCapacity = useCallback(async (delta: number) => {
    if (!lot) return;
    const next = Math.max(0, Math.min(lot.capacity, lot.emptyCapacity + delta));
    setLot({ ...lot, emptyCapacity: next });
    await updateLotCapacity(lot.id, next);
  }, [lot]);

  const savePricing = useCallback(async () => {
    if (!lot) return;
    setSaving(true);
    await updateLotPricing(lot.id, {
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      dailyRate: dailyRate ? parseFloat(dailyRate) : undefined,
      monthlyRate: monthlyRate ? parseFloat(monthlyRate) : undefined,
      tariffText: tariffText || undefined,
      freeMinutes: freeMinutes ? parseInt(freeMinutes, 10) : 0,
    });
    setSaving(false);
    Alert.alert('Kaydedildi', 'Fiyat bilgileri güncellendi.');
  }, [lot, hourlyRate, dailyRate, monthlyRate, tariffText, freeMinutes]);

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={activityIndicatorColor} size="large" />
        <ThemedText type="small" style={styles.loadingText}>Yükleniyor…</ThemedText>
      </View>
    );
  }

  if (!lot) {
    return (
      <View style={styles.loadingWrap}>
        <ThemedText style={styles.emptyIcon}>🚫</ThemedText>
        <ThemedText type="subtitle" style={styles.emptyTitle}>
          Yönetici paneli
        </ThemedText>
        <ThemedText style={styles.emptyText}>
          Bu hesaba atanmış bir otopark bulunamadı. Lütfen sistem yöneticinize başvurun.
        </ThemedText>
      </View>
    );
  }

  const occupancy = lot.capacity > 0 ? ((lot.capacity - lot.emptyCapacity) / lot.capacity) * 100 : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerInner}>
            <ThemedText type="overline" style={styles.headerOverline}>Otopark yönetici paneli</ThemedText>
            <ThemedText type="title" style={styles.headerTitle}>{lot.name}</ThemedText>
            <ThemedText style={styles.headerSub}>
              {lot.address ?? lot.district ?? 'Konum bilgisi yok'} · Toplam {lot.capacity} araçlık
            </ThemedText>
          </View>
        </View>

        {/* ── Capacity management ── */}
        <View style={[styles.card, styles.shadowMd]}>
          <ThemedText type="subtitle" style={styles.cardTitle}>Kapasite Yönetimi</ThemedText>

          {/* Current status */}
          <View style={styles.capacityDisplay}>
            <View style={styles.capacityStat}>
              <ThemedText type="caption" style={styles.capacityLabel}>Boş</ThemedText>
              <ThemedText type="title" style={styles.capacityFreeValue}>
                {lot.emptyCapacity}
              </ThemedText>
            </View>
            <View style={styles.capacityDivider} />
            <View style={styles.capacityStat}>
              <ThemedText type="caption" style={styles.capacityLabel}>Dolu</ThemedText>
              <ThemedText type="title" style={styles.capacityOccupiedValue}>
                {lot.capacity - lot.emptyCapacity}
              </ThemedText>
            </View>
            <View style={styles.capacityDivider} />
            <View style={styles.capacityStat}>
              <ThemedText type="caption" style={styles.capacityLabel}>Doluluk</ThemedText>
              <ThemedText type="title" style={styles.capacityOccupancyValue}>
                %{Math.round(occupancy)}
              </ThemedText>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.barTrack}>
            <View style={[styles.barFill, getOccupancyFillStyle(occupancy)]} />
          </View>

          {/* +/- Buttons */}
          <View style={styles.buttonRow}>
            <Pressable style={styles.minusBtn} onPress={() => adjustCapacity(-1)}>
              <ThemedText style={styles.minusBtnText}>−</ThemedText>
            </Pressable>
            <View style={styles.capacityCenter}>
              <ThemedText type="caption" style={styles.capacityLabel}>Araç girdi / çıktı</ThemedText>
            </View>
            <Pressable style={styles.plusBtn} onPress={() => adjustCapacity(1)}>
              <ThemedText style={styles.plusBtnText}>+</ThemedText>
            </Pressable>
          </View>

          {/* Bulk buttons */}
          <View style={styles.bulkRow}>
            <Pressable style={styles.bulkBtn} onPress={() => adjustCapacity(-5)}>
              <ThemedText type="smallBold" style={styles.bulkBtnText}>−5</ThemedText>
            </Pressable>
            <Pressable style={styles.bulkBtn} onPress={() => adjustCapacity(-10)}>
              <ThemedText type="smallBold" style={styles.bulkBtnText}>−10</ThemedText>
            </Pressable>
            <Pressable style={styles.bulkBtn} onPress={() => adjustCapacity(5)}>
              <ThemedText type="smallBold" style={styles.bulkBtnTextGreen}>+5</ThemedText>
            </Pressable>
            <Pressable style={styles.bulkBtn} onPress={() => adjustCapacity(10)}>
              <ThemedText type="smallBold" style={styles.bulkBtnTextGreen}>+10</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* ── Pricing management ── */}
        <View style={[styles.card, styles.shadowSm]}>
          <ThemedText type="subtitle" style={styles.cardTitle}>Fiyat Listesi</ThemedText>

          <View style={styles.formRow}>
            <View style={styles.formField}>
              <ThemedText type="caption" style={styles.formLabel}>Saatlik (₺)</ThemedText>
              <TextInput style={styles.input} value={hourlyRate} onChangeText={setHourlyRate}
                keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={inputPlaceholderColor} />
            </View>
            <View style={styles.formField}>
              <ThemedText type="caption" style={styles.formLabel}>Günlük (₺)</ThemedText>
              <TextInput style={styles.input} value={dailyRate} onChangeText={setDailyRate}
                keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={inputPlaceholderColor} />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formField}>
              <ThemedText type="caption" style={styles.formLabel}>Aylık (₺)</ThemedText>
              <TextInput style={styles.input} value={monthlyRate} onChangeText={setMonthlyRate}
                keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={inputPlaceholderColor} />
            </View>
            <View style={styles.formField}>
              <ThemedText type="caption" style={styles.formLabel}>Ücretsiz (dk)</ThemedText>
              <TextInput style={styles.input} value={freeMinutes} onChangeText={setFreeMinutes}
                keyboardType="number-pad" placeholder="0" placeholderTextColor={inputPlaceholderColor} />
            </View>
          </View>

          <View style={styles.tariffField}>
            <ThemedText type="caption" style={styles.formLabel}>Tarife detay</ThemedText>
            <TextInput style={[styles.input, styles.inputMultiline]} value={tariffText} onChangeText={setTariffText}
              multiline numberOfLines={3} placeholder="Tarife açıklaması…" placeholderTextColor={inputPlaceholderColor} />
          </View>

          <Pressable style={styles.saveBtn} onPress={savePricing} disabled={isSaving}>
            <ThemedText type="smallBold" style={styles.saveBtnText}>
              {isSaving ? '⏳ Kaydediliyor…' : '💾 Fiyat listesini kaydet'}
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}
