import { Platform, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { ParkingPalette, Shadows } from '@/constants/brand';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import type { ParkingStatus } from '@/types/parking';

export const activityIndicatorColor = ParkingPalette.blue;
export const inputPlaceholderColor = ParkingPalette.muted;
export const refreshControlColor = ParkingPalette.blue;

export const statAccentColors = {
  parking: ParkingPalette.blue,
  open: ParkingPalette.success,
  empty: ParkingPalette.amber,
  occupancy: ParkingPalette.coral,
};

function getStatusColor(status: ParkingStatus) {
  if (status === 'closed') return ParkingPalette.muted;
  if (status === 'full') return ParkingPalette.coral;
  if (status === 'limited') return ParkingPalette.amber;
  return ParkingPalette.success;
}

function getStatusBg(status: ParkingStatus) {
  if (status === 'closed') return '#F0F3F6';
  if (status === 'full') return ParkingPalette.coralLight;
  if (status === 'limited') return ParkingPalette.amberLight;
  return ParkingPalette.successLight;
}

function getCapacityColor(rate: number) {
  if (rate > 0.85) return ParkingPalette.coral;
  if (rate > 0.6) return ParkingPalette.amber;
  return ParkingPalette.success;
}

export function getStatAccentStyle(accent: string): ViewStyle {
  return { backgroundColor: accent };
}

export function getStatValueStyle(accent: string): TextStyle {
  return { color: accent };
}

export function getStatusPillStyle(status: ParkingStatus): ViewStyle {
  return { backgroundColor: getStatusBg(status) };
}

export function getStatusTextStyle(status: ParkingStatus): TextStyle {
  return { color: getStatusColor(status) };
}

export function getCapacityFillStyle(fillPct: number, occupancyRate: number): ViewStyle {
  return {
    width: `${fillPct}%`,
    backgroundColor: getCapacityColor(occupancyRate),
  } as ViewStyle;
}

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

  /* Hero */
  heroCard: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: ParkingPalette.ink,
    ...Shadows.lg,
  },
  heroInner: {
    padding: Spacing.four, gap: 12,
    experimental_backgroundImage: ParkingPalette.gradientHero,
  },
  heroOverline: { color: ParkingPalette.blueLight },
  heroTitle: { color: '#FFFFFF', fontSize: 38, lineHeight: 44 },
  heroCopy: { color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 20 },
  heroCta: {
    alignSelf: 'flex-start', marginTop: 4,
    borderRadius: Radius.full,
    backgroundColor: ParkingPalette.blue,
    paddingHorizontal: 20, paddingVertical: 12,
    ...Shadows.glow(ParkingPalette.blue),
  },
  heroCtaText: { color: '#FFFFFF' },

  /* Stats */
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  statCard: {
    minWidth: 148, flexGrow: 1,
    borderRadius: Radius.md, backgroundColor: ParkingPalette.surface,
    padding: Spacing.three, gap: 4,
  },
  statAccent: { width: 32, height: 4, borderRadius: 2, marginBottom: 4 },
  statIcon: { fontSize: 18 },
  statLabel: { color: ParkingPalette.muted },
  statValue: { fontSize: 22 },

  /* Search */
  searchCard: {
    borderRadius: Radius.md, backgroundColor: ParkingPalette.surface,
    padding: Spacing.three, gap: Spacing.two,
    ...Shadows.sm,
  },
  searchInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.sm, backgroundColor: '#F0F5FA',
    paddingHorizontal: 14, gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1, minHeight: 46,
    color: ParkingPalette.ink, fontSize: 15, fontWeight: '600',
  },
  filterRow: { gap: Spacing.two, paddingVertical: 2 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: ParkingPalette.lineSoft,
    backgroundColor: ParkingPalette.surface,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: ParkingPalette.blue, borderColor: ParkingPalette.blue,
  },
  filterEmoji: { fontSize: 14 },
  filterText: { color: ParkingPalette.inkSecondary },
  filterTextActive: { color: '#FFFFFF' },

  /* Street reports */
  streetCard: {
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: ParkingPalette.violetLight,
    backgroundColor: '#F9F7FF', padding: Spacing.three,
  },
  streetCardActive: { backgroundColor: '#EEEAFF', borderColor: ParkingPalette.violet },
  streetCardInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streetIconBadge: {
    width: 40, height: 40, borderRadius: Radius.sm,
    backgroundColor: ParkingPalette.violetLight,
    alignItems: 'center', justifyContent: 'center',
  },
  streetCopy: { flex: 1 },
  streetEmoji: { fontSize: 18 },
  streetTitle: { color: ParkingPalette.ink },
  streetSub: { color: ParkingPalette.muted, marginTop: 2 },
  streetBadge: {
    minWidth: 32, height: 32, borderRadius: Radius.full,
    backgroundColor: ParkingPalette.violet,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
  },
  streetBadgeText: { color: '#FFFFFF', fontSize: 14 },

  /* Map */
  mapWrap: { borderRadius: Radius.md, overflow: 'hidden', ...Shadows.md },

  /* Error */
  errorCard: {
    borderRadius: Radius.md, backgroundColor: ParkingPalette.coralLight,
    borderWidth: 1, borderColor: ParkingPalette.coral,
    padding: Spacing.three, gap: 6,
  },
  errorTitle: { color: ParkingPalette.coral },
  errorText: { color: '#7A3B39' },

  /* Loading */
  loadingWrap: { alignItems: 'center', padding: Spacing.five, gap: Spacing.three },
  loadingText: { color: ParkingPalette.muted },

  /* Lot list */
  lotList: { gap: Spacing.three },
  lotCard: {
    borderRadius: Radius.md, backgroundColor: ParkingPalette.surface,
    padding: Spacing.three, gap: 14,
  },
  lotHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  lotTitleBlock: { flex: 1, gap: 3 },
  lotName: { color: ParkingPalette.ink, fontSize: 16 },
  lotMeta: { color: ParkingPalette.muted },
  statusPill: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 11 },

  /* Capacity bar */
  barTrack: { height: 6, borderRadius: 3, backgroundColor: '#EDF2F7', overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },

  /* Metrics */
  metricsRow: { flexDirection: 'row', gap: Spacing.two },
  metricItem: {
    flex: 1, borderRadius: Radius.xs, backgroundColor: '#F5F8FB',
    padding: Spacing.two, gap: 2, alignItems: 'center',
  },
  metricLabel: { color: ParkingPalette.muted },
  metricValue: { color: ParkingPalette.ink, fontSize: 13 },

  /* Detail */
  detailPanel: {
    borderRadius: Radius.sm, backgroundColor: '#F5F8FB',
    borderWidth: 1, borderColor: ParkingPalette.lineSoft,
    padding: Spacing.two, gap: Spacing.two,
  },
  detailAddr: { color: ParkingPalette.inkSecondary },
  tariffGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tariffChip: {
    borderRadius: Radius.xs, backgroundColor: ParkingPalette.surface,
    borderWidth: 1, borderColor: ParkingPalette.lineSoft,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  tariffText: { color: ParkingPalette.ink },
  monthlyFee: { color: ParkingPalette.blue },

  /* Actions */
  lotActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  actionBtn: {
    borderRadius: Radius.sm, borderWidth: 1.5, borderColor: ParkingPalette.lineSoft,
    backgroundColor: ParkingPalette.surface,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  actionBtnText: { color: ParkingPalette.ink },
  actionBtnPrimary: {
    backgroundColor: ParkingPalette.blue, borderColor: ParkingPalette.blue,
    ...Shadows.glow(ParkingPalette.blue),
  },
  actionBtnPrimaryText: { color: '#FFFFFF' },
});
