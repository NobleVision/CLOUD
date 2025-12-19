import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Clock, Cpu, Database, HardDrive, Network, Server, Sparkles, TrendingUp, Zap, ArrowRight, RefreshCw, Lightbulb, Target, Activity } from 'lucide-react';

interface Anomaly {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  metric: string;
  currentValue: number;
  threshold: number;
  detectedAt: Date;
  status: 'active' | 'investigating' | 'resolved';
  affectedResources: string[];
  rootCauses: RootCause[];
  recommendations: Recommendation[];
}

interface RootCause {
  id: string;
  description: string;
  confidence: number;
  category: 'resource' | 'configuration' | 'external' | 'code' | 'infrastructure';
  evidence: string[];
}

interface Recommendation {
  id: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string;
  automatable: boolean;
}

const mockAnomalies: Anomaly[] = [
  {
    id: '1', title: 'High CPU Usage on Production Cluster', severity: 'critical', metric: 'cpu_usage', currentValue: 94.5, threshold: 80, detectedAt: new Date(Date.now() - 1800000), status: 'active', affectedResources: ['gke-prod-cluster-node-1', 'gke-prod-cluster-node-2', 'gke-prod-cluster-node-3'],
    rootCauses: [
      { id: 'rc1', description: 'Memory leak in payment-service causing excessive garbage collection', confidence: 87, category: 'code', evidence: ['GC pause times increased 300%', 'Heap usage growing linearly', 'payment-service restart temporarily resolves issue'] },
      { id: 'rc2', description: 'Increased traffic from marketing campaign', confidence: 72, category: 'external', evidence: ['Request rate up 250% from baseline', 'Traffic spike correlates with campaign launch', 'Geographic distribution matches campaign targets'] },
      { id: 'rc3', description: 'Inefficient database queries in order-service', confidence: 65, category: 'code', evidence: ['Slow query log shows N+1 patterns', 'Database CPU also elevated', 'Query execution time increased 5x'] },
    ],
    recommendations: [
      { id: 'r1', action: 'Scale up GKE node pool to 5 nodes', priority: 'high', estimatedImpact: 'Reduce CPU usage by ~40%', automatable: true },
      { id: 'r2', action: 'Restart payment-service pods to clear memory leak', priority: 'high', estimatedImpact: 'Immediate relief, temporary fix', automatable: true },
      { id: 'r3', action: 'Enable horizontal pod autoscaling for affected services', priority: 'medium', estimatedImpact: 'Prevent future occurrences', automatable: true },
      { id: 'r4', action: 'Review and optimize payment-service memory management', priority: 'medium', estimatedImpact: 'Permanent fix for memory leak', automatable: false },
    ],
  },
  {
    id: '2', title: 'Elevated Error Rate in API Gateway', severity: 'warning', metric: 'error_rate', currentValue: 2.3, threshold: 1, detectedAt: new Date(Date.now() - 3600000), status: 'investigating', affectedResources: ['api-gateway-prod', 'auth-service', 'user-service'],
    rootCauses: [
      { id: 'rc4', description: 'Auth service timeout causing cascading failures', confidence: 91, category: 'infrastructure', evidence: ['Auth service latency P99 at 5s', 'Timeout errors correlate with auth calls', 'Circuit breaker triggering frequently'] },
      { id: 'rc5', description: 'Database connection pool exhaustion', confidence: 78, category: 'configuration', evidence: ['Connection pool at 100% utilization', 'Wait time for connections increasing', 'Concurrent request count exceeds pool size'] },
    ],
    recommendations: [
      { id: 'r5', action: 'Increase auth-service timeout to 10s', priority: 'high', estimatedImpact: 'Reduce timeout errors by 60%', automatable: true },
      { id: 'r6', action: 'Increase database connection pool size from 20 to 50', priority: 'high', estimatedImpact: 'Eliminate connection wait times', automatable: true },
      { id: 'r7', action: 'Implement request queuing with backpressure', priority: 'medium', estimatedImpact: 'Graceful degradation under load', automatable: false },
    ],
  },
  {
    id: '3', title: 'Disk Space Warning on Logging Server', severity: 'info', metric: 'disk_usage', currentValue: 78, threshold: 70, detectedAt: new Date(Date.now() - 7200000), status: 'resolved', affectedResources: ['logging-server-1'],
    rootCauses: [
      { id: 'rc6', description: 'Log rotation not configured properly', confidence: 95, category: 'configuration', evidence: ['Logs older than 30 days present', 'Rotation policy set to 90 days', 'Compressed logs not being deleted'] },
    ],
    recommendations: [
      { id: 'r8', action: 'Update log rotation policy to 14 days', priority: 'low', estimatedImpact: 'Reduce disk usage by 50%', automatable: true },
      { id: 'r9', action: 'Archive old logs to Cloud Storage', priority: 'low', estimatedImpact: 'Preserve logs while freeing space', automatable: true },
    ],
  },
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'resource': return Server;
    case 'configuration': return Target;
    case 'external': return Network;
    case 'code': return Zap;
    case 'infrastructure': return Database;
    default: return Activity;
  }
};

