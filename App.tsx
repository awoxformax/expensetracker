import 'react-native-gesture-handler';
import React from 'react';
import Head from 'expo-router/head';
import { ExpoRoot } from 'expo-router';
import { ctx } from 'expo-router/_ctx';

export default function App() {
  return (
    <Head.Provider>
      <ExpoRoot context={ctx} />
    </Head.Provider>
  );
}
