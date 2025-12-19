import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  BookOpen,
  Terminal,
  RefreshCw,
  Trash2,
  Scale,
  Server,
  Database,
  Shield,
  AlertTriangle,
  Loader2,
  History,
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Runbook {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: string;
  steps: string[];
  lastExecuted: Date | null;
  executionCount: number;
  successRate: number;
}

interface Execution {
  id: string;
  runbookId: string;
  runbookName: string;
  status: 'running' | 'success' | 'failed' | 'cancelled';
  startTime: Date;
  endTime: Date | null;
  triggeredBy: string;
  target: string;
  output: string;
}

const runbooks: Runbook[] = [
  { id: '1', name: 'Restart Service', description: 'Gracefully restart a service with health checks', category: 'Service Management', severity: 'medium', estimatedTime: '2-5 min', steps: ['Stop service gracefully', 'Wait for connections to drain', 'Start service', 'Verify health checks'], lastExecuted: new Date(Date.now() - 3600000), executionCount: 45, successRate: 98 },
  { id: '2', name: 'Scale Up Instances', description: 'Increase the number of instances in an instance group', category: 'Scaling', severity: 'low', estimatedTime: '3-8 min', steps: ['Check current capacity', 'Calculate required instances', 'Scale instance group', 'Verify new instances healthy'], lastExecuted: new Date(Date.now() - 7200000), executionCount: 28, successRate: 100 },
  { id: '3', name: 'Clear Cache', description: 'Flush Redis/Memcached cache with validation', category: 'Cache Management', severity: 'medium', estimatedTime: '1-2 min', steps: ['Connect to cache cluster', 'Flush all keys', 'Verify cache is empty', 'Monitor cache warm-up'], lastExecuted: new Date(Date.now() - 86400000), executionCount: 62, successRate: 95 },
  { id: '4', name: 'Database Failover', description: 'Initiate failover to replica database', category: 'Database', severity: 'critical', estimatedTime: '5-15 min', steps: ['Verify replica health', 'Stop write operations', 'Promote replica to primary', 'Update connection strings', 'Resume operations'], lastExecuted: new Date(Date.now() - 604800000), executionCount: 8, successRate: 88 },
  { id: '5', name: 'Rotate Credentials', description: 'Rotate API keys and service account credentials', category: 'Security', severity: 'high', estimatedTime: '5-10 min', steps: ['Generate new credentials', 'Update secret manager', 'Propagate to services', 'Revoke old credentials'], lastExecuted: new Date(Date.now() - 259200000), executionCount: 15, successRate: 100 },
  { id: '6', name: 'Purge Logs', description: 'Delete old log files to free up disk space', category: 'Maintenance', severity: 'low', estimatedTime: '2-5 min', steps: ['Identify logs older than retention', 'Archive to cold storage', 'Delete archived logs', 'Verify disk space freed'], lastExecuted: new Date(Date.now() - 172800000), executionCount: 35, successRate: 100 },
  { id: '7', name: 'Network Rollback', description: 'Rollback recent network configuration changes', category: 'Network', severity: 'high', estimatedTime: '5-10 min', steps: ['Identify last stable config', 'Apply previous configuration', 'Verify connectivity', 'Test critical endpoints'], lastExecuted: null, executionCount: 3, successRate: 67 },
  { id: '8', name: 'Pod Eviction', description: 'Gracefully evict pods from a node for maintenance', category: 'Kubernetes', severity: 'medium', estimatedTime: '3-8 min', steps: ['Cordon node', 'Drain pods gracefully', 'Wait for pod migration', 'Verify workload healthy'], lastExecuted: new Date(Date.now() - 432000000), executionCount: 22, successRate: 95 },
];

const executions: Execution[] = [
  { id: '1', runbookId: '1', runbookName: 'Restart Service', status: 'success', startTime: new Date(Date.now() - 3600000), endTime: new Date(Date.now() - 3300000), triggeredBy: 'john.smith@adp.com', target: 'payment-gateway-prod', output: 'Service restarted successfully. All health checks passed.' },
  { id: '2', runbookId: '2', runbookName: 'Scale Up Instances', status: 'success', startTime: new Date(Date.now() - 7200000), endTime: new Date(Date.now() - 6600000), triggeredBy: 'auto-scaling-trigger', target: 'api-workers-group', output: 'Scaled from 5 to 8 instances. All instances healthy.' },
  { id: '3', runbookId: '3', runbookName: 'Clear Cache', status: 'running', startTime: new Date(Date.now() - 120000), endTime: null, triggeredBy: 'jane.doe@adp.com', target: 'redis-prod-cluster', output: 'Flushing cache... 75% complete' },
  { id: '4', runbookId: '4', runbookName: 'Database Failover', status: 'failed', startTime: new Date(Date.now() - 604800000), endTime: new Date(Date.now() - 603900000), triggeredBy: 'incident-response', target: 'mysql-primary-prod', output: 'ERROR: Replica replication lag exceeded threshold (15 min). Failover aborted.' },
  { id: '5', runbookId: '1', runbookName: 'Restart Service', status: 'success', startTime: new Date(Date.now() - 86400000), endTime: new Date(Date.now() - 86100000), triggeredBy: 'sarah.wilson@adp.com', target: 'order-service-prod', output: 'Service restarted successfully. All health checks passed.' },
  { id: '6', runbookId: '6', runbookName: 'Purge Logs', status: 'success', startTime: new Date(Date.now() - 172800000), endTime: new Date(Date.now() - 172500000), triggeredBy: 'scheduled-job', target: 'log-aggregator', output: '45GB freed. Logs older than 30 days archived and deleted.' },
];

