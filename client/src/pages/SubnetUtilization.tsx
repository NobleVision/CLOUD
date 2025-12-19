import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Network, Globe, Server, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, 
  Activity, Search, Clock, Layers, Sparkles, Brain, Target, Lightbulb,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Minus, AlertCircle,
  Download, RefreshCw, Filter, ChevronRight, Info, Wifi
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

// Types
interface Subnet {
  id: string;
  name: string;
  cidr: string;
  region: string;
  vpc: string;
  totalIPs: number;
  usedIPs: number;
  availableIPs: number;
  reservedIPs: number;
  utilizationPercent: number;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  purpose: 'production' | 'staging' | 'development' | 'management' | 'gke';
  connectedResources: number;
  utilizationHistory: number[];
  lastUpdated: Date;
}

interface VPCUtilization {
  vpc: string;
  totalSubnets: number;
  totalIPs: number;
  usedIPs: number;
  utilizationPercent: number;
  criticalSubnets: number;
  warningSubnets: number;
}

interface CapacityAlert {
  id: string;
  subnetId: string;
  subnetName: string;
  vpc: string;
  severity: 'warning' | 'critical';
  message: string;
  utilizationPercent: number;
  projectedExhaustion: string;
  timestamp: Date;
}

// Mock data generators
function generateMockSubnets(): Subnet[] {
  const regions = ['us-central1', 'us-east1', 'us-west1', 'europe-west1'];
  const vpcs = ['adp-prod-vpc', 'adp-staging-vpc', 'adp-dev-vpc', 'adp-shared-vpc'];
  const purposes: Subnet['purpose'][] = ['production', 'staging', 'development', 'management', 'gke'];
  
  const subnets: Subnet[] = [
    { id: 's1', name: 'prod-api-subnet', cidr: '10.128.0.0/20', region: 'us-central1', vpc: 'adp-prod-vpc', totalIPs: 4094, usedIPs: 3685, availableIPs: 309, reservedIPs: 100, utilizationPercent: 90, status: 'critical', trend: 'up', purpose: 'production', connectedResources: 234, utilizationHistory: [75, 78, 80, 82, 85, 87, 88, 89, 90], lastUpdated: new Date() },
    { id: 's2', name: 'prod-web-subnet', cidr: '10.128.16.0/20', region: 'us-central1', vpc: 'adp-prod-vpc', totalIPs: 4094, usedIPs: 3276, availableIPs: 718, reservedIPs: 100, utilizationPercent: 80, status: 'warning', trend: 'up', purpose: 'production', connectedResources: 156, utilizationHistory: [65, 68, 70, 72, 75, 76, 78, 79, 80], lastUpdated: new Date() },
    { id: 's3', name: 'prod-db-subnet', cidr: '10.128.32.0/24', region: 'us-central1', vpc: 'adp-prod-vpc', totalIPs: 254, usedIPs: 127, availableIPs: 117, reservedIPs: 10, utilizationPercent: 50, status: 'healthy', trend: 'stable', purpose: 'production', connectedResources: 45, utilizationHistory: [48, 49, 48, 50, 49, 50, 50, 50, 50], lastUpdated: new Date() },
    { id: 's4', name: 'gke-pods-subnet', cidr: '10.140.0.0/14', region: 'us-central1', vpc: 'adp-prod-vpc', totalIPs: 262142, usedIPs: 248035, availableIPs: 14107, reservedIPs: 0, utilizationPercent: 95, status: 'critical', trend: 'up', purpose: 'gke', connectedResources: 1250, utilizationHistory: [85, 87, 88, 90, 91, 92, 93, 94, 95], lastUpdated: new Date() },
    { id: 's5', name: 'gke-services-subnet', cidr: '10.144.0.0/20', region: 'us-central1', vpc: 'adp-prod-vpc', totalIPs: 4094, usedIPs: 2867, availableIPs: 1127, reservedIPs: 100, utilizationPercent: 70, status: 'warning', trend: 'stable', purpose: 'gke', connectedResources: 89, utilizationHistory: [68, 69, 70, 70, 69, 70, 70, 70, 70], lastUpdated: new Date() },
    { id: 's6', name: 'staging-subnet', cidr: '10.132.0.0/20', region: 'us-east1', vpc: 'adp-staging-vpc', totalIPs: 4094, usedIPs: 1024, availableIPs: 2970, reservedIPs: 100, utilizationPercent: 25, status: 'healthy', trend: 'down', purpose: 'staging', connectedResources: 45, utilizationHistory: [30, 28, 27, 26, 25, 25, 25, 25, 25], lastUpdated: new Date() },
    { id: 's7', name: 'dev-subnet', cidr: '10.136.0.0/20', region: 'us-west1', vpc: 'adp-dev-vpc', totalIPs: 4094, usedIPs: 512, availableIPs: 3482, reservedIPs: 100, utilizationPercent: 13, status: 'healthy', trend: 'stable', purpose: 'development', connectedResources: 28, utilizationHistory: [12, 13, 12, 13, 13, 13, 13, 13, 13], lastUpdated: new Date() },
    { id: 's8', name: 'mgmt-subnet', cidr: '10.200.0.0/24', region: 'us-central1', vpc: 'adp-shared-vpc', totalIPs: 254, usedIPs: 32, availableIPs: 212, reservedIPs: 10, utilizationPercent: 13, status: 'healthy', trend: 'stable', purpose: 'management', connectedResources: 15, utilizationHistory: [12, 12, 13, 13, 13, 13, 13, 13, 13], lastUpdated: new Date() },
    { id: 's9', name: 'prod-cache-subnet', cidr: '10.128.48.0/24', region: 'us-central1', vpc: 'adp-prod-vpc', totalIPs: 254, usedIPs: 203, availableIPs: 41, reservedIPs: 10, utilizationPercent: 80, status: 'warning', trend: 'up', purpose: 'production', connectedResources: 12, utilizationHistory: [70, 72, 74, 75, 76, 77, 78, 79, 80], lastUpdated: new Date() },
    { id: 's10', name: 'eu-prod-subnet', cidr: '10.156.0.0/20', region: 'europe-west1', vpc: 'adp-prod-vpc', totalIPs: 4094, usedIPs: 2456, availableIPs: 1538, reservedIPs: 100, utilizationPercent: 60, status: 'healthy', trend: 'up', purpose: 'production', connectedResources: 89, utilizationHistory: [50, 52, 54, 55, 56, 57, 58, 59, 60], lastUpdated: new Date() },
  ];
  
  return subnets;
}

