import { Platform, StyleSheet } from 'react-native';
import { ParkingPalette, Shadows } from '@/constants/brand';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  shadowMd: Shadows.md,

  /* Tab content slot */
  tabSlot: {
    height: '100%',
  },

  pressed: { opacity: 0.7 },

  /* ═══════════════════════════════════════
     Bottom Navigation Bar
     ═══════════════════════════════════════ */
  navBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: Spacing.three,
    paddingBottom: Platform.select({ ios: 24, default: 12 }),
    paddingTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(20px)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 223, 233, 0.4)',
  },
  navBarInner: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  /* Individual nav item */
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
  },
  navItemActive: {
    backgroundColor: ParkingPalette.blueGlow,
  },
  navIcon: {
    fontSize: 22,
    opacity: 0.5,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    color: ParkingPalette.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  navLabelActive: {
    color: ParkingPalette.blue,
    fontWeight: '700',
  },
});
