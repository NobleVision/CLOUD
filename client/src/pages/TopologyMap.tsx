import { useState, useCallback, useMemo, useEffect } from 'react';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,
  BackgroundVariant,
  Panel,
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Network,
  Server,
  Database,
  Globe,
  Shield,
  Cloud,
  HardDrive,
  Cpu,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  Wifi,
  Lock,
  Box,
  Layers,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  ArrowRightLeft,
  LayoutGrid,
  GitBranch,
  Circle,
  Shuffle,
  Move,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Node Types
type NodeStatus = 'healthy' | 'warning' | 'critical' | 'unknown';
type NodeType = 'loadBalancer' | 'compute' | 'database' | 'storage' | 'cache' | 'queue' | 'gateway' | 'external' | 'kubernetes' | 'vpc';

interface TopologyNodeData {
  label: string;
  type: NodeType;
  status: NodeStatus;
  metrics?: {
    cpu?: number;
    memory?: number;
    connections?: number;
    latency?: number;
    requests?: number;
    errorRate?: number;
  };
  details?: {
    region?: string;
    zone?: string;
    instanceType?: string;
    version?: string;
    replicas?: number;
  };
}

// Edge data interface for connection metrics
interface EdgeData {
  throughput: number; // requests per second
  utilization: number; // percentage 0-100
  latency: number; // milliseconds
  errorRate: number; // percentage 0-100
  packetDiscards: number; // count
  trafficVolume: string; // human readable
}

