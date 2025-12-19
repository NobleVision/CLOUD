import { useState, useEffect, useCallback, useRef } from 'react';

export interface MetricUpdate {
  type: 'metric_update';
  data: {
    measurement: string;
    value: number;
    timestamp: string;
    tags?: Record<string, string>;
  };
}

export interface AlertUpdate {
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

export interface SystemStatus {
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

export type WebSocketMessage = MetricUpdate | AlertUpdate | SystemStatus | { type: 'connected'; data: any } | { type: 'pong'; timestamp: string };

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  /** Force polling mode (for serverless deployments) */
  forcePolling?: boolean;
  /** Polling interval in ms (default: 5000) */
  pollingInterval?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  recentMetrics: MetricUpdate[];
  recentAlerts: AlertUpdate[];
  systemStatus: SystemStatus | null;
  send: (data: any) => void;
  connect: () => void;
  disconnect: () => void;
  /** Whether using polling fallback instead of WebSocket */
  isPolling: boolean;
}

/**
 * Real-time updates hook with automatic polling fallback
 * 
 * Attempts WebSocket connection first, falls back to polling if:
 * - WebSocket connection fails (e.g., on Vercel serverless)
 * - forcePolling option is set to true
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoReconnect = true,
    reconnectInterval = 5000,
    forcePolling = false,
    pollingInterval = 5000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isPolling, setIsPolling] = useState(forcePolling);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [recentMetrics, setRecentMetrics] = useState<MetricUpdate[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<AlertUpdate[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsFailCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Process incoming messages (works for both WebSocket and polling)
  const processMessage = useCallback((message: WebSocketMessage) => {
    setLastMessage(message);
    onMessage?.(message);

    if (message.type === 'metric_update') {
      setRecentMetrics(prev => [...prev.slice(-49), message as MetricUpdate]);
    } else if (message.type === 'alert') {
      setRecentAlerts(prev => [...prev.slice(-19), message as AlertUpdate]);
    } else if (message.type === 'system_status') {
      setSystemStatus(message as SystemStatus);
    }
  }, [onMessage]);

  // Polling function for serverless fallback
  const poll = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/realtime/poll', {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Poll failed: ${response.status}`);
      }

      const data = await response.json();
      setIsConnected(true);

      // Process each update
      if (data.updates && Array.isArray(data.updates)) {
        data.updates.forEach((update: WebSocketMessage) => {
          processMessage(update);
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('[Polling] Error:', error);
      setIsConnected(false);
    }
  }, [processMessage]);

  // Start polling mode
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    
    console.log('[RealTime] Switching to polling mode');
    setIsPolling(true);
    setIsConnected(true);
    onConnect?.();

    // Initial poll
    poll();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(poll, pollingInterval);
  }, [poll, pollingInterval, onConnect]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/metrics`;
  }, []);

  const connect = useCallback(() => {
    // If forcing polling or WebSocket has failed multiple times, use polling
    if (forcePolling || wsFailCountRef.current >= 2) {
      startPolling();
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = getWebSocketUrl();
    console.log('[WebSocket] Connecting to:', url);
    
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        wsFailCountRef.current = 0;
        setIsConnected(true);
        setIsPolling(false);
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          processMessage(message);
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', e);
        }
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setIsConnected(false);
        onDisconnect?.();
        
        if (autoReconnect) {
          wsFailCountRef.current++;
          
          // After 2 failures, switch to polling
          if (wsFailCountRef.current >= 2) {
            console.log('[WebSocket] Multiple failures, switching to polling');
            startPolling();
          } else {
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('[WebSocket] Attempting to reconnect...');
              connect();
            }, reconnectInterval);
          }
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        wsFailCountRef.current++;
        onError?.(error);
        
        // Switch to polling on error
        if (wsFailCountRef.current >= 2) {
          ws.close();
          startPolling();
        }
      };
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      wsFailCountRef.current = 2;
      startPolling();
    }
  }, [getWebSocketUrl, onConnect, onDisconnect, onError, processMessage, autoReconnect, reconnectInterval, forcePolling, startPolling]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    stopPolling();
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, [stopPolling]);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
    // In polling mode, send is a no-op (polling is one-way)
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { isConnected, lastMessage, recentMetrics, recentAlerts, systemStatus, send, connect, disconnect, isPolling };
}

