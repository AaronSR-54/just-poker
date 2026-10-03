import { Router, Response } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { gameManager } from '../game/GameManager.js';

export const roomRouter = Router();

roomRouter.post('/create', authMiddleware, (req: AuthRequest, res: Response) => {
  const { type } = req.body;
  
  if (type === 'private') {
    const room = gameManager.createRoom('private');
    res.json({ roomId: room.id, code: room.code });
  } else {
    const room = gameManager.createRoom('public');
    res.json({ roomId: room.id });
  }
});

roomRouter.post('/join', authMiddleware, (req: AuthRequest, res: Response) => {
  const { code } = req.body;
  
  const room = gameManager.joinPrivateRoom(code);
  if (!room) {
    res.status(404).json({ error: 'Sala no encontrada' });
    return;
  }
  
  res.json({ roomId: room.id });
});

roomRouter.get('/public', authMiddleware, (_req: AuthRequest, res: Response) => {
  const room = gameManager.findPublicRoom();
  if (room) {
    res.json({ roomId: room.id });
  } else {
    const newRoom = gameManager.createRoom('public');
    res.json({ roomId: newRoom.id });
  }
});
