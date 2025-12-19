/**
 * Static Authentication for CVS GCP Observability Dashboard
 * 
 * This module provides a simple static login mechanism for demo purposes.
 * Demo credentials: admin / admin
 * 
 * For production, this should be replaced with proper authentication
 * (OAuth, LDAP, SSO, etc.)
 */

import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { getSessionCookieOptions } from "./cookies";

// Demo credentials (can be configured via environment variables)
const DEMO_USERNAME = process.env.DEMO_USERNAME || "admin";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "admin";
const JWT_SECRET = process.env.JWT_SECRET || "observability-demo-secret";

interface StaticUser {
  id: number;
  openId: string;
  username: string;
  name: string;
  email: string;
  role: "admin" | "viewer" | "editor";
}

// Demo user for static authentication
const DEMO_USER: StaticUser = {
  id: 1,
  openId: "demo-admin-001",
  username: "admin",
  name: "CVS Administrator",
  email: "admin@cvs.local",
  role: "admin",
};

function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

export async function createSessionToken(user: StaticUser): Promise<string> {
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
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

export async function verifySessionToken(token: string): Promise<StaticUser | null> {
  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    if (!payload.userId || !payload.openId) {
      return null;
    }

    return {
      id: payload.userId as number,
      openId: payload.openId as string,
      username: payload.username as string,
      name: payload.name as string,
      email: DEMO_USER.email,
      role: payload.role as "admin" | "viewer" | "editor",
    };
  } catch (error) {
    console.warn("[StaticAuth] Session verification failed:", String(error));
    return null;
  }
}

export function registerStaticAuthRoutes(app: Express) {
  // Login endpoint
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    // Validate credentials
    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      try {
        const sessionToken = await createSessionToken(DEMO_USER);
        const cookieOptions = getSessionCookieOptions(req);
        
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        
        res.json({
          success: true,
          user: {
            id: DEMO_USER.id,
            username: DEMO_USER.username,
            name: DEMO_USER.name,
            role: DEMO_USER.role,
          },
        });
      } catch (error) {
        console.error("[StaticAuth] Failed to create session:", error);
        res.status(500).json({ error: "Failed to create session" });
      }
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Session validation endpoint
  app.get("/api/auth/session", async (req: Request, res: Response) => {
    const cookies = req.headers.cookie?.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>) || {};

    const sessionToken = cookies[COOKIE_NAME];

    if (!sessionToken) {
      res.json({ authenticated: false });
      return;
    }

    const user = await verifySessionToken(sessionToken);
    
    if (user) {
      res.json({
        authenticated: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
        },
      });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
}

