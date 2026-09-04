import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma } from '../config/prisma';
import { AuthUser } from '../types';

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;
      req.user = decoded;
      return next();
    } catch (err) {
      // Invalid token, continue to fallback
    }
  }

  // Fallback demo user
  try {
    const demoUser = await prisma.user.findFirst();
    if (demoUser) {
      req.user = {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name || 'Demo Reviewer',
        avatarUrl: demoUser.avatarUrl || undefined,
      };
    } else {
      req.user = undefined;
    }
  } catch (err) {
    req.user = undefined;
  }

  next();
}
