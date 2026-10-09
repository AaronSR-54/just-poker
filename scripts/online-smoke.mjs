import { io } from 'socket.io-client';

const URL = process.env.ONLINE_URL || 'http://localhost:3001';

function connect() {
  return new Promise((resolve, reject) => {
    const s = io(URL, { transports: ['websocket'] });
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

function once(socket, event) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`no ${event}`)), 5000);
    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

const alice = await connect();
const bob = await connect();
console.log('connected', Boolean(alice.connected), Boolean(bob.connected));

// Alice crea una partida privada
const created = await emitAck(alice, 'room:create', { name: 'Alice' });
if (!created?.ok) throw new Error(`create failed: ${JSON.stringify(created)}`);
console.log('create', created.code, created.roomId);
if (!/^\d{4}$/.test(created.code)) throw new Error('code is not 4 digits');

// Bob se une por código
const startingAlice = once(alice, 'room:starting');
const startingBob = once(bob, 'room:starting');
const joined = await emitAck(bob, 'room:join', { code: created.code, name: 'Bob' });
if (!joined?.ok) throw new Error(`join failed: ${JSON.stringify(joined)}`);
console.log('join by code', joined.roomId, 'started:', joined.started);

// Bob se renombra antes de empezar
const renamed = await emitAck(bob, 'room:rename', { roomId: created.roomId, name: 'Bobby' });
if (!renamed?.ok) throw new Error(`rename failed: ${JSON.stringify(renamed)}`);

// Alice inicia (es la anfitriona)
const started = await emitAck(alice, 'room:start', { roomId: created.roomId });
if (!started?.ok) throw new Error(`start failed: ${JSON.stringify(started)}`);
const [seatsA, seatsB] = await Promise.all([startingAlice, startingBob]);
console.log('starting seats', seatsA.seats.map((s) => s.username).join(', '), 'host', seatsA.hostId);
if (seatsB.seats.length !== 2) throw new Error('expected 2 real seats');

// Un tercero no puede entrar en una partida empezada
const late = await emitAck(await connect(), 'room:join', { roomId: created.roomId, name: 'Cara' });
if (late?.ok) throw new Error('late join should fail');
console.log('late join rejected:', late.error);

// El host difunde estado y Bob lo recibe
const bobState = once(bob, 'game:state');
alice.emit('game:state', {
  roomId: created.roomId,
  state: {
    phase: 'pre-flop',
    pot: 30,
    currentPlayer: 0,
    dealer: 0,
    players: seatsA.seats.map((s, i) => ({
      id: i, name: s.username, avatar: '', cards: [], chips: 1000, bet: 0,
      folded: false, isAllIn: false, eliminated: false, lastAction: '—',
    })),
    community: [], winner: null, winAmounts: [0, 0], committed: [0, 0],
    showdown: false, handOver: false, gameOver: false, gameWinner: null,
    handNumber: 1, actions: [], minRaise: 20, smallBlind: 10, bigBlind: 20,
    streetPending: false,
  },
});
await bobState;
console.log('bob got state');

// La acción de Bob llega al host
const peerAction = once(alice, 'game:peer-action');
bob.emit('game:action', { roomId: created.roomId, type: 'call' });
const action = await peerAction;
console.log('host got peer action', action.type);

// Un código inexistente no entra
const missing = await emitAck(await connect(), 'room:join', { code: '9999', name: 'Nadie' });
if (missing?.ok) throw new Error('missing code should fail');
console.log('unknown code rejected:', missing.error);

console.log('SMOKE OK');
[alice, bob].forEach((s) => s.disconnect());
process.exit(0);
