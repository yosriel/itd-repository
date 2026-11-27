import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const channelId = 'viajes';
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
  }),
});

export async function notificationPermission(request = false) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(channelId, {
      name: 'Avisos de viaje', importance: Notifications.AndroidImportance.HIGH,
    });
  }
  let permission = await Notifications.getPermissionsAsync();
  if (request && !permission.granted && permission.canAskAgain) {
    permission = await Notifications.requestPermissionsAsync();
  }
  return permission;
}

export async function sendTravelNotice(body: string) {
  if (!(await notificationPermission()).granted) { return; }
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Metropolitano de Lima', body, sound: 'default' },
    trigger: Platform.OS === 'android' ? { channelId } : null,
  });
}
