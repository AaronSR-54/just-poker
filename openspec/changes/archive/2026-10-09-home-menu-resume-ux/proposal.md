# Proposal

## Why

Las tarjetas del menú de inicio ("Jugar en local" y "Jugar con amigos") no comunican bien la vuelta a una partida en curso: la tarjeta entera siempre empieza una partida nueva y la continuación quedaba escondida como botón secundario y texto solo visible al pasar el ratón. Quien vuelve a la app no ve de un vistazo que tiene una partida a medias ni cuál retomar.

## What Changes

- El menú mantiene **exactamente dos tarjetas dinámicas** (local y online), nunca cuatro, y cada una refleja si su modalidad tiene partida en curso.
- **Jerarquía con una única tarjeta destacada** (`filled` = acción recomendada) según una sola regla:
  - sin partidas → se destaca la **local**;
  - una partida en curso → se destaca **esa**;
  - dos partidas en curso → se destaca la **jugada más recientemente**.
- Tarjeta con partida en curso: estado **«Partida en curso»** como texto (sin insignia), contexto resumido siempre visible (local: dificultad + mano; online: sala + jugadores), zona superior con la acción **«Continuar»** rotulada junto a la flecha, y una **fila inferior de ancho completo «Nueva partida»** (tarjeta "cortada" en dos zonas).
- Tarjeta sin partida: estilo actual con la acción **«Nueva partida»** rotulada junto a la flecha.
- La modalidad online solo cuenta como "partida en curso" si su última actividad fue hace **30 minutos o menos**; pasada esa ventana se muestra como nueva y se descarta la sesión (evita ofrecer salas muertas).
- Un **marcador de última actividad por modalidad** da la recencia necesaria para el caso de dos partidas.
- En el hub online, cuando hay sesión válida, aparece **dentro del bloque de acciones una opción "Volver a la partida"** (con contexto) como acción principal, pasando "Crear partida" a secundaria.
- Textos nuevos/ajustados pasan por i18n (`es`/`en`).

Fuera de alcance: sin auto-navegación al abrir; sin evento de servidor de validación (la ventana temporal es el criterio). El motor de juego y la red se reutilizan; la persistencia mantiene sus formatos y solo se añade el marcador de actividad.

## Capabilities

### New Capabilities
- `game-entry`: comportamiento de las superficies de entrada al juego (menú de inicio y hub online) al detectar partidas en curso, ofrecer continuarlas y ofrecer empezar una nueva, incluida la jerarquía de una única acción recomendada y la ventana de validez online.

### Modified Capabilities
<!-- Ninguna: la persistencia local y la sesión online conservan su comportamiento especificado; solo se añade un marcador de actividad interno. -->

## Impact

- Código: `src/screens/Menu.tsx`, `src/components/CtaCard.tsx`, `src/screens/Online.tsx`, `src/i18n/locales/{es,en}/menu.ts` y `online.ts`, y un helper nuevo de última actividad.
- Reutilización: se reutilizan `CtaCard`, `Button`, `Hero`, `SettingsButton`, `GameSettings`, los helpers `loadSavedGame`, `getOnlineSession` y `connectSocket`/`emitAck`. Se elimina el uso de `Badge` en la tarjeta (el estado pasa a texto).
- Deuda relacionada a resolver si se toca: `src/components/OnboardingCoach.tsx` apunta a `data-tour="new-game"`, que ya no existe en el menú (target obsoleto).
- Añade un pequeño módulo de "última actividad" y una ventana temporal para la sesión online; sin cambios de dependencias ni de esquema de datos.
