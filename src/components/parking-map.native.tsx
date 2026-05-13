import MapView, { Marker } from 'react-native-maps';
import { StyleSheet } from 'react-native';

import { IstanbulCenter, ParkingPalette } from '@/constants/brand';
import { Coordinates, ParkingLot, ParkedVehicle, StreetParkingReport } from '@/types/parking';

type ParkingMapProps = {
  lots?: ParkingLot[];
  reports?: StreetParkingReport[];
  currentLocation?: Coordinates | null;
  parkedVehicle?: ParkedVehicle | null;
  onLotPress?: (lot: ParkingLot) => void;
};

function colorForLot(lot: ParkingLot) {
  if (lot.status === 'closed') {
    return '#6f7780';
  }
  if (lot.status === 'full') {
    return ParkingPalette.coral;
  }
  if (lot.status === 'limited') {
    return ParkingPalette.amber;
  }
  return ParkingPalette.blue;
}

export function ParkingMap({
  lots = [],
  reports = [],
  currentLocation,
  parkedVehicle,
  onLotPress,
}: ParkingMapProps) {
  const initialRegion = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }
    : IstanbulCenter;

  return (
    <MapView style={styles.map} initialRegion={initialRegion} showsUserLocation>
      {lots.slice(0, 80).map((lot) => (
        <Marker
          key={`lot-${lot.id}`}
          coordinate={{ latitude: lot.latitude, longitude: lot.longitude }}
          pinColor={colorForLot(lot)}
          title={lot.name}
          description={`${lot.emptyCapacity}/${lot.capacity} boş - ${lot.workHours}`}
          onPress={() => onLotPress?.(lot)}
        />
      ))}

      {reports.map((report) => (
        <Marker
          key={`report-${report.id}`}
          coordinate={{ latitude: report.latitude, longitude: report.longitude }}
          pinColor={ParkingPalette.violet}
          title="Yanımda boş yer var"
          description={report.note ?? 'Sokak park yeri bildirimi'}
        />
      ))}

      {parkedVehicle ? (
        <Marker
          key="parked-vehicle"
          coordinate={{ latitude: parkedVehicle.latitude, longitude: parkedVehicle.longitude }}
          pinColor={ParkingPalette.success}
          title="Aracım"
          description={parkedVehicle.title}
        />
      ) : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 260,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
});
