# Design

## Context

See `proposal.md` - Why. Hoy, al salir (`room:leave`) o desconectarse, el servidor llama a
`GameManager.markDisconnected` y conserva el asiento (`socketId = ''`) sin límite de tiempo; el
anfitrión resuelve el turno del ausente con check-si-puede/fold (`useOnlineGame` + `onlineRoom`).
El motor (`PokerGame`) elimina a los jugadores sin fichas al empezar mano y declara `gameOver`
cuando solo queda uno con fichas. La sesión del menú caduca a los 30 min (`ONLINE_RESUME_WINDOW_MS`).

## Goals / Non-Goals

**Goals:**

- Expulsar a un jugador ausente pasado un tiempo `X`, liberando su asiento e impidiendo su reingreso.
- Que un jugador ausente no pueda ganar la mano ni la partida por no apostar.
- Que la partida pueda terminar de forma normal con los jugadores presentes.

**Non-Goals:**

- No cambiar la entrada/lobby ni el flujo offline.
- No añadir una acción de UI para «expulsar» a mano.
- No cambiar las reglas del póker ni el reparto.

## Decisions

**1. El servidor es la fuente de verdad de la ausencia y la expulsión.**
El servidor registra cuándo dejó de estar el jugador (`markedDisconnected`/`room:leave`) y decide la
expulsión, porque es quien puede **impedir el reingreso** y liberar el asiento a nivel de sala.
Alternativa considerada: que lo decidiera el anfitrión; se descarta porque no puede bloquear el
reingreso ni liberar el asiento.

**2. Expiración por temporizador + comprobación perezosa.**
Se marca la ausencia con una marca temporal en `RoomPlayer`. Un temporizador por sala dispara la
expulsión, y además cada evento de la sala comprueba si algún ausente superó `X` (respaldo ante la
rotación de instancias / uso de Redis). Alternativa: solo temporizador; se descarta por fragilidad
en serverless.

**3. Al expirar, el servidor quita al jugador y avisa a la mesa.**
El servidor elimina al jugador de la sala y emite un aviso con su `userId` a los que quedan (si no
queda nadie, cierra la sala). El **anfitrión** (conectado, autoritativo del motor) recibe el aviso,
elimina ese asiento del juego y redifunde el estado. Alternativa: que el servidor edite el estado
del juego; se descarta porque el estado vive en el anfitrión.

**4. Eliminar el asiento en el motor.**
Se añade un método público al motor para eliminar un asiento: lo retira si la mano está en curso y
lo marca sin fichas/eliminado. El cierre de partida ya existente (un solo jugador con fichas) hace
que la partida termine y gane quien permanece. Alternativa: reutilizar un fold + dejar fichas a 0 sin
método; se descarta porque el motor ya encapsula el estado y conviene una operación explícita.

**5. Los ausentes se retiran, no hacen check.**
En el turno de un rival ausente (y al detectar su salida) el anfitrión aplica **fold**, no
check-si-puede, para que no llegue al showdown y gane sin apostar. Se ajusta la resolución actual
(`onPeerLeft` / `scheduleRemoteTimeout`).

**6. Duración de la gracia: `X = 120 s` (constante, configurable).**
Suficiente para absorber un corte breve o una reincorporación rápida y mayor que `TURN_DURATION`
(30 s), de modo que la expulsión no compita con la resolución de un turno. Alternativa: un valor más
largo (minutos); se descarta para no alargar la partida bloqueada con un asiento zombi.

**7. Alinear la ventana de reanudación del menú con `X`.**
`ONLINE_RESUME_WINDOW_MS` pasa a `X`, para que el menú deje de ofrecer «Continuar partida» en cuanto
el asiento puede haber caducado. Alternativa: mantener 30 min y confiar en la red de seguridad «sala
cerrada»; se descarta para no ofrecer una continuación condenada a fallar.

## Risks / Trade-offs

- [Temporizadores poco fiables con varias instancias] → Comprobación perezosa de la ausencia en cada
  evento de la sala como respaldo del temporizador.
- [La expulsión ocurre con el anfitrión original ausente] → El failover ya promueve a otro jugador
  conectado al salir el anfitrión; ese nuevo anfitrión aplica la eliminación al recibir el aviso.
- [Una desconexión breve no debe expulsar] → La ventana `X` absorbe cortes cortos; solo se expulsa
  tras superar `X` sin reincorporarse.
- [Eliminar a un jugador a mitad de mano puede descuadrar el turno] → La eliminación lo retira y el
  motor salta asientos no disponibles (`skipUnavailable`), igual que con cualquier jugador retirado.
