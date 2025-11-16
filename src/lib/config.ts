import Constants from 'expo-constants';

function inferLocalDevUrl() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;
  if (!hostUri) return undefined;

  const host = hostUri.split(':')[0];
  return host ? `http://${host}:4000` : undefined;
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || // Use env when building for production / tunnels
  inferLocalDevUrl() || // Otherwise fall back to the Metro host the device already talks to
  'http://localhost:4000';
