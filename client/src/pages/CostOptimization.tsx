import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingDown, TrendingUp, Zap, Server, Database, HardDrive, Cloud, AlertTriangle, CheckCircle, ArrowRight, Lightbulb, PiggyBank, BarChart3 } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface CostRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'compute' | 'storage' | 'network' | 'database' | 'other';
  currentCost: number;
  projectedSavings: number;
  savingsPercentage: number;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'implemented';
  automatable: boolean;
}

const recommendations: CostRecommendation[] = [
  { id: '1', title: 'Right-size underutilized VMs', description: 'Identified 12 VMs with average CPU usage below 10%. Recommend downsizing to smaller machine types.', category: 'compute', currentCost: 4500, projectedSavings: 2250, savingsPercentage: 50, effort: 'low', impact: 'high', status: 'pending', automatable: true },
  { id: '2', title: 'Delete unused persistent disks', description: '8 persistent disks have been unattached for over 30 days. Total size: 2TB.', category: 'storage', currentCost: 160, projectedSavings: 160, savingsPercentage: 100, effort: 'low', impact: 'low', status: 'pending', automatable: true },
  { id: '3', title: 'Use committed use discounts', description: 'Stable workloads identified. 1-year commitment could save 37% on compute costs.', category: 'compute', currentCost: 8000, projectedSavings: 2960, savingsPercentage: 37, effort: 'medium', impact: 'high', status: 'in_progress', automatable: false },
  { id: '4', title: 'Migrate to Cloud SQL Standard tier', description: 'Development databases running on high-availability tier. Standard tier sufficient for non-prod.', category: 'database', currentCost: 1200, projectedSavings: 600, savingsPercentage: 50, effort: 'medium', impact: 'medium', status: 'pending', automatable: false },
  { id: '5', title: 'Enable lifecycle policies for Cloud Storage', description: 'Move infrequently accessed data to Nearline/Coldline storage classes.', category: 'storage', currentCost: 800, projectedSavings: 480, savingsPercentage: 60, effort: 'low', impact: 'medium', status: 'implemented', automatable: true },
  { id: '6', title: 'Optimize network egress', description: 'Use Cloud CDN for static assets to reduce egress costs from origin servers.', category: 'network', currentCost: 1500, projectedSavings: 900, savingsPercentage: 60, effort: 'medium', impact: 'medium', status: 'pending', automatable: false },
  { id: '7', title: 'Schedule non-production workloads', description: 'Shut down dev/staging environments outside business hours (6PM-8AM, weekends).', category: 'compute', currentCost: 3000, projectedSavings: 1800, savingsPercentage: 60, effort: 'low', impact: 'high', status: 'pending', automatable: true },
  { id: '8', title: 'Use preemptible VMs for batch jobs', description: 'Batch processing workloads can use preemptible VMs at 80% discount.', category: 'compute', currentCost: 2000, projectedSavings: 1600, savingsPercentage: 80, effort: 'medium', impact: 'high', status: 'pending', automatable: false },
];

const costByCategory = {
  labels: ['Compute', 'Storage', 'Network', 'Database', 'Other'],
  datasets: [{ data: [15500, 2960, 1500, 1200, 840], backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#6b7280'] }],
};

const monthlyCostTrend = {
  labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    { label: 'Actual Cost', data: [18500, 19200, 20100, 21500, 22000, 22000], backgroundColor: 'rgba(59, 130, 246, 0.8)' },
    { label: 'Optimized (Projected)', data: [18500, 19200, 20100, 21500, 22000, 14750], backgroundColor: 'rgba(34, 197, 94, 0.8)' },
  ],
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'compute': return Server;
    case 'storage': return HardDrive;
    case 'network': return Cloud;
    case 'database': return Database;
    default: return DollarSign;
  }
};

const getEffortColor = (effort: string) => {
  switch (effort) { case 'low': return 'text-green-600'; case 'medium': return 'text-amber-600'; default: return 'text-red-600'; }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'implemented': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Implemented</Badge>;
    case 'in_progress': return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">In Progress</Badge>;
    default: return <Badge variant="outline">Pending</Badge>;
  }
};

export default function CostOptimization() {
  const [filter, setFilter] = useState<string>('all');
  
  const totalCurrentCost = recommendations.reduce((sum, r) => sum + r.currentCost, 0);
  const totalSavings = recommendations.reduce((sum, r) => sum + r.projectedSavings, 0);
  const implementedSavings = recommendations.filter(r => r.status === 'implemented').reduce((sum, r) => sum + r.projectedSavings, 0);
  
  const filteredRecs = filter === 'all' ? recommendations : recommendations.filter(r => r.category === filter);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><PiggyBank className="h-8 w-8 text-green-500" />Cost Optimization</h1>
          <p className="text-muted-foreground mt-1">AI-powered recommendations to reduce cloud spending</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><DollarSign className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">${totalCurrentCost.toLocaleString()}</p><p className="text-xs text-muted-foreground">Monthly Spend</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><TrendingDown className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold text-green-600">${totalSavings.toLocaleString()}</p><p className="text-xs text-muted-foreground">Potential Savings</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30"><CheckCircle className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold">${implementedSavings.toLocaleString()}</p><p className="text-xs text-muted-foreground">Realized Savings</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Lightbulb className="h-5 w-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{recommendations.length}</p><p className="text-xs text-muted-foreground">Recommendations</p></div></div></CardContent></Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Cost by Category</CardTitle><CardDescription>Current monthly spend breakdown</CardDescription></CardHeader>
            <CardContent><div className="h-64"><Doughnut data={costByCategory} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} /></div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Cost Trend</CardTitle><CardDescription>Actual vs optimized projection</CardDescription></CardHeader>
            <CardContent><div className="h-64"><Bar data={monthlyCostTrend} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }} /></div></CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div><CardTitle>Optimization Recommendations</CardTitle><CardDescription>Actionable insights to reduce costs</CardDescription></div>
              <div className="flex gap-2">
                {['all', 'compute', 'storage', 'network', 'database'].map(cat => (
                  <Button key={cat} variant={filter === cat ? 'default' : 'outline'} size="sm" onClick={() => setFilter(cat)} className="capitalize">{cat}</Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredRecs.map((rec) => {
                const Icon = getCategoryIcon(rec.category);
                return (
                  <div key={rec.id} className="p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-semibold">{rec.title}</h4>
                            {getStatusBadge(rec.status)}
                            {rec.automatable && <Badge variant="secondary" className="text-xs"><Zap className="h-3 w-3 mr-1" />Auto</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span>Current: <strong>${rec.currentCost}/mo</strong></span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <span className="text-green-600">Save: <strong>${rec.projectedSavings}/mo ({rec.savingsPercentage}%)</strong></span>
                            <span className={getEffortColor(rec.effort)}>Effort: {rec.effort}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">${rec.projectedSavings}</p>
                          <p className="text-xs text-muted-foreground">monthly savings</p>
                        </div>
                        {rec.status === 'pending' && (
                          <Button size="sm">{rec.automatable ? 'Apply Now' : 'View Details'}</Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

