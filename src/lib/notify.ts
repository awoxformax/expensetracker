import * as Notifications from 'expo-notifications';
import {
  getRecurringNotificationId,
  removeRecurringNotificationId,
  saveRecurringNotificationId,
} from './storage';

type TransactionType = 'income' | 'expense';

const ensureTenAM = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(10, 0, 0, 0);
  return normalized;
};

export async function scheduleLocal(
  type: TransactionType,
  date: Date,
  title: string,
  body: string
): Promise<string> {
  const triggerDate = ensureTenAM(date);
  if (triggerDate.getTime() <= Date.now()) {
    triggerDate.setDate(triggerDate.getDate() + 1);
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  return notificationId;
}

export async function cancelLocal(id: string) {
  if (!id) return;
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function scheduleRecurringReminder(
  recurringId: string,
  type: TransactionType,
  date: Date,
  title: string,
  body: string
) {
  const notificationId = await scheduleLocal(type, date, title, body);
  await saveRecurringNotificationId(recurringId, notificationId);
  return notificationId;
}

export async function cancelRecurringReminder(recurringId: string) {
  const existing = await getRecurringNotificationId(recurringId);
  if (!existing) return;
  await cancelLocal(existing);
  await removeRecurringNotificationId(recurringId);
}
