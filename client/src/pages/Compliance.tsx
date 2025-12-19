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
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Search,
  FileText,
  Download,
  Clock,
  User,
  Activity,
  Lock,
  Eye,
  RefreshCw,
  Calendar,
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

interface ComplianceControl {
  id: string;
  framework: 'SOC2' | 'HIPAA' | 'PCI-DSS' | 'GDPR';
  controlId: string;
  name: string;
  description: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  lastAssessed: Date;
  evidence: string[];
  owner: string;
}

interface AuditEvent {
  id: string;
  timestamp: Date;
  actor: string;
  action: string;
  resource: string;
  resourceType: string;
  result: 'success' | 'failure' | 'denied';
  ipAddress: string;
  details: string;
}

interface ComplianceReport {
  id: string;
  name: string;
  framework: string;
  generatedAt: Date;
  period: string;
  status: 'completed' | 'pending' | 'failed';
  downloadUrl: string;
}

const complianceControls: ComplianceControl[] = [
  { id: '1', framework: 'SOC2', controlId: 'CC6.1', name: 'Access Control', description: 'Logical access to systems is restricted to authorized users', status: 'compliant', lastAssessed: new Date(Date.now() - 86400000), evidence: ['Access control policy', 'User access reviews'], owner: 'Security Team' },
  { id: '2', framework: 'SOC2', controlId: 'CC6.2', name: 'Authentication', description: 'Users are authenticated before accessing systems', status: 'compliant', lastAssessed: new Date(Date.now() - 172800000), evidence: ['MFA implementation', 'Password policy'], owner: 'Security Team' },
  { id: '3', framework: 'SOC2', controlId: 'CC7.1', name: 'Vulnerability Management', description: 'System vulnerabilities are identified and remediated', status: 'partial', lastAssessed: new Date(Date.now() - 259200000), evidence: ['Vulnerability scan reports'], owner: 'DevOps Team' },
  { id: '4', framework: 'HIPAA', controlId: '164.312(a)', name: 'Access Control', description: 'Technical safeguards for electronic PHI access', status: 'compliant', lastAssessed: new Date(Date.now() - 86400000), evidence: ['Access logs', 'Role-based access'], owner: 'Compliance Team' },
  { id: '5', framework: 'HIPAA', controlId: '164.312(b)', name: 'Audit Controls', description: 'Mechanisms to record and examine system activity', status: 'compliant', lastAssessed: new Date(Date.now() - 86400000), evidence: ['Audit trail configuration', 'Log retention policy'], owner: 'Security Team' },
  { id: '6', framework: 'HIPAA', controlId: '164.312(c)', name: 'Integrity', description: 'Policies to protect ePHI from improper alteration', status: 'partial', lastAssessed: new Date(Date.now() - 345600000), evidence: ['Data integrity checks'], owner: 'Data Team' },
  { id: '7', framework: 'HIPAA', controlId: '164.312(d)', name: 'Authentication', description: 'Verify person or entity seeking access is authorized', status: 'compliant', lastAssessed: new Date(Date.now() - 86400000), evidence: ['Authentication logs', 'Identity verification'], owner: 'Security Team' },
  { id: '8', framework: 'SOC2', controlId: 'CC8.1', name: 'Change Management', description: 'Changes to systems are authorized and tested', status: 'compliant', lastAssessed: new Date(Date.now() - 172800000), evidence: ['Change request tickets', 'Approval records'], owner: 'DevOps Team' },
  { id: '9', framework: 'PCI-DSS', controlId: '3.4', name: 'Data Encryption', description: 'Render PAN unreadable anywhere it is stored', status: 'compliant', lastAssessed: new Date(Date.now() - 86400000), evidence: ['Encryption standards', 'Key management'], owner: 'Security Team' },
  { id: '10', framework: 'PCI-DSS', controlId: '10.1', name: 'Logging', description: 'Implement audit trails to link access to cardholder data', status: 'non_compliant', lastAssessed: new Date(Date.now() - 518400000), evidence: ['Incomplete logging'], owner: 'DevOps Team' },
];

