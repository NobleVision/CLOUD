import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Activity,
  Users,
  DollarSign,
  Server,
  Database,
  Globe,
  Shield,
  Zap,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Timer,
  Target,
  GitBranch,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Flame,
  Waves,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types for incident data
interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'detection' | 'escalation' | 'action' | 'resolution' | 'update';
  title: string;
  description: string;
  severity?: 'critical' | 'warning' | 'info';
  actor?: string;
  automated?: boolean;
}

interface AffectedService {
  id: string;
  name: string;
  type: 'primary' | 'secondary' | 'tertiary';
  status: 'critical' | 'degraded' | 'recovering' | 'healthy';
  impactLevel: number; // 0-100
  latencyIncrease?: number; // percentage
  errorRate?: number; // percentage
  affectedEndpoints?: string[];
  dependencies?: string[];
}

interface Incident {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'active' | 'mitigated' | 'resolved';
  startTime: Date;
  endTime?: Date;
  summary: string;
  rootCause?: string;
  timeline: TimelineEvent[];
  affectedServices: AffectedService[];
  impactMetrics: {
    usersAffected: number;
    revenueImpact: number;
    mttr: number; // minutes
    mttd: number; // minutes
    slaBreaches: number;
  };
}

// Mock incident data
const mockIncidents: Incident[] = [
  {
    id: 'INC-2024-001',
    title: 'Database Connection Pool Exhaustion',
    severity: 'critical',
    status: 'resolved',
    startTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    endTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    summary: 'Primary database connection pool exhausted due to connection leak in auth-service, causing cascading failures across dependent services.',
    rootCause: 'Memory leak in connection pooling library after upgrade to v3.2.1',
    timeline: [
      { id: '1', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), type: 'detection', title: 'Anomaly Detected', description: 'Automated monitoring detected elevated latency in auth-service API responses', severity: 'warning', automated: true },
      { id: '2', timestamp: new Date(Date.now() - 3.9 * 60 * 60 * 1000), type: 'escalation', title: 'Alert Escalated to P1', description: 'Error rate exceeded 5% threshold, escalating to on-call team', severity: 'critical', automated: true },
      { id: '3', timestamp: new Date(Date.now() - 3.8 * 60 * 60 * 1000), type: 'update', title: 'On-call Engineer Acknowledged', description: 'Sarah Chen acknowledged the incident and began investigation', actor: 'Sarah Chen' },
      { id: '4', timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000), type: 'update', title: 'Root Cause Identified', description: 'Connection pool exhaustion identified in PostgreSQL primary cluster', actor: 'Sarah Chen' },
      { id: '5', timestamp: new Date(Date.now() - 3.2 * 60 * 60 * 1000), type: 'action', title: 'Mitigation Started', description: 'Initiated emergency connection pool resize and rolling restart of auth-service pods', actor: 'Sarah Chen' },
      { id: '6', timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000), type: 'update', title: 'Partial Recovery', description: 'Auth-service latency returning to normal, still monitoring dependent services', severity: 'warning' },
      { id: '7', timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000), type: 'action', title: 'Hotfix Deployed', description: 'Patched connection pooling library to prevent future leaks', actor: 'DevOps Team' },
      { id: '8', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), type: 'resolution', title: 'Incident Resolved', description: 'All services recovered, monitoring confirmed stable for 30 minutes', severity: 'info' },
    ],
    affectedServices: [
      { id: 'auth', name: 'auth-service', type: 'primary', status: 'healthy', impactLevel: 100, latencyIncrease: 450, errorRate: 23, affectedEndpoints: ['/login', '/token/refresh', '/oauth/callback'], dependencies: ['user-db', 'redis-cache'] },
      { id: 'api', name: 'api-gateway', type: 'secondary', status: 'healthy', impactLevel: 75, latencyIncrease: 280, errorRate: 12, affectedEndpoints: ['/v1/*', '/v2/*'], dependencies: ['auth-service'] },
      { id: 'orders', name: 'order-service', type: 'secondary', status: 'healthy', impactLevel: 60, latencyIncrease: 180, errorRate: 8, affectedEndpoints: ['/orders', '/checkout'], dependencies: ['auth-service', 'inventory-db'] },
      { id: 'payments', name: 'payment-service', type: 'tertiary', status: 'healthy', impactLevel: 40, latencyIncrease: 120, errorRate: 5, affectedEndpoints: ['/process', '/refund'], dependencies: ['order-service'] },
      { id: 'notify', name: 'notification-service', type: 'tertiary', status: 'healthy', impactLevel: 25, latencyIncrease: 50, errorRate: 2, dependencies: ['api-gateway'] },
    ],
    impactMetrics: { usersAffected: 45000, revenueImpact: 125000, mttr: 180, mttd: 12, slaBreaches: 3 },
  },
  {
    id: 'INC-2024-002',
    title: 'CDN Cache Invalidation Storm',
    severity: 'warning',
    status: 'mitigated',
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    summary: 'Mass cache invalidation triggered by deployment, causing origin server overload.',
    timeline: [
      { id: '1', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), type: 'detection', title: 'CDN Origin Overload', description: 'Origin server CPU spiked to 95%', severity: 'warning', automated: true },
      { id: '2', timestamp: new Date(Date.now() - 1.8 * 60 * 60 * 1000), type: 'action', title: 'Rate Limiting Applied', description: 'Applied emergency rate limits on CDN origin', actor: 'Platform Team' },
      { id: '3', timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000), type: 'update', title: 'Cache Rebuilding', description: 'CDN cache hit ratio recovering, currently at 78%', severity: 'info' },
    ],
    affectedServices: [
      { id: 'cdn', name: 'cdn-edge', type: 'primary', status: 'recovering', impactLevel: 80, latencyIncrease: 350, errorRate: 15, dependencies: ['origin-server'] },
      { id: 'origin', name: 'origin-server', type: 'secondary', status: 'degraded', impactLevel: 65, latencyIncrease: 200, errorRate: 8, dependencies: ['asset-storage'] },
    ],
    impactMetrics: { usersAffected: 12000, revenueImpact: 35000, mttr: 0, mttd: 8, slaBreaches: 1 },
  },
];

