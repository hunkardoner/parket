import { Platform, StyleSheet, type ViewStyle } from 'react-native';
import { ParkingPalette, Shadows } from '@/constants/brand';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export const activityIndicatorColor = ParkingPalette.blue;
export const inputPlaceholderColor = ParkingPalette.muted;

export function getOccupancyFillStyle(occupancy: number): ViewStyle {
  return {
    width: `${occupancy}%`,
    backgroundColor:
      occupancy > 85 ? ParkingPalette.coral : occupancy > 60 ? ParkingPalette.amber : ParkingPalette.success,
  } as ViewStyle;
}

export const styles = StyleSheet.create({
  shadowSm: Shadows.sm,
  shadowMd: Shadows.md,
  shadowLg: Shadows.lg,
  screen: { flex: 1, backgroundColor: '#F0F4F8' },
  content: {
    alignItems: 'center',
    paddingTop: Platform.select({ web: 24, default: 0 }),
    paddingBottom: Spacing.six,
  },
  safeArea: {
    width: '100%', maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three, gap: Spacing.three,
  },
  loadingWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: Spacing.three, padding: Spacing.five, backgroundColor: '#F0F4F8',
  },
  loadingText: { color: ParkingPalette.muted },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: ParkingPalette.ink, textAlign: 'center' },
  emptyText: { color: ParkingPalette.muted, textAlign: 'center' },

  /* Header */
  headerCard: { borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: ParkingPalette.ink, ...Shadows.lg },
  headerInner: { padding: Spacing.four, gap: 8, experimental_backgroundImage: ParkingPalette.gradientDark },
  headerOverline: { color: ParkingPalette.blueLight },
  headerTitle: { color: '#FFFFFF', fontSize: 30, lineHeight: 36 },
  headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 14 },

  /* Cards */
  card: {
    borderRadius: Radius.md, backgroundColor: ParkingPalette.surface,
    padding: Spacing.four, gap: Spacing.three,
  },
  cardTitle: { color: ParkingPalette.ink },

  /* Capacity */
  capacityDisplay: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  capacityStat: { alignItems: 'center', gap: 4 },
  capacityLabel: { color: ParkingPalette.muted },
  capacityFreeValue: { color: ParkingPalette.success, fontSize: 40 },
  capacityOccupiedValue: { color: ParkingPalette.coral, fontSize: 40 },
  capacityOccupancyValue: { color: ParkingPalette.ink, fontSize: 40 },
  capacityDivider: { width: 1, height: 50, backgroundColor: ParkingPalette.lineSoft },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: '#EDF2F7', overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },

  /* +/- buttons */
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  minusBtn: {
    width: 72, height: 72, borderRadius: Radius.lg,
    backgroundColor: ParkingPalette.coralLight,
    alignItems: 'center', justifyContent: 'center',
  },
  minusBtnText: { fontSize: 36, fontWeight: '800', color: ParkingPalette.coral },
  plusBtn: {
    width: 72, height: 72, borderRadius: Radius.lg,
    backgroundColor: ParkingPalette.successLight,
    alignItems: 'center', justifyContent: 'center',
  },
  plusBtnText: { fontSize: 36, fontWeight: '800', color: ParkingPalette.success },
  capacityCenter: { flex: 1, alignItems: 'center' },

  /* Bulk buttons */
  bulkRow: { flexDirection: 'row', gap: Spacing.two },
  bulkBtn: {
    flex: 1, borderRadius: Radius.sm, borderWidth: 1.5, borderColor: ParkingPalette.lineSoft,
    backgroundColor: ParkingPalette.surface,
    paddingVertical: 10, alignItems: 'center',
  },
  bulkBtnText: { color: ParkingPalette.coral },
  bulkBtnTextGreen: { color: ParkingPalette.success },

  /* Pricing form */
  formRow: { flexDirection: 'row', gap: Spacing.two },
  formField: { flex: 1, gap: 6 },
  tariffField: { gap: 6 },
  formLabel: { color: ParkingPalette.muted },
  input: {
    minHeight: 46, borderRadius: Radius.sm, borderWidth: 1.5,
    borderColor: ParkingPalette.lineSoft, backgroundColor: '#F5F8FB',
    color: ParkingPalette.ink, paddingHorizontal: 14,
    fontSize: 15, fontWeight: '600',
  },
  inputMultiline: { minHeight: 80, paddingTop: 12, textAlignVertical: 'top' },
  saveBtn: {
    borderRadius: Radius.full, backgroundColor: ParkingPalette.blue,
    paddingVertical: 14, alignItems: 'center',
    ...Shadows.glow(ParkingPalette.blue),
  },
  saveBtnText: { color: '#FFFFFF' },
});
