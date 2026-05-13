import { StyleSheet } from 'react-native';
import { ParkingPalette } from '@/constants/brand';
import { Spacing } from '@/constants/theme';

export const activityIndicatorColor = ParkingPalette.blue;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: '#fbfdff',
  },
  text: {
    color: ParkingPalette.ink,
  },
});
