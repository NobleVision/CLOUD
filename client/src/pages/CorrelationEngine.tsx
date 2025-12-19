import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Network, 
  AlertTriangle, 
  GitBranch,
  Search,
  Clock,
  Activity,
  Zap,
  Link2,
  Server,
  Database,
  Cloud,
  ArrowRight,
  Eye,
  Filter,
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface Anomaly {
  id: string;
  service: string;
  type: 'latency' | 'error_rate' | 'throughput' | 'saturation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  value: number;
  baseline: number;
  deviation: number;
  timestamp: Date;
  correlated: string[];
}

interface ServiceNode {
  id: string;
  name: string;
  type: 'service' | 'database' | 'cache' | 'external';
  status: 'healthy' | 'degraded' | 'unhealthy';
  anomalyCount: number;
}

interface CorrelationCluster {
  id: string;
  rootCause: string;
  confidence: number;
  affectedServices: string[];
  anomalies: number;
  impact: 'low' | 'medium' | 'high';
  timestamp: Date;
  status: 'investigating' | 'confirmed' | 'resolved';
}

const anomalies: Anomaly[] = [
  { id: '1', service: 'API Gateway', type: 'latency', severity: 'high', value: 850, baseline: 120, deviation: 608, timestamp: new Date(Date.now() - 300000), correlated: ['Order Service', 'Database Primary'] },
  { id: '2', service: 'Order Service', type: 'error_rate', severity: 'critical', value: 15.2, baseline: 0.5, deviation: 2940, timestamp: new Date(Date.now() - 360000), correlated: ['Database Primary', 'Payment Gateway'] },
  { id: '3', service: 'Database Primary', type: 'saturation', severity: 'high', value: 95, baseline: 45, deviation: 111, timestamp: new Date(Date.now() - 240000), correlated: ['Order Service', 'User Service'] },
  { id: '4', service: 'Payment Gateway', type: 'latency', severity: 'medium', value: 450, baseline: 200, deviation: 125, timestamp: new Date(Date.now() - 600000), correlated: ['Order Service'] },
  { id: '5', service: 'Cache Layer', type: 'throughput', severity: 'low', value: 25000, baseline: 45000, deviation: -44, timestamp: new Date(Date.now() - 900000), correlated: ['API Gateway'] },
  { id: '6', service: 'User Service', type: 'latency', severity: 'medium', value: 280, baseline: 80, deviation: 250, timestamp: new Date(Date.now() - 420000), correlated: ['Database Primary', 'Cache Layer'] },
];

const serviceNodes: ServiceNode[] = [
  { id: '1', name: 'API Gateway', type: 'service', status: 'degraded', anomalyCount: 1 },
  { id: '2', name: 'Order Service', type: 'service', status: 'unhealthy', anomalyCount: 2 },
  { id: '3', name: 'User Service', type: 'service', status: 'degraded', anomalyCount: 1 },
  { id: '4', name: 'Payment Gateway', type: 'service', status: 'degraded', anomalyCount: 1 },
  { id: '5', name: 'Database Primary', type: 'database', status: 'unhealthy', anomalyCount: 2 },
  { id: '6', name: 'Cache Layer', type: 'cache', status: 'healthy', anomalyCount: 1 },
  { id: '7', name: 'Search Service', type: 'service', status: 'healthy', anomalyCount: 0 },
  { id: '8', name: 'Analytics', type: 'external', status: 'healthy', anomalyCount: 0 },
];

const correlationClusters: CorrelationCluster[] = [
  { id: '1', rootCause: 'Database Connection Pool Exhaustion', confidence: 92, affectedServices: ['Database Primary', 'Order Service', 'User Service', 'API Gateway'], anomalies: 4, impact: 'high', timestamp: new Date(Date.now() - 300000), status: 'investigating' },
  { id: '2', rootCause: 'Memory Pressure on Cache Nodes', confidence: 78, affectedServices: ['Cache Layer', 'API Gateway', 'User Service'], anomalies: 2, impact: 'medium', timestamp: new Date(Date.now() - 1200000), status: 'confirmed' },
  { id: '3', rootCause: 'Network Latency to Payment Provider', confidence: 65, affectedServices: ['Payment Gateway', 'Order Service'], anomalies: 2, impact: 'medium', timestamp: new Date(Date.now() - 3600000), status: 'resolved' },
];

