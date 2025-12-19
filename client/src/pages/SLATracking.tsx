import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, AlertTriangle, Clock, TrendingUp, TrendingDown, Target, Shield, Activity, Calendar } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface SLAMetric {
  id: string;
  name: string;
  target: number;
  current: number;
  status: 'met' | 'at_risk' | 'breached';
  trend: 'up' | 'down' | 'stable';
  incidents: number;
  downtimeMinutes: number;
  lastIncident: Date | null;
}

interface Service {
  id: string;
  name: string;
  tier: 'platinum' | 'gold' | 'silver';
  slaMetrics: SLAMetric[];
}

const services: Service[] = [
  {
    id: '1', name: 'Payment Gateway', tier: 'platinum',
    slaMetrics: [
      { id: 'm1', name: 'Availability', target: 99.99, current: 99.97, status: 'at_risk', trend: 'down', incidents: 2, downtimeMinutes: 13, lastIncident: new Date(Date.now() - 86400000) },
      { id: 'm2', name: 'Response Time P95', target: 200, current: 185, status: 'met', trend: 'stable', incidents: 0, downtimeMinutes: 0, lastIncident: null },
      { id: 'm3', name: 'Error Rate', target: 0.1, current: 0.08, status: 'met', trend: 'up', incidents: 0, downtimeMinutes: 0, lastIncident: null },
    ],
  },
  {
    id: '2', name: 'User Authentication', tier: 'platinum',
    slaMetrics: [
      { id: 'm4', name: 'Availability', target: 99.99, current: 99.995, status: 'met', trend: 'up', incidents: 1, downtimeMinutes: 2, lastIncident: new Date(Date.now() - 604800000) },
      { id: 'm5', name: 'Response Time P95', target: 150, current: 142, status: 'met', trend: 'stable', incidents: 0, downtimeMinutes: 0, lastIncident: null },
    ],
  },
  {
    id: '3', name: 'Order Processing', tier: 'gold',
    slaMetrics: [
      { id: 'm6', name: 'Availability', target: 99.9, current: 99.85, status: 'at_risk', trend: 'down', incidents: 3, downtimeMinutes: 65, lastIncident: new Date(Date.now() - 172800000) },
      { id: 'm7', name: 'Response Time P95', target: 500, current: 520, status: 'breached', trend: 'down', incidents: 5, downtimeMinutes: 0, lastIncident: new Date(Date.now() - 3600000) },
    ],
  },
  {
    id: '4', name: 'Inventory Service', tier: 'silver',
    slaMetrics: [
      { id: 'm8', name: 'Availability', target: 99.5, current: 99.7, status: 'met', trend: 'up', incidents: 1, downtimeMinutes: 30, lastIncident: new Date(Date.now() - 1209600000) },
    ],
  },
  {
    id: '5', name: 'Reporting Dashboard', tier: 'silver',
    slaMetrics: [
      { id: 'm9', name: 'Availability', target: 99.5, current: 99.2, status: 'at_risk', trend: 'stable', incidents: 4, downtimeMinutes: 120, lastIncident: new Date(Date.now() - 259200000) },
    ],
  },
];

const uptimeHistory = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
  datasets: [
    { label: 'Uptime %', data: [99.98, 99.95, 99.99, 99.92, 99.97, 99.88, 99.94, 99.96], borderColor: 'rgb(34, 197, 94)', backgroundColor: 'rgba(34, 197, 94, 0.1)', fill: true, tension: 0.4 },
    { label: 'SLA Target', data: [99.9, 99.9, 99.9, 99.9, 99.9, 99.9, 99.9, 99.9], borderColor: 'rgb(239, 68, 68)', borderDash: [5, 5], pointRadius: 0 },
  ],
};

const incidentsByService = {
  labels: ['Payment Gateway', 'User Auth', 'Order Processing', 'Inventory', 'Reporting'],
  datasets: [{ label: 'Incidents', data: [2, 1, 8, 1, 4], backgroundColor: ['#3b82f6', '#22c55e', '#ef4444', '#22c55e', '#f59e0b'] }],
};

