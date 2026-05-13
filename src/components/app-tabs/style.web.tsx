import { StyleSheet } from 'react-native';
import { ParkingPalette, Shadows } from '@/constants/brand';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  shadowMd: Shadows.md,
  tabSlot: {
    height: '100%',
  },
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.one,
    maxWidth: MaxContentWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    backdropFilter: 'blur(16px)',
    borderWidth: 1,
    borderColor: 'rgba(212, 223, 233, 0.5)',
  },
  brandText: {
    marginRight: 'auto',
    color: ParkingPalette.ink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pressed: { opacity: 0.7 },
  tabBtn: {
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
  },
  tabBtnActive: {
    backgroundColor: ParkingPalette.blue,
  },
  tabLabel: {
    color: ParkingPalette.muted,
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
});
