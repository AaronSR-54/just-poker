import { createSocketServer } from '../server/socket/server';

// Vercel Function: la plataforma gestiona el `Upgrade` del WebSocket.
// La ruta pública queda en `/api/socket-io/socket.io`.
export default createSocketServer();
