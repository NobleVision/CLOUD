import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Building2,
  Users,
  PieChart,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
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

interface Department {
  id: string;
  name: string;
  costCenter: string;
  monthlyBudget: number;
  currentSpend: number;
  forecastedSpend: number;
  budgetUtilization: number;
  trend: 'up' | 'down' | 'stable';
  alertStatus: 'normal' | 'warning' | 'critical';
}

interface CostAllocation {
  id: string;
  department: string;
  service: string;
  resourceType: string;
  usage: number;
  unitCost: number;
  totalCost: number;
  percentOfTotal: number;
}

interface BudgetAlert {
  id: string;
  department: string;
  type: 'threshold' | 'forecast' | 'anomaly';
  message: string;
  severity: 'warning' | 'critical';
  timestamp: Date;
  acknowledged: boolean;
}

const departments: Department[] = [
  { id: '1', name: 'Engineering', costCenter: 'CC-ENG-001', monthlyBudget: 150000, currentSpend: 125000, forecastedSpend: 142000, budgetUtilization: 83, trend: 'up', alertStatus: 'normal' },
  { id: '2', name: 'Data Science', costCenter: 'CC-DS-002', monthlyBudget: 80000, currentSpend: 72000, forecastedSpend: 85000, budgetUtilization: 90, trend: 'up', alertStatus: 'warning' },
  { id: '3', name: 'Platform', costCenter: 'CC-PLT-003', monthlyBudget: 200000, currentSpend: 165000, forecastedSpend: 190000, budgetUtilization: 82, trend: 'stable', alertStatus: 'normal' },
  { id: '4', name: 'Security', costCenter: 'CC-SEC-004', monthlyBudget: 45000, currentSpend: 38000, forecastedSpend: 43000, budgetUtilization: 84, trend: 'down', alertStatus: 'normal' },
  { id: '5', name: 'Analytics', costCenter: 'CC-ANA-005', monthlyBudget: 60000, currentSpend: 58000, forecastedSpend: 72000, budgetUtilization: 97, trend: 'up', alertStatus: 'critical' },
  { id: '6', name: 'DevOps', costCenter: 'CC-OPS-006', monthlyBudget: 35000, currentSpend: 28000, forecastedSpend: 32000, budgetUtilization: 80, trend: 'stable', alertStatus: 'normal' },
];

const costAllocations: CostAllocation[] = [
  { id: '1', department: 'Engineering', service: 'Compute Engine', resourceType: 'VM Instances', usage: 2500, unitCost: 25, totalCost: 62500, percentOfTotal: 50 },
  { id: '2', department: 'Engineering', service: 'Cloud Storage', resourceType: 'Standard Storage', usage: 50000, unitCost: 0.5, totalCost: 25000, percentOfTotal: 20 },
  { id: '3', department: 'Data Science', service: 'BigQuery', resourceType: 'Query Processing', usage: 1200, unitCost: 40, totalCost: 48000, percentOfTotal: 67 },
  { id: '4', department: 'Data Science', service: 'AI Platform', resourceType: 'Training Jobs', usage: 80, unitCost: 300, totalCost: 24000, percentOfTotal: 33 },
  { id: '5', department: 'Platform', service: 'GKE', resourceType: 'Cluster Nodes', usage: 150, unitCost: 800, totalCost: 120000, percentOfTotal: 73 },
  { id: '6', department: 'Platform', service: 'Cloud SQL', resourceType: 'Database Instances', usage: 25, unitCost: 1800, totalCost: 45000, percentOfTotal: 27 },
  { id: '7', department: 'Analytics', service: 'Dataflow', resourceType: 'Pipeline Jobs', usage: 450, unitCost: 100, totalCost: 45000, percentOfTotal: 78 },
  { id: '8', department: 'Security', service: 'Cloud Armor', resourceType: 'WAF Rules', usage: 100, unitCost: 180, totalCost: 18000, percentOfTotal: 47 },
];

