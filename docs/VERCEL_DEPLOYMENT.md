# Vercel Serverless Deployment Guide

This document explains the serverless architecture refactoring for deploying the ADP GCP Observability Dashboard on Vercel.

## Architecture Overview

### Before (Express Server)
```
┌─────────────────────────────────────┐
│         Express Server              │
│  ┌─────────────┬─────────────────┐  │
│  │ Static Files│ API Endpoints   │  │
│  │ (Vite build)│ (/api/trpc/*)   │  │
│  ├─────────────┼─────────────────┤  │
│  │             │ WebSocket       │  │
│  │             │ (/ws/metrics)   │  │
│  └─────────────┴─────────────────┘  │
└─────────────────────────────────────┘
```

### After (Vercel Serverless)
```
┌─────────────────────────────────────────────────────┐
│                    Vercel Edge                       │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │  Static Files   │  │  Serverless Functions    │  │
│  │  (dist/public)  │  │  ┌────────────────────┐  │  │
│  │                 │  │  │ /api/trpc/[trpc]   │  │  │
│  │  • index.html   │  │  │ /api/auth/login    │  │  │
│  │  • assets/*     │  │  │ /api/auth/logout   │  │  │
│  │  • CSS/JS       │  │  │ /api/auth/session  │  │  │
│  │                 │  │  │ /api/realtime/poll │  │  │
│  └─────────────────┘  │  └────────────────────┘  │  │
│                       └──────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Key Changes

### 1. Serverless Functions (`api/` directory)

| File | Purpose |
|------|---------|
| `api/trpc/[trpc].ts` | tRPC API handler - handles all `/api/trpc/*` requests |
| `api/auth/login.ts` | Static authentication login endpoint |
| `api/auth/logout.ts` | Session logout endpoint |
| `api/auth/session.ts` | Session validation endpoint |
| `api/realtime/poll.ts` | Polling endpoint (replaces WebSocket) |
| `api/_lib/serverlessContext.ts` | tRPC context for serverless |
| `api/_lib/serverlessDb.ts` | Database connection with pooling |

### 2. WebSocket → Polling

Vercel doesn't support persistent WebSocket connections. The solution:

- **New endpoint**: `/api/realtime/poll` returns metric updates, alerts, and system status
- **Updated hook**: `useWebSocket` now automatically falls back to polling after 2 failed WebSocket attempts
- **Transparent**: Existing components using `useWebSocket` work without changes

```typescript
// The hook automatically detects serverless and uses polling
const { isConnected, recentMetrics, isPolling } = useWebSocket();

// Or force polling mode
const { isConnected } = useWebSocket({ forcePolling: true });
```

### 3. Database Connection Pooling

Serverless functions require optimized connection handling:

```typescript
// api/_lib/serverlessDb.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,                    // Limit connections per function instance
  idleTimeoutMillis: 20000,  // Clean up idle connections
  connectionTimeoutMillis: 10000,
});
```

### 4. Vercel Configuration (`vercel.json`)

```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist/public",
  "framework": "vite",
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs20.x",
      "maxDuration": 30
    }
  },
  "rewrites": [
    { "source": "/api/trpc/:path*", "destination": "/api/trpc/[trpc]" },
    { "source": "/api/auth/login", "destination": "/api/auth/login" },
    { "source": "/api/auth/logout", "destination": "/api/auth/logout" },
    { "source": "/api/auth/session", "destination": "/api/auth/session" },
    { "source": "/api/realtime/poll", "destination": "/api/realtime/poll" },
    { "source": "/((?!api|assets).*)", "destination": "/index.html" }
  ]
}
```

## Deployment Steps

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for session tokens | Yes |
| `DEMO_USERNAME` | Demo login username | No (default: admin) |
| `DEMO_PASSWORD` | Demo login password | No (default: admin) |
| `INFLUXDB_URL` | InfluxDB server URL | Optional |
| `INFLUXDB_TOKEN` | InfluxDB auth token | Optional |
| `INFLUXDB_ORG` | InfluxDB organization | Optional |
| `INFLUXDB_BUCKET` | InfluxDB bucket name | Optional |

### 3. Deploy

```bash
# Via Vercel CLI
vercel

# Or push to connected Git repository
git push origin main
```

### 4. Verify Deployment

1. Visit your Vercel URL
2. You should see the React application (not raw code)
3. Test login with demo credentials
4. Check real-time updates are working (via polling)

## Local Development

The existing Express server still works for local development:

```bash
pnpm dev
```

This provides:
- Hot module reloading via Vite
- WebSocket support (not available on Vercel)
- Faster iteration

## Limitations

### WebSocket
- Not supported on Vercel
- Polling fallback provides ~5 second update intervals
- For true real-time, consider Vercel + external WebSocket service (e.g., Pusher, Ably)

### Cold Starts
- Serverless functions may have cold start latency (~100-500ms)
- Database connections are pooled to minimize impact

### Execution Time
- Functions timeout after 30 seconds (configurable up to 60s on Pro plan)
- Long-running operations should be split or use background jobs

## Troubleshooting

### "Raw code displayed instead of app"
- Ensure `outputDirectory` in `vercel.json` is `dist/public`
- Verify build completed successfully
- Check that `index.html` exists in build output

### "API calls returning 404"
- Check `rewrites` configuration in `vercel.json`
- Verify serverless functions are in `api/` directory
- Check Vercel function logs for errors

### "Database connection errors"
- Verify `DATABASE_URL` environment variable is set
- Ensure database allows connections from Vercel IPs
- For Neon/Supabase, enable "Pooler" mode

### "Authentication not working"
- Check `JWT_SECRET` is set in environment variables
- Verify cookies are being set (check browser DevTools)
- Ensure `SameSite` and `Secure` cookie settings match your domain

## File Structure

```
├── api/                          # Vercel Serverless Functions
│   ├── _lib/
│   │   ├── serverlessContext.ts  # tRPC context adapter
│   │   └── serverlessDb.ts       # Database connection
│   ├── auth/
│   │   ├── login.ts              # POST /api/auth/login
│   │   ├── logout.ts             # POST /api/auth/logout
│   │   └── session.ts            # GET /api/auth/session
│   ├── realtime/
│   │   └── poll.ts               # GET /api/realtime/poll
│   ├── trpc/
│   │   └── [trpc].ts             # All tRPC routes
│   └── tsconfig.json             # TypeScript config for api/
├── client/                       # React Frontend
│   └── src/
│       └── hooks/
│           ├── useWebSocket.ts   # Updated with polling fallback
│           └── useRealtimePolling.ts  # Standalone polling hook
├── server/                       # Express Server (local dev)
├── dist/public/                  # Vite build output
└── vercel.json                   # Vercel configuration
```
