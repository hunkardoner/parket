import { StyleSheet } from 'react-native';

import { ParkingPalette } from '@/constants/brand';
import { Spacing } from '@/constants/theme';

export const activityIndicatorColor = ParkingPalette.blue;

export const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    backgroundColor: '#F0F4F8',
  },
  loadingText: {
    color: ParkingPalette.muted,
  },
});
