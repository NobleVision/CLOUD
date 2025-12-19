import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Flame,
  FileText,
  BarChart3,
  Calendar,
  Users,
  AlertCircle,
  ArrowRight,
  Plus,
  Timer,
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
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

interface SLO {
  id: string;
  name: string;
  service: string;
  target: number;
  current: number;
  errorBudget: number;
  errorBudgetConsumed: number;
  burnRate: number;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface Incident {
  id: string;
  title: string;
  severity: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'resolved' | 'active' | 'postmortem_pending';
  service: string;
  startTime: Date;
  endTime: Date | null;
  ttd: number; // Time to detect (minutes)
  ttr: number; // Time to resolve (minutes)
  impactedUsers: number;
  hasPostmortem: boolean;
}

interface ReliabilityScorecard {
  service: string;
  availability: number;
  latencyP99: number;
  errorRate: number;
  incidentCount: number;
  mttr: number;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

const slos: SLO[] = [
  { id: '1', name: 'Availability SLO', service: 'Payment Gateway', target: 99.95, current: 99.92, errorBudget: 0.05, errorBudgetConsumed: 60, burnRate: 1.8, status: 'warning', trend: 'down' },
  { id: '2', name: 'Latency SLO (P99 < 500ms)', service: 'User Service', target: 99.9, current: 99.95, errorBudget: 0.1, errorBudgetConsumed: 25, burnRate: 0.8, status: 'healthy', trend: 'up' },
  { id: '3', name: 'Error Rate SLO', service: 'Order Service', target: 99.9, current: 99.75, errorBudget: 0.1, errorBudgetConsumed: 85, burnRate: 2.5, status: 'critical', trend: 'down' },
  { id: '4', name: 'Throughput SLO', service: 'Search Service', target: 99.5, current: 99.8, errorBudget: 0.5, errorBudgetConsumed: 15, burnRate: 0.5, status: 'healthy', trend: 'stable' },
  { id: '5', name: 'Availability SLO', service: 'Auth Service', target: 99.99, current: 99.995, errorBudget: 0.01, errorBudgetConsumed: 10, burnRate: 0.3, status: 'healthy', trend: 'up' },
  { id: '6', name: 'Latency SLO (P99 < 200ms)', service: 'Product Catalog', target: 99.9, current: 99.88, errorBudget: 0.1, errorBudgetConsumed: 45, burnRate: 1.2, status: 'warning', trend: 'stable' },
];

const incidents: Incident[] = [
  { id: '1', title: 'Payment Gateway Timeout Spike', severity: 'P1', status: 'resolved', service: 'Payment Gateway', startTime: new Date(Date.now() - 86400000), endTime: new Date(Date.now() - 82800000), ttd: 5, ttr: 60, impactedUsers: 15000, hasPostmortem: true },
  { id: '2', title: 'Database Connection Pool Exhausted', severity: 'P2', status: 'postmortem_pending', service: 'Order Service', startTime: new Date(Date.now() - 172800000), endTime: new Date(Date.now() - 169200000), ttd: 12, ttr: 60, impactedUsers: 8500, hasPostmortem: false },
  { id: '3', title: 'CDN Cache Invalidation Failure', severity: 'P3', status: 'resolved', service: 'Product Catalog', startTime: new Date(Date.now() - 259200000), endTime: new Date(Date.now() - 255600000), ttd: 8, ttr: 60, impactedUsers: 3200, hasPostmortem: true },
  { id: '4', title: 'Search Index Corruption', severity: 'P2', status: 'resolved', service: 'Search Service', startTime: new Date(Date.now() - 432000000), endTime: new Date(Date.now() - 421200000), ttd: 3, ttr: 180, impactedUsers: 12000, hasPostmortem: true },
  { id: '5', title: 'Memory Leak in Auth Service', severity: 'P3', status: 'postmortem_pending', service: 'Auth Service', startTime: new Date(Date.now() - 518400000), endTime: new Date(Date.now() - 514800000), ttd: 45, ttr: 60, impactedUsers: 2100, hasPostmortem: false },
];

const scorecards: ReliabilityScorecard[] = [
  { service: 'Auth Service', availability: 99.995, latencyP99: 45, errorRate: 0.01, incidentCount: 1, mttr: 25, score: 98, grade: 'A' },
  { service: 'User Service', availability: 99.95, latencyP99: 120, errorRate: 0.02, incidentCount: 2, mttr: 35, score: 92, grade: 'A' },
  { service: 'Product Catalog', availability: 99.88, latencyP99: 180, errorRate: 0.05, incidentCount: 3, mttr: 45, score: 85, grade: 'B' },
  { service: 'Search Service', availability: 99.8, latencyP99: 280, errorRate: 0.04, incidentCount: 2, mttr: 90, score: 78, grade: 'C' },
  { service: 'Order Service', availability: 99.75, latencyP99: 350, errorRate: 0.15, incidentCount: 5, mttr: 55, score: 68, grade: 'D' },
  { service: 'Payment Gateway', availability: 99.92, latencyP99: 420, errorRate: 0.08, incidentCount: 3, mttr: 40, score: 82, grade: 'B' },
];

const errorBudgetTrendData = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
  datasets: [
    { label: 'Payment Gateway', data: [100, 85, 72, 60], borderColor: 'rgb(239, 68, 68)', backgroundColor: 'rgba(239, 68, 68, 0.1)', fill: false, tension: 0.4 },
    { label: 'User Service', data: [100, 95, 80, 75], borderColor: 'rgb(34, 197, 94)', backgroundColor: 'rgba(34, 197, 94, 0.1)', fill: false, tension: 0.4 },
    { label: 'Order Service', data: [100, 70, 50, 15], borderColor: 'rgb(251, 191, 36)', backgroundColor: 'rgba(251, 191, 36, 0.1)', fill: false, tension: 0.4 },
  ],
};

const mttrTrendData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [{
    label: 'MTTR (minutes)',
    data: [85, 72, 65, 58, 52, 45],
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
  }],
};

