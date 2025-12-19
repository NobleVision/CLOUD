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
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoReconnect = true,
    reconnectInterval = 5000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [recentMetrics, setRecentMetrics] = useState<MetricUpdate[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<AlertUpdate[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/metrics`;
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = getWebSocketUrl();
    console.log('[WebSocket] Connecting to:', url);
    
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
      onConnect?.();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        setLastMessage(message);
        onMessage?.(message);

        // Handle different message types
        if (message.type === 'metric_update') {
          setRecentMetrics(prev => [...prev.slice(-49), message as MetricUpdate]);
        } else if (message.type === 'alert') {
          setRecentAlerts(prev => [...prev.slice(-19), message as AlertUpdate]);
        } else if (message.type === 'system_status') {
          setSystemStatus(message as SystemStatus);
        }
      } catch (e) {
        console.error('[WebSocket] Failed to parse message:', e);
      }
    };

    ws.onclose = () => {
      console.log('[WebSocket] Disconnected');
      setIsConnected(false);
      onDisconnect?.();
      
      if (autoReconnect) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[WebSocket] Attempting to reconnect...');
          connect();
        }, reconnectInterval);
      }
    };

    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
      onError?.(error);
    };
  }, [getWebSocketUrl, onConnect, onDisconnect, onError, onMessage, autoReconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { isConnected, lastMessage, recentMetrics, recentAlerts, systemStatus, send, connect, disconnect };
}