function generateVPCUtilization(subnets: Subnet[]): VPCUtilization[] {
  const vpcMap = new Map<string, VPCUtilization>();
  
  subnets.forEach(subnet => {
    if (!vpcMap.has(subnet.vpc)) {
      vpcMap.set(subnet.vpc, {
        vpc: subnet.vpc,
        totalSubnets: 0,
        totalIPs: 0,
        usedIPs: 0,
        utilizationPercent: 0,
        criticalSubnets: 0,
        warningSubnets: 0,
      });
    }
    
    const vpc = vpcMap.get(subnet.vpc)!;
    vpc.totalSubnets++;
    vpc.totalIPs += subnet.totalIPs;
    vpc.usedIPs += subnet.usedIPs;
    if (subnet.status === 'critical') vpc.criticalSubnets++;
    if (subnet.status === 'warning') vpc.warningSubnets++;
  });
  
  vpcMap.forEach(vpc => {
    vpc.utilizationPercent = Math.round((vpc.usedIPs / vpc.totalIPs) * 100);
  });
  
  return Array.from(vpcMap.values());
}

function generateCapacityAlerts(subnets: Subnet[]): CapacityAlert[] {
  return subnets
    .filter(s => s.status === 'critical' || s.status === 'warning')
    .map((subnet, idx) => ({
      id: `alert-${idx}`,
      subnetId: subnet.id,
      subnetName: subnet.name,
      vpc: subnet.vpc,
      severity: subnet.status as 'warning' | 'critical',
      message: subnet.status === 'critical' 
        ? `Subnet ${subnet.name} is at ${subnet.utilizationPercent}% capacity. Immediate action required.`
        : `Subnet ${subnet.name} is approaching capacity at ${subnet.utilizationPercent}%.`,
      utilizationPercent: subnet.utilizationPercent,
      projectedExhaustion: subnet.trend === 'up' 
        ? `${Math.floor(Math.random() * 14) + 1} days` 
        : 'Stable',
      timestamp: new Date(Date.now() - Math.random() * 3600000),
    }));
}