const incidentDistributionData = {
  labels: ['P1', 'P2', 'P3', 'P4'],
  datasets: [{
    data: [2, 5, 8, 3],
    backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(251, 191, 36, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(156, 163, 175, 0.8)'],
    borderColor: ['rgb(239, 68, 68)', 'rgb(251, 191, 36)', 'rgb(59, 130, 246)', 'rgb(156, 163, 175)'],
    borderWidth: 2,
  }],
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'healthy': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"><CheckCircle className="h-3 w-3 mr-1" />Healthy</Badge>;
    case 'warning': return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"><AlertTriangle className="h-3 w-3 mr-1" />Warning</Badge>;
    case 'critical': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"><XCircle className="h-3 w-3 mr-1" />Critical</Badge>;
    default: return null;
  }
};

const getSeverityBadge = (severity: string) => {
  const colors: Record<string, string> = {
    'P1': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'P2': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    'P3': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'P4': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  };
  return <Badge className={colors[severity] || colors['P4']}>{severity}</Badge>;
};

const getIncidentStatusBadge = (status: string) => {
  switch (status) {
    case 'resolved': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Resolved</Badge>;
    case 'active': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Active</Badge>;
    case 'postmortem_pending': return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Postmortem Pending</Badge>;
    default: return null;
  }
};

const getGradeColor = (grade: string) => {
  switch (grade) {
    case 'A': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    case 'B': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    case 'C': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
    case 'D': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
    case 'F': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
  }
};

