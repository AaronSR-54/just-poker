const local = {
  titleEm: 'Elige la',
  titleRest: 'dificultad',
  difficultyLine: 'Dificultad {difficulty}.',
  play: 'Empezar partida',
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
};

export default local;
