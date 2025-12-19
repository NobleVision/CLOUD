import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap,
  Globe,
  Server,
  Search,
  ArrowUpDown,
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

interface APIEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  service: string;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  errorRate: number;
  requestsPerMin: number;
  slaTarget: number;
  slaStatus: 'compliant' | 'at_risk' | 'breached';
  trend: 'up' | 'down' | 'stable';
  lastError: string | null;
  lastErrorTime: Date | null;
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  endpoints: number;
  avgLatency: number;
  errorRate: number;
}

const apiEndpoints: APIEndpoint[] = [
  { id: '1', method: 'GET', path: '/api/v1/users', service: 'User Service', latencyP50: 45, latencyP95: 120, latencyP99: 280, errorRate: 0.02, requestsPerMin: 1250, slaTarget: 200, slaStatus: 'compliant', trend: 'stable', lastError: null, lastErrorTime: null },
  { id: '2', method: 'POST', path: '/api/v1/orders', service: 'Order Service', latencyP50: 85, latencyP95: 250, latencyP99: 520, errorRate: 0.15, requestsPerMin: 890, slaTarget: 300, slaStatus: 'at_risk', trend: 'up', lastError: 'Database connection timeout', lastErrorTime: new Date(Date.now() - 300000) },
  { id: '3', method: 'GET', path: '/api/v1/products', service: 'Product Catalog', latencyP50: 32, latencyP95: 78, latencyP99: 145, errorRate: 0.01, requestsPerMin: 2100, slaTarget: 150, slaStatus: 'compliant', trend: 'down', lastError: null, lastErrorTime: null },
  { id: '4', method: 'POST', path: '/api/v1/payments', service: 'Payment Gateway', latencyP50: 120, latencyP95: 380, latencyP99: 850, errorRate: 0.08, requestsPerMin: 450, slaTarget: 500, slaStatus: 'at_risk', trend: 'up', lastError: 'Payment provider timeout', lastErrorTime: new Date(Date.now() - 1800000) },
  { id: '5', method: 'GET', path: '/api/v1/inventory', service: 'Inventory Service', latencyP50: 55, latencyP95: 145, latencyP99: 320, errorRate: 0.03, requestsPerMin: 780, slaTarget: 200, slaStatus: 'compliant', trend: 'stable', lastError: null, lastErrorTime: null },
  { id: '6', method: 'PUT', path: '/api/v1/cart/:id', service: 'Cart Service', latencyP50: 42, latencyP95: 110, latencyP99: 240, errorRate: 0.05, requestsPerMin: 1650, slaTarget: 150, slaStatus: 'compliant', trend: 'down', lastError: null, lastErrorTime: null },
  { id: '7', method: 'DELETE', path: '/api/v1/sessions/:id', service: 'Auth Service', latencyP50: 28, latencyP95: 65, latencyP99: 120, errorRate: 0.01, requestsPerMin: 320, slaTarget: 100, slaStatus: 'compliant', trend: 'stable', lastError: null, lastErrorTime: null },
  { id: '8', method: 'POST', path: '/api/v1/notifications', service: 'Notification Service', latencyP50: 180, latencyP95: 520, latencyP99: 1200, errorRate: 0.25, requestsPerMin: 280, slaTarget: 400, slaStatus: 'breached', trend: 'up', lastError: 'Queue overflow - messages dropped', lastErrorTime: new Date(Date.now() - 60000) },
  { id: '9', method: 'GET', path: '/api/v1/search', service: 'Search Service', latencyP50: 95, latencyP95: 280, latencyP99: 620, errorRate: 0.04, requestsPerMin: 1100, slaTarget: 350, slaStatus: 'compliant', trend: 'stable', lastError: null, lastErrorTime: null },
  { id: '10', method: 'PATCH', path: '/api/v1/preferences', service: 'User Service', latencyP50: 38, latencyP95: 92, latencyP99: 185, errorRate: 0.02, requestsPerMin: 420, slaTarget: 150, slaStatus: 'compliant', trend: 'down', lastError: null, lastErrorTime: null },
];