const executionStatsData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    { label: 'Successful', data: [8, 12, 6, 9, 15, 3, 2], backgroundColor: 'rgba(34, 197, 94, 0.8)' },
    { label: 'Failed', data: [1, 0, 1, 0, 2, 0, 0], backgroundColor: 'rgba(239, 68, 68, 0.8)' },
  ],
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Service Management': return <Server className="h-4 w-4" />;
    case 'Scaling': return <Scale className="h-4 w-4" />;
    case 'Cache Management': return <RefreshCw className="h-4 w-4" />;
    case 'Database': return <Database className="h-4 w-4" />;
    case 'Security': return <Shield className="h-4 w-4" />;
    case 'Maintenance': return <Trash2 className="h-4 w-4" />;
    case 'Kubernetes': return <Server className="h-4 w-4" />;
    default: return <Terminal className="h-4 w-4" />;
  }
};

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'low': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Low Risk</Badge>;
    case 'medium': return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Medium</Badge>;
    case 'high': return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">High Risk</Badge>;
    case 'critical': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Critical</Badge>;
    default: return null;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'running': return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Running</Badge>;
    case 'success': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
    case 'failed': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
    case 'cancelled': return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">Cancelled</Badge>;
    default: return null;
  }
};

export default function Runbooks() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedRunbook, setSelectedRunbook] = useState<Runbook | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const filteredRunbooks = runbooks.filter(runbook => {
    const matchesSearch = runbook.name.toLowerCase().includes(searchQuery.toLowerCase()) || runbook.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || runbook.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const uniqueCategories = Array.from(new Set(runbooks.map(r => r.category)));
  const totalExecutions = executions.length;
  const successfulExecutions = executions.filter(e => e.status === 'success').length;
  const runningExecutions = executions.filter(e => e.status === 'running').length;

  const handleExecute = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      setSelectedRunbook(null);
    }, 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-orange-500" />
              Automated Runbook Executor
            </h1>
            <p className="text-muted-foreground mt-1">One-click remediation actions with pre-defined runbooks for common issues</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><BookOpen className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{runbooks.length}</p><p className="text-xs text-muted-foreground">Total Runbooks</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30"><History className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{totalExecutions}</p><p className="text-xs text-muted-foreground">Total Executions</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><CheckCircle className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold text-green-600">{Math.round((successfulExecutions / totalExecutions) * 100)}%</p><p className="text-xs text-muted-foreground">Success Rate</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Loader2 className="h-5 w-5 text-amber-600" /></div><div><p className="text-2xl font-bold text-amber-600">{runningExecutions}</p><p className="text-xs text-muted-foreground">Running Now</p></div></div></CardContent></Card>
        </div>

        <Tabs defaultValue="runbooks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="runbooks">Runbook Catalog</TabsTrigger>
            <TabsTrigger value="history">Execution History</TabsTrigger>
          </TabsList>

          <TabsContent value="runbooks" className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search runbooks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRunbooks.map((runbook) => (
                <Card key={runbook.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-muted">{getCategoryIcon(runbook.category)}</div>
                        <div>
                          <CardTitle className="text-base">{runbook.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{runbook.category}</p>
                        </div>
                      </div>
                      {getSeverityBadge(runbook.severity)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{runbook.description}</p>
                    <div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm">
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="font-semibold">{runbook.executionCount}</p>
                        <p className="text-xs text-muted-foreground">Executions</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="font-semibold text-green-600">{runbook.successRate}%</p>
                        <p className="text-xs text-muted-foreground">Success</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="font-semibold">{runbook.estimatedTime}</p>
                        <p className="text-xs text-muted-foreground">Duration</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{runbook.lastExecuted ? `Last: ${runbook.lastExecuted.toLocaleDateString()}` : 'Never executed'}</span>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => setSelectedRunbook(runbook)}><Play className="h-4 w-4 mr-2" />Execute</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2"><Play className="h-5 w-5" />Execute Runbook: {runbook.name}</DialogTitle>
                            <DialogDescription>{runbook.description}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="flex items-center gap-2">
                              {getSeverityBadge(runbook.severity)}
                              <span className="text-sm text-muted-foreground">Estimated time: {runbook.estimatedTime}</span>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Steps to be executed:</h4>
                              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                                {runbook.steps.map((step, i) => (<li key={i}>{step}</li>))}
                              </ol>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Target Resource</label>
                              <Input placeholder="e.g., payment-gateway-prod" className="mt-1" />
                            </div>
                            {runbook.severity === 'critical' || runbook.severity === 'high' ? (
                              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm">This runbook has elevated risk. Proceed with caution.</span>
                              </div>
                            ) : null}
                          </div>
                          <DialogFooter>
                            <Button variant="outline">Cancel</Button>
                            <Button onClick={handleExecute} disabled={isExecuting}>
                              {isExecuting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Executing...</> : <><Play className="h-4 w-4 mr-2" />Execute Now</>}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Execution Stats (Last 7 Days)</CardTitle><CardDescription>Runbook executions by day</CardDescription></CardHeader>
              <CardContent>
                <div className="h-48">
                  <Bar data={executionStatsData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, stacked: true }, x: { stacked: true } } }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Recent Executions</CardTitle><CardDescription>History of runbook executions</CardDescription></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Runbook</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Triggered By</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executions.map((exec) => (
                      <TableRow key={exec.id}>
                        <TableCell className="font-medium">{exec.runbookName}</TableCell>
                        <TableCell className="font-mono text-sm">{exec.target}</TableCell>
                        <TableCell>{exec.triggeredBy}</TableCell>
                        <TableCell className="text-sm">{exec.startTime.toLocaleString()}</TableCell>
                        <TableCell>{exec.endTime ? `${Math.round((exec.endTime.getTime() - exec.startTime.getTime()) / 60000)}m` : '-'}</TableCell>
                        <TableCell>{getStatusBadge(exec.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
