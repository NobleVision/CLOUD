/**
 * Serverless Context for Vercel Functions
 * 
 * Creates a tRPC-compatible context from Vercel's request/response objects
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parse as parseCookieHeader } from 'cookie';
import { jwtVerify } from 'jose';
import type { User } from '../../drizzle/schema';
import type { TrpcContext } from '../../server/_core/context';
import { COOKIE_NAME } from '../../shared/const';
import { getServerlessDb } from './serverlessDb';

const JWT_SECRET = process.env.JWT_SECRET || 'observability-demo-secret';

function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

/**
 * Verify static auth token and return user
 */
async function verifyStaticAuthToken(token: string): Promise<User | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    if (payload.userId && payload.username) {
      const now = new Date();
      return {
        id: payload.userId as number,
        openId: (payload.openId as string) || `static-${payload.userId}`,
        email: `${payload.username}@adp.local`,
        name: (payload.name as string) || (payload.username as string),
        loginMethod: 'static',
        role: (payload.role as string) || 'user',
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Verify session token and return user from database
 */
async function verifySessionToken(token: string): Promise<User | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    const { openId } = payload as Record<string, unknown>;
    if (typeof openId !== 'string' || !openId) {
      return null;
    }

    // Get user from database
    const db = await getServerlessDb();
    if (!db) {
      console.warn('[ServerlessContext] Database not available');
      return null;
    }

    const { users } = await import('../../drizzle/schema');
    const { eq } = await import('drizzle-orm');
    
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.warn('[ServerlessContext] Session verification failed:', error);
    return null;
  }
}

/**
 * Authenticate request and return user
 */
async function authenticateRequest(req: VercelRequest): Promise<User | null> {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return null;
  }

  const cookies = parseCookieHeader(cookieHeader);
  const sessionCookie = cookies[COOKIE_NAME];
  
  if (!sessionCookie) {
    return null;
  }

  // Try static auth first (demo mode)
  const staticUser = await verifyStaticAuthToken(sessionCookie);
  if (staticUser) {
    return staticUser;
  }

  // Fall back to database session
  return verifySessionToken(sessionCookie);
}

/**
 * Create Express-like request/response wrappers for tRPC context
 */
export async function createServerlessContext(
  req: VercelRequest,
  res: VercelResponse
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await authenticateRequest(req);
  } catch (error) {
    console.warn('[ServerlessContext] Authentication failed:', error);
    user = null;
  }

  // Create Express-compatible request wrapper
  const expressReq = {
    headers: req.headers as Record<string, string | string[] | undefined>,
    cookies: req.cookies || {},
    query: req.query || {},
    body: req.body,
    method: req.method,
    url: req.url,
    hostname: req.headers.host?.split(':')[0] || 'localhost',
    protocol: req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http',
    get: (header: string) => {
      const value = req.headers[header.toLowerCase()];
      return Array.isArray(value) ? value[0] : value;
    },
  } as any;

  // Create Express-compatible response wrapper
  const expressRes = {
    setHeader: (name: string, value: string) => res.setHeader(name, value),
    getHeader: (name: string) => res.getHeader(name),
    status: (code: number) => {
      res.status(code);
      return expressRes;
    },
    json: (data: any) => res.json(data),
    send: (data: any) => res.send(data),
    cookie: (name: string, value: string, options?: any) => {
      const cookieParts = [`${name}=${value}`];
      if (options?.maxAge) cookieParts.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
      if (options?.path) cookieParts.push(`Path=${options.path}`);
      if (options?.httpOnly) cookieParts.push('HttpOnly');
      if (options?.secure) cookieParts.push('Secure');
      if (options?.sameSite) cookieParts.push(`SameSite=${options.sameSite}`);
      res.setHeader('Set-Cookie', cookieParts.join('; '));
    },
    clearCookie: (name: string, options?: any) => {
      const cookieParts = [`${name}=; Max-Age=0`];
      if (options?.path) cookieParts.push(`Path=${options.path}`);
      res.setHeader('Set-Cookie', cookieParts.join('; '));
    },
  } as any;

  return {
    req: expressReq,
    res: expressRes,
    user,
  };
}
