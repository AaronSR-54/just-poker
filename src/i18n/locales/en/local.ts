const local = {
  titleEm: 'Choose',
  titleRest: 'difficulty',
  difficultyLine: 'Difficulty: {difficulty}.',
  play: 'Start game',
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
};

export default local;
