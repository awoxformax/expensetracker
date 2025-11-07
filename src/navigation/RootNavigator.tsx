import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import HomeScreen from '../screens/main/HomeScreen';
import IntroSlides from '../screens/onboarding/IntroSlides';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import PortfolioSelect from '../screens/onboarding/PortfolioSelect';
import CategorySelect from '../screens/onboarding/CategorySelect';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated } = useAuth();
  const { state, loading } = useUser();

  if (loading) return null;
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          <>
            {!state.onboardingPhase1Done ? (
              <>
                <Stack.Screen name="Intro" component={IntroSlides} />
                <Stack.Screen name="PortfolioSelect" component={PortfolioSelect} />
                <Stack.Screen name="CategorySelect" component={CategorySelect} />
              </>
            ) : null}
            <Stack.Screen name="Home" component={HomeScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
