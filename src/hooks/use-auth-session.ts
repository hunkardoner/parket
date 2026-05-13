import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const DEMO_SESSION_KEY = 'parket:demo-session';

export type AuthUser = Pick<User, 'id' | 'email'> & Partial<User>;

function extractParam(url: string, key: string) {
  const query = url.includes('#') ? url.split('#')[1] : url.split('?')[1];
  if (!query) {
    return null;
  }

  return query.split('&').reduce<string | null>((value, pair) => {
    if (value) {
      return value;
    }
    const [rawKey, rawValue] = pair.split('=');
    return decodeURIComponent(rawKey) === key ? decodeURIComponent(rawValue ?? '') : null;
  }, null);
}

export async function completeOAuthFromUrl(url: string) {
  if (!supabase) {
    return;
  }

  const code = extractParam(url, 'code');
  const accessToken = extractParam(url, 'access_token');
  const refreshToken = extractParam(url, 'refresh_token');

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw error;
    }
    return;
  }

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      throw error;
    }
  }
}

function makeNonce() {
  return Array.from(Crypto.getRandomBytes(16))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [demoUser, setDemoUser] = useState<AuthUser | null>(null);
  const [isAppleAvailable, setAppleAvailable] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const storedDemo = await AsyncStorage.getItem(DEMO_SESSION_KEY);
      if (storedDemo && isMounted) {
        setDemoUser(JSON.parse(storedDemo) as AuthUser);
      }

      if (!supabase) {
        if (isMounted) {
          setLoading(false);
          setMessage('Supabase env tanımlı değil; auth demo modda çalışır.');
        }
        return;
      }

      try {
        const currentUrl =
          Platform.OS === 'web' && typeof window !== 'undefined'
            ? window.location.href
            : await Linking.getInitialURL();

        if (currentUrl) {
          await completeOAuthFromUrl(currentUrl);
        }
      } catch (oauthError) {
        if (isMounted) {
          setMessage(oauthError instanceof Error ? oauthError.message : 'OAuth dönüşü işlenemedi.');
        }
      }

      const { data } = await supabase.auth.getSession();
      if (isMounted) {
        setSession(data.session);
        setLoading(false);
      }
    }

    void loadSession();

    const { data } =
      supabase?.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
      }) ?? {};

    return () => {
      isMounted = false;
      data?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => {
      setAppleAvailable(false);
    });
  }, []);

  const continueAsDemo = useCallback(async (email = 'demo@parket.local') => {
    const nextUser: AuthUser = {
      id: `demo-${Date.now()}`,
      email,
      app_metadata: {},
      user_metadata: { name: 'Parket Demo' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };
    await AsyncStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(nextUser));
    setDemoUser(nextUser);
    setMessage(null);
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setMessage(null);

      if (!email || !password) {
        setMessage('E-posta ve şifre gerekli.');
        return false;
      }

      if (!supabase) {
        await continueAsDemo(email);
        return true;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
        return false;
      }

      return true;
    },
    [continueAsDemo]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string): Promise<'ok' | 'duplicate' | 'error'> => {
      setMessage(null);

      if (!email || password.length < 6) {
        setMessage('Kayıt için geçerli e-posta ve en az 6 karakter şifre gerekli.');
        return 'error';
      }

      if (!supabase) {
        await continueAsDemo(email);
        setMessage('Demo modda kayıt tamamlandı.');
        return 'ok';
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        // Supabase may return user_already_exists or similar errors
        const isDuplicate =
          error.message?.toLowerCase().includes('already') ||
          error.message?.toLowerCase().includes('user_already_exists');
        if (isDuplicate) {
          setMessage('Bu e-posta zaten sistemde kayıtlı. Giriş yap ekranından devam edebilirsin.');
          return 'duplicate';
        }
        setMessage(error.message);
        return 'error';
      }

      // When email confirmation is enabled, Supabase returns a user with empty
      // identities array if the email already exists (instead of an error).
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setMessage('Bu e-posta zaten sistemde kayıtlı. Giriş yap ekranından devam edebilirsin.');
        return 'duplicate';
      }

      setMessage('Kayıt oluşturuldu. E-posta doğrulaması açıksa gelen kutunu kontrol et.');
      return 'ok';
    },
    [continueAsDemo]
  );

  const resetPassword = useCallback(async (email: string) => {
    setMessage(null);

    if (!email) {
      setMessage('Şifre sıfırlama için e-posta gerekli.');
      return false;
    }

    if (!supabase) {
      setMessage('Demo modda şifre sıfırlama e-postası gönderilmez.');
      return true;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Linking.createURL('/auth/reset-password'),
    });
    if (error) {
      setMessage(error.message);
      return false;
    }

    setMessage('Şifre sıfırlama bağlantısı e-postana gönderildi.');
    return true;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setMessage(null);

    if (!supabase) {
      setMessage('Google login için EXPO_PUBLIC_SUPABASE_URL ve ANON_KEY gerekli.');
      return;
    }

    const redirectTo = Linking.createURL('/auth/callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (!data.url) {
      setMessage('Google auth URL üretilemedi.');
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success') {
      await completeOAuthFromUrl(result.url);
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    setMessage(null);

    if (!supabase) {
      setMessage('Apple Sign in için EXPO_PUBLIC_SUPABASE_URL ve ANON_KEY gerekli.');
      return;
    }

    if (!isAppleAvailable) {
      setMessage('Apple Sign in bu cihazda kullanılamıyor.');
      return;
    }

    const rawNonce = makeNonce();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce
    );
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      setMessage('Apple identity token alınamadı.');
      return;
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });

    if (error) {
      setMessage(error.message);
    }
  }, [isAppleAvailable]);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(DEMO_SESSION_KEY);
    setDemoUser(null);

    if (!supabase) {
      setMessage('Çıkış yapıldı.');
      return;
    }
    await supabase.auth.signOut();
  }, []);

  const user = useMemo<AuthUser | null>(() => session?.user ?? demoUser ?? null, [demoUser, session]);

  return {
    hasAuthenticatedAccess: Boolean(user),
    isConfigured: isSupabaseConfigured,
    isLoading,
    isAppleAvailable,
    message,
    session,
    user,
    continueAsDemo,
    resetPassword,
    signInWithEmail,
    signInWithApple,
    signInWithGoogle,
    signUpWithEmail,
    signOut,
  };
}
