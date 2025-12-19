import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Tag, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Search,
  Shield,
  FileText,
  Plus,
  Edit,
  Trash2,
  Filter,
  Download,
} from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface Resource {
  id: string;
  name: string;
  type: string;
  project: string;
  region: string;
  tags: Record<string, string>;
  missingTags: string[];
  complianceScore: number;
  status: 'compliant' | 'partial' | 'non_compliant';
}

interface TagPolicy {
  id: string;
  name: string;
  key: string;
  required: boolean;
  allowedValues: string[] | null;
  description: string;
  resourceTypes: string[];
  enforced: boolean;
}

interface TagCoverage {
  tagKey: string;
  coverage: number;
  resourcesWithTag: number;
  totalResources: number;
}

const resources: Resource[] = [
  { id: '1', name: 'prod-api-gateway', type: 'Compute Instance', project: 'adp-prod', region: 'us-central1', tags: { environment: 'production', team: 'platform', cost_center: 'CC-1001', owner: 'platform-team@adp.com' }, missingTags: [], complianceScore: 100, status: 'compliant' },
  { id: '2', name: 'staging-db-primary', type: 'Cloud SQL', project: 'adp-staging', region: 'us-east1', tags: { environment: 'staging', team: 'data' }, missingTags: ['cost_center', 'owner'], complianceScore: 50, status: 'partial' },
  { id: '3', name: 'dev-worker-pool', type: 'GKE Cluster', project: 'adp-dev', region: 'us-west1', tags: { environment: 'development' }, missingTags: ['team', 'cost_center', 'owner'], complianceScore: 25, status: 'non_compliant' },
  { id: '4', name: 'analytics-bucket', type: 'Cloud Storage', project: 'adp-analytics', region: 'us-central1', tags: { environment: 'production', team: 'analytics', cost_center: 'CC-2001', owner: 'analytics@adp.com' }, missingTags: [], complianceScore: 100, status: 'compliant' },
  { id: '5', name: 'ml-training-gpu', type: 'Compute Instance', project: 'cvs-ml', region: 'us-central1', tags: { environment: 'production', team: 'ml' }, missingTags: ['cost_center', 'owner'], complianceScore: 50, status: 'partial' },
  { id: '6', name: 'legacy-app-vm', type: 'Compute Instance', project: 'cvs-legacy', region: 'us-east1', tags: {}, missingTags: ['environment', 'team', 'cost_center', 'owner'], complianceScore: 0, status: 'non_compliant' },
  { id: '7', name: 'cache-redis-cluster', type: 'Memorystore', project: 'adp-prod', region: 'us-central1', tags: { environment: 'production', team: 'platform', cost_center: 'CC-1001' }, missingTags: ['owner'], complianceScore: 75, status: 'partial' },
  { id: '8', name: 'pubsub-orders', type: 'Pub/Sub Topic', project: 'adp-prod', region: 'global', tags: { environment: 'production', team: 'orders', cost_center: 'CC-3001', owner: 'orders@adp.com' }, missingTags: [], complianceScore: 100, status: 'compliant' },
  { id: '9', name: 'test-function', type: 'Cloud Function', project: 'cvs-test', region: 'us-central1', tags: { environment: 'test' }, missingTags: ['team', 'cost_center', 'owner'], complianceScore: 25, status: 'non_compliant' },
  { id: '10', name: 'prod-lb-frontend', type: 'Load Balancer', project: 'adp-prod', region: 'global', tags: { environment: 'production', team: 'platform', cost_center: 'CC-1001', owner: 'platform-team@adp.com' }, missingTags: [], complianceScore: 100, status: 'compliant' },
];

