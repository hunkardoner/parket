import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useSegments } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ParkingPalette, Shadows } from '@/constants/brand';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAuthSession } from '@/hooks/use-auth-session';

const PAGE_TITLES: Record<string, string> = {
  '(tabs)': 'Otoparklar',
  index: 'Otoparklar',
  search: 'Otopark Arıyorum',
  explore: 'Aracım',
  history: 'Geçmiş',
  manager: 'Yönetici Paneli',
  'vehicle-active': 'Aracım Burada',
};

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const router = useRouter();
  const auth = useAuthSession();

  // Determine current page title from route segments
  const lastSegment = segments[segments.length - 1] ?? 'index';
  const pageTitle = PAGE_TITLES[lastSegment] ?? 'Parket!';

  // Show back button on sub-pages
  const isSubPage = lastSegment === 'vehicle-active' || lastSegment === 'manager';

  return (
    <View style={[styles.headerContainer, { paddingTop: Platform.OS === 'web' ? 12 : insets.top }]}>
      <View style={[styles.headerInner, Shadows.sm]}>
        {/* Left: Logo or back button */}
        <View style={styles.headerLeft}>
          {isSubPage ? (
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <ThemedText style={styles.backIcon}>←</ThemedText>
            </Pressable>
          ) : (
            <View style={styles.logoBadge}>
              <ThemedText style={styles.logoIcon}>🅿️</ThemedText>
            </View>
          )}
        </View>

        {/* Center: Page title */}
        <View style={styles.headerCenter}>
          <ThemedText type="smallBold" style={styles.pageTitleText}>
            {pageTitle}
          </ThemedText>
        </View>

        {/* Right: User avatar/initials */}
        <View style={styles.headerRight}>
          {auth.isManager ? (
            <View style={styles.managerBadge}>
              <ThemedText style={styles.managerBadgeText}>⚙️</ThemedText>
            </View>
          ) : null}
          <Pressable style={styles.avatarBadge} onPress={auth.signOut}>
            <ThemedText style={styles.avatarText}>
              {(auth.user?.email?.[0] ?? 'P').toUpperCase()}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: Spacing.three,
    paddingBottom: 8,
    backgroundColor: 'rgba(245, 248, 251, 0.85)',
    backdropFilter: 'blur(16px)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 223, 233, 0.4)',
  },
  headerInner: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    gap: 12,
  },

  /* Left */
  headerLeft: { width: 40, alignItems: 'flex-start' },
  logoBadge: {
    width: 36, height: 36, borderRadius: Radius.sm,
    backgroundColor: ParkingPalette.blueGlow,
    alignItems: 'center', justifyContent: 'center',
  },
  logoIcon: { fontSize: 20 },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: ParkingPalette.lineSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 18, color: ParkingPalette.ink, fontWeight: '700' },

  /* Center */
  headerCenter: { flex: 1, alignItems: 'center' },
  pageTitleText: {
    color: ParkingPalette.ink,
    fontSize: 16,
    letterSpacing: -0.3,
  },

  /* Right */
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  managerBadge: {
    width: 28, height: 28, borderRadius: Radius.full,
    backgroundColor: ParkingPalette.amberLight,
    alignItems: 'center', justifyContent: 'center',
  },
  managerBadgeText: { fontSize: 14 },
  avatarBadge: {
    width: 36, height: 36, borderRadius: Radius.full,
    backgroundColor: ParkingPalette.blue,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
