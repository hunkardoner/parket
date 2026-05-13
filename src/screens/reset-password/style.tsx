import { StyleSheet } from 'react-native';
import { ParkingPalette } from '@/constants/brand';
import { Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.three,
    gap: Spacing.two,
    backgroundColor: '#fbfdff',
  },
  title: {
    color: ParkingPalette.ink,
  },
  text: {
    color: '#4d5963',
  },
});
