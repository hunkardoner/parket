import { StyleSheet } from 'react-native';

import { ParkingPalette, Shadows } from '@/constants/brand';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  shadowSm: Shadows.sm,
  authRoot: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  authScroll: {
    alignItems: 'center',
    paddingBottom: Spacing.six,
  },
  authSafeArea: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  brandHero: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: ParkingPalette.ink,
  },
  brandHeroInner: {
    padding: Spacing.four,
    gap: 8,
    experimental_backgroundImage: ParkingPalette.gradientHero,
  },
  brandOverline: {
    color: ParkingPalette.blueLight,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 36,
    lineHeight: 42,
  },
  onboardingCards: {
    gap: Spacing.two,
    paddingRight: Spacing.three,
  },
  onboardingCard: {
    width: 240,
    minHeight: 160,
    borderRadius: Radius.md,
    backgroundColor: ParkingPalette.surface,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  onboardingIcon: {
    fontSize: 28,
  },
  onboardingTitle: {
    color: ParkingPalette.ink,
    fontSize: 16,
  },
  onboardingBody: {
    color: ParkingPalette.muted,
  },
  permissionCard: {
    borderRadius: Radius.md,
    backgroundColor: ParkingPalette.surface,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  permissionTitle: {
    color: ParkingPalette.ink,
    fontSize: 16,
  },
  permissionText: {
    color: ParkingPalette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryBtn: {
    borderRadius: Radius.full,
    backgroundColor: ParkingPalette.blue,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    ...Shadows.glow(ParkingPalette.blue),
  },
  primaryBtnText: {
    color: '#FFFFFF',
  },
  demoBtn: {
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: ParkingPalette.violetLight,
    backgroundColor: '#F9F7FF',
    paddingHorizontal: 16,
    paddingVertical: 13,
    alignItems: 'center',
  },
  demoBtnText: {
    color: ParkingPalette.violet,
  },
  formMsg: {
    color: ParkingPalette.muted,
  },
});