// Status colors
const getStatusColor = (status: NodeStatus) => {
  switch (status) {
    case 'healthy': return { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-500', glow: 'shadow-green-500/30' };
    case 'warning': return { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-500', glow: 'shadow-amber-500/30' };
    case 'critical': return { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-500', glow: 'shadow-red-500/30' };
    default: return { bg: 'bg-gray-500', border: 'border-gray-500', text: 'text-gray-500', glow: 'shadow-gray-500/30' };
  }
};

// Node icons
const getNodeIcon = (type: NodeType) => {
  switch (type) {
    case 'loadBalancer': return Globe;
    case 'compute': return Server;
    case 'database': return Database;
    case 'storage': return HardDrive;
    case 'cache': return Zap;
    case 'queue': return Layers;
    case 'gateway': return Shield;
    case 'external': return Cloud;
    case 'kubernetes': return Box;
    case 'vpc': return Network;
    default: return Cpu;
  }
};

// Custom Node Component
function TopologyNode({ data, selected }: { data: TopologyNodeData; selected: boolean }) {
  const Icon = getNodeIcon(data.type);
  const colors = getStatusColor(data.status);

  return (
    <div
      className={cn(
        "relative px-4 py-3 rounded-xl border-2 bg-card transition-all duration-300 min-w-[140px]",
        colors.border,
        selected && `ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg ${colors.glow}`,
        !selected && "hover:shadow-md"
      )}
    >
      {/* Connection handles */}
      <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3 !border-2 !border-background" />
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3 !border-2 !border-background" />
      <Handle type="target" position={Position.Left} className="!bg-primary !w-3 !h-3 !border-2 !border-background" />
      <Handle type="source" position={Position.Right} className="!bg-primary !w-3 !h-3 !border-2 !border-background" />

      {/* Status indicator pulse */}
      {data.status === 'critical' && (
        <div className="absolute -top-1 -right-1">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", `${colors.bg}/20`)}>
          <Icon className={cn("h-5 w-5", colors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{data.label}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={cn("h-1.5 w-1.5 rounded-full", colors.bg)} />
            <span className="text-xs text-muted-foreground capitalize">{data.status}</span>
          </div>
        </div>
      </div>

      {/* Mini metrics */}
      {data.metrics && (
        <div className="flex gap-3 mt-2 pt-2 border-t border-border/50">
          {data.metrics.cpu !== undefined && (
            <div className="text-xs">
              <span className="text-muted-foreground">CPU</span>
              <span className={cn("ml-1 font-medium", data.metrics.cpu > 80 ? "text-red-500" : data.metrics.cpu > 60 ? "text-amber-500" : "text-green-500")}>
                {data.metrics.cpu}%
              </span>
            </div>
          )}
          {data.metrics.latency !== undefined && (
            <div className="text-xs">
              <span className="text-muted-foreground">Lat</span>
              <span className={cn("ml-1 font-medium", data.metrics.latency > 100 ? "text-red-500" : data.metrics.latency > 50 ? "text-amber-500" : "text-green-500")}>
                {data.metrics.latency}ms
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Custom Interactive Edge Component
function TopologyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
  markerEnd,
  selected,
}: EdgeProps<EdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Calculate stroke width based on utilization (2-8px)
  const strokeWidth = data?.utilization ? Math.max(2, Math.min(8, 2 + (data.utilization / 100) * 6)) : 2;

  // Determine color based on health
  const getEdgeColor = () => {
    if (!data) return style?.stroke || '#3b82f6';
    if (data.errorRate > 5) return '#ef4444'; // Red for errors
    if (data.utilization > 80) return '#f59e0b'; // Amber for high utilization
    return style?.stroke || '#22c55e'; // Green for healthy
  };

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path cursor-pointer transition-all duration-200"
        d={edgePath}
        style={{
          ...style,
          stroke: getEdgeColor(),
          strokeWidth: selected ? strokeWidth + 2 : strokeWidth,
          filter: selected ? 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' : undefined,
        }}
        markerEnd={markerEnd}
      />
      {/* Invisible wider path for easier clicking */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={20}
        stroke="transparent"
        className="cursor-pointer"
      />
    </>
  );
}

// Node types configuration
const nodeTypes = {
  topology: TopologyNode,
};

// Edge types configuration
const edgeTypes = {
  topology: TopologyEdge,
};

// Mock topology data - GCP Infrastructure - PRODUCTION
const productionNodes: Node<TopologyNodeData>[] = [
  // External / Internet
  { id: 'internet', type: 'topology', position: { x: 400, y: 0 }, data: { label: 'Internet', type: 'external', status: 'healthy' } },

  // Load Balancers
  { id: 'lb-global', type: 'topology', position: { x: 400, y: 100 }, data: { label: 'Global LB', type: 'loadBalancer', status: 'healthy', metrics: { requests: 12500, latency: 12 } } },

  // API Gateway
  { id: 'api-gateway', type: 'topology', position: { x: 400, y: 200 }, data: { label: 'API Gateway', type: 'gateway', status: 'healthy', metrics: { requests: 11800, latency: 8 } } },

  // Kubernetes Cluster
  { id: 'gke-cluster', type: 'topology', position: { x: 400, y: 300 }, data: { label: 'GKE Cluster', type: 'kubernetes', status: 'healthy', details: { region: 'us-central1', replicas: 5 } } },

  // Microservices Row
  { id: 'auth-service', type: 'topology', position: { x: 100, y: 420 }, data: { label: 'Auth Service', type: 'compute', status: 'healthy', metrics: { cpu: 45, memory: 62, latency: 15 } } },
  { id: 'user-service', type: 'topology', position: { x: 280, y: 420 }, data: { label: 'User Service', type: 'compute', status: 'healthy', metrics: { cpu: 38, memory: 55, latency: 22 } } },
  { id: 'order-service', type: 'topology', position: { x: 460, y: 420 }, data: { label: 'Order Service', type: 'compute', status: 'warning', metrics: { cpu: 78, memory: 71, latency: 85 } } },
  { id: 'payment-service', type: 'topology', position: { x: 640, y: 420 }, data: { label: 'Payment Service', type: 'compute', status: 'healthy', metrics: { cpu: 52, memory: 48, latency: 35 } } },
  { id: 'notify-service', type: 'topology', position: { x: 820, y: 420 }, data: { label: 'Notification', type: 'compute', status: 'healthy', metrics: { cpu: 25, memory: 40, latency: 18 } } },

  // Data Layer
  { id: 'redis-cache', type: 'topology', position: { x: 150, y: 550 }, data: { label: 'Redis Cache', type: 'cache', status: 'healthy', metrics: { connections: 1250, latency: 2 } } },
  { id: 'postgres-primary', type: 'topology', position: { x: 350, y: 550 }, data: { label: 'PostgreSQL Primary', type: 'database', status: 'healthy', metrics: { connections: 85, cpu: 55 } } },
  { id: 'postgres-replica', type: 'topology', position: { x: 550, y: 550 }, data: { label: 'PostgreSQL Replica', type: 'database', status: 'healthy', metrics: { connections: 45, cpu: 32 } } },
  { id: 'pub-sub', type: 'topology', position: { x: 750, y: 550 }, data: { label: 'Pub/Sub', type: 'queue', status: 'healthy', metrics: { connections: 320 } } },

  // Storage
  { id: 'gcs-bucket', type: 'topology', position: { x: 450, y: 680 }, data: { label: 'Cloud Storage', type: 'storage', status: 'healthy' } },

  // VPC
  { id: 'vpc-network', type: 'topology', position: { x: 950, y: 300 }, data: { label: 'VPC Network', type: 'vpc', status: 'healthy', details: { region: 'us-central1' } } },
];

const productionEdges: Edge<EdgeData>[] = [
  // Internet to LB
  { id: 'e-internet-lb', type: 'topology', source: 'internet', target: 'lb-global', animated: true, style: { stroke: '#22c55e' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' }, data: { throughput: 12500, utilization: 45, latency: 12, errorRate: 0.2, packetDiscards: 3, trafficVolume: '2.4 GB/s' } },
  // LB to API Gateway
  { id: 'e-lb-api', type: 'topology', source: 'lb-global', target: 'api-gateway', animated: true, style: { stroke: '#22c55e' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' }, data: { throughput: 11800, utilization: 42, latency: 8, errorRate: 0.1, packetDiscards: 1, trafficVolume: '2.2 GB/s' } },
  // API Gateway to GKE
  { id: 'e-api-gke', type: 'topology', source: 'api-gateway', target: 'gke-cluster', animated: true, style: { stroke: '#22c55e' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' }, data: { throughput: 11500, utilization: 40, latency: 5, errorRate: 0.1, packetDiscards: 0, trafficVolume: '2.1 GB/s' } },
  // GKE to Services
  { id: 'e-gke-auth', type: 'topology', source: 'gke-cluster', target: 'auth-service', style: { stroke: '#3b82f6' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }, data: { throughput: 3200, utilization: 35, latency: 15, errorRate: 0.3, packetDiscards: 0, trafficVolume: '450 MB/s' } },
  { id: 'e-gke-user', type: 'topology', source: 'gke-cluster', target: 'user-service', style: { stroke: '#3b82f6' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }, data: { throughput: 2800, utilization: 30, latency: 22, errorRate: 0.2, packetDiscards: 0, trafficVolume: '380 MB/s' } },
  { id: 'e-gke-order', type: 'topology', source: 'gke-cluster', target: 'order-service', style: { stroke: '#f59e0b' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' }, data: { throughput: 4500, utilization: 85, latency: 85, errorRate: 2.5, packetDiscards: 12, trafficVolume: '720 MB/s' } },
  { id: 'e-gke-payment', type: 'topology', source: 'gke-cluster', target: 'payment-service', style: { stroke: '#3b82f6' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }, data: { throughput: 1800, utilization: 55, latency: 35, errorRate: 0.5, packetDiscards: 2, trafficVolume: '280 MB/s' } },
  { id: 'e-gke-notify', type: 'topology', source: 'gke-cluster', target: 'notify-service', style: { stroke: '#3b82f6' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }, data: { throughput: 950, utilization: 20, latency: 18, errorRate: 0.1, packetDiscards: 0, trafficVolume: '120 MB/s' } },
  // Services to Data Layer
  { id: 'e-auth-redis', type: 'topology', source: 'auth-service', target: 'redis-cache', style: { stroke: '#8b5cf6' }, data: { throughput: 8500, utilization: 65, latency: 2, errorRate: 0.0, packetDiscards: 0, trafficVolume: '85 MB/s' } },
  { id: 'e-user-postgres', type: 'topology', source: 'user-service', target: 'postgres-primary', style: { stroke: '#8b5cf6' }, data: { throughput: 1200, utilization: 40, latency: 8, errorRate: 0.1, packetDiscards: 0, trafficVolume: '45 MB/s' } },
  { id: 'e-order-postgres', type: 'topology', source: 'order-service', target: 'postgres-primary', style: { stroke: '#f59e0b' }, data: { throughput: 2800, utilization: 75, latency: 25, errorRate: 1.2, packetDiscards: 5, trafficVolume: '180 MB/s' } },
  { id: 'e-order-replica', type: 'topology', source: 'order-service', target: 'postgres-replica', style: { stroke: '#8b5cf6', strokeDasharray: '5,5' }, data: { throughput: 800, utilization: 25, latency: 12, errorRate: 0.0, packetDiscards: 0, trafficVolume: '35 MB/s' } },
  { id: 'e-payment-postgres', type: 'topology', source: 'payment-service', target: 'postgres-primary', style: { stroke: '#8b5cf6' }, data: { throughput: 950, utilization: 35, latency: 10, errorRate: 0.2, packetDiscards: 0, trafficVolume: '42 MB/s' } },
  { id: 'e-notify-pubsub', type: 'topology', source: 'notify-service', target: 'pub-sub', style: { stroke: '#8b5cf6' }, data: { throughput: 2200, utilization: 30, latency: 5, errorRate: 0.0, packetDiscards: 0, trafficVolume: '95 MB/s' } },
  { id: 'e-order-pubsub', type: 'topology', source: 'order-service', target: 'pub-sub', style: { stroke: '#f59e0b' }, data: { throughput: 3500, utilization: 60, latency: 8, errorRate: 0.8, packetDiscards: 3, trafficVolume: '145 MB/s' } },
  // Database replication
  { id: 'e-pg-replication', type: 'topology', source: 'postgres-primary', target: 'postgres-replica', animated: true, style: { stroke: '#6366f1', strokeDasharray: '5,5' }, data: { throughput: 500, utilization: 45, latency: 3, errorRate: 0.0, packetDiscards: 0, trafficVolume: '25 MB/s' } },
  // Storage connections
  { id: 'e-postgres-gcs', type: 'topology', source: 'postgres-primary', target: 'gcs-bucket', style: { stroke: '#94a3b8', strokeDasharray: '5,5' }, data: { throughput: 150, utilization: 15, latency: 20, errorRate: 0.0, packetDiscards: 0, trafficVolume: '8 MB/s' } },
  // VPC connections
  { id: 'e-gke-vpc', type: 'topology', source: 'gke-cluster', target: 'vpc-network', style: { stroke: '#06b6d4', strokeDasharray: '5,5' }, data: { throughput: 0, utilization: 5, latency: 1, errorRate: 0.0, packetDiscards: 0, trafficVolume: '0 B/s' } },
];

// STAGING Environment - Smaller topology
const stagingNodes: Node<TopologyNodeData>[] = [
  { id: 'internet', type: 'topology', position: { x: 350, y: 0 }, data: { label: 'Internet', type: 'external', status: 'healthy' } },
  { id: 'lb-global', type: 'topology', position: { x: 350, y: 100 }, data: { label: 'Staging LB', type: 'loadBalancer', status: 'healthy', metrics: { requests: 1500, latency: 18 } } },
  { id: 'api-gateway', type: 'topology', position: { x: 350, y: 200 }, data: { label: 'API Gateway', type: 'gateway', status: 'healthy', metrics: { requests: 1400, latency: 12 } } },
  { id: 'gke-cluster', type: 'topology', position: { x: 350, y: 300 }, data: { label: 'GKE Staging', type: 'kubernetes', status: 'healthy', details: { region: 'us-central1', replicas: 2 } } },
  { id: 'auth-service', type: 'topology', position: { x: 150, y: 420 }, data: { label: 'Auth Service', type: 'compute', status: 'healthy', metrics: { cpu: 32, memory: 45, latency: 20 } } },
  { id: 'order-service', type: 'topology', position: { x: 350, y: 420 }, data: { label: 'Order Service', type: 'compute', status: 'healthy', metrics: { cpu: 28, memory: 38, latency: 35 } } },
  { id: 'payment-service', type: 'topology', position: { x: 550, y: 420 }, data: { label: 'Payment Service', type: 'compute', status: 'warning', metrics: { cpu: 65, memory: 58, latency: 55 } } },
  { id: 'redis-cache', type: 'topology', position: { x: 200, y: 550 }, data: { label: 'Redis Cache', type: 'cache', status: 'healthy', metrics: { connections: 250, latency: 3 } } },
  { id: 'postgres-primary', type: 'topology', position: { x: 450, y: 550 }, data: { label: 'PostgreSQL', type: 'database', status: 'healthy', metrics: { connections: 25, cpu: 35 } } },
];

const stagingEdges: Edge<EdgeData>[] = [
  { id: 'e-internet-lb', type: 'topology', source: 'internet', target: 'lb-global', animated: true, style: { stroke: '#22c55e' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' }, data: { throughput: 1500, utilization: 25, latency: 18, errorRate: 0.1, packetDiscards: 0, trafficVolume: '180 MB/s' } },
  { id: 'e-lb-api', type: 'topology', source: 'lb-global', target: 'api-gateway', animated: true, style: { stroke: '#22c55e' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' }, data: { throughput: 1400, utilization: 22, latency: 12, errorRate: 0.1, packetDiscards: 0, trafficVolume: '165 MB/s' } },
  { id: 'e-api-gke', type: 'topology', source: 'api-gateway', target: 'gke-cluster', animated: true, style: { stroke: '#22c55e' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' }, data: { throughput: 1350, utilization: 20, latency: 8, errorRate: 0.0, packetDiscards: 0, trafficVolume: '155 MB/s' } },
  { id: 'e-gke-auth', type: 'topology', source: 'gke-cluster', target: 'auth-service', style: { stroke: '#3b82f6' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }, data: { throughput: 450, utilization: 20, latency: 20, errorRate: 0.0, packetDiscards: 0, trafficVolume: '45 MB/s' } },
  { id: 'e-gke-order', type: 'topology', source: 'gke-cluster', target: 'order-service', style: { stroke: '#3b82f6' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }, data: { throughput: 520, utilization: 25, latency: 35, errorRate: 0.2, packetDiscards: 0, trafficVolume: '55 MB/s' } },
  { id: 'e-gke-payment', type: 'topology', source: 'gke-cluster', target: 'payment-service', style: { stroke: '#f59e0b' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' }, data: { throughput: 280, utilization: 65, latency: 55, errorRate: 1.5, packetDiscards: 2, trafficVolume: '32 MB/s' } },
  { id: 'e-auth-redis', type: 'topology', source: 'auth-service', target: 'redis-cache', style: { stroke: '#8b5cf6' }, data: { throughput: 850, utilization: 30, latency: 3, errorRate: 0.0, packetDiscards: 0, trafficVolume: '12 MB/s' } },
  { id: 'e-order-postgres', type: 'topology', source: 'order-service', target: 'postgres-primary', style: { stroke: '#8b5cf6' }, data: { throughput: 320, utilization: 25, latency: 12, errorRate: 0.1, packetDiscards: 0, trafficVolume: '18 MB/s' } },
  { id: 'e-payment-postgres', type: 'topology', source: 'payment-service', target: 'postgres-primary', style: { stroke: '#8b5cf6' }, data: { throughput: 180, utilization: 20, latency: 15, errorRate: 0.2, packetDiscards: 0, trafficVolume: '10 MB/s' } },
];

// DEVELOPMENT Environment - Minimal topology
const developmentNodes: Node<TopologyNodeData>[] = [
  { id: 'internet', type: 'topology', position: { x: 300, y: 0 }, data: { label: 'Local Dev', type: 'external', status: 'healthy' } },
  { id: 'api-gateway', type: 'topology', position: { x: 300, y: 120 }, data: { label: 'Dev Gateway', type: 'gateway', status: 'healthy', metrics: { requests: 50, latency: 5 } } },
  { id: 'app-service', type: 'topology', position: { x: 300, y: 250 }, data: { label: 'App Service', type: 'compute', status: 'healthy', metrics: { cpu: 15, memory: 28, latency: 12 } } },
  { id: 'postgres-dev', type: 'topology', position: { x: 300, y: 380 }, data: { label: 'PostgreSQL Dev', type: 'database', status: 'healthy', metrics: { connections: 5, cpu: 8 } } },
];

const developmentEdges: Edge<EdgeData>[] = [
  { id: 'e-internet-api', type: 'topology', source: 'internet', target: 'api-gateway', animated: true, style: { stroke: '#22c55e' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' }, data: { throughput: 50, utilization: 5, latency: 5, errorRate: 0.0, packetDiscards: 0, trafficVolume: '5 MB/s' } },
  { id: 'e-api-app', type: 'topology', source: 'api-gateway', target: 'app-service', animated: true, style: { stroke: '#22c55e' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' }, data: { throughput: 45, utilization: 4, latency: 8, errorRate: 0.0, packetDiscards: 0, trafficVolume: '4 MB/s' } },
  { id: 'e-app-postgres', type: 'topology', source: 'app-service', target: 'postgres-dev', style: { stroke: '#8b5cf6' }, data: { throughput: 30, utilization: 8, latency: 3, errorRate: 0.0, packetDiscards: 0, trafficVolume: '2 MB/s' } },
];

// Environment topology configurations
const environmentTopologies: Record<string, { nodes: Node<TopologyNodeData>[]; edges: Edge<EdgeData>[] }> = {
  production: { nodes: productionNodes, edges: productionEdges },
  staging: { nodes: stagingNodes, edges: stagingEdges },
  development: { nodes: developmentNodes, edges: developmentEdges },
};

// Layout types
type LayoutType = 'manual' | 'hierarchical' | 'circular' | 'grid' | 'force';

const layoutOptions: { value: LayoutType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'manual', label: 'Manual', icon: Move },
  { value: 'hierarchical', label: 'Hierarchical', icon: GitBranch },
  { value: 'circular', label: 'Circular', icon: Circle },
  { value: 'grid', label: 'Grid', icon: LayoutGrid },
  { value: 'force', label: 'Force-Directed', icon: Shuffle },
];

// Layout algorithm functions
function applyHierarchicalLayout(nodes: Node<TopologyNodeData>[], edges: Edge<EdgeData>[]): Node<TopologyNodeData>[] {
  // Build adjacency list and find root nodes (nodes with no incoming edges)
  const incomingCount: Record<string, number> = {};
  const children: Record<string, string[]> = {};

  nodes.forEach(n => {
    incomingCount[n.id] = 0;
    children[n.id] = [];
  });

  edges.forEach(e => {
    incomingCount[e.target] = (incomingCount[e.target] || 0) + 1;
    if (!children[e.source]) children[e.source] = [];
    children[e.source].push(e.target);
  });

  // Find root nodes
  const roots = nodes.filter(n => incomingCount[n.id] === 0);

  // BFS to assign levels
  const levels: Record<string, number> = {};
  const queue = roots.map(r => ({ id: r.id, level: 0 }));
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    levels[id] = Math.max(levels[id] ?? 0, level);

    (children[id] || []).forEach(childId => {
      if (!visited.has(childId)) {
        queue.push({ id: childId, level: level + 1 });
      }
    });
  }

  // Handle disconnected nodes
  nodes.forEach(n => {
    if (!visited.has(n.id)) {
      levels[n.id] = 0;
    }
  });

  // Group nodes by level
  const levelGroups: Record<number, string[]> = {};
  Object.entries(levels).forEach(([id, level]) => {
    if (!levelGroups[level]) levelGroups[level] = [];
    levelGroups[level].push(id);
  });

  // Calculate positions
  const levelHeight = 130;
  const nodeWidth = 200;

  return nodes.map(node => {
    const level = levels[node.id] ?? 0;
    const nodesInLevel = levelGroups[level] || [node.id];
    const indexInLevel = nodesInLevel.indexOf(node.id);
    const totalWidth = nodesInLevel.length * nodeWidth;
    const startX = (800 - totalWidth) / 2 + nodeWidth / 2;

    return {
      ...node,
      position: {
        x: startX + indexInLevel * nodeWidth,
        y: level * levelHeight + 50,
      },
    };
  });
}

function applyCircularLayout(nodes: Node<TopologyNodeData>[]): Node<TopologyNodeData>[] {
  const centerX = 450;
  const centerY = 350;
  const radius = Math.min(300, 50 + nodes.length * 25);

  return nodes.map((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI - Math.PI / 2;
    return {
      ...node,
      position: {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      },
    };
  });
}

function applyGridLayout(nodes: Node<TopologyNodeData>[]): Node<TopologyNodeData>[] {
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const nodeWidth = 200;
  const nodeHeight = 120;
  const padding = 50;

  return nodes.map((node, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    return {
      ...node,
      position: {
        x: padding + col * nodeWidth,
        y: padding + row * nodeHeight,
      },
    };
  });
}

function applyForceDirectedLayout(nodes: Node<TopologyNodeData>[], edges: Edge<EdgeData>[]): Node<TopologyNodeData>[] {
  // Simple force-directed simulation
  const positions: Record<string, { x: number; y: number }> = {};

  // Initialize with current positions or random
  nodes.forEach(node => {
    positions[node.id] = {
      x: node.position.x || 400 + Math.random() * 200,
      y: node.position.y || 300 + Math.random() * 200
    };
  });

  // Build edge map for connected nodes
  const connections: Record<string, Set<string>> = {};
  nodes.forEach(n => connections[n.id] = new Set());
  edges.forEach(e => {
    connections[e.source]?.add(e.target);
    connections[e.target]?.add(e.source);
  });

  // Run simulation iterations
  const iterations = 50;
  const repulsion = 8000;
  const attraction = 0.05;
  const damping = 0.85;

  for (let iter = 0; iter < iterations; iter++) {
    const forces: Record<string, { x: number; y: number }> = {};
    nodes.forEach(n => forces[n.id] = { x: 0, y: 0 });

    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];
        const dx = positions[n1.id].x - positions[n2.id].x;
        const dy = positions[n1.id].y - positions[n2.id].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsion / (dist * dist);

        forces[n1.id].x += (dx / dist) * force;
        forces[n1.id].y += (dy / dist) * force;
        forces[n2.id].x -= (dx / dist) * force;
        forces[n2.id].y -= (dy / dist) * force;
      }
    }

    // Attraction along edges
    edges.forEach(edge => {
      const source = positions[edge.source];
      const target = positions[edge.target];
      if (!source || !target) return;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      forces[edge.source].x += dx * attraction;
      forces[edge.source].y += dy * attraction;
      forces[edge.target].x -= dx * attraction;
      forces[edge.target].y -= dy * attraction;
    });

    // Apply forces with damping
    nodes.forEach(node => {
      positions[node.id].x += forces[node.id].x * damping;
      positions[node.id].y += forces[node.id].y * damping;

      // Keep within bounds
      positions[node.id].x = Math.max(50, Math.min(850, positions[node.id].x));
      positions[node.id].y = Math.max(50, Math.min(650, positions[node.id].y));
    });
  }

  return nodes.map(node => ({
    ...node,
    position: positions[node.id],
  }));
}

function applyLayout(
  layout: LayoutType,
  nodes: Node<TopologyNodeData>[],
  edges: Edge<EdgeData>[],
  originalNodes: Node<TopologyNodeData>[]
): Node<TopologyNodeData>[] {
  switch (layout) {
    case 'hierarchical':
      return applyHierarchicalLayout(nodes, edges);
    case 'circular':
      return applyCircularLayout(nodes);
    case 'grid':
      return applyGridLayout(nodes);
    case 'force':
      return applyForceDirectedLayout(nodes, edges);
    case 'manual':
    default:
      // Return to original positions
      return nodes.map(node => {
        const original = originalNodes.find(n => n.id === node.id);
        return original ? { ...node, position: original.position } : node;
      });
  }
}


// Selected node details panel
function NodeDetailsPanel({ node, onClose, onNavigate }: { node: Node<TopologyNodeData> | null; onClose: () => void; onNavigate: (path: string) => void }) {
  if (!node) return null;

  const data = node.data;
  const Icon = getNodeIcon(data.type);
  const colors = getStatusColor(data.status);

  return (
    <div className="absolute top-4 right-4 w-80 bg-card border rounded-xl shadow-xl z-10 overflow-hidden">
      <div className={cn("p-4 border-b", `${colors.bg}/10`)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", `${colors.bg}/20`)}>
              <Icon className={cn("h-5 w-5", colors.text)} />
            </div>
            <div>
              <h3 className="font-semibold">{data.label}</h3>
              <p className="text-xs text-muted-foreground capitalize">{data.type.replace(/([A-Z])/g, ' $1').trim()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn(colors.bg, "text-white")}>{data.status}</Badge>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Metrics */}
        {data.metrics && Object.keys(data.metrics).length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Live Metrics
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {data.metrics.cpu !== undefined && (
                <div className="p-2 rounded-lg bg-muted/50">
                  <span className="text-xs text-muted-foreground">CPU Usage</span>
                  <p className={cn("font-semibold", data.metrics.cpu > 80 ? "text-red-500" : data.metrics.cpu > 60 ? "text-amber-500" : "text-green-500")}>
                    {data.metrics.cpu}%
                  </p>
                </div>
              )}
              {data.metrics.memory !== undefined && (
                <div className="p-2 rounded-lg bg-muted/50">
                  <span className="text-xs text-muted-foreground">Memory</span>
                  <p className={cn("font-semibold", data.metrics.memory > 80 ? "text-red-500" : data.metrics.memory > 60 ? "text-amber-500" : "text-green-500")}>
                    {data.metrics.memory}%
                  </p>
                </div>
              )}
              {data.metrics.latency !== undefined && (
                <div className="p-2 rounded-lg bg-muted/50">
                  <span className="text-xs text-muted-foreground">Latency</span>
                  <p className={cn("font-semibold", data.metrics.latency > 100 ? "text-red-500" : data.metrics.latency > 50 ? "text-amber-500" : "text-green-500")}>
                    {data.metrics.latency}ms
                  </p>
                </div>
              )}
              {data.metrics.connections !== undefined && (
                <div className="p-2 rounded-lg bg-muted/50">
                  <span className="text-xs text-muted-foreground">Connections</span>
                  <p className="font-semibold">{data.metrics.connections.toLocaleString()}</p>
                </div>
              )}
              {data.metrics.requests !== undefined && (
                <div className="p-2 rounded-lg bg-muted/50">
                  <span className="text-xs text-muted-foreground">Requests/s</span>
                  <p className="font-semibold">{data.metrics.requests.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Details */}
        {data.details && Object.keys(data.details).length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              Configuration
            </h4>
            <div className="space-y-1 text-sm">
              {data.details.region && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Region</span>
                  <span className="font-medium">{data.details.region}</span>
                </div>
              )}
              {data.details.zone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Zone</span>
                  <span className="font-medium">{data.details.zone}</span>
                </div>
              )}
              {data.details.instanceType && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Instance Type</span>
                  <span className="font-medium font-mono text-xs">{data.details.instanceType}</span>
                </div>
              )}
              {data.details.replicas !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Replicas</span>
                  <span className="font-medium">{data.details.replicas}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => onNavigate('/dashboard/metrics')}>View Metrics</Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onNavigate('/dashboard/logs')}>View Logs</Button>
        </div>
      </div>
    </div>
  );
}

// Selected edge details panel
function EdgeDetailsPanel({ edge, nodes, onClose }: { edge: Edge<EdgeData> | null; nodes: Node<TopologyNodeData>[]; onClose: () => void }) {
  if (!edge || !edge.data) return null;

  const data = edge.data;
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  // Determine health color based on metrics
  const getHealthColor = () => {
    if (data.errorRate > 5) return { bg: 'bg-red-500', text: 'text-red-500', label: 'Critical' };
    if (data.utilization > 80 || data.errorRate > 1) return { bg: 'bg-amber-500', text: 'text-amber-500', label: 'Warning' };
    return { bg: 'bg-green-500', text: 'text-green-500', label: 'Healthy' };
  };

  const health = getHealthColor();

  return (
    <div className="absolute top-4 right-4 w-80 bg-card border rounded-xl shadow-xl z-10 overflow-hidden">
      <div className={cn("p-4 border-b", `${health.bg}/10`)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", `${health.bg}/20`)}>
              <ArrowRightLeft className={cn("h-5 w-5", health.text)} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Connection Details</h3>
              <p className="text-xs text-muted-foreground">
                {sourceNode?.data.label || edge.source} → {targetNode?.data.label || edge.target}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn(health.bg, "text-white")}>{health.label}</Badge>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Traffic Metrics
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-muted/50">
              <span className="text-xs text-muted-foreground">Throughput</span>
              <p className="font-semibold">{data.throughput.toLocaleString()} req/s</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <span className="text-xs text-muted-foreground">Traffic Volume</span>
              <p className="font-semibold">{data.trafficVolume}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <span className="text-xs text-muted-foreground">Utilization</span>
              <p className={cn("font-semibold", data.utilization > 80 ? "text-red-500" : data.utilization > 60 ? "text-amber-500" : "text-green-500")}>
                {data.utilization}%
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <span className="text-xs text-muted-foreground">Latency</span>
              <p className={cn("font-semibold", data.latency > 100 ? "text-red-500" : data.latency > 50 ? "text-amber-500" : "text-green-500")}>
                {data.latency}ms
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Error Metrics
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-muted/50">
              <span className="text-xs text-muted-foreground">Error Rate</span>
              <p className={cn("font-semibold", data.errorRate > 5 ? "text-red-500" : data.errorRate > 1 ? "text-amber-500" : "text-green-500")}>
                {data.errorRate}%
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <span className="text-xs text-muted-foreground">Packet Discards</span>
              <p className={cn("font-semibold", data.packetDiscards > 10 ? "text-red-500" : data.packetDiscards > 0 ? "text-amber-500" : "text-green-500")}>
                {data.packetDiscards}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// Main Component
export default function TopologyMap() {
  const [, navigate] = useLocation();
  const [environment, setEnvironment] = useState('production');
  const [layout, setLayout] = useState<LayoutType>('manual');
  const [nodes, setNodes, onNodesChange] = useNodesState(environmentTopologies[environment].nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(environmentTopologies[environment].edges);
  const [selectedNode, setSelectedNode] = useState<Node<TopologyNodeData> | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge<EdgeData> | null>(null);
  const [showAnimations, setShowAnimations] = useState(true);
  const [showMiniMap, setShowMiniMap] = useState(true);

  // Store original positions for each environment
  const originalPositions = useMemo(() => {
    return Object.fromEntries(
      Object.entries(environmentTopologies).map(([env, topo]) => [
        env,
        topo.nodes,
      ])
    );
  }, []);

  // Switch environment - load different topology
  useEffect(() => {
    const topology = environmentTopologies[environment];
    const baseNodes = topology.nodes;
    const baseEdges = topology.edges;

    // Apply current layout to new environment
    const layoutedNodes = applyLayout(layout, baseNodes, baseEdges, baseNodes);
    setNodes(layoutedNodes);
    setEdges(baseEdges);
    setSelectedNode(null);
    setSelectedEdge(null);
  }, [environment, setNodes, setEdges]);

  // Apply layout when layout type changes
  useEffect(() => {
    const originalNodes = originalPositions[environment] || nodes;
    const layoutedNodes = applyLayout(layout, nodes, edges, originalNodes);
    setNodes(layoutedNodes);
  }, [layout]);

  // Handle node selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<TopologyNodeData>) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  // Handle edge selection
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge<EdgeData>) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  // Handle background click to deselect
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  // Simulate live updates - metrics AND status changes
  useEffect(() => {
    if (!showAnimations) return;

    const interval = setInterval(() => {
      // Update node metrics and occasionally status
      setNodes((nds) =>
        nds.map((node) => {
          const newData = { ...node.data };

          // Update metrics if present
          if (newData.metrics) {
            const newMetrics = { ...newData.metrics };
            if (newMetrics.cpu !== undefined) {
              newMetrics.cpu = Math.max(10, Math.min(95, newMetrics.cpu + (Math.random() - 0.5) * 10));
              newMetrics.cpu = Math.round(newMetrics.cpu);
            }
            if (newMetrics.latency !== undefined) {
              newMetrics.latency = Math.max(5, Math.min(200, newMetrics.latency + (Math.random() - 0.5) * 20));
              newMetrics.latency = Math.round(newMetrics.latency);
            }
            newData.metrics = newMetrics;

            // Randomly change status based on metrics (5% chance per update)
            if (Math.random() < 0.05) {
              const cpu = newMetrics.cpu || 0;
              const latency = newMetrics.latency || 0;
              if (cpu > 85 || latency > 150) {
                newData.status = 'critical';
              } else if (cpu > 70 || latency > 80) {
                newData.status = 'warning';
              } else {
                newData.status = 'healthy';
              }
            }
          } else {
            // For nodes without metrics, occasionally flip status (2% chance)
            if (Math.random() < 0.02) {
              const statuses: NodeStatus[] = ['healthy', 'warning', 'critical'];
              const currentIdx = statuses.indexOf(newData.status);
              // Bias towards healthy
              const rand = Math.random();
              if (rand < 0.7) {
                newData.status = 'healthy';
              } else if (rand < 0.9) {
                newData.status = 'warning';
              } else {
                newData.status = 'critical';
              }
            }
          }

          return { ...node, data: newData };
        })
      );

      // Update edge metrics
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.data) {
            const newData = { ...edge.data };
            // Fluctuate utilization and error rate
            newData.utilization = Math.max(5, Math.min(95, newData.utilization + (Math.random() - 0.5) * 10));
            newData.utilization = Math.round(newData.utilization);
            newData.latency = Math.max(1, Math.min(150, newData.latency + (Math.random() - 0.5) * 10));
            newData.latency = Math.round(newData.latency);
            // Small chance to spike error rate
            if (Math.random() < 0.05) {
              newData.errorRate = Math.min(10, newData.errorRate + Math.random() * 3);
            } else {
              newData.errorRate = Math.max(0, newData.errorRate - 0.5);
            }
            newData.errorRate = Math.round(newData.errorRate * 10) / 10;
            return { ...edge, data: newData };
          }
          return edge;
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [showAnimations, setNodes, setEdges]);

  // Summary stats
  const stats = useMemo(() => {
    const healthy = nodes.filter(n => n.data.status === 'healthy').length;
    const warning = nodes.filter(n => n.data.status === 'warning').length;
    const critical = nodes.filter(n => n.data.status === 'critical').length;
    return { healthy, warning, critical, total: nodes.length };
  }, [nodes]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                <Network className="h-7 w-7 text-blue-500" />
              </div>
              Live Topology Map
            </h1>
            <p className="text-muted-foreground mt-1">
              Interactive infrastructure visualization with real-time metrics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={environment} onValueChange={setEnvironment}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="development">Development</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Layers className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Nodes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.healthy}</p>
                  <p className="text-xs text-muted-foreground">Healthy</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.warning}</p>
                  <p className="text-xs text-muted-foreground">Warning</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Activity className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.critical}</p>
                  <p className="text-xs text-muted-foreground">Critical</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Topology Map */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-primary" />
                  Infrastructure Topology
                </CardTitle>
                <CardDescription>
                  Click nodes or edges for details. Drag to reposition. Scroll to zoom.
                </CardDescription>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                {/* Layout Selector */}
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Layout:</Label>
                  <div className="flex bg-muted rounded-lg p-0.5">
                    {layoutOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <TooltipProvider key={option.value}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setLayout(option.value)}
                                className={cn(
                                  "p-2 rounded-md transition-all duration-200",
                                  layout === option.value
                                    ? "bg-background shadow-sm text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>{option.label}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                </div>
                <Separator orientation="vertical" className="h-6 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <Switch id="animations" checked={showAnimations} onCheckedChange={setShowAnimations} />
                  <Label htmlFor="animations" className="text-sm">Live Updates</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="minimap" checked={showMiniMap} onCheckedChange={setShowMiniMap} />
                  <Label htmlFor="minimap" className="text-sm">Mini Map</Label>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[600px] w-full relative">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                minZoom={0.3}
                maxZoom={2}
                defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                proOptions={{ hideAttribution: true }}
              >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="bg-muted/30" />
                <Controls className="bg-card border rounded-lg shadow-md" />
                {showMiniMap && (
                  <MiniMap
                    className="bg-card border rounded-lg shadow-md"
                    maskColor="rgba(0, 0, 0, 0.1)"
                    nodeColor={(node) => {
                      const data = node.data as TopologyNodeData;
                      switch (data.status) {
                        case 'healthy': return '#22c55e';
                        case 'warning': return '#f59e0b';
                        case 'critical': return '#ef4444';
                        default: return '#6b7280';
                      }
                    }}
                  />
                )}

                {/* Legend Panel */}
                <Panel position="bottom-left" className="bg-card/90 backdrop-blur border rounded-lg p-3 shadow-md">
                  <div className="text-xs font-medium mb-2">Legend</div>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                      <span className="text-xs">Healthy</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <span className="text-xs">Warning</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      <span className="text-xs">Critical</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1.5">
                      <div className="h-0.5 w-4 bg-green-500" />
                      <span className="text-xs">Active Flow</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-0.5 w-4 bg-purple-500 border-dashed" style={{ borderStyle: 'dashed' }} />
                      <span className="text-xs">Data Sync</span>
                    </div>
                  </div>
                </Panel>
              </ReactFlow>

              {/* Node Details Panel */}
              <NodeDetailsPanel
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
                onNavigate={navigate}
              />

              {/* Edge Details Panel */}
              <EdgeDetailsPanel
                edge={selectedEdge}
                nodes={nodes}
                onClose={() => setSelectedEdge(null)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
