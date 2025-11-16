import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../src/theme/ThemeProvider';
import { useOnboarding } from '../src/context/Onboarding';
import { ONBOARDING_DONE_KEY } from '../src/constants/storage';
import { getItem, getToken } from '../src/lib/storage';
import { apiGetProfile } from '../src/lib/api';
import { PIN_KEY } from '../src/constants/security';
import 'react-native-reanimated';


export default function Index() {
  const router = useRouter();
  const { colors } = useTheme();
  const { reset } = useOnboarding();

  useEffect(() => {
    let isActive = true;
    (async () => {
      const token = await getToken();
      if (!isActive) return;
      if (!token) {
        reset();
        router.replace('/auth/welcome');
        return;
      }
      const hasLocalFlag = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);
      if (!isActive) return;
      let onboardingDone = !!hasLocalFlag;
      if (!onboardingDone) {
        const remote = await apiGetProfile(token);
        if (!isActive) return;
        if (remote.ok && remote.data?.onboardingCompleted) {
          await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true');
          onboardingDone = true;
        }
      }
      if (!isActive) return;
      if (!onboardingDone) {
        reset();
        router.replace('/onboarding/tutorial');
        return;
      }
      const existingPin = await getItem<string | null>(PIN_KEY, null);
      if (!isActive) return;
      if (!existingPin || existingPin.length < 4) {
        router.replace('/pin-setup');
        return;
      }
      router.replace('/auth/unlock');
    })();
    return () => {
      isActive = false;
    };
  }, [reset, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#4F8BFF" />
    </View>
  );
}
