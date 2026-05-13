import { StyleSheet } from 'react-native';
import { ParkingPalette } from '@/constants/brand';
import { Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
  },
  title: {
    color: ParkingPalette.ink,
  },
  updatedAt: {
    color: '#6c7881',
  },
  section: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    backgroundColor: '#ffffff',
    padding: Spacing.three,
    gap: Spacing.one,
  },
  sectionTitle: {
    color: ParkingPalette.violet,
  },
  body: {
    color: '#4d5963',
  },
});
