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
import { ParkingPalette } from '@/constants/brand';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
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
  if (permission.status !== 'granted') {
    throw new Error('Konum izni verilmedi.');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

async function reverseAddress(coordinates: Coordinates) {
  try {
    const [address] = await Location.reverseGeocodeAsync(coordinates);
    return [address?.district, address?.street, address?.name].filter(Boolean).join(' - ');
  } catch {
    return undefined;
  }
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
    loadLastKnownLocation().then((location) => {
      if (location) {
        setCurrentLocation(location);
      }
    });
    void reload();
  }, [reload]);

  const startParking = useCallback(async () => {
    setBusy(true);
    try {
      const coordinates = await getCurrentCoordinates();
      await saveLastKnownLocation(coordinates);
      const addressHint = await reverseAddress(coordinates);
      const nextVehicle: ParkedVehicle = {
        id: makeVehicleId(),
        source: 'street',
        title: addressHint || 'Sokakta park',
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        addressHint,
        createdAt: new Date().toISOString(),
      };

      await saveParkedVehicle(nextVehicle);
      await notifyParkingSaved(nextVehicle.title);
      setVehicle(nextVehicle);
      setCurrentLocation(coordinates);
    } catch (error) {
      Alert.alert(
        'Park kaydı başlatılamadı',
        error instanceof Error ? error.message : 'Konum servisi kullanılamıyor.'
      );
    } finally {
      setBusy(false);
    }
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

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.72,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    let nextVehicle = vehicle;
    if (!nextVehicle) {
      const coordinates = await getCurrentCoordinates();
      await saveLastKnownLocation(coordinates);
      const addressHint = await reverseAddress(coordinates);
      nextVehicle = {
        id: makeVehicleId(),
        source: 'street',
        title: addressHint || 'Sokakta park',
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        addressHint,
        createdAt: new Date().toISOString(),
      };
    }

    const withPhoto = { ...nextVehicle, photoUri: result.assets[0].uri };
    await saveParkedVehicle(withPhoto);
    setVehicle(withPhoto);
  }, [vehicle]);

  const returnToVehicle = useCallback(async () => {
    if (!vehicle) {
      Alert.alert('Kayıtlı araç yok', 'Önce Başla ile park konumunu kaydet.');
      return;
    }
    await openWalkingDirections(
      { latitude: vehicle.latitude, longitude: vehicle.longitude },
      vehicle.title
    );
  }, [vehicle]);

  const reportEmptySpot = useCallback(async () => {
    setBusy(true);
    try {
      const coordinates = await getCurrentCoordinates();
      await saveLastKnownLocation(coordinates);
      setCurrentLocation(coordinates);
      const report = await createStreetReport({
        coordinates,
        note: 'Yakınımda boş sokak park yeri var.',
        photoUri: vehicle?.photoUri,
        userId: auth.user?.id,
      });

      setReports((current) => [report, ...current.filter((item) => item.id !== report.id)]);
      Alert.alert('Boş yer bildirildi', 'Bildirim 90 dakika boyunca sokakta park arayanlara görünür.');
    } catch (error) {
      Alert.alert(
        'Bildirim oluşturulamadı',
        error instanceof Error ? error.message : 'Konum servisi kullanılamıyor.'
      );
    } finally {
      setBusy(false);
    }
  }, [auth.user?.id, vehicle?.photoUri]);

  const decoratedReports = currentLocation
    ? reports.map((report) => ({
        ...report,
        distanceMeters: distanceInMeters(currentLocation, {
          latitude: report.latitude,
          longitude: report.longitude,
        }),
      }))
    : reports;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.eyebrow}>Park oturumu</ThemedText>
            <ThemedText type="title" style={styles.title}>
              Aracım
            </ThemedText>
          </View>
          {isBusy ? <ActivityIndicator color={ParkingPalette.blue} /> : null}
        </View>

        <View style={styles.sessionPanel}>
          <View style={styles.sessionCopy}>
            <ThemedText type="subtitle" style={styles.sessionTitle}>
              Başla ve bitir
            </ThemedText>
            <ThemedText style={styles.sessionText}>
              Bulunduğun konumu park noktası olarak işaretle, fotoğraf ekle ve dönüşte yürüyüş
              rotasını aç.
            </ThemedText>
          </View>
          <View style={styles.sessionActions}>
            <Pressable style={styles.primaryButton} onPress={startParking} disabled={isBusy}>
              <ThemedText type="smallBold" style={styles.primaryButtonText}>
                Başla
              </ThemedText>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={endParking}>
              <ThemedText type="smallBold" style={styles.secondaryButtonText}>
                Bitir
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.vehicleCard}>
          {vehicle ? (
            <>
              <View style={styles.vehicleHeader}>
                <View style={styles.vehicleStatus} />
                <View style={styles.vehicleTitleBlock}>
                  <ThemedText type="smallBold" style={styles.vehicleTitle}>
                    {vehicle.title}
                  </ThemedText>
                  <ThemedText type="small" style={styles.vehicleMeta}>
                    {vehicle.source === 'ispark' ? 'İSPARK otoparkı' : 'Sokak parkı'} -{' '}
                    {new Date(vehicle.createdAt).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </ThemedText>
                </View>
              </View>
              {vehicle.photoUri ? (
                <Image source={{ uri: vehicle.photoUri }} style={styles.vehiclePhoto} contentFit="cover" />
              ) : null}
            </>
          ) : (
            <View style={styles.emptyVehicle}>
              <ThemedText type="smallBold" style={styles.vehicleTitle}>
                Henüz park konumu yok
              </ThemedText>
              <ThemedText type="small" style={styles.vehicleMeta}>
                Başla butonu bulunduğun konumu aracım olarak kaydeder.
              </ThemedText>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable style={styles.actionButton} onPress={takePhoto}>
              <ThemedText type="smallBold" style={styles.actionText}>
                Fotoğraf çek
              </ThemedText>
            </Pressable>
            <Pressable style={[styles.actionButton, styles.actionPrimary]} onPress={returnToVehicle}>
              <ThemedText type="smallBold" style={styles.actionPrimaryText}>
                Araca geri dön
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.reportButton} onPress={reportEmptySpot} disabled={isBusy}>
          <View>
            <ThemedText type="smallBold" style={styles.reportTitle}>
              Yanımda boş yer var
            </ThemedText>
            <ThemedText type="small" style={styles.reportText}>
              Sokakta park arayanlara 90 dakikalık boş yer sinyali gönder.
            </ThemedText>
          </View>
        </Pressable>

        <ParkingMap reports={reports} currentLocation={currentLocation} parkedVehicle={vehicle} />

        <View style={styles.reportsPanel}>
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              Sokak boş yerleri
            </ThemedText>
            <ThemedText type="small" style={styles.sectionMeta}>
              {reports.length} aktif bildirim
            </ThemedText>
          </View>

          {decoratedReports.slice(0, 12).map((report) => {
            const reportDistance =
              'distanceMeters' in report && typeof report.distanceMeters === 'number'
                ? report.distanceMeters
                : undefined;

            return (
              <View key={report.id} style={styles.reportItem}>
                <View style={styles.reportDot} />
                <View style={styles.reportBody}>
                  <ThemedText type="smallBold" style={styles.reportItemTitle}>
                    {report.note ?? 'Boş sokak park yeri'}
                  </ThemedText>
                  <ThemedText type="small" style={styles.reportItemMeta}>
                    {formatDistance(reportDistance) ?? 'Konum mesafesi için Başla kullan'} -{' '}
                    {new Date(report.expiresAt).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    sonuna kadar
                  </ThemedText>
                </View>
                <Pressable
                  style={styles.routeMini}
                  onPress={() =>
                    openWalkingDirections(
                      { latitude: report.latitude, longitude: report.longitude },
                      'Boş sokak park yeri'
                    )
                  }>
                  <ThemedText type="smallBold" style={styles.routeMiniText}>
                    Rota
                  </ThemedText>
                </Pressable>
              </View>
            );
          })}
        </View>

        {auth.message ? (
          <View style={styles.notice}>
            <ThemedText type="small" style={styles.noticeText}>
              {auth.message}
            </ThemedText>
          </View>
        ) : null}
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
    paddingTop: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  sessionPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d7c0ef',
    backgroundColor: '#fbf8ff',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  sessionCopy: {
    gap: Spacing.one,
  },
  sessionTitle: {
    color: ParkingPalette.ink,
    fontSize: 28,
    lineHeight: 34,
  },
  sessionText: {
    color: '#4d5963',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: ParkingPalette.blue,
    paddingHorizontal: 20,
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: ParkingPalette.ink,
  },
  vehicleCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    backgroundColor: '#ffffff',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  vehicleHeader: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  vehicleStatus: {
    width: 12,
    height: 42,
    borderRadius: 6,
    backgroundColor: ParkingPalette.success,
  },
  vehicleTitleBlock: {
    flex: 1,
    gap: 4,
  },
  vehicleTitle: {
    color: ParkingPalette.ink,
    fontSize: 18,
  },
  vehicleMeta: {
    color: '#687783',
  },
  vehiclePhoto: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 8,
    backgroundColor: '#eef3f6',
  },
  emptyVehicle: {
    gap: Spacing.one,
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
    backgroundColor: ParkingPalette.ink,
    borderColor: ParkingPalette.ink,
  },
  actionText: {
    color: ParkingPalette.ink,
  },
  actionPrimaryText: {
    color: '#ffffff',
  },
  reportButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0c9bf',
    backgroundColor: '#fff6f3',
    padding: Spacing.three,
  },
  reportTitle: {
    color: ParkingPalette.coral,
  },
  reportText: {
    color: '#70524a',
  },
  reportsPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    backgroundColor: '#ffffff',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  sectionTitle: {
    color: ParkingPalette.ink,
  },
  sectionMeta: {
    color: '#687783',
  },
  reportItem: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#edf2f5',
    paddingTop: Spacing.two,
  },
  reportDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ParkingPalette.violet,
  },
  reportBody: {
    flex: 1,
    gap: 2,
  },
  reportItemTitle: {
    color: ParkingPalette.ink,
  },
  reportItemMeta: {
    color: '#687783',
  },
  routeMini: {
    borderRadius: 8,
    backgroundColor: '#edf6fb',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  routeMiniText: {
    color: ParkingPalette.blue,
  },
  notice: {
    borderRadius: 8,
    backgroundColor: '#fff8e9',
    borderWidth: 1,
    borderColor: '#f1d596',
    padding: Spacing.two,
  },
  noticeText: {
    color: '#6b5b34',
  },
});
