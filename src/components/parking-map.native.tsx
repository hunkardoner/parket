import MapView, { Marker } from 'react-native-maps';
import { getLotPinColor, parkedVehiclePinColor, reportPinColor, styles } from './parking-map/style.native';

import { IstanbulCenter } from '@/constants/brand';
import { Coordinates, ParkingLot, ParkedVehicle, StreetParkingReport } from '@/types/parking';

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
          pinColor={getLotPinColor(lot.status)}
          title={lot.name}
          description={`${lot.emptyCapacity}/${lot.capacity} boş - ${lot.workHours}`}
          onPress={() => onLotPress?.(lot)}
        />
      ))}

      {reports.map((report) => (
        <Marker
          key={`report-${report.id}`}
          coordinate={{ latitude: report.latitude, longitude: report.longitude }}
          pinColor={reportPinColor}
          title="Yanımda boş yer var"
          description={report.note ?? 'Sokak park yeri bildirimi'}
        />
      ))}

      {parkedVehicle ? (
        <Marker
          key="parked-vehicle"
          coordinate={{ latitude: parkedVehicle.latitude, longitude: parkedVehicle.longitude }}
          pinColor={parkedVehiclePinColor}
          title="Aracım"
          description={parkedVehicle.title}
        />
      ) : null}
    </MapView>
  );
}
