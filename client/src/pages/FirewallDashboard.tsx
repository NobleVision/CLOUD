import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ExportMenu } from '@/components/ExportMenu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ReactFlow, Node, Edge, Controls, Background, MiniMap, useNodesState, useEdgesState, MarkerType, Position, Handle, BackgroundVariant, Panel, EdgeProps, getBezierPath } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Shield, ShieldCheck, ShieldX, Search, ArrowUpRight, ArrowDownLeft, Activity, Network, Globe, Clock, TrendingUp, AlertTriangle, CheckCircle, XCircle, Sparkles, Brain, Target, Lightbulb, Link2, ChevronUp, ChevronDown, History, AlertCircle, X, Layers, BarChart3, Calendar, User, ExternalLink, Map, Server, Database, Cloud, Lock, ArrowRight, ArrowRightLeft, GitBranch, Circle, LayoutGrid, Shuffle, Move, Cpu } from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip as ChartTooltip, Legend, Filler } from 'chart.js';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, ChartTooltip, Legend, Filler);

// Types
interface FirewallRule { id: string; name: string; priority: number; direction: 'ingress' | 'egress'; action: 'allow' | 'deny'; status: 'active' | 'inactive' | 'deprecated'; vpc: string; project: string; sourceRanges: string[]; destinationRanges: string[]; protocols: { protocol: string; ports?: string[] }[]; targetTags?: string[]; hitCount: number; hitCountHistory: number[]; lastHit?: Date; createdAt: Date; modifiedAt: Date; modifiedBy: string; description?: string; logConfig: boolean; }
interface RuleChangeEvent { id: string; ruleId: string; ruleName: string; timestamp: Date; changeType: 'created' | 'modified' | 'deleted' | 'priority_changed' | 'status_changed'; user: string; description: string; }
interface FirewallTopologyNodeData { label: string; type: string; status: string; allowCount?: number; denyCount?: number; trafficVolume?: string; ruleCount?: number; vpc?: string; cpu?: number; latency?: number; connections?: number; [key: string]: unknown; }
interface FirewallTopologyEdgeData { action: 'allow' | 'deny' | 'mixed'; protocol?: string; port?: string; trafficFlow: number; blocked: number; utilization: number; latency: number; errorRate: number; [key: string]: unknown; }

type LayoutType = 'manual' | 'hierarchical' | 'circular' | 'grid' | 'force';

const vpcs = ['adp-prod-vpc', 'adp-staging-vpc', 'adp-dev-vpc', 'adp-shared-vpc'];
const projects = ['adp-pharmacy-prod', 'adp-retail-prod', 'adp-health-staging', 'adp-corp-dev'];
const commonTags = ['web-server', 'app-server', 'db-server', 'bastion', 'gke-node', 'api-gateway'];
const protocolsList = ['tcp', 'udp', 'icmp', 'all'];
const commonPorts = ['22', '80', '443', '3306', '5432', '6379', '8080'];

const layoutOptions: { value: LayoutType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'manual', label: 'Manual', icon: Move },
  { value: 'hierarchical', label: 'Hierarchical', icon: GitBranch },
  { value: 'circular', label: 'Circular', icon: Circle },
  { value: 'grid', label: 'Grid', icon: LayoutGrid },
  { value: 'force', label: 'Force-Directed', icon: Shuffle },
];

function generateMockRules(): FirewallRule[] {
  const rules: FirewallRule[] = [];
  let ruleId = 1;
  const ruleNames = ['allow-internal-traffic', 'deny-external-ssh', 'allow-https-ingress', 'allow-healthchecks', 'allow-gke-master', 'deny-all-egress', 'allow-iap-ssh', 'allow-lb-healthcheck', 'allow-internal-egress', 'deny-suspicious-ips', 'allow-dns-egress', 'allow-ntp-egress'];
  vpcs.forEach((vpc, vpcIndex) => {
    const numRules = vpc.includes('prod') ? 20 : 12;
    for (let i = 0; i < numRules; i++) {
      const direction: 'ingress' | 'egress' = Math.random() > 0.5 ? 'ingress' : 'egress';
      const action: 'allow' | 'deny' = Math.random() > 0.2 ? 'allow' : 'deny';
      const hitCount = Math.floor(Math.random() * 1000000);
      const proto = protocolsList[Math.floor(Math.random() * protocolsList.length)];
      const protocolConfig = proto === 'tcp' || proto === 'udp' ? [{ protocol: proto, ports: [commonPorts[Math.floor(Math.random() * commonPorts.length)]] }] : [{ protocol: proto }];
      const sourceRanges = Math.random() > 0.3 ? ['10.0.0.0/8', '10.128.0.0/16'][Math.floor(Math.random() * 2)] : '0.0.0.0/0';
      rules.push({ id: `rule-${ruleId++}`, name: `${vpc.replace('adp-', '').replace('-vpc', '')}-${ruleNames[i % ruleNames.length]}-${i}`, priority: Math.floor(Math.random() * 65535), direction, action, status: Math.random() > 0.1 ? 'active' : 'inactive', vpc, project: projects[vpcIndex % projects.length], sourceRanges: [sourceRanges], destinationRanges: ['0.0.0.0/0'], protocols: protocolConfig, targetTags: Math.random() > 0.5 ? [commonTags[Math.floor(Math.random() * commonTags.length)]] : undefined, hitCount, hitCountHistory: Array.from({ length: 24 }, () => Math.floor(Math.random() * hitCount / 100)), lastHit: hitCount > 0 ? new Date(Date.now() - Math.random() * 86400000) : undefined, createdAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 86400000), modifiedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000), modifiedBy: ['admin@adp.com', 'devops@adp.com', 'terraform'][Math.floor(Math.random() * 3)], description: `Firewall rule for ${vpc}`, logConfig: Math.random() > 0.3 });
    }
  });
  return rules.sort((a, b) => a.priority - b.priority);
}

