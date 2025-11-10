import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function ensureNotificationPermissions() {
  const settings = await Notifications.getPermissionsAsync();
  if (!settings.granted) await Notifications.requestPermissionsAsync();
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

export async function scheduleAt(date: Date, content: Notifications.NotificationContentInput) {
  const trigger: Notifications.DateTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date,
  };

  return Notifications.scheduleNotificationAsync({
    content,
    trigger,
  });
}

// App içində: kliklə açılan action məlumatını daşıyırıq
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false })
});
