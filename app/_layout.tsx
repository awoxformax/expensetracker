import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Slot, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { UserProvider } from '../src/context/UserContext';
import { AuthProvider } from '../src/context/AuthContext';
import { OnboardingProvider } from '../src/context/Onboarding';
import { TransactionsProvider } from '../src/context/TransactionsContext';
import 'react-native-reanimated';


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const ensurePermissions = async () => {
      try {
        const settings = await Notifications.getPermissionsAsync();
        if (settings.status !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }
      } catch (err) {
        console.warn('Notification permission request failed', err);
      }
    };
    ensurePermissions();
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string | undefined>;
      if (data?.action === 'open_income_form') {
        router.push({
          pathname: '/(tabs)/transactions',
          params: { captureIncome: '1', subtype: data.incomeSubtype ?? 'salary' },
        });
      } else if (data?.action === 'navigate_category') {
        router.push({
          pathname: '/(tabs)/transactions',
          params: { captureExpense: '1', category: data.category ?? 'Kredit' },
        });
      }
    });

    return () => sub.remove();
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <UserProvider>
          <AuthProvider>
            <TransactionsProvider>
              <OnboardingProvider>
                <StatusBar style="light" />
                <Slot />
              </OnboardingProvider>
            </TransactionsProvider>
          </AuthProvider>
        </UserProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
