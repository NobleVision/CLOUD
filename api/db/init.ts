import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

const { Pool } = pg;

// PostgreSQL schema creation SQL
const SCHEMA_SQL = `
-- Create enums if they don't exist
DO $$ BEGIN
    CREATE TYPE role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE environment AS ENUM ('dev', 'staging', 'prod');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE severity AS ENUM ('critical', 'warning', 'info');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status AS ENUM ('active', 'acknowledged', 'resolved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    "openId" VARCHAR(64) NOT NULL UNIQUE,
    name TEXT,
    email VARCHAR(320),
    "loginMethod" VARCHAR(64),
    role role NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "lastSignedIn" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create gcp_projects table
CREATE TABLE IF NOT EXISTS gcp_projects (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(128) NOT NULL UNIQUE,
    project_name VARCHAR(255) NOT NULL,
    environment environment NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    alert_name VARCHAR(255) NOT NULL,
    severity severity NOT NULL,
    status status NOT NULL DEFAULT 'active',
    message TEXT NOT NULL,
    resource_type VARCHAR(128),
    resource_name VARCHAR(255),
    triggered_at TIMESTAMP NOT NULL,
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    acknowledged_by INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create cost_records table
CREATE TABLE IF NOT EXISTS cost_records (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    record_date TIMESTAMP NOT NULL,
    service_type VARCHAR(128) NOT NULL,
    cost INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create metric_snapshots table
CREATE TABLE IF NOT EXISTS metric_snapshots (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    metric_type VARCHAR(128) NOT NULL,
    resource_name VARCHAR(255),
    value INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for admin secret (optional security)
  const adminSecret = req.headers['x-admin-secret'] || req.query.secret;
  const expectedSecret = process.env.ADMIN_SECRET || 'init-db-secret';
  
  if (adminSecret !== expectedSecret) {
    console.log('[DB Init] Unauthorized attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return res.status(500).json({ error: 'DATABASE_URL not configured' });
  }

  let pool: pg.Pool | null = null;
  
  try {
    console.log('[DB Init] Connecting to database...');
    
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 1,
    });

    console.log('[DB Init] Running schema creation...');
    await pool.query(SCHEMA_SQL);
    
    console.log('[DB Init] Schema created successfully');
    
    // Verify tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    const tables = tablesResult.rows.map(r => r.table_name);
    console.log('[DB Init] Tables:', tables);

    return res.status(200).json({
      success: true,
      message: 'Database schema initialized successfully',
      tables,
    });
  } catch (error) {
    console.error('[DB Init] Error:', error);
    return res.status(500).json({
      error: 'Failed to initialize database',
      details: error instanceof Error ? error.message : String(error),
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}
