import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
import type { Server as HttpsServer } from 'https';

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

type WebSocketMessage = MetricUpdate | AlertUpdate | SystemStatus;

class MetricsWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private metricsInterval: NodeJS.Timeout | null = null;
  private alertsInterval: NodeJS.Timeout | null = null;
  private statusInterval: NodeJS.Timeout | null = null;

  initialize(server: HttpServer | HttpsServer) {
    this.wss = new WebSocketServer({ server, path: '/ws/metrics' });
    
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[WebSocket] Client connected');
      this.clients.add(ws);

      // Send initial connection message
      ws.send(JSON.stringify({
        type: 'connected',
        data: { message: 'Connected to ADP Observability WebSocket', timestamp: new Date().toISOString() }
      }));

      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (e) {
          console.error('[WebSocket] Invalid message:', e);
        }
      });

      ws.on('close', () => {
        console.log('[WebSocket] Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('[WebSocket] Error:', error);
        this.clients.delete(ws);
      });
    });

    // Start broadcasting mock metrics
    this.startBroadcasting();
    
    console.log('[WebSocket] Server initialized on /ws/metrics');
  }

  private handleMessage(ws: WebSocket, data: any) {
    if (data.type === 'subscribe') {
      // Handle subscription requests
      console.log('[WebSocket] Subscription request:', data.metrics);
    } else if (data.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
    }
  }

  private startBroadcasting() {
    // Broadcast metrics every 3 seconds
    this.metricsInterval = setInterval(() => {
      this.broadcastMetrics();
    }, 3000);

    // Broadcast system status every 10 seconds
    this.statusInterval = setInterval(() => {
      this.broadcastSystemStatus();
    }, 10000);

    // Occasionally broadcast alerts (random chance every 15 seconds)
    this.alertsInterval = setInterval(() => {
      if (Math.random() < 0.3) {
        this.broadcastAlert();
      }
    }, 15000);
  }

  private broadcastMetrics() {
    const metrics = ['cpu_usage', 'memory_usage', 'network_throughput', 'disk_io', 'request_latency', 'error_rate'];
    const metric = metrics[Math.floor(Math.random() * metrics.length)];
    
    const baseValues: Record<string, number> = {
      cpu_usage: 45,
      memory_usage: 62,
      network_throughput: 150,
      disk_io: 450,
      request_latency: 125,
      error_rate: 0.5
    };

    const message: MetricUpdate = {
      type: 'metric_update',
      data: {
        measurement: metric,
        value: baseValues[metric] + (Math.random() - 0.5) * baseValues[metric] * 0.4,
        timestamp: new Date().toISOString(),
        tags: {
          environment: Math.random() > 0.5 ? 'production' : 'staging',
          region: ['us-central1', 'us-east1', 'europe-west1'][Math.floor(Math.random() * 3)]
        }
      }
    };

    this.broadcast(message);
  }

  private broadcastSystemStatus() {
    const services = ['api-gateway', 'auth-service', 'data-processor', 'cache-service', 'db-primary'];
    const message: SystemStatus = {
      type: 'system_status',
      data: {
        services: services.map(name => ({
          name,
          status: Math.random() > 0.9 ? 'warning' : 'healthy',
          latency: Math.floor(Math.random() * 50) + 10
        })),
        timestamp: new Date().toISOString()
      }
    };
    this.broadcast(message);
  }

  private broadcastAlert() {
    const alerts = [
      { severity: 'warning' as const, message: 'CPU usage approaching threshold', metric: 'cpu_usage', value: 78, threshold: 80 },
      { severity: 'warning' as const, message: 'Memory usage elevated', metric: 'memory_usage', value: 82, threshold: 85 },
      { severity: 'info' as const, message: 'Scaling event triggered', metric: 'request_count', value: 1500, threshold: 1000 },
      { severity: 'critical' as const, message: 'Error rate spike detected', metric: 'error_rate', value: 5.2, threshold: 5 },
    ];
    const alert = alerts[Math.floor(Math.random() * alerts.length)];
    const message: AlertUpdate = { type: 'alert', data: { ...alert, timestamp: new Date().toISOString() } };
    this.broadcast(message);
  }

  private broadcast(message: WebSocketMessage) {
    const payload = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  shutdown() {
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    if (this.alertsInterval) clearInterval(this.alertsInterval);
    if (this.statusInterval) clearInterval(this.statusInterval);
    this.clients.forEach(client => client.close());
    this.wss?.close();
  }
}

export const metricsWebSocket = new MetricsWebSocketServer();

