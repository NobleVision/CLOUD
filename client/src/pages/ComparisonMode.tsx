import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  GitCompare,
  Calendar,
  Server,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  DollarSign,
  Cpu,
  HardDrive,
  Database,
  Globe,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Layers,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Title, ChartTooltip, Legend);

// Types
type ComparisonType = 'time-period' | 'environment';

interface MetricData {
  name: string;
  periodA: number;
  periodB: number;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  higherIsBetter?: boolean;
}

interface EnvironmentMetric {
  name: string;
  production: number;
  staging: number;
  development: number;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Time period options
const timePeriodOptions = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last-week', label: 'Last Week' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'last-quarter', label: 'Last Quarter' },
];

// Environment options
const environmentOptions = [
  { value: 'production', label: 'Production', color: 'bg-green-500' },
  { value: 'staging', label: 'Staging', color: 'bg-amber-500' },
  { value: 'development', label: 'Development', color: 'bg-blue-500' },
];

// Mock data generators
const generateTimePeriodMetrics = (periodA: string, periodB: string): MetricData[] => [
  { name: 'Uptime', periodA: 99.97, periodB: 99.92, unit: '%', icon: CheckCircle, higherIsBetter: true },
  { name: 'Avg Latency (P95)', periodA: 124, periodB: 142, unit: 'ms', icon: Zap, higherIsBetter: false },
  { name: 'Error Rate', periodA: 0.12, periodB: 0.18, unit: '%', icon: AlertTriangle, higherIsBetter: false },
  { name: 'Throughput', periodA: 12500, periodB: 11200, unit: 'req/s', icon: Activity, higherIsBetter: true },
  { name: 'CPU Utilization', periodA: 68, periodB: 72, unit: '%', icon: Cpu, higherIsBetter: false },
  { name: 'Memory Usage', periodA: 72, periodB: 78, unit: '%', icon: HardDrive, higherIsBetter: false },
  { name: 'DB Connections', periodA: 245, periodB: 312, unit: '', icon: Database, higherIsBetter: false },
  { name: 'Cache Hit Rate', periodA: 94.5, periodB: 92.1, unit: '%', icon: Layers, higherIsBetter: true },
  { name: 'Daily Cost', periodA: 28100, periodB: 29500, unit: '$', icon: DollarSign, higherIsBetter: false },
  { name: 'Active Users', periodA: 45200, periodB: 38900, unit: '', icon: Globe, higherIsBetter: true },
];

const generateEnvironmentMetrics = (): EnvironmentMetric[] => [
  { name: 'CPU Utilization', production: 68, staging: 42, development: 25, unit: '%', icon: Cpu },
  { name: 'Memory Usage', production: 72, staging: 55, development: 38, unit: '%', icon: HardDrive },
  { name: 'Active Pods', production: 48, staging: 12, development: 6, unit: '', icon: Server },
  { name: 'Request Rate', production: 12500, staging: 850, development: 120, unit: '/s', icon: Activity },
  { name: 'Error Rate', production: 0.12, staging: 0.08, development: 0.45, unit: '%', icon: AlertTriangle },
  { name: 'Avg Latency', production: 124, staging: 98, development: 210, unit: 'ms', icon: Zap },
  { name: 'DB Connections', production: 245, staging: 45, development: 12, unit: '', icon: Database },
  { name: 'Daily Cost', production: 28100, staging: 4500, development: 1200, unit: '$', icon: DollarSign },
];

// Helper functions
const getChangePercent = (a: number, b: number): number => {
  if (b === 0) return 0;
  return ((a - b) / b) * 100;
};

const getChangeIndicator = (change: number, higherIsBetter: boolean = true) => {
  const isPositive = higherIsBetter ? change > 0 : change < 0;
  const isNegative = higherIsBetter ? change < 0 : change > 0;

  if (Math.abs(change) < 0.5) {
    return { icon: Minus, color: 'text-gray-500', bg: 'bg-gray-500/10' };
  }
  if (isPositive) {
    return { icon: ArrowUp, color: 'text-green-500', bg: 'bg-green-500/10' };
  }
  if (isNegative) {
    return { icon: ArrowDown, color: 'text-red-500', bg: 'bg-red-500/10' };
  }
  return { icon: Minus, color: 'text-gray-500', bg: 'bg-gray-500/10' };
};

