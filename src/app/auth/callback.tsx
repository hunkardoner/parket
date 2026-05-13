import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ParkingPalette } from '@/constants/brand';
import { Spacing } from '@/constants/theme';

export default function AuthCallbackScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={ParkingPalette.blue} />
      <ThemedText type="smallBold" style={styles.text}>
        Giriş tamamlanıyor
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: '#fbfdff',
  },
  text: {
    color: ParkingPalette.ink,
  },
});
