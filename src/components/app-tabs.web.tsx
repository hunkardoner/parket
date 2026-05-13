import { TabList, TabListProps, Tabs, TabSlot, TabTrigger, TabTriggerSlotProps, } from 'expo-router/ui';
import { Pressable, View } from 'react-native';
import { styles } from './app-tabs/style.web';

import { ThemedText } from './themed-text';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.tabSlot} />
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
          <TabTrigger name="history" href="/history" asChild>
            <TabButton>Geçmiş</TabButton>
          </TabTrigger>
          <TabTrigger name="manager" href="/manager" asChild>
            <TabButton>Yönetici</TabButton>
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
      <View style={[styles.innerContainer, styles.shadowMd]}>
        <ThemedText type="smallBold" style={styles.brandText}>
          🅿️ Parket!
        </ThemedText>
        {props.children}
      </View>
    </View>
  );
}
