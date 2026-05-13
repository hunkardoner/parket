import { StyleSheet, View } from 'react-native';

import { ParkingPalette } from '@/constants/brand';
import { Coordinates, ParkingLot, ParkedVehicle, StreetParkingReport } from '@/types/parking';
import { ThemedText } from '@/components/themed-text';

type ParkingMapProps = {
  lots?: ParkingLot[];
  reports?: StreetParkingReport[];
  currentLocation?: Coordinates | null;
  parkedVehicle?: ParkedVehicle | null;
  onLotPress?: (lot: ParkingLot) => void;
};

export function ParkingMap({
  lots = [],
  reports = [],
  currentLocation,
  parkedVehicle,
}: ParkingMapProps) {
  const availableLots = lots.filter((lot) => lot.status === 'open').slice(0, 6);

  return (
    <View style={styles.mapFallback}>
      <View style={styles.row}>
        <ThemedText type="smallBold" style={styles.title}>
          Harita mobil cihazda açılır
        </ThemedText>
        <ThemedText type="small" style={styles.muted}>
          Web önizlemede konum özeti
        </ThemedText>
      </View>

      <View style={styles.grid}>
        {currentLocation ? (
          <View style={[styles.pin, styles.currentPin]}>
            <ThemedText type="smallBold">Konumun</ThemedText>
          </View>
        ) : null}
        {parkedVehicle ? (
          <View style={[styles.pin, styles.vehiclePin]}>
            <ThemedText type="smallBold">Aracım</ThemedText>
          </View>
        ) : null}
        {availableLots.map((lot) => (
          <View key={lot.id} style={styles.pin}>
            <ThemedText type="smallBold" numberOfLines={1}>
              {lot.district}
            </ThemedText>
            <ThemedText type="small">{lot.emptyCapacity} boş</ThemedText>
          </View>
        ))}
        {reports.slice(0, 4).map((report) => (
          <View key={report.id} style={[styles.pin, styles.reportPin]}>
            <ThemedText type="smallBold">Sokak</ThemedText>
            <ThemedText type="small">Boş yer</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapFallback: {
    minHeight: 260,
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    backgroundColor: '#f7fbfd',
    overflow: 'hidden',
    padding: 16,
    gap: 16,
  },
  row: {
    gap: 4,
  },
  title: {
    color: ParkingPalette.ink,
  },
  muted: {
    color: '#66727c',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pin: {
    width: 108,
    minHeight: 64,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#b9d8eb',
    backgroundColor: '#ffffff',
  },
  currentPin: {
    backgroundColor: ParkingPalette.sand,
    borderColor: ParkingPalette.amber,
  },
  vehiclePin: {
    backgroundColor: '#e7f8ef',
    borderColor: ParkingPalette.success,
  },
  reportPin: {
    backgroundColor: '#f1eafe',
    borderColor: ParkingPalette.violet,
  },
});
