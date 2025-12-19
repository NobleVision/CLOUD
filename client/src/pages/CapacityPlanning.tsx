import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Zap,
  Server,
  AlertCircle,
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface ResourceForecast {
  id: string;
  resourceType: 'cpu' | 'memory' | 'storage' | 'network';
  service: string;
  currentUsage: number;
  currentCapacity: number;
  predictedUsage30d: number;
  predictedUsage60d: number;
  predictedUsage90d: number;
  growthRate: number;
  daysToCapacity: number | null;
  status: 'healthy' | 'warning' | 'critical';
  recommendation: string;
}

interface ScalingRecommendation {
  id: string;
  service: string;
  resourceType: string;
  action: 'scale_up' | 'scale_out' | 'optimize' | 'no_action';
  urgency: 'immediate' | 'soon' | 'planned';
  currentValue: string;
  recommendedValue: string;
  estimatedCostImpact: number;
  reason: string;
}

const resourceForecasts: ResourceForecast[] = [
  { id: '1', resourceType: 'cpu', service: 'Payment Gateway', currentUsage: 72, currentCapacity: 100, predictedUsage30d: 85, predictedUsage60d: 92, predictedUsage90d: 105, growthRate: 12, daysToCapacity: 45, status: 'warning', recommendation: 'Scale up CPU cores from 8 to 12 within 30 days' },
  { id: '2', resourceType: 'memory', service: 'Order Service', currentUsage: 85, currentCapacity: 100, predictedUsage30d: 95, predictedUsage60d: 110, predictedUsage90d: 125, growthRate: 18, daysToCapacity: 21, status: 'critical', recommendation: 'Immediate memory upgrade required - increase from 32GB to 64GB' },
  { id: '3', resourceType: 'storage', service: 'Data Warehouse', currentUsage: 68, currentCapacity: 100, predictedUsage30d: 72, predictedUsage60d: 76, predictedUsage90d: 80, growthRate: 5, daysToCapacity: 180, status: 'healthy', recommendation: 'No immediate action needed. Plan storage expansion for Q3' },
  { id: '4', resourceType: 'network', service: 'CDN Edge', currentUsage: 45, currentCapacity: 100, predictedUsage30d: 52, predictedUsage60d: 58, predictedUsage90d: 65, growthRate: 8, daysToCapacity: null, status: 'healthy', recommendation: 'Current capacity sufficient for projected growth' },
  { id: '5', resourceType: 'cpu', service: 'Search Service', currentUsage: 58, currentCapacity: 100, predictedUsage30d: 65, predictedUsage60d: 72, predictedUsage90d: 78, growthRate: 10, daysToCapacity: 120, status: 'healthy', recommendation: 'Monitor growth rate. Consider horizontal scaling in 60 days' },
  { id: '6', resourceType: 'memory', service: 'Cache Layer', currentUsage: 78, currentCapacity: 100, predictedUsage30d: 88, predictedUsage60d: 98, predictedUsage90d: 108, growthRate: 15, daysToCapacity: 35, status: 'warning', recommendation: 'Plan memory expansion within 30 days to avoid cache eviction issues' },
  { id: '7', resourceType: 'storage', service: 'Log Aggregator', currentUsage: 82, currentCapacity: 100, predictedUsage30d: 90, predictedUsage60d: 98, predictedUsage90d: 106, growthRate: 12, daysToCapacity: 42, status: 'warning', recommendation: 'Increase log retention storage or implement log rotation policy' },
  { id: '8', resourceType: 'cpu', service: 'Auth Service', currentUsage: 35, currentCapacity: 100, predictedUsage30d: 38, predictedUsage60d: 42, predictedUsage90d: 45, growthRate: 4, daysToCapacity: null, status: 'healthy', recommendation: 'Significant headroom available. Consider rightsizing to reduce costs' },
];

