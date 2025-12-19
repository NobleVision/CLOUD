import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Flame, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Play,
  Pause,
  Clock,
  Target,
  Shield,
  Zap,
  Timer,
  Activity,
  Server,
  Network,
  Database,
} from 'lucide-react';
import { Line, Bar, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, RadialLinearScale, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, RadialLinearScale, Title, Tooltip, Legend, Filler);

interface Experiment {
  id: string;
  name: string;
  type: 'latency' | 'error' | 'resource' | 'network';
  description: string;
  target: string;
  status: 'running' | 'completed' | 'scheduled' | 'failed';
  duration: number;
  startTime: Date | null;
  endTime: Date | null;
  impactRadius: 'single' | 'service' | 'zone';
  resilienceScore: number;
  recoveryTime: number | null;
}

interface ResilienceMetric {
  service: string;
  availability: number;
  latencyTolerance: number;
  errorTolerance: number;
  recoverySpeed: number;
  overallScore: number;
}

const experiments: Experiment[] = [
  { id: '1', name: 'API Latency Injection', type: 'latency', description: 'Inject 500ms latency to API Gateway', target: 'api-gateway-prod', status: 'completed', duration: 30, startTime: new Date(Date.now() - 3600000), endTime: new Date(Date.now() - 1800000), impactRadius: 'service', resilienceScore: 85, recoveryTime: 12 },
  { id: '2', name: 'Database Connection Failure', type: 'error', description: 'Simulate database connection failures', target: 'mysql-primary', status: 'completed', duration: 15, startTime: new Date(Date.now() - 86400000), endTime: new Date(Date.now() - 85500000), impactRadius: 'zone', resilienceScore: 72, recoveryTime: 45 },
  { id: '3', name: 'CPU Stress Test', type: 'resource', description: 'Consume 80% CPU on target nodes', target: 'worker-nodes', status: 'running', duration: 20, startTime: new Date(Date.now() - 600000), endTime: null, impactRadius: 'service', resilienceScore: 0, recoveryTime: null },
  { id: '4', name: 'Network Partition', type: 'network', description: 'Simulate network partition between zones', target: 'us-central1-a', status: 'scheduled', duration: 10, startTime: null, endTime: null, impactRadius: 'zone', resilienceScore: 0, recoveryTime: null },
  { id: '5', name: 'Memory Pressure', type: 'resource', description: 'Gradually increase memory usage to 90%', target: 'cache-nodes', status: 'completed', duration: 25, startTime: new Date(Date.now() - 172800000), endTime: new Date(Date.now() - 171300000), impactRadius: 'single', resilienceScore: 92, recoveryTime: 8 },
  { id: '6', name: 'Service Kill', type: 'error', description: 'Randomly kill service instances', target: 'order-service', status: 'completed', duration: 15, startTime: new Date(Date.now() - 259200000), endTime: new Date(Date.now() - 258300000), impactRadius: 'service', resilienceScore: 88, recoveryTime: 15 },
];

const resilienceMetrics: ResilienceMetric[] = [
  { service: 'API Gateway', availability: 95, latencyTolerance: 88, errorTolerance: 92, recoverySpeed: 90, overallScore: 91 },
  { service: 'Order Service', availability: 88, latencyTolerance: 82, errorTolerance: 78, recoverySpeed: 85, overallScore: 83 },
  { service: 'Payment Gateway', availability: 92, latencyTolerance: 75, errorTolerance: 88, recoverySpeed: 72, overallScore: 82 },
  { service: 'User Service', availability: 98, latencyTolerance: 95, errorTolerance: 96, recoverySpeed: 94, overallScore: 96 },
  { service: 'Cache Layer', availability: 90, latencyTolerance: 92, errorTolerance: 85, recoverySpeed: 88, overallScore: 89 },
];

const recoveryTrendData = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
  datasets: [
    { label: 'Avg Recovery Time (min)', data: [45, 38, 32, 28, 22, 18], borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.4 },
  ],
};

const experimentResultsData = {
  labels: ['Latency', 'Error', 'Resource', 'Network'],
  datasets: [
    { label: 'Passed', data: [8, 5, 6, 3], backgroundColor: 'rgba(34, 197, 94, 0.8)' },
    { label: 'Failed', data: [2, 3, 1, 2], backgroundColor: 'rgba(239, 68, 68, 0.8)' },
  ],
};

const radarData = {
  labels: ['Availability', 'Latency Tolerance', 'Error Tolerance', 'Recovery Speed', 'Fault Isolation'],
  datasets: [
    { label: 'API Gateway', data: [95, 88, 92, 90, 85], borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.2)' },
    { label: 'Order Service', data: [88, 82, 78, 85, 75], borderColor: 'rgb(239, 68, 68)', backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  ],
};

const getExperimentTypeIcon = (type: string) => {
  switch (type) {
    case 'latency': return <Clock className="h-4 w-4" />;
    case 'error': return <XCircle className="h-4 w-4" />;
    case 'resource': return <Server className="h-4 w-4" />;
    case 'network': return <Network className="h-4 w-4" />;
    default: return <Zap className="h-4 w-4" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'running': return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"><Activity className="h-3 w-3 mr-1 animate-pulse" />Running</Badge>;
    case 'completed': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
    case 'scheduled': return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>;
    case 'failed': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
    default: return null;
  }
};

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-600';
  if (score >= 75) return 'text-blue-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
};