const budgetAlerts: BudgetAlert[] = [
  { id: '1', department: 'Analytics', type: 'threshold', message: 'Budget utilization exceeded 95% threshold', severity: 'critical', timestamp: new Date(Date.now() - 3600000), acknowledged: false },
  { id: '2', department: 'Data Science', type: 'forecast', message: 'Forecasted spend will exceed budget by 6.2%', severity: 'warning', timestamp: new Date(Date.now() - 7200000), acknowledged: false },
  { id: '3', department: 'Engineering', type: 'anomaly', message: 'Unusual spike in Compute Engine costs detected', severity: 'warning', timestamp: new Date(Date.now() - 14400000), acknowledged: true },
];

const costTrendData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    { label: 'Engineering', data: [120000, 125000, 130000, 128000, 135000, 142000], borderColor: 'rgb(59, 130, 246)', fill: false, tension: 0.4 },
    { label: 'Data Science', data: [65000, 68000, 70000, 72000, 75000, 85000], borderColor: 'rgb(34, 197, 94)', fill: false, tension: 0.4 },
    { label: 'Platform', data: [180000, 175000, 185000, 190000, 188000, 190000], borderColor: 'rgb(251, 191, 36)', fill: false, tension: 0.4 },
    { label: 'Analytics', data: [45000, 48000, 52000, 55000, 62000, 72000], borderColor: 'rgb(239, 68, 68)', fill: false, tension: 0.4 },
  ],
};

const serviceBreakdownData = {
  labels: ['Compute Engine', 'GKE', 'BigQuery', 'Cloud Storage', 'Cloud SQL', 'Other'],
  datasets: [{
    data: [35, 25, 15, 10, 8, 7],
    backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(34, 197, 94, 0.8)', 'rgba(251, 191, 36, 0.8)', 'rgba(168, 85, 247, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(156, 163, 175, 0.8)'],
    borderColor: ['rgb(59, 130, 246)', 'rgb(34, 197, 94)', 'rgb(251, 191, 36)', 'rgb(168, 85, 247)', 'rgb(239, 68, 68)', 'rgb(156, 163, 175)'],
    borderWidth: 2,
  }],
};

const budgetVsActualData = {
  labels: ['Engineering', 'Data Science', 'Platform', 'Security', 'Analytics', 'DevOps'],
  datasets: [
    { label: 'Budget', data: [150000, 80000, 200000, 45000, 60000, 35000], backgroundColor: 'rgba(156, 163, 175, 0.5)', borderWidth: 0 },
    { label: 'Actual', data: [125000, 72000, 165000, 38000, 58000, 28000], backgroundColor: 'rgba(59, 130, 246, 0.8)', borderWidth: 0 },
    { label: 'Forecast', data: [142000, 85000, 190000, 43000, 72000, 32000], backgroundColor: 'rgba(251, 191, 36, 0.8)', borderWidth: 0 },
  ],
};

const getAlertBadge = (status: string) => {
  switch (status) {
    case 'normal': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">On Track</Badge>;
    case 'warning': return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Warning</Badge>;
    case 'critical': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Over Budget</Badge>;
    default: return null;
  }
};

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'warning': return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"><AlertTriangle className="h-3 w-3 mr-1" />Warning</Badge>;
    case 'critical': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"><AlertTriangle className="h-3 w-3 mr-1" />Critical</Badge>;
    default: return null;
  }
};