const auditEvents: AuditEvent[] = [
  { id: '1', timestamp: new Date(Date.now() - 300000), actor: 'john.smith@adp.com', action: 'LOGIN', resource: 'Admin Console', resourceType: 'Application', result: 'success', ipAddress: '10.0.1.50', details: 'Successful login with MFA' },
  { id: '2', timestamp: new Date(Date.now() - 600000), actor: 'jane.doe@adp.com', action: 'UPDATE', resource: 'prod-api-gateway', resourceType: 'Compute Instance', result: 'success', ipAddress: '10.0.1.55', details: 'Updated firewall rules' },
  { id: '3', timestamp: new Date(Date.now() - 900000), actor: 'system@gcp.com', action: 'CREATE', resource: 'backup-snapshot-1201', resourceType: 'Snapshot', result: 'success', ipAddress: 'internal', details: 'Automated daily backup' },
  { id: '4', timestamp: new Date(Date.now() - 1200000), actor: 'mike.jones@adp.com', action: 'DELETE', resource: 'test-instance-old', resourceType: 'Compute Instance', result: 'denied', ipAddress: '10.0.2.30', details: 'Insufficient permissions' },
  { id: '5', timestamp: new Date(Date.now() - 1500000), actor: 'sarah.wilson@adp.com', action: 'ACCESS', resource: 'customer-db', resourceType: 'Cloud SQL', result: 'success', ipAddress: '10.0.1.60', details: 'Read access to customer records' },
  { id: '6', timestamp: new Date(Date.now() - 1800000), actor: 'admin@adp.com', action: 'MODIFY', resource: 'iam-policy-prod', resourceType: 'IAM Policy', result: 'success', ipAddress: '10.0.1.10', details: 'Added new service account' },
  { id: '7', timestamp: new Date(Date.now() - 2100000), actor: 'bob.taylor@adp.com', action: 'LOGIN', resource: 'Admin Console', resourceType: 'Application', result: 'failure', ipAddress: '192.168.1.100', details: 'Invalid MFA token' },
  { id: '8', timestamp: new Date(Date.now() - 2400000), actor: 'alice.chen@adp.com', action: 'EXPORT', resource: 'analytics-report', resourceType: 'BigQuery', result: 'success', ipAddress: '10.0.1.70', details: 'Exported Q4 analytics data' },
  { id: '9', timestamp: new Date(Date.now() - 2700000), actor: 'system@gcp.com', action: 'ROTATE', resource: 'encryption-key-main', resourceType: 'KMS Key', result: 'success', ipAddress: 'internal', details: 'Automated key rotation' },
  { id: '10', timestamp: new Date(Date.now() - 3000000), actor: 'david.kim@adp.com', action: 'CREATE', resource: 'new-storage-bucket', resourceType: 'Cloud Storage', result: 'success', ipAddress: '10.0.1.80', details: 'Created bucket for logs' },
];

const complianceReports: ComplianceReport[] = [
  { id: '1', name: 'SOC2 Type II Annual Report', framework: 'SOC2', generatedAt: new Date(Date.now() - 604800000), period: '2024 Q4', status: 'completed', downloadUrl: '#' },
  { id: '2', name: 'HIPAA Security Assessment', framework: 'HIPAA', generatedAt: new Date(Date.now() - 1209600000), period: '2024 H2', status: 'completed', downloadUrl: '#' },
  { id: '3', name: 'PCI-DSS Quarterly Scan', framework: 'PCI-DSS', generatedAt: new Date(Date.now() - 86400000), period: '2024 Q4', status: 'pending', downloadUrl: '#' },
  { id: '4', name: 'Monthly Access Review', framework: 'SOC2', generatedAt: new Date(Date.now() - 259200000), period: 'November 2024', status: 'completed', downloadUrl: '#' },
];

const complianceTrendData = {
  labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    { label: 'SOC2', data: [85, 88, 90, 92, 94, 95], borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: false, tension: 0.4 },
    { label: 'HIPAA', data: [82, 85, 87, 88, 90, 92], borderColor: 'rgb(34, 197, 94)', backgroundColor: 'rgba(34, 197, 94, 0.1)', fill: false, tension: 0.4 },
    { label: 'PCI-DSS', data: [78, 80, 82, 80, 75, 78], borderColor: 'rgb(251, 191, 36)', backgroundColor: 'rgba(251, 191, 36, 0.1)', fill: false, tension: 0.4 },
  ],
};

const controlStatusData = {
  labels: ['Compliant', 'Partial', 'Non-Compliant', 'N/A'],
  datasets: [{
    data: [6, 2, 1, 1],
    backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(251, 191, 36, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(156, 163, 175, 0.8)'],
    borderColor: ['rgb(34, 197, 94)', 'rgb(251, 191, 36)', 'rgb(239, 68, 68)', 'rgb(156, 163, 175)'],
    borderWidth: 2,
  }],
};

const auditActionData = {
  labels: ['Login', 'Create', 'Update', 'Delete', 'Access', 'Export'],
  datasets: [{
    label: 'Actions (24h)',
    data: [45, 28, 35, 12, 52, 18],
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
  }],
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'compliant': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"><CheckCircle className="h-3 w-3 mr-1" />Compliant</Badge>;
    case 'partial': return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"><AlertTriangle className="h-3 w-3 mr-1" />Partial</Badge>;
    case 'non_compliant': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"><XCircle className="h-3 w-3 mr-1" />Non-Compliant</Badge>;
    case 'not_applicable': return <Badge variant="outline">N/A</Badge>;
    default: return null;
  }
};

const getResultBadge = (result: string) => {
  switch (result) {
    case 'success': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Success</Badge>;
    case 'failure': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Failed</Badge>;
    case 'denied': return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Denied</Badge>;
    default: return null;
  }
};

const getFrameworkBadge = (framework: string) => {
  const colors: Record<string, string> = {
    'SOC2': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'HIPAA': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'PCI-DSS': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'GDPR': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  };
  return <Badge className={colors[framework] || 'bg-gray-100 text-gray-800'}>{framework}</Badge>;
};