// Comparison Metric Card
function ComparisonMetricCard({ metric }: { metric: MetricData }) {
  const change = getChangePercent(metric.periodA, metric.periodB);
  const indicator = getChangeIndicator(change, metric.higherIsBetter);
  const Icon = metric.icon;
  const ChangeIcon = indicator.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
      className="p-4 rounded-xl border bg-card"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium text-sm">{metric.name}</span>
        </div>
        <Badge variant="outline" className={cn("text-xs", indicator.color, indicator.bg)}>
          <ChangeIcon className="h-3 w-3 mr-1" />
          {Math.abs(change).toFixed(1)}%
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 rounded-lg bg-blue-500/10">
          <p className="text-xs text-muted-foreground mb-1">Period A</p>
          <p className="text-lg font-bold text-blue-600">
            {metric.unit === '$' ? '$' : ''}{metric.periodA.toLocaleString()}{metric.unit !== '$' ? metric.unit : ''}
          </p>
        </div>
        <div className="text-center p-3 rounded-lg bg-purple-500/10">
          <p className="text-xs text-muted-foreground mb-1">Period B</p>
          <p className="text-lg font-bold text-purple-600">
            {metric.unit === '$' ? '$' : ''}{metric.periodB.toLocaleString()}{metric.unit !== '$' ? metric.unit : ''}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Environment Comparison Bar
function EnvironmentComparisonCard({ metric }: { metric: EnvironmentMetric }) {
  const Icon = metric.icon;
  const maxValue = Math.max(metric.production, metric.staging, metric.development);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
      className="p-4 rounded-xl border bg-card"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="font-medium text-sm">{metric.name}</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-xs w-16 text-muted-foreground">Prod</span>
          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(metric.production / maxValue) * 100}%` }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="h-full bg-green-500 rounded-full"
            />
          </div>
          <span className="text-sm font-medium w-20 text-right">
            {metric.unit === '$' ? '$' : ''}{metric.production.toLocaleString()}{metric.unit !== '$' ? metric.unit : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs w-16 text-muted-foreground">Staging</span>
          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(metric.staging / maxValue) * 100}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-full bg-amber-500 rounded-full"
            />
          </div>
          <span className="text-sm font-medium w-20 text-right">
            {metric.unit === '$' ? '$' : ''}{metric.staging.toLocaleString()}{metric.unit !== '$' ? metric.unit : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs w-16 text-muted-foreground">Dev</span>
          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(metric.development / maxValue) * 100}%` }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="h-full bg-blue-500 rounded-full"
            />
          </div>
          <span className="text-sm font-medium w-20 text-right">
            {metric.unit === '$' ? '$' : ''}{metric.development.toLocaleString()}{metric.unit !== '$' ? metric.unit : ''}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Main Comparison Mode Component