export default function SREWorkbench() {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);

  const healthySLOs = slos.filter(s => s.status === 'healthy').length;
  const warningSLOs = slos.filter(s => s.status === 'warning').length;
  const criticalSLOs = slos.filter(s => s.status === 'critical').length;
  const avgErrorBudgetConsumed = Math.round(slos.reduce((sum, s) => sum + s.errorBudgetConsumed, 0) / slos.length);
  const avgMTTR = Math.round(incidents.reduce((sum, i) => sum + i.ttr, 0) / incidents.length);
  const pendingPostmortems = incidents.filter(i => i.status === 'postmortem_pending').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Target className="h-8 w-8 text-purple-500" />
              SRE Workbench
            </h1>
            <p className="text-muted-foreground mt-1">Error budget tracking, incident postmortems, and reliability scorecards</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline"><Plus className="h-4 w-4 mr-2" />New Postmortem</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-6">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><CheckCircle className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold text-green-600">{healthySLOs}</p><p className="text-xs text-muted-foreground">Healthy SLOs</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><AlertTriangle className="h-5 w-5 text-amber-600" /></div><div><p className="text-2xl font-bold text-amber-600">{warningSLOs}</p><p className="text-xs text-muted-foreground">Warning</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30"><XCircle className="h-5 w-5 text-red-600" /></div><div><p className="text-2xl font-bold text-red-600">{criticalSLOs}</p><p className="text-xs text-muted-foreground">Critical</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30"><Flame className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{avgErrorBudgetConsumed}%</p><p className="text-xs text-muted-foreground">Avg Budget Used</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Timer className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{avgMTTR}m</p><p className="text-xs text-muted-foreground">Avg MTTR</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30"><FileText className="h-5 w-5 text-orange-600" /></div><div><p className="text-2xl font-bold text-orange-600">{pendingPostmortems}</p><p className="text-xs text-muted-foreground">Pending Postmortems</p></div></div></CardContent></Card>
        </div>

        <Tabs defaultValue="error-budgets" className="space-y-4">
          <TabsList>
            <TabsTrigger value="error-budgets">Error Budgets</TabsTrigger>
            <TabsTrigger value="incidents">Incidents & Postmortems</TabsTrigger>
            <TabsTrigger value="scorecards">Reliability Scorecards</TabsTrigger>
          </TabsList>

          <TabsContent value="error-budgets" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Error Budget Consumption Trend</CardTitle><CardDescription>Weekly error budget remaining by service</CardDescription></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Line data={errorBudgetTrendData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { min: 0, max: 100, title: { display: true, text: 'Budget Remaining (%)' } } } }} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Incident Distribution</CardTitle><CardDescription>Incidents by severity level</CardDescription></CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <Doughnut data={incidentDistributionData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>SLO Status</CardTitle><CardDescription>Current error budget status for all SLOs</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {slos.map((slo) => (
                    <div key={slo.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <h4 className="font-semibold">{slo.name}</h4>
                            <p className="text-sm text-muted-foreground">{slo.service}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(slo.status)}
                          <div className="text-right">
                            <p className="text-sm font-medium">Burn Rate: <span className={slo.burnRate > 2 ? 'text-red-600' : slo.burnRate > 1 ? 'text-amber-600' : 'text-green-600'}>{slo.burnRate}x</span></p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Target</p>
                          <p className="font-semibold">{slo.target}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Current</p>
                          <p className={`font-semibold ${slo.current < slo.target ? 'text-red-600' : 'text-green-600'}`}>{slo.current}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Error Budget</p>
                          <p className="font-semibold">{slo.errorBudget}%</p>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Error Budget Consumed</span>
                          <span className={slo.errorBudgetConsumed > 80 ? 'text-red-600' : slo.errorBudgetConsumed > 50 ? 'text-amber-600' : ''}>{slo.errorBudgetConsumed}%</span>
                        </div>
                        <Progress value={slo.errorBudgetConsumed} className={`h-2 ${slo.errorBudgetConsumed > 80 ? '[&>div]:bg-red-500' : slo.errorBudgetConsumed > 50 ? '[&>div]:bg-amber-500' : ''}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incidents" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>MTTR Trend</CardTitle><CardDescription>Mean Time to Recovery over the past 6 months</CardDescription></CardHeader>
              <CardContent>
                <div className="h-48">
                  <Bar data={mttrTrendData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Minutes' } } } }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Recent Incidents</CardTitle><CardDescription>Incidents requiring postmortems and resolution details</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {incidents.map((incident) => (
                    <div key={incident.id} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedIncident(selectedIncident === incident.id ? null : incident.id)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getSeverityBadge(incident.severity)}
                          <div>
                            <h4 className="font-semibold">{incident.title}</h4>
                            <p className="text-sm text-muted-foreground">{incident.service} • {incident.startTime.toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getIncidentStatusBadge(incident.status)}
                          <ArrowRight className={`h-4 w-4 transition-transform ${selectedIncident === incident.id ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                      {selectedIncident === incident.id && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="grid grid-cols-4 gap-4 mb-4">
                            <div className="text-center p-2 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground">TTD</p>
                              <p className="font-semibold">{incident.ttd}m</p>
                            </div>
                            <div className="text-center p-2 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground">TTR</p>
                              <p className="font-semibold">{incident.ttr}m</p>
                            </div>
                            <div className="text-center p-2 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground">Impacted Users</p>
                              <p className="font-semibold">{incident.impactedUsers.toLocaleString()}</p>
                            </div>
                            <div className="text-center p-2 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground">Duration</p>
                              <p className="font-semibold">{incident.endTime ? Math.round((incident.endTime.getTime() - incident.startTime.getTime()) / 60000) : 'Ongoing'}m</p>
                            </div>
                          </div>
                          {!incident.hasPostmortem && (
                            <div className="flex items-center gap-2">
                              <Button size="sm"><FileText className="h-4 w-4 mr-2" />Create Postmortem</Button>
                            </div>
                          )}
                          {incident.hasPostmortem && (
                            <Button variant="outline" size="sm"><FileText className="h-4 w-4 mr-2" />View Postmortem</Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scorecards" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {scorecards.map((scorecard) => (
                <Card key={scorecard.service}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{scorecard.service}</CardTitle>
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold ${getGradeColor(scorecard.grade)}`}>
                        {scorecard.grade}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Overall Score</span>
                        <span className="font-semibold">{scorecard.score}/100</span>
                      </div>
                      <Progress value={scorecard.score} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Availability</p>
                        <p className="font-semibold">{scorecard.availability}%</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Latency P99</p>
                        <p className="font-semibold">{scorecard.latencyP99}ms</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Error Rate</p>
                        <p className={`font-semibold ${scorecard.errorRate > 0.1 ? 'text-red-600' : ''}`}>{scorecard.errorRate}%</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">MTTR</p>
                        <p className="font-semibold">{scorecard.mttr}m</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50 col-span-2">
                        <p className="text-xs text-muted-foreground">Incidents (30d)</p>
                        <p className={`font-semibold ${scorecard.incidentCount > 3 ? 'text-amber-600' : ''}`}>{scorecard.incidentCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
