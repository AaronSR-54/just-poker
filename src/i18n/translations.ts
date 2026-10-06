/**
 * Diccionarios de la app. `es` es la fuente de verdad: su forma define el tipo
 * `Dict`, y `en` debe cubrir exactamente las mismas claves.
 *
 * Reglas:
 * - Usa `{param}` para interpolación.
 * - Mantén los marcadores `**negrita**` que consume `renderRich`.
 * - No agrupes lógica: compón frases desde claves pequeñas cuando el orden
 *   cambie entre idiomas.
 */

const es = {
  common: {
    you: 'Tú',
    back: 'Volver',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    next: 'Siguiente',
    skip: 'Omitir',
    finish: 'Terminar',
    backToMenu: 'Volver al menú',
    pressHighlighted: 'Pulsa el botón iluminado.',
  },

  difficulty: {
    easy: 'Fácil',
    medium: 'Media',
    hard: 'Difícil',
  },

  phase: {
    'pre-flop': 'Pre-flop',
    flop: 'Flop',
    turn: 'Turn',
    river: 'River',
    showdown: 'Showdown',
  },

  /** Nombres de las combinaciones indexados por `HAND_RANKS`. */
  handName: {
    0: 'Carta Alta',
    1: 'Pareja',
    2: 'Doble Pareja',
    3: 'Trío',
    4: 'Escalera',
    5: 'Color',
    6: 'Full House',
    7: 'Póker',
    8: 'Escalera de Color',
    9: 'Escalera Real',
  } as Record<number, string>,

  handDesc: {
    0: 'Sin ninguna combinación: manda la carta más alta.',
    1: 'Dos cartas del mismo valor.',
    2: 'Dos parejas distintas.',
    3: 'Tres cartas del mismo valor.',
    4: 'Cinco cartas seguidas de palos distintos.',
    5: 'Cinco cartas del mismo palo, sin importar el orden.',
    6: 'Un trío más una pareja.',
    7: 'Cuatro cartas del mismo valor.',
    8: 'Cinco cartas seguidas y del mismo palo.',
    9: 'A, K, Q, J y 10 del mismo palo. La mejor mano posible.',
  } as Record<number, string>,

  menu: {
    paragraph:
      '¿Quieres jugar al póker, pero todos los juegos están llenos de anuncios y botones que solo sirven para marearte y acaben haciéndote gastar dinero?',
    tagline: 'Relájate y juega.',
    continue: 'Continuar',
    continueEm: 'partida',
    continueHint: 'Dificultad {difficulty} - {hand}ª mano',
    new: 'Nueva',
    newEm: 'partida',
    newHint: 'Elige dificultad y siéntate a una mesa contra la IA.',
  },

  local: {
    titleEm: 'Elige la',
    titleRest: 'dificultad',
    difficultyLine: 'Dificultad {difficulty}.',
    play: 'Jugar',
    table: {
      easy: { title: 'El Remanso', blurb: 'Sin prisa ni presión.' },
      medium: { title: 'La Guarida', blurb: 'El equilibrio justo.' },
      hard: { title: 'La Fosa', blurb: 'Solo para quien sabe lo que hace.' },
    },
    rival: {
      mia: { alias: 'La Chispa', trait: 'Juega demasiadas manos, se retira bajo presión.' },
      dan: { alias: 'Ruleta Rusa', trait: 'Farolea al azar, sin lógica.' },
      sam: { alias: 'Camaleón', trait: 'Imita a los demás, sin estrategia.' },
      leo: { alias: 'El Protocolo', trait: 'Agresivo-prudente, juega por el libro.' },
      nora: { alias: 'Ojo Clínico', trait: 'Lee patrones de apuesta, muy paciente.' },
      kai: { alias: 'Doble Fondo', trait: 'Semi-farolea, difícil de leer.' },
      victor: { alias: 'Yo, Robot', trait: 'Frío, calcula probabilidades constantemente.' },
      elena: { alias: 'Viuda Negra', trait: 'Tiende trampas con manos fuertes, casi nunca se retira.' },
      rex: { alias: 'Toro Salvaje', trait: 'Hiperagresivo, sube en cada ronda.' },
    },
    confirm: {
      title: 'Ya tienes una partida en curso',
      message: 'Si empiezas una nueva, se descartará el progreso actual. ¿Quieres continuar?',
      confirm: 'Empezar nueva',
      cancel: 'Cancelar',
    },
  },

  handsGuide: {
    titleMain: 'Guía de',
    titleEm: 'manos',
    intro:
      'Diez combinaciones ordenadas de menor a mayor. Selecciona una para ver un ejemplo de cada una.',
  },

  game: {
    pot: 'Bote:',
    handNumber: 'Mano #{n}',
    unavailableTitle: 'Juego no disponible',
    unavailableBody: 'Esta sala aún no está lista. Vuelve al lobby.',
    loading: 'Cargando partida...',
    log: {
      foldThird: 'se ha retirado',
      foldSecond: 'te has retirado',
      checkThird: 'ha pasado',
      checkSecond: 'has pasado',
      callThird: 'ha igualado',
      callSecond: 'has igualado',
      raiseThird: 'ha subido',
      raiseSecond: 'has subido',
      blindThird: 'ha puesto la ciega',
      blindSecond: 'has puesto la ciega',
      wonWith: 'ha ganado con {hand}',
      wonYouWith: 'has ganado con {hand}',
      won: 'ha ganado',
      wonYou: 'has ganado',
    },
    quickMin: 'Min',
    quickHalf: '½',
    quickPot: 'Bote',
    quickAllIn: 'All-in',
    raise: 'Subir',
    raiseAmount: 'Subir {amount}',
    allInAmount: 'All-in {amount}',
    check: 'Pasar',
    fold: 'Retirarse',
    call: 'Igualar',
    callAmount: 'Igualar ({amount})',
    newHand: 'Nueva Mano',
    newGame: 'Nueva partida',
    selectDifficulty: 'Seleccionar dificultad',
    backHome: 'Volver a inicio',
    overEyebrow: 'Fin de la partida · {n} manos',
    overWon: 'Has ganado',
    overLost: 'Has perdido',
    place: '{n}.º',
    and: ' e ',
    leaveTitle: '¿Salir de la partida?',
    leaveMessage: 'Se perderá el progreso de la mano en curso.',
    leaveConfirm: 'Salir',
    leaveCancel: 'Seguir jugando',
  },

  settings: {
    title: 'Ajustes',
    open: 'Abrir ajustes',
    paused: 'Partida en pausa',
    resume: 'Reanudar partida',
    close: 'Cerrar ajustes',
    music: 'Música',
    sfx: 'Efectos de sonido',
    crt: 'Imagen (CRT)',
    speed: 'Velocidad de juego',
    language: 'Idioma',
    learn: 'Aprende',
    handsGuide: 'Guía de manos',
    handsGuideHint: 'Repasa las diez combinaciones.',
    tutorial: 'Ver tutorial',
    tutorialHint: 'Juega una mano guiada paso a paso.',
    support: 'Apoya el proyecto',
    buyMeCoffee: 'Buy me a coffee',
    supportText:
      'Just Poker es gratis y sin anuncios. Si te gusta, puedes apoyarme para seguir mejorando la aplicación.',
    supportCta: 'Invítame a un café',
    back: 'Volver',
    leave: 'Salir de la partida',
  },

  onboarding: {
    steps: [
      {
        title: 'Te damos la bienvenida',
        body: 'Antes de jugar, te enseño en un minuto cómo **crear una partida**. Después empezaremos con una mano guiada.',
      },
      {
        title: 'Crear una partida',
        body: 'Pulsa **«Nueva partida»** para elegir mesa y rivales.',
      },
      {
        title: 'Los niveles',
        body: 'Cada nivel cambia lo listos que son los rivales: **Fácil**, **Media** y **Difícil**. Cuanto más alto, más cuesta ganar.',
      },
      {
        title: 'Elige Fácil',
        body: 'Empecemos por **Fácil**, la mesa más relajada (Mia, Dan y Sam). Pulsa su tarjeta para seleccionarla.',
      },
      {
        title: 'A jugar',
        body: 'Pulsa **«Jugar»** y te llevo a tu primera mano guiada.',
      },
    ],
  },

  tutorial: {
    watch: 'Observa la mesa…',
    step: {
      'rules-welcome': {
        title: 'Cómo se juega',
        body: 'Estás en una mesa de **Texas Hold’em** contra otros tres rivales y vamos a jugar tu primera mano juntos, paso a paso. En resumen: el bote de cada mano se lo lleva la **mejor combinación** y gana quien termina con todas las fichas.',
      },
      welcome: {
        title: 'Tu asiento',
        body: 'Tú te sientas abajo: aquí ves tus **fichas** y tus **cartas**. Los otros tres asientos son rivales controlados por la IA.',
      },
      cards: {
        title: 'Tus cartas',
        body: 'Solo tú ves estas dos **cartas**. Con ellas y las cinco comunitarias formarás tu mejor mano de cinco cartas.',
      },
      actions: {
        title: 'Tus acciones',
        body: 'Estos son los cuatro botones del turno: **«Pasar»** (seguir sin apostar), **«Igualar»** (poner lo mismo que la apuesta mayor), **«Subir»** (apostar más) y **«Retirarse»** (abandonar la mano). Te iré diciendo cuál pulsar.',
      },
      board: {
        title: 'El centro de la mesa',
        body: 'Aquí aparecerán las cinco **cartas comunitarias**. El número del centro es el **bote**: todas las fichas apostadas en la mano.',
      },
      rivals: {
        title: 'Tres rivales',
        body: 'Cada rival empieza con 1.000 fichas y juega a su manera. En esta mesa son **Mia, Dan y Sam**.',
      },
      dealer: {
        title: 'La ficha de dealer',
        body: 'La ficha «D» marca quién reparte y dónde empiezan las posiciones. Rota una casilla en cada mano; esta primera mano **repartes tú**.',
      },
      'small-blind': {
        title: 'La ciega pequeña (SB)',
        body: 'Antes de repartir, el jugador a la izquierda del dealer pone la **ciega pequeña**: 10 fichas obligatorias. Aquí las pone Mia.',
      },
      'big-blind': {
        title: 'La ciega grande (BB)',
        body: 'El siguiente jugador pone la **ciega grande**: 20 fichas. Las dos ciegas ya están en el bote (30) y abren la ronda de apuestas.',
      },
      'info-preflop': {
        title: 'El preflop',
        body: 'Es la primera ronda de apuestas: cada jugador decide con solo sus dos **cartas privadas**, antes de que aparezca ninguna comunitaria. Las ciegas ya dejaron 30 fichas en el bote.',
      },
      'sam-called': {
        title: 'Sam ha igualado',
        body: 'Sam, el primero en hablar, ha puesto las mismas 20 fichas que la ciega grande para seguir en la mano. Eso es **«igualar»**. Ahora te toca a ti.',
      },
      'act-preflop': {
        title: 'Tu turno (preflop)',
        body: 'Tienes 20 fichas por igualar para ver el flop. Pulsa **«Igualar 20»**.',
      },
      'info-flop': {
        title: 'El flop',
        body: 'Se destapan tres **cartas comunitarias** y empieza otra ronda de apuestas.',
      },
      'act-flop': {
        title: 'Habla el flop',
        body: 'Nadie ha apostado todavía: pasa gratis con **«Pasar»**.',
      },
      'info-turn': {
        title: 'El turn',
        body: 'Llega la **cuarta carta comunitaria**. Otra ronda de apuestas.',
      },
      'act-raise': {
        title: 'Tu turno (turn)',
        body: 'Es tu turno y tienes el **trío de ases**. Pulsa **«Subir»** para abrir las opciones de apuesta.',
      },
      'raise-panel': {
        title: 'Atajos y deslizador',
        body: 'Los **atajos** fijan la apuesta de un toque: **Min** (el mínimo), **½** (medio bote), **Bote** y **All-in**. Con el **deslizador** la ajustas con precisión entre el mínimo y el máximo.',
      },
      'raise-choice': {
        title: 'Elige y sube',
        body: 'Pulsa un **atajo** o mueve el **deslizador**, y luego pulsa el botón **«Subir»** para confirmar la apuesta.',
      },
      'info-river': {
        title: 'El river',
        body: 'La **quinta y última carta comunitaria**. Después de esta ronda ya no quedan más cartas.',
      },
      'act-river': {
        title: 'Habla el river',
        body: 'Pasa una vez más y llegamos al **final de la mano**.',
      },
      'info-showdown': {
        title: 'El showdown',
        body: 'Se comparan las manos. Quien forme la **mejor combinación de cinco cartas** se lleva el bote. Puedes repasar todas las combinaciones en la **guía de manos**, disponible en el menú del juego.',
      },
      'info-winner': { title: 'Resultado', body: '' },
    } as Record<string, { title: string; body: string }>,
    resultEmpty: 'La mano ha terminado.',
    resultWon:
      '¡Has ganado el bote con **{hand}**! Tus dos ases más el as del flop forman un trío: fíjate cómo se iluminan las cartas ganadoras.',
    resultOtherWith: '{name} se lleva el bote con **{hand}**. La próxima será tuya.',
    resultOther: '{name} se lleva el bote. La próxima será tuya.',
    finishTitle: 'Ya sabes jugar una mano',
    chooseTable: 'Elegir mesa y jugar',
    replay: 'Repetir la mano',
  },
};

