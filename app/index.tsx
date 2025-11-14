import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../src/theme/ThemeProvider';
import { useOnboarding } from '../src/context/Onboarding';
import { ONBOARDING_DONE_KEY } from '../src/constants/storage';
import { getToken } from '../src/lib/storage';
import { apiGetProfile } from '../src/lib/api';
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
      const flag = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);
      if (!isActive) return;
      if (flag) {
        router.replace('/(tabs)/home');
        return;
      }
      const remote = await apiGetProfile(token);
      if (!isActive) return;
      if (remote.ok && remote.data?.onboardingCompleted) {
        await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true');
        router.replace('/(tabs)/home');
      } else {
        reset();
        router.replace('/onboarding/tutorial');
      }
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
