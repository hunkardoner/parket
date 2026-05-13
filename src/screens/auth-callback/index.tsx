import {
  ActivityIndicator,
  View
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { activityIndicatorColor, styles } from './style';

export default function AuthCallbackScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={activityIndicatorColor} />
      <ThemedText type="smallBold" style={styles.text}>
        Giriş tamamlanıyor
      </ThemedText>
    </View>
  );
}
