# Design

## Context

Ver `proposal.md`. El nombre online se fija en tres puntos del cliente y en tres eventos
del servidor, hoy todos con el literal `24`:

- Cliente: `src/components/NameField.tsx` (por defecto `maxLength = 24`) y
  `src/screens/Online.tsx` (`(name.trim() || placeholderName).slice(0, 24)` al crear y al unirse).
- Servidor: `server/socket/handlers.ts` (`room:create`, `room:join`, `room:rename` con `slice(0, 24)`).

El perfil local (`src/screens/Profile.tsx`) ya usa 16 con un literal propio. El catálogo
de nombres aleatorios (`online.namePool`) produce nombres cortos (≤ 6 caracteres), por lo
que el recorte no los afecta.

Cliente y servidor son targets de build separados sin módulo compartido; ya se acepta el
espejo de constantes (`MAX_SLOTS = 4` en cliente vs `MAX_PLAYERS = 4` en servidor).

## Goals / Non-Goals

**Goals:**
- Un único límite de 16 caracteres aplicado de forma consistente en cliente y servidor.
- Una sola definición de la constante por target, eliminando los literales `24` repartidos.
- Truncar de forma silenciosa (slice), manteniendo el comportamiento actual de no rechazar.

**Non-Goals:**
- No se cambia el perfil local (ya limitado a 16).
- No se modifica la generación de nombres aleatorios ni el catálogo i18n.
- No se valida el contenido (solo la longitud); no se rechaza el nombre, se recorta.

## Decisions

### Límite de 16 caracteres
Se adopta 16 por coherencia con el perfil local y porque los nombres de 24 desbordan las
fichas de la mesa. Alternativas: 12 o 10 (más cortos, pero inconsistentes con el perfil) y
seguir en 24 (no resuelve el problema).

### Constante única por target en lugar de literales repetidos
Se extrae `MAX_PLAYER_NAME_LENGTH = 16` a un módulo de configuración del cliente y
`MAX_NAME_LENGTH = 16` al servidor.
- **Reutilización (cliente):** se reutiliza el componente `NameField` (no se crea uno nuevo).
  Se extrae la constante a `src/config/online.ts` y se sustituyen los literales `24` de
  `NameField` (valor por defecto) y de `Online.tsx` (los dos `slice`). `Profile.tsx` puede
  pasar a usar la misma constante en lugar de su literal `16`.
- **Reutilización (servidor):** se extrae `MAX_NAME_LENGTH` junto a los tipos de sala
  (`server/game/types.ts`) y se usa en los tres `slice` de `handlers.ts`.
- **Por qué se repite la constante entre cliente y servidor:** son build targets separados
  sin módulo común importable; el repo ya espeja constantes de dominio (`MAX_SLOTS`/`MAX_PLAYERS`).
  No se crea infraestructura compartida solo para una constante.
- **Qué NO se extrae:** la conversión `name.trim() || placeholderName` es específica de cada
  handler del lobby (con textos/valores distintos) y no se repite lo suficiente como para
  justificar un helper; se deja inline.

### Recorte silencioso
Se mantiene `.slice(0, MAX)` en vez de rechazar con error: el campo ya impide escribir más,
y el recorte en servidor protege frente a peticiones manipuladas sin cambiar el contrato de
los eventos.

## Risks / Trade-offs

- **Deriva de la constante cliente/servidor** → ambos valores se documentan y se fijan en 16;
  cualquier cambio futuro debe tocar los dos puntos.
- **Nombres ya guardados más largos que 16** (salas en curso) → se muestran tal cual hasta
  que el jugador se renombre; no hay migración de datos porque las salas son efímeras.
- **Recorte silencioso en servidor** → un cliente modificado no recibe error, solo un nombre
  recortado; es el comportamiento deseado y el mismo que ya existía con 24.
