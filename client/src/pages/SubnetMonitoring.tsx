import { useState, useMemo, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Network, Globe, Server, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Activity,
  Wifi, MapPin, Layers, Sparkles, Search, Clock, X, Brain, Link2, Target, Lightbulb,
  ChevronUp, Zap
} from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface Subnet {
  id: string;
  name: string;
  cidr: string;
  region: string;
  vpc: string;
  totalIPs: number;
  usedIPs: number;
  availableIPs: number;
  utilizationPercent: number;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  purpose: 'production' | 'staging' | 'development' | 'management';
  connectedResources: number;
}

const subnets: Subnet[] = [
  { id: '1', name: 'prod-api-subnet', cidr: '10.128.0.0/20', region: 'us-central1', vpc: 'adp-prod-vpc', totalIPs: 4094, usedIPs: 3276, availableIPs: 818, utilizationPercent: 80, status: 'warning', trend: 'up', purpose: 'production', connectedResources: 156 },
  { id: '2', name: 'prod-web-subnet', cidr: '10.128.16.0/20', region: 'us-central1', vpc: 'adp-prod-vpc', totalIPs: 4094, usedIPs: 2456, availableIPs: 1638, utilizationPercent: 60, status: 'healthy', trend: 'stable', purpose: 'production', connectedResources: 89 },
  { id: '3', name: 'prod-db-subnet', cidr: '10.128.32.0/24', region: 'us-central1', vpc: 'adp-prod-vpc', totalIPs: 254, usedIPs: 45, availableIPs: 209, utilizationPercent: 18, status: 'healthy', trend: 'stable', purpose: 'production', connectedResources: 24 },
  { id: '4', name: 'staging-subnet', cidr: '10.132.0.0/20', region: 'us-east1', vpc: 'adp-staging-vpc', totalIPs: 4094, usedIPs: 1024, availableIPs: 3070, utilizationPercent: 25, status: 'healthy', trend: 'down', purpose: 'staging', connectedResources: 45 },
  { id: '5', name: 'dev-subnet', cidr: '10.136.0.0/20', region: 'us-west1', vpc: 'adp-dev-vpc', totalIPs: 4094, usedIPs: 512, availableIPs: 3582, utilizationPercent: 13, status: 'healthy', trend: 'stable', purpose: 'development', connectedResources: 28 },
  { id: '6', name: 'gke-pods-subnet', cidr: '10.140.0.0/14', region: 'us-central1', vpc: 'adp-prod-vpc', totalIPs: 262142, usedIPs: 235928, availableIPs: 26214, utilizationPercent: 90, status: 'critical', trend: 'up', purpose: 'production', connectedResources: 1250 },
  { id: '7', name: 'gke-services-subnet', cidr: '10.144.0.0/20', region: 'us-central1', vpc: 'adp-prod-vpc', totalIPs: 4094, usedIPs: 2867, availableIPs: 1227, utilizationPercent: 70, status: 'warning', trend: 'up', purpose: 'production', connectedResources: 89 },
  { id: '8', name: 'management-subnet', cidr: '10.200.0.0/24', region: 'us-central1', vpc: 'adp-mgmt-vpc', totalIPs: 254, usedIPs: 32, availableIPs: 222, utilizationPercent: 13, status: 'healthy', trend: 'stable', purpose: 'management', connectedResources: 15 },
];

