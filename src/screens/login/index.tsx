import { ReactNode, useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LegalContent, LegalKind } from '@/components/legal-content';
import { ThemedText } from '@/components/themed-text';
import { useAuthSession } from '@/hooks/use-auth-session';

import { inputPlaceholderColor, styles } from './style';

type AuthMode = 'login' | 'register' | 'forgot' | LegalKind;

type LoginScreenProps = {
  auth: ReturnType<typeof useAuthSession>;
};

export function LoginScreen({ auth }: LoginScreenProps) {
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
        const result = await auth.signUpWithEmail(email.trim(), password);
        if (result === 'duplicate') {
          setMode('login');
          setPassword('');
        }
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
        <Pressable style={styles.backBtn} onPress={() => setMode('login')}>
          <ThemedText type="smallBold" style={styles.backBtnText}>
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
      <View style={styles.brandHero}>
        <View style={styles.brandHeroInner}>
          <ThemedText type="overline" style={styles.brandOverline}>
            İstanbul park asistanı
          </ThemedText>
          <ThemedText type="title" style={styles.brandTitle}>
            Parket!
          </ThemedText>
          <ThemedText style={styles.brandCopy}>
            Yakındaki İSPARK otoparklarını, sokak park sinyallerini ve aracına dönüş rotasını
            tek ekrandan yönet.
          </ThemedText>
        </View>
      </View>

      <View style={[styles.formCard, styles.shadowMd]}>
        <ThemedText type="subtitle" style={styles.formTitle}>
          {title}
        </ThemedText>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="E-posta"
          placeholderTextColor={inputPlaceholderColor}
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
            placeholderTextColor={inputPlaceholderColor}
            secureTextEntry
            style={styles.input}
          />
        ) : null}

        <Pressable style={styles.primaryBtn} onPress={submit} disabled={isSubmitting}>
          <ThemedText type="smallBold" style={styles.primaryBtnText}>
            {isSubmitting ? 'İşleniyor...' : cta}
          </ThemedText>
        </Pressable>

        {mode === 'login' ? (
          <View style={styles.oauthRow}>
            <Pressable style={styles.oauthBtn} onPress={auth.signInWithGoogle}>
              <ThemedText type="smallBold" style={styles.oauthText}>
                Google ile giriş
              </ThemedText>
            </Pressable>
            {auth.isAppleAvailable ? (
              <Pressable style={[styles.oauthBtn, styles.appleBtn]} onPress={auth.signInWithApple}>
                <ThemedText type="smallBold" style={styles.appleText}>
                  Apple ile giriş
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {!auth.isConfigured ? (
          <Pressable style={styles.demoBtn} onPress={() => auth.continueAsDemo()}>
            <ThemedText type="smallBold" style={styles.demoBtnText}>
              Demo olarak devam et
            </ThemedText>
          </Pressable>
        ) : null}

        {auth.message ? (
          <ThemedText type="small" style={styles.formMsg}>
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
            <ThemedText type="caption" style={styles.legalText}>
              Kullanım Şartları
            </ThemedText>
          </Pressable>
          <Pressable onPress={() => setMode('privacy')}>
            <ThemedText type="caption" style={styles.legalText}>
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

export default LoginScreen;
