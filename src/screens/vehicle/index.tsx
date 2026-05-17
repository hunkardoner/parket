import {
  useCallback,
  useEffect,
  useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { activityIndicatorColor, styles } from './style';

import { ParkingMap } from '@/components/parking-map';
import { ThemedText } from '@/components/themed-text';
import { useAuthSession } from '@/hooks/use-auth-session';
import { openInAppMap } from '@/services/directions';
import { formatDistance, distanceInMeters } from '@/services/ispark';
import { loadLastKnownLocation, saveLastKnownLocation } from '@/services/location-store';
import {
  clearParkedVehicle,
  loadParkedVehicle,
  saveParkedVehicle,
} from '@/services/local-store';
import { notifyParkingSaved } from '@/services/notifications';
import { createStreetReport, listStreetReports } from '@/services/street-reports';
import { addToHistory, endHistorySession } from '@/services/parking-history';
import { askNearbyFreeSpot } from '@/services/nearby-prompt';
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
  const router = useRouter();
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
      // Save to history
      if (auth.user?.id) await addToHistory(nextVehicle, auth.user.id);
      setVehicle(nextVehicle);
      setCurrentLocation(coordinates);
      // Ask about nearby free spots, then navigate
      askNearbyFreeSpot(coordinates, auth.user?.id, () => {
        router.push('/vehicle-active');
      });
    } catch (error) {
      Alert.alert('Park kaydı başlatılamadı', error instanceof Error ? error.message : 'Konum servisi kullanılamıyor.');
    } finally { setBusy(false); }
  }, [auth.user?.id, router]);

  const endParking = useCallback(async () => {
    if (vehicle?.id) await endHistorySession(vehicle.id);
    await clearParkedVehicle();
    setVehicle(null);
  }, [vehicle?.id]);

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
    router.push('/vehicle-active');
  }, [router, vehicle]);

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
          {isBusy ? <ActivityIndicator color={activityIndicatorColor} /> : null}
        </View>

        {/* ── Session panel ── */}
        <View style={[styles.sessionCard, styles.shadowMd]}>
          <View style={styles.sessionInner}>
            <View style={styles.sessionCopy}>
              <ThemedText type="subtitle" style={styles.sessionTitle}>Başla ve bitir</ThemedText>
              <ThemedText style={styles.sessionText}>
                Bulunduğun konumu park noktası olarak işaretle, fotoğraf ekle ve dönüşte uygulama içi haritada bul.
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
        <View style={[styles.vehicleCard, styles.shadowSm]}>
          {vehicle ? (
            <>
              <View style={styles.vehicleHeader}>
                <View style={styles.vehicleDot} />
                <View style={styles.vehicleInfo}>
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
            {vehicle ? (
              <Pressable style={[styles.actionBtn, styles.actionBtnMap]} onPress={() => router.push('/vehicle-active')}>
                <ThemedText type="smallBold" style={styles.actionBtnMapText}>🗺  Haritada gör</ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* ── Report empty spot ── */}
        <Pressable style={[styles.reportCard, styles.shadowSm]} onPress={reportEmptySpot} disabled={isBusy}>
          <View style={styles.reportInner}>
            <View style={styles.reportIcon}>
              <ThemedText style={styles.reportEmoji}>🟢</ThemedText>
            </View>
            <View style={styles.reportCopy}>
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
        <View style={[styles.reportsPanel, styles.shadowSm]}>
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>Sokak boş yerleri</ThemedText>
            <View style={styles.reportCountBadge}>
              <ThemedText type="caption" style={styles.reportCountText}>{reports.length} aktif</ThemedText>
            </View>
          </View>

          {decoratedReports.slice(0, 12).map((report) => {
            const reportDistance = 'distanceMeters' in report && typeof report.distanceMeters === 'number'
              ? report.distanceMeters : undefined;

            return (
              <View key={report.id} style={styles.reportItem}>
                <View style={styles.reportDot} />
                <View style={styles.reportItemCopy}>
                  <ThemedText type="smallBold" style={styles.reportItemTitle}>
                    {report.note ?? 'Boş sokak park yeri'}
                  </ThemedText>
                  <ThemedText type="caption" style={styles.reportItemMeta}>
                    {formatDistance(reportDistance) ?? 'Konum mesafesi için Başla kullan'} ·{' '}
                    {new Date(report.expiresAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} sonuna kadar
                  </ThemedText>
                </View>
                <Pressable
                  style={styles.routeChip}
                  onPress={() => openInAppMap({ latitude: report.latitude, longitude: report.longitude }, 'Boş sokak park yeri')}>
                  <ThemedText type="smallBold" style={styles.routeIconText}>🧭</ThemedText>
                </Pressable>
              </View>
            );
          })}
        </View>

        {auth.message ? (
          <View style={styles.notice}>
            <ThemedText type="small" style={styles.noticeText}>{auth.message}</ThemedText>
          </View>
        ) : null}
      </SafeAreaView>
    </ScrollView>
  );
}
