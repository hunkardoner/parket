import { ReactNode, useCallback, useState } from 'react';
import * as Location from 'expo-location';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { saveLastKnownLocation } from '@/services/location-store';

import { styles } from './style';

type OnboardingScreenProps = {
  onComplete: () => Promise<void>;
};

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [isRequesting, setRequesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const requestLocation = useCallback(async () => {
    setRequesting(true);
    setMessage(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status === 'granted') {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        await saveLastKnownLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        await onComplete();
        return;
      }
      setMessage('Konum izni verilmedi. Yakındaki 3 otopark için daha sonra tekrar soracağız.');
    } finally {
      setRequesting(false);
    }
  }, [onComplete]);

  return (
    <AuthShell>
      <View style={styles.brandHero}>
        <View style={styles.brandHeroInner}>
          <ThemedText type="overline" style={styles.brandOverline}>
            Onboarding
          </ThemedText>
          <ThemedText type="title" style={styles.brandTitle}>
            Park et, bul, geri dön.
          </ThemedText>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.onboardingCards}>
        <OnboardingCard
          icon="📍"
          title="En yakın 3 İSPARK"
          body="Girişte konum izniyle sana bütün liste yerine yakın ve anlamlı sonuçları gösterir."
        />
        <OnboardingCard
          icon="🅿️"
          title="Aracımı park ettim"
          body="Sokakta veya otoparkta park ettiğin noktayı kaydet, dönüşte yürüyüş rotasını aç."
        />
        <OnboardingCard
          icon="🟢"
          title="Boş yer bildir"
          body="Yanında boş yer varsa paylaş; sokakta park arayanlar seçtikleri metre aralığında görsün."
        />
      </ScrollView>

      <View style={[styles.permissionCard, styles.shadowSm]}>
        <ThemedText type="smallBold" style={styles.permissionTitle}>
          Konum izni
        </ThemedText>
        <ThemedText style={styles.permissionText}>
          Parket açılışta konum izni ister. Kamera izni ise yalnızca park yerinin fotoğrafını çekmek
          istediğinde sorulur.
        </ThemedText>
        <Pressable style={styles.primaryBtn} onPress={requestLocation} disabled={isRequesting}>
          <ThemedText type="smallBold" style={styles.primaryBtnText}>
            {isRequesting ? 'Konum alınıyor...' : 'Konum iznini ver ve başla'}
          </ThemedText>
        </Pressable>
        {message ? (
          <>
            <ThemedText type="small" style={styles.formMsg}>
              {message}
            </ThemedText>
            <Pressable style={styles.demoBtn} onPress={onComplete}>
              <ThemedText type="smallBold" style={styles.demoBtnText}>
                Konumsuz devam et
              </ThemedText>
            </Pressable>
          </>
        ) : null}
      </View>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.authRoot}>
      <ScrollView contentContainerStyle={styles.authScroll}>
        <SafeAreaView style={styles.authSafeArea}>{children}</SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function OnboardingCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <View style={[styles.onboardingCard, styles.shadowSm]}>
      <ThemedText style={styles.onboardingIcon}>{icon}</ThemedText>
      <ThemedText type="smallBold" style={styles.onboardingTitle}>
        {title}
      </ThemedText>
      <ThemedText type="small" style={styles.onboardingBody}>
        {body}
      </ThemedText>
    </View>
  );
}

export default OnboardingScreen;