// Helper functions
const getEventIcon = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'detection': return AlertTriangle;
    case 'escalation': return Flame;
    case 'action': return Zap;
    case 'resolution': return CheckCircle2;
    case 'update': return Activity;
    default: return Clock;
  }
};

const getEventColor = (type: TimelineEvent['type'], severity?: string) => {
  if (severity === 'critical') return 'text-red-500 bg-red-500/10 border-red-500/30';
  if (severity === 'warning') return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
  if (type === 'resolution') return 'text-green-500 bg-green-500/10 border-green-500/30';
  return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
};

const getServiceIcon = (name: string) => {
  if (name.includes('db') || name.includes('database')) return Database;
  if (name.includes('api') || name.includes('gateway')) return Globe;
  if (name.includes('auth')) return Shield;
  if (name.includes('cdn') || name.includes('edge')) return Waves;
  return Server;
};

const getStatusColor = (status: AffectedService['status']) => {
  switch (status) {
    case 'critical': return 'bg-red-500';
    case 'degraded': return 'bg-amber-500';
    case 'recovering': return 'bg-blue-500';
    case 'healthy': return 'bg-green-500';
  }
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
};


// Blast Radius Visualization Component
function BlastRadiusVisualization({ services }: { services: AffectedService[] }) {
  const [expandedService, setExpandedService] = useState<string | null>(null);

  // Group services by type
  const primaryServices = services.filter(s => s.type === 'primary');
  const secondaryServices = services.filter(s => s.type === 'secondary');
  const tertiaryServices = services.filter(s => s.type === 'tertiary');

  const ServiceNode = ({ service, ring }: { service: AffectedService; ring: number }) => {
    const Icon = getServiceIcon(service.name);
    const isExpanded = expandedService === service.id;

    return (
      <div
        className={cn(
          "relative group cursor-pointer transition-all duration-300",
          isExpanded && "z-10"
        )}
        onClick={() => setExpandedService(isExpanded ? null : service.id)}
      >
        <div
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
            "hover:scale-105 hover:shadow-lg",
            service.status === 'critical' && "border-red-500 bg-red-500/10",
            service.status === 'degraded' && "border-amber-500 bg-amber-500/10",
            service.status === 'recovering' && "border-blue-500 bg-blue-500/10",
            service.status === 'healthy' && "border-green-500/50 bg-green-500/5",
            isExpanded && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
        >
          <div className={cn(
            "p-3 rounded-full",
            service.status === 'critical' && "bg-red-500/20",
            service.status === 'degraded' && "bg-amber-500/20",
            service.status === 'recovering' && "bg-blue-500/20",
            service.status === 'healthy' && "bg-green-500/20"
          )}>
            <Icon className={cn(
              "h-6 w-6",
              service.status === 'critical' && "text-red-500",
              service.status === 'degraded' && "text-amber-500",
              service.status === 'recovering' && "text-blue-500",
              service.status === 'healthy' && "text-green-500"
            )} />
          </div>
          <span className="text-sm font-medium text-center">{service.name}</span>
          <Badge variant="outline" className={cn(
            "text-xs",
            service.status === 'critical' && "border-red-500 text-red-500",
            service.status === 'degraded' && "border-amber-500 text-amber-500",
            service.status === 'recovering' && "border-blue-500 text-blue-500",
            service.status === 'healthy' && "border-green-500 text-green-500"
          )}>
            {service.status}
          </Badge>

          {/* Impact indicator */}
          <div className="w-full mt-1">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Impact</span>
              <span>{service.impactLevel}%</span>
            </div>
            <Progress
              value={service.impactLevel}
              className={cn(
                "h-1.5",
                service.impactLevel > 75 && "[&>div]:bg-red-500",
                service.impactLevel > 50 && service.impactLevel <= 75 && "[&>div]:bg-amber-500",
                service.impactLevel <= 50 && "[&>div]:bg-blue-500"
              )}
            />
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-4 rounded-lg border bg-card shadow-xl z-20">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{service.name}</span>
                <Badge variant={service.status === 'healthy' ? 'default' : 'destructive'} className="text-xs">
                  {service.status}
                </Badge>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Latency</span>
                  <p className="font-medium text-red-500">+{service.latencyIncrease}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Error Rate</span>
                  <p className="font-medium text-red-500">{service.errorRate}%</p>
                </div>
              </div>
              {service.affectedEndpoints && (
                <div>
                  <span className="text-xs text-muted-foreground">Affected Endpoints</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {service.affectedEndpoints.map((ep, i) => (
                      <Badge key={i} variant="secondary" className="text-xs font-mono">
                        {ep}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative py-8">
      {/* Concentric rings visualization */}
      <div className="flex flex-col items-center gap-8">
        {/* Primary (epicenter) */}
        <div className="relative">
          <div className="absolute inset-0 -m-4 rounded-full border-2 border-dashed border-red-500/30 animate-pulse" />
          <div className="flex gap-4">
            {primaryServices.map(service => (
              <ServiceNode key={service.id} service={service} ring={0} />
            ))}
          </div>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-medium">
            Primary Impact
          </div>
        </div>

        {/* Connection lines */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <ChevronDown className="h-4 w-4" />
          <span className="text-xs">Cascading to</span>
          <ChevronDown className="h-4 w-4" />
        </div>

        {/* Secondary */}
        {secondaryServices.length > 0 && (
          <div className="relative">
            <div className="absolute inset-0 -m-4 rounded-full border-2 border-dashed border-amber-500/30" />
            <div className="flex gap-4 flex-wrap justify-center">
              {secondaryServices.map(service => (
                <ServiceNode key={service.id} service={service} ring={1} />
              ))}
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-medium">
              Secondary Impact
            </div>
          </div>
        )}

        {/* Connection lines */}
        {tertiaryServices.length > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <ChevronDown className="h-4 w-4" />
            <span className="text-xs">Propagating to</span>
            <ChevronDown className="h-4 w-4" />
          </div>
        )}

        {/* Tertiary */}
        {tertiaryServices.length > 0 && (
          <div className="relative">
            <div className="absolute inset-0 -m-4 rounded-full border-2 border-dashed border-blue-500/30" />
            <div className="flex gap-4 flex-wrap justify-center">
              {tertiaryServices.map(service => (
                <ServiceNode key={service.id} service={service} ring={2} />
              ))}
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-medium">
              Tertiary Impact
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// Main Component
export default function IncidentTimeline() {
  const [selectedIncident, setSelectedIncident] = useState<Incident>(mockIncidents[0]);
  const [activeTab, setActiveTab] = useState('timeline');

  const incidentDuration = useMemo(() => {
    if (!selectedIncident.endTime) {
      return Math.floor((Date.now() - selectedIncident.startTime.getTime()) / 60000);
    }
    return Math.floor((selectedIncident.endTime.getTime() - selectedIncident.startTime.getTime()) / 60000);
  }, [selectedIncident]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-amber-500/20">
                <Flame className="h-7 w-7 text-red-500" />
              </div>
              Incident Timeline
            </h1>
            <p className="text-muted-foreground mt-1">
              Visual incident story with blast radius analysis
            </p>
          </div>
          <Select
            value={selectedIncident.id}
            onValueChange={(id) => setSelectedIncident(mockIncidents.find(i => i.id === id) || mockIncidents[0])}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mockIncidents.map(incident => (
                <SelectItem key={incident.id} value={incident.id}>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={incident.severity === 'critical' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {incident.severity}
                    </Badge>
                    <span className="truncate">{incident.title}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Incident Summary Card */}
        <Card className={cn(
          "border-l-4",
          selectedIncident.severity === 'critical' && "border-l-red-500",
          selectedIncident.severity === 'warning' && "border-l-amber-500",
          selectedIncident.severity === 'info' && "border-l-blue-500"
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-xl">{selectedIncident.title}</CardTitle>
                  <Badge variant={selectedIncident.status === 'resolved' ? 'default' : 'destructive'}>
                    {selectedIncident.status}
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {selectedIncident.id} • Started {formatRelativeTime(selectedIncident.startTime)}
                  {selectedIncident.endTime && ` • Resolved ${formatRelativeTime(selectedIncident.endTime)}`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Duration: {formatDuration(incidentDuration)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{selectedIncident.summary}</p>
            {selectedIncident.rootCause && (
              <div className="mt-3 p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 text-sm font-medium mb-1">
                  <Target className="h-4 w-4 text-primary" />
                  Root Cause
                </div>
                <p className="text-sm text-muted-foreground">{selectedIncident.rootCause}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Impact Metrics */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Users className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedIncident.impactMetrics.usersAffected.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Users Affected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${(selectedIncident.impactMetrics.revenueImpact / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-muted-foreground">Revenue Impact</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Timer className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedIncident.impactMetrics.mttd}m</p>
                  <p className="text-xs text-muted-foreground">Time to Detect</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Zap className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatDuration(selectedIncident.impactMetrics.mttr || incidentDuration)}</p>
                  <p className="text-xs text-muted-foreground">Time to Resolve</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <AlertCircle className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedIncident.impactMetrics.slaBreaches}</p>
                  <p className="text-xs text-muted-foreground">SLA Breaches</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Timeline and Blast Radius */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="timeline" className="gap-2">
              <GitBranch className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="blast-radius" className="gap-2">
              <Waves className="h-4 w-4" />
              Blast Radius
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Incident Timeline
                </CardTitle>
                <CardDescription>
                  Chronological sequence of events during the incident
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />

                    <div className="space-y-6">
                      {selectedIncident.timeline.map((event, idx) => {
                        const Icon = getEventIcon(event.type);
                        const colorClass = getEventColor(event.type, event.severity);

                        return (
                          <div key={event.id} className="relative flex gap-4">
                            {/* Icon */}
                            <div className={cn(
                              "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
                              colorClass
                            )}>
                              <Icon className="h-4 w-4" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{event.title}</span>
                                {event.automated && (
                                  <Badge variant="secondary" className="text-xs gap-1">
                                    <Zap className="h-3 w-3" />
                                    Automated
                                  </Badge>
                                )}
                                {event.actor && (
                                  <Badge variant="outline" className="text-xs">
                                    {event.actor}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{event.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTime(event.timestamp)} • {formatRelativeTime(event.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blast-radius" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Waves className="h-5 w-5 text-primary" />
                  Blast Radius Analysis
                </CardTitle>
                <CardDescription>
                  Visualize the cascading impact across services. Click on a service for details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BlastRadiusVisualization services={selectedIncident.affectedServices} />
              </CardContent>
            </Card>

            {/* Affected Services Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Affected Services Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedIncident.affectedServices.map(service => {
                    const Icon = getServiceIcon(service.name);
                    return (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "p-2 rounded-lg",
                            service.status === 'critical' && "bg-red-500/10",
                            service.status === 'degraded' && "bg-amber-500/10",
                            service.status === 'recovering' && "bg-blue-500/10",
                            service.status === 'healthy' && "bg-green-500/10"
                          )}>
                            <Icon className={cn(
                              "h-5 w-5",
                              service.status === 'critical' && "text-red-500",
                              service.status === 'degraded' && "text-amber-500",
                              service.status === 'recovering' && "text-blue-500",
                              service.status === 'healthy' && "text-green-500"
                            )} />
                          </div>
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{service.type} impact</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm font-medium flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-red-500" />
                              +{service.latencyIncrease}%
                            </p>
                            <p className="text-xs text-muted-foreground">Latency</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium flex items-center gap-1">
                              <XCircle className="h-3 w-3 text-red-500" />
                              {service.errorRate}%
                            </p>
                            <p className="text-xs text-muted-foreground">Error Rate</p>
                          </div>
                          <div className="w-24">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Impact</span>
                              <span>{service.impactLevel}%</span>
                            </div>
                            <Progress value={service.impactLevel} className="h-2" />
                          </div>
                          <Badge className={cn(
                            "w-24 justify-center",
                            getStatusColor(service.status)
                          )}>
                            {service.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
