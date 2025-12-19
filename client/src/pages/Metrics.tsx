import { useState, useMemo, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Zap, Shield, Clock, Target, Bell } from 'lucide-react';
import { ExportMenu } from '@/components/ExportMenu';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

// Anomaly Detection Types and Utilities
interface Anomaly {
  index: number;
  value: number;
  time: string;
  type: 'spike' | 'drop' | 'deviation';
  severity: 'warning' | 'critical';
  description: string;
  zScore: number;
}

interface AnomalyStats {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  anomalies: Anomaly[];
  movingAverage: number[];
  upperBound: number[];
  lowerBound: number[];
}

function calculateAnomalyStats(data: number[], times: string[], threshold = 2): AnomalyStats {
  if (data.length === 0) {
    return {
      mean: 0, stdDev: 0, min: 0, max: 0, anomalies: [],
      movingAverage: [], upperBound: [], lowerBound: []
    };
  }

  // Calculate mean
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;

  // Calculate standard deviation
  const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;
  const stdDev = Math.sqrt(avgSquaredDiff);

  // Calculate moving average (window of 5)
  const windowSize = Math.min(5, Math.floor(data.length / 3));
  const movingAverage: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
    const window = data.slice(start, end);
    movingAverage.push(window.reduce((s, v) => s + v, 0) / window.length);
  }

  // Calculate bounds (mean ± threshold * stdDev)
  const upperBound = data.map(() => mean + threshold * stdDev);
  const lowerBound = data.map(() => Math.max(0, mean - threshold * stdDev));

  // Detect anomalies
  const anomalies: Anomaly[] = [];
  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    const zScore = stdDev > 0 ? Math.abs((value - mean) / stdDev) : 0;

    if (zScore >= threshold) {
      const isSpike = value > mean;
      const prevValue = i > 0 ? data[i - 1] : value;
      const changePercent = Math.abs(((value - prevValue) / prevValue) * 100);

      anomalies.push({
        index: i,
        value,
        time: times[i],
        type: isSpike ? 'spike' : 'drop',
        severity: zScore >= threshold * 1.5 ? 'critical' : 'warning',
        description: `${isSpike ? 'Spike' : 'Drop'} detected: ${value.toFixed(2)} (${changePercent.toFixed(1)}% change, z-score: ${zScore.toFixed(2)})`,
        zScore,
      });
    }
  }

  return {
    mean,
    stdDev,
    min: Math.min(...data),
    max: Math.max(...data),
    anomalies,
    movingAverage,
    upperBound,
    lowerBound,
  };
}

// Trend Analysis and Forecasting
interface TrendAnalysis {
  slope: number;
  intercept: number;
  rSquared: number;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  trendStrength: 'strong' | 'moderate' | 'weak';
  forecast: number[];
  forecastTimes: string[];
  timeToThreshold: number | null; // minutes until threshold is reached
  predictedPeakValue: number;
  predictedPeakTime: string | null;
}

interface PredictiveAlert {
  type: 'threshold_warning' | 'threshold_critical' | 'trend_warning';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timeToEvent: number | null; // minutes
  predictedValue: number;
  threshold: number;
}