export default function Compliance() {
  const [searchQuery, setSearchQuery] = useState('');
  const [frameworkFilter, setFrameworkFilter] = useState('all');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  const filteredControls = complianceControls.filter(control => {
    const matchesSearch = control.name.toLowerCase().includes(searchQuery.toLowerCase()) || control.controlId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFramework = frameworkFilter === 'all' || control.framework === frameworkFilter;
    return matchesSearch && matchesFramework;
  });

  const filteredAuditEvents = auditEvents.filter(event => 
    event.actor.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
    event.resource.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
    event.action.toLowerCase().includes(auditSearchQuery.toLowerCase())
  );

  const compliantControls = complianceControls.filter(c => c.status === 'compliant').length;
  const partialControls = complianceControls.filter(c => c.status === 'partial').length;
  const nonCompliantControls = complianceControls.filter(c => c.status === 'non_compliant').length;
  const overallCompliance = Math.round((compliantControls / complianceControls.length) * 100);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8 text-green-500" />
              Compliance & Audit Trail
            </h1>
            <p className="text-muted-foreground mt-1">SOC2/HIPAA compliance monitoring with automated audit report generation</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline"><RefreshCw className="h-4 w-4 mr-2" />Run Assessment</Button>
            <Button><Download className="h-4 w-4 mr-2" />Generate Report</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Shield className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{overallCompliance}%</p><p className="text-xs text-muted-foreground">Overall Compliance</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><CheckCircle className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold text-green-600">{compliantControls}</p><p className="text-xs text-muted-foreground">Compliant Controls</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><AlertTriangle className="h-5 w-5 text-amber-600" /></div><div><p className="text-2xl font-bold text-amber-600">{partialControls}</p><p className="text-xs text-muted-foreground">Partial Compliance</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30"><XCircle className="h-5 w-5 text-red-600" /></div><div><p className="text-2xl font-bold text-red-600">{nonCompliantControls}</p><p className="text-xs text-muted-foreground">Non-Compliant</p></div></div></CardContent></Card>
        </div>

        <Tabs defaultValue="controls" className="space-y-4">
          <TabsList>
            <TabsTrigger value="controls">Compliance Controls</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="controls" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Compliance Trend</CardTitle><CardDescription>Compliance score over the past 6 months</CardDescription></CardHeader>
                <CardContent>
                  <div className="h-48">
                    <Line data={complianceTrendData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { min: 60, max: 100, title: { display: true, text: 'Compliance (%)' } } } }} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Control Status Distribution</CardTitle><CardDescription>Controls by compliance status</CardDescription></CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center">
                    <Doughnut data={controlStatusData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div><CardTitle>Compliance Controls</CardTitle><CardDescription>All controls across compliance frameworks</CardDescription></div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search controls..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-64" />
                    </div>
                    <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Frameworks</SelectItem>
                        <SelectItem value="SOC2">SOC2</SelectItem>
                        <SelectItem value="HIPAA">HIPAA</SelectItem>
                        <SelectItem value="PCI-DSS">PCI-DSS</SelectItem>
                        <SelectItem value="GDPR">GDPR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredControls.map((control) => (
                    <div key={control.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {getFrameworkBadge(control.framework)}
                          <div>
                            <h4 className="font-semibold">{control.controlId}: {control.name}</h4>
                            <p className="text-sm text-muted-foreground">{control.description}</p>
                          </div>
                        </div>
                        {getStatusBadge(control.status)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1"><User className="h-3 w-3" />{control.owner}</div>
                        <div className="flex items-center gap-1"><Clock className="h-3 w-3" />Assessed: {control.lastAssessed.toLocaleDateString()}</div>
                        <div className="flex items-center gap-1"><FileText className="h-3 w-3" />Evidence: {control.evidence.join(', ')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Audit Actions (24h)</CardTitle><CardDescription>Distribution of audit events by action type</CardDescription></CardHeader>
              <CardContent>
                <div className="h-48">
                  <Bar data={auditActionData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div><CardTitle>Audit Trail</CardTitle><CardDescription>Comprehensive log of system activities</CardDescription></div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search audit events..." value={auditSearchQuery} onChange={(e) => setAuditSearchQuery(e.target.value)} className="pl-9 w-64" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAuditEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="text-sm">{event.timestamp.toLocaleTimeString()}</TableCell>
                        <TableCell className="font-medium">{event.actor}</TableCell>
                        <TableCell><Badge variant="outline">{event.action}</Badge></TableCell>
                        <TableCell>{event.resource}</TableCell>
                        <TableCell className="text-muted-foreground">{event.resourceType}</TableCell>
                        <TableCell>{getResultBadge(event.result)}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">{event.ipAddress}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Compliance Reports</CardTitle><CardDescription>Generated audit and compliance reports</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceReports.map((report) => (
                    <div key={report.id} className="p-4 rounded-lg border flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-muted">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{report.name}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            {getFrameworkBadge(report.framework)}
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{report.period}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{report.generatedAt.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.status === 'completed' ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Completed</Badge>
                        ) : report.status === 'pending' ? (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Pending</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Failed</Badge>
                        )}
                        <Button size="sm" variant="outline" disabled={report.status !== 'completed'}>
                          <Download className="h-4 w-4 mr-2" />Download
                        </Button>
                      </div>
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