export default function ComparisonMode() {
  const [comparisonType, setComparisonType] = useState<ComparisonType>('time-period');
  const [periodA, setPeriodA] = useState('today');
  const [periodB, setPeriodB] = useState('yesterday');
  const [envA, setEnvA] = useState('production');
  const [envB, setEnvB] = useState('staging');

  const timePeriodMetrics = useMemo(() =>
    generateTimePeriodMetrics(periodA, periodB),
    [periodA, periodB]
  );

  const environmentMetrics = useMemo(() =>
    generateEnvironmentMetrics(),
    []
  );

  // Chart data for time period trends
  const trendLabels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'];

  const latencyChartData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Period A',
        data: [110, 115, 125, 140, 135, 128, 124],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Period B',
        data: [130, 142, 155, 148, 145, 138, 142],
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const throughputChartData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Period A',
        data: [8500, 10200, 12500, 14800, 13200, 11500, 9800],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 4,
      },
      {
        label: 'Period B',
        data: [7800, 9500, 11200, 13500, 12000, 10500, 8900],
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { usePointStyle: true, pointStyle: 'circle' }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 } } },
    },
  };

  // Summary stats for time period
  const improvements = timePeriodMetrics.filter(m => {
    const change = getChangePercent(m.periodA, m.periodB);
    return m.higherIsBetter ? change > 0 : change < 0;
  }).length;

  const regressions = timePeriodMetrics.filter(m => {
    const change = getChangePercent(m.periodA, m.periodB);
    return m.higherIsBetter ? change < 0 : change > 0;
  }).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <motion.div
                className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <GitCompare className="h-7 w-7 text-blue-500" />
              </motion.div>
              Comparison Mode
            </h1>
            <p className="text-muted-foreground mt-1">
              Side-by-side analysis of time periods and environments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export report</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Comparison Type Tabs */}
        <Tabs value={comparisonType} onValueChange={(v) => setComparisonType(v as ComparisonType)}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="time-period" className="gap-2">
              <Clock className="h-4 w-4" />
              Time Period
            </TabsTrigger>
            <TabsTrigger value="environment" className="gap-2">
              <Server className="h-4 w-4" />
              Environment
            </TabsTrigger>
          </TabsList>

          {/* Time Period Comparison */}
          <TabsContent value="time-period" className="space-y-6 mt-6">
            {/* Period Selectors */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium">Period A:</span>
                    <Select value={periodA} onValueChange={setPeriodA}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timePeriodOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </motion.div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="text-sm font-medium">Period B:</span>
                    <Select value={periodB} onValueChange={setPeriodB}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timePeriodOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl border bg-card text-center"
              >
                <p className="text-sm text-muted-foreground">Total Metrics</p>
                <p className="text-3xl font-bold">{timePeriodMetrics.length}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-xl border bg-green-500/10 text-center"
              >
                <p className="text-sm text-muted-foreground">Improvements</p>
                <p className="text-3xl font-bold text-green-500">{improvements}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="p-4 rounded-xl border bg-red-500/10 text-center"
              >
                <p className="text-sm text-muted-foreground">Regressions</p>
                <p className="text-3xl font-bold text-red-500">{regressions}</p>
              </motion.div>
            </div>

            {/* Comparison Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Latency Comparison (P95)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Line data={latencyChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    Throughput Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Bar data={throughputChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence>
                {timePeriodMetrics.map((metric, index) => (
                  <motion.div
                    key={metric.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ComparisonMetricCard metric={metric} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* Environment Comparison */}
          <TabsContent value="environment" className="space-y-6 mt-6">
            {/* Environment Legend */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-6 flex-wrap">
                  {environmentOptions.map(env => (
                    <div key={env.value} className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", env.color)} />
                      <span className="text-sm font-medium">{env.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Environment Metrics Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence>
                {environmentMetrics.map((metric, index) => (
                  <motion.div
                    key={metric.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <EnvironmentComparisonCard metric={metric} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Environment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Resource Utilization by Environment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <Bar
                    data={{
                      labels: ['CPU', 'Memory', 'Disk', 'Network'],
                      datasets: [
                        {
                          label: 'Production',
                          data: [68, 72, 55, 45],
                          backgroundColor: 'rgba(34, 197, 94, 0.8)',
                          borderRadius: 4,
                        },
                        {
                          label: 'Staging',
                          data: [42, 55, 38, 28],
                          backgroundColor: 'rgba(245, 158, 11, 0.8)',
                          borderRadius: 4,
                        },
                        {
                          label: 'Development',
                          data: [25, 38, 22, 15],
                          backgroundColor: 'rgba(59, 130, 246, 0.8)',
                          borderRadius: 4,
                        },
                      ],
                    }}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: { display: true, position: 'top' as const },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}