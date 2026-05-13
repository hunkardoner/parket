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
import { ParkingPalette, Shadows } from '@/constants/brand';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
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
        <ActivityIndicator color={ParkingPalette.blue} size="large" />
        <ThemedText type="small" style={{ color: ParkingPalette.muted }}>Parket açılıyor…</ThemedText>
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
      if (mode === 'login') await auth.signInWithEmail(email.trim(), password);
      if (mode === 'register') await auth.signUpWithEmail(email.trim(), password);
      if (mode === 'forgot') await auth.resetPassword(email.trim());
    } finally { setSubmitting(false); }
  }, [auth, email, mode, password]);

  if (mode === 'terms' || mode === 'privacy') {
    return (
      <AuthShell>
        <Pressable style={styles.backBtn} onPress={() => setMode('login')}>
          <ThemedText type="smallBold" style={styles.backBtnText}>← Geri</ThemedText>
        </Pressable>
        <LegalContent kind={mode} />
      </AuthShell>
    );
  }

  const title = mode === 'login' ? 'Giriş yap' : mode === 'register' ? 'Hesap oluştur' : 'Şifremi unuttum';
  const cta = mode === 'login' ? 'Giriş yap' : mode === 'register' ? 'Kayıt ol' : 'Sıfırlama bağlantısı gönder';

  return (
    <AuthShell>
      {/* ── Brand hero ── */}
      <View style={styles.brandHero}>
        <View style={styles.brandHeroInner}>
          <ThemedText type="overline" style={styles.brandOverline}>İstanbul park asistanı</ThemedText>
          <ThemedText type="title" style={styles.brandTitle}>Parket!</ThemedText>
          <ThemedText style={styles.brandCopy}>
            Yakındaki İSPARK otoparklarını, sokak park sinyallerini ve aracına dönüş rotasını tek ekrandan yönet.
          </ThemedText>
        </View>
      </View>

      {/* ── Form ── */}
      <View style={[styles.formCard, Shadows.md]}>
        <ThemedText type="subtitle" style={styles.formTitle}>{title}</ThemedText>

        <TextInput
          value={email} onChangeText={setEmail}
          placeholder="E-posta" placeholderTextColor={ParkingPalette.muted}
          keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
          style={styles.input}
        />
        {mode !== 'forgot' ? (
          <TextInput
            value={password} onChangeText={setPassword}
            placeholder="Şifre" placeholderTextColor={ParkingPalette.muted}
            secureTextEntry style={styles.input}
          />
        ) : null}

        <Pressable style={styles.primaryBtn} onPress={submit} disabled={isSubmitting}>
          <ThemedText type="smallBold" style={styles.primaryBtnText}>
            {isSubmitting ? '⏳ İşleniyor…' : cta}
          </ThemedText>
        </Pressable>

        {mode === 'login' ? (
          <View style={styles.oauthRow}>
            <Pressable style={styles.oauthBtn} onPress={auth.signInWithGoogle}>
              <ThemedText type="smallBold" style={styles.oauthText}>Google ile giriş</ThemedText>
            </Pressable>
            {auth.isAppleAvailable ? (
              <Pressable style={[styles.oauthBtn, styles.appleBtn]} onPress={auth.signInWithApple}>
                <ThemedText type="smallBold" style={styles.appleText}> Apple ile giriş</ThemedText>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {!auth.isConfigured ? (
          <Pressable style={styles.demoBtn} onPress={() => auth.continueAsDemo()}>
            <ThemedText type="smallBold" style={styles.demoBtnText}>🎭  Demo olarak devam et</ThemedText>
          </Pressable>
        ) : null}

        {auth.message ? (
          <ThemedText type="small" style={styles.formMsg}>{auth.message}</ThemedText>
        ) : null}

        <View style={styles.switcher}>
          <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
            <ThemedText type="smallBold" style={styles.linkText}>
              {mode === 'login' ? 'Hesap oluştur' : 'Girişe dön'}
            </ThemedText>
          </Pressable>
          <Pressable onPress={() => setMode('forgot')}>
            <ThemedText type="smallBold" style={styles.linkText}>Şifremi unuttum</ThemedText>
          </Pressable>
        </View>

        <View style={styles.legalRow}>
          <Pressable onPress={() => setMode('terms')}>
            <ThemedText type="caption" style={styles.legalText}>Kullanım Şartları</ThemedText>
          </Pressable>
          <Pressable onPress={() => setMode('privacy')}>
            <ThemedText type="caption" style={styles.legalText}>Gizlilik Politikası</ThemedText>
          </Pressable>
        </View>
      </View>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.authRoot}>
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
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await saveLastKnownLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        await onComplete();
        return;
      }
      setMessage('Konum izni verilmedi. Yakındaki 3 otopark için daha sonra tekrar soracağız.');
    } finally { setRequesting(false); }
  }, [onComplete]);

  return (
    <AuthShell>
      <View style={styles.brandHero}>
        <View style={styles.brandHeroInner}>
          <ThemedText type="overline" style={styles.brandOverline}>Onboarding</ThemedText>
          <ThemedText type="title" style={styles.brandTitle}>Park et, bul, geri dön.</ThemedText>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.onboardingCards}>
        <OnboardingCard icon="📍" title="En yakın 3 İSPARK" body="Girişte konum izniyle sana bütün liste yerine yakın ve anlamlı sonuçları gösterir." />
        <OnboardingCard icon="🅿️" title="Aracımı park ettim" body="Sokakta veya otoparkta park ettiğin noktayı kaydet, dönüşte yürüyüş rotasını aç." />
        <OnboardingCard icon="🟢" title="Boş yer bildir" body="Yanında boş yer varsa paylaş; sokakta park arayanlar seçtikleri metre aralığında görsün." />
      </ScrollView>

      <View style={[styles.permissionCard, Shadows.sm]}>
        <ThemedText type="smallBold" style={{ color: ParkingPalette.ink, fontSize: 16 }}>📍  Konum izni</ThemedText>
        <ThemedText style={styles.permissionText}>
          Parket açılışta konum izni ister. Kamera izni ise yalnızca park yerinin fotoğrafını çekmek istediğinde sorulur.
        </ThemedText>
        <Pressable style={styles.primaryBtn} onPress={requestLocation} disabled={isRequesting}>
          <ThemedText type="smallBold" style={styles.primaryBtnText}>
            {isRequesting ? '⏳ Konum alınıyor…' : '📍 Konum iznini ver ve başla'}
          </ThemedText>
        </Pressable>
        {message ? (
          <>
            <ThemedText type="small" style={styles.formMsg}>{message}</ThemedText>
            <Pressable style={styles.demoBtn} onPress={onComplete}>
              <ThemedText type="smallBold" style={styles.demoBtnText}>Konumsuz devam et</ThemedText>
            </Pressable>
          </>
        ) : null}
      </View>
    </AuthShell>
  );
}

function OnboardingCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <View style={[styles.onboardingCard, Shadows.sm]}>
      <ThemedText style={styles.onboardingIcon}>{icon}</ThemedText>
      <ThemedText type="smallBold" style={{ color: ParkingPalette.ink, fontSize: 16 }}>{title}</ThemedText>
      <ThemedText type="small" style={{ color: ParkingPalette.muted }}>{body}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: Spacing.three, backgroundColor: '#F0F4F8',
  },
  authRoot: { flex: 1, backgroundColor: '#F0F4F8' },
  authScroll: { alignItems: 'center', paddingBottom: Spacing.six },
  authSafeArea: {
    width: '100%', maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three, paddingTop: Spacing.four, gap: Spacing.three,
  },

  /* Brand hero */
  brandHero: {
    borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: ParkingPalette.ink,
  },
  brandHeroInner: {
    padding: Spacing.four, gap: 8,
    experimental_backgroundImage: ParkingPalette.gradientHero,
  },
  brandOverline: { color: ParkingPalette.blueLight },
  brandTitle: { color: '#FFFFFF', fontSize: 36, lineHeight: 42 },
  brandCopy: { color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 20 },

  /* Form */
  formCard: {
    borderRadius: Radius.md, backgroundColor: ParkingPalette.surface,
    padding: Spacing.four, gap: Spacing.two,
  },
  formTitle: { color: ParkingPalette.ink, marginBottom: 4 },
  input: {
    minHeight: 50, borderRadius: Radius.sm, borderWidth: 1.5,
    borderColor: ParkingPalette.lineSoft, backgroundColor: '#F5F8FB',
    color: ParkingPalette.ink, paddingHorizontal: 16,
    fontSize: 15, fontWeight: '600',
  },
  primaryBtn: {
    borderRadius: Radius.full, backgroundColor: ParkingPalette.blue,
    paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center',
    marginTop: 4, ...Shadows.glow(ParkingPalette.blue),
  },
  primaryBtnText: { color: '#FFFFFF' },
  oauthRow: { gap: Spacing.two },
  oauthBtn: {
    borderRadius: Radius.sm, borderWidth: 1.5, borderColor: ParkingPalette.lineSoft,
    backgroundColor: ParkingPalette.surface,
    paddingHorizontal: 16, paddingVertical: 13, alignItems: 'center',
  },
  oauthText: { color: ParkingPalette.ink },
  appleBtn: { backgroundColor: ParkingPalette.ink, borderColor: ParkingPalette.ink },
  appleText: { color: '#FFFFFF' },
  demoBtn: {
    borderRadius: Radius.sm, borderWidth: 1.5, borderColor: ParkingPalette.violetLight,
    backgroundColor: '#F9F7FF', paddingHorizontal: 16, paddingVertical: 13, alignItems: 'center',
  },
  demoBtnText: { color: ParkingPalette.violet },
  formMsg: { color: ParkingPalette.muted },
  switcher: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  linkText: { color: ParkingPalette.blue },
  legalRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three,
    borderTopWidth: 1, borderTopColor: ParkingPalette.lineSoft, paddingTop: Spacing.two,
  },
  legalText: { color: ParkingPalette.muted },

  /* Back */
  backBtn: {
    alignSelf: 'flex-start', borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: ParkingPalette.lineSoft,
    backgroundColor: ParkingPalette.surface,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  backBtnText: { color: ParkingPalette.ink },

  /* Onboarding */
  onboardingCards: { gap: Spacing.two, paddingRight: Spacing.three },
  onboardingCard: {
    width: 240, minHeight: 160, borderRadius: Radius.md,
    backgroundColor: ParkingPalette.surface,
    padding: Spacing.three, gap: Spacing.two,
  },
  onboardingIcon: { fontSize: 28 },

  /* Permission */
  permissionCard: {
    borderRadius: Radius.md, backgroundColor: ParkingPalette.surface,
    padding: Spacing.four, gap: Spacing.two,
  },
  permissionText: { color: ParkingPalette.muted, fontSize: 14, lineHeight: 20 },
});
