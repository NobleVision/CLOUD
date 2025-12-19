import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronRight, ChevronDown, Server, Database, HardDrive, Network, Cpu, MemoryStick, Container, Globe, ArrowLeft, Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Level 1: Overall Infrastructure
interface InfrastructureCategory {
  id: string;
  name: string;
  icon: any;
  status: 'healthy' | 'warning' | 'critical';
  metrics: { cpu: number; memory: number; network: number };
  projectCount: number;
  resourceCount: number;
}

// Level 2: Projects/VPCs
interface Project {
  id: string;
  name: string;
  environment: 'prod' | 'staging' | 'dev';
  region: string;
  status: 'healthy' | 'warning' | 'critical';
  metrics: { cpu: number; memory: number; network: number; cost: number };
  resourceCount: number;
  nccConnected: boolean;
}

// Level 3: Resources
interface Resource {
  id: string;
  name: string;
  type: 'vm' | 'gke' | 'container' | 'storage' | 'database';
  status: 'running' | 'stopped' | 'warning' | 'error';
  metrics: { cpu: number; memory: number; disk: number; network: number };
  ipAddress: string;
  zone: string;
}

const infrastructureCategories: InfrastructureCategory[] = [
  { id: 'compute', name: 'Compute Engine', icon: Server, status: 'healthy', metrics: { cpu: 65, memory: 72, network: 45 }, projectCount: 8, resourceCount: 156 },
  { id: 'gke', name: 'Kubernetes Engine', icon: Container, status: 'warning', metrics: { cpu: 78, memory: 85, network: 62 }, projectCount: 5, resourceCount: 89 },
  { id: 'storage', name: 'Cloud Storage', icon: HardDrive, status: 'healthy', metrics: { cpu: 0, memory: 0, network: 35 }, projectCount: 12, resourceCount: 234 },
  { id: 'database', name: 'Cloud SQL', icon: Database, status: 'healthy', metrics: { cpu: 45, memory: 68, network: 28 }, projectCount: 6, resourceCount: 24 },
  { id: 'network', name: 'VPC Network', icon: Network, status: 'healthy', metrics: { cpu: 0, memory: 0, network: 55 }, projectCount: 4, resourceCount: 18 },
  { id: 'ncc', name: 'Network Connectivity', icon: Globe, status: 'healthy', metrics: { cpu: 0, memory: 0, network: 42 }, projectCount: 3, resourceCount: 12 },
];

const projects: Record<string, Project[]> = {
  compute: [
    { id: 'p1', name: 'adp-prod-api', environment: 'prod', region: 'us-central1', status: 'healthy', metrics: { cpu: 62, memory: 70, network: 45, cost: 4500 }, resourceCount: 24, nccConnected: true },
    { id: 'p2', name: 'adp-prod-web', environment: 'prod', region: 'us-east1', status: 'warning', metrics: { cpu: 82, memory: 78, network: 55, cost: 3200 }, resourceCount: 18, nccConnected: true },
    { id: 'p3', name: 'adp-staging-api', environment: 'staging', region: 'us-central1', status: 'healthy', metrics: { cpu: 35, memory: 45, network: 25, cost: 1200 }, resourceCount: 12, nccConnected: false },
    { id: 'p4', name: 'adp-dev-sandbox', environment: 'dev', region: 'us-west1', status: 'healthy', metrics: { cpu: 28, memory: 35, network: 15, cost: 450 }, resourceCount: 8, nccConnected: false },
  ],
  gke: [
    { id: 'p5', name: 'cvs-gke-prod', environment: 'prod', region: 'us-central1', status: 'warning', metrics: { cpu: 85, memory: 88, network: 65, cost: 8500 }, resourceCount: 45, nccConnected: true },
    { id: 'p6', name: 'cvs-gke-staging', environment: 'staging', region: 'us-east1', status: 'healthy', metrics: { cpu: 55, memory: 62, network: 40, cost: 2800 }, resourceCount: 28, nccConnected: true },
  ],
  storage: [
    { id: 'p7', name: 'cvs-data-lake', environment: 'prod', region: 'us-multi', status: 'healthy', metrics: { cpu: 0, memory: 0, network: 45, cost: 1800 }, resourceCount: 156, nccConnected: false },
  ],
  database: [
    { id: 'p8', name: 'cvs-sql-prod', environment: 'prod', region: 'us-central1', status: 'healthy', metrics: { cpu: 55, memory: 72, network: 35, cost: 3500 }, resourceCount: 8, nccConnected: true },
  ],
  network: [
    { id: 'p9', name: 'cvs-vpc-shared', environment: 'prod', region: 'global', status: 'healthy', metrics: { cpu: 0, memory: 0, network: 55, cost: 850 }, resourceCount: 12, nccConnected: true },
  ],
  ncc: [
    { id: 'p10', name: 'cvs-ncc-hub', environment: 'prod', region: 'global', status: 'healthy', metrics: { cpu: 0, memory: 0, network: 42, cost: 1200 }, resourceCount: 8, nccConnected: true },
  ],
};

