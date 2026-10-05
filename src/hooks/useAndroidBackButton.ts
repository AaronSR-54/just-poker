import { useEffect } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/** Conecta el botón atrás de Android con el historial del router. */
export function useAndroidBackButton(navigate: NavigateFunction, pathname: string): void {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = CapacitorApp.addListener('backButton', () => {
      if (pathname === '/') {
        CapacitorApp.exitApp();
      } else {
        navigate(-1);
      }
    });
    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [navigate, pathname]);
}
