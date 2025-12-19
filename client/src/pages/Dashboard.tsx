import { useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { Activity, AlertTriangle, DollarSign, Server, TrendingUp, Wifi, CheckCircle, XCircle, Clock, Zap, Database, HardDrive, Network, Cpu, MemoryStick, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLocation } from 'wouter';
import { RealTimeIndicator } from '@/components/RealTimeIndicator';

// Mock health data for services
const serviceHealth = [
  { name: 'API Gateway', status: 'healthy', uptime: 99.99, latency: 45, icon: Network },
  { name: 'Database Cluster', status: 'healthy', uptime: 99.95, latency: 12, icon: Database },
  { name: 'Compute Engine', status: 'warning', uptime: 99.7, latency: 85, icon: Cpu },
  { name: 'Cloud Storage', status: 'healthy', uptime: 99.99, latency: 25, icon: HardDrive },
  { name: 'Memory Cache', status: 'healthy', uptime: 99.98, latency: 3, icon: MemoryStick },
];

// Mock notable events
const notableEvents = [
  { id: 1, type: 'deployment', title: 'Production deployment completed', service: 'payment-service', time: new Date(Date.now() - 1800000), status: 'success' },
  { id: 2, type: 'scaling', title: 'Auto-scaling triggered', service: 'api-gateway', time: new Date(Date.now() - 3600000), status: 'info' },
  { id: 3, type: 'maintenance', title: 'Scheduled maintenance window', service: 'database-cluster', time: new Date(Date.now() - 7200000), status: 'warning' },
  { id: 4, type: 'incident', title: 'High latency detected and resolved', service: 'order-service', time: new Date(Date.now() - 14400000), status: 'resolved' },
  { id: 5, type: 'config', title: 'Configuration update applied', service: 'auth-service', time: new Date(Date.now() - 21600000), status: 'success' },
];

// Mock threshold metrics
const thresholdMetrics = [
  { name: 'CPU Usage', current: 72, threshold: 70, warning: 70, critical: 90, unit: '%' },
  { name: 'Memory Usage', current: 65, threshold: 70, warning: 70, critical: 90, unit: '%' },
  { name: 'Disk I/O', current: 45, threshold: 70, warning: 70, critical: 90, unit: '%' },
  { name: 'Network Bandwidth', current: 78, threshold: 70, warning: 70, critical: 90, unit: '%' },
  { name: 'Request Latency', current: 185, threshold: 200, warning: 200, critical: 500, unit: 'ms' },
  { name: 'Error Rate', current: 0.8, threshold: 1, warning: 1, critical: 5, unit: '%' },
];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  // Fetch data
  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery();
  const { data: alertStats, isLoading: alertsLoading } = trpc.alerts.statistics.useQuery();
  const { data: activeAlerts, isLoading: activeAlertsLoading } = trpc.alerts.active.useQuery();

  // Seed mock data on first load
  const seedMutation = trpc.mockData.seedAll.useMutation();

  useEffect(() => {
    // Check if we need to seed data
    if (projects && projects.length === 0 && !seedMutation.isPending) {
      seedMutation.mutate();
    }
  }, [projects]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
            <p className="text-muted-foreground mt-1">
              Monitor your GCP infrastructure health and performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RealTimeIndicator compact />
          </div>
        </div>

        {/* Real-time Alerts Banner */}
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3 mb-2">
              <Wifi className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-blue-800 dark:text-blue-300">Real-Time Monitoring</h3>
            </div>
            <RealTimeIndicator showAlerts />
          </CardContent>
        </Card>

        {/* Key Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{projects?.length || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all environments
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Active Alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{alertStats?.active || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {alertStats?.critical || 0} critical, {alertStats?.warning || 0} warning
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.5%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Overall uptime
              </p>
            </CardContent>
          </Card>

          {/* Monthly Cost */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$12,450</div>
              <p className="text-xs text-chart-2 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +5.2% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Threshold Alerts - 70% Warning */}
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Threshold Monitoring (70% Alert Level)
            </CardTitle>
            <CardDescription>Metrics approaching warning thresholds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {thresholdMetrics.map((metric) => {
                const percentage = metric.unit === 'ms' ? (metric.current / metric.critical) * 100 : metric.current;
                const isWarning = metric.current >= metric.warning;
                const isCritical = metric.current >= metric.critical;
                return (
                  <div key={metric.name} className={`p-4 rounded-lg border ${isCritical ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20' : isWarning ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20' : 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{metric.name}</span>
                      {isCritical ? <XCircle className="h-4 w-4 text-red-500" /> : isWarning ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className={`text-2xl font-bold ${isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-green-600'}`}>{metric.current}</span>
                      <span className="text-sm text-muted-foreground">{metric.unit}</span>
                    </div>
                    <Progress value={Math.min(percentage, 100)} className={`h-2 ${isCritical ? '[&>div]:bg-red-500' : isWarning ? '[&>div]:bg-amber-500' : '[&>div]:bg-green-500'}`} />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Warning: {metric.warning}{metric.unit}</span>
                      <span>Critical: {metric.critical}{metric.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Health and Status Indicators */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Service Health Status
            </CardTitle>
            <CardDescription>Real-time health indicators for critical services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              {serviceHealth.map((service) => {
                const Icon = service.icon;
                return (
                  <div key={service.name} className="p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${service.status === 'healthy' ? 'bg-green-100 dark:bg-green-900/30' : service.status === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                        <Icon className={`h-4 w-4 ${service.status === 'healthy' ? 'text-green-600' : service.status === 'warning' ? 'text-amber-600' : 'text-red-600'}`} />
                      </div>
                      <div className={`w-2 h-2 rounded-full ${service.status === 'healthy' ? 'bg-green-500' : service.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'} animate-pulse`} />
                    </div>
                    <h4 className="font-medium text-sm mb-1">{service.name}</h4>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{service.uptime}% uptime</span>
                      <span>{service.latency}ms</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Notable Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                Notable Events
              </CardTitle>
              <CardDescription>Recent deployments, scaling events, and incidents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notableEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className={`p-1.5 rounded-full ${event.status === 'success' ? 'bg-green-100 dark:bg-green-900/30' : event.status === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30' : event.status === 'resolved' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-900/30'}`}>
                      {event.status === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> : event.status === 'warning' ? <AlertTriangle className="h-4 w-4 text-amber-600" /> : event.status === 'resolved' ? <CheckCircle className="h-4 w-4 text-blue-600" /> : <Zap className="h-4 w-4 text-gray-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{event.title}</p>
                        <Badge variant="outline" className="text-xs">{event.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{event.service}</p>
                      <p className="text-xs text-muted-foreground mt-1">{event.time.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Latest incidents requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              {activeAlertsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : activeAlerts && activeAlerts.length > 0 ? (
                <div className="space-y-3">
                  {activeAlerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="shrink-0 mt-0.5">
                        {alert.severity === 'critical' && (
                          <div className="w-2 h-2 rounded-full bg-destructive" />
                        )}
                        {alert.severity === 'warning' && (
                          <div className="w-2 h-2 rounded-full bg-chart-3" />
                        )}
                        {alert.severity === 'info' && (
                          <div className="w-2 h-2 rounded-full bg-chart-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">{alert.alertName}</p>
                          <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.triggeredAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active alerts</p>
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setLocation('/dashboard/alerts')}
              >
                View All Alerts
              </Button>
            </CardContent>
          </Card>

          {/* Projects by Environment */}
          <Card>
            <CardHeader>
              <CardTitle>Projects by Environment</CardTitle>
              <CardDescription>Distribution across dev, staging, and production</CardDescription>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : projects && projects.length > 0 ? (
                <div className="space-y-4">
                  {['prod', 'staging', 'dev'].map((env) => {
                    const envProjects = projects.filter(p => p.environment === env);
                    const count = envProjects.length;
                    const percentage = projects.length > 0 ? (count / projects.length) * 100 : 0;
                    
                    return (
                      <div key={env} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium capitalize">{env}</span>
                          <span className="text-muted-foreground">{count} projects</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              env === 'prod' ? 'bg-primary' :
                              env === 'staging' ? 'bg-chart-3' :
                              'bg-chart-4'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No projects found</p>
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setLocation('/dashboard/environments')}
              >
                View All Projects
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Navigate to key dashboard sections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="justify-start" onClick={() => setLocation('/dashboard/metrics')}>
                <Activity className="w-4 h-4 mr-2" />
                View Metrics
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => setLocation('/dashboard/logs')}>
                <Activity className="w-4 h-4 mr-2" />
                Search Logs
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => setLocation('/dashboard/traces')}>
                <Activity className="w-4 h-4 mr-2" />
                Trace Requests
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => setLocation('/dashboard/costs')}>
                <DollarSign className="w-4 h-4 mr-2" />
                Cost Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
