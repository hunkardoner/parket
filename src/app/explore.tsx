import { useCallback, useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
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
import { useAuthSession } from '@/hooks/use-auth-session';
import { openWalkingDirections } from '@/services/directions';
import { formatDistance, distanceInMeters } from '@/services/ispark';
import { loadLastKnownLocation, saveLastKnownLocation } from '@/services/location-store';
import {
  clearParkedVehicle,
  loadParkedVehicle,
  saveParkedVehicle,
} from '@/services/local-store';
import { notifyParkingSaved } from '@/services/notifications';
import { createStreetReport, listStreetReports } from '@/services/street-reports';
import { Coordinates, ParkedVehicle, StreetParkingReport } from '@/types/parking';

function makeVehicleId() {
  return `vehicle-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

async function getCurrentCoordinates() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('Konum izni verilmedi.');
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

async function reverseAddress(coordinates: Coordinates) {
  try {
    const [address] = await Location.reverseGeocodeAsync(coordinates);
    return [address?.district, address?.street, address?.name].filter(Boolean).join(' - ');
  } catch { return undefined; }
}

export default function VehicleScreen() {
  const auth = useAuthSession();
  const [vehicle, setVehicle] = useState<ParkedVehicle | null>(null);
  const [reports, setReports] = useState<StreetParkingReport[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [isBusy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const [storedVehicle, nextReports] = await Promise.all([loadParkedVehicle(), listStreetReports()]);
    setVehicle(storedVehicle);
    setReports(nextReports);
  }, []);

  useEffect(() => {
    loadLastKnownLocation().then((location) => { if (location) setCurrentLocation(location); });
    void reload();
  }, [reload]);

  const startParking = useCallback(async () => {
    setBusy(true);
    try {
      const coordinates = await getCurrentCoordinates();
      await saveLastKnownLocation(coordinates);
      const addressHint = await reverseAddress(coordinates);
      const nextVehicle: ParkedVehicle = {
        id: makeVehicleId(), source: 'street', title: addressHint || 'Sokakta park',
        latitude: coordinates.latitude, longitude: coordinates.longitude,
        addressHint, createdAt: new Date().toISOString(),
      };
      await saveParkedVehicle(nextVehicle);
      await notifyParkingSaved(nextVehicle.title);
      setVehicle(nextVehicle);
      setCurrentLocation(coordinates);
    } catch (error) {
      Alert.alert('Park kaydı başlatılamadı', error instanceof Error ? error.message : 'Konum servisi kullanılamıyor.');
    } finally { setBusy(false); }
  }, []);

  const endParking = useCallback(async () => {
    await clearParkedVehicle();
    setVehicle(null);
  }, []);

  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Kamera izni gerekli', 'Park ettiğin sokağı fotoğraflamak için kamera izni ver.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.72, allowsEditing: false });
    if (result.canceled || !result.assets[0]) return;

    let nextVehicle = vehicle;
    if (!nextVehicle) {
      const coordinates = await getCurrentCoordinates();
      await saveLastKnownLocation(coordinates);
      const addressHint = await reverseAddress(coordinates);
      nextVehicle = {
        id: makeVehicleId(), source: 'street', title: addressHint || 'Sokakta park',
        latitude: coordinates.latitude, longitude: coordinates.longitude,
        addressHint, createdAt: new Date().toISOString(),
      };
    }
    const withPhoto = { ...nextVehicle, photoUri: result.assets[0].uri };
    await saveParkedVehicle(withPhoto);
    setVehicle(withPhoto);
  }, [vehicle]);

  const returnToVehicle = useCallback(async () => {
    if (!vehicle) { Alert.alert('Kayıtlı araç yok', 'Önce Başla ile park konumunu kaydet.'); return; }
    await openWalkingDirections({ latitude: vehicle.latitude, longitude: vehicle.longitude }, vehicle.title);
  }, [vehicle]);

  const reportEmptySpot = useCallback(async () => {
    setBusy(true);
    try {
      const coordinates = await getCurrentCoordinates();
      await saveLastKnownLocation(coordinates);
      setCurrentLocation(coordinates);
      const report = await createStreetReport({
        coordinates, note: 'Yakınımda boş sokak park yeri var.',
        photoUri: vehicle?.photoUri, userId: auth.user?.id,
      });
      setReports((current) => [report, ...current.filter((item) => item.id !== report.id)]);
      Alert.alert('Boş yer bildirildi', 'Bildirim 90 dakika boyunca sokakta park arayanlara görünür.');
    } catch (error) {
      Alert.alert('Bildirim oluşturulamadı', error instanceof Error ? error.message : 'Konum servisi kullanılamıyor.');
    } finally { setBusy(false); }
  }, [auth.user?.id, vehicle?.photoUri]);

  const decoratedReports = currentLocation
    ? reports.map((report) => ({
        ...report,
        distanceMeters: distanceInMeters(currentLocation, { latitude: report.latitude, longitude: report.longitude }),
      }))
    : reports;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SafeAreaView style={styles.safeArea}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <ThemedText type="overline" style={styles.overline}>Park oturumu</ThemedText>
            <ThemedText type="title" style={styles.title}>Aracım</ThemedText>
          </View>
          {isBusy ? <ActivityIndicator color={ParkingPalette.blue} /> : null}
        </View>

        {/* ── Session panel ── */}
        <View style={[styles.sessionCard, Shadows.md]}>
          <View style={styles.sessionInner}>
            <View style={styles.sessionCopy}>
              <ThemedText type="subtitle" style={styles.sessionTitle}>Başla ve bitir</ThemedText>
              <ThemedText style={styles.sessionText}>
                Bulunduğun konumu park noktası olarak işaretle, fotoğraf ekle ve dönüşte yürüyüş rotasını aç.
              </ThemedText>
            </View>
            <View style={styles.sessionActions}>
              <Pressable style={styles.startBtn} onPress={startParking} disabled={isBusy}>
                <ThemedText type="smallBold" style={styles.startBtnText}>▶  Başla</ThemedText>
              </Pressable>
              <Pressable style={styles.stopBtn} onPress={endParking}>
                <ThemedText type="smallBold" style={styles.stopBtnText}>⏹  Bitir</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── Vehicle card ── */}
        <View style={[styles.vehicleCard, Shadows.sm]}>
          {vehicle ? (
            <>
              <View style={styles.vehicleHeader}>
                <View style={styles.vehicleDot} />
                <View style={{ flex: 1, gap: 3 }}>
                  <ThemedText type="smallBold" style={styles.vehicleName}>{vehicle.title}</ThemedText>
                  <ThemedText type="caption" style={styles.vehicleMeta}>
                    {vehicle.source === 'ispark' ? '🅿️ İSPARK otoparkı' : '🚗 Sokak parkı'} ·{' '}
                    {new Date(vehicle.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </ThemedText>
                </View>
              </View>
              {vehicle.photoUri ? (
                <Image source={{ uri: vehicle.photoUri }} style={styles.vehiclePhoto} contentFit="cover" />
              ) : null}
            </>
          ) : (
            <View style={styles.emptyVehicle}>
              <ThemedText style={styles.emptyEmoji}>🚙</ThemedText>
              <ThemedText type="smallBold" style={styles.vehicleName}>Henüz park konumu yok</ThemedText>
              <ThemedText type="caption" style={styles.vehicleMeta}>Başla butonu bulunduğun konumu aracım olarak kaydeder.</ThemedText>
            </View>
          )}

          <View style={styles.vehicleActions}>
            <Pressable style={styles.actionBtn} onPress={takePhoto}>
              <ThemedText type="smallBold" style={styles.actionBtnText}>📷  Fotoğraf çek</ThemedText>
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.actionBtnDark]} onPress={returnToVehicle}>
              <ThemedText type="smallBold" style={styles.actionBtnDarkText}>🧭  Araca geri dön</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* ── Report empty spot ── */}
        <Pressable style={[styles.reportCard, Shadows.sm]} onPress={reportEmptySpot} disabled={isBusy}>
          <View style={styles.reportInner}>
            <View style={styles.reportIcon}>
              <ThemedText style={{ fontSize: 22 }}>🟢</ThemedText>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold" style={styles.reportTitle}>Yanımda boş yer var</ThemedText>
              <ThemedText type="caption" style={styles.reportSub}>90 dk süreyle boş yer sinyali gönder</ThemedText>
            </View>
          </View>
        </Pressable>

        {/* ── Map ── */}
        <View style={styles.mapWrap}>
          <ParkingMap reports={reports} currentLocation={currentLocation} parkedVehicle={vehicle} />
        </View>

        {/* ── Street reports list ── */}
        <View style={[styles.reportsPanel, Shadows.sm]}>
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" style={{ color: ParkingPalette.ink }}>Sokak boş yerleri</ThemedText>
            <View style={styles.reportCountBadge}>
              <ThemedText type="caption" style={{ color: ParkingPalette.violet }}>{reports.length} aktif</ThemedText>
            </View>
          </View>

          {decoratedReports.slice(0, 12).map((report) => {
            const reportDistance = 'distanceMeters' in report && typeof report.distanceMeters === 'number'
              ? report.distanceMeters : undefined;

            return (
              <View key={report.id} style={styles.reportItem}>
                <View style={styles.reportDot} />
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText type="smallBold" style={{ color: ParkingPalette.ink }}>
                    {report.note ?? 'Boş sokak park yeri'}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: ParkingPalette.muted }}>
                    {formatDistance(reportDistance) ?? 'Konum mesafesi için Başla kullan'} ·{' '}
                    {new Date(report.expiresAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} sonuna kadar
                  </ThemedText>
                </View>
                <Pressable
                  style={styles.routeChip}
                  onPress={() => openWalkingDirections({ latitude: report.latitude, longitude: report.longitude }, 'Boş sokak park yeri')}>
                  <ThemedText type="smallBold" style={{ color: ParkingPalette.blue }}>🧭</ThemedText>
                </Pressable>
              </View>
            );
          })}
        </View>

        {auth.message ? (
          <View style={styles.notice}>
            <ThemedText type="small" style={{ color: '#6B5B34' }}>{auth.message}</ThemedText>
          </View>
        ) : null}
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
  header: {
    paddingTop: Spacing.two, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  overline: { color: ParkingPalette.violet },
  title: { color: ParkingPalette.ink },

  /* Session */
  sessionCard: {
    borderRadius: Radius.lg, overflow: 'hidden',
    backgroundColor: ParkingPalette.ink,
  },
  sessionInner: {
    padding: Spacing.four, gap: Spacing.three,
    experimental_backgroundImage: ParkingPalette.gradientViolet,
  },
  sessionCopy: { gap: 6 },
  sessionTitle: { color: '#FFFFFF' },
  sessionText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20 },
  sessionActions: { flexDirection: 'row', gap: Spacing.two },
  startBtn: {
    borderRadius: Radius.full, backgroundColor: '#FFFFFF',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  startBtnText: { color: ParkingPalette.violet },
  stopBtn: {
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  stopBtnText: { color: '#FFFFFF' },

  /* Vehicle */
  vehicleCard: {
    borderRadius: Radius.md, backgroundColor: ParkingPalette.surface,
    padding: Spacing.three, gap: Spacing.three,
  },
  vehicleHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  vehicleDot: {
    width: 10, height: 40, borderRadius: 5,
    backgroundColor: ParkingPalette.success,
  },
  vehicleName: { color: ParkingPalette.ink, fontSize: 16 },
  vehicleMeta: { color: ParkingPalette.muted },
  vehiclePhoto: {
    width: '100%', aspectRatio: 16 / 10,
    borderRadius: Radius.sm, backgroundColor: '#EDF2F7',
  },
  emptyVehicle: { alignItems: 'center', paddingVertical: Spacing.four, gap: 8 },
  emptyEmoji: { fontSize: 42 },
  vehicleActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  actionBtn: {
    borderRadius: Radius.sm, borderWidth: 1.5, borderColor: ParkingPalette.lineSoft,
    backgroundColor: ParkingPalette.surface,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  actionBtnText: { color: ParkingPalette.ink },
  actionBtnDark: {
    backgroundColor: ParkingPalette.ink, borderColor: ParkingPalette.ink,
  },
  actionBtnDarkText: { color: '#FFFFFF' },

  /* Report */
  reportCard: {
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: ParkingPalette.successLight,
    backgroundColor: '#F0FDF7', padding: Spacing.three,
  },
  reportInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reportIcon: {
    width: 44, height: 44, borderRadius: Radius.sm,
    backgroundColor: ParkingPalette.successLight,
    alignItems: 'center', justifyContent: 'center',
  },
  reportTitle: { color: ParkingPalette.ink },
  reportSub: { color: ParkingPalette.muted, marginTop: 2 },

  /* Map */
  mapWrap: { borderRadius: Radius.md, overflow: 'hidden', ...Shadows.md },

  /* Reports list */
  reportsPanel: {
    borderRadius: Radius.md, backgroundColor: ParkingPalette.surface,
    padding: Spacing.three, gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  reportCountBadge: {
    borderRadius: Radius.full, backgroundColor: ParkingPalette.violetLight,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  reportItem: {
    flexDirection: 'row', gap: 12, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: ParkingPalette.lineSoft, paddingTop: Spacing.two,
  },
  reportDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: ParkingPalette.violet,
  },
  routeChip: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: '#EBF5FF', alignItems: 'center', justifyContent: 'center',
  },

  /* Notice */
  notice: {
    borderRadius: Radius.sm, backgroundColor: ParkingPalette.amberLight,
    borderWidth: 1, borderColor: ParkingPalette.amber,
    padding: Spacing.two,
  },
});
