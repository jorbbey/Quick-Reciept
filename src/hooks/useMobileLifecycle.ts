import { useEffect, useState, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

interface UseMobileLifecycleOptions {
  onHardwareBack?: () => boolean; // return true if handled, false to allow default/exit
  onReconnect?: () => void;
  onDeepLink?: (url: string) => void;
  themeColorHex?: string;
}

export function useMobileLifecycle({
  onHardwareBack,
  onReconnect,
  onDeepLink,
  themeColorHex = '#2563eb'
}: UseMobileLifecycleOptions = {}) {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const backHandlerRef = useRef(onHardwareBack);
  backHandlerRef.current = onHardwareBack;

  const reconnectRef = useRef(onReconnect);
  reconnectRef.current = onReconnect;

  const deepLinkRef = useRef(onDeepLink);
  deepLinkRef.current = onDeepLink;

  // 1. Online / Offline network listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      reconnectRef.current?.();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Capacitor Android Status Bar & Native Listeners
  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      // Configure Status Bar
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: themeColorHex }).catch(() => {});

      // Hardware Back Button listener
      let backListenerPromise: any = null;
      try {
        backListenerPromise = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          const wasHandled = backHandlerRef.current?.();
          if (!wasHandled && canGoBack) {
            window.history.back();
          } else if (!wasHandled) {
            CapacitorApp.exitApp();
          }
        });
      } catch (err) {
        console.warn('Failed to register Capacitor backButton listener:', err);
      }

      // Deep link url open listener (OAuth / Password reset)
      let urlListenerPromise: any = null;
      try {
        urlListenerPromise = CapacitorApp.addListener('appUrlOpen', (event) => {
          if (event.url) {
            deepLinkRef.current?.(event.url);
          }
        });
      } catch (err) {
        console.warn('Failed to register Capacitor appUrlOpen listener:', err);
      }

      return () => {
        backListenerPromise?.then((l: any) => l?.remove?.());
        urlListenerPromise?.then((l: any) => l?.remove?.());
      };
    }
  }, [themeColorHex]);

  return {
    isOnline,
    isNative: Capacitor.isNativePlatform()
  };
}
