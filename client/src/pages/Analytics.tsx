import { useState, useMemo, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  AlertTriangle,
  CheckCircle,
  Server,
  Database,
  Globe,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { ExportMenu } from '@/components/ExportMenu';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Generate mock time series data
function generateTimeSeriesData(hours: number, baseValue: number, variance: number, trend: number = 0) {
  const data: { time: string; value: number }[] = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const trendValue = trend * (hours - i) / hours;
    const noise = (Math.random() - 0.5) * variance;
    const hourlyPattern = Math.sin((time.getHours() / 24) * 2 * Math.PI) * variance * 0.3;
    const value = Math.max(0, baseValue + trendValue + noise + hourlyPattern);
    
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: Math.round(value * 100) / 100,
    });
  }
  
  return data;
}

// Generate mock heatmap data (24h x 7 days)
function generateHeatmapData() {
  const data: number[][] = [];
  for (let day = 0; day < 7; day++) {
    const dayData: number[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const isWorkHour = hour >= 9 && hour <= 17;
      const isWeekend = day >= 5;
      const baseActivity = isWeekend ? 30 : isWorkHour ? 80 : 40;
      const noise = Math.random() * 20;
      dayData.push(Math.round(baseActivity + noise));
    }
    data.push(dayData);
  }
  return data;
}

const timeRanges = [
  { value: '1h', label: 'Last Hour', hours: 1 },
  { value: '6h', label: 'Last 6 Hours', hours: 6 },
  { value: '24h', label: 'Last 24 Hours', hours: 24 },
  { value: '7d', label: 'Last 7 Days', hours: 168 },
];

// KPI Component
function KPICard({ 
  title, value, unit, change, trend, icon: Icon, status 
}: { 
  title: string; value: string | number; unit?: string; change?: number; 
  trend?: 'up' | 'down' | 'stable'; icon: any; status?: 'healthy' | 'warning' | 'critical';
}) {
  const statusColors = { healthy: 'text-green-500', warning: 'text-amber-500', critical: 'text-red-500' };
  
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold">{value}</span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${
                trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
              }`}>
                {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : 
                 trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
                <span>{change > 0 ? '+' : ''}{change}% vs last period</span>
              </div>
            )}
          </div>
          <div className={`p-2 rounded-lg bg-primary/10 ${status ? statusColors[status] : 'text-primary'}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {status && (
          <div className="absolute top-0 right-0 w-1 h-full" style={{
            backgroundColor: status === 'healthy' ? '#22c55e' : status === 'warning' ? '#f59e0b' : '#ef4444'
          }} />
        )}
      </CardContent>
    </Card>
  );
}

// Mini Sparkline Chart
function SparklineChart({ data, color = 'rgb(204, 0, 0)' }: { data: number[]; color?: string }) {
  const chartData = {
    labels: data.map((_, i) => i.toString()),
    datasets: [{ data, borderColor: color, borderWidth: 2, fill: true, backgroundColor: `${color}20`, tension: 0.4, pointRadius: 0 }],
  };
  return (
    <div className="h-12 w-full">
      <Line data={chartData} options={{
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
      }} />
    </div>
  );
}

