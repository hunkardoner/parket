import { Platform, StyleSheet } from 'react-native';
import { ParkingPalette, Shadows } from '@/constants/brand';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  shadowSm: Shadows.sm,
  shadowMd: Shadows.md,
  shadowLg: Shadows.lg,
  screen: { flex: 1, backgroundColor: '#F0F4F8' },
  content: {
    alignItems: 'center',
    paddingTop: Platform.select({ web: 80, default: 0 }),
    paddingBottom: Platform.select({ web: 100, default: BottomTabInset + Spacing.six }),
  },
  safeArea: {
    width: '100%', maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three, gap: Spacing.three,
  },

  /* Header */
  header: { gap: 6, paddingTop: Spacing.two },
  overline: { color: ParkingPalette.violet },
  title: { color: ParkingPalette.ink },
  subtitle: { color: ParkingPalette.muted, fontSize: 14, lineHeight: 20 },

  /* Search */
  searchCard: {
    borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: ParkingPalette.ink,
  },
  sectionTitle: { color: '#FFFFFF', fontSize: 16, padding: Spacing.four, paddingBottom: 0 },
  radiusRow: { gap: Spacing.two, paddingHorizontal: Spacing.four, paddingVertical: Spacing.two },
  radiusChip: {
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'transparent',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  radiusChipActive: { borderColor: ParkingPalette.blue, backgroundColor: ParkingPalette.blue },
  radiusText: { color: 'rgba(255,255,255,0.65)' },
  radiusTextActive: { color: '#FFFFFF' },
  searchBtn: {
    margin: Spacing.four, marginTop: Spacing.two,
    minHeight: 48, borderRadius: Radius.full,
    backgroundColor: ParkingPalette.blue,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20, paddingVertical: 13,
    ...Shadows.glow(ParkingPalette.blue),
  },
  searchBtnText: { color: '#FFFFFF' },

  /* Map */
  mapWrap: { borderRadius: Radius.md, overflow: 'hidden', ...Shadows.md },

  /* Results */
  resultsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  resultsTitle: { color: ParkingPalette.ink },
  resultsBadge: {
    borderRadius: Radius.full, backgroundColor: '#E6F2FB',
    paddingHorizontal: 10, paddingVertical: 3,
  },
  resultsBadgeText: { color: ParkingPalette.blue },
  errorCard: {
    borderRadius: Radius.sm, borderWidth: 1, borderColor: ParkingPalette.coral,
    backgroundColor: ParkingPalette.coralLight, padding: Spacing.two,
  },
  errorText: { color: '#7A3B39' },
  resultList: { gap: Spacing.two },
  resultCard: {
    borderRadius: Radius.md, backgroundColor: ParkingPalette.surface,
    padding: Spacing.three, gap: Spacing.two,
  },
  resultTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  resultTitleBlock: { flex: 1, gap: 3 },
  resultTitle: { color: ParkingPalette.ink, fontSize: 15 },
  resultMeta: { color: ParkingPalette.muted },
  emptyBadge: {
    borderRadius: Radius.full, backgroundColor: ParkingPalette.successLight,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  emptyBadgeText: { color: ParkingPalette.success },
  resultBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two,
  },
  routeChip: {
    borderRadius: Radius.full, backgroundColor: '#EBF5FF',
    paddingHorizontal: 14, paddingVertical: 8,
  },
  routeChipText: { color: ParkingPalette.blue },
  emptyState: {
    borderRadius: Radius.md, backgroundColor: ParkingPalette.amberLight,
    borderWidth: 1, borderColor: ParkingPalette.amber,
    padding: Spacing.four, gap: 8, alignItems: 'center',
  },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { color: ParkingPalette.ink },
  emptySub: { color: ParkingPalette.muted },
});