const scalingRecommendations: ScalingRecommendation[] = [
  { id: '1', service: 'Order Service', resourceType: 'Memory', action: 'scale_up', urgency: 'immediate', currentValue: '32 GB', recommendedValue: '64 GB', estimatedCostImpact: 450, reason: 'Memory usage at 85% with 18% monthly growth. Will exceed capacity in 21 days.' },
  { id: '2', service: 'Payment Gateway', resourceType: 'CPU', action: 'scale_up', urgency: 'soon', currentValue: '8 cores', recommendedValue: '12 cores', estimatedCostImpact: 320, reason: 'CPU consistently above 70%. Peak usage approaching capacity limits.' },
  { id: '3', service: 'Log Aggregator', resourceType: 'Storage', action: 'scale_out', urgency: 'soon', currentValue: '2 TB', recommendedValue: '4 TB', estimatedCostImpact: 180, reason: 'Storage growing at 12% monthly. Current capacity insufficient for 90-day retention.' },
  { id: '4', service: 'Cache Layer', resourceType: 'Memory', action: 'scale_up', urgency: 'planned', currentValue: '16 GB', recommendedValue: '32 GB', estimatedCostImpact: 200, reason: 'Cache hit ratio declining due to memory pressure. Plan upgrade within 30 days.' },
  { id: '5', service: 'Auth Service', resourceType: 'CPU', action: 'optimize', urgency: 'planned', currentValue: '8 cores', recommendedValue: '4 cores', estimatedCostImpact: -160, reason: 'Resource over-provisioned. Consider rightsizing to reduce costs.' },
];

const cpuForecastData = {
  labels: ['Now', 'Week 2', 'Week 4', 'Week 6', 'Week 8', 'Week 10', 'Week 12'],
  datasets: [
    { label: 'Payment Gateway', data: [72, 76, 80, 85, 89, 93, 97], borderColor: 'rgb(239, 68, 68)', backgroundColor: 'rgba(239, 68, 68, 0.1)', fill: false, tension: 0.4 },
    { label: 'Search Service', data: [58, 61, 64, 67, 70, 73, 76], borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: false, tension: 0.4 },
    { label: 'Auth Service', data: [35, 36, 38, 39, 41, 42, 44], borderColor: 'rgb(34, 197, 94)', backgroundColor: 'rgba(34, 197, 94, 0.1)', fill: false, tension: 0.4 },
    { label: 'Capacity Threshold', data: [80, 80, 80, 80, 80, 80, 80], borderColor: 'rgb(156, 163, 175)', borderDash: [5, 5], pointRadius: 0 },
  ],
};

const memoryForecastData = {
  labels: ['Now', 'Week 2', 'Week 4', 'Week 6', 'Week 8', 'Week 10', 'Week 12'],
  datasets: [
    { label: 'Order Service', data: [85, 89, 94, 99, 104, 109, 114], borderColor: 'rgb(239, 68, 68)', backgroundColor: 'rgba(239, 68, 68, 0.1)', fill: false, tension: 0.4 },
    { label: 'Cache Layer', data: [78, 82, 86, 90, 94, 98, 102], borderColor: 'rgb(251, 191, 36)', backgroundColor: 'rgba(251, 191, 36, 0.1)', fill: false, tension: 0.4 },
    { label: 'Capacity Threshold', data: [100, 100, 100, 100, 100, 100, 100], borderColor: 'rgb(156, 163, 175)', borderDash: [5, 5], pointRadius: 0 },
  ],
};

const growthRateData = {
  labels: ['Payment', 'Order', 'Search', 'Cache', 'Auth', 'Log Agg', 'CDN', 'DW'],
  datasets: [{
    label: 'Monthly Growth Rate (%)',
    data: [12, 18, 10, 15, 4, 12, 8, 5],
    backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(251, 191, 36, 0.8)', 'rgba(34, 197, 94, 0.8)', 'rgba(251, 191, 36, 0.8)', 'rgba(34, 197, 94, 0.8)', 'rgba(34, 197, 94, 0.8)'],
  }],
};

