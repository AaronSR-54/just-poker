import { io } from 'socket.io-client';

const URL = 'http://localhost:3001';

async function guest(name) {
  const res = await fetch(`${URL}/api/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: name, points: 100 }),
  });
  return res.json();
}

function connect(token) {
  return new Promise((resolve, reject) => {
    const s = io(URL, { auth: { token }, transports: ['websocket'] });
    s.on('connect', () => resolve(s));
    s.on('connect_error', reject);
    setTimeout(() => reject(new Error('timeout connect')), 5000);
  });
}

function emitAck(socket, event, data = {}) {
  return new Promise((resolve, reject) => {
    socket.timeout(5000).emit(event, data, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

const names = ['Alice', 'Bob', 'Cara', 'Dan'];
const auths = await Promise.all(names.map(guest));
const socks = await Promise.all(auths.map(a => connect(a.token)));
console.log('connected', socks.length);

// Alice crea pública
const create = await emitAck(socks[0], 'room:create', { type: 'public' });
console.log('create', create);
const roomId = create.roomId;

// Los demás se unen
for (let i = 1; i < 4; i++) {
  const r = await emitAck(socks[i], 'room:join', { roomId });
  console.log('join', names[i], r);
}

// Esperar room:starting (auto con 4)
const starting = await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('no starting')), 8000);
  socks[0].on('room:starting', (d) => { clearTimeout(t); resolve(d); });
  // Si no auto-start, forzar
  setTimeout(() => socks[0].emit('room:start', { roomId }), 3500);
});
console.log('starting seats', starting.seats.map(s => s.username).join(', '), 'host', starting.hostId);

// Host simula estado
const hostSock = socks[0];
hostSock.emit('game:state', {
  roomId,
  state: {
    phase: 'pre-flop', pot: 30, currentPlayer: 0, dealer: 0,
    players: starting.seats.map((s, i) => ({
      id: i, name: s.username, cards: [], chips: 1000, bet: 0,
      folded: false, isAllIn: false, eliminated: false, lastAction: '—',
    })),
    community: [], winner: null, winAmounts: [0,0,0,0],
    showdown: false, handOver: false, gameOver: false, gameWinner: null,
    handNumber: 1, actions: [], minRaise: 20, smallBlind: 10, bigBlind: 20,
  },
});

// Bob recibe estado
const stateOk = await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('no state')), 3000);
  socks[1].on('game:state', () => { clearTimeout(t); resolve(true); });
});
console.log('bob got state', stateOk);

// Bob envía acción
const peerOk = await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('no peer action')), 3000);
  hostSock.on('game:peer-action', (d) => { clearTimeout(t); resolve(d); });
  socks[1].emit('game:action', { roomId, type: 'call' });
});
console.log('host got peer action', peerOk);

// Privada con código
const priv = await emitAck(socks[0], 'room:create', { type: 'private' });
console.log('private', priv.code, priv.roomId);
const joinCode = await emitAck(socks[1], 'room:join', { code: priv.code });
console.log('join by code', joinCode);

console.log('SMOKE OK');
socks.forEach(s => s.disconnect());
process.exit(0);
