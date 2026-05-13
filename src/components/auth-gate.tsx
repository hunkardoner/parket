import { ReactNode, useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { usePathname, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LegalContent, LegalKind } from '@/components/legal-content';
import { ThemedText } from '@/components/themed-text';
import { ParkingPalette } from '@/constants/brand';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuthSession } from '@/hooks/use-auth-session';
import { saveLastKnownLocation } from '@/services/location-store';

const ONBOARDING_KEY = 'parket:onboarding-complete';

type AuthMode = 'login' | 'register' | 'forgot' | LegalKind;

export function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuthSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isCheckingOnboarding, setCheckingOnboarding] = useState(true);
  const [isOnboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((value) => setOnboardingComplete(value === 'true'))
      .finally(() => setCheckingOnboarding(false));
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setOnboardingComplete(true);
  }, []);

  useEffect(() => {
    if (auth.hasAuthenticatedAccess && pathname.startsWith('/auth/')) {
      router.replace('/');
    }
  }, [auth.hasAuthenticatedAccess, pathname, router]);

  if (auth.isLoading || isCheckingOnboarding) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={ParkingPalette.blue} />
        <ThemedText type="small">Parket açılıyor</ThemedText>
      </View>
    );
  }

  if (!auth.hasAuthenticatedAccess) {
    return <AuthScreen auth={auth} />;
  }

  if (!isOnboardingComplete) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  return <>{children}</>;
}

