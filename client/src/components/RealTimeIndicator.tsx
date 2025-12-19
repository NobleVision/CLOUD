import { useWebSocket, AlertUpdate } from '@/hooks/useWebSocket';
import { Activity, Wifi, WifiOff, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';

interface RealTimeIndicatorProps {
  showAlerts?: boolean;
  compact?: boolean;
}

export function RealTimeIndicator({ showAlerts = true, compact = false }: RealTimeIndicatorProps) {
  const { isConnected, recentAlerts, lastMessage, systemStatus } = useWebSocket();
  const [visibleAlerts, setVisibleAlerts] = useState<AlertUpdate[]>([]);

  // Show new alerts temporarily
  useEffect(() => {
    if (lastMessage?.type === 'alert') {
      const alert = lastMessage as AlertUpdate;
      setVisibleAlerts(prev => [...prev, alert]);
      
      // Remove alert after 10 seconds
      setTimeout(() => {
        setVisibleAlerts(prev => prev.filter(a => a !== alert));
      }, 10000);
    }
  }, [lastMessage]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700';
      case 'warning': return 'bg-amber-100 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700';
      default: return 'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
          isConnected 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {isConnected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Live</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span>Offline</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm font-medium">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {isConnected && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          )}
        </div>
        {systemStatus && (
          <div className="flex items-center gap-1">
            {systemStatus.data.services.every(s => s.status === 'healthy') ? (
              <Badge variant="outline" className="text-green-600 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                All Systems Healthy
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {systemStatus.data.services.filter(s => s.status !== 'healthy').length} Issues
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Live Alerts */}
      {showAlerts && visibleAlerts.length > 0 && (
        <div className="space-y-1">
          {visibleAlerts.slice(-3).map((alert, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm animate-in slide-in-from-top-2 ${getSeverityColor(alert.data.severity)}`}
            >
              {getSeverityIcon(alert.data.severity)}
              <span className="flex-1">{alert.data.message}</span>
              {alert.data.value !== undefined && (
                <Badge variant="secondary" className="text-xs">
                  {alert.data.value.toFixed(1)} / {alert.data.threshold}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RealTimeMetricValue({ metric, unit }: { metric: string; unit?: string }) {
  const { recentMetrics } = useWebSocket();
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const latestMetric = recentMetrics.filter(m => m.data.measurement === metric).pop();
    if (latestMetric) {
      setDisplayValue(latestMetric.data.value);
      setIsUpdating(true);
      setTimeout(() => setIsUpdating(false), 500);
    }
  }, [recentMetrics, metric]);

  if (displayValue === null) return null;

  return (
    <span className={`transition-all duration-300 ${isUpdating ? 'text-green-500 scale-110' : ''}`}>
      {displayValue.toFixed(1)}{unit}
    </span>
  );
}

