import "react-native-gesture-handler";
import React from "react";
import Head from "expo-router/head";
import { ExpoRoot } from "expo-router";
import { LangProvider } from "./src/context/LangContext";
import { ThemeProvider } from "./src/theme/ThemeProvider";
import { ctx } from "expo-router/_ctx";

export default function App() {
  return (
    <LangProvider>
      <ThemeProvider>
        <Head.Provider>
          <ExpoRoot context={ctx} />
        </Head.Provider>
      </ThemeProvider>
    </LangProvider>
  );
}
