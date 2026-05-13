export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type ParkingStatus = 'open' | 'limited' | 'full' | 'closed';

export type ParkingLot = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  capacity: number;
  emptyCapacity: number;
  occupiedCapacity: number;
  occupancyRate: number;
  workHours: string;
  type: string;
  freeTime: number;
  district: string;
  isOpen: boolean;
  status: ParkingStatus;
  distanceMeters?: number;
};

export type ParkingLotDetail = ParkingLot & {
  address?: string;
  updateDate?: string;
  monthlyFee?: number;
  tariff?: string;
  locationName?: string;
};

export type ParkedVehicle = {
  id: string;
  source: 'street' | 'ispark' | 'custom';
  title: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  addressHint?: string;
  photoUri?: string;
  lotId?: number;
};

export type StreetParkingReport = {
  id: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  expiresAt: string;
  note?: string;
  photoUri?: string;
  userId?: string;
};
