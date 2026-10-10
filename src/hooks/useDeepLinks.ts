import { useEffect } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { resolveDeepLink } from '../utils/deepLink';

/**
 * Enruta los enlaces de invitación entrantes (App Links de Android) a la sala.
 *
 * Cubre el arranque en frío (`getLaunchUrl`) y la app ya en marcha/en segundo
 * plano (`appUrlOpen`), evitando navegar dos veces al mismo destino. Los enlaces
 * que no son invitaciones se ignoran (los abre el navegador).
 */
export function useDeepLinks(navigate: NavigateFunction): void {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let disposed = false;
    let last: string | null = null;

    const open = (url?: string | null) => {
      if (!url) return;
      const target = resolveDeepLink(url);
      if (!target || target === last) return;
      last = target;
      navigate(target);
    };

    void CapacitorApp.getLaunchUrl().then((result) => {
      if (!disposed) open(result?.url);
    });
    const listener = CapacitorApp.addListener('appUrlOpen', (event) => {
      open(event.url);
    });

    return () => {
      disposed = true;
      void listener.then((handle) => handle.remove());
    };
  }, [navigate]);
}