export default function ChaosEngineering() {
  const [safetyMode, setSafetyMode] = useState(true);

  const completedExperiments = experiments.filter(e => e.status === 'completed').length;
  const runningExperiments = experiments.filter(e => e.status === 'running').length;
  const avgResilienceScore = Math.round(experiments.filter(e => e.resilienceScore > 0).reduce((sum, e) => sum + e.resilienceScore, 0) / experiments.filter(e => e.resilienceScore > 0).length);
  const avgRecoveryTime = Math.round(experiments.filter(e => e.recoveryTime !== null).reduce((sum, e) => sum + (e.recoveryTime || 0), 0) / experiments.filter(e => e.recoveryTime !== null).length);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Flame className="h-8 w-8 text-red-500" />
              Chaos Engineering Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Controlled failure injection with resilience scoring and recovery metrics</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Safety Mode</span>
              <Switch checked={safetyMode} onCheckedChange={setSafetyMode} />
            </div>
            <Button><Play className="h-4 w-4 mr-2" />New Experiment</Button>
          </div>
        </div>

        {!safetyMode && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Safety Mode is OFF - Experiments can affect production systems!</span>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30"><Zap className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{experiments.length}</p><p className="text-xs text-muted-foreground">Total Experiments</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Activity className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold text-blue-600">{runningExperiments}</p><p className="text-xs text-muted-foreground">Running Now</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><Shield className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold text-green-600">{avgResilienceScore}</p><p className="text-xs text-muted-foreground">Avg Resilience Score</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Timer className="h-5 w-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{avgRecoveryTime}m</p><p className="text-xs text-muted-foreground">Avg Recovery Time</p></div></div></CardContent></Card>
        </div>

        <Tabs defaultValue="experiments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="experiments">Experiments</TabsTrigger>
            <TabsTrigger value="resilience">Resilience Scores</TabsTrigger>
            <TabsTrigger value="metrics">Recovery Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="experiments" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {experiments.map((exp) => (
                <Card key={exp.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${exp.type === 'latency' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : exp.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : exp.type === 'resource' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'}`}>
                          {getExperimentTypeIcon(exp.type)}
                        </div>
                        <div>
                          <CardTitle className="text-base">{exp.name}</CardTitle>
                          <p className="text-xs text-muted-foreground capitalize">{exp.type}</p>
                        </div>
                      </div>
                      {getStatusBadge(exp.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{exp.description}</p>
                    <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Target</p>
                        <p className="font-mono text-xs truncate">{exp.target}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="font-medium">{exp.duration}m</p>
                      </div>
                    </div>
                    {exp.status === 'completed' && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground">Resilience</p>
                          <p className={`font-semibold ${getScoreColor(exp.resilienceScore)}`}>{exp.resilienceScore}/100</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground">Recovery</p>
                          <p className="font-semibold">{exp.recoveryTime}m</p>
                        </div>
                      </div>
                    )}
                    {exp.status === 'running' && (
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="sm" variant="outline"><Pause className="h-4 w-4 mr-1" />Pause</Button>
                        <Button size="sm" variant="destructive">Abort</Button>
                      </div>
                    )}
                    {exp.status === 'scheduled' && (
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="sm"><Play className="h-4 w-4 mr-1" />Start Now</Button>
                        <Button size="sm" variant="ghost">Cancel</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="resilience" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Resilience Comparison</CardTitle><CardDescription>Service resilience across dimensions</CardDescription></CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Radar data={radarData} options={{ responsive: true, maintainAspectRatio: false, scales: { r: { min: 0, max: 100 } } }} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Experiment Results</CardTitle><CardDescription>Pass/fail by experiment type</CardDescription></CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Bar data={experimentResultsData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, stacked: true }, x: { stacked: true } } }} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Service Resilience Scorecards</CardTitle><CardDescription>Detailed resilience metrics per service</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resilienceMetrics.map((metric) => (
                    <div key={metric.service} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{metric.service}</h4>
                        <div className={`text-2xl font-bold ${getScoreColor(metric.overallScore)}`}>{metric.overallScore}</div>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1"><span>Availability</span><span>{metric.availability}%</span></div>
                          <Progress value={metric.availability} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1"><span>Latency Tolerance</span><span>{metric.latencyTolerance}%</span></div>
                          <Progress value={metric.latencyTolerance} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1"><span>Error Tolerance</span><span>{metric.errorTolerance}%</span></div>
                          <Progress value={metric.errorTolerance} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1"><span>Recovery Speed</span><span>{metric.recoverySpeed}%</span></div>
                          <Progress value={metric.recoverySpeed} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Recovery Time Trend</CardTitle><CardDescription>Average recovery time improvement over weeks</CardDescription></CardHeader>
              <CardContent>
                <div className="h-64">
                  <Line data={recoveryTrendData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Minutes' } } } }} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
