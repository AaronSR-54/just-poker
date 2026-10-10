import { createSocketServer } from '../server/socket/server.js';

// Vercel Function: la plataforma gestiona el `Upgrade` del WebSocket.
// La función solo responde en su ruta exacta, `/api/socket-io`.
export default createSocketServer();