const getTierColor = (tier: string) => {
  switch (tier) { case 'platinum': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'; case 'gold': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'; default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'; }
};

const getStatusIcon = (status: string) => {
  switch (status) { case 'met': return <CheckCircle className="h-5 w-5 text-green-500" />; case 'at_risk': return <AlertTriangle className="h-5 w-5 text-amber-500" />; default: return <XCircle className="h-5 w-5 text-red-500" />; }
};

const getStatusColor = (status: string) => {
  switch (status) { case 'met': return 'text-green-600'; case 'at_risk': return 'text-amber-600'; default: return 'text-red-600'; }
};

export default function SLATracking() {
  const [timeRange, setTimeRange] = useState('30d');
  
  const allMetrics = services.flatMap(s => s.slaMetrics);
  const metCount = allMetrics.filter(m => m.status === 'met').length;
  const atRiskCount = allMetrics.filter(m => m.status === 'at_risk').length;
  const breachedCount = allMetrics.filter(m => m.status === 'breached').length;
  const overallCompliance = (metCount / allMetrics.length) * 100;
  const totalDowntime = allMetrics.reduce((sum, m) => sum + m.downtimeMinutes, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Shield className="h-8 w-8 text-blue-500" />SLA Tracking</h1>
            <p className="text-muted-foreground mt-1">Monitor service level agreements and compliance</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="7d">Last 7 days</SelectItem><SelectItem value="30d">Last 30 days</SelectItem><SelectItem value="90d">Last 90 days</SelectItem></SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Target className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{overallCompliance.toFixed(1)}%</p><p className="text-xs text-muted-foreground">Overall Compliance</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><CheckCircle className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold text-green-600">{metCount}</p><p className="text-xs text-muted-foreground">SLAs Met</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><AlertTriangle className="h-5 w-5 text-amber-600" /></div><div><p className="text-2xl font-bold text-amber-600">{atRiskCount}</p><p className="text-xs text-muted-foreground">At Risk</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30"><XCircle className="h-5 w-5 text-red-600" /></div><div><p className="text-2xl font-bold text-red-600">{breachedCount}</p><p className="text-xs text-muted-foreground">Breached</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30"><Clock className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{totalDowntime}m</p><p className="text-xs text-muted-foreground">Total Downtime</p></div></div></CardContent></Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Uptime History</CardTitle><CardDescription>Weekly uptime percentage vs SLA target</CardDescription></CardHeader>
            <CardContent><div className="h-64"><Line data={uptimeHistory} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { min: 99.5, max: 100 } } }} /></div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Incidents by Service</CardTitle><CardDescription>Number of SLA-impacting incidents</CardDescription></CardHeader>
            <CardContent><div className="h-64"><Bar data={incidentsByService} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div></CardContent>
          </Card>
        </div>

        {/* Service SLA Details */}
        <Card>
          <CardHeader><CardTitle>Service SLA Status</CardTitle><CardDescription>Detailed breakdown by service and metric</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-6">
              {services.map((service) => (
                <div key={service.id} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{service.name}</h3>
                      <Badge className={getTierColor(service.tier)}>{service.tier}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {service.slaMetrics.every(m => m.status === 'met') ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">All SLAs Met</Badge>
                      ) : service.slaMetrics.some(m => m.status === 'breached') ? (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">SLA Breached</Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">At Risk</Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {service.slaMetrics.map((metric) => (
                      <div key={metric.id} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{metric.name}</span>
                          {getStatusIcon(metric.status)}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                            {metric.name.includes('Time') ? `${metric.current}ms` : metric.name.includes('Rate') ? `${metric.current}%` : `${metric.current}%`}
                          </span>
                          {metric.trend === 'up' ? <TrendingUp className="h-4 w-4 text-green-500" /> : metric.trend === 'down' ? <TrendingDown className="h-4 w-4 text-red-500" /> : <Activity className="h-4 w-4 text-gray-500" />}
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex justify-between"><span>Target:</span><span>{metric.name.includes('Time') ? `${metric.target}ms` : `${metric.target}%`}</span></div>
                          <Progress value={(metric.current / metric.target) * 100} className="h-1" />
                          {metric.incidents > 0 && <div className="flex justify-between"><span>Incidents:</span><span>{metric.incidents}</span></div>}
                          {metric.downtimeMinutes > 0 && <div className="flex justify-between"><span>Downtime:</span><span>{metric.downtimeMinutes}m</span></div>}
                          {metric.lastIncident && <div className="flex justify-between"><span>Last incident:</span><span>{metric.lastIncident.toLocaleDateString()}</span></div>}
                        </div>
                      </div>
                    ))}
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

