// PARKED (Fase 1.1): componente OnlineGame extraído de src/screens/Game.tsx.
// NO forma parte del build (vive fuera de src/). Se conserva para reactivar el
// modo online en la Fase 3. Depende de componentes compartidos que siguen en
// src/screens/Game.tsx y de src/net/useOnlineGame.
//
// Para reactivarlo: reinsertar en Game.tsx con sus imports y la rama
// `gameId?.startsWith('online-')` del router.
// ---------- Pantalla online ----------

const OnlineGame: React.FC<{ roomId: string }> = ({ roomId }) => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const user = useUserStore(s => s.user);
  const online = useOnlineGame(roomId);

  const [raiseAmount, setRaiseAmount] = useState(20);
  const [showRaise, setShowRaise] = useState(false);
  const [showEquity, setShowEquity] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(TURN_DURATION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const gameState = online.state;

  useEffect(() => {
    if (gameState && raiseAmount < gameState.minRaise) setRaiseAmount(gameState.minRaise);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.minRaise]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setTimerSeconds(TURN_DURATION);
    timerRef.current = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          stopTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  const currentPlayerIdx = gameState?.currentPlayer;
  const isHandOver = gameState?.handOver;
  useEffect(() => {
    if (currentPlayerIdx === undefined || isHandOver === undefined) return;
    if (currentPlayerIdx === 0 && !isHandOver) startTimer();
    else stopTimer();
    return stopTimer;
  }, [currentPlayerIdx, isHandOver, startTimer, stopTimer]);

  useEffect(() => {
    if (timerSeconds > 0 || !gameState) return;
    if (gameState.currentPlayer !== 0 || gameState.handOver) return;
    if (gameState.players[0].bet >= Math.max(...gameState.players.map(p => p.bet))) {
      online.handleAction('check');
    } else {
      online.handleAction('fold');
    }
    setShowRaise(false);
  }, [timerSeconds, gameState, online]);

  const leave = () => {
    online.leave();
    navigate('/online');
  };

  if (online.loading) {
    return (
      <div className="jp-screen">
        <div className="col center grow">
          <div className="jp-h2">Conectando a la mesa…</div>
        </div>
      </div>
    );
  }

  if (online.error || !gameState) {
    return (
      <div className="jp-screen">
        <div className="col center grow gap-4">
          <div className="jp-h2">No se pudo cargar la partida</div>
          <div className="jp-body faint">{online.error ?? 'Estado no disponible'}</div>
          <Button variant="outline" onClick={leave}>← Volver</Button>
        </div>
      </div>
    );
  }

  const state = gameState;
  const phase = state.phase;
  const pot = state.pot;
  const activePlayer = state.currentPlayer;
  const winner = state.winner;
  const showdown = state.showdown;
  const handOver = state.handOver;
  const human = state.players[0];
  const rivals = state.players.slice(1);
  const maxBet = Math.max(0, ...state.players.map(p => p.bet));
  const canCheck = human.bet >= maxBet;
  const callAmount = Math.max(0, maxBet - human.bet);
  const canRaise = human.chips > callAmount;
  const maxRaise = Math.max(0, human.chips - callAmount);

  const blindRoleFor = (playerId: number): 'dealer' | 'sb' | 'bb' | null => {
    if (playerId === state.dealer) return 'dealer';
    const alive = state.players.filter(p => !p.eliminated).map(p => p.id);
    if (alive.length < 2) return null;
    const pos = alive.indexOf(state.dealer);
    const sb = alive.length === 2 ? alive[pos] : alive[(pos + 1) % alive.length];
    const bb = alive.length === 2 ? alive[(pos + 1) % alive.length] : alive[(pos + 2) % alive.length];
    if (playerId === sb) return 'sb';
    if (playerId === bb) return 'bb';
    return null;
  };

  const humanHandName = (() => {
    if (human.cards.length < 2) return '';
    if (state.community.length >= 3) return evaluateHand(human.cards, state.community).name;
    const [a, b] = human.cards;
    if (a.rank === b.rank) return `Pareja de ${a.rank}`;
    return a.suit === b.suit ? `${a.rank} ${b.rank} del mismo palo` : '';
  })();

  const winningHandName = winner && winner.length > 0 && state.players[winner[0]].cards.length >= 2 && state.community.length >= 3
    ? evaluateHand(state.players[winner[0]].cards, state.community).name
    : '';

  const winnerData = (() => {
    if (!winner || winner.length === 0) return null;
    const names = winner.map(w => state.players[w].name).join(' y ');
    const totalWon = winner.reduce((acc, w) => acc + (state.winAmounts[w] || 0), 0);
    const handName = winner.includes(0) ? humanHandName : winningHandName;
    const handSuffix = handName ? ` con ${handName}` : '';
    if (winner.includes(0)) {
      return winner.length > 1
        ? { label: `Empate — ganaste ${state.winAmounts[0] ?? 0}${handSuffix}` }
        : { label: `Ganaste ${totalWon}${handSuffix}` };
    }
    return winner.length > 1
      ? { label: `${names} ganaron ${totalWon}${handSuffix}` }
      : { label: `${names} ganó ${totalWon}${handSuffix}` };
  })();

  const winningCards = (() => {
    if (!winner || winner.length === 0 || state.phase !== 'showdown' || state.community.length < 3) return new Set<string>();
    const winnerHand = evaluateHand(state.players[winner[0]].cards, state.community);
    return new Set(getRelevantCards(winnerHand).map(c => `${c.rank}${c.suit}`));
  })();

  const isDimmed = (card: { rank: string; suit: string }) =>
    winningCards.size > 0 && !winningCards.has(`${card.rank}${card.suit}`);

  const handleAction = (action: 'fold' | 'check' | 'call' | 'raise') => {
    if (action === 'raise') online.handleAction('raise', raiseAmount);
    else online.handleAction(action);
    setShowRaise(false);
  };

  const WinnerMessage = () => {
    if (!winnerData) return null;
    return (
      <motion.div
        className="row gap-2"
        style={{ alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="jp-h3" style={{ color: 'var(--bone)', fontSize: 16 }}>
          <strong>{winnerData.label}</strong>
        </span>
      </motion.div>
    );
  };

  const actionButtons = handOver ? (
    <div className="col gap-2" style={{ alignItems: 'center' }}>
      <WinnerMessage />
      {!state.gameOver && online.session?.isHost && (
        <Button variant="primary" size="sm" onClick={online.startNewHand}>Nueva Mano</Button>
      )}
      {!state.gameOver && !online.session?.isHost && (
        <span className="jp-caption">Esperando al anfitrión…</span>
      )}
    </div>
  ) : (
    <div className="row gap-2" style={{ justifyContent: 'center' }}>
      <Button variant="outline" size="sm" onClick={() => handleAction(canCheck ? 'check' : 'fold')} disabled={activePlayer !== 0}>
        {canCheck ? 'Pasar' : 'Retirarse'}
      </Button>
      <Button variant="outline" size="sm" onClick={() => handleAction('call')} disabled={activePlayer !== 0 || callAmount === 0}>
        {callAmount > 0 ? (callAmount >= human.chips ? `All-in ${human.chips}` : `Igualar ${callAmount}`) : 'Igualar'}
      </Button>
      <Button variant="primary" size="sm" onClick={() => setShowRaise(!showRaise)} disabled={activePlayer !== 0 || !canRaise}>
        Subir
      </Button>
    </div>
  );

  const humanCards = (
    <div className="col gap-1" style={{ alignItems: 'center' }}>
      {humanHandName && !handOver && <span className="jp-badge neutral">{humanHandName}</span>}
      <div className="row gap-2">
        {human.cards.length > 0
          ? human.cards.map((c, i) => (
              <PokerCard key={i} size="lg" rank={c.rank} suit={c.suit} dimmed={isDimmed(c)} />
            ))
          : <><PokerCard size="lg" back /><PokerCard size="lg" back /></>}
      </div>
    </div>
  );

  const humanInfo = (
    <div className="col gap-1" style={{ alignItems: 'center', minWidth: isMobile ? undefined : 140 }}>
      <div className="row gap-1" style={{ alignItems: 'center' }}>
        {blindRoleFor(0) && <BlindDot role={blindRoleFor(0)!} />}
        <span className={isMobile ? 'jp-label' : 'jp-h3'} style={{ fontSize: isMobile ? 11 : 16 }}>{human.name}</span>
        <RankBadge points={user.points} compact />
      </div>
      <div className={`jp-chip-stack${human.chips < 100 ? ' low' : ''}`}>
        <span className="icon">🪙</span>
        <span className="amt">{human.chips}</span>
        <AnimatePresence>
          {!handOver && human.bet > 0 && (
            <motion.span
              key={`spent-${human.bet}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="jp-round-spent"
            >
              −{human.bet}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {human.isAllIn && <span className="jp-badge warning">ALL-IN</span>}
    </div>
  );

  const rivalsRow = (
    <div className="row gap-2" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
      {rivals.map(r => (
        <RivalSlot
          key={r.id}
          compact={isMobile}
          name={r.name}
          rankPoints={online.rivalPoints(r.id)}
          cards={r.cards.length > 0 ? r.cards : undefined}
          folded={r.folded}
          eliminated={r.eliminated}
          isActive={activePlayer === r.id}
          isWinner={winner !== null && winner.includes(r.id)}
          lastAction={r.lastAction !== '—' ? r.lastAction : undefined}
          showdown={showdown}
          chips={r.chips}
          bet={r.bet}
          isAllIn={r.isAllIn}
          handOver={handOver}
          winAmount={handOver ? state.winAmounts[r.id] : 0}
          blindRole={blindRoleFor(r.id)}
          isDimmed={isDimmed}
        />
      ))}
    </div>
  );

  return (
    <div className="jp-screen">
      <FloatingMenu onLeave={leave} />
      <button
        className={`jp-equity-toggle${showEquity ? ' on' : ''}`}
        onClick={() => setShowEquity(v => !v)}
      >%</button>

      <div className="col" style={{ flex: 1, padding: isMobile ? '12px 14px' : '16px 48px 24px' }}>
        {rivalsRow}
        <div className="jp-table" style={isMobile ? { padding: '12px 0' } : undefined}>
          <CommunityRow
            phase={phase}
            community={state.community}
            pot={pot}
            handNumber={state.handNumber}
            cardSize={isMobile ? 'md' : 'xxl'}
            isDimmed={isDimmed}
          />
          <ActionLog state={state} />
        </div>

        <div className={isMobile ? 'col gap-3' : 'row'} style={isMobile ? { alignItems: 'center' } : { justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', paddingBottom: 20 }}>
          {activePlayer === 0 && !handOver && !isMobile && <TimerBar seconds={timerSeconds} max={TURN_DURATION} />}
          {!isMobile && humanInfo}
          <div className="col gap-1" style={isMobile ? { alignItems: 'center' } : { alignItems: 'center', position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 0 }}>
            {humanCards}
          </div>
          {isMobile && humanInfo}
          {isMobile && activePlayer === 0 && !handOver && (
            <div style={{ width: '80%' }}><TimerBar seconds={timerSeconds} max={TURN_DURATION} /></div>
          )}
          <div className="col gap-2" style={{ alignItems: 'center', minWidth: isMobile ? undefined : 200 }}>
            {actionButtons}
            {!isMobile && showRaise && activePlayer === 0 && !handOver && (
              <div className="jp-raise-dropdown">
                <RaisePanel
                  raiseAmount={raiseAmount}
                  onRaiseChange={setRaiseAmount}
                  onRaise={() => handleAction('raise')}
                  minRaise={state.minRaise}
                  maxRaise={Math.max(state.minRaise, maxRaise)}
                  potSize={pot}
                  playerChips={human.chips}
                  callAmount={callAmount}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {isMobile && showRaise && activePlayer === 0 && !handOver && (
        <RaiseSheet
          raiseAmount={raiseAmount}
          onRaiseChange={setRaiseAmount}
          onRaise={() => handleAction('raise')}
          onClose={() => setShowRaise(false)}
          minRaise={state.minRaise}
          maxRaise={Math.max(state.minRaise, maxRaise)}
          potSize={pot}
          playerChips={human.chips}
          callAmount={callAmount}
        />
      )}

      <AnimatePresence>
        {state.gameOver && (
          <GameOverOverlay
            state={state}
            onRestart={() => online.session?.isHost && online.restartGame()}
            onLeave={leave}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