const getResourceIcon = (type: string) => {
  switch (type) {
    case 'cpu': return <Cpu className="h-5 w-5" />;
    case 'memory': return <MemoryStick className="h-5 w-5" />;
    case 'storage': return <HardDrive className="h-5 w-5" />;
    case 'network': return <Network className="h-5 w-5" />;
    default: return <Server className="h-5 w-5" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'healthy': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"><CheckCircle className="h-3 w-3 mr-1" />Healthy</Badge>;
    case 'warning': return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"><AlertTriangle className="h-3 w-3 mr-1" />Warning</Badge>;
    case 'critical': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"><XCircle className="h-3 w-3 mr-1" />Critical</Badge>;
    default: return null;
  }
};

const getUrgencyBadge = (urgency: string) => {
  switch (urgency) {
    case 'immediate': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Immediate</Badge>;
    case 'soon': return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Soon (30d)</Badge>;
    case 'planned': return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Planned</Badge>;
    default: return null;
  }
};

const getActionBadge = (action: string) => {
  switch (action) {
    case 'scale_up': return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"><ArrowUpRight className="h-3 w-3 mr-1" />Scale Up</Badge>;
    case 'scale_out': return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"><ArrowUpRight className="h-3 w-3 mr-1" />Scale Out</Badge>;
    case 'optimize': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"><ArrowDownRight className="h-3 w-3 mr-1" />Optimize</Badge>;
    default: return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">No Action</Badge>;
  }
};