const anomalyTrendData = {
  labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00'],
  datasets: [
    { label: 'Anomalies Detected', data: [2, 1, 3, 2, 8, 12, 6], borderColor: 'rgb(239, 68, 68)', backgroundColor: 'rgba(239, 68, 68, 0.1)', fill: true, tension: 0.4 },
    { label: 'Correlated', data: [1, 1, 2, 1, 5, 9, 4], borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.4 },
  ],
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'service': return <Server className="h-4 w-4" />;
    case 'database': return <Database className="h-4 w-4" />;
    case 'cache': return <Zap className="h-4 w-4" />;
    case 'external': return <Cloud className="h-4 w-4" />;
    default: return <Server className="h-4 w-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy': return 'bg-green-500';
    case 'degraded': return 'bg-amber-500';
    case 'unhealthy': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'low': return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Low</Badge>;
    case 'medium': return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Medium</Badge>;
    case 'high': return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">High</Badge>;
    case 'critical': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Critical</Badge>;
    default: return null;
  }
};

const getImpactBadge = (impact: string) => {
  switch (impact) {
    case 'low': return <Badge variant="outline" className="text-green-600 border-green-600">Low Impact</Badge>;
    case 'medium': return <Badge variant="outline" className="text-amber-600 border-amber-600">Medium Impact</Badge>;
    case 'high': return <Badge variant="outline" className="text-red-600 border-red-600">High Impact</Badge>;
    default: return null;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'investigating': return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"><Activity className="h-3 w-3 mr-1 animate-pulse" />Investigating</Badge>;
    case 'confirmed': return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Confirmed</Badge>;
    case 'resolved': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Resolved</Badge>;
    default: return null;
  }
};