const tagPolicies: TagPolicy[] = [
  { id: '1', name: 'Environment Tag', key: 'environment', required: true, allowedValues: ['production', 'staging', 'development', 'test'], description: 'Identifies the deployment environment', resourceTypes: ['all'], enforced: true },
  { id: '2', name: 'Team Owner', key: 'team', required: true, allowedValues: null, description: 'Team responsible for the resource', resourceTypes: ['all'], enforced: true },
  { id: '3', name: 'Cost Center', key: 'cost_center', required: true, allowedValues: null, description: 'Financial cost allocation code', resourceTypes: ['all'], enforced: true },
  { id: '4', name: 'Owner Email', key: 'owner', required: true, allowedValues: null, description: 'Contact email for resource owner', resourceTypes: ['all'], enforced: true },
  { id: '5', name: 'Data Classification', key: 'data_classification', required: false, allowedValues: ['public', 'internal', 'confidential', 'restricted'], description: 'Data sensitivity classification', resourceTypes: ['Cloud Storage', 'Cloud SQL', 'BigQuery'], enforced: false },
  { id: '6', name: 'Backup Policy', key: 'backup_policy', required: false, allowedValues: ['daily', 'weekly', 'monthly', 'none'], description: 'Backup schedule for the resource', resourceTypes: ['Cloud SQL', 'Compute Instance'], enforced: false },
];

const tagCoverage: TagCoverage[] = [
  { tagKey: 'environment', coverage: 90, resourcesWithTag: 9, totalResources: 10 },
  { tagKey: 'team', coverage: 70, resourcesWithTag: 7, totalResources: 10 },
  { tagKey: 'cost_center', coverage: 50, resourcesWithTag: 5, totalResources: 10 },
  { tagKey: 'owner', coverage: 40, resourcesWithTag: 4, totalResources: 10 },
  { tagKey: 'data_classification', coverage: 20, resourcesWithTag: 2, totalResources: 10 },
  { tagKey: 'backup_policy', coverage: 10, resourcesWithTag: 1, totalResources: 10 },
];