export default function CapacityPlanning() {
  const [timeHorizon, setTimeHorizon] = useState('90d');
  const [resourceFilter, setResourceFilter] = useState('all');

  const criticalResources = resourceForecasts.filter(r => r.status === 'critical').length;
  const warningResources = resourceForecasts.filter(r => r.status === 'warning').length;
  const immediatActions = scalingRecommendations.filter(r => r.urgency === 'immediate').length;
  const totalCostImpact = scalingRecommendations.reduce((sum, r) => sum + r.estimatedCostImpact, 0);

  const filteredForecasts = resourceForecasts.filter(r => resourceFilter === 'all' || r.resourceType === resourceFilter);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-green-500" />
              Capacity Planning Forecaster
            </h1>
            <p className="text-muted-foreground mt-1">ML-based resource usage predictions with proactive scaling recommendations</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeHorizon} onValueChange={setTimeHorizon}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">30-day forecast</SelectItem>
                <SelectItem value="60d">60-day forecast</SelectItem>
                <SelectItem value="90d">90-day forecast</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Critical Alerts */}
        {criticalResources > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Critical Capacity Alert</AlertTitle>
            <AlertDescription>
              {criticalResources} resource(s) predicted to exceed capacity within 30 days. Immediate action required.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30"><XCircle className="h-5 w-5 text-red-600" /></div><div><p className="text-2xl font-bold text-red-600">{criticalResources}</p><p className="text-xs text-muted-foreground">Critical Resources</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><AlertTriangle className="h-5 w-5 text-amber-600" /></div><div><p className="text-2xl font-bold text-amber-600">{warningResources}</p><p className="text-xs text-muted-foreground">Warning Resources</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30"><Zap className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{immediatActions}</p><p className="text-xs text-muted-foreground">Immediate Actions</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Calendar className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">${Math.abs(totalCostImpact)}</p><p className="text-xs text-muted-foreground">Est. Monthly Impact</p></div></div></CardContent></Card>
        </div>

        <Tabs defaultValue="forecasts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="forecasts">Resource Forecasts</TabsTrigger>
            <TabsTrigger value="recommendations">Scaling Recommendations</TabsTrigger>
            <TabsTrigger value="trends">Growth Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="forecasts" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>CPU Usage Forecast</CardTitle><CardDescription>Projected CPU utilization over 12 weeks</CardDescription></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Line data={cpuForecastData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { min: 0, max: 120, title: { display: true, text: 'Utilization (%)' } } } }} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Memory Usage Forecast</CardTitle><CardDescription>Projected memory utilization over 12 weeks</CardDescription></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Line data={memoryForecastData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { min: 0, max: 130, title: { display: true, text: 'Utilization (%)' } } } }} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div><CardTitle>Resource Capacity Overview</CardTitle><CardDescription>Current usage and predictions by service</CardDescription></div>
                  <Select value={resourceFilter} onValueChange={setResourceFilter}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Resources</SelectItem>
                      <SelectItem value="cpu">CPU</SelectItem>
                      <SelectItem value="memory">Memory</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                      <SelectItem value="network">Network</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredForecasts.map((forecast) => (
                    <div key={forecast.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${forecast.status === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : forecast.status === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-green-100 dark:bg-green-900/30 text-green-600'}`}>
                            {getResourceIcon(forecast.resourceType)}
                          </div>
                          <div>
                            <h4 className="font-semibold">{forecast.service}</h4>
                            <p className="text-sm text-muted-foreground capitalize">{forecast.resourceType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(forecast.status)}
                          {forecast.daysToCapacity && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {forecast.daysToCapacity}d to capacity
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-4 mb-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Current</p>
                          <p className={`font-semibold ${forecast.currentUsage > 80 ? 'text-red-600' : forecast.currentUsage > 60 ? 'text-amber-600' : ''}`}>{forecast.currentUsage}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">30-day</p>
                          <p className={`font-semibold ${forecast.predictedUsage30d > 90 ? 'text-red-600' : forecast.predictedUsage30d > 75 ? 'text-amber-600' : ''}`}>{forecast.predictedUsage30d}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">60-day</p>
                          <p className={`font-semibold ${forecast.predictedUsage60d > 100 ? 'text-red-600' : forecast.predictedUsage60d > 85 ? 'text-amber-600' : ''}`}>{forecast.predictedUsage60d}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">90-day</p>
                          <p className={`font-semibold ${forecast.predictedUsage90d > 100 ? 'text-red-600' : forecast.predictedUsage90d > 90 ? 'text-amber-600' : ''}`}>{forecast.predictedUsage90d}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Growth Rate</p>
                          <p className="font-semibold flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-blue-500" />
                            {forecast.growthRate}%/mo
                          </p>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Current Capacity Usage</span>
                          <span>{forecast.currentUsage}%</span>
                        </div>
                        <Progress value={forecast.currentUsage} className={`h-2 ${forecast.currentUsage > 80 ? '[&>div]:bg-red-500' : forecast.currentUsage > 60 ? '[&>div]:bg-amber-500' : ''}`} />
                      </div>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{forecast.recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Scaling Recommendations</CardTitle><CardDescription>AI-generated recommendations based on usage patterns and forecasts</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scalingRecommendations.map((rec) => (
                    <div key={rec.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <h4 className="font-semibold">{rec.service}</h4>
                            <p className="text-sm text-muted-foreground">{rec.resourceType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getActionBadge(rec.action)}
                          {getUrgencyBadge(rec.urgency)}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="p-2 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground">Current</p>
                          <p className="font-semibold">{rec.currentValue}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground">Recommended</p>
                          <p className="font-semibold text-blue-600">{rec.recommendedValue}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground">Cost Impact</p>
                          <p className={`font-semibold ${rec.estimatedCostImpact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {rec.estimatedCostImpact >= 0 ? '+' : ''}{rec.estimatedCostImpact >= 0 ? `$${rec.estimatedCostImpact}` : `-$${Math.abs(rec.estimatedCostImpact)}`}/mo
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{rec.reason}</p>
                      <div className="flex gap-2">
                        <Button size="sm">Apply Recommendation</Button>
                        <Button size="sm" variant="outline">Schedule</Button>
                        <Button size="sm" variant="ghost">Dismiss</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Resource Growth Rates</CardTitle><CardDescription>Monthly growth rate by service</CardDescription></CardHeader>
              <CardContent>
                <div className="h-64">
                  <Bar data={growthRateData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Growth Rate (%)' } } } }} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
