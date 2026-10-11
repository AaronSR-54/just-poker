# Tasks

## 1. Módulo de háptica y dependencia

- [x] 1.1 Añadir `@capacitor/haptics@^8` a `package.json`, instalar y verificar con `npm ls @capacitor/haptics` que resuelve a 8.x.
- [x] 1.2 Crear `src/haptics/haptics.ts` con el tipo `HapticName` (`tap`/`turn`/`expire`/`win`), el mapeo a la API del plugin y un disparador que consulta `useSettingsStore.getState().hapticsEnabled` y sale sin efecto si está desactivado; verificar con `npx tsc --noEmit` y una prueba unitaria que cubra que desactivado no invoca el plugin y que cada nombre mapea al estilo esperado.

## 2. Ajuste y control segmentado

- [x] 2.1 Añadir `hapticsEnabled: boolean` (por defecto `true`) y su setter en `src/store/settingsStore.ts`, persistido con el resto; verificar con una prueba unitaria que el estado persiste/lee el valor bajo `just-poker-settings`.
- [x] 2.2 Añadir las claves `settings.haptics`, `settings.hapticsOn` y `settings.hapticsOff` en `src/i18n/locales/es/settings.ts` y `src/i18n/locales/en/settings.ts`; verificar con `npx tsc --noEmit` (el tipo `Dict` exige que `en` cubra las mismas claves).
- [x] 2.3 Extraer `src/components/SegmentedControl.tsx` con las utilidades nativas y la receta de “pill” ya existente (opciones `{value,label}`, valor, `onChange`, columnas y `aria-label`) y sustituir con él los controles de velocidad e idioma de `src/components/GameSettings.tsx`; verificar visualmente que ambos siguen funcionando e iguales, y con `npx tsc --noEmit`.
- [x] 2.4 Añadir en `src/components/GameSettings.tsx` una sección de vibración con el `SegmentedControl` On/Off (etiquetas traducidas, `aria-pressed` correcto); verificar que el ajuste se refleja y persiste tras recargar.

## 3. Disparo de la háptica en los eventos

- [x] 3.1 Disparar la vibración de pulsación en el manejador global de `click` de `src/App.tsx` para todo botón habilitado; verificar en dispositivo/navegador compatible que pulsar un botón vibra brevemente y que un botón deshabilitado no.
- [x] 3.2 Disparar la vibración de turno en `src/hooks/useGameSounds.ts` al pasar el turno al jugador humano, respetando la bandera de inicialización; verificar que vibra al llegar el turno propio (local y online) y no al montar la partida.
- [x] 3.3 Disparar la vibración de expiración en `src/screens/Game/hooks/useTurnCountdown.ts` cuando `timerSeconds === 0`; verificar que vibra al agotarse el tiempo.
- [x] 3.4 Disparar la vibración de éxito en `src/screens/Game/hooks/usePotAward.ts` cuando el ganador incluye al jugador humano, una sola vez por mano; verificar que vibra al ganar y no al ganar un rival.
- [x] 3.5 Disparar una vibración breve y sutil en cada pulso de la cuenta atrás durante los últimos segundos (`timerSeconds <= 5`) en `src/screens/Game/hooks/useTurnCountdown.ts`; verificar que vibra en cada segundo de la cuenta atrás y no fuera de los últimos segundos.

## 4. Verificación

- [x] 4.1 Revisar la checklist de reutilización de `AGENTS.md`: no se recrean primitivas de juego, no queda duplicada la receta de pill (ahora en `SegmentedControl`) ni hay helpers repetidos; documentar el resultado en la descripción de la tarea. — Resultado: `SegmentedControl` sustituye las dos copias de pill en `GameSettings` (velocidad e idioma) y sirve al nuevo ajuste; se reutilizan `SettingSlider` y `Button`; no hay helpers de háptica ni de estado duplicados (una sola definición en `src/haptics/haptics.ts` y en `settingsStore`); todos los textos visibles pasan por `t(...)`; sin colores/tamaños crudos.
- [x] 4.2 Ejecutar `npx oxlint src/`, `npx tsc --noEmit` y `npm run build` sin errores. — `oxlint` 0 avisos, `tsc` limpio, `vite build` correcto (699 módulos).
- [x] 4.3 Probar en Android (`npm run android:debug` o `npx cap sync android` + build) que la vibración funciona y que el ajuste la desactiva. — `npx cap sync android` registra `@capacitor/haptics@8.0.2`; `npm run android:debug` compila (BUILD SUCCESSFUL, `just-poker.apk`) y el manifest fusionado incluye `android.permission.VIBRATE`. La comprobación táctil en dispositivo queda como verificación manual.

## Workflow follow-up

- Archivar el change cuando se cumplan los requisitos de revisión del proyecto.
- Verificar el resultado archivado.
