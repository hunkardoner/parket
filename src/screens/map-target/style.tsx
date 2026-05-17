import { Platform, StyleSheet } from 'react-native';

import { ParkingPalette, Shadows } from '@/constants/brand';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export const activityIndicatorColor = ParkingPalette.blue;

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  emptyScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    backgroundColor: '#F0F4F8',
  },
  emptyTitle: {
    color: ParkingPalette.ink,
  },
  mapContainer: {
    ...StyleSheet.absoluteFill,
  },
  map: {
    flex: 1,
    height: '100%',
    borderRadius: 0,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Platform.select({ web: Spacing.three, default: Spacing.two }),
    paddingBottom: Spacing.four,
  },
  topBar: {
    width: '100%',
    maxWidth: MaxContentWidth,
    minHeight: 58,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    ...Shadows.md,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ParkingPalette.surfaceElevated,
  },
  iconButtonText: {
    color: ParkingPalette.ink,
    fontSize: 24,
    lineHeight: 26,
  },
  topTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  overline: {
    color: ParkingPalette.muted,
  },
  topTitle: {
    color: ParkingPalette.ink,
  },
  infoCard: {
    width: '100%',
    maxWidth: MaxContentWidth,
    borderRadius: Radius.lg,
    backgroundColor: ParkingPalette.surface,
    padding: Spacing.four,
    gap: Spacing.three,
    ...Shadows.lg,
  },
  infoCopy: {
    gap: 4,
  },
  infoTitle: {
    color: ParkingPalette.ink,
    fontSize: 16,
  },
  infoMeta: {
    color: ParkingPalette.muted,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: Radius.full,
    backgroundColor: ParkingPalette.blue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    ...Shadows.glow(ParkingPalette.blue),
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    backgroundColor: ParkingPalette.surface,
  },
  secondaryButtonText: {
    color: ParkingPalette.ink,
  },
});
