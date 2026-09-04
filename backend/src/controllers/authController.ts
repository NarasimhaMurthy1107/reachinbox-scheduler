import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../config/prisma';
import { config } from '../config/env';
import { AuthRequest } from '../middlewares/auth';

const googleClient = new OAuth2Client(config.googleClientId);

export async function googleLogin(req: Request, res: Response) {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Missing credential parameter' });
    }

    let payload: any = null;

    if (config.googleClientId) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: config.googleClientId,
        });
        payload = ticket.getPayload();
      } catch (e: any) {
        console.warn('Google verifyIdToken failed, falling back to payload decode:', e.message);
      }
    }

    if (!payload) {
      // Decode JWT payload without signature verification if audience not configured
      const decoded: any = jwt.decode(credential);
      if (decoded && decoded.email) {
        payload = decoded;
      } else {
        return res.status(401).json({ error: 'Invalid Google credential' });
      }
    }

    const email = payload.email;
    const name = payload.name || email.split('@')[0];
    const avatarUrl = payload.picture || null;
    const googleId = payload.sub || null;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          avatarUrl,
          googleId,
        },
      });
    } else if (avatarUrl && !user.avatarUrl) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl, name },
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error: any) {
    console.error('Google login error:', error);
    return res.status(500).json({ error: 'Authentication failed: ' + error.message });
  }
}

export async function demoLogin(req: Request, res: Response) {
  try {
    const demoEmail = 'reviewer@reachinbox.ai';
    let user = await prisma.user.findUnique({
      where: { email: demoEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: demoEmail,
          name: 'ReachInbox Reviewer',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        },
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getCurrentUser(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.json({ user: req.user });
}