const resources: Record<string, Resource[]> = {
  p1: [
    { id: 'r1', name: 'api-server-1', type: 'vm', status: 'running', metrics: { cpu: 65, memory: 72, disk: 45, network: 35 }, ipAddress: '10.128.0.15', zone: 'us-central1-a' },
    { id: 'r2', name: 'api-server-2', type: 'vm', status: 'running', metrics: { cpu: 58, memory: 68, disk: 42, network: 32 }, ipAddress: '10.128.0.16', zone: 'us-central1-b' },
    { id: 'r3', name: 'api-server-3', type: 'vm', status: 'warning', metrics: { cpu: 88, memory: 85, disk: 78, network: 55 }, ipAddress: '10.128.0.17', zone: 'us-central1-c' },
    { id: 'r4', name: 'cache-redis-1', type: 'vm', status: 'running', metrics: { cpu: 25, memory: 45, disk: 15, network: 28 }, ipAddress: '10.128.0.20', zone: 'us-central1-a' },
  ],
  p2: [
    { id: 'r5', name: 'web-frontend-1', type: 'vm', status: 'running', metrics: { cpu: 72, memory: 65, disk: 35, network: 48 }, ipAddress: '10.132.0.10', zone: 'us-east1-b' },
    { id: 'r6', name: 'web-frontend-2', type: 'vm', status: 'warning', metrics: { cpu: 92, memory: 88, disk: 55, network: 62 }, ipAddress: '10.132.0.11', zone: 'us-east1-c' },
  ],
  p5: [
    { id: 'r7', name: 'gke-node-pool-1', type: 'gke', status: 'running', metrics: { cpu: 78, memory: 82, disk: 45, network: 55 }, ipAddress: '10.140.0.5', zone: 'us-central1-a' },
    { id: 'r8', name: 'gke-node-pool-2', type: 'gke', status: 'warning', metrics: { cpu: 92, memory: 95, disk: 68, network: 72 }, ipAddress: '10.140.0.6', zone: 'us-central1-b' },
    { id: 'r9', name: 'payment-pod', type: 'container', status: 'running', metrics: { cpu: 55, memory: 62, disk: 25, network: 35 }, ipAddress: '10.140.1.15', zone: 'us-central1-a' },
    { id: 'r10', name: 'order-pod', type: 'container', status: 'running', metrics: { cpu: 48, memory: 55, disk: 22, network: 28 }, ipAddress: '10.140.1.16', zone: 'us-central1-b' },
  ],
};

const getStatusColor = (status: string) => {
  switch (status) { case 'healthy': case 'running': return 'text-green-600'; case 'warning': return 'text-amber-600'; default: return 'text-red-600'; }
};

const getStatusBg = (status: string) => {
  switch (status) { case 'healthy': case 'running': return 'bg-green-100 dark:bg-green-900/30'; case 'warning': return 'bg-amber-100 dark:bg-amber-900/30'; default: return 'bg-red-100 dark:bg-red-900/30'; }
};

const getTypeIcon = (type: string) => {
  switch (type) { case 'vm': return Server; case 'gke': return Container; case 'container': return Container; case 'storage': return HardDrive; default: return Database; }
};