const utilizationByVPC = {
  labels: ['adp-prod-vpc', 'adp-staging-vpc', 'adp-dev-vpc', 'adp-mgmt-vpc'],
  datasets: [{ label: 'IP Utilization %', data: [75, 25, 13, 13], backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'] }],
};

const ipDistribution = {
  labels: ['Used', 'Available', 'Reserved'],
  datasets: [{ data: [246140, 36980, 5000], backgroundColor: ['#3b82f6', '#22c55e', '#6b7280'] }],
};

const getStatusColor = (status: string) => {
  switch (status) { case 'healthy': return 'text-green-600'; case 'warning': return 'text-amber-600'; default: return 'text-red-600'; }
};

const getStatusBg = (status: string) => {
  switch (status) { case 'healthy': return 'bg-green-100 dark:bg-green-900/30'; case 'warning': return 'bg-amber-100 dark:bg-amber-900/30'; default: return 'bg-red-100 dark:bg-red-900/30'; }
};

const getPurposeColor = (purpose: string) => {
  switch (purpose) { case 'production': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'; case 'staging': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'; case 'development': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'; default: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'; }
};

// NLP Query Parser for Subnet Search
interface ParsedSubnetQuery {
  statuses: ('healthy' | 'warning' | 'critical')[];
  purposes: ('production' | 'staging' | 'development' | 'management')[];
  vpcs: string[];
  regions: string[];
  utilizationRange?: { min: number; max: number };
  keywords: string[];
  explanation: string;
}

function parseSubnetNLPQuery(query: string): ParsedSubnetQuery {
  const lowercaseQuery = query.toLowerCase();
  const result: ParsedSubnetQuery = {
    statuses: [],
    purposes: [],
    vpcs: [],
    regions: [],
    keywords: [],
    explanation: '',
  };
  const explanationParts: string[] = [];

  // Parse status
  const statusPatterns = [
    { pattern: /\b(healthy|good|ok)\b/i, status: 'healthy' as const },
    { pattern: /\b(warning|warn|concerning)\b/i, status: 'warning' as const },
    { pattern: /\b(critical|crit|danger|bad|problem)\b/i, status: 'critical' as const },
  ];
  for (const { pattern, status } of statusPatterns) {
    if (pattern.test(lowercaseQuery)) result.statuses.push(status);
  }
  if (result.statuses.length > 0) explanationParts.push(`Status: ${result.statuses.join(', ')}`);

  // Parse purpose/environment
  const purposePatterns = [
    { pattern: /\b(prod|production)\b/i, purpose: 'production' as const },
    { pattern: /\b(staging|stage)\b/i, purpose: 'staging' as const },
    { pattern: /\b(dev|development)\b/i, purpose: 'development' as const },
    { pattern: /\b(mgmt|management)\b/i, purpose: 'management' as const },
  ];
  for (const { pattern, purpose } of purposePatterns) {
    if (pattern.test(lowercaseQuery)) result.purposes.push(purpose);
  }
  if (result.purposes.length > 0) explanationParts.push(`Environment: ${result.purposes.join(', ')}`);

  // Parse VPC names
  const vpcPattern = /\b(adp-(?:prod|staging|dev|mgmt)-vpc)\b/i;
  const vpcMatch = lowercaseQuery.match(vpcPattern);
  if (vpcMatch) {
    result.vpcs.push(vpcMatch[1]);
    explanationParts.push(`VPC: ${vpcMatch[1]}`);
  }

  // Parse regions
  const regionPatterns = [
    { pattern: /\b(us-central1?|central)\b/i, region: 'us-central1' },
    { pattern: /\b(us-east1?|east)\b/i, region: 'us-east1' },
    { pattern: /\b(us-west1?|west)\b/i, region: 'us-west1' },
  ];
  for (const { pattern, region } of regionPatterns) {
    if (pattern.test(lowercaseQuery)) result.regions.push(region);
  }
  if (result.regions.length > 0) explanationParts.push(`Region: ${result.regions.join(', ')}`);

  // Parse utilization thresholds
  const highUtilPattern = /\b(?:high|over|above|>)\s*(\d+)%?/i;
  const lowUtilPattern = /\b(?:low|under|below|<)\s*(\d+)%?/i;
  const highMatch = lowercaseQuery.match(highUtilPattern);
  const lowMatch = lowercaseQuery.match(lowUtilPattern);

  if (highMatch) {
    result.utilizationRange = { min: parseInt(highMatch[1], 10), max: 100 };
    explanationParts.push(`Utilization: >${highMatch[1]}%`);
  } else if (lowMatch) {
    result.utilizationRange = { min: 0, max: parseInt(lowMatch[1], 10) };
    explanationParts.push(`Utilization: <${lowMatch[1]}%`);
  } else if (/\bhigh\s*utiliz/i.test(lowercaseQuery)) {
    result.utilizationRange = { min: 70, max: 100 };
    explanationParts.push('Utilization: High (>70%)');
  } else if (/\blow\s*utiliz/i.test(lowercaseQuery)) {
    result.utilizationRange = { min: 0, max: 30 };
    explanationParts.push('Utilization: Low (<30%)');
  }

  // Parse keywords
  const keywordPatterns = [
    { pattern: /\bgke|kubernetes\b/i, keyword: 'gke' },
    { pattern: /\bapi\b/i, keyword: 'api' },
    { pattern: /\bweb\b/i, keyword: 'web' },
    { pattern: /\bdb|database\b/i, keyword: 'db' },
    { pattern: /\bpods?\b/i, keyword: 'pods' },
    { pattern: /\bservices?\b/i, keyword: 'services' },
    { pattern: /\bexhaust|full\b/i, keyword: 'exhausted' },
    { pattern: /\bscale|expand\b/i, keyword: 'scale' },
    { pattern: /\bcapacity\b/i, keyword: 'capacity' },
  ];
  for (const { pattern, keyword } of keywordPatterns) {
    if (pattern.test(lowercaseQuery)) result.keywords.push(keyword);
  }
  if (result.keywords.length > 0) explanationParts.push(`Keywords: ${result.keywords.join(', ')}`);

  result.explanation = explanationParts.length > 0
    ? explanationParts.join(' • ')
    : 'Showing all subnets matching your query';

  return result;
}

// Example NLP queries
const exampleSubnetQueries = [
  "Show critical subnets",
  "Find production subnets with high utilization",
  "GKE pods subnet capacity",
  "Subnets in us-central1",
];

// AI Insights Types for Subnet Analysis
interface SubnetPatternAnalysis {
  pattern: string;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  description: string;
}

interface SubnetCorrelation {
  event: string;
  correlation: number;
  description: string;
}

interface SubnetRootCause {
  cause: string;
  confidence: number;
  evidence: string[];
}

interface SubnetRecommendation {
  action: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  effort: string;
}

interface SubnetAIInsights {
  patterns: SubnetPatternAnalysis[];
  correlations: SubnetCorrelation[];
  rootCauses: SubnetRootCause[];
  recommendations: SubnetRecommendation[];
  summary: string;
  analyzedCount: number;
  processingTime: number;
}

// Generate AI insights for subnets
function generateSubnetInsights(filteredSubnets: Subnet[]): SubnetAIInsights {
  const startTime = performance.now();
  const totalSubnets = filteredSubnets.length;

  // Analyze patterns
  const criticalCount = filteredSubnets.filter(s => s.status === 'critical').length;
  const warningCount = filteredSubnets.filter(s => s.status === 'warning').length;
  const highUtilCount = filteredSubnets.filter(s => s.utilizationPercent >= 80).length;
  const trendingUpCount = filteredSubnets.filter(s => s.trend === 'up').length;
  const prodSubnets = filteredSubnets.filter(s => s.purpose === 'production');
  const avgUtilization = totalSubnets > 0
    ? Math.round(filteredSubnets.reduce((sum, s) => sum + s.utilizationPercent, 0) / totalSubnets)
    : 0;

  const patterns: SubnetPatternAnalysis[] = [];

  if (criticalCount > 0) {
    patterns.push({
      pattern: 'Critical subnet utilization',
      percentage: Math.round((criticalCount / totalSubnets) * 100),
      trend: 'increasing',
      description: `${criticalCount} subnet(s) at critical utilization (>85%) requiring immediate attention`
    });
  }

  if (trendingUpCount > 0) {
    patterns.push({
      pattern: 'Growth trend detected',
      percentage: Math.round((trendingUpCount / totalSubnets) * 100),
      trend: 'increasing',
      description: `${trendingUpCount} subnet(s) showing increasing IP consumption trends`
    });
  }

  if (prodSubnets.length > 0) {
    const prodAvgUtil = Math.round(prodSubnets.reduce((sum, s) => sum + s.utilizationPercent, 0) / prodSubnets.length);
    patterns.push({
      pattern: 'Production environment load',
      percentage: prodAvgUtil,
      trend: prodAvgUtil > 70 ? 'increasing' : 'stable',
      description: `Production subnets averaging ${prodAvgUtil}% utilization across ${prodSubnets.length} subnets`
    });
  }

  // Generate correlations
  const correlations: SubnetCorrelation[] = [];

  if (highUtilCount > 0 && trendingUpCount > 0) {
    correlations.push({
      event: 'High utilization → IP exhaustion risk',
      correlation: 0.89,
      description: `${highUtilCount} high-utilization subnets with upward trends indicate imminent capacity issues`
    });
  }

  const gkeSubnets = filteredSubnets.filter(s => s.name.includes('gke'));
  if (gkeSubnets.length > 0) {
    const gkeAvgUtil = Math.round(gkeSubnets.reduce((sum, s) => sum + s.utilizationPercent, 0) / gkeSubnets.length);
    correlations.push({
      event: 'GKE workload scaling → Subnet pressure',
      correlation: 0.92,
      description: `GKE subnets at ${gkeAvgUtil}% average - pod scaling directly impacts IP availability`
    });
  }

  if (correlations.length === 0) {
    correlations.push({
      event: 'Normal utilization patterns',
      correlation: 0.75,
      description: 'Subnet utilization follows expected workload patterns'
    });
  }

  // Generate root causes
  const rootCauses: SubnetRootCause[] = [];

  const criticalSubnet = filteredSubnets.find(s => s.status === 'critical');
  if (criticalSubnet) {
    rootCauses.push({
      cause: `${criticalSubnet.name} approaching exhaustion`,
      confidence: 92,
      evidence: [
        `Current utilization at ${criticalSubnet.utilizationPercent}%`,
        `Only ${criticalSubnet.availableIPs.toLocaleString()} IPs remaining`,
        `Trend shows ${criticalSubnet.trend === 'up' ? 'increasing' : 'stable'} consumption`
      ]
    });
  }

  if (trendingUpCount >= 2) {
    rootCauses.push({
      cause: 'Workload growth outpacing capacity',
      confidence: 78,
      evidence: [
        `${trendingUpCount} subnets with increasing utilization`,
        'Growth rate exceeds historical baseline',
        'No recent capacity expansions detected'
      ]
    });
  }

  if (rootCauses.length === 0) {
    rootCauses.push({
      cause: 'Capacity within normal parameters',
      confidence: 85,
      evidence: [
        'No critical utilization detected',
        'IP consumption aligned with workload',
        'Buffer capacity available for growth'
      ]
    });
  }

  // Generate recommendations
  const recommendations: SubnetRecommendation[] = [];

  if (criticalCount > 0) {
    recommendations.push({
      action: 'Expand critical subnet CIDR ranges immediately',
      priority: 'high',
      impact: 'Prevents service disruption from IP exhaustion',
      effort: '2-4 hours with planned maintenance window'
    });
  }

  if (highUtilCount >= 2) {
    recommendations.push({
      action: 'Implement IP address recycling policies',
      priority: 'high',
      impact: 'Recovers 10-15% IP addresses from terminated workloads',
      effort: '1-2 hours configuration'
    });
  }

  if (trendingUpCount > 0) {
    recommendations.push({
      action: 'Enable proactive subnet capacity monitoring alerts',
      priority: 'medium',
      impact: 'Early warning before reaching critical thresholds',
      effort: '30 minutes to configure'
    });
  }

  const unusedCapacity = filteredSubnets.filter(s => s.utilizationPercent < 20);
  if (unusedCapacity.length > 0) {
    recommendations.push({
      action: 'Consider consolidating underutilized subnets',
      priority: 'low',
      impact: 'Simplifies network topology and reduces management overhead',
      effort: '1-2 days with migration planning'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      action: 'Maintain current capacity monitoring',
      priority: 'low',
      impact: 'Continued visibility into subnet health',
      effort: 'No action required'
    });
  }

  // Generate summary
  const summaryParts: string[] = [];
  summaryParts.push(`Analyzed ${totalSubnets} subnet(s)`);
  if (criticalCount > 0) summaryParts.push(`${criticalCount} critical`);
  if (warningCount > 0) summaryParts.push(`${warningCount} warning`);
  summaryParts.push(`Avg utilization: ${avgUtilization}%`);

  const processingTime = performance.now() - startTime;

  return {
    patterns,
    correlations,
    rootCauses,
    recommendations,
    summary: summaryParts.join(' • '),
    analyzedCount: totalSubnets,
    processingTime: Math.round(processingTime)
  };
}

export default function SubnetMonitoring() {
  const [filterVPC, setFilterVPC] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // AI-Powered Search state
  const [nlpQuery, setNlpQuery] = useState('');
  const [isNlpMode, setIsNlpMode] = useState(false);
  const [parsedQuery, setParsedQuery] = useState<ParsedSubnetQuery | null>(null);

  // AI Insights state
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState<SubnetAIInsights | null>(null);

  // Ref for auto-scrolling to results after search
  const subnetDetailsRef = useRef<HTMLDivElement>(null);

  const totalIPs = subnets.reduce((s, sub) => s + sub.totalIPs, 0);
  const usedIPs = subnets.reduce((s, sub) => s + sub.usedIPs, 0);
  const criticalSubnetsCount = subnets.filter(s => s.status === 'critical').length;
  const warningSubnetsCount = subnets.filter(s => s.status === 'warning').length;

  // NLP Search handlers
  const handleNlpSearch = useCallback(() => {
    if (!nlpQuery.trim()) {
      setParsedQuery(null);
      return;
    }
    const parsed = parseSubnetNLPQuery(nlpQuery);
    setParsedQuery(parsed);

    // Auto-scroll to results after a brief delay
    setTimeout(() => {
      subnetDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [nlpQuery]);

  const clearNlpSearch = useCallback(() => {
    setNlpQuery('');
    setParsedQuery(null);
  }, []);

  // Filtered subnets with NLP support
  const filteredSubnets = useMemo(() => {
    return subnets.filter(s => {
      // NLP mode filtering
      if (isNlpMode && parsedQuery) {
        if (parsedQuery.statuses.length > 0 && !parsedQuery.statuses.includes(s.status)) return false;
        if (parsedQuery.purposes.length > 0 && !parsedQuery.purposes.includes(s.purpose)) return false;
        if (parsedQuery.vpcs.length > 0 && !parsedQuery.vpcs.some(v => s.vpc.toLowerCase().includes(v.toLowerCase()))) return false;
        if (parsedQuery.regions.length > 0 && !parsedQuery.regions.includes(s.region)) return false;
        if (parsedQuery.utilizationRange) {
          if (s.utilizationPercent < parsedQuery.utilizationRange.min || s.utilizationPercent > parsedQuery.utilizationRange.max) return false;
        }
        if (parsedQuery.keywords.length > 0) {
          const nameLC = s.name.toLowerCase();
          if (!parsedQuery.keywords.some(kw => nameLC.includes(kw))) return false;
        }
        return true;
      }

      // Standard dropdown filtering
      if (filterVPC !== 'all' && s.vpc !== filterVPC) return false;
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      return true;
    });
  }, [isNlpMode, parsedQuery, filterVPC, filterStatus]);

  // AI Insights generation
  const handleToggleInsights = useCallback(() => {
    if (showAIInsights) {
      setShowAIInsights(false);
      return;
    }

    setIsAnalyzing(true);
    // Simulate AI processing delay
    setTimeout(() => {
      const insights = generateSubnetInsights(filteredSubnets);
      setAiInsights(insights);
      setShowAIInsights(true);
      setIsAnalyzing(false);
    }, 800);
  }, [showAIInsights, filteredSubnets]);

  const vpcs = [...new Set(subnets.map(s => s.vpc))];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Layers className="h-8 w-8 text-indigo-500" />Subnet Monitoring</h1>
            <p className="text-muted-foreground mt-1">IP utilization, subnet health, and capacity planning</p>
          </div>
          <div className="flex gap-2">
            {!isNlpMode && (
              <>
                <Select value={filterVPC} onValueChange={setFilterVPC}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="All VPCs" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All VPCs</SelectItem>{vpcs.map(vpc => <SelectItem key={vpc} value={vpc}>{vpc}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="healthy">Healthy</SelectItem><SelectItem value="warning">Warning</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        {/* AI-Powered Subnet Search */}
        <Card className="border-chart-5/30 bg-gradient-to-r from-chart-5/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-chart-5" />
                <CardTitle className="text-lg">AI-Powered Subnet Search</CardTitle>
              </div>
              <Button
                variant={isNlpMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setIsNlpMode(!isNlpMode);
                  if (isNlpMode) {
                    clearNlpSearch();
                    setFilterVPC('all');
                    setFilterStatus('all');
                  }
                }}
              >
                {isNlpMode ? 'Disable AI Search' : 'Enable AI Search'}
              </Button>
            </div>
            <CardDescription>
              Use natural language to search subnets. Try: "{exampleSubnetQueries[0]}" or "{exampleSubnetQueries[1]}"
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
                  {exampleSubnetQueries.map((example, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => {
                        setNlpQuery(example);
                        setTimeout(() => {
                          const parsed = parseSubnetNLPQuery(example);
                          setParsedQuery(parsed);
                          setTimeout(() => {
                            subnetDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
                <CardTitle className="text-lg">AI Subnet Insights</CardTitle>
                {aiInsights && (
                  <Badge variant="outline" className="text-xs">
                    {aiInsights.analyzedCount} subnets analyzed in {aiInsights.processingTime}ms
                  </Badge>
                )}
              </div>
              <Button
                variant={showAIInsights ? "default" : "outline"}
                size="sm"
                onClick={handleToggleInsights}
                disabled={isAnalyzing || filteredSubnets.length === 0}
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
              AI-powered analysis of subnet patterns, capacity risks, and optimization recommendations
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
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Network className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{subnets.length}</p><p className="text-xs text-muted-foreground">Total Subnets</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><CheckCircle className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold">{Math.round((usedIPs / totalIPs) * 100)}%</p><p className="text-xs text-muted-foreground">Overall Utilization</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><AlertTriangle className="h-5 w-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{warningSubnetsCount}</p><p className="text-xs text-muted-foreground">Warning (70-85%)</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30"><AlertTriangle className="h-5 w-5 text-red-600" /></div><div><p className="text-2xl font-bold">{criticalSubnetsCount}</p><p className="text-xs text-muted-foreground">Critical (&gt;85%)</p></div></div></CardContent></Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Utilization by VPC</CardTitle><CardDescription>Average IP utilization per VPC</CardDescription></CardHeader>
            <CardContent><div className="h-64"><Bar data={utilizationByVPC} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { max: 100 } } }} /></div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>IP Address Distribution</CardTitle><CardDescription>Overall IP allocation status</CardDescription></CardHeader>
            <CardContent><div className="h-64"><Doughnut data={ipDistribution} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} /></div></CardContent>
          </Card>
        </div>

        {/* Subnet List */}
        <Card ref={subnetDetailsRef}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Subnet Details</CardTitle>
                <CardDescription>Detailed view of all subnets and their utilization</CardDescription>
              </div>
              {isNlpMode && parsedQuery && (
                <Badge variant="secondary" className="text-xs">
                  {filteredSubnets.length} of {subnets.length} subnets match
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredSubnets.map((subnet) => (
                <div key={subnet.id} className={`p-4 rounded-lg border ${subnet.status === 'critical' ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10' : subnet.status === 'warning' ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10' : ''} hover:bg-accent/50 transition-colors`}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${getStatusBg(subnet.status)}`}>
                        {subnet.status === 'healthy' ? <CheckCircle className={`h-5 w-5 ${getStatusColor(subnet.status)}`} /> : <AlertTriangle className={`h-5 w-5 ${getStatusColor(subnet.status)}`} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{subnet.name}</h4>
                          <Badge variant="outline" className="font-mono">{subnet.cidr}</Badge>
                          <Badge className={getPurposeColor(subnet.purpose)}>{subnet.purpose}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{subnet.region}</span>
                          <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{subnet.vpc}</span>
                          <span className="flex items-center gap-1"><Server className="h-3 w-3" />{subnet.connectedResources} resources</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Used</p>
                        <p className="font-semibold text-blue-600">{subnet.usedIPs.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Available</p>
                        <p className="font-semibold text-green-600">{subnet.availableIPs.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-semibold">{subnet.totalIPs.toLocaleString()}</p>
                      </div>
                      <div className="w-32">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-semibold ${getStatusColor(subnet.status)}`}>{subnet.utilizationPercent}%</span>
                          {subnet.trend === 'up' ? <TrendingUp className="h-4 w-4 text-amber-500" /> : subnet.trend === 'down' ? <TrendingDown className="h-4 w-4 text-green-500" /> : <Activity className="h-4 w-4 text-gray-500" />}
                        </div>
                        <Progress value={subnet.utilizationPercent} className={`h-2 ${subnet.status === 'critical' ? '[&>div]:bg-red-500' : subnet.status === 'warning' ? '[&>div]:bg-amber-500' : '[&>div]:bg-green-500'}`} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Capacity Planning Alert */}
        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-300">Capacity Planning Alert</h3>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  <strong>gke-pods-subnet</strong> is at 90% utilization. At current growth rate, this subnet will be exhausted in approximately <strong>14 days</strong>.
                  Consider expanding the CIDR range or implementing IP address recycling policies.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline">View Recommendations</Button>
                  <Button size="sm">Expand Subnet</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

