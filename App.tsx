import "react-native-gesture-handler";
import React from "react";
import Head from "expo-router/head";
import { ExpoRoot } from "expo-router";
import { LangProvider } from "./src/context/LangContext";
import { ThemeProvider } from "./src/theme/ThemeProvider";
import { AuthProvider } from "./src/context/AuthContext";
import { UserProvider } from "./src/context/UserContext";
import { TransactionsProvider } from "./src/context/TransactionsContext";
import { OnboardingProvider } from "./src/context/Onboarding";
import { ctx } from "expo-router/_ctx";

export default function App() {
  return (
    <LangProvider>
      <ThemeProvider>
        <AuthProvider>
          <UserProvider>
            <TransactionsProvider>
              <OnboardingProvider>
                <Head.Provider>
                  <ExpoRoot context={ctx} />
                </Head.Provider>
              </OnboardingProvider>
            </TransactionsProvider>
          </UserProvider>
        </AuthProvider>
      </ThemeProvider>
    </LangProvider>
  );
}
