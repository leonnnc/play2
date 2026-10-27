import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { config } from '../config.js';
import { store } from './store.js';
import type { UserRecord } from '../types.js';

export interface AuthedRequest extends Request {
  user?: UserRecord;
}

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

export function signToken(user: UserRecord): string {
  return jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: `${config.tokenTtlDays}d`,
  });
}

function readToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

function resolveUser(req: Request): UserRecord | null {
  const token = readToken(req);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub?: string };
    if (!payload.sub) return null;
    return store.db.users.find((u) => u.id === payload.sub) ?? null;
  } catch {
    return null;
  }
}

/** Adjunta el usuario si hay token valido, pero no bloquea. */
export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const user = resolveUser(req);
  if (user) req.user = user;
  next();
}

/** Exige token valido. */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const user = resolveUser(req);
  if (!user) {
    res.status(401).json({ error: 'Sesion requerida. Inicia sesion para continuar.' });
    return;
  }
  req.user = user;
  next();
}

/** Rate limit en memoria muy simple para endpoints sensibles. */
const attempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const entry = attempts.get(key);
    if (!entry || entry.resetAt < now) {
      attempts.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    entry.count += 1;
    if (entry.count > max) {
      res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos.' });
      return;
    }
    next();
  };
}
