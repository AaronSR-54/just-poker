# Design

## Context

Ver `proposal.md` para el motivo y los specs delta (`app-links`, `online-lobby`) para el contrato.

Estado actual relevante:

- `src/screens/Online.tsx` resuelve el `?code=` de la dirección en un efecto que espera a que el socket esté listo. En ese efecto convive toda la decisión de entrada: si hay sala abierta o sesión activa, confirmar o reincorporar; si no hay nada y existe un nombre guardado (`getPlayerName()`), **unirse automáticamente**; si no hay nombre, solo rellenar el formulario y esperar. Esa dependencia del nombre es la que rompe la predictibilidad.
- Cuando falla una reincorporación (`attachSession`) o el servidor cierra la sala, se limpia la sesión **y el código de la dirección** (`clearCodeParam`), lo que deja al humano fuera del flujo de invitación.
- `src/hooks/useDeepLinks.ts` cubre el arranque en frío (`getLaunchUrl`) y la app en marcha (`appUrlOpen`) y navega con un `navigate(target)` normal (push). En Android, un enlace abierto con la app cerrada deja el menú debajo del paso de unirse.
- `src/utils/deepLink.ts` filtra enlaces `https` del origen online configurado y las rutas de invitación; la ruta heredada `/join/:code` redirige a `/online?code=…` (`src/App.tsx`).
- El nombre usado se guarda en `localStorage` (`getPlayerName`/`setPlayerName`) y el formulario ya usa un nombre generado como placeholder cuando no hay texto.
- El registro de la sala (`room:join`, `lobbySessionFromRoom`) y el servidor no necesitan cambios.

## Goals / Non-Goals

**Goals:**

- Una única resolución de entrada, compartida por web y app, que siempre aterrice en el paso de unirse con el código rellenado y sin unirse sola.
- Que el nombre que se muestra (último usado o generado) sea el que se usa al confirmar, sin pasos extra.
- Que un fallo de entrada no vacíe el código ni saque al humano de la pantalla.
- Mantener intactas las reglas ya existentes: mismo código reincorpora, otro código pide confirmación, sesión en curso manda.
- Dejar la decisión de entrada en una función pura, cubierta por pruebas, en lugar de repartida entre efectos y refs.

**Non-Goals:**

- No se toca el servidor, el protocolo `room:*` ni la ventana de reanudación de 120 s.
- No se cambia el formato del enlace/QR (`/online?code=…`) ni el filtrado de enlaces nativos.
- No se convierte el nombre en una cuenta ni se sincroniza entre dispositivos: sigue siendo local y editable.
- No se añaden componentes ni clases CSS nuevas; no se rediseña la pantalla.

## Decisions

### 1. Extraer `resolveOnlineEntry` a `src/net/onlineEntry.ts` (helper puro)

La decisión de entrada se concentra en una función pura que recibe la intención y el estado ya leídos (`wantsNewGame`, sesión activa, sala abierta, código normalizado) y devuelve una unión discriminada:

- `{ kind: 'prefill', code }` — mostrar el paso de unirse con ese código.
- `{ kind: 'rejoin', session }` — reincorporarse a la sesión en curso (mismo código o recarga).
- `{ kind: 'confirm', code }` — pedir confirmación antes de abandonar otra sala.
- `{ kind: 'ignore' }` — sin código válido o nada que hacer.

Se cubre con pruebas unitarias junto a `onlineSession.test.ts` (mismo estilo, sin DOM).

**Por qué:** hoy la misma decisión está implícita en un efecto con refs (`handledCodeRef`, `roomRef`) y cualquier cambio de comportamiento obliga a razonar sobre orden de renders. Una función pura hace explícitos los casos, evita divergencias web/app y permite probar el "siempre el formulario" sin montar la pantalla.

**Alternativas descartadas:** mantener la lógica en el efecto y probar con tests de componente (el repo no tiene arnés de DOM y sería más frágil); duplicar la decisión en el hook de deep links (duplicación que la guía prohíbe).

### 2. Abrir una invitación nunca une automáticamente

Con código en la dirección y sin sala/sesión en curso, la entrada es siempre `prefill`. Se elimina el camino que emitía `room:join` al detectar un nombre guardado. Unirse es una acción explícita del humano.

**Por qué:** elimina la diferencia "con nombre entro solo / sin nombre me quedo fuera", que es el origen del fallo reportado. Además deja un único estado observable que coincide con el ideal pedido (Online → Unirse → código rellenado).

**Alternativas descartadas:** mantener el auto-join cuando hay nombre (sigue habiendo dos comportamientos y el invitado no ve el nombre antes de entrar); auto-unirse siempre con nombre generado (entra sin que el humano vea ni confirme la sala).

### 3. Nombre inicial: último usado como valor, generado como respaldo

