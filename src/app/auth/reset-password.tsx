import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ParkingPalette } from '@/constants/brand';
import { Spacing } from '@/constants/theme';

export default function ResetPasswordScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Şifre sıfırlama
      </ThemedText>
      <ThemedText style={styles.text}>
        Sıfırlama bağlantısı doğrulandıktan sonra yeni şifre formu burada gösterilecek.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.three,
    gap: Spacing.two,
    backgroundColor: '#fbfdff',
  },
  title: {
    color: ParkingPalette.ink,
  },
  text: {
    color: '#4d5963',
  },
});