function AuthScreen({ auth }: { auth: ReturnType<typeof useAuthSession> }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const submit = useCallback(async () => {
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await auth.signInWithEmail(email.trim(), password);
      }
      if (mode === 'register') {
        await auth.signUpWithEmail(email.trim(), password);
      }
      if (mode === 'forgot') {
        await auth.resetPassword(email.trim());
      }
    } finally {
      setSubmitting(false);
    }
  }, [auth, email, mode, password]);

  if (mode === 'terms' || mode === 'privacy') {
    return (
      <AuthShell>
        <Pressable style={styles.backButton} onPress={() => setMode('login')}>
          <ThemedText type="smallBold" style={styles.backButtonText}>
            Geri
          </ThemedText>
        </Pressable>
        <LegalContent kind={mode} />
      </AuthShell>
    );
  }

  const title =
    mode === 'login' ? 'Giriş yap' : mode === 'register' ? 'Hesap oluştur' : 'Şifremi unuttum';
  const cta =
    mode === 'login' ? 'Giriş yap' : mode === 'register' ? 'Kayıt ol' : 'Sıfırlama bağlantısı gönder';

  return (
    <AuthShell>
      <View style={styles.brandBlock}>
        <ThemedText style={styles.eyebrow}>İstanbul park asistanı</ThemedText>
        <ThemedText type="title" style={styles.brandTitle}>
          Parket!
        </ThemedText>
        <ThemedText style={styles.brandCopy}>
          Yakındaki İSPARK otoparklarını, sokak park sinyallerini ve aracına dönüş rotasını tek
          ekrandan yönet.
        </ThemedText>
      </View>

      <View style={styles.formCard}>
        <ThemedText type="subtitle" style={styles.formTitle}>
          {title}
        </ThemedText>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="E-posta"
          placeholderTextColor="#7a8790"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        {mode !== 'forgot' ? (
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Şifre"
            placeholderTextColor="#7a8790"
            secureTextEntry
            style={styles.input}
          />
        ) : null}

        <Pressable style={styles.primaryButton} onPress={submit} disabled={isSubmitting}>
          <ThemedText type="smallBold" style={styles.primaryButtonText}>
            {isSubmitting ? 'İşleniyor' : cta}
          </ThemedText>
        </Pressable>

        {mode === 'login' ? (
          <View style={styles.oauthRow}>
            <Pressable style={styles.oauthButton} onPress={auth.signInWithGoogle}>
              <ThemedText type="smallBold" style={styles.oauthText}>
                Google ile giriş
              </ThemedText>
            </Pressable>
            {auth.isAppleAvailable ? (
              <Pressable style={[styles.oauthButton, styles.appleButton]} onPress={auth.signInWithApple}>
                <ThemedText type="smallBold" style={styles.appleText}>
                  Apple ile giriş
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {!auth.isConfigured ? (
          <Pressable style={styles.demoButton} onPress={() => auth.continueAsDemo()}>
            <ThemedText type="smallBold" style={styles.demoButtonText}>
              Demo olarak devam et
            </ThemedText>
          </Pressable>
        ) : null}

        {auth.message ? (
          <ThemedText type="small" style={styles.formMessage}>
            {auth.message}
          </ThemedText>
        ) : null}

        <View style={styles.switcher}>
          <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
            <ThemedText type="smallBold" style={styles.linkText}>
              {mode === 'login' ? 'Hesap oluştur' : 'Girişe dön'}
            </ThemedText>
          </Pressable>
          <Pressable onPress={() => setMode('forgot')}>
            <ThemedText type="smallBold" style={styles.linkText}>
              Şifremi unuttum
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.legalRow}>
          <Pressable onPress={() => setMode('terms')}>
            <ThemedText type="small" style={styles.legalText}>
              Kullanım Şartları
            </ThemedText>
          </Pressable>
          <Pressable onPress={() => setMode('privacy')}>
            <ThemedText type="small" style={styles.legalText}>
              Gizlilik Politikası
            </ThemedText>
          </Pressable>
        </View>
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

function OnboardingScreen({ onComplete }: { onComplete: () => Promise<void> }) {
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
      <View style={styles.brandBlock}>
        <ThemedText style={styles.eyebrow}>Onboarding</ThemedText>
        <ThemedText type="title" style={styles.brandTitle}>
          Park et, bul, geri dön.
        </ThemedText>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.onboardingCards}>
        <OnboardingCard
          title="En yakın 3 İSPARK"
          body="Girişte konum izniyle sana bütün liste yerine yakın ve anlamlı sonuçları gösterir."
        />
        <OnboardingCard
          title="Aracımı park ettim"
          body="Sokakta veya otoparkta park ettiğin noktayı kaydet, dönüşte yürüyüş rotasını aç."
        />
        <OnboardingCard
          title="Boş yer bildir"
          body="Yanında boş yer varsa paylaş; sokakta park arayanlar seçtikleri metre aralığında görsün."
        />
      </ScrollView>

      <View style={styles.permissionCard}>
        <ThemedText type="smallBold" style={styles.permissionTitle}>
          Konum izni
        </ThemedText>
        <ThemedText style={styles.permissionText}>
          Parket açılışta konum izni ister. Kamera izni ise yalnızca park yerinin fotoğrafını çekmek
          istediğinde sorulur.
        </ThemedText>
        <Pressable style={styles.primaryButton} onPress={requestLocation} disabled={isRequesting}>
          <ThemedText type="smallBold" style={styles.primaryButtonText}>
            {isRequesting ? 'Konum alınıyor' : 'Konum iznini ver ve başla'}
          </ThemedText>
        </Pressable>
        {message ? (
          <>
            <ThemedText type="small" style={styles.formMessage}>
              {message}
            </ThemedText>
            <Pressable style={styles.demoButton} onPress={onComplete}>
              <ThemedText type="smallBold" style={styles.demoButtonText}>
                Konumsuz devam et
              </ThemedText>
            </Pressable>
          </>
        ) : null}
      </View>
    </AuthShell>
  );
}

function OnboardingCard({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.onboardingCard}>
      <ThemedText type="smallBold" style={styles.onboardingTitle}>
        {title}
      </ThemedText>
      <ThemedText type="small" style={styles.onboardingBody}>
        {body}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: '#fbfdff',
  },
  authRoot: {
    flex: 1,
    backgroundColor: '#fbfdff',
  },
  authScroll: {
    alignItems: 'center',
    paddingBottom: Spacing.five,
  },
  authSafeArea: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  brandBlock: {
    gap: Spacing.one,
  },
  eyebrow: {
    color: ParkingPalette.violet,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  brandTitle: {
    color: ParkingPalette.ink,
    fontSize: 42,
    lineHeight: 46,
  },
  brandCopy: {
    color: '#4d5963',
  },
  formCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    backgroundColor: '#ffffff',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  formTitle: {
    color: ParkingPalette.ink,
    fontSize: 28,
    lineHeight: 34,
  },
  input: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    backgroundColor: '#f7fbfd',
    color: ParkingPalette.ink,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: ParkingPalette.blue,
    paddingHorizontal: 16,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  oauthRow: {
    gap: Spacing.two,
  },
  oauthButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  oauthText: {
    color: ParkingPalette.blue,
  },
  appleButton: {
    backgroundColor: ParkingPalette.ink,
    borderColor: ParkingPalette.ink,
  },
  appleText: {
    color: '#ffffff',
  },
  demoButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d7c0ef',
    backgroundColor: '#fbf8ff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  demoButtonText: {
    color: ParkingPalette.violet,
  },
  formMessage: {
    color: '#6f7780',
  },
  switcher: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  linkText: {
    color: ParkingPalette.blue,
  },
  legalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: '#edf2f5',
    paddingTop: Spacing.two,
  },
  legalText: {
    color: '#687783',
  },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backButtonText: {
    color: ParkingPalette.ink,
  },
  onboardingCards: {
    gap: Spacing.two,
    paddingRight: Spacing.three,
  },
  onboardingCard: {
    width: 250,
    minHeight: 148,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ParkingPalette.line,
    backgroundColor: '#ffffff',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  onboardingTitle: {
    color: ParkingPalette.ink,
    fontSize: 18,
  },
  onboardingBody: {
    color: '#5c6872',
  },
  permissionCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3c986',
    backgroundColor: ParkingPalette.sand,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  permissionTitle: {
    color: ParkingPalette.ink,
    fontSize: 18,
  },
  permissionText: {
    color: '#4d5963',
  },
});
