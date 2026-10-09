# Smoke checklist — refactor puro (móvil + desktop)

Comprobar que el comportamiento observable es idéntico antes/después de cada extracción.
Marcar cada flujo en al menos una vista móvil (<768px) y una de escritorio (≥1024px);
repetir en tablet (768–1023px) y en altura corta (<720px) en los pasos que toquen layout.

## Navegación e inicialización
- [x] Menu → Local → Game: la partida arranca con la dificultad correcta (easy/medium/hard).
- [x] Reanudar partida (`/game/local-…?continue=1`) restaura mano, fichas y calle pendiente.
- [x] Sin partida guardada, arranca una nueva; al terminar la partida se limpia el guardado.
- [ ] Persistencia: recargar a mitad de mano y reanudar mantiene el estado.
        #fix Al recargar a mitad de mano, me cambia las cartas. arreglar eso

## Mano y acciones del humano
- [x] Retirarse / Pasar / Igualar funcionan y respetan los `disabled` cuando no es tu turno.
- [x] Subir: atajos (mínimo, 1/2 bote, bote, all-in), slider y botón de confirmar.
- [x] El panel/sheet de subida abre y cierra en móvil (sheet) y desktop (panel).
- [x] All-in: etiqueta ALL-IN en asiento humano y rival; el bote cuadra.
- [x] El importe de subida queda acotado a `[minRaise, maxRaise]`.

## Temporizador y turnos de IA
- [x] Barra de temporizador visible en el turno humano y del rival activo.
- [x] Tic-tac en los últimos 5 s y sonido de expiración al agotarse.
- [x] Al agotarse el tiempo: check si es posible, si no fold; la partida continúa.
- [x] Los rivales deciden con su retardo y nunca se quedan bloqueados (red de seguridad).

## Mesa, cartas y bote
- [x] Ciegas: chips de dealer/SB/BB correctos en cada asiento.
- [x] Cartas comunitarias se descubren por calle (flop 3, turn 4, river 5).
- [x] Bote se muestra, se resta y se desvanece durante el reparto (`PotAward`).
- [x] Showdown: cartas boca arriba, etiqueta de jugada y atenuado de cartas no ganadoras.
- [x] Asientos retirados/eliminados se atenúan o desaparecen como antes.
- [x] Delta de fichas (+/−) bajo los totales.
- [x] Log de acciones: compacto en móvil (última línea) y completo en desktop; línea de ganador.

## Fin de partida
- [x] Tras el showdown aparece el overlay con la clasificación (con retardo).
- [x] Botones: nueva partida, elegir dificultad y volver al menú funcionan.

## Ajustes y salida
- [ ] Ajustes abre/cierra y pausa temporizador e IA mientras está abierto.
        #fix Si es mi turno, el temporizador se pausa, y se reinicia en cuanto vuelvo a jugar. deberia mantenerse el estado 
- [x] Enlaces a tutorial y guía de manos navegan correctamente.
- [x] Salir pide confirmación; confirmar limpia el guardado y va al menú; cancelar no hace nada.

## Tutorial guiado (`/game/guide`)
- [x] El coach guía con el mazo/flujo de tutorial; `expectedAction` limita los botones.
        #fix cuando pruebo a hacer all-in en el tutorial, como esa mano la gano, se salta unos pasos del tutorial, y aparece el modal de victoria, habria que limitar que no se pudiera hacer all-in
- [x] Pausa/reanudar el coach; reiniciar el tutorial funciona.
- [x] Terminar el tutorial completa el onboarding y navega a `/local`.

## Responsive
- [x] Móvil (<768px): layout de una columna, botones en fila, sheet de subida.
- [x] Desktop (≥1024px, xl): log en columna izquierda, layout de 3 filas.
- [x] Tablet (768–1023px): botón de subir apilado.
- [x] Altura corta (<720px): la mesa se comprime y cabe sin recortarse.
