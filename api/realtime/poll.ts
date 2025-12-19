/**
 * Serverless Polling Endpoint for Real-time Updates
 * GET /api/realtime/poll
 * 
 * Replaces WebSocket functionality with polling-based updates
 * Vercel doesn't support persistent WebSocket connections
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface MetricUpdate {
  type: 'metric_update';
  data: {
    measurement: string;
    value: number;
    timestamp: string;
    tags?: Record<string, string>;
  };
}

interface AlertUpdate {
  type: 'alert';
  data: {
    severity: 'info' | 'warning' | 'critical';
    message: string;
    metric?: string;
    value?: number;
    threshold?: number;
    timestamp: string;
  };
}

interface SystemStatus {
  type: 'system_status';
  data: {
    services: Array<{
      name: string;
      status: 'healthy' | 'warning' | 'critical';
      latency: number;
    }>;
    timestamp: string;
  };
}

type RealtimeUpdate = MetricUpdate | AlertUpdate | SystemStatus;

function generateMetricUpdate(): MetricUpdate {
  const metrics = ['cpu_usage', 'memory_usage', 'network_throughput', 'disk_io', 'request_latency', 'error_rate'];
  const metric = metrics[Math.floor(Math.random() * metrics.length)];
  
  const baseValues: Record<string, number> = {
    cpu_usage: 45,
    memory_usage: 62,
    network_throughput: 150,
    disk_io: 450,
    request_latency: 125,
    error_rate: 0.5,
  };

  return {
    type: 'metric_update',
    data: {
      measurement: metric,
      value: baseValues[metric] + (Math.random() - 0.5) * baseValues[metric] * 0.4,
      timestamp: new Date().toISOString(),
      tags: {
        environment: Math.random() > 0.5 ? 'production' : 'staging',
        region: ['us-central1', 'us-east1', 'europe-west1'][Math.floor(Math.random() * 3)],
      },
    },
  };
}

function generateSystemStatus(): SystemStatus {
  const services = ['api-gateway', 'auth-service', 'data-processor', 'cache-service', 'db-primary'];
  
  return {
    type: 'system_status',
    data: {
      services: services.map(name => ({
        name,
        status: Math.random() > 0.9 ? 'warning' : 'healthy',
        latency: Math.floor(Math.random() * 50) + 10,
      })),
      timestamp: new Date().toISOString(),
    },
  };
}

function generateAlert(): AlertUpdate | null {
  // Only generate alerts ~30% of the time
  if (Math.random() > 0.3) {
    return null;
  }

  const alerts = [
    { severity: 'warning' as const, message: 'CPU usage approaching threshold', metric: 'cpu_usage', value: 78, threshold: 80 },
    { severity: 'warning' as const, message: 'Memory usage elevated', metric: 'memory_usage', value: 82, threshold: 85 },
    { severity: 'info' as const, message: 'Scaling event triggered', metric: 'request_count', value: 1500, threshold: 1000 },
    { severity: 'critical' as const, message: 'Error rate spike detected', metric: 'error_rate', value: 5.2, threshold: 5 },
  ];
  
  const alert = alerts[Math.floor(Math.random() * alerts.length)];
  
  return {
    type: 'alert',
    data: {
      ...alert,
      timestamp: new Date().toISOString(),
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse query parameters
  const includeMetrics = req.query.metrics !== 'false';
  const includeStatus = req.query.status !== 'false';
  const includeAlerts = req.query.alerts !== 'false';

  const updates: RealtimeUpdate[] = [];

  // Generate updates based on requested types
  if (includeMetrics) {
    // Generate 2-4 metric updates
    const metricCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < metricCount; i++) {
      updates.push(generateMetricUpdate());
    }
  }

  if (includeStatus) {
    updates.push(generateSystemStatus());
  }

  if (includeAlerts) {
    const alert = generateAlert();
    if (alert) {
      updates.push(alert);
    }
  }

  // Set cache headers to prevent caching of real-time data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');

  return res.json({
    timestamp: new Date().toISOString(),
    updates,
  });
}