export default function DrillDownMetrics() {
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const handleCategoryClick = (categoryId: string) => { setSelectedCategory(categoryId); setLevel(2); };
  const handleProjectClick = (projectId: string) => { setSelectedProject(projectId); setLevel(3); };
  const handleBack = () => { if (level === 3) { setSelectedProject(null); setLevel(2); } else if (level === 2) { setSelectedCategory(null); setLevel(1); } };

  const currentProjects = selectedCategory ? projects[selectedCategory] || [] : [];
  const currentResources = selectedProject ? resources[selectedProject] || [] : [];
  const currentCategory = infrastructureCategories.find(c => c.id === selectedCategory);
  const currentProject = currentProjects.find(p => p.id === selectedProject);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm">
          <Button variant="ghost" size="sm" onClick={() => { setLevel(1); setSelectedCategory(null); setSelectedProject(null); }} className={level === 1 ? 'font-bold' : ''}>Infrastructure</Button>
          {level >= 2 && currentCategory && (<><ChevronRight className="h-4 w-4" /><Button variant="ghost" size="sm" onClick={() => { setLevel(2); setSelectedProject(null); }} className={level === 2 ? 'font-bold' : ''}>{currentCategory.name}</Button></>)}
          {level === 3 && currentProject && (<><ChevronRight className="h-4 w-4" /><span className="font-bold">{currentProject.name}</span></>)}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {level === 1 ? 'Infrastructure Overview' : level === 2 ? currentCategory?.name : currentProject?.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              {level === 1 ? 'Click on a category to drill down' : level === 2 ? 'Click on a project to view resources' : 'Resource-level metrics and details'}
            </p>
          </div>
          {level > 1 && <Button variant="outline" onClick={handleBack}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>}
        </div>

        {/* Level 1: Infrastructure Categories */}
        {level === 1 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {infrastructureCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleCategoryClick(category.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getStatusBg(category.status)}`}><Icon className={`h-5 w-5 ${getStatusColor(category.status)}`} /></div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div><p className="text-xs text-muted-foreground">CPU</p><p className="text-lg font-semibold">{category.metrics.cpu}%</p></div>
                      <div><p className="text-xs text-muted-foreground">Memory</p><p className="text-lg font-semibold">{category.metrics.memory}%</p></div>
                      <div><p className="text-xs text-muted-foreground">Network</p><p className="text-lg font-semibold">{category.metrics.network}%</p></div>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{category.projectCount} projects</span>
                      <span>{category.resourceCount} resources</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Level 2: Projects/VPCs */}
        {level === 2 && (
          <div className="space-y-4">
            {currentProjects.map((project) => (
              <Card key={project.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleProjectClick(project.id)}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${project.status === 'healthy' ? 'bg-green-500' : project.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{project.name}</h3>
                          <Badge variant={project.environment === 'prod' ? 'default' : project.environment === 'staging' ? 'secondary' : 'outline'}>{project.environment}</Badge>
                          {project.nccConnected && <Badge variant="outline" className="text-xs"><Globe className="h-3 w-3 mr-1" />NCC</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{project.region} • {project.resourceCount} resources</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="grid grid-cols-4 gap-6 text-center">
                        <div><p className="text-xs text-muted-foreground">CPU</p><p className={`font-semibold ${project.metrics.cpu > 80 ? 'text-amber-600' : ''}`}>{project.metrics.cpu}%</p></div>
                        <div><p className="text-xs text-muted-foreground">Memory</p><p className={`font-semibold ${project.metrics.memory > 80 ? 'text-amber-600' : ''}`}>{project.metrics.memory}%</p></div>
                        <div><p className="text-xs text-muted-foreground">Network</p><p className="font-semibold">{project.metrics.network}%</p></div>
                        <div><p className="text-xs text-muted-foreground">Cost</p><p className="font-semibold">${project.metrics.cost}</p></div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Level 3: Resources */}
        {level === 3 && (
          <div className="space-y-6">
            {/* Resource Summary */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><Server className="h-8 w-8 text-blue-500" /><div><p className="text-2xl font-bold">{currentResources.length}</p><p className="text-xs text-muted-foreground">Total Resources</p></div></div></CardContent></Card>
              <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><CheckCircle className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{currentResources.filter(r => r.status === 'running').length}</p><p className="text-xs text-muted-foreground">Running</p></div></div></CardContent></Card>
              <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-amber-500" /><div><p className="text-2xl font-bold">{currentResources.filter(r => r.status === 'warning').length}</p><p className="text-xs text-muted-foreground">Warning</p></div></div></CardContent></Card>
              <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><Activity className="h-8 w-8 text-purple-500" /><div><p className="text-2xl font-bold">{Math.round(currentResources.reduce((s, r) => s + r.metrics.cpu, 0) / currentResources.length)}%</p><p className="text-xs text-muted-foreground">Avg CPU</p></div></div></CardContent></Card>
            </div>

            {/* Resource List */}
            <Card>
              <CardHeader><CardTitle>Resources</CardTitle><CardDescription>VMs, containers, and storage in this project</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentResources.map((resource) => {
                    const Icon = getTypeIcon(resource.type);
                    return (
                      <div key={resource.id} className="p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${getStatusBg(resource.status)}`}><Icon className={`h-5 w-5 ${getStatusColor(resource.status)}`} /></div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{resource.name}</h4>
                                <Badge variant="outline">{resource.type.toUpperCase()}</Badge>
                                <Badge className={getStatusBg(resource.status)}>{resource.status}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{resource.ipAddress} • {resource.zone}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-6 text-center">
                            <div><p className="text-xs text-muted-foreground">CPU</p><Progress value={resource.metrics.cpu} className="w-16 h-2" /><p className="text-xs mt-1">{resource.metrics.cpu}%</p></div>
                            <div><p className="text-xs text-muted-foreground">Memory</p><Progress value={resource.metrics.memory} className="w-16 h-2" /><p className="text-xs mt-1">{resource.metrics.memory}%</p></div>
                            <div><p className="text-xs text-muted-foreground">Disk</p><Progress value={resource.metrics.disk} className="w-16 h-2" /><p className="text-xs mt-1">{resource.metrics.disk}%</p></div>
                            <div><p className="text-xs text-muted-foreground">Network</p><Progress value={resource.metrics.network} className="w-16 h-2" /><p className="text-xs mt-1">{resource.metrics.network}%</p></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