export type Dict = typeof es;

const en: Dict = {
  common: {
    you: 'You',
    back: 'Back',
    cancel: 'Cancel',
    confirm: 'Confirm',
    next: 'Next',
    skip: 'Skip',
    finish: 'Finish',
    backToMenu: 'Back to menu',
    pressHighlighted: 'Press the highlighted button.',
  },

  difficulty: {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
  },

  phase: {
    'pre-flop': 'Pre-flop',
    flop: 'Flop',
    turn: 'Turn',
    river: 'River',
    showdown: 'Showdown',
  },

  handName: {
    0: 'High Card',
    1: 'One Pair',
    2: 'Two Pair',
    3: 'Three of a Kind',
    4: 'Straight',
    5: 'Flush',
    6: 'Full House',
    7: 'Four of a Kind',
    8: 'Straight Flush',
    9: 'Royal Flush',
  } as Record<number, string>,

  handDesc: {
    0: 'No combination: the highest card wins.',
    1: 'Two cards of the same rank.',
    2: 'Two different pairs.',
    3: 'Three cards of the same rank.',
    4: 'Five consecutive cards of different suits.',
    5: 'Five cards of the same suit, in any order.',
    6: 'Three of a kind plus a pair.',
    7: 'Four cards of the same rank.',
    8: 'Five consecutive cards of the same suit.',
    9: 'A, K, Q, J and 10 of the same suit. The best possible hand.',
  } as Record<number, string>,

  menu: {
    paragraph:
      'Want to play poker, but every game is full of ads and buttons designed to dizzy you until you spend money?',
    tagline: 'Relax and play.',
    continue: 'Continue',
    continueEm: 'game',
    continueHint: 'Difficulty {difficulty} - hand {hand}',
    new: 'New',
    newEm: 'game',
    newHint: 'Pick a difficulty and sit at a table against the AI.',
  },

  local: {
    titleEm: 'Choose',
    titleRest: 'difficulty',
    difficultyLine: 'Difficulty: {difficulty}.',
    play: 'Play',
    table: {
      easy: { title: 'The Haven', blurb: 'No rush, no pressure.' },
      medium: { title: 'The Den', blurb: 'The right balance.' },
      hard: { title: 'The Pit', blurb: 'Only for those who know what they’re doing.' },
    },
    rival: {
      mia: { alias: 'The Spark', trait: 'Plays too many hands, folds under pressure.' },
      dan: { alias: 'Coin Flip', trait: 'Bluffs at random, no logic.' },
      sam: { alias: 'Chameleon', trait: 'Copies the others, no strategy.' },
      leo: { alias: 'The Protocol', trait: 'Aggressive but careful, plays by the book.' },
      nora: { alias: 'Clinical Eye', trait: 'Reads betting patterns, very patient.' },
      kai: { alias: 'Two-Faced', trait: 'Semi-bluffs, hard to read.' },
      victor: { alias: 'I, Robot', trait: 'Cold, constantly calculating the odds.' },
      elena: { alias: 'Black Widow', trait: 'Sets traps with strong hands, almost never folds.' },
      rex: { alias: 'Wild Bull', trait: 'Hyper-aggressive, raises every round.' },
    },
    confirm: {
      title: 'You already have a game in progress',
      message: 'If you start a new one, your current progress will be discarded. Do you want to continue?',
      confirm: 'Start new',
      cancel: 'Cancel',
    },
  },

  handsGuide: {
    titleMain: 'Hand',
    titleEm: 'guide',
    intro:
      'Ten combinations ordered from lowest to highest. Select one to see an example of each.',
  },

  game: {
    pot: 'Pot:',
    handNumber: 'Hand #{n}',
    unavailableTitle: 'Game unavailable',
    unavailableBody: 'This room isn’t ready yet. Go back to the lobby.',
    loading: 'Loading game...',
    log: {
      foldThird: 'folded',
      foldSecond: 'folded',
      checkThird: 'checked',
      checkSecond: 'checked',
      callThird: 'called',
      callSecond: 'called',
      raiseThird: 'raised',
      raiseSecond: 'raised',
      blindThird: 'posted the blind',
      blindSecond: 'posted the blind',
      wonWith: 'won with {hand}',
      wonYouWith: 'won with {hand}',
      won: 'won',
      wonYou: 'won',
    },
    quickMin: 'Min',
    quickHalf: '½',
    quickPot: 'Pot',
    quickAllIn: 'All-in',
    raise: 'Raise',
    raiseAmount: 'Raise {amount}',
    allInAmount: 'All-in {amount}',
    check: 'Check',
    fold: 'Fold',
    call: 'Call',
    callAmount: 'Call ({amount})',
    newHand: 'New Hand',
    newGame: 'New game',
    selectDifficulty: 'Select difficulty',
    backHome: 'Back to home',
    overEyebrow: 'Game over · {n} hands',
    overWon: 'You won',
    overLost: 'You lost',
    place: '{n}',
    and: ' and ',
    leaveTitle: 'Leave the game?',
    leaveMessage: 'Progress on the current hand will be lost.',
    leaveConfirm: 'Leave',
    leaveCancel: 'Keep playing',
  },

  settings: {
    title: 'Settings',
    open: 'Open settings',
    paused: 'Game paused',
    resume: 'Resume game',
    close: 'Close settings',
    music: 'Music',
    sfx: 'Sound effects',
    crt: 'Image (CRT)',
    speed: 'Game speed',
    language: 'Language',
    learn: 'Learn',
    handsGuide: 'Hand guide',
    handsGuideHint: 'Review the ten combinations.',
    tutorial: 'Watch tutorial',
    tutorialHint: 'Play a guided hand step by step.',
    support: 'Support the project',
    buyMeCoffee: 'Buy me a coffee',
    supportText:
      'Just Poker is free and ad-free. If you like it, you can support me to keep improving the app.',
    supportCta: 'Buy me a coffee',
    back: 'Back',
    leave: 'Leave the game',
  },

  onboarding: {
    steps: [
      {
        title: 'Welcome',
        body: 'Before you play, let me show you in a minute how to **create a game**. Then we’ll start with a guided hand.',
      },
      {
        title: 'Create a game',
        body: 'Press **“New game”** to choose a table and rivals.',
      },
      {
        title: 'The levels',
        body: 'Each level changes how sharp the rivals are: **Easy**, **Medium** and **Hard**. The higher, the harder to win.',
      },
      {
        title: 'Choose Easy',
        body: 'Let’s start with **Easy**, the most relaxed table (Mia, Dan and Sam). Tap its card to select it.',
      },
      {
        title: 'Let’s play',
        body: 'Press **“Play”** and I’ll take you to your first guided hand.',
      },
    ],
  },

  tutorial: {
    watch: 'Watch the table…',
    step: {
      'rules-welcome': {
        title: 'How to play',
        body: 'You’re at a **Texas Hold’em** table against three other rivals and we’ll play your first hand together, step by step. In short: the pot of each hand goes to the **best combination**, and whoever ends up with all the chips wins.',
      },
      welcome: {
        title: 'Your seat',
        body: 'You sit at the bottom: here you see your **chips** and your **cards**. The other three seats are AI-controlled rivals.',
      },
      cards: {
        title: 'Your cards',
        body: 'Only you see these two **cards**. With them and the five community cards you’ll form your best five-card hand.',
      },
      actions: {
        title: 'Your actions',
        body: 'These are the four buttons of your turn: **“Check”** (continue without betting), **“Call”** (match the highest bet), **“Raise”** (bet more) and **“Fold”** (give up the hand). I’ll tell you which one to press.',
      },
      board: {
        title: 'The center of the table',
        body: 'The five **community cards** will appear here. The number in the middle is the **pot**: all the chips bet in the hand.',
      },
      rivals: {
        title: 'Three rivals',
        body: 'Each rival starts with 1,000 chips and plays their own way. At this table they are **Mia, Dan and Sam**.',
      },
      dealer: {
        title: 'The dealer button',
        body: 'The “D” button marks who deals and where the positions start. It rotates one seat each hand; this first hand **you deal**.',
      },
      'small-blind': {
        title: 'The small blind (SB)',
        body: 'Before dealing, the player to the dealer’s left posts the **small blind**: 10 forced chips. Here Mia posts it.',
      },
      'big-blind': {
        title: 'The big blind (BB)',
        body: 'The next player posts the **big blind**: 20 chips. Both blinds are already in the pot (30) and open the betting round.',
      },
      'info-preflop': {
        title: 'The preflop',
        body: 'This is the first betting round: each player decides with only their two **private cards**, before any community card appears. The blinds have already put 30 chips in the pot.',
      },
      'sam-called': {
        title: 'Sam has called',
        body: 'Sam, first to speak, put in the same 20 chips as the big blind to stay in the hand. That’s **“calling”**. Now it’s your turn.',
      },
      'act-preflop': {
        title: 'Your turn (preflop)',
        body: 'You have 20 chips to call to see the flop. Press **“Call 20”**.',
      },
      'info-flop': {
        title: 'The flop',
        body: 'Three **community cards** are revealed and another betting round begins.',
      },
      'act-flop': {
        title: 'Flop betting',
        body: 'Nobody has bet yet: check for free with **“Check”**.',
      },
      'info-turn': {
        title: 'The turn',
        body: 'The **fourth community card** arrives. Another betting round.',
      },
      'act-raise': {
        title: 'Your turn (turn)',
        body: 'It’s your turn and you have **three aces**. Press **“Raise”** to open the betting options.',
      },
      'raise-panel': {
        title: 'Shortcuts and slider',
        body: 'The **shortcuts** set the bet in one tap: **Min** (the minimum), **½** (half pot), **Pot** and **All-in**. With the **slider** you fine-tune it between the minimum and maximum.',
      },
      'raise-choice': {
        title: 'Choose and raise',
        body: 'Press a **shortcut** or move the **slider**, then press the **“Raise”** button to confirm the bet.',
      },
      'info-river': {
        title: 'The river',
        body: 'The **fifth and final community card**. After this round there are no more cards.',
      },
      'act-river': {
        title: 'River betting',
        body: 'Check once more and we reach the **end of the hand**.',
      },
      'info-showdown': {
        title: 'The showdown',
        body: 'The hands are compared. Whoever makes the **best five-card combination** takes the pot. You can review all the combinations in the **hand guide**, available in the game menu.',
      },
      'info-winner': { title: 'Result', body: '' },
    } as Record<string, { title: string; body: string }>,
    resultEmpty: 'The hand is over.',
    resultWon:
      'You won the pot with **{hand}**! Your two aces plus the ace on the flop make three of a kind: notice how the winning cards light up.',
    resultOtherWith: '{name} takes the pot with **{hand}**. Better luck next time.',
    resultOther: '{name} takes the pot. Better luck next time.',
    finishTitle: 'You know how to play a hand now',
    chooseTable: 'Choose a table and play',
    replay: 'Replay the hand',
  },
};

export const messages = { es, en } as const;
