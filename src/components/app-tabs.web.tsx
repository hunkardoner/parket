import { TabList, TabListProps, Tabs, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, View } from 'react-native';
import { styles } from './app-tabs/style.web';

import { AppHeader } from './app-header';
import { ThemedText } from './themed-text';

const TABS: { name: string; href: string; label: string; icon: string }[] = [
  { name: 'home', href: '/', label: 'Otoparklar', icon: '🅿️' },
  { name: 'search', href: '/search', label: 'Ara', icon: '🔍' },
  { name: 'explore', href: '/explore', label: 'Aracım', icon: '🚗' },
  { name: 'history', href: '/history', label: 'Geçmiş', icon: '⭐' },
];

export default function AppTabs() {
  return (
    <Tabs>
      {/* Header at top */}
      <AppHeader />

      {/* Page content */}
      <TabSlot style={styles.tabSlot} />

      {/* Bottom navbar */}
      <TabList asChild>
        <BottomNavBar>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href as any} asChild>
              <NavBarItem icon={tab.icon}>{tab.label}</NavBarItem>
            </TabTrigger>
          ))}
        </BottomNavBar>
      </TabList>
    </Tabs>
  );
}

export function NavBarItem({ children, icon, isFocused, ...props }: TabTriggerSlotProps & { icon: string }) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <View style={[styles.navItem, isFocused && styles.navItemActive]}>
        <ThemedText style={[styles.navIcon, isFocused && styles.navIconActive]}>
          {icon}
        </ThemedText>
        <ThemedText
          type="caption"
          style={[styles.navLabel, isFocused && styles.navLabelActive]}>
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function BottomNavBar(props: TabListProps) {
  return (
    <View {...props} style={styles.navBarContainer}>
      <View style={styles.navBarInner}>
        {props.children}
      </View>
    </View>
  );
}
