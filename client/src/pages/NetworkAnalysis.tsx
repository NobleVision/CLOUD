import { useState, useMemo, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Network, Globe, ArrowUpRight, ArrowDownRight, Activity, Server, Zap, AlertTriangle,
  CheckCircle, TrendingUp, TrendingDown, Wifi, Router, Cable, Sparkles, Search, Clock,
  X, Brain, Link2, Target, Lightbulb, ChevronUp
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

interface TopTalker {
  id: string;
  name: string;
  type: 'vm' | 'service' | 'external';
  ip: string;
  inbound: number;
  outbound: number;
  total: number;
  trend: 'up' | 'down' | 'stable';
}

interface NCCConnection {
  id: string;
  name: string;
  type: 'vpn' | 'interconnect' | 'peering';
  status: 'active' | 'degraded' | 'down';
  bandwidth: number;
  utilization: number;
  latency: number;
  packetLoss: number;
}

const topTalkers: TopTalker[] = [
  { id: '1', name: 'api-gateway-prod', type: 'service', ip: '10.128.0.10', inbound: 2450, outbound: 3200, total: 5650, trend: 'up' },
  { id: '2', name: 'database-primary', type: 'vm', ip: '10.128.0.25', inbound: 1800, outbound: 950, total: 2750, trend: 'stable' },
  { id: '3', name: 'cdn-origin', type: 'service', ip: '10.128.0.15', inbound: 450, outbound: 2100, total: 2550, trend: 'up' },
  { id: '4', name: 'external-partner-api', type: 'external', ip: '203.0.113.50', inbound: 1200, outbound: 1100, total: 2300, trend: 'down' },
  { id: '5', name: 'cache-cluster', type: 'service', ip: '10.128.0.30', inbound: 1500, outbound: 600, total: 2100, trend: 'stable' },
  { id: '6', name: 'logging-collector', type: 'vm', ip: '10.128.0.40', inbound: 1800, outbound: 200, total: 2000, trend: 'up' },
  { id: '7', name: 'monitoring-agent', type: 'service', ip: '10.128.0.45', inbound: 900, outbound: 850, total: 1750, trend: 'stable' },
  { id: '8', name: 'backup-service', type: 'vm', ip: '10.128.0.50', inbound: 100, outbound: 1500, total: 1600, trend: 'down' },
];

const nccConnections: NCCConnection[] = [
  { id: '1', name: 'Primary Interconnect - Chicago', type: 'interconnect', status: 'active', bandwidth: 10000, utilization: 45, latency: 12, packetLoss: 0.01 },
  { id: '2', name: 'Secondary Interconnect - Dallas', type: 'interconnect', status: 'active', bandwidth: 10000, utilization: 32, latency: 18, packetLoss: 0.02 },
  { id: '3', name: 'VPN Tunnel - AWS East', type: 'vpn', status: 'active', bandwidth: 1000, utilization: 68, latency: 35, packetLoss: 0.05 },
  { id: '4', name: 'VPN Tunnel - Azure West', type: 'vpn', status: 'degraded', bandwidth: 1000, utilization: 85, latency: 52, packetLoss: 0.15 },
  { id: '5', name: 'Peering - Partner Network', type: 'peering', status: 'active', bandwidth: 5000, utilization: 28, latency: 8, packetLoss: 0.01 },
];

const bandwidthHistory = {
  labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now'],
  datasets: [
    { label: 'Inbound (Gbps)', data: [2.5, 1.8, 4.2, 6.8, 7.5, 5.2, 4.8], borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.4 },
    { label: 'Outbound (Gbps)', data: [3.2, 2.1, 5.5, 8.2, 9.1, 6.8, 5.5], borderColor: 'rgb(34, 197, 94)', backgroundColor: 'rgba(34, 197, 94, 0.1)', fill: true, tension: 0.4 },
  ],
};

const trafficByProtocol = {
  labels: ['HTTPS', 'HTTP', 'gRPC', 'WebSocket', 'Other'],
  datasets: [{ data: [45, 15, 25, 10, 5], backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#6b7280'] }],
};

const getStatusColor = (status: string) => {
  switch (status) { case 'active': return 'text-green-600'; case 'degraded': return 'text-amber-600'; default: return 'text-red-600'; }
};

const getStatusBg = (status: string) => {
  switch (status) { case 'active': return 'bg-green-100 dark:bg-green-900/30'; case 'degraded': return 'bg-amber-100 dark:bg-amber-900/30'; default: return 'bg-red-100 dark:bg-red-900/30'; }
};

const getTypeIcon = (type: string) => {
  switch (type) { case 'interconnect': return Cable; case 'vpn': return Wifi; default: return Router; }
};

// NLP Query Parser for Network Analysis
interface ParsedNetworkQuery {
  types: ('vm' | 'service' | 'external')[];
  connectionTypes: ('vpn' | 'interconnect' | 'peering')[];
  statuses: ('active' | 'degraded' | 'down')[];
  trends: ('up' | 'down' | 'stable')[];
  trafficRange?: { min: number; max: number };
  ipPatterns: string[];
  keywords: string[];
  explanation: string;
}

function parseNetworkNLPQuery(query: string): ParsedNetworkQuery {
  const lowercaseQuery = query.toLowerCase();
  const result: ParsedNetworkQuery = {
    types: [],
    connectionTypes: [],
    statuses: [],
    trends: [],
    ipPatterns: [],
    keywords: [],
    explanation: '',
  };
  const explanationParts: string[] = [];

  // Parse entity types
  const typePatterns = [
    { pattern: /\bvm|virtual\s*machine\b/i, type: 'vm' as const },
    { pattern: /\bservice|svc\b/i, type: 'service' as const },
    { pattern: /\bexternal|ext\b/i, type: 'external' as const },
  ];
  for (const { pattern, type } of typePatterns) {
    if (pattern.test(lowercaseQuery)) result.types.push(type);
  }
  if (result.types.length > 0) explanationParts.push(`Type: ${result.types.join(', ')}`);

  // Parse connection types
  const connTypePatterns = [
    { pattern: /\bvpn\b/i, type: 'vpn' as const },
    { pattern: /\binterconnect|dedicated\b/i, type: 'interconnect' as const },
    { pattern: /\bpeering|peer\b/i, type: 'peering' as const },
  ];
  for (const { pattern, type } of connTypePatterns) {
    if (pattern.test(lowercaseQuery)) result.connectionTypes.push(type);
  }
  if (result.connectionTypes.length > 0) explanationParts.push(`Connection: ${result.connectionTypes.join(', ')}`);

  // Parse statuses
  const statusPatterns = [
    { pattern: /\bactive|healthy|good|ok\b/i, status: 'active' as const },
    { pattern: /\bdegraded|warning|slow\b/i, status: 'degraded' as const },
    { pattern: /\bdown|failed|offline|problem\b/i, status: 'down' as const },
  ];
  for (const { pattern, status } of statusPatterns) {
    if (pattern.test(lowercaseQuery)) result.statuses.push(status);
  }
  if (result.statuses.length > 0) explanationParts.push(`Status: ${result.statuses.join(', ')}`);

  // Parse trends
  const trendPatterns = [
    { pattern: /\btrending\s*up|increasing|growing|high\s*traffic\b/i, trend: 'up' as const },
    { pattern: /\btrending\s*down|decreasing|dropping\b/i, trend: 'down' as const },
    { pattern: /\bstable|steady|consistent\b/i, trend: 'stable' as const },
  ];
  for (const { pattern, trend } of trendPatterns) {
    if (pattern.test(lowercaseQuery)) result.trends.push(trend);
  }
  if (result.trends.length > 0) explanationParts.push(`Trend: ${result.trends.join(', ')}`);

  // Parse traffic thresholds
  const highTrafficPattern = /\b(?:high|heavy|over|above|>)\s*(\d+)\s*(?:mb|gb)?/i;
  const lowTrafficPattern = /\b(?:low|light|under|below|<)\s*(\d+)\s*(?:mb|gb)?/i;
  const highMatch = lowercaseQuery.match(highTrafficPattern);
  const lowMatch = lowercaseQuery.match(lowTrafficPattern);

  if (highMatch) {
    result.trafficRange = { min: parseInt(highMatch[1], 10), max: Infinity };
    explanationParts.push(`Traffic: >${highMatch[1]} MB`);
  } else if (lowMatch) {
    result.trafficRange = { min: 0, max: parseInt(lowMatch[1], 10) };
    explanationParts.push(`Traffic: <${lowMatch[1]} MB`);
  } else if (/\bhigh\s*(?:bandwidth|traffic)\b/i.test(lowercaseQuery)) {
    result.trafficRange = { min: 2000, max: Infinity };
    explanationParts.push('Traffic: High (>2000 MB)');
  } else if (/\btop\s*talker/i.test(lowercaseQuery)) {
    result.trafficRange = { min: 2000, max: Infinity };
    explanationParts.push('Top talkers (>2000 MB total)');
  }

  // Parse keywords
  const keywordPatterns = [
    { pattern: /\bapi\b/i, keyword: 'api' },
    { pattern: /\bgateway\b/i, keyword: 'gateway' },
    { pattern: /\bdatabase|db\b/i, keyword: 'database' },
    { pattern: /\bcache\b/i, keyword: 'cache' },
    { pattern: /\bcdn\b/i, keyword: 'cdn' },
    { pattern: /\blogging|log\b/i, keyword: 'logging' },
    { pattern: /\bmonitor\b/i, keyword: 'monitoring' },
    { pattern: /\bbackup\b/i, keyword: 'backup' },
    { pattern: /\bpartner\b/i, keyword: 'partner' },
    { pattern: /\baws\b/i, keyword: 'aws' },
    { pattern: /\bazure\b/i, keyword: 'azure' },
    { pattern: /\bchicago\b/i, keyword: 'chicago' },
    { pattern: /\bdallas\b/i, keyword: 'dallas' },
    { pattern: /\blatency|slow\b/i, keyword: 'latency' },
    { pattern: /\bpacket\s*loss\b/i, keyword: 'packet-loss' },
  ];
  for (const { pattern, keyword } of keywordPatterns) {
    if (pattern.test(lowercaseQuery)) result.keywords.push(keyword);
  }
  if (result.keywords.length > 0) explanationParts.push(`Keywords: ${result.keywords.join(', ')}`);

  result.explanation = explanationParts.length > 0
    ? explanationParts.join(' • ')
    : 'Showing all network entities matching your query';

  return result;
}

// Example NLP queries
const exampleNetworkQueries = [
  "Show external connections",
  "Find VPN with degraded status",
  "High traffic services",
  "Top talkers trending up",
];

// AI Insights Types for Network Analysis
interface NetworkPatternAnalysis {
  pattern: string;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  description: string;
}

interface NetworkCorrelation {
  event: string;
  correlation: number;
  description: string;
}

interface NetworkRootCause {
  cause: string;
  confidence: number;
  evidence: string[];
}

interface NetworkRecommendation {
  action: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  effort: string;
}

interface NetworkAIInsights {
  patterns: NetworkPatternAnalysis[];
  correlations: NetworkCorrelation[];
  rootCauses: NetworkRootCause[];
  recommendations: NetworkRecommendation[];
  summary: string;
  analyzedCount: number;
  processingTime: number;
}

// Generate AI insights for network
function generateNetworkInsights(
  filteredTalkers: TopTalker[],
  filteredConnections: NCCConnection[]
): NetworkAIInsights {
  const startTime = performance.now();
  const totalTalkers = filteredTalkers.length;
  const totalConnections = filteredConnections.length;

  // Analyze patterns
  const externalCount = filteredTalkers.filter(t => t.type === 'external').length;
  const trendingUpCount = filteredTalkers.filter(t => t.trend === 'up').length;
  const degradedConnections = filteredConnections.filter(c => c.status === 'degraded').length;
  const highLatencyConnections = filteredConnections.filter(c => c.latency > 40).length;
  const highUtilConnections = filteredConnections.filter(c => c.utilization > 70).length;
  const avgTraffic = totalTalkers > 0
    ? Math.round(filteredTalkers.reduce((sum, t) => sum + t.total, 0) / totalTalkers)
    : 0;
  const avgLatency = totalConnections > 0
    ? Math.round(filteredConnections.reduce((sum, c) => sum + c.latency, 0) / totalConnections)
    : 0;

  const patterns: NetworkPatternAnalysis[] = [];

  if (trendingUpCount > 0) {
    patterns.push({
      pattern: 'Traffic growth detected',
      percentage: Math.round((trendingUpCount / totalTalkers) * 100),
      trend: 'increasing',
      description: `${trendingUpCount} endpoint(s) showing increasing traffic trends - may require capacity planning`
    });
  }

  if (externalCount > 0) {
    const externalTraffic = filteredTalkers.filter(t => t.type === 'external').reduce((s, t) => s + t.total, 0);
    patterns.push({
      pattern: 'External traffic flow',
      percentage: Math.round((externalTraffic / filteredTalkers.reduce((s, t) => s + t.total, 0)) * 100) || 0,
      trend: 'stable',
      description: `${externalCount} external connection(s) with ${externalTraffic} MB total traffic`
    });
  }

  if (highUtilConnections > 0) {
    patterns.push({
      pattern: 'High utilization links',
      percentage: Math.round((highUtilConnections / totalConnections) * 100),
      trend: highUtilConnections > 1 ? 'increasing' : 'stable',
      description: `${highUtilConnections} NCC connection(s) above 70% utilization threshold`
    });
  }

  // Generate correlations
  const correlations: NetworkCorrelation[] = [];

  if (highLatencyConnections > 0 && degradedConnections > 0) {
    correlations.push({
      event: 'High latency → Connection degradation',
      correlation: 0.91,
      description: 'Latency spikes correlate with connection degradation events'
    });
  }

  if (trendingUpCount > 2 && highUtilConnections > 0) {
    correlations.push({
      event: 'Traffic growth → Link saturation',
      correlation: 0.85,
      description: 'Multiple endpoints with increasing traffic are saturating network links'
    });
  }

  const vpnConnections = filteredConnections.filter(c => c.type === 'vpn');
  if (vpnConnections.length > 0) {
    const vpnAvgLatency = Math.round(vpnConnections.reduce((s, c) => s + c.latency, 0) / vpnConnections.length);
    correlations.push({
      event: 'VPN tunnel performance',
      correlation: 0.78,
      description: `VPN connections averaging ${vpnAvgLatency}ms latency - encryption overhead expected`
    });
  }

  if (correlations.length === 0) {
    correlations.push({
      event: 'Normal traffic patterns',
      correlation: 0.72,
      description: 'Network traffic following expected daily patterns'
    });
  }

  // Generate root causes
  const rootCauses: NetworkRootCause[] = [];

  const degradedConn = filteredConnections.find(c => c.status === 'degraded');
  if (degradedConn) {
    rootCauses.push({
      cause: `${degradedConn.name} performance degradation`,
      confidence: 88,
      evidence: [
        `Latency at ${degradedConn.latency}ms (above 40ms threshold)`,
        `Utilization at ${degradedConn.utilization}%`,
        `Packet loss at ${degradedConn.packetLoss}%`
      ]
    });
  }

  if (highUtilConnections > 0) {
    const saturatedConn = filteredConnections.find(c => c.utilization > 80);
    if (saturatedConn) {
      rootCauses.push({
        cause: 'Link capacity approaching saturation',
        confidence: 82,
        evidence: [
          `${saturatedConn.name} at ${saturatedConn.utilization}% utilization`,
          'Bandwidth consumption exceeding provisioned capacity',
          'Traffic growth outpacing link upgrades'
        ]
      });
    }
  }

  if (rootCauses.length === 0) {
    rootCauses.push({
      cause: 'Network operating within normal parameters',
      confidence: 90,
      evidence: [
        'All connections within latency thresholds',
        'Utilization balanced across links',
        'No packet loss anomalies detected'
      ]
    });
  }

  // Generate recommendations
  const recommendations: NetworkRecommendation[] = [];

  if (degradedConnections > 0) {
    recommendations.push({
      action: 'Investigate degraded connections and consider failover',
      priority: 'high',
      impact: 'Restores normal connectivity performance',
      effort: '1-2 hours investigation + potential failover'
    });
  }

  if (highUtilConnections > 0) {
    recommendations.push({
      action: 'Upgrade bandwidth or implement traffic shaping',
      priority: 'high',
      impact: 'Prevents link saturation and packet loss',
      effort: '2-4 hours for traffic shaping, days for upgrade'
    });
  }

  if (trendingUpCount > 2) {
    recommendations.push({
      action: 'Implement proactive capacity monitoring alerts',
      priority: 'medium',
      impact: 'Early warning for bandwidth exhaustion',
      effort: '30 minutes to configure'
    });
  }

  if (externalCount > 0) {
    recommendations.push({
      action: 'Review external traffic security policies',
      priority: 'medium',
      impact: 'Ensures compliance and security posture',
      effort: '1-2 hours audit'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      action: 'Maintain current monitoring configuration',
      priority: 'low',
      impact: 'Continued visibility into network health',
      effort: 'No action required'
    });
  }

  // Generate summary
  const summaryParts: string[] = [];
  summaryParts.push(`Analyzed ${totalTalkers} endpoints, ${totalConnections} connections`);
  if (degradedConnections > 0) summaryParts.push(`${degradedConnections} degraded`);
  summaryParts.push(`Avg traffic: ${avgTraffic} MB`);
  summaryParts.push(`Avg latency: ${avgLatency}ms`);

  const processingTime = performance.now() - startTime;

  return {
    patterns,
    correlations,
    rootCauses,
    recommendations,
    summary: summaryParts.join(' • '),
    analyzedCount: totalTalkers + totalConnections,
    processingTime: Math.round(processingTime)
  };
}

export default function NetworkAnalysis() {
  const [timeRange, setTimeRange] = useState('24h');

  // AI-Powered Search state
  const [nlpQuery, setNlpQuery] = useState('');
  const [isNlpMode, setIsNlpMode] = useState(false);
  const [parsedQuery, setParsedQuery] = useState<ParsedNetworkQuery | null>(null);

  // AI Insights state
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState<NetworkAIInsights | null>(null);

  // Refs for auto-scrolling to results
  const topTalkersRef = useRef<HTMLDivElement>(null);
  const nccConnectionsRef = useRef<HTMLDivElement>(null);

  const totalInbound = topTalkers.reduce((s, t) => s + t.inbound, 0);
  const totalOutbound = topTalkers.reduce((s, t) => s + t.outbound, 0);
  const activeConnections = nccConnections.filter(c => c.status === 'active').length;
  const avgLatency = Math.round(nccConnections.reduce((s, c) => s + c.latency, 0) / nccConnections.length);

  // NLP Search handlers
  const handleNlpSearch = useCallback(() => {
    if (!nlpQuery.trim()) {
      setParsedQuery(null);
      return;
    }
    const parsed = parseNetworkNLPQuery(nlpQuery);
    setParsedQuery(parsed);

    // Auto-scroll to appropriate section based on query
    setTimeout(() => {
      if (parsed.connectionTypes.length > 0 || parsed.statuses.includes('degraded') || parsed.statuses.includes('down')) {
        nccConnectionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        topTalkersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, [nlpQuery]);

  const clearNlpSearch = useCallback(() => {
    setNlpQuery('');
    setParsedQuery(null);
  }, []);

  // Filtered data with NLP support
  const filteredTopTalkers = useMemo(() => {
    if (!isNlpMode || !parsedQuery) return topTalkers;

    return topTalkers.filter(t => {
      if (parsedQuery.types.length > 0 && !parsedQuery.types.includes(t.type)) return false;
      if (parsedQuery.trends.length > 0 && !parsedQuery.trends.includes(t.trend)) return false;
      if (parsedQuery.trafficRange) {
        if (t.total < parsedQuery.trafficRange.min) return false;
        if (parsedQuery.trafficRange.max !== Infinity && t.total > parsedQuery.trafficRange.max) return false;
      }
      if (parsedQuery.keywords.length > 0) {
        const nameLC = t.name.toLowerCase();
        if (!parsedQuery.keywords.some(kw => nameLC.includes(kw))) return false;
      }
      return true;
    });
  }, [isNlpMode, parsedQuery]);

  const filteredNccConnections = useMemo(() => {
    if (!isNlpMode || !parsedQuery) return nccConnections;

    return nccConnections.filter(c => {
      if (parsedQuery.connectionTypes.length > 0 && !parsedQuery.connectionTypes.includes(c.type)) return false;
      if (parsedQuery.statuses.length > 0 && !parsedQuery.statuses.includes(c.status)) return false;
      if (parsedQuery.keywords.length > 0) {
        const nameLC = c.name.toLowerCase();
        if (!parsedQuery.keywords.some(kw => nameLC.includes(kw))) return false;
      }
      return true;
    });
  }, [isNlpMode, parsedQuery]);

  // AI Insights generation
  const handleToggleInsights = useCallback(() => {
    if (showAIInsights) {
      setShowAIInsights(false);
      return;
    }

    setIsAnalyzing(true);
    // Simulate AI processing delay
    setTimeout(() => {
      const insights = generateNetworkInsights(filteredTopTalkers, filteredNccConnections);
      setAiInsights(insights);
      setShowAIInsights(true);
      setIsAnalyzing(false);
    }, 800);
  }, [showAIInsights, filteredTopTalkers, filteredNccConnections]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Network className="h-8 w-8 text-blue-500" />Network Analysis</h1>
            <p className="text-muted-foreground mt-1">Monitor network traffic, top talkers, and NCC connectivity</p>
          </div>
          <div className="flex gap-2">
            {!isNlpMode && (
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="1h">Last hour</SelectItem><SelectItem value="24h">Last 24h</SelectItem><SelectItem value="7d">Last 7 days</SelectItem></SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* AI-Powered Network Search */}
        <Card className="border-chart-5/30 bg-gradient-to-r from-chart-5/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-chart-5" />
                <CardTitle className="text-lg">AI-Powered Network Search</CardTitle>
              </div>
              <Button
                variant={isNlpMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setIsNlpMode(!isNlpMode);
                  if (isNlpMode) {
                    clearNlpSearch();
                  }
                }}
              >
                {isNlpMode ? 'Disable AI Search' : 'Enable AI Search'}
              </Button>
            </div>
            <CardDescription>
              Use natural language to search network data. Try: "{exampleNetworkQueries[0]}" or "{exampleNetworkQueries[2]}"
            </CardDescription>
          </CardHeader>
          {isNlpMode && (
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Describe what you're looking for..."
                      value={nlpQuery}
                      onChange={(e) => setNlpQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleNlpSearch()}
                      className="pl-9 pr-9"
                    />
                    {nlpQuery && (
                      <button
                        onClick={clearNlpSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button onClick={handleNlpSearch} className="gap-2">
                    <Search className="h-4 w-4" />
                    Search
                  </Button>
                </div>

                {parsedQuery && (
                  <div className="p-3 rounded-lg bg-chart-5/10 border border-chart-5/20">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-chart-5 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-chart-5">Query Interpretation</p>
                        <p className="text-sm text-muted-foreground mt-1">{parsedQuery.explanation}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {exampleNetworkQueries.map((example, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => {
                        setNlpQuery(example);
                        setTimeout(() => {
                          const parsed = parseNetworkNLPQuery(example);
                          setParsedQuery(parsed);
                          setTimeout(() => {
                            if (parsed.connectionTypes.length > 0 || parsed.statuses.includes('degraded') || parsed.statuses.includes('down')) {
                              nccConnectionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            } else {
                              topTalkersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }, 100);
                        }, 0);
                      }}
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* AI Insights Panel */}
        <Card className="border-chart-4/30 bg-gradient-to-r from-chart-4/5 to-transparent overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-chart-4" />
                <CardTitle className="text-lg">AI Network Insights</CardTitle>
                {aiInsights && (
                  <Badge variant="outline" className="text-xs">
                    {aiInsights.analyzedCount} items analyzed in {aiInsights.processingTime}ms
                  </Badge>
                )}
              </div>
              <Button
                variant={showAIInsights ? "default" : "outline"}
                size="sm"
                onClick={handleToggleInsights}
                disabled={isAnalyzing || (filteredTopTalkers.length === 0 && filteredNccConnections.length === 0)}
                className="gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Activity className="h-4 w-4 animate-pulse" />
                    Analyzing...
                  </>
                ) : showAIInsights ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide Insights
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Insights
                  </>
                )}
              </Button>
            </div>
            <CardDescription>
              AI-powered analysis of traffic patterns, connection health, and performance recommendations
            </CardDescription>
          </CardHeader>
          {showAIInsights && aiInsights && (
            <CardContent className="pt-0">
              <div className="space-y-6">
                {/* Summary */}
                <div className="p-3 rounded-lg bg-chart-4/10 border border-chart-4/20">
                  <p className="text-sm font-medium text-chart-4">{aiInsights.summary}</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Patterns */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      Detected Patterns
                    </h4>
                    <div className="space-y-2">
                      {aiInsights.patterns.map((pattern, idx) => (
                        <div key={idx} className="p-3 rounded-lg border bg-background">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{pattern.pattern}</span>
                            <Badge variant={pattern.trend === 'increasing' ? 'destructive' : 'secondary'} className="text-xs">
                              {pattern.trend}
                            </Badge>
                          </div>
                          <Progress value={pattern.percentage} className="h-1.5 mb-1" />
                          <p className="text-xs text-muted-foreground">{pattern.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Correlations */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-purple-500" />
                      Correlated Events
                    </h4>
                    <div className="space-y-2">
                      {aiInsights.correlations.map((corr, idx) => (
                        <div key={idx} className="p-3 rounded-lg border bg-background">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{corr.event}</span>
                            <Badge variant="outline" className="text-xs">{Math.round(corr.correlation * 100)}%</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{corr.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Root Causes */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-orange-500" />
                      Root Causes
                    </h4>
                    <div className="space-y-2">
                      {aiInsights.rootCauses.map((cause, idx) => (
                        <div key={idx} className="p-3 rounded-lg border bg-background">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{cause.cause}</span>
                            <Badge variant="secondary" className="text-xs">{cause.confidence}% confidence</Badge>
                          </div>
                          <ul className="space-y-1">
                            {cause.evidence.map((ev, evIdx) => (
                              <li key={evIdx} className="text-xs text-muted-foreground flex items-start gap-1">
                                <span className="text-chart-4 mt-0.5">•</span>{ev}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      Recommended Actions
                    </h4>
                    <div className="space-y-2">
                      {aiInsights.recommendations.map((rec, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border bg-background ${rec.priority === 'high' ? 'border-red-200 dark:border-red-800' : rec.priority === 'medium' ? 'border-amber-200 dark:border-amber-800' : ''}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm flex items-center gap-2">
                              {rec.priority === 'high' && <Zap className="h-3 w-3 text-red-500" />}
                              {rec.action}
                            </span>
                            <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                              {rec.priority}
                            </Badge>
                          </div>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>Impact: {rec.impact}</span>
                            <span>Effort: {rec.effort}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><ArrowDownRight className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{(totalInbound / 1000).toFixed(1)} GB</p><p className="text-xs text-muted-foreground">Total Inbound</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><ArrowUpRight className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold">{(totalOutbound / 1000).toFixed(1)} GB</p><p className="text-xs text-muted-foreground">Total Outbound</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30"><Globe className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{activeConnections}/{nccConnections.length}</p><p className="text-xs text-muted-foreground">NCC Active</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Activity className="h-5 w-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{avgLatency}ms</p><p className="text-xs text-muted-foreground">Avg Latency</p></div></div></CardContent></Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Bandwidth Usage</CardTitle><CardDescription>Inbound and outbound traffic over time</CardDescription></CardHeader>
            <CardContent><div className="h-64"><Line data={bandwidthHistory} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }} /></div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Traffic by Protocol</CardTitle><CardDescription>Distribution of network protocols</CardDescription></CardHeader>
            <CardContent><div className="h-64"><Doughnut data={trafficByProtocol} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} /></div></CardContent>
          </Card>
        </div>

        {/* Top Talkers */}
        <Card ref={topTalkersRef}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Talkers</CardTitle>
                <CardDescription>Highest bandwidth consumers in the network</CardDescription>
              </div>
              {isNlpMode && parsedQuery && (
                <Badge variant="secondary" className="text-xs">
                  {filteredTopTalkers.length} of {topTalkers.length} endpoints match
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredTopTalkers.map((talker, idx) => (
                <div key={talker.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-muted-foreground w-6">#{idx + 1}</span>
                    <div className={`p-2 rounded-lg ${talker.type === 'external' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                      {talker.type === 'external' ? <Globe className="h-4 w-4 text-amber-600" /> : <Server className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{talker.name}</h4>
                        <Badge variant="outline">{talker.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">{talker.ip}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right"><p className="text-sm text-muted-foreground">Inbound</p><p className="font-semibold text-blue-600">{talker.inbound} MB</p></div>
                    <div className="text-right"><p className="text-sm text-muted-foreground">Outbound</p><p className="font-semibold text-green-600">{talker.outbound} MB</p></div>
                    <div className="text-right"><p className="text-sm text-muted-foreground">Total</p><p className="font-bold">{talker.total} MB</p></div>
                    <div className="w-8">{talker.trend === 'up' ? <TrendingUp className="h-5 w-5 text-amber-500" /> : talker.trend === 'down' ? <TrendingDown className="h-5 w-5 text-green-500" /> : <Activity className="h-5 w-5 text-gray-500" />}</div>
                  </div>
                </div>
              ))}
              {filteredTopTalkers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No endpoints match your search criteria
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* NCC Connections */}
        <Card ref={nccConnectionsRef}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-purple-500" />Network Connectivity Center (NCC)</CardTitle>
                <CardDescription>Hybrid and multi-cloud connectivity status</CardDescription>
              </div>
              {isNlpMode && parsedQuery && (
                <Badge variant="secondary" className="text-xs">
                  {filteredNccConnections.length} of {nccConnections.length} connections match
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredNccConnections.map((conn) => {
                const Icon = getTypeIcon(conn.type);
                return (
                  <div key={conn.id} className={`p-4 rounded-lg border ${conn.status === 'degraded' ? 'border-amber-300 dark:border-amber-700' : conn.status === 'down' ? 'border-red-300 dark:border-red-700' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${getStatusBg(conn.status)}`}><Icon className={`h-4 w-4 ${getStatusColor(conn.status)}`} /></div>
                        <Badge variant="outline">{conn.type}</Badge>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${conn.status === 'active' ? 'bg-green-500' : conn.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'} animate-pulse`} />
                    </div>
                    <h4 className="font-semibold mb-2">{conn.name}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Bandwidth</span><span>{conn.bandwidth} Mbps</span></div>
                      <div className="flex justify-between items-center"><span className="text-muted-foreground">Utilization</span><div className="flex items-center gap-2"><Progress value={conn.utilization} className="w-16 h-2" /><span className={conn.utilization > 80 ? 'text-amber-600' : ''}>{conn.utilization}%</span></div></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Latency</span><span className={conn.latency > 40 ? 'text-amber-600' : ''}>{conn.latency}ms</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Packet Loss</span><span className={conn.packetLoss > 0.1 ? 'text-red-600' : ''}>{conn.packetLoss}%</span></div>
                    </div>
                  </div>
                );
              })}
              {filteredNccConnections.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No connections match your search criteria
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

