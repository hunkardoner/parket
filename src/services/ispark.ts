import { Coordinates, ParkingLot, ParkingLotDetail, ParkingStatus } from '@/types/parking';

const PARKS_URL = 'https://api.ibb.gov.tr/ispark/Park';
const PARK_DETAIL_URL = 'https://api.ibb.gov.tr/ispark/ParkDetay';

type RawPark = {
  parkID: number;
  parkName: string;
  lat: string;
  lng: string;
  capacity: number;
  emptyCapacity: number;
  workHours: string;
  parkType: string;
  freeTime: number;
  district: string;
  isOpen?: number;
};

type RawParkDetail = RawPark & {
  locationName?: string;
  updateDate?: string;
  monthlyFee?: number;
  tariff?: string;
  address?: string;
};

function resolveStatus(isOpen: boolean, emptyCapacity: number, capacity: number): ParkingStatus {
  if (!isOpen) {
    return 'closed';
  }
  if (capacity > 0 && emptyCapacity <= 0) {
    return 'full';
  }
  if (capacity > 0 && emptyCapacity / capacity <= 0.1) {
    return 'limited';
  }
  return 'open';
}

function normalizePark(raw: RawPark): ParkingLot {
  const capacity = Number(raw.capacity) || 0;
  const emptyCapacity = Math.max(0, Number(raw.emptyCapacity) || 0);
  const occupiedCapacity = Math.max(0, capacity - emptyCapacity);
  const isOpen = raw.isOpen !== 0;

  return {
    id: raw.parkID,
    name: raw.parkName,
    latitude: Number(raw.lat),
    longitude: Number(raw.lng),
    capacity,
    emptyCapacity,
    occupiedCapacity,
    occupancyRate: capacity > 0 ? occupiedCapacity / capacity : 1,
    workHours: raw.workHours,
    type: raw.parkType,
    freeTime: Number(raw.freeTime) || 0,
    district: raw.district,
    isOpen,
    status: resolveStatus(isOpen, emptyCapacity, capacity),
  };
}

export function distanceInMeters(from: Coordinates, to: Coordinates) {
  const earthRadius = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters?: number) {
  if (meters === undefined) {
    return null;
  }
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export async function fetchParkingLots(signal?: AbortSignal): Promise<ParkingLot[]> {
  const response = await fetch(PARKS_URL, { signal });

  if (!response.ok) {
    throw new Error(`İSPARK verisi alınamadı (${response.status})`);
  }

  const rows = (await response.json()) as RawPark[];

  return rows
    .map(normalizePark)
    .filter((park) => Number.isFinite(park.latitude) && Number.isFinite(park.longitude));
}

export async function fetchParkingDetail(parkId: number): Promise<ParkingLotDetail | null> {
  const response = await fetch(`${PARK_DETAIL_URL}?parkID=${parkId}`);

  if (!response.ok) {
    throw new Error(`İSPARK fiyat detayı alınamadı (${response.status})`);
  }

  const rows = (await response.json()) as RawParkDetail[];
  const detail = rows[0];

  if (!detail) {
    return null;
  }

  return {
    ...normalizePark(detail),
    address: detail.address,
    updateDate: detail.updateDate,
    monthlyFee: detail.monthlyFee,
    tariff: detail.tariff,
    locationName: detail.locationName,
  };
}
