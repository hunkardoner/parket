import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { ParkingPalette, Shadows } from '@/constants/brand';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Otoparklar</TabButton>
          </TabTrigger>
          <TabTrigger name="search" href="/search" asChild>
            <TabButton>Otopark arıyorum</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>Aracım</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <View style={[styles.tabBtn, isFocused && styles.tabBtnActive]}>
        <ThemedText
          type="smallBold"
          style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={[styles.innerContainer, Shadows.md]}>
        <ThemedText type="smallBold" style={styles.brandText}>
          🅿️ Parket!
        </ThemedText>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