export default function CostChargeback() {
  const [timeRange, setTimeRange] = useState('month');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const totalBudget = departments.reduce((sum, d) => sum + d.monthlyBudget, 0);
  const totalSpend = departments.reduce((sum, d) => sum + d.currentSpend, 0);
  const totalForecast = departments.reduce((sum, d) => sum + d.forecastedSpend, 0);
  const overallUtilization = Math.round((totalSpend / totalBudget) * 100);
  const activeAlerts = budgetAlerts.filter(a => !a.acknowledged).length;

  const filteredAllocations = selectedDepartment === 'all' 
    ? costAllocations 
    : costAllocations.filter(a => a.department === selectedDepartment);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-8 w-8 text-green-500" />
              Multi-Tenant Cost Chargeback
            </h1>
            <p className="text-muted-foreground mt-1">Department/team-level cost allocation with showback reports and budget alerts</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-36"><Calendar className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export Report</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><DollarSign className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">${(totalSpend / 1000).toFixed(0)}K</p><p className="text-xs text-muted-foreground">Current Spend</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900/30"><PieChart className="h-5 w-5 text-gray-600" /></div><div><p className="text-2xl font-bold">${(totalBudget / 1000).toFixed(0)}K</p><p className="text-xs text-muted-foreground">Total Budget</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><TrendingUp className="h-5 w-5 text-amber-600" /></div><div><p className="text-2xl font-bold">${(totalForecast / 1000).toFixed(0)}K</p><p className="text-xs text-muted-foreground">Forecasted</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><Users className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold">{overallUtilization}%</p><p className="text-xs text-muted-foreground">Budget Utilized</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30"><Bell className="h-5 w-5 text-red-600" /></div><div><p className="text-2xl font-bold text-red-600">{activeAlerts}</p><p className="text-xs text-muted-foreground">Active Alerts</p></div></div></CardContent></Card>
        </div>

        {/* Budget Alerts */}
        {budgetAlerts.filter(a => !a.acknowledged).length > 0 && (
          <Card className="border-amber-500">
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-amber-600"><AlertTriangle className="h-5 w-5" />Budget Alerts</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {budgetAlerts.filter(a => !a.acknowledged).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      {getSeverityBadge(alert.severity)}
                      <div>
                        <p className="font-medium">{alert.department}</p>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{alert.timestamp.toLocaleTimeString()}</span>
                      <Button size="sm" variant="ghost">Dismiss</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="allocations">Cost Allocations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Cost Trends by Department</CardTitle><CardDescription>Monthly spend over the past 6 months</CardDescription></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Line data={costTrendData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Cost ($)' } } } }} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Cost by Service</CardTitle><CardDescription>Distribution of costs across GCP services</CardDescription></CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <Doughnut data={serviceBreakdownData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Budget vs Actual vs Forecast</CardTitle><CardDescription>Comparison across all departments</CardDescription></CardHeader>
              <CardContent>
                <div className="h-64">
                  <Bar data={budgetVsActualData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Amount ($)' } } } }} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {departments.map((dept) => (
                <Card key={dept.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{dept.name}</CardTitle>
                      {getAlertBadge(dept.alertStatus)}
                    </div>
                    <CardDescription>{dept.costCenter}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Budget</p>
                          <p className="text-lg font-semibold">${(dept.monthlyBudget / 1000).toFixed(0)}K</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Spent</p>
                          <p className="text-lg font-semibold">${(dept.currentSpend / 1000).toFixed(0)}K</p>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Budget Utilization</span>
                          <span className={dept.budgetUtilization > 90 ? 'text-red-600' : dept.budgetUtilization > 80 ? 'text-amber-600' : ''}>{dept.budgetUtilization}%</span>
                        </div>
                        <Progress value={dept.budgetUtilization} className={`h-2 ${dept.budgetUtilization > 90 ? '[&>div]:bg-red-500' : dept.budgetUtilization > 80 ? '[&>div]:bg-amber-500' : ''}`} />
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">Forecast</p>
                          <p className="font-medium">${(dept.forecastedSpend / 1000).toFixed(0)}K</p>
                        </div>
                        <div className={`flex items-center gap-1 ${dept.trend === 'up' ? 'text-red-600' : dept.trend === 'down' ? 'text-green-600' : 'text-gray-600'}`}>
                          {dept.trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : dept.trend === 'down' ? <ArrowDownRight className="h-4 w-4" /> : null}
                          <span className="text-sm">{dept.trend === 'up' ? 'Increasing' : dept.trend === 'down' ? 'Decreasing' : 'Stable'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="allocations" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div><CardTitle>Cost Allocations</CardTitle><CardDescription>Detailed breakdown by department and service</CardDescription></div>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="All Departments" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map(d => (<SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Resource Type</TableHead>
                      <TableHead className="text-right">Usage</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                      <TableHead className="text-right">% of Dept</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAllocations.map((allocation) => (
                      <TableRow key={allocation.id}>
                        <TableCell className="font-medium">{allocation.department}</TableCell>
                        <TableCell>{allocation.service}</TableCell>
                        <TableCell className="text-muted-foreground">{allocation.resourceType}</TableCell>
                        <TableCell className="text-right">{allocation.usage.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${allocation.unitCost}</TableCell>
                        <TableCell className="text-right font-medium">${allocation.totalCost.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{allocation.percentOfTotal}%</TableCell>
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
