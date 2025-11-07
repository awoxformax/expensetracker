import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
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