const complianceByProjectData = {
  labels: ['adp-prod', 'adp-staging', 'adp-dev', 'adp-analytics', 'cvs-ml', 'cvs-legacy', 'cvs-test'],
  datasets: [{
    label: 'Compliance Score',
    data: [95, 50, 25, 100, 50, 0, 25],
    backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(251, 191, 36, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(34, 197, 94, 0.8)', 'rgba(251, 191, 36, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(239, 68, 68, 0.8)'],
  }],
};

const complianceDistributionData = {
  labels: ['Compliant', 'Partial', 'Non-Compliant'],
  datasets: [{
    data: [4, 3, 3],
    backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(251, 191, 36, 0.8)', 'rgba(239, 68, 68, 0.8)'],
    borderColor: ['rgb(34, 197, 94)', 'rgb(251, 191, 36)', 'rgb(239, 68, 68)'],
    borderWidth: 2,
  }],
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'compliant': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"><CheckCircle className="h-3 w-3 mr-1" />Compliant</Badge>;
    case 'partial': return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"><AlertTriangle className="h-3 w-3 mr-1" />Partial</Badge>;
    case 'non_compliant': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"><XCircle className="h-3 w-3 mr-1" />Non-Compliant</Badge>;
    default: return null;
  }
};

const getCoverageColor = (coverage: number) => {
  if (coverage >= 80) return 'text-green-600';
  if (coverage >= 50) return 'text-amber-600';
  return 'text-red-600';
};

export default function ResourceTagging() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase()) || resource.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || resource.status === statusFilter;
    const matchesProject = projectFilter === 'all' || resource.project === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const compliantResources = resources.filter(r => r.status === 'compliant').length;
  const partialResources = resources.filter(r => r.status === 'partial').length;
  const nonCompliantResources = resources.filter(r => r.status === 'non_compliant').length;
  const overallCompliance = Math.round(resources.reduce((sum, r) => sum + r.complianceScore, 0) / resources.length);
  const uniqueProjects = Array.from(new Set(resources.map(r => r.project)));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Tag className="h-8 w-8 text-blue-500" />
              Resource Tagging Governance
            </h1>
            <p className="text-muted-foreground mt-1">Tag compliance scoring, missing tag detection, and policy enforcement</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export Report</Button>
            <Button><Plus className="h-4 w-4 mr-2" />Add Policy</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Shield className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{overallCompliance}%</p><p className="text-xs text-muted-foreground">Overall Compliance</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><CheckCircle className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold text-green-600">{compliantResources}</p><p className="text-xs text-muted-foreground">Compliant</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><AlertTriangle className="h-5 w-5 text-amber-600" /></div><div><p className="text-2xl font-bold text-amber-600">{partialResources}</p><p className="text-xs text-muted-foreground">Partial</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30"><XCircle className="h-5 w-5 text-red-600" /></div><div><p className="text-2xl font-bold text-red-600">{nonCompliantResources}</p><p className="text-xs text-muted-foreground">Non-Compliant</p></div></div></CardContent></Card>
        </div>

        <Tabs defaultValue="resources" className="space-y-4">
          <TabsList>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="policies">Tag Policies</TabsTrigger>
            <TabsTrigger value="coverage">Tag Coverage</TabsTrigger>
          </TabsList>

          <TabsContent value="resources" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Compliance by Project</CardTitle><CardDescription>Average tag compliance score per project</CardDescription></CardHeader>
                <CardContent>
                  <div className="h-48">
                    <Bar data={complianceByProjectData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'Compliance (%)' } } } }} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Compliance Distribution</CardTitle><CardDescription>Resource distribution by compliance status</CardDescription></CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center">
                    <Doughnut data={complianceDistributionData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div><CardTitle>Resource Inventory</CardTitle><CardDescription>All resources with their tagging compliance status</CardDescription></div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search resources..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-64" />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-36"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="compliant">Compliant</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={projectFilter} onValueChange={setProjectFilter}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="All Projects" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {uniqueProjects.map(project => (<SelectItem key={project} value={project}>{project}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead className="text-center">Compliance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Missing Tags</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResources.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell className="font-medium">{resource.name}</TableCell>
                        <TableCell>{resource.type}</TableCell>
                        <TableCell>{resource.project}</TableCell>
                        <TableCell>{resource.region}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Progress value={resource.complianceScore} className="h-2 w-16" />
                            <span className={`text-sm font-medium ${resource.complianceScore === 100 ? 'text-green-600' : resource.complianceScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{resource.complianceScore}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(resource.status)}</TableCell>
                        <TableCell>
                          {resource.missingTags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {resource.missingTags.slice(0, 2).map(tag => (<Badge key={tag} variant="outline" className="text-xs text-red-600">{tag}</Badge>))}
                              {resource.missingTags.length > 2 && (<Badge variant="outline" className="text-xs">+{resource.missingTags.length - 2}</Badge>)}
                            </div>
                          ) : (<span className="text-green-600 text-sm">All present</span>)}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost"><Edit className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Tag Policies</CardTitle><CardDescription>Define required tags and allowed values</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tagPolicies.map((policy) => (
                    <div key={policy.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Tag className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{policy.name}</h4>
                            <p className="text-sm text-muted-foreground font-mono">{policy.key}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {policy.required && <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">Required</Badge>}
                          {policy.enforced ? (<Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Enforced</Badge>) : (<Badge variant="outline">Not Enforced</Badge>)}
                          <Button size="sm" variant="ghost"><Edit className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{policy.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Applies to: </span>
                          <span>{policy.resourceTypes.join(', ')}</span>
                        </div>
                        {policy.allowedValues && (
                          <div>
                            <span className="text-muted-foreground">Allowed values: </span>
                            <span>{policy.allowedValues.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coverage" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Tag Coverage Analysis</CardTitle><CardDescription>Percentage of resources with each tag applied</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tagCoverage.map((tag) => (
                    <div key={tag.tagKey} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <Tag className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold font-mono">{tag.tagKey}</h4>
                            <p className="text-sm text-muted-foreground">{tag.resourcesWithTag} of {tag.totalResources} resources</p>
                          </div>
                        </div>
                        <span className={`text-2xl font-bold ${getCoverageColor(tag.coverage)}`}>{tag.coverage}%</span>
                      </div>
                      <Progress value={tag.coverage} className={`h-2 ${tag.coverage >= 80 ? '' : tag.coverage >= 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'}`} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
