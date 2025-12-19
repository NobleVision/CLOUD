/**
 * Serverless Auth Session Endpoint
 * GET /api/auth/session
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parse as parseCookieHeader } from 'cookie';
import { jwtVerify } from 'jose';
import { COOKIE_NAME } from '../../shared/const';

const JWT_SECRET = process.env.JWT_SECRET || 'observability-demo-secret';

function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

interface SessionUser {
  id: number;
  username: string;
  name: string;
  role: string;
}

async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    if (!payload.userId || !payload.openId) {
      return null;
    }

    return {
      id: payload.userId as number,
      username: payload.username as string,
      name: payload.name as string,
      role: payload.role as string,
    };
  } catch (error) {
    console.warn('[Session] Verification failed:', error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return res.json({ authenticated: false });
  }

  const cookies = parseCookieHeader(cookieHeader);
  const sessionToken = cookies[COOKIE_NAME];

  if (!sessionToken) {
    return res.json({ authenticated: false });
  }

  const user = await verifySessionToken(sessionToken);

  if (user) {
    return res.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } else {
    return res.json({ authenticated: false });
  }
}
