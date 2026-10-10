import { createSocketServer } from '../server/socket/server.js';
import { log } from '../server/log.js';

// Vercel Function: la plataforma gestiona el `Upgrade` del WebSocket.
// La función solo responde en su ruta exacta, `/api/socket-io`.
log('boot', 'function module loaded');

export default createSocketServer();
