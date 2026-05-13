import {
  View
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { styles } from './style';

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
