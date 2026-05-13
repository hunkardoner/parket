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
    paddingBottom: Platform.select({ web: 100, default: BottomTabInset + Spacing.six }),
  },
  safeArea: {
    width: '100%', maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three, gap: Spacing.three,
  },
  header: { paddingTop: Spacing.two, gap: 4 },
  overline: { color: ParkingPalette.violet },
  title: { color: ParkingPalette.ink },

  /* Filters */
  filterRow: { flexDirection: 'row', gap: Spacing.two },
  filterChip: {
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: ParkingPalette.lineSoft,
    backgroundColor: ParkingPalette.surface,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  filterChipActive: { backgroundColor: ParkingPalette.blue, borderColor: ParkingPalette.blue },
  filterText: { color: ParkingPalette.inkSecondary },
  filterTextActive: { color: '#FFFFFF' },

  loadingWrap: { alignItems: 'center', padding: Spacing.five },

  /* Empty */
  emptyCard: {
    borderRadius: Radius.md, backgroundColor: ParkingPalette.surface,
    padding: Spacing.five, gap: 10, alignItems: 'center',
    ...Shadows.sm,
  },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { color: ParkingPalette.ink },
  emptyText: { color: ParkingPalette.muted },

  /* List */
  list: { gap: Spacing.two },
  card: {
    borderRadius: Radius.md, backgroundColor: ParkingPalette.surface,
    padding: Spacing.three, gap: 8,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  sourceBadge: {
    borderRadius: Radius.full, backgroundColor: '#F0F5FA',
    paddingHorizontal: 10, paddingVertical: 3,
  },
  sourceBadgeIspark: { backgroundColor: ParkingPalette.blueGlow },
  sourceBadgeText: { color: ParkingPalette.ink },
  entryDate: { color: ParkingPalette.muted },
  entryTitle: { color: ParkingPalette.ink, fontSize: 15 },
  entryAddress: { color: ParkingPalette.muted },
  entryComplete: { color: ParkingPalette.success },
  entryOngoing: { color: ParkingPalette.amber },

  /* Card actions */
  cardActions: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    borderTopWidth: 1, borderTopColor: ParkingPalette.lineSoft, paddingTop: Spacing.two,
  },
  favBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: '#FFF8E9', alignItems: 'center', justifyContent: 'center',
  },
  favIcon: { fontSize: 18 },
  routeBtn: {
    flex: 1, borderRadius: Radius.full, backgroundColor: '#EBF5FF',
    paddingVertical: 8, alignItems: 'center',
  },
  routeBtnText: { color: ParkingPalette.blue },
  deleteBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: ParkingPalette.coralLight, alignItems: 'center', justifyContent: 'center',
  },
  deleteIcon: { color: ParkingPalette.coral },
});
