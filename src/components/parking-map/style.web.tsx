import { StyleSheet } from 'react-native';
import { ParkingPalette } from '@/constants/brand';

export const styles = StyleSheet.create({
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
  targetPin: {
    backgroundColor: '#e7f1f8',
    borderColor: ParkingPalette.blue,
  },
  reportPin: {
    backgroundColor: '#f1eafe',
    borderColor: ParkingPalette.violet,
  },
});
