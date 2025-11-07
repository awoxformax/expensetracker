import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
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
