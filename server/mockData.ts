/**
 * Mock Data Generator for ADP GCP Observability Dashboard
 * Generates realistic demo data for all dashboard features
 */

import { getDb } from './db';
import { gcpProjects, alerts, costRecords, metricSnapshots } from '../drizzle/schema';

export interface MockMetric {
  timestamp: number;
  value: number;
  label?: string;
}

export interface MockLog {
  timestamp: number;
  severity: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  resource: string;
  project: string;
  environment: string;
}

export interface MockTrace {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  duration: number;
  status: 'OK' | 'ERROR';
  service: string;
}

/**
 * Seed database with mock GCP projects
 */
export async function seedMockProjects() {
  const db = await getDb();
  if (!db) {
    console.warn('[MockData] Database not available, skipping seed');
    return;
  }

  const projects = [
    {
      projectId: 'adp-prod-main',
      projectName: 'ADP Production Main',
      environment: 'prod' as const,
      description: 'Primary production environment for ADP services',
    },
    {
      projectId: 'adp-prod-analytics',
      projectName: 'ADP Production Analytics',
      environment: 'prod' as const,
      description: 'Analytics and data processing workloads',
    },
    {
      projectId: 'adp-staging-main',
      projectName: 'ADP Staging Environment',
      environment: 'staging' as const,
      description: 'Staging environment for testing',
    },
    {
      projectId: 'adp-dev-main',
      projectName: 'ADP Development',
      environment: 'dev' as const,
      description: 'Development and testing environment',
    },
  ];

  try {
    for (const project of projects) {
      await db.insert(gcpProjects).values(project).onConflictDoNothing();
    }
    console.log('[MockData] Seeded projects successfully');
  } catch (error) {
    console.error('[MockData] Failed to seed projects:', error);
  }
}

/**
 * Generate mock alerts
 */
export async function seedMockAlerts() {
  const db = await getDb();
  if (!db) return;

  const now = Date.now();
  const alertTemplates = [
    {
      alertName: 'High CPU Usage',
      severity: 'warning' as const,
      message: 'CPU utilization exceeded 80% for 5 minutes',
      resourceType: 'compute.googleapis.com/Instance',
      resourceName: 'adp-web-server-01',
    },
    {
      alertName: 'Memory Pressure',
      severity: 'critical' as const,
      message: 'Memory usage above 90% threshold',
      resourceType: 'compute.googleapis.com/Instance',
      resourceName: 'adp-api-server-03',
    },
    {
      alertName: 'Elevated Error Rate',
      severity: 'warning' as const,
      message: 'Error rate increased to 5% over last 10 minutes',
      resourceType: 'cloud_function',
      resourceName: 'process-orders',
    },
    {
      alertName: 'Database Connection Pool Exhausted',
      severity: 'critical' as const,
      message: 'All database connections in use, new requests failing',
      resourceType: 'cloudsql.googleapis.com/Database',
      resourceName: 'adp-prod-db',
    },
    {
      alertName: 'Disk Space Low',
      severity: 'warning' as const,
      message: 'Disk usage at 85% capacity',
      resourceType: 'compute.googleapis.com/Instance',
      resourceName: 'adp-storage-node-02',
    },
  ];

  try {
    for (let i = 0; i < alertTemplates.length; i++) {
      const template = alertTemplates[i];
      const projectId = (i % 2) + 1; // Alternate between projects
      const triggeredAt = new Date(now - Math.random() * 24 * 60 * 60 * 1000);
      
      await db.insert(alerts).values({
        projectId,
        ...template,
        triggeredAt,
        status: i < 2 ? 'active' : 'acknowledged',
        acknowledgedAt: i >= 2 ? new Date(triggeredAt.getTime() + 30 * 60 * 1000) : null,
      }).onConflictDoNothing();
    }
    console.log('[MockData] Seeded alerts successfully');
  } catch (error) {
    console.error('[MockData] Failed to seed alerts:', error);
  }
}

/**
 * Generate mock cost records
 */
