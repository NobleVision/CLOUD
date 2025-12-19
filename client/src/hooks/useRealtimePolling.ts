/**
 * Real-time Polling Hook
 * 
 * Replaces WebSocket-based real-time updates with polling
 * for Vercel serverless deployment compatibility
 */

import { useCallback, useEffect, useRef, useState } from 'react';

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

interface PollResponse {
  timestamp: string;
  updates: RealtimeUpdate[];
}

interface UseRealtimePollingOptions {
  /** Polling interval in milliseconds (default: 5000) */
  interval?: number;
  /** Include metric updates (default: true) */
  includeMetrics?: boolean;
  /** Include system status (default: true) */
  includeStatus?: boolean;
  /** Include alerts (default: true) */
  includeAlerts?: boolean;
  /** Enable polling (default: true) */
  enabled?: boolean;
  /** Callback for metric updates */
  onMetricUpdate?: (update: MetricUpdate) => void;
  /** Callback for alert updates */
  onAlert?: (update: AlertUpdate) => void;
  /** Callback for system status updates */
  onSystemStatus?: (update: SystemStatus) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
}

export function useRealtimePolling(options: UseRealtimePollingOptions = {}) {
  const {
    interval = 5000,
    includeMetrics = true,
    includeStatus = true,
    includeAlerts = true,
    enabled = true,
    onMetricUpdate,
    onAlert,
    onSystemStatus,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricUpdate[]>([]);
  const [alerts, setAlerts] = useState<AlertUpdate[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const poll = useCallback(async () => {
    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const params = new URLSearchParams();
      params.set('metrics', String(includeMetrics));
      params.set('status', String(includeStatus));
      params.set('alerts', String(includeAlerts));

      const response = await fetch(`/api/realtime/poll?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Poll failed: ${response.status}`);
      }

      const data: PollResponse = await response.json();
      setIsConnected(true);
      setLastUpdate(data.timestamp);

      // Process updates
      data.updates.forEach(update => {
        switch (update.type) {
          case 'metric_update':
            setMetrics(prev => [...prev.slice(-49), update]);
            onMetricUpdate?.(update);
            break;
          case 'alert':
            setAlerts(prev => [...prev.slice(-19), update]);
            onAlert?.(update);
            break;
          case 'system_status':
            setSystemStatus(update);
            onSystemStatus?.(update);
            break;
        }
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Ignore abort errors
      }
      setIsConnected(false);
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    }
  }, [includeMetrics, includeStatus, includeAlerts, onMetricUpdate, onAlert, onSystemStatus, onError]);

  // Start/stop polling based on enabled state
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setIsConnected(false);
      return;
    }

    // Initial poll
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, interval, poll]);

  const clearMetrics = useCallback(() => setMetrics([]), []);
  const clearAlerts = useCallback(() => setAlerts([]), []);

  return {
    isConnected,
    lastUpdate,
    metrics,
    alerts,
    systemStatus,
    clearMetrics,
    clearAlerts,
    poll, // Manual poll trigger
  };
}

export type { MetricUpdate, AlertUpdate, SystemStatus, RealtimeUpdate };