// Main Analytics Component
export default function Analytics() {
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const hours = timeRanges.find(r => r.value === timeRange)?.hours || 24;

  // Generate mock data
  const cpuData = useMemo(() => generateTimeSeriesData(hours, 45, 20, 5), [hours]);
  const memoryData = useMemo(() => generateTimeSeriesData(hours, 65, 15, 10), [hours]);
  const networkData = useMemo(() => generateTimeSeriesData(hours, 250, 100, -20), [hours]);
  const requestsData = useMemo(() => generateTimeSeriesData(hours, 1500, 500, 200), [hours]);
  const latencyData = useMemo(() => generateTimeSeriesData(hours, 120, 50, 15), [hours]);
  const errorRateData = useMemo(() => generateTimeSeriesData(hours, 2, 3, -0.5), [hours]);
  const heatmapData = useMemo(() => generateHeatmapData(), []);

  // Chart configurations
  const createLineChartData = (data: { time: string; value: number }[], label: string, color: string) => ({
    labels: data.map(d => d.time),
    datasets: [{
      label,
      data: data.map(d => d.value),
      borderColor: color,
      backgroundColor: `${color}20`,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
    }],
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { size: 10 } } },
      y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' }, ticks: { font: { size: 10 } } },
    },
    interaction: { mode: 'nearest' as const, axis: 'x' as const, intersect: false },
  };

  // Service distribution data
  const serviceDistribution = {
    labels: ['Compute Engine', 'Cloud Functions', 'Cloud SQL', 'Cloud Storage', 'BigQuery', 'Other'],
    datasets: [{
      data: [35, 20, 18, 12, 10, 5],
      backgroundColor: ['rgb(204, 0, 0)', 'rgb(59, 130, 246)', 'rgb(16, 185, 129)', 'rgb(245, 158, 11)', 'rgb(139, 92, 246)', 'rgb(107, 114, 128)'],
      borderWidth: 0,
    }],
  };

  // Request distribution by region
  const regionData = {
    labels: ['US-East', 'US-West', 'Europe', 'Asia', 'Other'],
    datasets: [{ label: 'Requests (K)', data: [450, 320, 280, 190, 60], backgroundColor: 'rgba(204, 0, 0, 0.8)', borderRadius: 4 }],
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Comprehensive system overview • Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                autoRefresh ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30' : 'bg-card border-border'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
              Auto Refresh
            </button>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {timeRanges.map(range => (
                  <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ExportMenu
              data={[
                { metric: 'CPU Usage', value: 47.3, unit: '%', status: 'healthy' },
                { metric: 'Memory', value: 68.1, unit: '%', status: 'warning' },
                { metric: 'Network I/O', value: 2.4, unit: 'GB/s', status: 'healthy' },
                { metric: 'Latency P95', value: 124, unit: 'ms', status: 'warning' },
                { metric: 'Error Rate', value: 0.12, unit: '%', status: 'healthy' },
                { metric: 'Uptime', value: 99.97, unit: '%', status: 'healthy' },
              ]}
              columns={[
                { key: 'metric', header: 'Metric', width: 40 },
                { key: 'value', header: 'Value', width: 25 },
                { key: 'unit', header: 'Unit', width: 20 },
                { key: 'status', header: 'Status', width: 25 },
              ]}
              title="Analytics Dashboard Report"
              subtitle={`Time Range: ${timeRanges.find(t => t.value === timeRange)?.label || timeRange}`}
              summary={{
                'Report Generated': new Date().toLocaleString(),
                'Time Range': timeRanges.find(t => t.value === timeRange)?.label || timeRange,
                'Overall Status': 'Healthy',
              }}
            />
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <KPICard title="CPU Usage" value="47.3" unit="%" change={5.2} trend="up" icon={Cpu} status="healthy" />
          <KPICard title="Memory" value="68.1" unit="%" change={2.1} trend="up" icon={HardDrive} status="warning" />
          <KPICard title="Network I/O" value="2.4" unit="GB/s" change={-8.3} trend="down" icon={Wifi} status="healthy" />
          <KPICard title="Latency P95" value="124" unit="ms" change={12.5} trend="up" icon={Clock} status="warning" />
          <KPICard title="Error Rate" value="0.12" unit="%" change={-45} trend="down" icon={AlertTriangle} status="healthy" />
          <KPICard title="Uptime" value="99.97" unit="%" change={0.02} trend="up" icon={CheckCircle} status="healthy" />
        </div>

        {/* Main Charts Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">CPU & Memory Utilization</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs"><span className="w-2 h-2 rounded-full bg-red-500 mr-1 inline-block" />CPU</Badge>
                  <Badge variant="outline" className="text-xs"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1 inline-block" />Memory</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <Line
                  data={{
                    labels: cpuData.map(d => d.time),
                    datasets: [
                      { ...createLineChartData(cpuData, 'CPU', 'rgb(204, 0, 0)').datasets[0] },
                      { ...createLineChartData(memoryData, 'Memory', 'rgb(59, 130, 246)').datasets[0] },
                    ],
                  }}
                  options={chartOptions}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Request Rate</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  {requestsData[requestsData.length - 1]?.value.toFixed(0)} req/min
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <Line data={createLineChartData(requestsData, 'Requests', 'rgb(16, 185, 129)')} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Charts Row */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Response Latency (P95)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40">
                <Line data={createLineChartData(latencyData, 'Latency', 'rgb(245, 158, 11)')} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40">
                <Line data={createLineChartData(errorRateData, 'Errors', 'rgb(239, 68, 68)')} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Network I/O</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40">
                <Line data={createLineChartData(networkData, 'Network', 'rgb(139, 92, 246)')} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Distribution Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Service Distribution</CardTitle>
              <CardDescription>Resource usage by GCP service</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="w-64">
                  <Doughnut data={serviceDistribution} options={{ plugins: { legend: { position: 'right' as const } } }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Requests by Region</CardTitle>
              <CardDescription>Geographic distribution of traffic</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Bar data={regionData} options={{ ...chartOptions, indexAxis: 'y' as const }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Heatmap */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Weekly Activity Heatmap</CardTitle>
            <CardDescription>Request volume by hour and day of week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="flex gap-1 mb-1">
                  <div className="w-16" />
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className="flex-1 text-center text-xs text-muted-foreground">{i}</div>
                  ))}
                </div>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dayIdx) => (
                  <div key={day} className="flex gap-1 mb-1">
                    <div className="w-16 text-xs text-muted-foreground flex items-center">{day}</div>
                    {heatmapData[dayIdx]?.map((value, hourIdx) => (
                      <div
                        key={hourIdx}
                        className="flex-1 h-6 rounded-sm transition-colors"
                        style={{
                          backgroundColor: `rgba(204, 0, 0, ${value / 100})`,
                        }}
                        title={`${day} ${hourIdx}:00 - ${value}% activity`}
                      />
                    ))}
                  </div>
                ))}
                <div className="flex items-center justify-end gap-2 mt-2 text-xs text-muted-foreground">
                  <span>Low</span>
                  <div className="flex gap-0.5">
                    {[0.2, 0.4, 0.6, 0.8, 1].map(opacity => (
                      <div key={opacity} className="w-4 h-4 rounded-sm" style={{ backgroundColor: `rgba(204, 0, 0, ${opacity})` }} />
                    ))}
                  </div>
                  <span>High</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Status Grid */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Service Health Status</CardTitle>
            <CardDescription>Real-time status of all monitored services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { name: 'API Gateway', status: 'healthy', latency: 45, uptime: 99.99 },
                { name: 'Auth Service', status: 'healthy', latency: 23, uptime: 99.97 },
                { name: 'Database Primary', status: 'warning', latency: 156, uptime: 99.85 },
                { name: 'Cache Layer', status: 'healthy', latency: 8, uptime: 100 },
                { name: 'Message Queue', status: 'healthy', latency: 12, uptime: 99.99 },
                { name: 'Storage Service', status: 'healthy', latency: 67, uptime: 99.95 },
                { name: 'Analytics Engine', status: 'critical', latency: 890, uptime: 98.5 },
                { name: 'CDN Edge', status: 'healthy', latency: 15, uptime: 99.99 },
              ].map(service => (
                <div key={service.name} className={`p-3 rounded-lg border ${
                  service.status === 'healthy' ? 'border-green-200 bg-green-50 dark:bg-green-900/20' :
                  service.status === 'warning' ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/20' :
                  'border-red-200 bg-red-50 dark:bg-red-900/20'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{service.name}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      service.status === 'healthy' ? 'bg-green-500' :
                      service.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{service.latency}ms</span>
                    <span>{service.uptime}% uptime</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

