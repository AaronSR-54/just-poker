# Proposal

## Why

El código de sala actual es de 4 dígitos (10 000 combinaciones), lo que lo hace fácil de adivinar por fuerza bruta y propenso a colisiones/errores al dictarlo. Un código alfanumérico corto aporta mucha más entropía con la misma longitud y mejor legibilidad si se excluyen caracteres ambiguos.

## What Changes

- El código de cada partida privada pasa de **4 dígitos** a **4 caracteres alfanuméricos** en mayúsculas, usando el alfabeto `A-Z` + `2-9` y excluyendo los caracteres ambiguos `O`, `0`, `I`, `1`, `L`.
- La entrada del invitado acepta letras y números, **normaliza a mayúsculas** y descarta símbolos/espacios, tanto al teclear como al pegar y al leer el `?code=` de la URL.
- El servidor **normaliza el código recibido a mayúsculas** antes de buscarlo, de modo que un código tecleado en minúsculas o un enlace antiguo sigan resolviendo.
- Se mantiene la longitud de 4 y la UI de 4 casillas; cambia el conjunto de caracteres aceptados.
- **BREAKING** (compatibilidad): los códigos numéricos de salas creadas antes del despliegue dejan de ser válidos; esas salas deben volver a crearse.

## Capabilities

### New Capabilities

_Ninguna._

### Modified Capabilities

- `online-lobby`: cambia el formato del código de partida (de 4 dígitos a 4 caracteres alfanuméricos sin ambiguos) y la unión con código (acepta alfanumérico y normaliza mayúsculas).

## Impact

- **Servidor**: `server/game/GameManager.ts` (`generateCode`), `server/socket/handlers.ts` (normalización del código entrante), `server/game/GameManager.test.ts` (patrón del código).
- **Cliente**: `src/screens/Online.tsx` (filtrado/normalización de las 4 casillas, pegado y lectura del `?code=`).
- **Reutilización**: no se crean componentes ni clases CSS nuevas; se reutilizan `Panel`, `NameField`, `CtaButton`, `QrCode`/`QrDialog` y `PersonCard`. No se extrae helper compartido entre cliente y servidor porque son proyectos TS separados (el cliente solo necesita aceptar el superconjunto alfanumérico; el alfabeto exacto es una restricción de generación del servidor).
- **Sin cambios**: enlaces/QR, flujo de lobby, i18n (los textos de ayuda siguen siendo válidos), resto de capacidades.
