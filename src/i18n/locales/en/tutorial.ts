const tutorial = {
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
};

export default tutorial;