// Initialize mock data
const mockSubnets = generateMockSubnets();
const mockVPCUtilization = generateVPCUtilization(mockSubnets);
const mockAlerts = generateCapacityAlerts(mockSubnets);

// Helper functions
const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    case 'warning': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400';
    case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
  }
};

const getUtilizationColor = (percent: number) => {
  if (percent >= 85) return 'bg-red-500';
  if (percent >= 70) return 'bg-amber-500';
  return 'bg-green-500';
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up': return <ArrowUpRight className="h-4 w-4 text-red-500" />;
    case 'down': return <ArrowDownRight className="h-4 w-4 text-green-500" />;
    default: return <Minus className="h-4 w-4 text-gray-500" />;
  }
};

const formatNumber = (n: number) => n.toLocaleString();

// Chart configurations
const createTrendChartData = (subnet: Subnet) => ({
  labels: ['8 days ago', '7 days ago', '6 days ago', '5 days ago', '4 days ago', '3 days ago', '2 days ago', 'Yesterday', 'Today'],
  datasets: [{
    label: 'Utilization %',
    data: subnet.utilizationHistory,
    borderColor: subnet.status === 'critical' ? '#ef4444' : subnet.status === 'warning' ? '#f59e0b' : '#22c55e',
    backgroundColor: subnet.status === 'critical' ? 'rgba(239, 68, 68, 0.1)' : subnet.status === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)',
    fill: true,
    tension: 0.4,
  }],
});

const vpcChartData = {
  labels: mockVPCUtilization.map(v => v.vpc.replace('adp-', '').replace('-vpc', '')),
  datasets: [{
    label: 'IP Utilization %',
    data: mockVPCUtilization.map(v => v.utilizationPercent),
    backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'],
    borderRadius: 6,
  }],
};

const ipDistributionData = {
  labels: ['Used', 'Available', 'Reserved'],
  datasets: [{
    data: [
      mockSubnets.reduce((sum, s) => sum + s.usedIPs, 0),
      mockSubnets.reduce((sum, s) => sum + s.availableIPs, 0),
      mockSubnets.reduce((sum, s) => sum + s.reservedIPs, 0),
    ],
    backgroundColor: ['#3b82f6', '#22c55e', '#6b7280'],
  }],
};

