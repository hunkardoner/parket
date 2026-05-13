import { ReactNode, useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useAuthSession } from '@/hooks/use-auth-session';
import { LoginScreen } from '@/screens/login';
import { OnboardingScreen } from '@/screens/onboarding';

import { activityIndicatorColor, styles } from './auth-gate/style';

const ONBOARDING_KEY = 'parket:onboarding-complete';

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
        <ActivityIndicator color={activityIndicatorColor} size="large" />
        <ThemedText type="small" style={styles.loadingText}>
          Parket açılıyor...
        </ThemedText>
      </View>
    );
  }

  if (!auth.hasAuthenticatedAccess) {
    return <LoginScreen auth={auth} />;
  }

  if (!isOnboardingComplete) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  return <>{children}</>;
}