function generateMockChangeEvents(rules: FirewallRule[]): RuleChangeEvent[] {
  const events: RuleChangeEvent[] = [];
  const changeTypes: RuleChangeEvent['changeType'][] = ['created', 'modified', 'priority_changed', 'status_changed'];
  const users = ['admin@adp.com', 'devops@adp.com', 'terraform', 'gke-system'];
  for (let day = 0; day < 30; day++) {
    const numEvents = Math.floor(Math.random() * 4);
    for (let i = 0; i < numEvents; i++) {
      const rule = rules[Math.floor(Math.random() * rules.length)];
      const changeType = changeTypes[Math.floor(Math.random() * changeTypes.length)];
      events.push({ id: `event-${events.length + 1}`, ruleId: rule.id, ruleName: rule.name, timestamp: new Date(Date.now() - day * 86400000 - Math.random() * 86400000), changeType, user: users[Math.floor(Math.random() * users.length)], description: `Rule "${rule.name}" was ${changeType.replace('_', ' ')}` });
    }
  }
  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

const mockRules = generateMockRules();
const mockChangeEvents = generateMockChangeEvents(mockRules);

const getActionColor = (action: string) => action === 'allow' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
const getStatusColor = (status: string) => status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
const formatNumber = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}K` : n.toString();
const formatTime = (d: Date) => d.toLocaleString();

const hitCountChartData = { labels: Array.from({ length: 24 }, (_, i) => `${i}:00`), datasets: [{ label: 'Total Hits', data: Array.from({ length: 24 }, () => Math.floor(Math.random() * 50000)), borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.4 }] };
const ruleDistributionData = { labels: ['Allow', 'Deny'], datasets: [{ data: [mockRules.filter(r => r.action === 'allow').length, mockRules.filter(r => r.action === 'deny').length], backgroundColor: ['#22c55e', '#ef4444'] }] };
const vpcDistributionData = { labels: vpcs.map(v => v.replace('adp-', '').replace('-vpc', '')), datasets: [{ label: 'Rules per VPC', data: vpcs.map(vpc => mockRules.filter(r => r.vpc === vpc).length), backgroundColor: ['#3b82f6', '#f59e0b', '#22c55e', '#8b5cf6'] }] };

// =============================================
// FIREWALL TOPOLOGY - CUSTOM NODE
// =============================================
function FirewallTopologyNode({ data, selected }: { data: FirewallTopologyNodeData; selected: boolean }) {
  const getIcon = () => { switch(data.type) { case 'internet': return Globe; case 'vpc': return Network; case 'firewall': return Shield; case 'service': return Server; case 'database': return Database; default: return Cloud; } };
  const getStatusColor = () => { switch(data.status) { case 'healthy': return { border: 'border-green-500', text: 'text-green-500', bg: 'bg-green-500' }; case 'warning': return { border: 'border-amber-500', text: 'text-amber-500', bg: 'bg-amber-500' }; case 'critical': return { border: 'border-red-500', text: 'text-red-500', bg: 'bg-red-500' }; default: return { border: 'border-blue-500', text: 'text-blue-500', bg: 'bg-blue-500' }; } };
  const Icon = getIcon();
  const colors = getStatusColor();
  return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cn("relative px-4 py-3 rounded-xl border-2 bg-card min-w-[160px] cursor-pointer transition-all", colors.border, selected && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg", !selected && "hover:shadow-md", data.type === 'firewall' && "border-dashed")}>
      <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3 !border-2 !border-background" />
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3 !border-2 !border-background" />
      <Handle type="target" position={Position.Left} className="!bg-primary !w-3 !h-3 !border-2 !border-background" />
      <Handle type="source" position={Position.Right} className="!bg-primary !w-3 !h-3 !border-2 !border-background" />
      {data.status === 'critical' && <div className="absolute -top-1 -right-1"><span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" /></span></div>}
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", `${colors.bg}/20`)}><Icon className={cn("h-5 w-5", colors.text)} /></div>
        <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{data.label}</p><div className="flex items-center gap-1.5 mt-0.5"><div className={cn("h-1.5 w-1.5 rounded-full", colors.bg)} /><span className="text-xs text-muted-foreground capitalize">{data.status}</span></div></div>
      </div>
      {data.type === 'firewall' && (data.allowCount !== undefined || data.denyCount !== undefined) && (
        <div className="flex gap-3 mt-2 pt-2 border-t border-border/50">
          {data.allowCount !== undefined && <div className="flex items-center gap-1 text-xs"><ShieldCheck className="h-3 w-3 text-green-500" /><span className="text-green-600 font-medium">{data.allowCount}</span></div>}
          {data.denyCount !== undefined && <div className="flex items-center gap-1 text-xs"><ShieldX className="h-3 w-3 text-red-500" /><span className="text-red-600 font-medium">{data.denyCount}</span></div>}
          {data.trafficVolume && <div className="flex items-center gap-1 text-xs ml-auto"><Activity className="h-3 w-3 text-blue-500" /><span className="text-muted-foreground">{data.trafficVolume}</span></div>}
        </div>
      )}
      {data.type === 'vpc' && data.ruleCount !== undefined && <div className="flex gap-3 mt-2 pt-2 border-t border-border/50"><div className="flex items-center gap-1 text-xs"><Shield className="h-3 w-3 text-blue-500" /><span className="text-muted-foreground">{data.ruleCount} rules</span></div></div>}
      {(data.type === 'service' || data.type === 'database') && data.cpu !== undefined && (
        <div className="flex gap-3 mt-2 pt-2 border-t border-border/50">
          <div className="text-xs"><span className="text-muted-foreground">CPU</span><span className={cn("ml-1 font-medium", data.cpu > 80 ? "text-red-500" : data.cpu > 60 ? "text-amber-500" : "text-green-500")}>{data.cpu}%</span></div>
          {data.latency !== undefined && <div className="text-xs"><span className="text-muted-foreground">Lat</span><span className={cn("ml-1 font-medium", data.latency > 100 ? "text-red-500" : data.latency > 50 ? "text-amber-500" : "text-green-500")}>{data.latency}ms</span></div>}
        </div>
      )}
    </motion.div>
  );
}

// =============================================
// FIREWALL TOPOLOGY - CUSTOM EDGE (with dynamic width)
// =============================================
function FirewallTopologyEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data: rawData, style, markerEnd, selected }: EdgeProps) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const data = rawData as FirewallTopologyEdgeData | undefined;
  const strokeWidth = data?.utilization ? Math.max(2, Math.min(10, 2 + (data.utilization / 100) * 8)) : 2;
  const getEdgeColor = () => {
    if (!data) return (style?.stroke as string) || '#3b82f6';
    if (data.action === 'deny') return '#ef4444';
    if (data.errorRate > 5) return '#ef4444';
    if (data.utilization > 80) return '#f59e0b';
    return '#22c55e';
  };
  return (
    <>
      <path id={id} className="react-flow__edge-path cursor-pointer transition-all duration-200" d={edgePath} style={{ ...style, stroke: getEdgeColor(), strokeWidth: selected ? strokeWidth + 2 : strokeWidth, filter: selected ? 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' : undefined }} markerEnd={markerEnd} />
      <path d={edgePath} fill="none" strokeWidth={20} stroke="transparent" className="cursor-pointer" />
    </>
  );
}

const firewallNodeTypes = { firewallTopology: FirewallTopologyNode };
const firewallEdgeTypes = { firewallEdge: FirewallTopologyEdge } as const;

// =============================================
// LAYOUT ALGORITHMS
// =============================================
function applyHierarchicalLayout(nodes: Node<FirewallTopologyNodeData>[], edges: Edge<FirewallTopologyEdgeData>[]): Node<FirewallTopologyNodeData>[] {
  const incomingCount: Record<string, number> = {};
  const children: Record<string, string[]> = {};
  nodes.forEach(n => { incomingCount[n.id] = 0; children[n.id] = []; });
  edges.forEach(e => { incomingCount[e.target] = (incomingCount[e.target] || 0) + 1; if (!children[e.source]) children[e.source] = []; children[e.source].push(e.target); });
  const roots = nodes.filter(n => incomingCount[n.id] === 0);
  const levels: Record<string, number> = {};
  const queue = roots.map(r => ({ id: r.id, level: 0 }));
  const visited = new Set<string>();
  while (queue.length > 0) { const { id, level } = queue.shift()!; if (visited.has(id)) continue; visited.add(id); levels[id] = Math.max(levels[id] ?? 0, level); (children[id] || []).forEach(childId => { if (!visited.has(childId)) queue.push({ id: childId, level: level + 1 }); }); }
  nodes.forEach(n => { if (!visited.has(n.id)) levels[n.id] = 0; });
  const levelGroups: Record<number, string[]> = {};
  Object.entries(levels).forEach(([id, level]) => { if (!levelGroups[level]) levelGroups[level] = []; levelGroups[level].push(id); });
  const levelHeight = 140; const nodeWidth = 220;
  return nodes.map(node => { const level = levels[node.id] ?? 0; const nodesInLevel = levelGroups[level] || [node.id]; const indexInLevel = nodesInLevel.indexOf(node.id); const totalWidth = nodesInLevel.length * nodeWidth; const startX = (900 - totalWidth) / 2 + nodeWidth / 2; return { ...node, position: { x: startX + indexInLevel * nodeWidth, y: level * levelHeight + 50 } }; });
}

function applyCircularLayout(nodes: Node<FirewallTopologyNodeData>[]): Node<FirewallTopologyNodeData>[] {
  const centerX = 450; const centerY = 350; const radius = Math.min(320, 80 + nodes.length * 20);
  return nodes.map((node, index) => { const angle = (index / nodes.length) * 2 * Math.PI - Math.PI / 2; return { ...node, position: { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) } }; });
}

function applyGridLayout(nodes: Node<FirewallTopologyNodeData>[]): Node<FirewallTopologyNodeData>[] {
  const cols = Math.ceil(Math.sqrt(nodes.length)); const nodeWidth = 220; const nodeHeight = 130; const padding = 50;
  return nodes.map((node, index) => { const row = Math.floor(index / cols); const col = index % cols; return { ...node, position: { x: padding + col * nodeWidth, y: padding + row * nodeHeight } }; });
}

function applyForceDirectedLayout(nodes: Node<FirewallTopologyNodeData>[], edges: Edge<FirewallTopologyEdgeData>[]): Node<FirewallTopologyNodeData>[] {
  const positions: Record<string, { x: number; y: number }> = {};
  nodes.forEach(node => { positions[node.id] = { x: node.position.x || 400 + Math.random() * 200, y: node.position.y || 300 + Math.random() * 200 }; });
  const iterations = 50; const repulsion = 10000; const attraction = 0.04; const damping = 0.85;
  for (let iter = 0; iter < iterations; iter++) {
    const forces: Record<string, { x: number; y: number }> = {};
    nodes.forEach(n => forces[n.id] = { x: 0, y: 0 });
    for (let i = 0; i < nodes.length; i++) { for (let j = i + 1; j < nodes.length; j++) { const n1 = nodes[i]; const n2 = nodes[j]; const dx = positions[n1.id].x - positions[n2.id].x; const dy = positions[n1.id].y - positions[n2.id].y; const dist = Math.sqrt(dx * dx + dy * dy) || 1; const force = repulsion / (dist * dist); forces[n1.id].x += (dx / dist) * force; forces[n1.id].y += (dy / dist) * force; forces[n2.id].x -= (dx / dist) * force; forces[n2.id].y -= (dy / dist) * force; } }
    edges.forEach(edge => { const source = positions[edge.source]; const target = positions[edge.target]; if (!source || !target) return; const dx = target.x - source.x; const dy = target.y - source.y; forces[edge.source].x += dx * attraction; forces[edge.source].y += dy * attraction; forces[edge.target].x -= dx * attraction; forces[edge.target].y -= dy * attraction; });
    nodes.forEach(node => { positions[node.id].x += forces[node.id].x * damping; positions[node.id].y += forces[node.id].y * damping; positions[node.id].x = Math.max(50, Math.min(850, positions[node.id].x)); positions[node.id].y = Math.max(50, Math.min(650, positions[node.id].y)); });
  }
  return nodes.map(node => ({ ...node, position: positions[node.id] }));
}

function applyLayout(layout: LayoutType, nodes: Node<FirewallTopologyNodeData>[], edges: Edge<FirewallTopologyEdgeData>[], originalNodes: Node<FirewallTopologyNodeData>[]): Node<FirewallTopologyNodeData>[] {
  switch (layout) { case 'hierarchical': return applyHierarchicalLayout(nodes, edges); case 'circular': return applyCircularLayout(nodes); case 'grid': return applyGridLayout(nodes); case 'force': return applyForceDirectedLayout(nodes, edges); default: return nodes.map(node => { const original = originalNodes.find(n => n.id === node.id); return original ? { ...node, position: original.position } : node; }); }
}

// =============================================
// GENERATE FIREWALL TOPOLOGY DATA
// =============================================
function generateFirewallTopology(rules: FirewallRule[]): { nodes: Node<FirewallTopologyNodeData>[]; edges: Edge<FirewallTopologyEdgeData>[] } {
  const nodes: Node<FirewallTopologyNodeData>[] = [];
  const edges: Edge<FirewallTopologyEdgeData>[] = [];
  nodes.push({ id: 'internet', type: 'firewallTopology', position: { x: 450, y: 0 }, data: { label: 'Internet', type: 'internet', status: 'healthy', trafficVolume: '2.5 GB/s' } });
  nodes.push({ id: 'gcp-cloud', type: 'firewallTopology', position: { x: 450, y: 100 }, data: { label: 'GCP Cloud', type: 'loadbalancer', status: 'healthy', cpu: 35, latency: 12 } });
  const vpcPositions: Record<string, { x: number; y: number }> = { 'adp-prod-vpc': { x: 100, y: 250 }, 'adp-staging-vpc': { x: 350, y: 250 }, 'adp-dev-vpc': { x: 600, y: 250 }, 'adp-shared-vpc': { x: 850, y: 250 } };
  vpcs.forEach((vpc, index) => {
    const vpcRules = rules.filter(r => r.vpc === vpc);
    const allowCount = vpcRules.filter(r => r.action === 'allow').length;
    const denyCount = vpcRules.filter(r => r.action === 'deny').length;
    const hasWarning = vpcRules.some(r => r.sourceRanges.includes('0.0.0.0/0') && r.action === 'allow');
    const hasCritical = vpcRules.filter(r => r.hitCount === 0).length > 5;
    const pos = vpcPositions[vpc] || { x: 200 + index * 250, y: 250 };
    const vpcShort = vpc.replace('adp-', '').replace('-vpc', '');
    nodes.push({ id: vpc, type: 'firewallTopology', position: pos, data: { label: vpcShort.toUpperCase(), type: 'vpc', status: hasCritical ? 'critical' : hasWarning ? 'warning' : 'healthy', ruleCount: vpcRules.length, vpc } });
    nodes.push({ id: `${vpc}-fw`, type: 'firewallTopology', position: { x: pos.x, y: pos.y + 120 }, data: { label: `${vpcShort} Firewall`, type: 'firewall', status: hasCritical ? 'critical' : hasWarning ? 'warning' : 'healthy', allowCount, denyCount, trafficVolume: `${Math.floor(Math.random() * 500 + 100)} MB/s`, vpc } });
    const services = [{ id: 'web', label: 'WEB', type: 'service' }, { id: 'api', label: 'API', type: 'service' }, { id: 'db', label: 'DB', type: 'database' }];
    services.forEach((svc, svcIndex) => { nodes.push({ id: `${vpc}-${svc.id}`, type: 'firewallTopology', position: { x: pos.x - 80 + svcIndex * 80, y: pos.y + 260 }, data: { label: svc.label, type: svc.type, status: Math.random() > 0.85 ? 'warning' : 'healthy', vpc, cpu: Math.floor(Math.random() * 60 + 20), latency: Math.floor(Math.random() * 80 + 10), connections: Math.floor(Math.random() * 500 + 50) } }); });
    const vpcUtil = Math.floor(Math.random() * 60 + 20);
    edges.push({ id: `e-gcp-${vpc}`, type: 'firewallEdge', source: 'gcp-cloud', target: vpc, animated: true, data: { action: 'allow', trafficFlow: Math.floor(Math.random() * 2000 + 500), blocked: 0, utilization: vpcUtil, latency: Math.floor(Math.random() * 30 + 5), errorRate: Math.random() * 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' } });
    const fwUtil = Math.floor(Math.random() * 80 + 10);
    edges.push({ id: `e-${vpc}-fw`, type: 'firewallEdge', source: vpc, target: `${vpc}-fw`, data: { action: hasWarning ? 'mixed' : 'allow', trafficFlow: Math.floor(Math.random() * 1500 + 300), blocked: denyCount * 10, utilization: fwUtil, latency: Math.floor(Math.random() * 20 + 3), errorRate: hasWarning ? Math.random() * 4 : Math.random() * 1 }, markerEnd: { type: MarkerType.ArrowClosed, color: hasWarning ? '#f59e0b' : '#22c55e' } });
    services.forEach((svc) => { const isDenied = Math.random() > 0.85; const svcUtil = isDenied ? 5 : Math.floor(Math.random() * 70 + 20); edges.push({ id: `e-${vpc}-fw-${svc.id}`, type: 'firewallEdge', source: `${vpc}-fw`, target: `${vpc}-${svc.id}`, data: { action: isDenied ? 'deny' : 'allow', protocol: 'tcp', port: svc.id === 'web' ? '443' : svc.id === 'api' ? '8080' : '5432', trafficFlow: isDenied ? 0 : Math.floor(Math.random() * 500 + 50), blocked: isDenied ? Math.floor(Math.random() * 100) : 0, utilization: svcUtil, latency: Math.floor(Math.random() * 40 + 5), errorRate: isDenied ? 0 : Math.random() * 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: isDenied ? '#ef4444' : '#22c55e' } }); });
  });
  edges.push({ id: 'e-internet-gcp', type: 'firewallEdge', source: 'internet', target: 'gcp-cloud', animated: true, data: { action: 'allow', protocol: 'tcp', port: '443', trafficFlow: 5000, blocked: 150, utilization: 55, latency: 12, errorRate: 0.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' } });
  return { nodes, edges };
}

// =============================================
// NODE DETAILS PANEL
// =============================================
function NodeDetailsPanel({ node, onClose, onNavigate }: { node: Node<FirewallTopologyNodeData> | null; onClose: () => void; onNavigate: (path: string) => void }) {
  if (!node) return null;
  const data = node.data;
  const getIcon = () => { switch(data.type) { case 'internet': return Globe; case 'vpc': return Network; case 'firewall': return Shield; case 'service': return Server; case 'database': return Database; default: return Cloud; } };
  const getStatusColors = () => { switch(data.status) { case 'healthy': return { bg: 'bg-green-500', text: 'text-green-500' }; case 'warning': return { bg: 'bg-amber-500', text: 'text-amber-500' }; case 'critical': return { bg: 'bg-red-500', text: 'text-red-500' }; default: return { bg: 'bg-blue-500', text: 'text-blue-500' }; } };
  const Icon = getIcon(); const colors = getStatusColors();
  return (
    <div className="absolute top-4 right-4 w-80 bg-card border rounded-xl shadow-xl z-10 overflow-hidden">
      <div className={cn("p-4 border-b", `${colors.bg}/10`)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><div className={cn("p-2 rounded-lg", `${colors.bg}/20`)}><Icon className={cn("h-5 w-5", colors.text)} /></div><div><h3 className="font-semibold">{data.label}</h3><p className="text-xs text-muted-foreground capitalize">{data.type}</p></div></div>
          <div className="flex items-center gap-2"><Badge className={cn(colors.bg, "text-white")}>{data.status}</Badge><Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}><X className="h-4 w-4" /></Button></div>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {(data.cpu !== undefined || data.latency !== undefined || data.connections !== undefined) && (
          <div><h4 className="text-sm font-medium mb-2 flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />Metrics</h4>
            <div className="grid grid-cols-2 gap-2">
              {data.cpu !== undefined && <div className="p-2 rounded-lg bg-muted/50"><span className="text-xs text-muted-foreground">CPU</span><p className={cn("font-semibold", data.cpu > 80 ? "text-red-500" : data.cpu > 60 ? "text-amber-500" : "text-green-500")}>{data.cpu}%</p></div>}
              {data.latency !== undefined && <div className="p-2 rounded-lg bg-muted/50"><span className="text-xs text-muted-foreground">Latency</span><p className={cn("font-semibold", data.latency > 100 ? "text-red-500" : data.latency > 50 ? "text-amber-500" : "text-green-500")}>{data.latency}ms</p></div>}
              {data.connections !== undefined && <div className="p-2 rounded-lg bg-muted/50"><span className="text-xs text-muted-foreground">Connections</span><p className="font-semibold">{data.connections}</p></div>}
              {data.trafficVolume && <div className="p-2 rounded-lg bg-muted/50"><span className="text-xs text-muted-foreground">Traffic</span><p className="font-semibold">{data.trafficVolume}</p></div>}
            </div>
          </div>
        )}
        {data.type === 'firewall' && (data.allowCount !== undefined || data.denyCount !== undefined) && (
          <div><h4 className="text-sm font-medium mb-2 flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />Firewall Rules</h4>
            <div className="grid grid-cols-2 gap-2">
              {data.allowCount !== undefined && <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20"><span className="text-xs text-muted-foreground">Allow Rules</span><p className="font-semibold text-green-600">{data.allowCount}</p></div>}
              {data.denyCount !== undefined && <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20"><span className="text-xs text-muted-foreground">Deny Rules</span><p className="font-semibold text-red-600">{data.denyCount}</p></div>}
            </div>
          </div>
        )}
        {data.vpc && <div><h4 className="text-sm font-medium mb-2 flex items-center gap-2"><Cpu className="h-4 w-4 text-primary" />Details</h4><div className="text-sm"><div className="flex justify-between"><span className="text-muted-foreground">VPC</span><span className="font-medium">{data.vpc}</span></div></div></div>}
        <Separator />
        <div className="flex gap-2"><Button size="sm" className="flex-1" onClick={() => onNavigate('/dashboard/logs')}>View Logs</Button><Button size="sm" variant="outline" className="flex-1" onClick={() => onNavigate('/dashboard/network')}>Network</Button></div>
      </div>
    </div>
  );
}

// =============================================
// EDGE DETAILS PANEL
// =============================================
function EdgeDetailsPanel({ edge, nodes, onClose }: { edge: Edge<FirewallTopologyEdgeData> | null; nodes: Node<FirewallTopologyNodeData>[]; onClose: () => void }) {
  if (!edge || !edge.data) return null;
  const data = edge.data;
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);
  const getHealthColor = () => { if (data.action === 'deny') return { bg: 'bg-red-500', text: 'text-red-500', label: 'Blocked' }; if (data.errorRate > 5) return { bg: 'bg-red-500', text: 'text-red-500', label: 'Critical' }; if (data.utilization > 80 || data.errorRate > 1) return { bg: 'bg-amber-500', text: 'text-amber-500', label: 'Warning' }; return { bg: 'bg-green-500', text: 'text-green-500', label: 'Healthy' }; };
  const health = getHealthColor();
  return (
    <div className="absolute top-4 right-4 w-80 bg-card border rounded-xl shadow-xl z-10 overflow-hidden">
      <div className={cn("p-4 border-b", `${health.bg}/10`)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><div className={cn("p-2 rounded-lg", `${health.bg}/20`)}><ArrowRightLeft className={cn("h-5 w-5", health.text)} /></div><div><h3 className="font-semibold text-sm">Connection</h3><p className="text-xs text-muted-foreground">{sourceNode?.data.label || edge.source} → {targetNode?.data.label || edge.target}</p></div></div>
          <div className="flex items-center gap-2"><Badge className={cn(health.bg, "text-white")}>{health.label}</Badge><Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}><X className="h-4 w-4" /></Button></div>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div><h4 className="text-sm font-medium mb-2 flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />Traffic Metrics</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-muted/50"><span className="text-xs text-muted-foreground">Throughput</span><p className="font-semibold">{data.trafficFlow.toLocaleString()} req/s</p></div>
            <div className="p-2 rounded-lg bg-muted/50"><span className="text-xs text-muted-foreground">Utilization</span><p className={cn("font-semibold", data.utilization > 80 ? "text-red-500" : data.utilization > 60 ? "text-amber-500" : "text-green-500")}>{data.utilization}%</p></div>
            <div className="p-2 rounded-lg bg-muted/50"><span className="text-xs text-muted-foreground">Latency</span><p className={cn("font-semibold", data.latency > 100 ? "text-red-500" : data.latency > 50 ? "text-amber-500" : "text-green-500")}>{data.latency}ms</p></div>
            <div className="p-2 rounded-lg bg-muted/50"><span className="text-xs text-muted-foreground">Error Rate</span><p className={cn("font-semibold", data.errorRate > 5 ? "text-red-500" : data.errorRate > 1 ? "text-amber-500" : "text-green-500")}>{data.errorRate.toFixed(1)}%</p></div>
          </div>
        </div>
        {data.blocked > 0 && <div><h4 className="text-sm font-medium mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" />Blocked Traffic</h4><div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20"><span className="text-xs text-muted-foreground">Blocked Requests</span><p className="font-semibold text-red-600">{data.blocked}</p></div></div>}
        {data.protocol && <div className="text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Protocol</span><span className="font-medium font-mono">{data.protocol}{data.port ? `:${data.port}` : ''}</span></div></div>}
      </div>
    </div>
  );
}

// =============================================
// FIREWALL TOPOLOGY MAP COMPONENT
// =============================================
function FirewallTopologyMap({ rules }: { rules: FirewallRule[] }) {
  const [, navigate] = useLocation();
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => generateFirewallTopology(rules), [rules]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [layout, setLayout] = useState<LayoutType>('manual');
  const [selectedNode, setSelectedNode] = useState<Node<FirewallTopologyNodeData> | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge<FirewallTopologyEdgeData> | null>(null);
  const [showAnimations, setShowAnimations] = useState(true);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const originalNodesRef = useRef(initialNodes);

  useEffect(() => { const layoutedNodes = applyLayout(layout, nodes, edges, originalNodesRef.current); setNodes(layoutedNodes); }, [layout]);

  useEffect(() => { if (!showAnimations) return; const interval = setInterval(() => { setNodes((nds) => nds.map((node) => { const newData = { ...node.data }; if (newData.cpu !== undefined) { newData.cpu = Math.max(10, Math.min(95, (newData.cpu as number) + Math.floor((Math.random() - 0.5) * 15))); } if (newData.latency !== undefined) { newData.latency = Math.max(5, Math.min(150, (newData.latency as number) + Math.floor((Math.random() - 0.5) * 20))); } if (newData.type === 'firewall' && newData.trafficVolume) { const current = parseInt(String(newData.trafficVolume).replace(/[^\d]/g, '')); newData.trafficVolume = `${Math.max(50, current + Math.floor((Math.random() - 0.5) * 50))} MB/s`; } return { ...node, data: newData }; })); setEdges((eds) => eds.map((edge) => { if (edge.data) { const newData = { ...edge.data }; newData.utilization = Math.max(5, Math.min(95, newData.utilization + Math.floor((Math.random() - 0.5) * 15))); newData.latency = Math.max(1, Math.min(150, newData.latency + Math.floor((Math.random() - 0.5) * 10))); if (Math.random() < 0.05) newData.errorRate = Math.min(10, newData.errorRate + Math.random() * 2); else newData.errorRate = Math.max(0, newData.errorRate - 0.3); newData.errorRate = Math.round(newData.errorRate * 10) / 10; return { ...edge, data: newData }; } return edge; })); }, 3000); return () => clearInterval(interval); }, [showAnimations, setNodes, setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<FirewallTopologyNodeData>) => { setSelectedNode(node); setSelectedEdge(null); }, []);
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge<FirewallTopologyEdgeData>) => { setSelectedEdge(edge); setSelectedNode(null); }, []);
  const onPaneClick = useCallback(() => { setSelectedNode(null); setSelectedEdge(null); }, []);

  const stats = useMemo(() => { const fwNodes = nodes.filter(n => n.data.type === 'firewall'); return { healthy: fwNodes.filter(n => n.data.status === 'healthy').length, warning: fwNodes.filter(n => n.data.status === 'warning').length, critical: fwNodes.filter(n => n.data.status === 'critical').length, allowEdges: edges.filter(e => e.data?.action === 'allow').length, denyEdges: edges.filter(e => e.data?.action === 'deny').length, vpcCount: vpcs.length }; }, [nodes, edges]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-6">
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30"><CheckCircle className="h-4 w-4 text-green-600" /></div><div><p className="text-lg font-bold">{stats.healthy}</p><p className="text-xs text-muted-foreground">Healthy</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30"><AlertTriangle className="h-4 w-4 text-amber-600" /></div><div><p className="text-lg font-bold">{stats.warning}</p><p className="text-xs text-muted-foreground">Warning</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30"><XCircle className="h-4 w-4 text-red-600" /></div><div><p className="text-lg font-bold">{stats.critical}</p><p className="text-xs text-muted-foreground">Critical</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Network className="h-4 w-4 text-blue-600" /></div><div><p className="text-lg font-bold">{stats.vpcCount}</p><p className="text-xs text-muted-foreground">VPCs</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30"><ArrowRight className="h-4 w-4 text-green-600" /></div><div><p className="text-lg font-bold">{stats.allowEdges}</p><p className="text-xs text-muted-foreground">Allow</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30"><Lock className="h-4 w-4 text-red-600" /></div><div><p className="text-lg font-bold">{stats.denyEdges}</p><p className="text-xs text-muted-foreground">Deny</p></div></div></CardContent></Card>
      </div>
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div><CardTitle className="flex items-center gap-2"><Map className="h-5 w-5 text-primary" />Firewall Topology</CardTitle><CardDescription>Click nodes or edges for details. Drag to reposition.</CardDescription></div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2"><Label className="text-sm text-muted-foreground">Layout:</Label><div className="flex bg-muted rounded-lg p-0.5">{layoutOptions.map((option) => { const Icon = option.icon; return (<TooltipProvider key={option.value}><Tooltip><TooltipTrigger asChild><button onClick={() => setLayout(option.value)} className={cn("p-2 rounded-md transition-all duration-200", layout === option.value ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground hover:bg-background/50")}><Icon className="h-4 w-4" /></button></TooltipTrigger><TooltipContent>{option.label}</TooltipContent></Tooltip></TooltipProvider>); })}</div></div>
              <Separator orientation="vertical" className="h-6 hidden sm:block" />
              <div className="flex items-center gap-2"><Switch id="fw-anim" checked={showAnimations} onCheckedChange={setShowAnimations} /><Label htmlFor="fw-anim" className="text-sm">Live</Label></div>
              <div className="flex items-center gap-2"><Switch id="fw-map" checked={showMiniMap} onCheckedChange={setShowMiniMap} /><Label htmlFor="fw-map" className="text-sm">Mini Map</Label></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] w-full relative">
            <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onNodeClick={onNodeClick} onEdgeClick={onEdgeClick} onPaneClick={onPaneClick} nodeTypes={firewallNodeTypes} edgeTypes={firewallEdgeTypes} fitView minZoom={0.3} maxZoom={2} defaultViewport={{ x: 0, y: 0, zoom: 0.6 }} proOptions={{ hideAttribution: true }}>
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="bg-muted/30" />
              <Controls className="bg-card border rounded-lg shadow-md" />
              {showMiniMap && <MiniMap className="bg-card border rounded-lg shadow-md" maskColor="rgba(0, 0, 0, 0.1)" nodeColor={(node) => { const d = node.data as FirewallTopologyNodeData; return d.status === 'healthy' ? '#22c55e' : d.status === 'warning' ? '#f59e0b' : d.status === 'critical' ? '#ef4444' : '#6b7280'; }} />}
              <Panel position="bottom-left" className="bg-card/90 backdrop-blur border rounded-lg p-3 shadow-md"><div className="text-xs font-medium mb-2">Legend</div><div className="flex flex-wrap gap-3"><div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-green-500" /><span className="text-xs">Healthy</span></div><div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-amber-500" /><span className="text-xs">Warning</span></div><div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-red-500" /><span className="text-xs">Critical</span></div><Separator orientation="vertical" className="h-4" /><div className="flex items-center gap-1.5"><div className="h-1 w-4 bg-green-500" /><span className="text-xs">Allow</span></div><div className="flex items-center gap-1.5"><div className="h-1 w-4 bg-red-500" /><span className="text-xs">Deny</span></div></div></Panel>
            </ReactFlow>
            <NodeDetailsPanel node={selectedNode} onClose={() => setSelectedNode(null)} onNavigate={navigate} />
            <EdgeDetailsPanel edge={selectedEdge} nodes={nodes} onClose={() => setSelectedEdge(null)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================
// MAIN COMPONENT
// =============================================
export default function FirewallDashboard() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('rules');
  const [filterVpc, setFilterVpc] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterDirection, setFilterDirection] = useState<string>('all');

  const totalRules = mockRules.length;
  const allowRules = mockRules.filter(r => r.action === 'allow').length;
  const denyRules = mockRules.filter(r => r.action === 'deny').length;
  const activeRules = mockRules.filter(r => r.status === 'active').length;
  const totalHits = mockRules.reduce((sum, r) => sum + r.hitCount, 0);

  const filteredRules = useMemo(() => mockRules.filter(rule => { if (filterVpc !== 'all' && rule.vpc !== filterVpc) return false; if (filterAction !== 'all' && rule.action !== filterAction) return false; if (filterDirection !== 'all' && rule.direction !== filterDirection) return false; return true; }), [filterVpc, filterAction, filterDirection]);
  const rulesByVpc = useMemo(() => { const grouped: Record<string, FirewallRule[]> = {}; filteredRules.forEach(rule => { if (!grouped[rule.vpc]) grouped[rule.vpc] = []; grouped[rule.vpc].push(rule); }); return grouped; }, [filteredRules]);
  const exportData = filteredRules.map(r => ({ name: r.name, priority: r.priority, direction: r.direction, action: r.action, vpc: r.vpc, sourceRanges: r.sourceRanges.join(', '), hitCount: r.hitCount, status: r.status }));
  const exportColumns = [{ key: 'name', header: 'Rule Name' }, { key: 'priority', header: 'Priority' }, { key: 'direction', header: 'Direction' }, { key: 'action', header: 'Action' }, { key: 'vpc', header: 'VPC' }, { key: 'sourceRanges', header: 'Source' }, { key: 'hitCount', header: 'Hits' }, { key: 'status', header: 'Status' }];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div><h1 className="text-3xl font-bold tracking-tight flex items-center gap-3"><div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20"><Shield className="h-7 w-7 text-orange-500" /></div>GCP Firewall Dashboard</h1><p className="text-muted-foreground mt-1">Monitor and analyze firewall rules across your GCP infrastructure</p></div>
          <ExportMenu data={exportData} columns={exportColumns} title="Firewall Rules Report" summary={{ 'Total Rules': totalRules, 'Allow': allowRules, 'Deny': denyRules }} />
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Shield className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{totalRules}</p><p className="text-xs text-muted-foreground">Total Rules</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><ShieldCheck className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold">{allowRules}</p><p className="text-xs text-muted-foreground">Allow Rules</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30"><ShieldX className="h-5 w-5 text-red-600" /></div><div><p className="text-2xl font-bold">{denyRules}</p><p className="text-xs text-muted-foreground">Deny Rules</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30"><CheckCircle className="h-5 w-5 text-emerald-600" /></div><div><p className="text-2xl font-bold">{activeRules}</p><p className="text-xs text-muted-foreground">Active Rules</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30"><Activity className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{formatNumber(totalHits)}</p><p className="text-xs text-muted-foreground">Total Hits</p></div></div></CardContent></Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="rules" className="gap-2"><Layers className="h-4 w-4" />Rules</TabsTrigger>
            <TabsTrigger value="traffic" className="gap-2"><BarChart3 className="h-4 w-4" />Traffic</TabsTrigger>
            <TabsTrigger value="topology" className="gap-2"><Map className="h-4 w-4" />Map</TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2"><History className="h-4 w-4" />Timeline</TabsTrigger>
            <TabsTrigger value="links" className="gap-2"><Link2 className="h-4 w-4" />Links</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-4">
            <Card><CardContent className="pt-4"><div className="flex flex-wrap gap-4"><Select value={filterVpc} onValueChange={setFilterVpc}><SelectTrigger className="w-40"><SelectValue placeholder="All VPCs" /></SelectTrigger><SelectContent><SelectItem value="all">All VPCs</SelectItem>{vpcs.map(v => <SelectItem key={v} value={v}>{v.replace('cvs-', '').replace('-vpc', '')}</SelectItem>)}</SelectContent></Select><Select value={filterAction} onValueChange={setFilterAction}><SelectTrigger className="w-32"><SelectValue placeholder="All Actions" /></SelectTrigger><SelectContent><SelectItem value="all">All Actions</SelectItem><SelectItem value="allow">Allow</SelectItem><SelectItem value="deny">Deny</SelectItem></SelectContent></Select><Select value={filterDirection} onValueChange={setFilterDirection}><SelectTrigger className="w-32"><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="ingress">Ingress</SelectItem><SelectItem value="egress">Egress</SelectItem></SelectContent></Select></div></CardContent></Card>
            <div className="space-y-4">
              {Object.entries(rulesByVpc).map(([vpc, rules]) => (
                <Card key={vpc}><CardHeader><CardTitle className="flex items-center gap-2"><Network className="h-5 w-5" />{vpc.replace('cvs-', '').replace('-vpc', '').toUpperCase()}</CardTitle><CardDescription>{rules.length} rules • {rules.filter(r => r.action === 'allow').length} allow • {rules.filter(r => r.action === 'deny').length} deny</CardDescription></CardHeader><CardContent><div className="space-y-2">{rules.slice(0, 10).map(rule => (<div key={rule.id} className="p-3 rounded-lg border hover:bg-accent/30 flex items-center justify-between"><div className="flex items-center gap-3"><div className={cn("p-1.5 rounded", rule.action === 'allow' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30')}>{rule.action === 'allow' ? <ShieldCheck className="h-4 w-4 text-green-600" /> : <ShieldX className="h-4 w-4 text-red-600" />}</div><div><span className="font-medium text-sm">{rule.name}</span><div className="flex items-center gap-2 text-xs text-muted-foreground"><Badge variant="outline" className="text-xs">P:{rule.priority}</Badge><span>{rule.direction}</span><span>{rule.protocols.map(p => p.protocol).join(', ')}</span></div></div></div><div className="text-right"><p className="font-semibold">{formatNumber(rule.hitCount)}</p><p className="text-xs text-muted-foreground">hits</p></div></div>))}</div></CardContent></Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="traffic" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2"><CardHeader><CardTitle>Hit Count Over Time</CardTitle></CardHeader><CardContent><div className="h-64"><Line data={hitCountChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div></CardContent></Card>
              <Card><CardHeader><CardTitle>Rule Distribution</CardTitle></CardHeader><CardContent><div className="h-64"><Doughnut data={ruleDistributionData} options={{ responsive: true, maintainAspectRatio: false }} /></div></CardContent></Card>
            </div>
            <Card><CardHeader><CardTitle>Rules by VPC</CardTitle></CardHeader><CardContent><div className="h-64"><Bar data={vpcDistributionData} options={{ responsive: true, maintainAspectRatio: false }} /></div></CardContent></Card>
          </TabsContent>

          <TabsContent value="topology"><FirewallTopologyMap rules={filteredRules} /></TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />Rule Change History</CardTitle></CardHeader><CardContent><ScrollArea className="h-[500px]"><div className="space-y-4">{mockChangeEvents.slice(0, 30).map(event => (<div key={event.id} className="flex gap-4 p-3 rounded-lg border hover:bg-accent/30"><div className={cn("p-2 rounded-lg h-fit", event.changeType === 'created' ? 'bg-green-100' : event.changeType === 'deleted' ? 'bg-red-100' : 'bg-blue-100')}>{event.changeType === 'created' ? <CheckCircle className="h-4 w-4 text-green-600" /> : event.changeType === 'deleted' ? <XCircle className="h-4 w-4 text-red-600" /> : <Clock className="h-4 w-4 text-blue-600" />}</div><div className="flex-1"><p className="font-medium">{event.description}</p><div className="flex items-center gap-4 text-sm text-muted-foreground mt-1"><span className="flex items-center gap-1"><User className="h-3 w-3" />{event.user}</span><span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatTime(event.timestamp)}</span></div></div><Badge variant="outline">{event.changeType.replace('_', ' ')}</Badge></div>))}</div></ScrollArea></CardContent></Card>
          </TabsContent>

          <TabsContent value="links" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => navigate('/dashboard/logs')}><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30"><History className="h-6 w-6 text-blue-600" /></div><div><h3 className="font-semibold">View Logs</h3><p className="text-sm text-muted-foreground">See firewall logs</p></div><ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" /></div></CardContent></Card>
              <Card className="hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => navigate('/dashboard/incidents')}><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30"><AlertCircle className="h-6 w-6 text-red-600" /></div><div><h3 className="font-semibold">Incidents</h3><p className="text-sm text-muted-foreground">View related incidents</p></div><ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" /></div></CardContent></Card>
              <Card className="hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => navigate('/dashboard/network')}><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30"><Network className="h-6 w-6 text-purple-600" /></div><div><h3 className="font-semibold">Network Analysis</h3><p className="text-sm text-muted-foreground">Analyze traffic</p></div><ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" /></div></CardContent></Card>
              <Card className="hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => navigate('/dashboard/topology')}><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30"><Globe className="h-6 w-6 text-green-600" /></div><div><h3 className="font-semibold">Topology</h3><p className="text-sm text-muted-foreground">Network topology</p></div><ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" /></div></CardContent></Card>
              <Card className="hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => navigate('/dashboard/subnets')}><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Layers className="h-6 w-6 text-amber-600" /></div><div><h3 className="font-semibold">Subnets</h3><p className="text-sm text-muted-foreground">View subnets</p></div><ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" /></div></CardContent></Card>
              <Card className="hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => navigate('/dashboard/compliance')}><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/30"><Target className="h-6 w-6 text-indigo-600" /></div><div><h3 className="font-semibold">Compliance</h3><p className="text-sm text-muted-foreground">Check compliance</p></div><ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" /></div></CardContent></Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
