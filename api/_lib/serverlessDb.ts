/**
 * Serverless Database Connection
 * 
 * Optimized for Vercel's serverless environment with connection pooling
 * Uses Neon's serverless driver or standard pg with connection limits
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Global connection pool to reuse across warm function invocations
let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

/**
 * Get or create database connection for serverless environment
 * 
 * Key optimizations for serverless:
 * - Reuse connections across warm invocations
 * - Limit max connections to avoid exhausting database limits
 * - Set idle timeout to clean up stale connections
 */
export async function getServerlessDb() {
  if (_db) {
    return _db;
  }

  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.warn('[ServerlessDB] DATABASE_URL not configured');
    return null;
  }

  try {
    // Create pool with serverless-optimized settings
    _pool = new Pool({
      connectionString,
      // Limit connections for serverless (each function instance gets its own pool)
      max: 3,
      // Close idle connections after 20 seconds
      idleTimeoutMillis: 20000,
      // Fail fast if connection can't be established
      connectionTimeoutMillis: 10000,
      // Allow SSL for cloud databases
      ssl: connectionString.includes('sslmode=require') || connectionString.includes('.neon.') 
        ? { rejectUnauthorized: false } 
        : undefined,
    });

    _db = drizzle(_pool);
    console.log('[ServerlessDB] Connection pool initialized');
    return _db;
  } catch (error) {
    console.error('[ServerlessDB] Failed to initialize:', error);
    return null;
  }
}

/**
 * Close database connections (for cleanup in tests)
 */
export async function closeServerlessDb() {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
  }
}
