import { isOtherRoomJoin, normalizeRoomCode, type OnlineSession } from './onlineSession';

/** Sala abierta en pantalla: basta su código para decidir la entrada. */
export interface EntryRoom {
  code: string;
}

/**
 * Decisión de entrada a la pantalla de juego con amigos a partir de la
 * dirección (`?code=`), la sesión persistida y la sala abierta.
 *
 * Abrir una invitación nunca une por sí solo: sin sala ni sesión en curso la
 * decisión es `prefill`, para que el humano revise el nombre y confirme.
 */
export type OnlineEntry =
  /** Mostrar el paso de unirse con el código ya rellenado. */
  | { kind: 'prefill'; code: string }
  /** Reincorporarse a la sesión en curso (misma sala o recarga). */
  | { kind: 'rejoin'; session: OnlineSession }
  /** Pedir confirmación antes de abandonar la sala o partida en curso. */
  | { kind: 'confirm'; code: string }
  /** Nada que resolver (sin código, sin sesión o ya gestionado). */
  | { kind: 'ignore' };

export interface EntryInput {
  /** Código de la dirección (`?code=`), sin normalizar. */
  code: string | null | undefined;
  /** La navegación pide empezar una partida nueva: no reanudar la sesión. */
  wantsNewGame?: boolean;
  /** Sesión online activa en el dispositivo. */
  session: OnlineSession | null;
  /** Sala abierta en pantalla (lobby). */
  room: EntryRoom | null;
  /** Código ya resuelto en esta misma entrada (evita repetir el aviso). */
  handledCode?: string | null;
}

/**
 * Resuelve la entrada de forma pura y determinista:
 *
 * - Sin código: reanuda la sesión activa salvo que se pida partida nueva.
 * - Con código ya gestionado: no repite la acción.
 * - Con sala o sesión de **otro** código: pide confirmación.
 * - Con sesión del **mismo** código: se reincorpora.
 * - Sin sala ni sesión: rellena el formulario de unirse (nunca une solo).
 */
export function resolveOnlineEntry({
  code,
  wantsNewGame = false,
  session,
  room,
  handledCode = null,
}: EntryInput): OnlineEntry {
  const target = normalizeRoomCode(code);

  if (!target) {
    return session && !wantsNewGame ? { kind: 'rejoin', session } : { kind: 'ignore' };
  }
  if (handledCode === target) return { kind: 'ignore' };
  if (room) {
    return isOtherRoomJoin(room, target) ? { kind: 'confirm', code: target } : { kind: 'ignore' };
  }
  if (session) {
    return isOtherRoomJoin(session, target)
      ? { kind: 'confirm', code: target }
      : { kind: 'rejoin', session };
  }
  return { kind: 'prefill', code: target };
}
