/**
 * Parket! brand palette — curated for a premium parking assistant.
 *
 * We use HSL-derived values to keep the palette harmonious while
 * supporting both light and dark surfaces.
 */
export const ParkingPalette = {
  /* ── Primary teal-blue gradient endpoints ── */
  blue: '#2E8BC0',
  blueLight: '#5BADD6',
  blueDark: '#1A6FA0',
  blueGlow: 'rgba(46, 139, 192, 0.25)',

  /* ── Accent ── */
  amber: '#FFB347',
  amberLight: '#FFDEA2',
  coral: '#EF6461',
  coralLight: '#FDCFCE',
  violet: '#7C5CFC',
  violetLight: '#C7B8FF',
  violetDark: '#5A3EC8',

  /* ── Semantic ── */
  success: '#22C67C',
  successLight: '#D0F5E2',
  warning: '#FFCF47',
  warningLight: '#FFF3D0',
  danger: '#EF6461',
  dangerLight: '#FDCFCE',

  /* ── Neutrals ── */
  ink: '#0F1B2D',
  inkSecondary: '#3C4F63',
  muted: '#7B8FA3',
  mist: '#E8F0F7',
  sand: '#F8EDD8',
  line: '#D4DFE9',
  lineSoft: '#EDF2F7',

  /* ── Surfaces ── */
  surface: '#FFFFFF',
  surfaceElevated: '#F7FAFC',
  surfaceOverlay: 'rgba(15, 27, 45, 0.55)',

  /* ── Gradients (as CSS linear-gradient arguments) ── */
  gradientPrimary: 'linear-gradient(135deg, #2E8BC0 0%, #5BADD6 100%)',
  gradientViolet: 'linear-gradient(135deg, #7C5CFC 0%, #A78BFA 100%)',
  gradientCoral: 'linear-gradient(135deg, #EF6461 0%, #F7918F 100%)',
  gradientDark: 'linear-gradient(145deg, #0F1B2D 0%, #1B3048 100%)',
  gradientHero: 'linear-gradient(160deg, #0F1B2D 0%, #1A3A5C 40%, #2E8BC0 100%)',
} as const;

export const IstanbulCenter = {
  latitude: 41.0082,
  longitude: 28.9784,
  latitudeDelta: 0.34,
  longitudeDelta: 0.34,
} as const;

/** Shadow presets for elevated cards */
export const Shadows = {
  sm: {
    shadowColor: '#0F1B2D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F1B2D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F1B2D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  }),
} as const;
