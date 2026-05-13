import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermissions() {
  if (Platform.OS === 'web') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('parket', {
      name: 'Parket',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const finalStatus =
    existing.status === 'granted'
      ? existing.status
      : (await Notifications.requestPermissionsAsync()).status;

  if (finalStatus !== 'granted' || !Device.isDevice) {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined;

  if (!projectId) {
    return null;
  }

  try {
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch {
    return null;
  }
}

export async function notifyParkingSaved(title: string) {
  if (Platform.OS === 'web') {
    return;
  }

  await ensureNotificationPermissions();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Parket!',
      body: `${title} kaydedildi. Araca geri dönmek için Parket'i aç.`,
      data: { type: 'parked-vehicle' },
      sound: false,
    },
    trigger: null,
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Parket hatırlatma',
      body: 'Park konumun hala kayıtlı. Araca dönüş rotasını tek dokunuşla açabilirsin.',
      data: { type: 'park-reminder' },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60 * 90,
    },
  });
}
