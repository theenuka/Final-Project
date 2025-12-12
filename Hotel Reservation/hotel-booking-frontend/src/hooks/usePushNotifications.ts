import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  permission: NotificationPermission;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    subscription: null,
    permission: 'default',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 
        'serviceWorker' in navigator && 
        'PushManager' in window && 
        'Notification' in window;

      if (!isSupported) {
        setState(prev => ({ ...prev, isSupported: false }));
        return;
      }

      const permission = Notification.permission;
      
      // Check existing subscription
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        setState({
          isSupported: true,
          isSubscribed: !!subscription,
          subscription,
          permission,
        });
      } catch (err) {
        console.error('Error checking push subscription:', err);
        setState(prev => ({ 
          ...prev, 
          isSupported: true, 
          permission 
        }));
      }
    };

    checkSupport();
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (err) {
      console.error('Service Worker registration failed:', err);
      throw err;
    }
  }, []);

  // Get VAPID public key from server
  const getVapidPublicKey = useCallback(async (): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/api/notifications/push/vapid-public-key`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to get VAPID public key');
    }
    
    const { publicKey } = await response.json();
    return publicKey;
  }, []);

  // Convert base64 to Uint8Array for VAPID key
  const urlBase64ToUint8Array = (base64String: string): ArrayBuffer => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer as ArrayBuffer;
  };

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Register service worker
      await registerServiceWorker();
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key
      const vapidPublicKey = await getVapidPublicKey();
      
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured on server');
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send subscription to server
      const response = await fetch(`${API_BASE_URL}/api/notifications/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription on server');
      }

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        subscription,
        permission: 'granted',
      }));

      return subscription;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [registerServiceWorker, getVapidPublicKey]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (state.subscription) {
        await state.subscription.unsubscribe();
      }

      // Notify server
      await fetch(`${API_BASE_URL}/api/notifications/push/unsubscribe`, {
        method: 'POST',
        credentials: 'include',
      });

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
      }));
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [state.subscription]);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/push/test`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  return {
    ...state,
    loading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
};

export default usePushNotifications;
