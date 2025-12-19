import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Scatter, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Activity, TrendingUp, TrendingDown, ArrowRight, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const metrics = [
  { id: 'cpu_usage', name: 'CPU Usage', unit: '%' },
  { id: 'memory_usage', name: 'Memory Usage', unit: '%' },
  { id: 'disk_io', name: 'Disk I/O', unit: 'MB/s' },
  { id: 'network_in', name: 'Network In', unit: 'MB/s' },
  { id: 'network_out', name: 'Network Out', unit: 'MB/s' },
  { id: 'request_rate', name: 'Request Rate', unit: 'req/s' },
  { id: 'error_rate', name: 'Error Rate', unit: '%' },
  { id: 'latency_p95', name: 'Latency P95', unit: 'ms' },
];

// Generate correlated mock data
function generateCorrelatedData(metric1: string, metric2: string, points: number = 50) {
  const data: { x: number; y: number }[] = [];
  const correlations: Record<string, Record<string, number>> = {
    cpu_usage: { memory_usage: 0.85, request_rate: 0.75, latency_p95: 0.6, error_rate: 0.4, disk_io: 0.5, network_in: 0.3, network_out: 0.3 },
    memory_usage: { cpu_usage: 0.85, disk_io: 0.7, latency_p95: 0.5, error_rate: 0.3, request_rate: 0.4, network_in: 0.2, network_out: 0.2 },
    request_rate: { cpu_usage: 0.75, latency_p95: 0.65, error_rate: 0.55, network_in: 0.8, network_out: 0.7, memory_usage: 0.4, disk_io: 0.3 },
    error_rate: { latency_p95: 0.7, cpu_usage: 0.4, memory_usage: 0.3, request_rate: 0.55, disk_io: 0.2, network_in: 0.1, network_out: 0.1 },
    latency_p95: { error_rate: 0.7, cpu_usage: 0.6, memory_usage: 0.5, request_rate: 0.65, disk_io: 0.4, network_in: 0.3, network_out: 0.3 },
    disk_io: { memory_usage: 0.7, cpu_usage: 0.5, latency_p95: 0.4, request_rate: 0.3, error_rate: 0.2, network_in: 0.2, network_out: 0.2 },
    network_in: { network_out: 0.9, request_rate: 0.8, cpu_usage: 0.3, memory_usage: 0.2, disk_io: 0.2, latency_p95: 0.3, error_rate: 0.1 },
    network_out: { network_in: 0.9, request_rate: 0.7, cpu_usage: 0.3, memory_usage: 0.2, disk_io: 0.2, latency_p95: 0.3, error_rate: 0.1 },
  };
  
  const correlation = correlations[metric1]?.[metric2] || correlations[metric2]?.[metric1] || 0.1;
  
  for (let i = 0; i < points; i++) {
    const baseX = Math.random() * 100;
    const noise = (1 - correlation) * (Math.random() - 0.5) * 100;
    const y = baseX * correlation + noise + (1 - correlation) * 50;
    data.push({ x: Math.max(0, Math.min(100, baseX)), y: Math.max(0, Math.min(100, y)) });
  }
  return { data, correlation };
}

function calculatePearsonCorrelation(data: { x: number; y: number }[]): number {
  const n = data.length;
  const sumX = data.reduce((s, p) => s + p.x, 0);
  const sumY = data.reduce((s, p) => s + p.y, 0);
  const sumXY = data.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = data.reduce((s, p) => s + p.x * p.x, 0);
  const sumY2 = data.reduce((s, p) => s + p.y * p.y, 0);
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  return denominator === 0 ? 0 : numerator / denominator;
}

function getCorrelationStrength(r: number): { label: string; color: string; icon: any } {
  const absR = Math.abs(r);
  if (absR >= 0.8) return { label: 'Very Strong', color: 'text-green-600', icon: CheckCircle };
  if (absR >= 0.6) return { label: 'Strong', color: 'text-blue-600', icon: TrendingUp };
  if (absR >= 0.4) return { label: 'Moderate', color: 'text-amber-600', icon: Activity };
  if (absR >= 0.2) return { label: 'Weak', color: 'text-orange-600', icon: TrendingDown };
  return { label: 'Very Weak', color: 'text-red-600', icon: AlertTriangle };
}

