import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_STATE_KEY = 'user_state_v1';
const RECURRING_NOTIFY_KEY = 'recurring_notification_map_v1';

export async function saveToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function saveRefreshToken(token: string) {
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function clearRefreshToken() {
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Generic JSON helpers for app state
export async function saveUserState(state: any) {
  await AsyncStorage.setItem(USER_STATE_KEY, JSON.stringify(state));
}

export async function getUserState<T = any>(): Promise<T | null> {
  const raw = await AsyncStorage.getItem(USER_STATE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function clearUserState() {
  await AsyncStorage.removeItem(USER_STATE_KEY);
}

async function readRecurringNotifyMap(): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(RECURRING_NOTIFY_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

async function writeRecurringNotifyMap(map: Record<string, string>) {
  await AsyncStorage.setItem(RECURRING_NOTIFY_KEY, JSON.stringify(map));
}

export async function saveRecurringNotificationId(recurringId: string, notificationId: string) {
  if (!recurringId || !notificationId) return;
  const map = await readRecurringNotifyMap();
  map[recurringId] = notificationId;
  await writeRecurringNotifyMap(map);
}

export async function getRecurringNotificationId(recurringId: string) {
  if (!recurringId) return null;
  const map = await readRecurringNotifyMap();
  return map[recurringId] || null;
}

export async function removeRecurringNotificationId(recurringId: string) {
  if (!recurringId) return null;
  const map = await readRecurringNotifyMap();
  const current = map[recurringId];
  if (!current) return null;
  delete map[recurringId];
  await writeRecurringNotifyMap(map);
  return current;
}
// ----------------------
// Universal JSON helpers for local app data (transactions, categories, reminders)
// ----------------------
const NS = (k: string) => `expensetracker_local:${k}`;

export async function jset<T>(key: string, value: T) {
  try {
    await AsyncStorage.setItem(NS(key), JSON.stringify(value));
  } catch (err) {
    console.warn("Failed to save local data", err);
  }
}

export async function jget<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(NS(key));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function jremove(key: string) {
  try {
    await AsyncStorage.removeItem(NS(key));
  } catch (err) {
    console.warn("Failed to remove local data", err);
  }
}
export async function setItem(key: string, value: any) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}
export async function getItem<T = any>(key: string, fallback: T): Promise<T> {
  const v = await AsyncStorage.getItem(key);
  return v ? JSON.parse(v) as T : fallback;
}
export async function removeItem(key: string) {
  await AsyncStorage.removeItem(key);
}