const serviceHealth: ServiceHealth[] = [
  { name: 'User Service', status: 'healthy', uptime: 99.98, endpoints: 8, avgLatency: 42, errorRate: 0.02 },
  { name: 'Order Service', status: 'degraded', uptime: 99.85, endpoints: 12, avgLatency: 165, errorRate: 0.15 },
  { name: 'Product Catalog', status: 'healthy', uptime: 99.99, endpoints: 6, avgLatency: 35, errorRate: 0.01 },
  { name: 'Payment Gateway', status: 'degraded', uptime: 99.92, endpoints: 4, avgLatency: 250, errorRate: 0.08 },
  { name: 'Inventory Service', status: 'healthy', uptime: 99.96, endpoints: 5, avgLatency: 68, errorRate: 0.03 },
  { name: 'Cart Service', status: 'healthy', uptime: 99.97, endpoints: 7, avgLatency: 48, errorRate: 0.05 },
  { name: 'Auth Service', status: 'healthy', uptime: 99.99, endpoints: 10, avgLatency: 32, errorRate: 0.01 },
  { name: 'Notification Service', status: 'down', uptime: 98.50, endpoints: 3, avgLatency: 380, errorRate: 0.25 },
  { name: 'Search Service', status: 'healthy', uptime: 99.94, endpoints: 4, avgLatency: 125, errorRate: 0.04 },
];

const latencyTrendData = {
  labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
  datasets: [
    { label: 'P50 Latency', data: [45, 48, 52, 85, 72, 55, 48], borderColor: 'rgb(34, 197, 94)', backgroundColor: 'rgba(34, 197, 94, 0.1)', fill: true, tension: 0.4 },
    { label: 'P95 Latency', data: [120, 135, 160, 250, 210, 165, 140], borderColor: 'rgb(251, 191, 36)', backgroundColor: 'rgba(251, 191, 36, 0.1)', fill: true, tension: 0.4 },
    { label: 'P99 Latency', data: [280, 320, 380, 520, 450, 350, 310], borderColor: 'rgb(239, 68, 68)', backgroundColor: 'rgba(239, 68, 68, 0.1)', fill: true, tension: 0.4 },
  ],
};

const errorRateData = {
  labels: ['User', 'Order', 'Product', 'Payment', 'Inventory', 'Cart', 'Auth', 'Notif', 'Search'],
  datasets: [{
    label: 'Error Rate %',
    data: [0.02, 0.15, 0.01, 0.08, 0.03, 0.05, 0.01, 0.25, 0.04],
    backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(251, 191, 36, 0.8)', 'rgba(34, 197, 94, 0.8)', 'rgba(251, 191, 36, 0.8)', 'rgba(34, 197, 94, 0.8)', 'rgba(34, 197, 94, 0.8)', 'rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(34, 197, 94, 0.8)'],
  }],
};

const slaComplianceData = {
  labels: ['Compliant', 'At Risk', 'Breached'],
  datasets: [{
    data: [7, 2, 1],
    backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(251, 191, 36, 0.8)', 'rgba(239, 68, 68, 0.8)'],
    borderColor: ['rgb(34, 197, 94)', 'rgb(251, 191, 36)', 'rgb(239, 68, 68)'],
    borderWidth: 2,
  }],
};

