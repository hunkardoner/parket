import { StyleSheet } from 'react-native';
import { ParkingPalette } from '@/constants/brand';
import type { ParkingStatus } from '@/types/parking';

export const reportPinColor = ParkingPalette.violet;
export const parkedVehiclePinColor = ParkingPalette.success;

export function getLotPinColor(status: ParkingStatus) {
  if (status === 'closed') {
    return '#6f7780';
  }
  if (status === 'full') {
    return ParkingPalette.coral;
  }
  if (status === 'limited') {
    return ParkingPalette.amber;
  }
  return ParkingPalette.blue;
}

export const styles = StyleSheet.create({
  map: {
    height: 260,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  unsupportedText: {
    minHeight: 260,
    padding: 16,
    color: ParkingPalette.muted,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});