export default function Correlation() {
  const [metric1, setMetric1] = useState('cpu_usage');
  const [metric2, setMetric2] = useState('memory_usage');

  const { data: scatterData, correlation } = useMemo(() => generateCorrelatedData(metric1, metric2), [metric1, metric2]);
  const calculatedCorrelation = useMemo(() => calculatePearsonCorrelation(scatterData), [scatterData]);
  const strength = getCorrelationStrength(calculatedCorrelation);
  const StrengthIcon = strength.icon;

  const metric1Info = metrics.find(m => m.id === metric1);
  const metric2Info = metrics.find(m => m.id === metric2);

  const chartData = {
    datasets: [{
      label: `${metric1Info?.name} vs ${metric2Info?.name}`,
      data: scatterData,
      backgroundColor: calculatedCorrelation >= 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)',
      borderColor: calculatedCorrelation >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
      pointRadius: 6,
      pointHoverRadius: 8,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => `${metric1Info?.name}: ${ctx.raw.x.toFixed(1)}${metric1Info?.unit}, ${metric2Info?.name}: ${ctx.raw.y.toFixed(1)}${metric2Info?.unit}` } } },
    scales: { x: { title: { display: true, text: `${metric1Info?.name} (${metric1Info?.unit})` }, min: 0, max: 100 }, y: { title: { display: true, text: `${metric2Info?.name} (${metric2Info?.unit})` }, min: 0, max: 100 } },
  };

  // Generate correlation matrix
  const correlationMatrix = useMemo(() => {
    const matrix: { metric1: string; metric2: string; correlation: number }[] = [];
    for (let i = 0; i < metrics.length; i++) {
      for (let j = i + 1; j < metrics.length; j++) {
        const { data } = generateCorrelatedData(metrics[i].id, metrics[j].id, 30);
        matrix.push({ metric1: metrics[i].id, metric2: metrics[j].id, correlation: calculatePearsonCorrelation(data) });
      }
    }
    return matrix.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Correlation Analysis</h1>
          <p className="text-muted-foreground mt-1">Discover relationships between different metrics</p>
        </div>

        {/* Metric Selection */}
        <Card>
          <CardHeader><CardTitle>Compare Metrics</CardTitle><CardDescription>Select two metrics to analyze their correlation</CardDescription></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              <Select value={metric1} onValueChange={setMetric1}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>{metrics.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <Select value={metric2} onValueChange={setMetric2}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>{metrics.filter(m => m.id !== metric1).map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
              <div className="flex items-center gap-2 ml-auto">
                <StrengthIcon className={`h-5 w-5 ${strength.color}`} />
                <span className={`font-semibold ${strength.color}`}>{strength.label}</span>
                <Badge variant={calculatedCorrelation >= 0 ? 'default' : 'destructive'}>r = {calculatedCorrelation.toFixed(3)}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Scatter Plot */}
          <Card>
            <CardHeader>
              <CardTitle>Scatter Plot</CardTitle>
              <CardDescription>Visual representation of the relationship between selected metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Scatter data={chartData} options={chartOptions} />
              </div>
              <div className="mt-4 p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2">Interpretation</h4>
                <p className="text-sm text-muted-foreground">
                  {calculatedCorrelation >= 0.6 && `Strong positive correlation: As ${metric1Info?.name} increases, ${metric2Info?.name} tends to increase as well.`}
                  {calculatedCorrelation >= 0.2 && calculatedCorrelation < 0.6 && `Moderate positive correlation: There's a tendency for ${metric2Info?.name} to increase with ${metric1Info?.name}.`}
                  {calculatedCorrelation > -0.2 && calculatedCorrelation < 0.2 && `Weak or no correlation: ${metric1Info?.name} and ${metric2Info?.name} appear to be independent.`}
                  {calculatedCorrelation <= -0.2 && calculatedCorrelation > -0.6 && `Moderate negative correlation: As ${metric1Info?.name} increases, ${metric2Info?.name} tends to decrease.`}
                  {calculatedCorrelation <= -0.6 && `Strong negative correlation: ${metric2Info?.name} decreases significantly as ${metric1Info?.name} increases.`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Top Correlations */}
          <Card>
            <CardHeader>
              <CardTitle>Top Correlations</CardTitle>
              <CardDescription>Strongest relationships between all metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {correlationMatrix.slice(0, 8).map((item, idx) => {
                  const m1 = metrics.find(m => m.id === item.metric1);
                  const m2 = metrics.find(m => m.id === item.metric2);
                  const str = getCorrelationStrength(item.correlation);
                  const Icon = str.icon;
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => { setMetric1(item.metric1); setMetric2(item.metric2); }}>
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${str.color}`} />
                        <span className="font-medium">{m1?.name}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{m2?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${str.color}`}>{str.label}</span>
                        <Badge variant={item.correlation >= 0 ? 'outline' : 'destructive'} className="font-mono">{item.correlation.toFixed(3)}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Correlation Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-amber-500" />Correlation Insights</CardTitle>
            <CardDescription>AI-powered analysis of metric relationships</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">Strong Positive</h4>
                <p className="text-sm text-green-700 dark:text-green-400">CPU and Memory usage are highly correlated. Consider scaling both resources together for optimal performance.</p>
              </div>
              <div className="p-4 rounded-lg border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">Causal Relationship</h4>
                <p className="text-sm text-amber-700 dark:text-amber-400">High request rates correlate with increased latency. Consider implementing rate limiting or auto-scaling.</p>
              </div>
              <div className="p-4 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">Warning Pattern</h4>
                <p className="text-sm text-red-700 dark:text-red-400">Error rate increases with latency. This may indicate timeout issues or resource exhaustion under load.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

