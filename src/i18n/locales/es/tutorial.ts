const tutorial = {
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
};

export default tutorial;
