# Proposal

## Why

Hoy la app solo da retroalimentación sonora y visual: no hay vibración. En un móvil, la vibración es el canal más inmediato para confirmar una pulsación, avisar de que te toca jugar y señalar que se agotó el tiempo, sin depender del volumen ni de mirar la pantalla. Es especialmente útil en Android (WebView), donde ya se distribuye la app.

## What Changes

- Añadir retroalimentación háptica (vibración) ante eventos con sentido: pulsaciones de botones (breve), cuando empieza el turno del jugador y cuando se agota el tiempo del turno; además, una vibración de éxito al ganar una mano.
- Añadir un ajuste de **Vibración** activable/desactivable en Ajustes, persistido como el resto de ajustes (música, efectos, CRT, velocidad).
- Cuando la vibración está desactivada, o la plataforma no la soporta, no se produce ningún efecto y nada más cambia.
- Wiring de los eventos sobre los puntos existentes (el manejador global de clic de botones, el hook de sonidos de partida y la cuenta atrás del turno) para partida local y online.
- Extraer un componente de control segmentado reutilizable para el nuevo selector y los ya existentes (velocidad, idioma), que hoy repiten la misma receta de “pill” seleccionable.

## Capabilities

### New Capabilities
- `haptic-feedback`: comportamiento observable de la vibración: qué eventos la disparan, cómo se desactiva desde Ajustes y que se degrada sin efecto cuando la plataforma no la soporta.

### Modified Capabilities
<!-- Ninguna: la vibración se describe como una capacidad nueva; no cambian requisitos de specs existentes. -->

## Impact

- **Dependecia nueva:** `@capacitor/haptics@^8` (peer `@capacitor/core >=8`), coherente con el resto de plugins de Capacitor 8 ya usados (`@capacitor/app`, `@capacitor/status-bar`, `@capacitor/splash-screen`). En web el plugin usa la Vibration API y se degrada sin error donde no exista.
- **App (SPA):** nuevo helper/módulo de háptica (mismo patrón que `src/audio/sfx.ts`) que centraliza eventos, mapeo a estilos de vibración y la comprobación del ajuste.
- **App (SPA):** `src/store/settingsStore.ts` (nuevo estado `hapticsEnabled` persistido), `src/components/GameSettings.tsx` (nuevo ajuste), `src/App.tsx` (pulsación de botones), `src/hooks/useGameSounds.ts` (turno propio), `src/screens/Game/hooks/useTurnCountdown.ts` (tiempo agotado) y `src/screens/Game/hooks/usePotAward.ts` (victoria de la mano).
- **Nuevo componente:** `src/components/SegmentedControl.tsx` para sustituir las dos copias de la receta de “pill” en `GameSettings` y usarse en el nuevo selector. Reutiliza `Button`/utilidades nativas; no se crean clases CSS.
- **Reutilización:** no se recrean primitivas de partida (slots, cartas, avatares). El nuevo control segmentado se extrae y se aplica tanto al ajuste nuevo como a los existentes (velocidad e idioma), eliminando la duplicación señalada en `docs/code-reuse-audit.md` (§2.1 #3).
- **i18n:** claves nuevas en `src/i18n/locales/{es,en}/settings.ts` para la etiqueta y los estados del ajuste (y textos de accesibilidad si aplican). Ningún texto visible hardcodeado.
- **Android nativo:** sin cambios manuales en `AndroidManifest.xml`; el plugin aporta su permiso `VIBRATE` al sincronizar con `npx cap sync`.