export async function seedMockCosts() {
  const db = await getDb();
  if (!db) return;

  const services = [
    'Compute Engine',
    'Cloud Storage',
    'Cloud SQL',
    'Cloud Functions',
    'Cloud Load Balancing',
    'Cloud Logging',
    'Cloud Monitoring',
    'BigQuery',
  ];

  const now = Date.now();
  const daysToGenerate = 30;

  try {
    for (let day = 0; day < daysToGenerate; day++) {
      const recordDate = new Date(now - day * 24 * 60 * 60 * 1000);
      
      for (const service of services) {
        const projectId = (Math.floor(Math.random() * 2) + 1);
        const baseCost = Math.floor(Math.random() * 50000) + 10000; // $100-$500
        const variance = Math.floor(Math.random() * 10000) - 5000;
        const cost = baseCost + variance;
        
        await db.insert(costRecords).values({
          projectId,
          recordDate,
          serviceType: service,
          cost,
          currency: 'USD',
        }).onConflictDoNothing();
      }
    }
    console.log('[MockData] Seeded cost records successfully');
  } catch (error) {
    console.error('[MockData] Failed to seed costs:', error);
  }
}

/**
 * Generate mock metric snapshots
 */
export async function seedMockMetrics() {
  const db = await getDb();
  if (!db) return;

  const metricTypes = [
    'cpu_utilization',
    'memory_utilization',
    'disk_read_ops',
    'disk_write_ops',
    'network_received_bytes',
    'network_sent_bytes',
  ];

  const resources = [
    'adp-web-server-01',
    'adp-web-server-02',
    'adp-api-server-01',
    'adp-api-server-02',
    'adp-worker-01',
  ];

  const now = Date.now();
  const hoursToGenerate = 24;
  const pointsPerHour = 12; // Every 5 minutes

  try {
    for (let hour = 0; hour < hoursToGenerate; hour++) {
      for (let point = 0; point < pointsPerHour; point++) {
        const timestamp = new Date(now - (hour * 60 + point * 5) * 60 * 1000);
        
        for (const metricType of metricTypes) {
          for (const resource of resources) {
            const projectId = (Math.floor(Math.random() * 2) + 1);
            let value = 0;
            
            switch (metricType) {
              case 'cpu_utilization':
                value = Math.floor(30 + Math.random() * 40 + Math.sin(hour / 3) * 15);
                break;
              case 'memory_utilization':
                value = Math.floor(50 + Math.random() * 30);
                break;
              case 'disk_read_ops':
                value = Math.floor(100 + Math.random() * 200);
                break;
              case 'disk_write_ops':
                value = Math.floor(50 + Math.random() * 150);
                break;
              case 'network_received_bytes':
                value = Math.floor(1000000 + Math.random() * 5000000);
                break;
              case 'network_sent_bytes':
                value = Math.floor(500000 + Math.random() * 3000000);
                break;
            }
            
            await db.insert(metricSnapshots).values({
              projectId,
              metricType,
              resourceName: resource,
              value,
              timestamp,
            }).onConflictDoNothing();
          }
        }
      }
    }
    console.log('[MockData] Seeded metric snapshots successfully');
  } catch (error) {
    console.error('[MockData] Failed to seed metrics:', error);
  }
}

/**
 * Generate mock log entries
 */