// Main component
export default function SubnetUtilization() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVpc, setSelectedVpc] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSubnet, setSelectedSubnet] = useState<Subnet | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Filtered subnets
  const filteredSubnets = useMemo(() => {
    return mockSubnets.filter(subnet => {
      const matchesSearch = subnet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           subnet.cidr.includes(searchQuery) ||
                           subnet.region.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesVpc = selectedVpc === 'all' || subnet.vpc === selectedVpc;
      const matchesStatus = selectedStatus === 'all' || subnet.status === selectedStatus;
      return matchesSearch && matchesVpc && matchesStatus;
    });
  }, [searchQuery, selectedVpc, selectedStatus]);

  // Summary stats
  const summaryStats = useMemo(() => ({
    totalSubnets: mockSubnets.length,
    totalIPs: mockSubnets.reduce((sum, s) => sum + s.totalIPs, 0),
    usedIPs: mockSubnets.reduce((sum, s) => sum + s.usedIPs, 0),
    availableIPs: mockSubnets.reduce((sum, s) => sum + s.availableIPs, 0),
    criticalCount: mockSubnets.filter(s => s.status === 'critical').length,
    warningCount: mockSubnets.filter(s => s.status === 'warning').length,
    healthyCount: mockSubnets.filter(s => s.status === 'healthy').length,
  }), []);

  const uniqueVpcs = [...new Set(mockSubnets.map(s => s.vpc))];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Network className="h-8 w-8 text-primary" />
              Subnet Utilization
            </h1>
            <p className="text-muted-foreground mt-1">
              IP allocation tracking and capacity monitoring across all subnets
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Capacity Alerts */}
        {mockAlerts.length > 0 && (
          <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-900/20">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-400">
              Capacity Alerts ({mockAlerts.filter(a => a.severity === 'critical').length} critical, {mockAlerts.filter(a => a.severity === 'warning').length} warning)
            </AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              <div className="mt-2 space-y-1">
                {mockAlerts.slice(0, 3).map(alert => (
                  <div key={alert.id} className="flex items-center gap-2 text-sm">
                    {alert.severity === 'critical' ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                    <span>{alert.message}</span>
                    {alert.projectedExhaustion !== 'Stable' && (
                      <Badge variant="outline" className="ml-2">Est. exhaustion: {alert.projectedExhaustion}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Subnets</p>
                  <p className="text-2xl font-bold">{summaryStats.totalSubnets}</p>
                </div>
                <Layers className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total IPs</p>
                  <p className="text-2xl font-bold">{formatNumber(summaryStats.totalIPs)}</p>
                </div>
                <Globe className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Used IPs</p>
                  <p className="text-2xl font-bold">{formatNumber(summaryStats.usedIPs)}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold text-green-600">{formatNumber(summaryStats.availableIPs)}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical</p>
                  <p className="text-2xl font-bold text-red-600">{summaryStats.criticalCount}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Warning</p>
                  <p className="text-2xl font-bold text-amber-600">{summaryStats.warningCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-amber-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="overview" className="gap-2">
              <PieChart className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="subnets" className="gap-2">
              <Layers className="h-4 w-4" />
              Subnets
            </TabsTrigger>
            <TabsTrigger value="vpcs" className="gap-2">
              <Network className="h-4 w-4" />
              VPCs
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* IP Distribution Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    IP Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <Doughnut
                      data={ipDistributionData}
                      options={{
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' } }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* VPC Utilization Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    VPC Utilization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Bar
                      data={vpcChartData}
                      options={{
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { max: 100, title: { display: true, text: 'Utilization %' } } }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Utilized Subnets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Highest Utilized Subnets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockSubnets
                    .sort((a, b) => b.utilizationPercent - a.utilizationPercent)
                    .slice(0, 5)
                    .map(subnet => (
                      <div key={subnet.id} className="flex items-center gap-4">
                        <div className="w-48 truncate">
                          <p className="font-medium truncate">{subnet.name}</p>
                          <p className="text-xs text-muted-foreground">{subnet.cidr}</p>
                        </div>
                        <div className="flex-1">
                          <Progress
                            value={subnet.utilizationPercent}
                            className={cn("h-3", getUtilizationColor(subnet.utilizationPercent))}
                          />
                        </div>
                        <div className="w-20 text-right">
                          <span className={cn(
                            "font-medium",
                            subnet.utilizationPercent >= 85 ? "text-red-600" :
                            subnet.utilizationPercent >= 70 ? "text-amber-600" : "text-green-600"
                          )}>
                            {subnet.utilizationPercent}%
                          </span>
                        </div>
                        <div className="w-24">
                          <Badge className={getStatusColor(subnet.status)}>{subnet.status}</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subnets Tab */}
          <TabsContent value="subnets" className="space-y-4 mt-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, CIDR, or region..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={selectedVpc} onValueChange={setSelectedVpc}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by VPC" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All VPCs</SelectItem>
                  {uniqueVpcs.map(vpc => (
                    <SelectItem key={vpc} value={vpc}>{vpc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subnet Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSubnets.map(subnet => (
                <motion.div
                  key={subnet.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedSubnet(subnet)}
                  className="cursor-pointer"
                >
                  <Card className={cn(
                    "transition-all hover:shadow-lg border-l-4",
                    subnet.status === 'critical' && 'border-l-red-500',
                    subnet.status === 'warning' && 'border-l-amber-500',
                    subnet.status === 'healthy' && 'border-l-green-500',
                  )}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base truncate">{subnet.name}</CardTitle>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(subnet.trend)}
                          <Badge className={getStatusColor(subnet.status)} variant="secondary">
                            {subnet.status}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-1 rounded">{subnet.cidr}</code>
                        <span className="text-xs">{subnet.region}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Utilization</span>
                            <span className="font-medium">{subnet.utilizationPercent}%</span>
                          </div>
                          <Progress value={subnet.utilizationPercent} className="h-2" />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div>
                            <p className="text-muted-foreground">Used</p>
                            <p className="font-medium text-blue-600">{formatNumber(subnet.usedIPs)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Available</p>
                            <p className="font-medium text-green-600">{formatNumber(subnet.availableIPs)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Resources</p>
                            <p className="font-medium">{subnet.connectedResources}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* VPCs Tab */}
          <TabsContent value="vpcs" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockVPCUtilization.map(vpc => (
                <Card key={vpc.vpc}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Network className="h-5 w-5 text-primary" />
                        {vpc.vpc}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {vpc.criticalSubnets > 0 && (
                          <Badge variant="destructive">{vpc.criticalSubnets} critical</Badge>
                        )}
                        {vpc.warningSubnets > 0 && (
                          <Badge className="bg-amber-500">{vpc.warningSubnets} warning</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Overall Utilization</span>
                          <span className={cn(
                            "font-medium",
                            vpc.utilizationPercent >= 85 ? "text-red-600" :
                            vpc.utilizationPercent >= 70 ? "text-amber-600" : "text-green-600"
                          )}>
                            {vpc.utilizationPercent}%
                          </span>
                        </div>
                        <Progress value={vpc.utilizationPercent} className="h-3" />
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-2 bg-muted rounded-lg">
                          <p className="text-2xl font-bold">{vpc.totalSubnets}</p>
                          <p className="text-xs text-muted-foreground">Subnets</p>
                        </div>
                        <div className="p-2 bg-muted rounded-lg">
                          <p className="text-2xl font-bold">{formatNumber(vpc.totalIPs)}</p>
                          <p className="text-xs text-muted-foreground">Total IPs</p>
                        </div>
                        <div className="p-2 bg-muted rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{formatNumber(vpc.usedIPs)}</p>
                          <p className="text-xs text-muted-foreground">Used IPs</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Subnet Detail Modal */}
        {selectedSubnet && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedSubnet(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Wifi className="h-5 w-5" />
                        {selectedSubnet.name}
                      </CardTitle>
                      <CardDescription>{selectedSubnet.cidr} • {selectedSubnet.region} • {selectedSubnet.vpc}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedSubnet(null)}>
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{formatNumber(selectedSubnet.totalIPs)}</p>
                      <p className="text-xs text-muted-foreground">Total IPs</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{formatNumber(selectedSubnet.usedIPs)}</p>
                      <p className="text-xs text-muted-foreground">Used</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{formatNumber(selectedSubnet.availableIPs)}</p>
                      <p className="text-xs text-muted-foreground">Available</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{selectedSubnet.connectedResources}</p>
                      <p className="text-xs text-muted-foreground">Resources</p>
                    </div>
                  </div>
                  <div className="h-48">
                    <p className="text-sm font-medium mb-2">Utilization Trend (Last 9 Days)</p>
                    <Line
                      data={createTrendChartData(selectedSubnet)}
                      options={{
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { min: 0, max: 100 } }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

