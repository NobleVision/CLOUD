/**
 * Serverless Auth Logout Endpoint
 * POST /api/auth/logout
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { COOKIE_NAME } from '../../shared/const';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Clear the session cookie
  const cookieParts = [
    `${COOKIE_NAME}=`,
    'Max-Age=0',
    'Path=/',
    'HttpOnly',
    'SameSite=None',
  ];

  res.setHeader('Set-Cookie', cookieParts.join('; '));
  return res.json({ success: true });
}
