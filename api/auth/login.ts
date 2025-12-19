/**
 * Serverless Auth Login Endpoint
 * POST /api/auth/login
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SignJWT } from 'jose';

// Inline constants (can't import from shared/ in Vercel serverless)
const COOKIE_NAME = 'app_session_id';
const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

const DEMO_USERNAME = process.env.DEMO_USERNAME || 'admin';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'admin';
const JWT_SECRET = process.env.JWT_SECRET || 'observability-demo-secret';

interface StaticUser {
  id: number;
  openId: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'viewer' | 'editor';
}

const DEMO_USER: StaticUser = {
  id: 1,
  openId: 'demo-admin-001',
  username: 'admin',
  name: 'ADP Administrator',
  email: 'admin@adp.local',
  role: 'admin',
};

function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

async function createSessionToken(user: StaticUser): Promise<string> {
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + ONE_YEAR_MS) / 1000);
  const secretKey = getSecretKey();

  return new SignJWT({
    userId: user.id,
    openId: user.openId,
    username: user.username,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

function isSecureRequest(req: VercelRequest): boolean {
  const forwardedProto = req.headers['x-forwarded-proto'];
  if (forwardedProto === 'https') return true;
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Validate credentials
  if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
    try {
      const sessionToken = await createSessionToken(DEMO_USER);
      const isSecure = isSecureRequest(req);
      
      // Set cookie header
      const cookieParts = [
        `${COOKIE_NAME}=${sessionToken}`,
        `Max-Age=${Math.floor(ONE_YEAR_MS / 1000)}`,
        'Path=/',
        'HttpOnly',
        'SameSite=None',
      ];
      
      if (isSecure) {
        cookieParts.push('Secure');
      }
      
      res.setHeader('Set-Cookie', cookieParts.join('; '));
      
      return res.json({
        success: true,
        user: {
          id: DEMO_USER.id,
          username: DEMO_USER.username,
          name: DEMO_USER.name,
          role: DEMO_USER.role,
        },
      });
    } catch (error) {
      console.error('[Auth] Failed to create session:', error);
      return res.status(500).json({ error: 'Failed to create session' });
    }
  } else {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
}