const getMethodColor = (method: string) => {
  switch (method) {
    case 'GET': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'POST': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'PUT': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'PATCH': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
};

const getSLAStatusBadge = (status: string) => {
  switch (status) {
    case 'compliant': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"><CheckCircle className="h-3 w-3 mr-1" />Compliant</Badge>;
    case 'at_risk': return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"><AlertTriangle className="h-3 w-3 mr-1" />At Risk</Badge>;
    case 'breached': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"><XCircle className="h-3 w-3 mr-1" />Breached</Badge>;
    default: return null;
  }
};

const getServiceStatusBadge = (status: string) => {
  switch (status) {
    case 'healthy': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Healthy</Badge>;
    case 'degraded': return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Degraded</Badge>;
    case 'down': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Down</Badge>;
    default: return null;
  }
};

export default function APIHealthMonitor() {
  const [timeRange, setTimeRange] = useState('1h');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [sortBy, setSortBy] = useState<'latency' | 'errors' | 'requests'>('latency');

  const filteredEndpoints = apiEndpoints
    .filter(endpoint => {
      const matchesSearch = endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) || endpoint.service.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesService = selectedService === 'all' || endpoint.service === selectedService;
      return matchesSearch && matchesService;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'latency': return b.latencyP95 - a.latencyP95;
        case 'errors': return b.errorRate - a.errorRate;
        case 'requests': return b.requestsPerMin - a.requestsPerMin;
        default: return 0;
      }
    });

  const totalEndpoints = apiEndpoints.length;
  const compliantEndpoints = apiEndpoints.filter(e => e.slaStatus === 'compliant').length;
  const avgLatency = Math.round(apiEndpoints.reduce((sum, e) => sum + e.latencyP95, 0) / totalEndpoints);
  const totalRequests = apiEndpoints.reduce((sum, e) => sum + e.requestsPerMin, 0);
  const avgErrorRate = (apiEndpoints.reduce((sum, e) => sum + e.errorRate, 0) / totalEndpoints * 100).toFixed(2);
  const uniqueServices = Array.from(new Set(apiEndpoints.map(e => e.service)));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Globe className="h-8 w-8 text-blue-500" />
              API Health Monitor
            </h1>
            <p className="text-muted-foreground mt-1">Endpoint-level latency, error rates, and SLA tracking</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="15m">Last 15 min</SelectItem>
              <SelectItem value="1h">Last 1 hour</SelectItem>
              <SelectItem value="6h">Last 6 hours</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Server className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{totalEndpoints}</p><p className="text-xs text-muted-foreground">Total Endpoints</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><CheckCircle className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold text-green-600">{compliantEndpoints}/{totalEndpoints}</p><p className="text-xs text-muted-foreground">SLA Compliant</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Clock className="h-5 w-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{avgLatency}ms</p><p className="text-xs text-muted-foreground">Avg P95 Latency</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30"><Zap className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{totalRequests.toLocaleString()}</p><p className="text-xs text-muted-foreground">Requests/min</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30"><XCircle className="h-5 w-5 text-red-600" /></div><div><p className="text-2xl font-bold">{avgErrorRate}%</p><p className="text-xs text-muted-foreground">Avg Error Rate</p></div></div></CardContent></Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Latency Trends</CardTitle>
              <CardDescription>P50, P95, and P99 latency over time (ms)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Line data={latencyTrendData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Latency (ms)' } } } }} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>SLA Compliance</CardTitle><CardDescription>Endpoint compliance distribution</CardDescription></CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <Doughnut data={slaComplianceData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Error Rate by Service</CardTitle><CardDescription>Percentage of failed requests per service</CardDescription></CardHeader>
          <CardContent>
            <div className="h-48">
              <Bar data={errorRateData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Error Rate (%)' } } } }} />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="endpoints" className="space-y-4">
          <TabsList>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="services">Service Health</TabsTrigger>
          </TabsList>

          <TabsContent value="endpoints" className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search endpoints..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Filter by service" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {uniqueServices.map(service => (<SelectItem key={service} value={service}>{service}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'latency' | 'errors' | 'requests')}>
                <SelectTrigger className="w-40"><ArrowUpDown className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="latency">Sort by Latency</SelectItem>
                  <SelectItem value="errors">Sort by Errors</SelectItem>
                  <SelectItem value="requests">Sort by Traffic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Method</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead className="text-right">P50</TableHead>
                      <TableHead className="text-right">P95</TableHead>
                      <TableHead className="text-right">P99</TableHead>
                      <TableHead className="text-right">Error Rate</TableHead>
                      <TableHead className="text-right">Req/min</TableHead>
                      <TableHead>SLA Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEndpoints.map((endpoint) => (
                      <TableRow key={endpoint.id}>
                        <TableCell><Badge className={getMethodColor(endpoint.method)}>{endpoint.method}</Badge></TableCell>
                        <TableCell className="font-mono text-sm">{endpoint.path}</TableCell>
                        <TableCell>{endpoint.service}</TableCell>
                        <TableCell className="text-right">{endpoint.latencyP50}ms</TableCell>
                        <TableCell className="text-right"><span className={endpoint.latencyP95 > endpoint.slaTarget ? 'text-amber-600' : ''}>{endpoint.latencyP95}ms</span></TableCell>
                        <TableCell className="text-right"><span className={endpoint.latencyP99 > endpoint.slaTarget * 2 ? 'text-red-600' : ''}>{endpoint.latencyP99}ms</span></TableCell>
                        <TableCell className="text-right"><span className={endpoint.errorRate > 0.1 ? 'text-red-600' : endpoint.errorRate > 0.05 ? 'text-amber-600' : 'text-green-600'}>{(endpoint.errorRate * 100).toFixed(2)}%</span></TableCell>
                        <TableCell className="text-right">{endpoint.requestsPerMin.toLocaleString()}</TableCell>
                        <TableCell>{getSLAStatusBadge(endpoint.slaStatus)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {serviceHealth.map((service) => (
                <Card key={service.name}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      {getServiceStatusBadge(service.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Uptime</span>
                        <span className={service.uptime < 99.9 ? 'text-amber-600' : 'text-green-600'}>{service.uptime}%</span>
                      </div>
                      <Progress value={service.uptime} className="h-2" />
                      <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                        <div className="p-2 rounded-lg bg-muted/50">
                          <p className="text-lg font-semibold">{service.endpoints}</p>
                          <p className="text-xs text-muted-foreground">Endpoints</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <p className="text-lg font-semibold">{service.avgLatency}ms</p>
                          <p className="text-xs text-muted-foreground">Avg Latency</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <p className={`text-lg font-semibold ${service.errorRate > 0.1 ? 'text-red-600' : ''}`}>{(service.errorRate * 100).toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">Error Rate</p>
                        </div>
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
