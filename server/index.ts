// Servidor de desarrollo para el modo online (socket.io sobre WebSocket).
// En producción el endpoint es la Function `api/socket-io.ts`.
import { createSocketServer } from './socket/server';

const PORT = parseInt(process.env.PORT || '3001', 10);

createSocketServer().listen(PORT, () => {
  console.log(`Online dev server on http://localhost:${PORT}`);
});
