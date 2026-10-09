/**
 * Diccionarios de la app. `es` es la fuente de verdad: su forma define el tipo
 * `Dict`, y `en` debe cubrir exactamente las mismas claves.
 *
 * Cada sección vive en `locales/<idioma>/<seccion>.ts` para no concentrar todo
 * el diccionario en un único archivo.
 *
 * Reglas:
 * - Usa `{param}` para interpolación.
 * - Mantén los marcadores `**negrita**` que consume `renderRich`.
 * - No agrupes lógica: compón frases desde claves pequeñas cuando el orden
 *   cambie entre idiomas.
 */
import esCommon from './locales/es/common';
import esDifficulty from './locales/es/difficulty';
import esPhase from './locales/es/phase';
import esHandName from './locales/es/handName';
import esHandDesc from './locales/es/handDesc';
import esMenu from './locales/es/menu';
import esLocal from './locales/es/local';
import esHandsGuide from './locales/es/handsGuide';
import esGame from './locales/es/game';
import esSettings from './locales/es/settings';
import esOnboarding from './locales/es/onboarding';
import esTutorial from './locales/es/tutorial';

import enCommon from './locales/en/common';
import enDifficulty from './locales/en/difficulty';
import enPhase from './locales/en/phase';
import enHandName from './locales/en/handName';
import enHandDesc from './locales/en/handDesc';
import enMenu from './locales/en/menu';
import enLocal from './locales/en/local';
import enHandsGuide from './locales/en/handsGuide';
import enGame from './locales/en/game';
import enSettings from './locales/en/settings';
import enOnboarding from './locales/en/onboarding';
import enTutorial from './locales/en/tutorial';

const es = {
  common: esCommon,
  difficulty: esDifficulty,
  phase: esPhase,
  handName: esHandName,
  handDesc: esHandDesc,
  menu: esMenu,
  local: esLocal,
  handsGuide: esHandsGuide,
  game: esGame,
  settings: esSettings,
  onboarding: esOnboarding,
  tutorial: esTutorial,
};

export type Dict = typeof es;

const en: Dict = {
  common: enCommon,
  difficulty: enDifficulty,
  phase: enPhase,
  handName: enHandName,
  handDesc: enHandDesc,
  menu: enMenu,
  local: enLocal,
  handsGuide: enHandsGuide,
  game: enGame,
  settings: enSettings,
  onboarding: enOnboarding,
  tutorial: enTutorial,
};

export const messages = { es, en } as const;
