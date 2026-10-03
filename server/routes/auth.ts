import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { generateToken, type AuthRequest, type AuthUser } from '../middleware/auth.js';

let prisma: PrismaClient | null = null;
try {
  prisma = new PrismaClient();
} catch {
  prisma = null;
}

export const authRouter = Router();

/**
 * Invitado: emite un JWT sin tocar la base de datos.
 * Permite jugar online sin registro (los puntos viven en el cliente).
 */
authRouter.post('/guest', async (req: AuthRequest, res: Response) => {
  const username = (req.body?.username as string)?.trim().slice(0, 16) || 'Invitado';
  const user: AuthUser = {
    id: `guest-${Math.random().toString(36).slice(2, 10)}`,
    username,
    points: typeof req.body?.points === 'number' ? Math.max(0, Math.floor(req.body.points)) : 0,
    avatar: username.slice(0, 2).toUpperCase(),
  };
  const token = generateToken(user);
  res.json({ token, user });
});

authRouter.post('/register', async (req: AuthRequest, res: Response) => {
  if (!prisma) {
    res.status(503).json({ error: 'Base de datos no disponible. Usa el modo invitado.' });
    return;
  }
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Usuario y contraseña requeridos' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      res.status(409).json({ error: 'El usuario ya existe' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hashedPassword },
    });

    const authUser = { id: user.id, username: user.username, points: user.points, avatar: user.avatar };
    const token = generateToken(authUser);

    res.json({ token, user: authUser });
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

authRouter.post('/login', async (req: AuthRequest, res: Response) => {
  if (!prisma) {
    res.status(503).json({ error: 'Base de datos no disponible. Usa el modo invitado.' });
    return;
  }
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastSeen: new Date() } });

    const authUser = { id: user.id, username: user.username, points: user.points, avatar: user.avatar };
    const token = generateToken(authUser);

    res.json({ token, user: authUser });
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});