const getSeverityStyle = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'warning': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
  }
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'active': return 'bg-red-500';
    case 'investigating': return 'bg-amber-500';
    default: return 'bg-green-500';
  }
};

export default function RootCause() {
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly>(mockAnomalies[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleReanalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-purple-500" />Root Cause Analysis
            </h1>
            <p className="text-muted-foreground mt-1">AI-powered anomaly investigation and recommendations</p>
          </div>
          <Button onClick={handleReanalyze} disabled={isAnalyzing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Anomaly List */}
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle>Detected Anomalies</CardTitle><CardDescription>Click to view analysis</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockAnomalies.map((anomaly) => (
                  <div key={anomaly.id} onClick={() => setSelectedAnomaly(anomaly)} className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedAnomaly.id === anomaly.id ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${getStatusStyle(anomaly.status)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge className={getSeverityStyle(anomaly.severity)}>{anomaly.severity}</Badge>
                          <Badge variant="outline" className="text-xs">{anomaly.status}</Badge>
                        </div>
                        <h4 className="font-medium text-sm truncate">{anomaly.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{anomaly.currentValue}% (threshold: {anomaly.threshold}%)</p>
                        <p className="text-xs text-muted-foreground">{anomaly.detectedAt.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Analysis Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedAnomaly.title}</CardTitle>
                  <CardDescription>Detected {selectedAnomaly.detectedAt.toLocaleString()}</CardDescription>
                </div>
                <Badge className={getSeverityStyle(selectedAnomaly.severity)}>{selectedAnomaly.severity}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="causes">
                <TabsList className="mb-4"><TabsTrigger value="causes">Root Causes</TabsTrigger><TabsTrigger value="recommendations">Recommendations</TabsTrigger><TabsTrigger value="resources">Affected Resources</TabsTrigger></TabsList>

                <TabsContent value="causes" className="space-y-4">
                  {selectedAnomaly.rootCauses.map((cause, idx) => {
                    const Icon = getCategoryIcon(cause.category);
                    return (
                      <div key={cause.id} className="p-4 rounded-lg border">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30"><Icon className="h-5 w-5 text-purple-600" /></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">#{idx + 1} {cause.description}</h4>
                              <Badge variant="outline">{cause.category}</Badge>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-sm text-muted-foreground">Confidence:</span>
                              <Progress value={cause.confidence} className="w-32 h-2" />
                              <span className="text-sm font-medium">{cause.confidence}%</span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">Evidence:</p>
                              {cause.evidence.map((e, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm"><CheckCircle className="h-3 w-3 text-green-500" />{e}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-3">
                  {selectedAnomaly.recommendations.map((rec) => (
                    <div key={rec.id} className="p-4 rounded-lg border flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Lightbulb className={`h-5 w-5 mt-0.5 ${rec.priority === 'high' ? 'text-red-500' : rec.priority === 'medium' ? 'text-amber-500' : 'text-blue-500'}`} />
                        <div>
                          <h4 className="font-medium">{rec.action}</h4>
                          <p className="text-sm text-muted-foreground mt-1">Impact: {rec.estimatedImpact}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>{rec.priority}</Badge>
                        {rec.automatable && <Button size="sm"><Zap className="h-3 w-3 mr-1" />Auto-fix</Button>}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="resources">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedAnomaly.affectedResources.map((resource, idx) => (
                      <div key={idx} className="p-3 rounded-lg border flex items-center gap-3">
                        <Server className="h-5 w-5 text-muted-foreground" />
                        <span className="font-mono text-sm">{resource}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

