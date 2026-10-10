# Proposal

## Why

En el modo online un jugador puede fijar un nombre de hasta 24 caracteres (el máximo
actual del campo y del servidor). Ese límite es demasiado alto: en las fichas y asientos
de la partida el nombre largo desborda o rompe la maquetación de la mesa. El perfil local
ya limita el nombre a 16 caracteres, así que el online es la excepción inconsistente.

## What Changes

- El nombre del jugador online pasa a estar limitado a **16 caracteres**, tanto al escribir
  en el lobby (crear, unirse y renombrar) como en el límite que aplica el servidor.
- El corte se aplica de forma uniforme en cliente y servidor para que ni el campo de texto
  ni una petición manipulada puedan introducir un nombre más largo.
- Los nombres aleatorios autogenerados siguen siendo válidos (son cortos) y no cambian.
- El perfil local no cambia: ya usa 16 caracteres.

No es un cambio **BREAKING** de comportamiento para el jugador, salvo que un nombre más
largo de 16 caracteres ya no podrá fijarse; los nombres existentes se muestran tal cual
hasta que se vuelvan a cambiar.

## Capabilities

### New Capabilities
<!-- Ninguna: no se introduce una capacidad nueva. -->

### Modified Capabilities
- `online-lobby`: el requisito de «Nombre temporal autogenerado y editable» gana una
  restricción observable de longitud máxima de 16 caracteres, aplicada al crear, unirse
  y renombrar.

## Impact

- **Cliente**: `src/components/NameField.tsx` (límite por defecto del campo) y
  `src/screens/Online.tsx` (recorte del nombre al crear/unirse, `slice(0, 24)`).
- **Servidor**: `server/socket/handlers.ts` (recortes `slice(0, 24)` en `room:create`,
  `room:join` y `room:rename`).
- **Contrato**: el evento WebSocket `room:*` mantiene su forma; solo cambia la longitud
  máxima aceptada del campo `name`.
- **Sin cambios** en la generación de nombres aleatorios (`src/utils/randomName.ts`),
  el catálogo i18n (`online.namePool`) ni el perfil local.
