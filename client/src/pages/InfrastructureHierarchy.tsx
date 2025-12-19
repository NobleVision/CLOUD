import { useState, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Network, Globe, Server, AlertTriangle, CheckCircle, Activity,
  Search, ChevronRight, ChevronDown, Cpu, HardDrive, Wifi,
  Database, Cloud, Layers, Box, Download, Share2, RefreshCw,
  ArrowLeft, ZoomIn, ZoomOut, Maximize2, Info, AlertCircle,
  TrendingUp, TrendingDown, Minus, BarChart3, ExternalLink, X
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

// Types
interface VMMetrics {
  cpu: number;
  memory: number;
  diskRead: number;
  diskWrite: number;
  networkIn: number;
  networkOut: number;
  cpuHistory: number[];
  memoryHistory: number[];
}

interface VM {
  id: string;
  name: string;
  machineType: string;
  zone: string;
  status: 'running' | 'stopped' | 'terminated' | 'provisioning';
  internalIP: string;
  externalIP?: string;
  metrics: VMMetrics;
  labels: Record<string, string>;
  alerts: { severity: 'warning' | 'critical'; message: string }[];
}

interface Subnet {
  id: string;
  name: string;
  cidr: string;
  region: string;
  utilizationPercent: number;
  vms: VM[];
  status: 'healthy' | 'warning' | 'critical';
}

interface VPC {
  id: string;
  name: string;
  project: string;
  region: string;
  subnets: Subnet[];
  totalVMs: number;
  totalSubnets: number;
  status: 'healthy' | 'warning' | 'critical';
  firewallRules: number;
  routes: number;
}

// Mock data generators
function generateMockVMs(count: number): VM[] {
  const machineTypes = ['n2-standard-2', 'n2-standard-4', 'n2-standard-8', 'e2-medium', 'e2-small'];
  const zones = ['us-central1-a', 'us-central1-b', 'us-central1-c'];
  const statuses: VM['status'][] = ['running', 'running', 'running', 'stopped', 'running'];
  
  return Array.from({ length: count }, (_, i) => {
    const cpu = Math.floor(Math.random() * 80) + 10;
    const memory = Math.floor(Math.random() * 70) + 20;
    const hasAlerts = Math.random() > 0.8;
    
    return {
      id: `vm-${i + 1}`,
      name: `adp-${['web', 'api', 'worker', 'db', 'cache'][i % 5]}-${Math.floor(i / 5) + 1}`,
      machineType: machineTypes[Math.floor(Math.random() * machineTypes.length)],
      zone: zones[Math.floor(Math.random() * zones.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      internalIP: `10.128.${Math.floor(i / 256)}.${i % 256}`,
      externalIP: Math.random() > 0.7 ? `35.192.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}` : undefined,
      metrics: {
        cpu,
        memory,
        diskRead: Math.floor(Math.random() * 100),
        diskWrite: Math.floor(Math.random() * 80),
        networkIn: Math.floor(Math.random() * 500),
        networkOut: Math.floor(Math.random() * 300),
        cpuHistory: Array.from({ length: 12 }, () => Math.floor(Math.random() * 40) + cpu - 20).map(v => Math.max(0, Math.min(100, v))),
        memoryHistory: Array.from({ length: 12 }, () => Math.floor(Math.random() * 20) + memory - 10).map(v => Math.max(0, Math.min(100, v))),
      },
      labels: {
        environment: ['prod', 'staging', 'dev'][Math.floor(Math.random() * 3)],
        team: ['platform', 'backend', 'frontend', 'data'][Math.floor(Math.random() * 4)],
      },
      alerts: hasAlerts ? [
        { severity: cpu > 80 ? 'critical' as const : 'warning' as const, message: cpu > 80 ? 'High CPU usage detected' : 'Memory usage approaching limit' }
      ] : [],
    };
  });
}

function generateMockHierarchy(): VPC[] {
  const vpcs: VPC[] = [
    {
      id: 'vpc-1',
      name: 'adp-prod-vpc',
      project: 'adp-pharmacy-prod',
      region: 'us-central1',
      subnets: [
        { id: 'subnet-1', name: 'prod-api-subnet', cidr: '10.128.0.0/20', region: 'us-central1', utilizationPercent: 85, vms: generateMockVMs(12), status: 'warning' },
        { id: 'subnet-2', name: 'prod-web-subnet', cidr: '10.128.16.0/20', region: 'us-central1', utilizationPercent: 65, vms: generateMockVMs(8), status: 'healthy' },
        { id: 'subnet-3', name: 'prod-db-subnet', cidr: '10.128.32.0/24', region: 'us-central1', utilizationPercent: 45, vms: generateMockVMs(4), status: 'healthy' },
      ],
      totalVMs: 24,
      totalSubnets: 3,
      status: 'warning',
      firewallRules: 45,
      routes: 12,
    },
    {
      id: 'vpc-2',
      name: 'adp-staging-vpc',
      project: 'adp-pharmacy-staging',
      region: 'us-east1',
      subnets: [
        { id: 'subnet-4', name: 'staging-subnet', cidr: '10.132.0.0/20', region: 'us-east1', utilizationPercent: 35, vms: generateMockVMs(6), status: 'healthy' },
      ],
      totalVMs: 6,
      totalSubnets: 1,
      status: 'healthy',
      firewallRules: 15,
      routes: 5,
    },
    {
      id: 'vpc-3',
      name: 'adp-dev-vpc',
      project: 'adp-pharmacy-dev',
      region: 'us-west1',
      subnets: [
        { id: 'subnet-5', name: 'dev-subnet', cidr: '10.136.0.0/20', region: 'us-west1', utilizationPercent: 20, vms: generateMockVMs(5), status: 'healthy' },
      ],
      totalVMs: 5,
      totalSubnets: 1,
      status: 'healthy',
      firewallRules: 10,
      routes: 4,
    },
  ];
  
  return vpcs;
}

// Initialize mock data
const mockHierarchy = generateMockHierarchy();

// Helper functions
const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy':
    case 'running': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    case 'warning': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400';
    case 'critical':
    case 'stopped':
    case 'terminated': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
  }
};

const getMetricColor = (value: number) => {
  if (value >= 80) return 'text-red-600';
  if (value >= 60) return 'text-amber-600';
  return 'text-green-600';
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B/s`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
};

// Breadcrumb type
type BreadcrumbItem = { type: 'root' } | { type: 'vpc'; vpc: VPC } | { type: 'subnet'; vpc: VPC; subnet: Subnet } | { type: 'vm'; vpc: VPC; subnet: Subnet; vm: VM };

// Search result type
interface SearchResult {
  type: 'vpc' | 'subnet' | 'vm';
  id: string;
  name: string;
  path: string;
  matchField: string;
  matchValue: string;
  vpc: VPC;
  subnet?: Subnet;
  vm?: VM;
}

// Global search function
function searchInfrastructure(query: string, hierarchy: VPC[]): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  for (const vpc of hierarchy) {
    // Search VPC
    if (vpc.name.toLowerCase().includes(lowerQuery) ||
        vpc.id.toLowerCase().includes(lowerQuery) ||
        vpc.project.toLowerCase().includes(lowerQuery)) {
      results.push({
        type: 'vpc',
        id: vpc.id,
        name: vpc.name,
        path: vpc.name,
        matchField: vpc.name.toLowerCase().includes(lowerQuery) ? 'name' :
                    vpc.id.toLowerCase().includes(lowerQuery) ? 'id' : 'project',
        matchValue: vpc.name.toLowerCase().includes(lowerQuery) ? vpc.name :
                    vpc.id.toLowerCase().includes(lowerQuery) ? vpc.id : vpc.project,
        vpc,
      });
    }

    for (const subnet of vpc.subnets) {
      // Search Subnet
      if (subnet.name.toLowerCase().includes(lowerQuery) ||
          subnet.id.toLowerCase().includes(lowerQuery) ||
          subnet.cidr.includes(lowerQuery)) {
        results.push({
          type: 'subnet',
          id: subnet.id,
          name: subnet.name,
          path: `${vpc.name} → ${subnet.name}`,
          matchField: subnet.name.toLowerCase().includes(lowerQuery) ? 'name' :
                      subnet.id.toLowerCase().includes(lowerQuery) ? 'id' : 'cidr',
          matchValue: subnet.name.toLowerCase().includes(lowerQuery) ? subnet.name :
                      subnet.id.toLowerCase().includes(lowerQuery) ? subnet.id : subnet.cidr,
          vpc,
          subnet,
        });
      }

      for (const vm of subnet.vms) {
        // Search VM by name, id, IP, or labels
        const labelMatch = Object.entries(vm.labels).find(
          ([key, val]) => key.toLowerCase().includes(lowerQuery) || val.toLowerCase().includes(lowerQuery)
        );

        if (vm.name.toLowerCase().includes(lowerQuery) ||
            vm.id.toLowerCase().includes(lowerQuery) ||
            vm.internalIP.includes(lowerQuery) ||
            (vm.externalIP && vm.externalIP.includes(lowerQuery)) ||
            labelMatch) {
          let matchField = 'name';
          let matchValue = vm.name;

          if (vm.name.toLowerCase().includes(lowerQuery)) {
            matchField = 'name';
            matchValue = vm.name;
          } else if (vm.id.toLowerCase().includes(lowerQuery)) {
            matchField = 'id';
            matchValue = vm.id;
          } else if (vm.internalIP.includes(lowerQuery)) {
            matchField = 'internalIP';
            matchValue = vm.internalIP;
          } else if (vm.externalIP && vm.externalIP.includes(lowerQuery)) {
            matchField = 'externalIP';
            matchValue = vm.externalIP;
          } else if (labelMatch) {
            matchField = `label:${labelMatch[0]}`;
            matchValue = labelMatch[1];
          }

          results.push({
            type: 'vm',
            id: vm.id,
            name: vm.name,
            path: `${vpc.name} → ${subnet.name} → ${vm.name}`,
            matchField,
            matchValue,
            vpc,
            subnet,
            vm,
          });
        }
      }
    }
  }

  return results;
}

// Main component
export default function InfrastructureHierarchy() {
  const [searchQuery, setSearchQuery] = useState('');
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([{ type: 'root' }]);
  const [expandedVPCs, setExpandedVPCs] = useState<Set<string>>(new Set());
  const [expandedSubnets, setExpandedSubnets] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [searchFilter, setSearchFilter] = useState<'all' | 'vpc' | 'subnet' | 'vm'>('all');

  const currentView = breadcrumb[breadcrumb.length - 1];

  // Compute search results
  const searchResults = useMemo(() => {
    const results = searchInfrastructure(searchQuery, mockHierarchy);
    if (searchFilter === 'all') return results;
    return results.filter(r => r.type === searchFilter);
  }, [searchQuery, searchFilter]);

  const navigateTo = (item: BreadcrumbItem) => {
    setSearchQuery(''); // Clear search when navigating
    setIsSearching(false);
    if (item.type === 'root') {
      setBreadcrumb([{ type: 'root' }]);
    } else if (item.type === 'vpc') {
      setBreadcrumb([{ type: 'root' }, item]);
    } else if (item.type === 'subnet') {
      setBreadcrumb([{ type: 'root' }, { type: 'vpc', vpc: item.vpc }, item]);
    } else if (item.type === 'vm') {
      setBreadcrumb([{ type: 'root' }, { type: 'vpc', vpc: item.vpc }, { type: 'subnet', vpc: item.vpc, subnet: item.subnet }, item]);
    }
  };

  const goBack = () => {
    if (breadcrumb.length > 1) {
      setBreadcrumb(breadcrumb.slice(0, -1));
    }
  };

  const handleSearchResultClick = (result: SearchResult) => {
    if (result.type === 'vpc') {
      navigateTo({ type: 'vpc', vpc: result.vpc });
    } else if (result.type === 'subnet' && result.subnet) {
      navigateTo({ type: 'subnet', vpc: result.vpc, subnet: result.subnet });
    } else if (result.type === 'vm' && result.subnet && result.vm) {
      navigateTo({ type: 'vm', vpc: result.vpc, subnet: result.subnet, vm: result.vm });
    }
  };

  const toggleVPC = (vpcId: string) => {
    const newExpanded = new Set(expandedVPCs);
    if (newExpanded.has(vpcId)) {
      newExpanded.delete(vpcId);
    } else {
      newExpanded.add(vpcId);
    }
    setExpandedVPCs(newExpanded);
  };

  const toggleSubnet = (subnetId: string) => {
    const newExpanded = new Set(expandedSubnets);
    if (newExpanded.has(subnetId)) {
      newExpanded.delete(subnetId);
    } else {
      newExpanded.add(subnetId);
    }
    setExpandedSubnets(newExpanded);
  };

  const exportTopology = () => {
    const data = JSON.stringify(mockHierarchy, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'infrastructure-topology.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render breadcrumb
  const renderBreadcrumb = () => (
    <div className="flex items-center gap-2 text-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigateTo({ type: 'root' })}
        className={cn(currentView.type === 'root' && 'font-bold')}
      >
        <Cloud className="h-4 w-4 mr-1" />
        Infrastructure
      </Button>
      {breadcrumb.slice(1).map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateTo(item)}
            className={cn(idx === breadcrumb.length - 2 && 'font-bold')}
          >
            {item.type === 'vpc' && <Network className="h-4 w-4 mr-1" />}
            {item.type === 'subnet' && <Layers className="h-4 w-4 mr-1" />}
            {item.type === 'vm' && <Server className="h-4 w-4 mr-1" />}
            {item.type === 'vpc' && item.vpc.name}
            {item.type === 'subnet' && item.subnet.name}
            {item.type === 'vm' && item.vm.name}
          </Button>
        </div>
      ))}
    </div>
  );

  // Render VM detail view
  const renderVMDetail = (vm: VM, vpc: VPC, subnet: Subnet) => {
    const cpuChartData = {
      labels: ['12m', '11m', '10m', '9m', '8m', '7m', '6m', '5m', '4m', '3m', '2m', '1m'],
      datasets: [{
        label: 'CPU %',
        data: vm.metrics.cpuHistory,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      }],
    };

    const memoryChartData = {
      labels: ['12m', '11m', '10m', '9m', '8m', '7m', '6m', '5m', '4m', '3m', '2m', '1m'],
      datasets: [{
        label: 'Memory %',
        data: vm.metrics.memoryHistory,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
      }],
    };

    return (
      <div className="space-y-6">
        {/* VM Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center",
                  vm.status === 'running' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                )}>
                  <Server className={cn("h-6 w-6", vm.status === 'running' ? 'text-green-600' : 'text-red-600')} />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {vm.name}
                    <Badge className={getStatusColor(vm.status)}>{vm.status}</Badge>
                  </CardTitle>
                  <CardDescription>{vm.machineType} • {vm.zone}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  GCP Console
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Internal IP</p>
                <code className="text-sm font-mono">{vm.internalIP}</code>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">External IP</p>
                <code className="text-sm font-mono">{vm.externalIP || 'None'}</code>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Environment</p>
                <Badge variant="outline">{vm.labels.environment}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Team</p>
                <Badge variant="outline">{vm.labels.team}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        {vm.alerts.length > 0 && (
          <Card className="border-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vm.alerts.map((alert, idx) => (
                <div key={idx} className={cn(
                  "p-3 rounded-lg flex items-center gap-2",
                  alert.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
                )}>
                  <AlertCircle className={cn("h-5 w-5", alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500')} />
                  <span>{alert.message}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">CPU</span>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className={cn("text-2xl font-bold", getMetricColor(vm.metrics.cpu))}>{vm.metrics.cpu}%</p>
              <Progress value={vm.metrics.cpu} className="h-2 mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Memory</span>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className={cn("text-2xl font-bold", getMetricColor(vm.metrics.memory))}>{vm.metrics.memory}%</p>
              <Progress value={vm.metrics.memory} className="h-2 mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Network In</span>
                <Wifi className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{formatBytes(vm.metrics.networkIn * 1024)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Network Out</span>
                <Wifi className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{formatBytes(vm.metrics.networkOut * 1024)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">CPU Usage (Last 12 min)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <Line data={cpuChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Memory Usage (Last 12 min)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <Line data={memoryChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Render subnet detail view
  const renderSubnetDetail = (subnet: Subnet, vpc: VPC) => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                subnet.status === 'healthy' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
              )}>
                <Layers className={cn("h-6 w-6", subnet.status === 'healthy' ? 'text-green-600' : 'text-amber-600')} />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {subnet.name}
                  <Badge className={getStatusColor(subnet.status)}>{subnet.status}</Badge>
                </CardTitle>
                <CardDescription>{subnet.cidr} • {subnet.region}</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">{subnet.vms.length}</p>
              <p className="text-sm text-muted-foreground">VMs</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">{subnet.utilizationPercent}%</p>
              <p className="text-sm text-muted-foreground">IP Utilization</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">{subnet.vms.filter(v => v.status === 'running').length}</p>
              <p className="text-sm text-muted-foreground">Running</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Virtual Machines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {subnet.vms.map(vm => (
              <motion.div
                key={vm.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => navigateTo({ type: 'vm', vpc, subnet, vm })}
                className="p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Server className={cn("h-5 w-5", vm.status === 'running' ? 'text-green-600' : 'text-red-600')} />
                    <div>
                      <p className="font-medium">{vm.name}</p>
                      <p className="text-sm text-muted-foreground">{vm.machineType} • {vm.internalIP}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className={getMetricColor(vm.metrics.cpu)}>CPU: {vm.metrics.cpu}%</p>
                      <p className={getMetricColor(vm.metrics.memory)}>Mem: {vm.metrics.memory}%</p>
                    </div>
                    <Badge className={getStatusColor(vm.status)}>{vm.status}</Badge>
                    {vm.alerts.length > 0 && (
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render VPC detail view
  const renderVPCDetail = (vpc: VPC) => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                vpc.status === 'healthy' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
              )}>
                <Network className={cn("h-6 w-6", vpc.status === 'healthy' ? 'text-green-600' : 'text-amber-600')} />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {vpc.name}
                  <Badge className={getStatusColor(vpc.status)}>{vpc.status}</Badge>
                </CardTitle>
                <CardDescription>{vpc.project} • {vpc.region}</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">{vpc.totalSubnets}</p>
              <p className="text-sm text-muted-foreground">Subnets</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">{vpc.totalVMs}</p>
              <p className="text-sm text-muted-foreground">VMs</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">{vpc.firewallRules}</p>
              <p className="text-sm text-muted-foreground">Firewall Rules</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">{vpc.routes}</p>
              <p className="text-sm text-muted-foreground">Routes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subnets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {vpc.subnets.map(subnet => (
              <motion.div
                key={subnet.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => navigateTo({ type: 'subnet', vpc, subnet })}
                className="p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Layers className={cn("h-5 w-5", subnet.status === 'healthy' ? 'text-green-600' : 'text-amber-600')} />
                    <div>
                      <p className="font-medium">{subnet.name}</p>
                      <p className="text-sm text-muted-foreground">{subnet.cidr} • {subnet.region}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p>{subnet.vms.length} VMs</p>
                      <p className="text-muted-foreground">{subnet.utilizationPercent}% utilized</p>
                    </div>
                    <Badge className={getStatusColor(subnet.status)}>{subnet.status}</Badge>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render root view (all VPCs)
  const renderRootView = () => (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">VPCs</p>
                <p className="text-2xl font-bold">{mockHierarchy.length}</p>
              </div>
              <Network className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Subnets</p>
                <p className="text-2xl font-bold">{mockHierarchy.reduce((sum, v) => sum + v.totalSubnets, 0)}</p>
              </div>
              <Layers className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">VMs</p>
                <p className="text-2xl font-bold">{mockHierarchy.reduce((sum, v) => sum + v.totalVMs, 0)}</p>
              </div>
              <Server className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-amber-600">{mockHierarchy.filter(v => v.status === 'warning').length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* VPC List */}
      <Card>
        <CardHeader>
          <CardTitle>Virtual Private Clouds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockHierarchy.map(vpc => (
              <motion.div
                key={vpc.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => navigateTo({ type: 'vpc', vpc })}
                className="p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Network className={cn("h-6 w-6", vpc.status === 'healthy' ? 'text-green-600' : 'text-amber-600')} />
                    <div>
                      <p className="font-medium">{vpc.name}</p>
                      <p className="text-sm text-muted-foreground">{vpc.project} • {vpc.region}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p>{vpc.totalSubnets} subnets • {vpc.totalVMs} VMs</p>
                      <p className="text-muted-foreground">{vpc.firewallRules} firewall rules</p>
                    </div>
                    <Badge className={getStatusColor(vpc.status)}>{vpc.status}</Badge>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Layers className="h-8 w-8 text-primary" />
              Infrastructure Hierarchy
            </h1>
            <p className="text-muted-foreground mt-1">
              Navigate through VPCs, subnets, and VMs with contextual metrics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={exportTopology}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Global Search */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search VPCs, subnets, VMs by name, IP, ID, or labels..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearching(e.target.value.length > 0);
                    }}
                    className="pl-10"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => {
                        setSearchQuery('');
                        setIsSearching(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {isSearching && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Filter:</span>
                    {(['all', 'vpc', 'subnet', 'vm'] as const).map((filter) => (
                      <Button
                        key={filter}
                        variant={searchFilter === filter ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSearchFilter(filter)}
                      >
                        {filter === 'all' ? 'All' : filter.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Results */}
              {isSearching && searchResults.length > 0 && (
                <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                  {searchResults.map((result) => (
                    <motion.div
                      key={`${result.type}-${result.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleSearchResultClick(result)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            result.type === 'vpc' ? 'bg-blue-100 dark:bg-blue-900/30' :
                            result.type === 'subnet' ? 'bg-purple-100 dark:bg-purple-900/30' :
                            'bg-green-100 dark:bg-green-900/30'
                          )}>
                            {result.type === 'vpc' && <Network className="h-4 w-4 text-blue-600" />}
                            {result.type === 'subnet' && <Layers className="h-4 w-4 text-purple-600" />}
                            {result.type === 'vm' && <Server className="h-4 w-4 text-green-600" />}
                          </div>
                          <div>
                            <p className="font-medium">{result.name}</p>
                            <p className="text-sm text-muted-foreground">{result.path}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {result.matchField}: {result.matchValue}
                          </Badge>
                          <Badge className={cn(
                            result.type === 'vpc' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            result.type === 'subnet' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          )}>
                            {result.type.toUpperCase()}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {isSearching && searchResults.length === 0 && searchQuery.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No results found for "{searchQuery}"</p>
                  <p className="text-sm">Try searching by name, IP address, ID, or labels</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Breadcrumb Navigation */}
        {!isSearching && (
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                {renderBreadcrumb()}
                {breadcrumb.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={goBack}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {!isSearching && (
          <AnimatePresence mode="wait">
            <motion.div
              key={JSON.stringify(currentView)}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentView.type === 'root' && renderRootView()}
              {currentView.type === 'vpc' && renderVPCDetail(currentView.vpc)}
              {currentView.type === 'subnet' && renderSubnetDetail(currentView.subnet, currentView.vpc)}
              {currentView.type === 'vm' && renderVMDetail(currentView.vm, currentView.vpc, currentView.subnet)}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </DashboardLayout>
  );
}