export function generateMockLogs(count: number = 100): MockLog[] {
  const logs: MockLog[] = [];
  const now = Date.now();

  const logTemplates = [
    { severity: 'INFO' as const, message: 'Request processed successfully' },
    { severity: 'INFO' as const, message: 'User authentication successful' },
    { severity: 'DEBUG' as const, message: 'Database query executed in 45ms' },
    { severity: 'WARNING' as const, message: 'Slow query detected: 2.3s execution time' },
    { severity: 'ERROR' as const, message: 'Failed to connect to external API: timeout' },
    { severity: 'ERROR' as const, message: 'Connection refused to database server' },
    { severity: 'ERROR' as const, message: 'Invalid input validation: missing required field' },
    { severity: 'CRITICAL' as const, message: 'Database connection pool exhausted' },
    { severity: 'CRITICAL' as const, message: 'Memory usage exceeded 95% threshold' },
    { severity: 'INFO' as const, message: 'Cache hit for user profile data' },
    { severity: 'WARNING' as const, message: 'Rate limit approaching for API endpoint' },
    { severity: 'WARNING' as const, message: 'Slow response from auth service: 800ms' },
    { severity: 'DEBUG' as const, message: 'Background job started: data sync' },
    { severity: 'DEBUG' as const, message: 'Health check completed successfully' },
  ];

  const resources = [
    'adp-web-server-01',
    'adp-api-server-01',
    'cloud-function-orders',
    'adp-worker-01',
  ];

  const projects = ['adp-prod-main', 'adp-prod-analytics', 'adp-staging-main'];
  const environments = ['prod', 'prod', 'staging'];

  // First, ensure we have logs of each severity in the last hour for demo purposes
  const recentLogTemplates = [
    { severity: 'ERROR' as const, message: 'Failed to connect to external API: timeout' },
    { severity: 'ERROR' as const, message: 'Connection refused to database server' },
    { severity: 'CRITICAL' as const, message: 'Database connection pool exhausted' },
    { severity: 'WARNING' as const, message: 'Slow query detected: 2.3s execution time' },
    { severity: 'WARNING' as const, message: 'Rate limit approaching for API endpoint' },
    { severity: 'INFO' as const, message: 'Request processed successfully' },
    { severity: 'DEBUG' as const, message: 'Database query executed in 45ms' },
  ];

  // Add guaranteed recent logs (within last hour) - at least 15 entries
  for (let i = 0; i < Math.min(15, Math.floor(count * 0.15)); i++) {
    const template = recentLogTemplates[i % recentLogTemplates.length];
    // Spread within the last hour (0 to 60 minutes ago)
    const timestamp = now - Math.random() * 60 * 60 * 1000;
    const resourceIdx = Math.floor(Math.random() * resources.length);
    const projectIdx = Math.floor(Math.random() * projects.length);

    logs.push({
      timestamp,
      severity: template.severity,
      message: template.message,
      resource: resources[resourceIdx],
      project: projects[projectIdx],
      environment: environments[projectIdx],
    });
  }

  // Fill the rest with logs spread across 24 hours
  const remainingCount = count - logs.length;
  for (let i = 0; i < remainingCount; i++) {
    const template = logTemplates[Math.floor(Math.random() * logTemplates.length)];
    const timestamp = now - Math.random() * 24 * 60 * 60 * 1000;
    const resourceIdx = Math.floor(Math.random() * resources.length);
    const projectIdx = Math.floor(Math.random() * projects.length);

    logs.push({
      timestamp,
      severity: template.severity,
      message: template.message,
      resource: resources[resourceIdx],
      project: projects[projectIdx],
      environment: environments[projectIdx],
    });
  }

  return logs.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Generate mock trace data
 */
export function generateMockTraces(count: number = 20): MockTrace[] {
  const traces: MockTrace[] = [];
  const now = Date.now();
  
  const services = [
    'frontend-web',
    'api-gateway',
    'auth-service',
    'order-service',
    'inventory-service',
    'payment-service',
    'notification-service',
  ];
  
  for (let i = 0; i < count; i++) {
    const traceId = `trace-${Math.random().toString(36).substr(2, 16)}`;
    const startTime = now - Math.random() * 60 * 60 * 1000;
    
    // Root span
    const rootDuration = 100 + Math.random() * 500;
    const rootSpan = {
      traceId,
      spanId: `span-${Math.random().toString(36).substr(2, 8)}`,
      name: 'HTTP GET /api/orders',
      startTime,
      duration: rootDuration,
      status: (Math.random() > 0.9 ? 'ERROR' : 'OK') as 'ERROR' | 'OK',
      service: services[0],
    };
    traces.push(rootSpan);
    
    // Child spans
    const numChildren = Math.min(2 + Math.floor(Math.random() * 3), services.length - 1);
    let currentTime = startTime;
    
    for (let j = 0; j < numChildren; j++) {
      const spanDuration = 10 + Math.random() * 100;
      traces.push({
        traceId,
        spanId: `span-${Math.random().toString(36).substr(2, 8)}`,
        parentSpanId: rootSpan.spanId,
        name: `${services[j + 1]} operation`,
        startTime: currentTime,
        duration: spanDuration,
        status: Math.random() > 0.95 ? 'ERROR' : 'OK' as const,
        service: services[j + 1],
      });
      currentTime += spanDuration;
    }
  }
  
  return traces;
}

/**
 * Seed all mock data
 */
export async function seedAllMockData() {
  console.log('[MockData] Starting to seed all mock data...');
  await seedMockProjects();
  await seedMockAlerts();
  await seedMockCosts();
  await seedMockMetrics();
  console.log('[MockData] All mock data seeded successfully');
}
