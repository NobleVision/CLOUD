import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function Alerts() {
  const utils = trpc.useUtils();
  const { data: activeAlerts, isLoading } = trpc.alerts.active.useQuery();
  const { data: alertStats } = trpc.alerts.statistics.useQuery();
  
  const acknowledgeMutation = trpc.alerts.acknowledge.useMutation({
    onSuccess: () => {
      utils.alerts.active.invalidate();
      utils.alerts.statistics.invalidate();
      toast.success('Alert acknowledged successfully');
    },
  });

  const resolveMutation = trpc.alerts.resolve.useMutation({
    onSuccess: () => {
      utils.alerts.active.invalidate();
      utils.alerts.statistics.invalidate();
      toast.success('Alert resolved successfully');
    },
  });

  const handleAcknowledge = (alertId: number) => {
    acknowledgeMutation.mutate({ alertId });
  };

  const handleResolve = (alertId: number) => {
    resolveMutation.mutate({ alertId });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts & Incidents</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage alerts across your infrastructure
          </p>
        </div>

        {/* Alert Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alertStats?.active || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Requiring attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Critical
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{alertStats?.critical || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">High priority</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Warnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-3">{alertStats?.warning || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Medium priority</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alertStats?.total || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Alerts List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
            <CardDescription>Alerts that require acknowledgment or resolution</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : activeAlerts && activeAlerts.length > 0 ? (
              <div className="space-y-4">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <AlertTriangle className={`h-5 w-5 shrink-0 ${
                            alert.severity === 'critical' ? 'text-destructive' :
                            alert.severity === 'warning' ? 'text-chart-3' :
                            'text-chart-4'
                          }`} />
                          <h3 className="font-semibold text-lg">{alert.alertName}</h3>
                          <Badge 
                            variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                            className="ml-auto"
                          >
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline">
                            {alert.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {alert.message}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Resource:</span>{' '}
                            <span className="font-medium">{alert.resourceName || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Type:</span>{' '}
                            <span className="font-medium">{alert.resourceType || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Triggered:</span>{' '}
                            <span className="font-medium">
                              {new Date(alert.triggeredAt).toLocaleString()}
                            </span>
                          </div>
                          {alert.acknowledgedAt && (
                            <div>
                              <span className="text-muted-foreground">Acknowledged:</span>{' '}
                              <span className="font-medium">
                                {new Date(alert.acknowledgedAt).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 shrink-0">
                        {alert.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcknowledge(alert.id)}
                            disabled={acknowledgeMutation.isPending}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Acknowledge
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleResolve(alert.id)}
                          disabled={resolveMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-chart-2" />
                <p className="text-lg font-medium">No active alerts</p>
                <p className="text-sm mt-1">Your infrastructure is running smoothly</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
