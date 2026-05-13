import { StyleSheet } from 'react-native';

import { ParkingPalette, Shadows } from '@/constants/brand';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export const inputPlaceholderColor = ParkingPalette.muted;

export const styles = StyleSheet.create({
  shadowMd: Shadows.md,
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
  brandCopy: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    lineHeight: 20,
  },
  formCard: {
    borderRadius: Radius.md,
    backgroundColor: ParkingPalette.surface,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  formTitle: {
    color: ParkingPalette.ink,
    marginBottom: 4,
  },
  input: {
    minHeight: 50,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: ParkingPalette.lineSoft,
    backgroundColor: '#F5F8FB',
    color: ParkingPalette.ink,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
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
  oauthRow: {
    gap: Spacing.two,
  },
  oauthBtn: {
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: ParkingPalette.lineSoft,
    backgroundColor: ParkingPalette.surface,
    paddingHorizontal: 16,
    paddingVertical: 13,
    alignItems: 'center',
  },
  oauthText: {
    color: ParkingPalette.ink,
  },
  appleBtn: {
    backgroundColor: ParkingPalette.ink,
    borderColor: ParkingPalette.ink,
  },
  appleText: {
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
  switcher: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  linkText: {
    color: ParkingPalette.blue,
  },
  legalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: ParkingPalette.lineSoft,
    paddingTop: Spacing.two,
  },
  legalText: {
    color: ParkingPalette.muted,
  },
  backBtn: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: ParkingPalette.lineSoft,
    backgroundColor: ParkingPalette.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtnText: {
    color: ParkingPalette.ink,
  },
});
