# Proposal

## Why

La música de fondo es poco fiable: en móvil, a veces no suena hasta recargar la app. El arranque se ata a listeners de gesto de un solo uso que se consumen aunque el arranque falle (contexto de audio bloqueado, carga del búfer fallida) y no hay reintento; además, al volver del segundo plano el `AudioContext` puede quedar suspendido sin que nadie lo reanude, dejando la música muda hasta recargar.

## What Changes

- **Arranque con reintento**: mantener activos los listeners de gesto hasta que la música esté realmente sonando y reintentar el arranque en gestos posteriores cuando el primer intento falla o el volumen llega a 0.
- **Intento de arranque automático**: al abrir, intentar reproducir sin esperar a un gesto (WebView/APK y navegadores que lo permitan), conservando el arranque por primer gesto como respaldo cuando la plataforma lo bloquee.
- **Carga del búfer recuperable**: descartar la promesa de carga fallida para que un nuevo intento vuelva a pedir y decodificar la pista en vez de fallar de forma permanente.
- **Recuperación del contexto suspendido**: reanudar el `AudioContext` y recrear la fuente cuando quedó inválida al volver del segundo plano o tras una interrupción; escuchar `statechange` para reconectar sin recargar.
- **Ciclo de vida de la app nativa**: reaccionar también al estado de la app Android (Capacitor) además de `visibilitychange`, sin nuevas dependencias.
- **Sin cambios de UX**: mismos textos, mismos ajustes de volumen y misma pista; solo mejora la fiabilidad.

## Capabilities

### New Capabilities

- `music-playback`: arranque, pausa/reanudación y recuperación de la música de fondo en web y móvil (Android/WebView).

### Modified Capabilities

Ninguna.

## Impact

- **Código**: `src/audio/music.ts` (núcleo del arranque, búfer y recuperación); `src/App.tsx` solo si cambia el contrato de `initMusic`; posible helper de eventos de ciclo de vida bajo `src/hooks/` si conviene aislar Capacitor.
- **APIs/dependencias**: sin dependencias nuevas (`@capacitor/app` y `@capacitor/core` ya están en `package.json`).
- **Persistencia**: sin cambios (`just-poker-settings` intacto).
- **Verificación**: tests unitarios con mocks de `AudioContext`/`fetch` para reintento y recuperación, más smoke manual en Android y desktop.
