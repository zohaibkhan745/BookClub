import { useState, useEffect, useCallback } from 'react';
import {
  getVapidPublicKey,
  registerPushSubscription,
  unregisterPushSubscription,
  sendTestPushNotification,
} from '../services/notificationService';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Platform detection
  const isIOS =
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  const isStandalone =
    typeof window !== 'undefined' &&
    ((window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches);

  const isIOSBrowser = isIOS && !isStandalone;

  // Initialize service worker and check existing subscription
  useEffect(() => {
    let isMounted = true;

    async function checkSubscription() {
      if (typeof window === 'undefined') return;

      const supported =
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;

      if (!isMounted) return;
      setIsSupported(supported);

      if (!supported) {
        setIsLoading(false);
        return;
      }

      setPermission(Notification.permission);

      try {
        // Register or retrieve existing service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        const subscription = await registration.pushManager.getSubscription();
        if (isMounted) {
          setIsSubscribed(subscription !== null);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('[usePushNotifications] Service worker init error:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkSubscription();

    return () => {
      isMounted = false;
    };
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications are not supported on this device/browser.');
      }

      // iOS Safari requires Add to Home Screen first
      if (isIOSBrowser) {
        throw new Error(
          'On iPhone/iPad, please add Book Club to your Home Screen first (Tap Share > "Add to Home Screen"), then open from your home screen to enable notifications.'
        );
      }

      // Request user permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        throw new Error(
          result === 'denied'
            ? 'Notification permission was denied. Please allow notifications in device settings.'
            : 'Notification permission was dismissed.'
        );
      }

      // Ensure service worker is ready
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key
      const vapidPublicKey = await getVapidPublicKey();
      if (!vapidPublicKey) {
        throw new Error('Failed to obtain server push key.');
      }

      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe with browser push service
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Register with backend
      await registerPushSubscription(subscription.toJSON());

      setIsSubscribed(true);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to enable notifications';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isIOSBrowser]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await unregisterPushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to disable notifications';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send a test notification to verify lock screen receipt
  const sendTest = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return await sendTestPushNotification(subscription?.endpoint);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send test push';
      setError(msg);
      throw err;
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    error,
    isIOS,
    isStandalone,
    isIOSBrowser,
    subscribe,
    unsubscribe,
    sendTest,
  };
}
