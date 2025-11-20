import { supabase } from '@/integrations/supabase/client';

export const isPushNotificationSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  return await Notification.requestPermission();
};

export const sendTestNotification = async (): Promise<void> => {
  if (!isPushNotificationSupported()) {
    throw new Error('Notifications not supported');
  }

  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    new Notification('DrowsyGuard Test', {
      body: 'Notifications are working correctly!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    });
  }
};

// Simplified version without actual push subscription
// Full implementation would require backend setup with VAPID keys
export const subscribeToPushNotifications = async (): Promise<boolean> => {
  try {
    const permission = await requestNotificationPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const unsubscribeFromPushNotifications = async (): Promise<void> => {
  console.log('Unsubscribe from push notifications');
};