function calculateTrendAnalysis(
  data: number[],
  times: string[],
  threshold: number,
  forecastPoints: number = 6
): TrendAnalysis {
  if (data.length < 3) {
    return {
      slope: 0, intercept: 0, rSquared: 0,
      trendDirection: 'stable', trendStrength: 'weak',
      forecast: [], forecastTimes: [],
      timeToThreshold: null, predictedPeakValue: 0, predictedPeakTime: null
    };
  }

  const n = data.length;

  // Linear regression: y = mx + b
  const xMean = (n - 1) / 2;
  const yMean = data.reduce((s, v) => s + v, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (data[i] - yMean);
    denominator += Math.pow(i - xMean, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  // Calculate R-squared
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * i + intercept;
    ssRes += Math.pow(data[i] - predicted, 2);
    ssTot += Math.pow(data[i] - yMean, 2);
  }
  const rSquared = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;

  // Determine trend direction and strength
  const slopePercent = Math.abs(slope / yMean) * 100;
  let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';
  let trendStrength: 'strong' | 'moderate' | 'weak' = 'weak';

  if (Math.abs(slope) > 0.1) {
    trendDirection = slope > 0 ? 'increasing' : 'decreasing';
    if (slopePercent > 5) trendStrength = 'strong';
    else if (slopePercent > 2) trendStrength = 'moderate';
    else trendStrength = 'weak';
  }

  // Generate forecast
  const forecast: number[] = [];
  const forecastTimes: string[] = [];
  const now = new Date();
  const intervalMs = n > 1 ? 5 * 60 * 1000 : 5 * 60 * 1000; // Assume 5-minute intervals

  for (let i = 0; i < forecastPoints; i++) {
    const x = n + i;
    const predictedValue = Math.max(0, slope * x + intercept);
    forecast.push(predictedValue);

    const forecastTime = new Date(now.getTime() + (i + 1) * intervalMs);
    forecastTimes.push(forecastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }

  // Calculate time to threshold (if trending towards it)
  let timeToThreshold: number | null = null;
  const currentValue = data[data.length - 1];

  if (slope > 0 && currentValue < threshold) {
    // How many data points until we hit threshold?
    const pointsToThreshold = (threshold - intercept) / slope - (n - 1);
    if (pointsToThreshold > 0 && pointsToThreshold < 100) {
      timeToThreshold = Math.round(pointsToThreshold * 5); // Convert to minutes (5-min intervals)
    }
  }

  // Find predicted peak in forecast window
  const allPredicted = [...data, ...forecast];
  const predictedPeakValue = Math.max(...forecast, currentValue);
  const peakIndex = forecast.indexOf(predictedPeakValue);
  const predictedPeakTime = peakIndex >= 0 ? forecastTimes[peakIndex] : null;

  return {
    slope, intercept, rSquared,
    trendDirection, trendStrength,
    forecast, forecastTimes,
    timeToThreshold, predictedPeakValue, predictedPeakTime
  };
}

function generatePredictiveAlerts(
  currentValue: number,
  trend: TrendAnalysis,
  threshold: number,
  metricName: string
): PredictiveAlert[] {
  const alerts: PredictiveAlert[] = [];

  // Check if currently above threshold
  if (currentValue >= threshold) {
    alerts.push({
      type: 'threshold_critical',
      message: `${metricName} is currently above threshold (${currentValue.toFixed(1)} > ${threshold})`,
      severity: 'critical',
      timeToEvent: 0,
      predictedValue: currentValue,
      threshold
    });
  } else if (currentValue >= threshold * 0.9) {
    alerts.push({
      type: 'threshold_warning',
      message: `${metricName} is approaching threshold (${currentValue.toFixed(1)} / ${threshold})`,
      severity: 'warning',
      timeToEvent: null,
      predictedValue: currentValue,
      threshold
    });
  }

  // Check if trending towards threshold
  if (trend.timeToThreshold !== null && trend.timeToThreshold > 0 && trend.timeToThreshold < 60) {
    alerts.push({
      type: 'trend_warning',
      message: `${metricName} predicted to exceed threshold in ~${trend.timeToThreshold} minutes`,
      severity: trend.timeToThreshold < 15 ? 'critical' : 'warning',
      timeToEvent: trend.timeToThreshold,
      predictedValue: threshold,
      threshold
    });
  }

  // Check if forecast shows concerning values
  const maxForecast = Math.max(...trend.forecast);
  if (maxForecast > threshold && currentValue < threshold) {
    const forecastIndex = trend.forecast.findIndex(v => v > threshold);
    if (forecastIndex >= 0) {
      alerts.push({
        type: 'trend_warning',
        message: `Forecast shows ${metricName} exceeding threshold at ${trend.forecastTimes[forecastIndex]}`,
        severity: 'warning',
        timeToEvent: (forecastIndex + 1) * 5,
        predictedValue: maxForecast,
        threshold
      });
    }
  }

  return alerts;
}

const metricTypes = [
  { value: 'cpu_usage', label: 'CPU Usage', unit: '%', threshold: 80 },
  { value: 'memory_usage', label: 'Memory Usage', unit: '%', threshold: 85 },
  { value: 'network_throughput', label: 'Network Throughput', unit: 'MB/s', threshold: 100 },
  { value: 'disk_io', label: 'Disk I/O', unit: 'IOPS', threshold: 1000 },
  { value: 'request_latency', label: 'Request Latency', unit: 'ms', threshold: 500 },
  { value: 'error_rate', label: 'Error Rate', unit: '%', threshold: 5 },
];

const timeRanges = [
  { value: '-1h', label: 'Last Hour' },
  { value: '-6h', label: 'Last 6 Hours' },
  { value: '-24h', label: 'Last 24 Hours' },
  { value: '-7d', label: 'Last 7 Days' },
];

export default function Metrics() {
  const [selectedMetric, setSelectedMetric] = useState('cpu_usage');
  const [timeRange, setTimeRange] = useState('-1h');
  const [showAnomalyBands, setShowAnomalyBands] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const chartRef = useRef<any>(null);

  const { data: metricsData, isLoading } = trpc.metrics.query.useQuery({
    measurement: selectedMetric,
    timeRange: timeRange,
  });

  const metricConfig = metricTypes.find(m => m.value === selectedMetric);
  const threshold = metricConfig?.threshold || 80;

  // Calculate anomaly statistics
  const anomalyStats = useMemo(() => {
    if (!metricsData || metricsData.length === 0) return null;
    const values = metricsData.map(p => p._value);
    const times = metricsData.map(p => new Date(p._time).toLocaleTimeString());
    return calculateAnomalyStats(values, times, 2);
  }, [metricsData]);

  // Calculate trend analysis and forecasting
  const trendAnalysis = useMemo(() => {
    if (!metricsData || metricsData.length === 0) return null;
    const values = metricsData.map(p => p._value);
    const times = metricsData.map(p => new Date(p._time).toLocaleTimeString());
    return calculateTrendAnalysis(values, times, threshold, 6);
  }, [metricsData, threshold]);

  // Generate predictive alerts
  const predictiveAlerts = useMemo(() => {
    if (!metricsData || metricsData.length === 0 || !trendAnalysis) return [];
    const currentValue = metricsData[metricsData.length - 1]._value;
    return generatePredictiveAlerts(currentValue, trendAnalysis, threshold, metricConfig?.label || selectedMetric);
  }, [metricsData, trendAnalysis, threshold, metricConfig, selectedMetric]);

  // Prepare export data
  const exportData = useMemo(() => {
    if (!metricsData) return [];
    return metricsData.map(point => ({
      timestamp: new Date(point._time).toLocaleString(),
      value: point._value,
      measurement: selectedMetric,
    }));
  }, [metricsData, selectedMetric]);

  const exportColumns = [
    { key: 'timestamp', header: 'Timestamp', width: 50 },
    { key: 'value', header: 'Value', width: 30 },
    { key: 'measurement', header: 'Metric', width: 40 },
  ];

  const exportSummary = anomalyStats ? {
    'Average': `${anomalyStats.mean.toFixed(2)} ${metricConfig?.unit || ''}`,
    'Standard Deviation': anomalyStats.stdDev.toFixed(2),
    'Min': `${anomalyStats.min.toFixed(2)} ${metricConfig?.unit || ''}`,
    'Max': `${anomalyStats.max.toFixed(2)} ${metricConfig?.unit || ''}`,
    'Anomalies Detected': anomalyStats.anomalies.length,
  } : undefined;

  const chartData = useMemo(() => {
    if (!metricsData || metricsData.length === 0 || !anomalyStats) {
      return { labels: [], datasets: [] };
    }

    const labels = metricsData.map(point => new Date(point._time).toLocaleTimeString());
    const values = metricsData.map(point => point._value);

    // Add forecast labels if enabled
    const allLabels = showForecast && trendAnalysis
      ? [...labels, ...trendAnalysis.forecastTimes]
      : labels;

    // Create point background colors - highlight anomalies in red/orange
    const pointBackgroundColors = values.map((_, i) => {
      const anomaly = anomalyStats.anomalies.find(a => a.index === i);
      if (anomaly) {
        return anomaly.severity === 'critical' ? 'rgb(220, 38, 38)' : 'rgb(245, 158, 11)';
      }
      return 'rgb(204, 0, 0)';
    });

    const pointRadii = values.map((_, i) => {
      const isAnomaly = anomalyStats.anomalies.some(a => a.index === i);
      return isAnomaly ? 8 : 3;
    });

    const datasets: any[] = [
      {
        label: metricConfig?.label || selectedMetric,
        data: values,
        borderColor: 'rgb(204, 0, 0)',
        backgroundColor: 'rgba(204, 0, 0, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: pointBackgroundColors,
        pointBorderColor: pointBackgroundColors,
        pointRadius: pointRadii,
        pointHoverRadius: 8,
      },
    ];

    // Add forecast line
    if (showForecast && trendAnalysis && trendAnalysis.forecast.length > 0) {
      // Create forecast data with nulls for historical points
      const forecastData = [...values.map(() => null), ...trendAnalysis.forecast];

      // Add a connecting point from last actual value
      forecastData[values.length - 1] = values[values.length - 1];

      datasets.push({
        label: 'Forecast',
        data: forecastData,
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderDash: [8, 4],
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: forecastData.map((v, i) => v !== null && i >= values.length ? 5 : 0),
        pointBackgroundColor: 'rgb(139, 92, 246)',
        pointBorderColor: 'rgb(139, 92, 246)',
      });

      // Add trend line (linear regression)
      const trendLineData = values.map((_, i) => trendAnalysis.slope * i + trendAnalysis.intercept);
      datasets.push({
        label: 'Trend Line',
        data: trendLineData,
        borderColor: 'rgba(16, 185, 129, 0.7)',
        borderDash: [4, 4],
        borderWidth: 2,
        fill: false,
        tension: 0,
        pointRadius: 0,
      });
    }

    if (showAnomalyBands) {
      // Moving average line
      datasets.push({
        label: 'Moving Average',
        data: anomalyStats.movingAverage,
        borderColor: 'rgb(59, 130, 246)',
        borderDash: [5, 5],
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      });

      // Upper bound (dashed)
      datasets.push({
        label: 'Upper Threshold',
        data: anomalyStats.upperBound,
        borderColor: 'rgba(245, 158, 11, 0.5)',
        borderDash: [3, 3],
        borderWidth: 1,
        fill: false,
        pointRadius: 0,
      });

      // Lower bound (dashed)
      datasets.push({
        label: 'Lower Threshold',
        data: anomalyStats.lowerBound,
        borderColor: 'rgba(245, 158, 11, 0.5)',
        borderDash: [3, 3],
        borderWidth: 1,
        fill: false,
        pointRadius: 0,
      });
    }

    // Add threshold line
    const thresholdData = allLabels.map(() => threshold);
    datasets.push({
      label: `Threshold (${threshold}${metricConfig?.unit || ''})`,
      data: thresholdData,
      borderColor: 'rgba(239, 68, 68, 0.8)',
      borderDash: [10, 5],
      borderWidth: 2,
      fill: false,
      pointRadius: 0,
    });

    return { labels: allLabels, datasets };
  }, [metricsData, anomalyStats, selectedMetric, showAnomalyBands, metricConfig, showForecast, trendAnalysis, threshold]);

  // Generate annotations for anomalies
  const annotations = useMemo(() => {
    if (!anomalyStats || !showAnomalyBands) return {};

    const result: Record<string, any> = {};
    anomalyStats.anomalies.forEach((anomaly, idx) => {
      result[`anomaly${idx}`] = {
        type: 'point',
        xValue: anomaly.index,
        yValue: anomaly.value,
        backgroundColor: anomaly.severity === 'critical' ? 'rgba(220, 38, 38, 0.3)' : 'rgba(245, 158, 11, 0.3)',
        radius: 20,
      };
    });
    return result;
  }, [anomalyStats, showAnomalyBands]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showAnomalyBands,
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          afterBody: (context: any) => {
            if (!anomalyStats) return '';
            const index = context[0]?.dataIndex;
            const anomaly = anomalyStats.anomalies.find(a => a.index === index);
            if (anomaly) {
              return [`⚠️ ANOMALY: ${anomaly.description}`];
            }
            return '';
          },
        },
      },
      annotation: {
        annotations,
      },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  }), [showAnomalyBands, annotations, anomalyStats]);

  const currentValue = metricsData && metricsData.length > 0
    ? metricsData[metricsData.length - 1]._value.toFixed(2)
    : '0';

  const avgValue = anomalyStats?.mean.toFixed(2) || '0';
  const maxValue = anomalyStats?.max.toFixed(2) || '0';
  const stdDevValue = anomalyStats?.stdDev.toFixed(2) || '0';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Metrics Monitoring</h1>
            <p className="text-muted-foreground mt-1">
              Real-time performance metrics with AI-powered anomaly detection
            </p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={() => setShowAnomalyBands(!showAnomalyBands)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                showAnomalyBands
                  ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300'
                  : 'bg-card border-border hover:bg-accent'
              }`}
            >
              <Shield className="h-4 w-4" />
              Anomaly Detection
            </button>
            <button
              onClick={() => setShowForecast(!showForecast)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                showForecast
                  ? 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300'
                  : 'bg-card border-border hover:bg-accent'
              }`}
            >
              <Target className="h-4 w-4" />
              Forecasting
            </button>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ExportMenu
              data={exportData}
              columns={exportColumns}
              title={`Metrics Report - ${metricConfig?.label || selectedMetric}`}
              subtitle={`Time Range: ${timeRanges.find(t => t.value === timeRange)?.label || timeRange}`}
              summary={exportSummary}
              chartRef={chartRef}
            />
          </div>
        </div>

        {/* Predictive Alerts Banner */}
        {predictiveAlerts.length > 0 && (
          <Card className={`border-2 ${
            predictiveAlerts.some(a => a.severity === 'critical')
              ? 'border-red-400 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20'
              : 'border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20'
          }`}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  predictiveAlerts.some(a => a.severity === 'critical')
                    ? 'bg-red-100 dark:bg-red-900/50'
                    : 'bg-purple-100 dark:bg-purple-900/50'
                }`}>
                  <Bell className={`h-5 w-5 ${
                    predictiveAlerts.some(a => a.severity === 'critical')
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-purple-600 dark:text-purple-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`font-semibold ${
                      predictiveAlerts.some(a => a.severity === 'critical')
                        ? 'text-red-800 dark:text-red-300'
                        : 'text-purple-800 dark:text-purple-300'
                    }`}>
                      Predictive Alerts
                    </h3>
                    {predictiveAlerts.filter(a => a.severity === 'critical').length > 0 && (
                      <Badge variant="destructive">
                        {predictiveAlerts.filter(a => a.severity === 'critical').length} Critical
                      </Badge>
                    )}
                    {predictiveAlerts.filter(a => a.severity === 'warning').length > 0 && (
                      <Badge variant="outline" className="text-amber-700 border-amber-300">
                        {predictiveAlerts.filter(a => a.severity === 'warning').length} Warning
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    {predictiveAlerts.map((alert, idx) => (
                      <p key={idx} className={`text-sm flex items-center gap-2 ${
                        alert.severity === 'critical' ? 'text-red-700 dark:text-red-400' : 'text-purple-700 dark:text-purple-400'
                      }`}>
                        {alert.timeToEvent !== null && alert.timeToEvent > 0 ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                        {alert.message}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Anomaly Alert Banner */}
        {anomalyStats && anomalyStats.anomalies.length > 0 && (
          <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-700">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                      {anomalyStats.anomalies.length} Anomal{anomalyStats.anomalies.length === 1 ? 'y' : 'ies'} Detected
                    </h3>
                    <Badge variant="outline" className="text-amber-700 border-amber-300">
                      {anomalyStats.anomalies.filter(a => a.severity === 'critical').length} Critical
                    </Badge>
                    <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                      {anomalyStats.anomalies.filter(a => a.severity === 'warning').length} Warning
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {anomalyStats.anomalies.slice(0, 3).map((anomaly, idx) => (
                      <p key={idx} className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                        {anomaly.type === 'spike' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        <span className="font-medium">{anomaly.time}:</span> {anomaly.description}
                      </p>
                    ))}
                    {anomalyStats.anomalies.length > 3 && (
                      <p className="text-xs text-amber-600 dark:text-amber-500">
                        +{anomalyStats.anomalies.length - 3} more anomalies detected
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metric Selector */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metricTypes.map(metric => (
            <button
              key={metric.value}
              onClick={() => setSelectedMetric(metric.value)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedMetric === metric.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:bg-accent border-border'
              }`}
            >
              <p className="text-sm font-medium">{metric.label}</p>
              <p className="text-xs opacity-70">{metric.unit}</p>
            </button>
          ))}
        </div>

        {/* Main Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {metricConfig?.label || selectedMetric}
                  {anomalyStats && anomalyStats.anomalies.length > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <Zap className="h-3 w-3" />
                      {anomalyStats.anomalies.length} anomalies
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Time series data with anomaly detection • Threshold: ±2σ from mean
                </CardDescription>
              </div>
              {anomalyStats && (
                <div className="text-right text-sm text-muted-foreground">
                  <p>μ = {anomalyStats.mean.toFixed(2)} {metricConfig?.unit}</p>
                  <p>σ = {anomalyStats.stdDev.toFixed(2)}</p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <div className="h-80">
                <Line ref={chartRef} data={chartData} options={chartOptions} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Current Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentValue} <span className="text-sm font-normal text-muted-foreground">{metricConfig?.unit}</span></div>
              <p className="text-xs text-muted-foreground mt-1">Latest reading</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average (μ)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgValue} <span className="text-sm font-normal text-muted-foreground">{metricConfig?.unit}</span></div>
              <p className="text-xs text-muted-foreground mt-1">Mean over period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Std Deviation (σ)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stdDevValue}</div>
              <p className="text-xs text-muted-foreground mt-1">Volatility measure</p>
            </CardContent>
          </Card>

          <Card className={anomalyStats && anomalyStats.anomalies.length > 0 ? 'border-amber-300' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Anomalies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{anomalyStats?.anomalies.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Detected in period</p>
            </CardContent>
          </Card>
        </div>

        {/* Trend Analysis Card */}
        {trendAnalysis && showForecast && (
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                Trend Analysis & Forecasting
              </CardTitle>
              <CardDescription>
                Linear regression analysis with R² = {trendAnalysis.rSquared.toFixed(3)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Trend Direction</p>
                  <div className="flex items-center gap-2 mt-1">
                    {trendAnalysis.trendDirection === 'increasing' ? (
                      <TrendingUp className="h-5 w-5 text-red-500" />
                    ) : trendAnalysis.trendDirection === 'decreasing' ? (
                      <TrendingDown className="h-5 w-5 text-green-500" />
                    ) : (
                      <Activity className="h-5 w-5 text-blue-500" />
                    )}
                    <span className="font-semibold capitalize">{trendAnalysis.trendDirection}</span>
                    <Badge variant="outline" className="text-xs">
                      {trendAnalysis.trendStrength}
                    </Badge>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Slope</p>
                  <p className="text-lg font-semibold mt-1">
                    {trendAnalysis.slope > 0 ? '+' : ''}{trendAnalysis.slope.toFixed(3)}
                    <span className="text-sm font-normal text-muted-foreground"> per interval</span>
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Predicted Peak</p>
                  <p className="text-lg font-semibold mt-1">
                    {trendAnalysis.predictedPeakValue.toFixed(1)}
                    <span className="text-sm font-normal text-muted-foreground"> {metricConfig?.unit}</span>
                  </p>
                  {trendAnalysis.predictedPeakTime && (
                    <p className="text-xs text-muted-foreground">at {trendAnalysis.predictedPeakTime}</p>
                  )}
                </div>

                <div className={`p-3 rounded-lg ${
                  trendAnalysis.timeToThreshold !== null
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : 'bg-muted/50'
                }`}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Time to Threshold</p>
                  <p className="text-lg font-semibold mt-1">
                    {trendAnalysis.timeToThreshold !== null
                      ? `~${trendAnalysis.timeToThreshold} min`
                      : 'N/A'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Threshold: {threshold}{metricConfig?.unit}
                  </p>
                </div>
              </div>

              {/* Forecast Values */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Forecast Values (next 30 min)</p>
                <div className="flex gap-2 flex-wrap">
                  {trendAnalysis.forecast.map((value, idx) => (
                    <div
                      key={idx}
                      className={`px-3 py-1 rounded-full text-sm ${
                        value > threshold
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}
                    >
                      {trendAnalysis.forecastTimes[idx]}: {value.toFixed(1)}{metricConfig?.unit}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Anomaly Details Table */}
        {anomalyStats && anomalyStats.anomalies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Anomaly Details
              </CardTitle>
              <CardDescription>Detailed breakdown of detected anomalies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">Time</th>
                      <th className="text-left py-2 px-3 font-medium">Type</th>
                      <th className="text-left py-2 px-3 font-medium">Value</th>
                      <th className="text-left py-2 px-3 font-medium">Z-Score</th>
                      <th className="text-left py-2 px-3 font-medium">Severity</th>
                      <th className="text-left py-2 px-3 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anomalyStats.anomalies.map((anomaly, idx) => (
                      <tr key={idx} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-2 px-3 font-mono text-xs">{anomaly.time}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1">
                            {anomaly.type === 'spike' ? (
                              <TrendingUp className="h-4 w-4 text-red-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-blue-500" />
                            )}
                            <span className="capitalize">{anomaly.type}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 font-medium">{anomaly.value.toFixed(2)} {metricConfig?.unit}</td>
                        <td className="py-2 px-3">
                          <span className={`font-mono ${anomaly.zScore > 3 ? 'text-red-600' : 'text-amber-600'}`}>
                            {anomaly.zScore.toFixed(2)}σ
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <Badge variant={anomaly.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {anomaly.severity}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground max-w-xs truncate">{anomaly.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resource Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Top Resources</CardTitle>
            <CardDescription>Resources with highest metric values</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['cvs-web-server-01', 'cvs-api-server-01', 'cvs-worker-01', 'cvs-db-primary'].map((resource, idx) => {
                const value = 85 - idx * 15;
                const isWarning = value > (metricConfig?.threshold || 80);
                return (
                  <div key={resource} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium flex items-center gap-2">
                        {resource}
                        {isWarning && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                      </span>
                      <span className={isWarning ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>
                        {value}{metricConfig?.unit}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${isWarning ? 'bg-amber-500' : 'bg-primary'}`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
