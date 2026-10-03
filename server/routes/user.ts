import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
export const userRouter = Router();

userRouter.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, username: true, avatar: true, points: true },
  });
  
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }
  
  res.json({ user });
});

userRouter.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { username, avatar } = req.body;
  
  const data: Record<string, string> = {};
  if (username) data.username = username;
  if (avatar) data.avatar = avatar;
  
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data,
    select: { id: true, username: true, avatar: true, points: true },
  });
  
  res.json({ user });
});

userRouter.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  const [history, points] = await Promise.all([
    prisma.gameHistory.findMany({
      where: { userId: req.user!.id },
      orderBy: { playedAt: 'desc' },
      take: 10,
    }),
    prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { points: true },
    }),
  ]);
  
  res.json({
    history: history.map(h => ({
      place: h.position,
      pts: h.pointsEarned,
      when: formatTimeAgo(h.playedAt),
      rivals: h.rivals.join(' · '),
    })),
    points: points?.points || 0,
  });
});

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} horas`;
  const days = Math.floor(hours / 24);
  return `hace ${days} días`;
}