El estado inicial del campo pasa a ser el nombre guardado (`getPlayerName()`) y el placeholder sigue siendo un nombre generado cuando no hay texto. El nombre generado se calcula una sola vez al montar y se reutiliza tanto para el placeholder como para el valor efectivo al confirmar (`name.trim() || placeholderName`).

**Por qué:** el humano ve exactamente con qué nombre va a entrar y puede cambiarlo; confirmar sin tocar nada funciona. Evita generar nombres aleatorios distintos entre render, placeholder y envío.

**Alternativas descartadas:** dejar el campo vacío y confiar solo en el placeholder (el invitado no ve su nombre como valor y parece que "no tiene nombre"); imponer el último nombre sin mostrarlo (no es editable).

### 4. Un fallo de entrada conserva el paso de unirse y el código

`attachSession` y la resolución de la invitación dejan de llamar a `clearCodeParam` cuando el código venía de la dirección y no se había entrado. Se limpia la sesión caduca, se muestra el error ya existente (`onlineError` → `online.roomGone`) y el formulario sigue con el código rellenado para reintentar. La limpieza del código se mantiene al abandonar una sala de forma explícita (`resetRoom`/`detachRoom`) y cuando una sala en la que se estaba se cierra.

**Por qué:** "no poder entrar" no debe confundirse con "abandonar la sala"; hoy el código desaparece y el humano pierde la invitación.

### 5. El enlace de arranque en frío sustituye la entrada del menú en el historial

`useDeepLinks` navega con `replace` cuando el enlace viene de `getLaunchUrl` (arranque) y con navegación normal cuando viene de `appUrlOpen` (app en marcha). El guardado anti-duplicados se mantiene.

**Por qué:** en Android el arranque por enlace monta el menú como entrada previa; con `replace`, el atrás desde el paso de unirse no devuelve en silencio al menú (efecto "te saca") y el flujo de invitación queda como pantalla actual. En la app ya abierta sí interesa apilar para poder volver a la pantalla anterior.

**Alternativas descartadas:** usar `replace` siempre (al recibir un enlace desde una partida se perdería la pantalla previa); dejar `push` (mantiene el salto al menú).

### 6. Reutilización y ausencia de duplicación

- **Componentes reutilizados:** `Panel`, `CtaButton`, `NameField`, `SelectableCard`, `PageHeader`, `ScreenTitle`, `Screen`, `Badge`, `PersonCard`, `QrCode`, `QrDialog` y `ConfirmDialog` (todos en `src/components/`).
- **Helpers reutilizados:** `normalizeRoomCode`, `isOtherRoomJoin`, `getActiveOnlineSession`, `getPlayerName`, `setPlayerName`, `lobbySessionFromRoom` (`src/net/onlineSession.ts`), `onlineOrigin` (`src/config/online.ts`) y `resolveDeepLink` (`src/utils/deepLink.ts`).
- **Extraído:** `src/net/onlineEntry.ts` (+ `onlineEntry.test.ts`), usado por `Online.tsx` y por las pruebas. No se extrae nada más: el resto del flujo (código de 4 casillas, campo de nombre, lobby, QR) ya está en componentes o helpers existentes y este change no añade markup nuevo. No hay lógica que se repita y se deje duplicada a propósito.

## Risks / Trade-offs

- **Un paso más para quien ya tenía nombre:** ahora todos confirman → *Mitigación*: el código y el nombre llegan rellenos y la acción principal sigue siendo un único botón; el estado es el mismo en web y app.
- **Cambio de comportamiento del atrás en Android tras un enlace:** con `replace`, el atrás desde el paso de unirse sale de la app en vez de volver al menú → *Mitigación*: solo se aplica al enlace de arranque; verificar en dispositivo antes de publicar, y el comportamiento es el habitual en apps abiertas desde un enlace.
- **Diagnóstico incompleto del "te saca" nativo:** no se ha podido reproducir el síntoma exacto en el arnés (sí el estado final correcto) → *Mitigación*: las tareas incluyen verificación en dispositivo Android con app cerrada, en segundo plano y ya abierta; el diseño elimina además las tres causas conocidas de abandono (auto-join condicionado, limpieza del código, historial).
- **Código obsoleto en la dirección:** conservar el `?code=` tras un fallo puede dejar una dirección de una sala muerta → *Mitigación*: sigue limpiándose al salir de la sala de forma explícita y al volver al menú; el código solo se conserva mientras se está en el paso de unirse.
- **Nombre recordado en un dispositivo compartido:** se propone el último nombre usado → *Mitigación*: es editable y solo un valor inicial, no una identidad; limpiar el campo y confirmar asigna un nombre generado.

## Migration Plan

- Web: se publica con el despliegue normal (Vercel) sin migración de datos.
- Android: requiere regenerar el APK/AAB (`npm run android`) y subir versión; el comportamiento nuevo depende del bundle web, no de cambios nativos.
- Rollback: revertir el commit; no hay datos ni protocolo que deshacer.
