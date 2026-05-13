import { Platform, StyleSheet } from 'react-native';
import { ParkingPalette, Shadows } from '@/constants/brand';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  shadowSm: Shadows.sm,
  shadowMd: Shadows.md,
  shadowLg: Shadows.lg,
  screen: { flex: 1, backgroundColor: '#F0F4F8' },
  mapContainer: { ...StyleSheet.absoluteFill },

  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Platform.select({ web: 80, default: Spacing.four }),
    paddingBottom: Spacing.four,
  },

  /* Distance badge */
  distanceBadge: {
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(12px)',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    gap: 4,
  },
  distanceBadgeClose: {
    backgroundColor: 'rgba(34, 198, 124, 0.92)',
  },
  distanceLabel: {
    color: ParkingPalette.muted,
  },
  distanceValue: {
    color: ParkingPalette.ink,
    fontSize: 36,
  },

  /* Info card */
  infoCard: {
    width: '100%',
    maxWidth: MaxContentWidth,
    borderRadius: Radius.lg,
    backgroundColor: ParkingPalette.surface,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleDot: {
    width: 10, height: 40, borderRadius: 5,
    backgroundColor: ParkingPalette.success,
  },
  vehicleInfo: {
    flex: 1,
    gap: 3,
  },
  vehicleName: { color: ParkingPalette.ink, fontSize: 16 },
  vehicleMeta: { color: ParkingPalette.muted },

  arrivedBanner: {
    borderRadius: Radius.sm,
    backgroundColor: ParkingPalette.successLight,
    padding: Spacing.three,
  },
  arrivedText: { color: '#0D5C3C', textAlign: 'center' },

  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  navButton: {
    flex: 1,
    borderRadius: Radius.full,
    backgroundColor: ParkingPalette.blue,
    paddingVertical: 14,
    alignItems: 'center',
    ...Shadows.glow(ParkingPalette.blue),
  },
  navButtonText: { color: '#FFFFFF' },
  endButton: {
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: ParkingPalette.lineSoft,
    backgroundColor: ParkingPalette.surface,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  endButtonText: { color: ParkingPalette.ink },
});
