import { useCallback, useEffect, useMemo, useRef } from 'react';
import { requireOptionalNativeModule } from 'expo';
import type { AppleMaps as AppleMapsTypes, CameraPosition, GoogleMaps as GoogleMapsTypes } from 'expo-maps';
import { Platform, StyleProp, Text, ViewStyle } from 'react-native';
import { getLotPinColor, parkedVehiclePinColor, reportPinColor, styles } from './parking-map/style.native';

import { IstanbulCenter } from '@/constants/brand';
import { Coordinates, ParkingLot, ParkedVehicle, StreetParkingReport } from '@/types/parking';

type MapTarget = Coordinates & {
  id?: string;
  title: string;
  description?: string;
};

type ParkingMapProps = {
  lots?: ParkingLot[];
  reports?: StreetParkingReport[];
  currentLocation?: Coordinates | null;
  parkedVehicle?: ParkedVehicle | null;
  target?: MapTarget | null;
  focusKey?: number;
  style?: StyleProp<ViewStyle>;
  onLotPress?: (lot: ParkingLot) => void;
};

const DEFAULT_ZOOM = 13;
const ROUTE_LINE_COLOR = '#2E8BC0';
const ROUTE_LINE_WIDTH = 5;

type ExpoMapsModule = typeof import('expo-maps');

let expoMapsModule: ExpoMapsModule | null | undefined;

function getExpoMaps() {
  if (expoMapsModule !== undefined) {
    return expoMapsModule;
  }

  if (!requireOptionalNativeModule('ExpoMaps')) {
    expoMapsModule = null;
    return expoMapsModule;
  }

  try {
    // expo-maps touches the native module during import, so keep this guarded for Expo Go.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    expoMapsModule = require('expo-maps') as ExpoMapsModule;
  } catch {
    expoMapsModule = null;
  }

  return expoMapsModule;
}

function asCoordinates(source: Coordinates) {
  return {
    latitude: source.latitude,
    longitude: source.longitude,
  };
}

function vehicleTarget(vehicle: ParkedVehicle): MapTarget {
  return {
    id: 'parked-vehicle',
    title: 'Aracım',
    description: vehicle.title,
    latitude: vehicle.latitude,
    longitude: vehicle.longitude,
  };
}

