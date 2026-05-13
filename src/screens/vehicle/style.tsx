import { Platform, StyleSheet } from 'react-native';
import { ParkingPalette, Shadows } from '@/constants/brand';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export const activityIndicatorColor = ParkingPalette.blue;

export const styles = StyleSheet.create({
  shadowSm: Shadows.sm,
  shadowMd: Shadows.md,
  shadowLg: Shadows.lg,
  screen: { flex: 1, backgroundColor: '#F0F4F8' },
  content: {
    alignItems: 'center',
    paddingTop: Platform.select({ web: 80, default: 0 }),
    paddingBottom: BottomTabInset + Spacing.six,
  },
  safeArea: {
    width: '100%', maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three, gap: Spacing.three,
  },

  /* Header */
  header: {
    paddingTop: Spacing.two, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  overline: { color: ParkingPalette.violet },
  title: { color: ParkingPalette.ink },

  /* Session */
  sessionCard: {
    borderRadius: Radius.lg, overflow: 'hidden',
    backgroundColor: ParkingPalette.ink,
  },
  sessionInner: {
    padding: Spacing.four, gap: Spacing.three,
    experimental_backgroundImage: ParkingPalette.gradientViolet,
  },
  sessionCopy: { gap: 6 },
  sessionTitle: { color: '#FFFFFF' },
  sessionText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20 },
  sessionActions: { flexDirection: 'row', gap: Spacing.two },
  startBtn: {
    borderRadius: Radius.full, backgroundColor: '#FFFFFF',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  startBtnText: { color: ParkingPalette.violet },
  stopBtn: {
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  stopBtnText: { color: '#FFFFFF' },

  /* Vehicle */
  vehicleCard: {
    borderRadius: Radius.md, backgroundColor: ParkingPalette.surface,
    padding: Spacing.three, gap: Spacing.three,
  },
  vehicleHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  vehicleDot: {
    width: 10, height: 40, borderRadius: 5,
    backgroundColor: ParkingPalette.success,
  },
  vehicleInfo: { flex: 1, gap: 3 },
  vehicleName: { color: ParkingPalette.ink, fontSize: 16 },
  vehicleMeta: { color: ParkingPalette.muted },
  vehiclePhoto: {
    width: '100%', aspectRatio: 16 / 10,
    borderRadius: Radius.sm, backgroundColor: '#EDF2F7',
  },
  emptyVehicle: { alignItems: 'center', paddingVertical: Spacing.four, gap: 8 },
  emptyEmoji: { fontSize: 42 },
  vehicleActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  actionBtn: {
    borderRadius: Radius.sm, borderWidth: 1.5, borderColor: ParkingPalette.lineSoft,
    backgroundColor: ParkingPalette.surface,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  actionBtnText: { color: ParkingPalette.ink },
  actionBtnDark: {
    backgroundColor: ParkingPalette.ink, borderColor: ParkingPalette.ink,
  },
  actionBtnDarkText: { color: '#FFFFFF' },
  actionBtnMap: {
    backgroundColor: ParkingPalette.blue, borderColor: ParkingPalette.blue,
    ...Shadows.glow(ParkingPalette.blue),
  },
  actionBtnMapText: { color: '#FFFFFF' },

  /* Report */
  reportCard: {
    borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: ParkingPalette.successLight,
    backgroundColor: '#F0FDF7', padding: Spacing.three,
  },
  reportInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reportIcon: {
    width: 44, height: 44, borderRadius: Radius.sm,
    backgroundColor: ParkingPalette.successLight,
    alignItems: 'center', justifyContent: 'center',
  },
  reportEmoji: { fontSize: 22 },
  reportCopy: { flex: 1 },
  reportTitle: { color: ParkingPalette.ink },
  reportSub: { color: ParkingPalette.muted, marginTop: 2 },

  /* Map */
  mapWrap: { borderRadius: Radius.md, overflow: 'hidden', ...Shadows.md },

  /* Reports list */
  reportsPanel: {
    borderRadius: Radius.md, backgroundColor: ParkingPalette.surface,
    padding: Spacing.three, gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  sectionTitle: { color: ParkingPalette.ink },
  reportCountBadge: {
    borderRadius: Radius.full, backgroundColor: ParkingPalette.violetLight,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  reportCountText: { color: ParkingPalette.violet },
  reportItem: {
    flexDirection: 'row', gap: 12, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: ParkingPalette.lineSoft, paddingTop: Spacing.two,
  },
  reportDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: ParkingPalette.violet,
  },
  reportItemCopy: { flex: 1, gap: 2 },
  reportItemTitle: { color: ParkingPalette.ink },
  reportItemMeta: { color: ParkingPalette.muted },
  routeChip: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: '#EBF5FF', alignItems: 'center', justifyContent: 'center',
  },
  routeIconText: { color: ParkingPalette.blue },

  /* Notice */
  notice: {
    borderRadius: Radius.sm, backgroundColor: ParkingPalette.amberLight,
    borderWidth: 1, borderColor: ParkingPalette.amber,
    padding: Spacing.two,
  },
  noticeText: { color: '#6B5B34' },
});