export default function CorrelationEngine() {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('1h');

  const filteredAnomalies = anomalies.filter(anomaly => {
    const matchesSearch = anomaly.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || anomaly.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const totalAnomalies = anomalies.length;
  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical' || a.severity === 'high').length;
  const correlatedClusters = correlationClusters.filter(c => c.status !== 'resolved').length;
  const avgConfidence = Math.round(correlationClusters.reduce((sum, c) => sum + c.confidence, 0) / correlationClusters.length);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <GitBranch className="h-8 w-8 text-purple-500" />
              Intelligent Correlation Engine
            </h1>
            <p className="text-muted-foreground mt-1">Cross-service anomaly correlation using graph-based dependency analysis</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32"><Clock className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15m">Last 15m</SelectItem>
                <SelectItem value="1h">Last 1h</SelectItem>
                <SelectItem value="6h">Last 6h</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30"><AlertTriangle className="h-5 w-5 text-red-600" /></div><div><p className="text-2xl font-bold text-red-600">{totalAnomalies}</p><p className="text-xs text-muted-foreground">Active Anomalies</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30"><Zap className="h-5 w-5 text-orange-600" /></div><div><p className="text-2xl font-bold text-orange-600">{criticalAnomalies}</p><p className="text-xs text-muted-foreground">High/Critical</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30"><Link2 className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold text-purple-600">{correlatedClusters}</p><p className="text-xs text-muted-foreground">Correlation Clusters</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Activity className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{avgConfidence}%</p><p className="text-xs text-muted-foreground">Avg Confidence</p></div></div></CardContent></Card>
        </div>

        <Tabs defaultValue="clusters" className="space-y-4">
          <TabsList>
            <TabsTrigger value="clusters">Correlation Clusters</TabsTrigger>
            <TabsTrigger value="anomalies">Anomaly Feed</TabsTrigger>
            <TabsTrigger value="topology">Service Topology</TabsTrigger>
          </TabsList>

          <TabsContent value="clusters" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Anomaly Trend</CardTitle><CardDescription>Anomalies detected vs correlated over time</CardDescription></CardHeader>
              <CardContent>
                <div className="h-48">
                  <Line data={anomalyTrendData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }} />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {correlationClusters.map((cluster) => (
                <Card key={cluster.id} className={cluster.status === 'investigating' ? 'border-blue-500' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${cluster.impact === 'high' ? 'bg-red-100 dark:bg-red-900/30' : cluster.impact === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                          <Network className={`h-5 w-5 ${cluster.impact === 'high' ? 'text-red-600' : cluster.impact === 'medium' ? 'text-amber-600' : 'text-green-600'}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{cluster.rootCause}</CardTitle>
                          <p className="text-sm text-muted-foreground">{cluster.timestamp.toLocaleTimeString()} - {cluster.anomalies} anomalies correlated</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getImpactBadge(cluster.impact)}
                        {getStatusBadge(cluster.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Confidence Score</span>
                        <span className="font-semibold">{cluster.confidence}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${cluster.confidence >= 80 ? 'bg-green-500' : cluster.confidence >= 60 ? 'bg-amber-500' : 'bg-gray-500'}`} style={{ width: `${cluster.confidence}%` }} />
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Affected Services</p>
                      <div className="flex flex-wrap gap-2">
                        {cluster.affectedServices.map((service, i) => (
                          <span key={i}>
                            <Badge variant="outline">{service}</Badge>
                            {i < cluster.affectedServices.length - 1 && <ArrowRight className="inline h-3 w-3 mx-1 text-muted-foreground" />}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm"><Eye className="h-4 w-4 mr-2" />View Details</Button>
                      {cluster.status === 'investigating' && <Button size="sm" variant="outline">Acknowledge</Button>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="anomalies" className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search services..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-40"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="All Severity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {filteredAnomalies.map((anomaly) => (
                <Card key={anomaly.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${anomaly.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : anomaly.severity === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' : anomaly.severity === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'}`}>
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold">{anomaly.service}</p>
                          <p className="text-sm text-muted-foreground capitalize">{anomaly.type.replace('_', ' ')} anomaly</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(anomaly.severity)}
                        <span className="text-xs text-muted-foreground">{anomaly.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Current</p>
                        <p className="font-semibold">{anomaly.value}{anomaly.type === 'error_rate' ? '%' : anomaly.type === 'saturation' ? '%' : 'ms'}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Baseline</p>
                        <p className="font-semibold">{anomaly.baseline}{anomaly.type === 'error_rate' ? '%' : anomaly.type === 'saturation' ? '%' : 'ms'}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Deviation</p>
                        <p className={`font-semibold ${anomaly.deviation > 0 ? 'text-red-600' : 'text-green-600'}`}>{anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation}%</p>
                      </div>
                    </div>
                    {anomaly.correlated.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Link2 className="h-4 w-4 text-purple-500" />
                        <span className="text-muted-foreground">Correlated with:</span>
                        {anomaly.correlated.map((service, i) => (
                          <Badge key={i} variant="outline" className="text-purple-600">{service}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="topology" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Service Dependency Graph</CardTitle><CardDescription>Real-time health status and anomaly propagation</CardDescription></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  {serviceNodes.map((node) => (
                    <Card key={node.id} className={node.status === 'unhealthy' ? 'border-red-500' : node.status === 'degraded' ? 'border-amber-500' : ''}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${node.status === 'unhealthy' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : node.status === 'degraded' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-green-100 dark:bg-green-900/30 text-green-600'}`}>
                            {getTypeIcon(node.type)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{node.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{node.type}</p>
                          </div>
                          <div className={`h-3 w-3 rounded-full ${getStatusColor(node.status)}`} />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Anomalies</span>
                          <span className={node.anomalyCount > 0 ? 'text-red-600 font-semibold' : ''}>{node.anomalyCount}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