function distanceInMeters(from: Coordinates, to: Coordinates) {
  const earthRadius = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function zoomForDistance(distance: number) {
  if (distance < 250) return 17;
  if (distance < 800) return 16;
  if (distance < 2000) return 15;
  if (distance < 5000) return 14;
  if (distance < 12000) return 12;
  return 10;
}

function cameraFor({
  currentLocation,
  parkedVehicle,
  target,
  lots,
  reports,
}: {
  currentLocation?: Coordinates | null;
  parkedVehicle?: ParkedVehicle | null;
  target?: MapTarget | null;
  lots: ParkingLot[];
  reports: StreetParkingReport[];
}): CameraPosition {
  const routeTarget = target ?? (parkedVehicle ? vehicleTarget(parkedVehicle) : null);

  if (currentLocation && routeTarget) {
    const center = {
      latitude: (currentLocation.latitude + routeTarget.latitude) / 2,
      longitude: (currentLocation.longitude + routeTarget.longitude) / 2,
    };
    return {
      coordinates: center,
      zoom: zoomForDistance(distanceInMeters(currentLocation, routeTarget)),
    };
  }

  if (currentLocation) {
    return { coordinates: asCoordinates(currentLocation), zoom: DEFAULT_ZOOM };
  }

  if (routeTarget) {
    return { coordinates: asCoordinates(routeTarget), zoom: 16 };
  }

  const firstLot = lots[0];
  if (firstLot) {
    return {
      coordinates: { latitude: firstLot.latitude, longitude: firstLot.longitude },
      zoom: DEFAULT_ZOOM,
    };
  }

  const firstReport = reports[0];
  if (firstReport) {
    return {
      coordinates: { latitude: firstReport.latitude, longitude: firstReport.longitude },
      zoom: DEFAULT_ZOOM,
    };
  }

  return {
    coordinates: {
      latitude: IstanbulCenter.latitude,
      longitude: IstanbulCenter.longitude,
    },
    zoom: 10,
  };
}

export function ParkingMap({
  lots = [],
  reports = [],
  currentLocation,
  parkedVehicle,
  target,
  focusKey = 0,
  style,
  onLotPress,
}: ParkingMapProps) {
  const maps = getExpoMaps();
  const appleMapRef = useRef<AppleMapsTypes.MapView>(null);
  const googleMapRef = useRef<GoogleMapsTypes.MapView>(null);
  const visibleLots = useMemo(() => lots.slice(0, 80), [lots]);
  const routeTarget = target ?? (parkedVehicle ? vehicleTarget(parkedVehicle) : null);
  const cameraPosition = useMemo(
    () => cameraFor({ currentLocation, parkedVehicle, target, lots: visibleLots, reports }),
    [currentLocation, parkedVehicle, reports, target, visibleLots]
  );
  const cameraKey = `${cameraPosition.coordinates?.latitude ?? 0}:${
    cameraPosition.coordinates?.longitude ?? 0
  }:${cameraPosition.zoom ?? DEFAULT_ZOOM}`;

  useEffect(() => {
    if (Platform.OS === 'ios') {
      appleMapRef.current?.setCameraPosition(cameraPosition);
    } else if (Platform.OS === 'android') {
      googleMapRef.current?.setCameraPosition({ ...cameraPosition, duration: 450 });
    }
  }, [cameraKey, cameraPosition, focusKey]);

  const routeLine =
    currentLocation && routeTarget
      ? [
          {
            id: 'route-line',
            coordinates: [asCoordinates(currentLocation), asCoordinates(routeTarget)],
            color: ROUTE_LINE_COLOR,
            width: ROUTE_LINE_WIDTH,
          },
        ]
      : [];

  const googleMarkers = useMemo<GoogleMapsTypes.Marker[]>(() => {
    const lotMarkers = visibleLots.map((lot) => ({
      id: `lot-${lot.id}`,
      coordinates: { latitude: lot.latitude, longitude: lot.longitude },
      title: lot.name,
      snippet: `${lot.emptyCapacity}/${lot.capacity} boş - ${lot.workHours}`,
      showCallout: true,
      zIndex: 1,
    }));
    const reportMarkers = reports.map((report) => ({
      id: `report-${report.id}`,
      coordinates: { latitude: report.latitude, longitude: report.longitude },
      title: 'Yanımda boş yer var',
      snippet: report.note ?? 'Sokak park yeri bildirimi',
      showCallout: true,
      zIndex: 2,
    }));
    const targetMarker = routeTarget
      ? [
          {
            id: routeTarget.id ?? 'map-target',
            coordinates: asCoordinates(routeTarget),
            title: routeTarget.title,
            snippet: routeTarget.description,
            showCallout: true,
            zIndex: 3,
          },
        ]
      : [];

    return [...lotMarkers, ...reportMarkers, ...targetMarker];
  }, [reports, routeTarget, visibleLots]);

  const appleMarkers = useMemo<AppleMapsTypes.Marker[]>(() => {
    const lotMarkers = visibleLots.map((lot) => ({
      id: `lot-${lot.id}`,
      coordinates: { latitude: lot.latitude, longitude: lot.longitude },
      title: lot.name,
      tintColor: getLotPinColor(lot.status),
    }));
    const reportMarkers = reports.map((report) => ({
      id: `report-${report.id}`,
      coordinates: { latitude: report.latitude, longitude: report.longitude },
      title: report.note ?? 'Sokak park yeri bildirimi',
      tintColor: reportPinColor,
    }));
    const targetMarker = routeTarget
      ? [
          {
            id: routeTarget.id ?? 'map-target',
            coordinates: asCoordinates(routeTarget),
            title: routeTarget.title,
            tintColor: parkedVehiclePinColor,
          },
        ]
      : [];

    return [...lotMarkers, ...reportMarkers, ...targetMarker];
  }, [reports, routeTarget, visibleLots]);

  const handleMarkerClick = useCallback(
    (marker: { id?: string }) => {
      if (!marker.id?.startsWith('lot-')) return;
      const lotId = Number(marker.id.replace('lot-', ''));
      const lot = visibleLots.find((item) => item.id === lotId);
      if (lot) onLotPress?.(lot);
    },
    [onLotPress, visibleLots]
  );

  if (!maps) {
    return <Text style={styles.unsupportedText}>Harita bu çalışma ortamında desteklenmiyor.</Text>;
  }

  const { AppleMaps, GoogleMaps } = maps;

  if (Platform.OS === 'ios') {
    return (
      <AppleMaps.View
        ref={appleMapRef}
        style={[styles.map, style]}
        cameraPosition={cameraPosition}
        markers={appleMarkers}
        polylines={routeLine}
        onMarkerClick={handleMarkerClick}
        colorScheme={AppleMaps.MapColorScheme.AUTOMATIC}
        properties={{
          isMyLocationEnabled: Boolean(currentLocation),
          mapType: AppleMaps.MapType.STANDARD,
          selectionEnabled: false,
        }}
        uiSettings={{
          compassEnabled: true,
          myLocationButtonEnabled: Boolean(currentLocation),
          scaleBarEnabled: true,
        }}
      />
    );
  }

  if (Platform.OS === 'android') {
    return (
      <GoogleMaps.View
        ref={googleMapRef}
        style={[styles.map, style]}
        cameraPosition={cameraPosition}
        markers={googleMarkers}
        polylines={routeLine}
        onMarkerClick={handleMarkerClick}
        colorScheme={GoogleMaps.MapColorScheme.FOLLOW_SYSTEM}
        properties={{
          isMyLocationEnabled: Boolean(currentLocation),
          mapType: GoogleMaps.MapType.NORMAL,
          selectionEnabled: false,
        }}
        uiSettings={{
          compassEnabled: true,
          mapToolbarEnabled: false,
          myLocationButtonEnabled: Boolean(currentLocation),
          rotationGesturesEnabled: true,
          scaleBarEnabled: true,
          scrollGesturesEnabled: true,
          tiltGesturesEnabled: true,
          zoomControlsEnabled: false,
          zoomGesturesEnabled: true,
        }}
      />
    );
  }

  return <Text style={styles.unsupportedText}>Harita yalnızca iOS ve Android üzerinde desteklenir.</Text>;
}
