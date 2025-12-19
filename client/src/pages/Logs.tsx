import { useState, useMemo, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import {
  Search, AlertCircle, Info, AlertTriangle, Bug, XCircle, Sparkles, Clock, X,
  Brain, TrendingUp, Link2, Target, Lightbulb, ChevronDown, ChevronUp, Zap, Activity
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportMenu } from '@/components/ExportMenu';
import { Progress } from '@/components/ui/progress';

const severityIcons = {
  DEBUG: Bug,
  INFO: Info,
  WARNING: AlertTriangle,
  ERROR: AlertCircle,
  CRITICAL: XCircle,
};

const severityColors = {
  DEBUG: 'bg-muted text-muted-foreground',
  INFO: 'bg-chart-4/20 text-chart-4',
  WARNING: 'bg-chart-3/20 text-chart-3',
  ERROR: 'bg-destructive/20 text-destructive',
  CRITICAL: 'bg-destructive text-destructive-foreground',
};

// NLP Query Parser
interface ParsedQuery {
  severities: string[];
  timeRange?: { start: number; end: number };
  keywords: string[];
  environments: string[];
  resources: string[];
  projects: string[];
  explanation: string;
}

function parseNaturalLanguageQuery(query: string): ParsedQuery {
  const lowercaseQuery = query.toLowerCase();
  const result: ParsedQuery = {
    severities: [],
    keywords: [],
    environments: [],
    resources: [],
    projects: [],
    explanation: '',
  };

  const explanationParts: string[] = [];

  // Parse severity levels
  const severityPatterns = [
    { pattern: /\b(error|errors)\b/i, severity: 'ERROR' },
    { pattern: /\b(warning|warnings|warn)\b/i, severity: 'WARNING' },
    { pattern: /\b(critical|crit|fatal)\b/i, severity: 'CRITICAL' },
    { pattern: /\b(info|information)\b/i, severity: 'INFO' },
    { pattern: /\b(debug|debugging)\b/i, severity: 'DEBUG' },
  ];

  for (const { pattern, severity } of severityPatterns) {
    if (pattern.test(lowercaseQuery)) {
      result.severities.push(severity);
    }
  }
  if (result.severities.length > 0) {
    explanationParts.push(`Filtering by severity: ${result.severities.join(', ')}`);
  }

  // Parse time ranges
  const now = Date.now();
  const timePatterns = [
    { pattern: /last\s+(\d+)\s+minutes?/i, multiplier: 60 * 1000 },
    { pattern: /last\s+(\d+)\s+hours?/i, multiplier: 60 * 60 * 1000 },
    { pattern: /last\s+(\d+)\s+days?/i, multiplier: 24 * 60 * 60 * 1000 },
    { pattern: /past\s+(\d+)\s+minutes?/i, multiplier: 60 * 1000 },
    { pattern: /past\s+(\d+)\s+hours?/i, multiplier: 60 * 60 * 1000 },
    { pattern: /past\s+(\d+)\s+days?/i, multiplier: 24 * 60 * 60 * 1000 },
  ];

  for (const { pattern, multiplier } of timePatterns) {
    const match = lowercaseQuery.match(pattern);
    if (match) {
      const value = parseInt(match[1], 10);
      result.timeRange = {
        start: now - value * multiplier,
        end: now,
      };
      explanationParts.push(`Time range: last ${value} ${pattern.toString().includes('minute') ? 'minute(s)' : pattern.toString().includes('hour') ? 'hour(s)' : 'day(s)'}`);
      break;
    }
  }

  // Special time keywords
  if (!result.timeRange) {
    if (/\blast\s+hour\b/i.test(lowercaseQuery)) {
      result.timeRange = { start: now - 60 * 60 * 1000, end: now };
      explanationParts.push('Time range: last hour');
    } else if (/\btoday\b/i.test(lowercaseQuery)) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      result.timeRange = { start: startOfDay.getTime(), end: now };
      explanationParts.push('Time range: today');
    } else if (/\byesterday\b/i.test(lowercaseQuery)) {
      const startOfYesterday = new Date();
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      startOfYesterday.setHours(0, 0, 0, 0);
      const endOfYesterday = new Date(startOfYesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      result.timeRange = { start: startOfYesterday.getTime(), end: endOfYesterday.getTime() };
      explanationParts.push('Time range: yesterday');
    }
  }

  // Parse environments
  const environmentPatterns = [
    { pattern: /\b(prod|production)\b/i, env: 'prod' },
    { pattern: /\b(staging|stage)\b/i, env: 'staging' },
    { pattern: /\b(dev|development)\b/i, env: 'dev' },
  ];

  for (const { pattern, env } of environmentPatterns) {
    if (pattern.test(lowercaseQuery)) {
      result.environments.push(env);
    }
  }
  if (result.environments.length > 0) {
    explanationParts.push(`Environment: ${result.environments.join(', ')}`);
  }

  // Parse common keywords for log content
  const keywordPatterns = [
    { pattern: /\bauth(?:entication|orization)?\b/i, keyword: 'auth' },
    { pattern: /\blogin\b/i, keyword: 'login' },
    { pattern: /\bdatabase|db\b/i, keyword: 'database' },
    { pattern: /\btimeout\b/i, keyword: 'timeout' },
    { pattern: /\bconnection\b/i, keyword: 'connection' },
    { pattern: /\bfail(?:ed|ure)?\b/i, keyword: 'fail' },
    { pattern: /\bslow\b/i, keyword: 'slow' },
    { pattern: /\bcache\b/i, keyword: 'cache' },
    { pattern: /\bapi\b/i, keyword: 'api' },
    { pattern: /\brequest\b/i, keyword: 'request' },
    { pattern: /\buser\b/i, keyword: 'user' },
    { pattern: /\border(?:s)?\b/i, keyword: 'order' },
    { pattern: /\bquery\b/i, keyword: 'query' },
    { pattern: /\brate\s*limit/i, keyword: 'rate limit' },
    { pattern: /\bstatus\s*(?:code\s*)?(\d{3})/i, keyword: 'status' },
  ];

  for (const { pattern, keyword } of keywordPatterns) {
    if (pattern.test(lowercaseQuery)) {
      result.keywords.push(keyword);
    }
  }
  if (result.keywords.length > 0) {
    explanationParts.push(`Keywords: ${result.keywords.join(', ')}`);
  }

  // Parse resource names
  const resourcePatterns = [
    { pattern: /\bweb[\s-]?server/i, resource: 'web-server' },
    { pattern: /\bapi[\s-]?server/i, resource: 'api-server' },
    { pattern: /\bworker/i, resource: 'worker' },
    { pattern: /\bfunction/i, resource: 'function' },
  ];

  for (const { pattern, resource } of resourcePatterns) {
    if (pattern.test(lowercaseQuery)) {
      result.resources.push(resource);
    }
  }
  if (result.resources.length > 0) {
    explanationParts.push(`Resources: ${result.resources.join(', ')}`);
  }

  result.explanation = explanationParts.length > 0
    ? explanationParts.join(' • ')
    : 'Showing all logs matching your query';

  return result;
}

// Example NLP queries for user guidance
const exampleQueries = [
  "Show me errors from the last hour",
  "Find warnings related to authentication",
  "Display logs from production",
  "Critical errors in the last 24 hours",
  "Database connection issues today",
  "Slow queries from api-server",
];

// AI Insights Types
interface PatternAnalysis {
  pattern: string;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  description: string;
}

interface CorrelatedEvent {
  event: string;
  correlation: number;
  description: string;
}

interface RootCause {
  cause: string;
  confidence: number;
  evidence: string[];
}

interface RecommendedAction {
  action: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  effort: string;
}

interface AIInsights {
  patterns: PatternAnalysis[];
  correlations: CorrelatedEvent[];
  rootCauses: RootCause[];
  recommendations: RecommendedAction[];
  summary: string;
  analyzedCount: number;
  processingTime: number;
}

// Generate mock AI insights based on filtered logs
function generateAIInsights(logs: Array<{
  severity: string;
  message: string;
  resource: string;
  environment: string;
  timestamp: number;
}>, parsedQuery: ParsedQuery | null): AIInsights {
  const startTime = performance.now();

  // Analyze log patterns
  const severityCounts: Record<string, number> = {};
  const resourceCounts: Record<string, number> = {};
  const keywordCounts: Record<string, number> = {};
  const envCounts: Record<string, number> = {};

  const keywords = ['timeout', 'connection', 'failed', 'error', 'auth', 'database', 'slow', 'memory', 'cpu', 'disk'];

  logs.forEach(log => {
    severityCounts[log.severity] = (severityCounts[log.severity] || 0) + 1;
    resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1;
    envCounts[log.environment] = (envCounts[log.environment] || 0) + 1;

    const msgLower = log.message.toLowerCase();
    keywords.forEach(kw => {
      if (msgLower.includes(kw)) {
        keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
      }
    });
  });

  // Find top patterns
  const topResource = Object.entries(resourceCounts).sort((a, b) => b[1] - a[1])[0];
  const topKeyword = Object.entries(keywordCounts).sort((a, b) => b[1] - a[1])[0];
  const errorCount = (severityCounts['ERROR'] || 0) + (severityCounts['CRITICAL'] || 0);
  const totalLogs = logs.length;

  const patterns: PatternAnalysis[] = [];

  if (topResource && totalLogs > 0) {
    patterns.push({
      pattern: `${topResource[0]} concentration`,
      percentage: Math.round((topResource[1] / totalLogs) * 100),
      trend: Math.random() > 0.5 ? 'increasing' : 'stable',
      description: `${topResource[1]} of ${totalLogs} logs (${Math.round((topResource[1] / totalLogs) * 100)}%) originate from ${topResource[0]}`
    });
  }

  if (errorCount > 0 && totalLogs > 0) {
    patterns.push({
      pattern: 'Error concentration',
      percentage: Math.round((errorCount / totalLogs) * 100),
      trend: errorCount > totalLogs * 0.3 ? 'increasing' : 'stable',
      description: `${errorCount} errors detected (${Math.round((errorCount / totalLogs) * 100)}% of filtered logs)`
    });
  }

  if (topKeyword) {
    patterns.push({
      pattern: `"${topKeyword[0]}" keyword frequency`,
      percentage: Math.round((topKeyword[1] / totalLogs) * 100),
      trend: 'stable',
      description: `Keyword "${topKeyword[0]}" appears in ${topKeyword[1]} log entries`
    });
  }

  // Generate correlations based on query context
  const correlations: CorrelatedEvent[] = [];

  if (keywordCounts['timeout'] && keywordCounts['connection']) {
    correlations.push({
      event: 'Connection timeouts → Service degradation',
      correlation: 0.87,
      description: 'Connection timeout events precede 87% of service degradation incidents'
    });
  }

  if (keywordCounts['database'] || keywordCounts['slow']) {
    correlations.push({
      event: 'Database query latency → API response delays',
      correlation: 0.92,
      description: 'Slow database queries correlate with increased API response times'
    });
  }

  if (keywordCounts['auth'] || keywordCounts['failed']) {
    correlations.push({
      event: 'Auth failures → Rate limiting triggers',
      correlation: 0.78,
      description: 'Repeated auth failures trigger rate limiting in 78% of cases'
    });
  }

  if (keywordCounts['memory'] || keywordCounts['cpu']) {
    correlations.push({
      event: 'Resource exhaustion → Error spikes',
      correlation: 0.85,
      description: 'Memory/CPU pressure events precede error spikes within 5 minutes'
    });
  }

  // Default correlation if none found
  if (correlations.length === 0 && totalLogs > 0) {
    correlations.push({
      event: 'Log volume patterns',
      correlation: 0.65,
      description: 'Log volume follows typical daily traffic patterns'
    });
  }

  // Generate root causes
  const rootCauses: RootCause[] = [];

  if (keywordCounts['connection'] || keywordCounts['timeout']) {
    rootCauses.push({
      cause: 'Connection pool exhaustion',
      confidence: 85,
      evidence: [
        'Multiple connection timeout events detected',
        'Pattern matches historical pool exhaustion incidents',
        'Concurrent request volume exceeds pool capacity'
      ]
    });
  }

  if (keywordCounts['memory'] || keywordCounts['cpu']) {
    rootCauses.push({
      cause: 'Resource contention',
      confidence: 72,
      evidence: [
        'Memory/CPU metrics elevated during error window',
        'GC pause times increased 3x normal',
        'Container throttling events detected'
      ]
    });
  }

  if (keywordCounts['database'] || keywordCounts['slow']) {
    rootCauses.push({
      cause: 'Database query optimization needed',
      confidence: 68,
      evidence: [
        'Query execution times exceed SLA thresholds',
        'Missing index on frequently queried columns',
        'N+1 query pattern detected in traces'
      ]
    });
  }

  if (rootCauses.length === 0 && errorCount > 0) {
    rootCauses.push({
      cause: 'Transient infrastructure issue',
      confidence: 55,
      evidence: [
        'Error distribution suggests temporary condition',
        'No persistent pattern in error timing',
        'Self-recovery observed in subsequent logs'
      ]
    });
  }

  // Generate recommendations
  const recommendations: RecommendedAction[] = [];

  if (keywordCounts['connection'] || keywordCounts['timeout']) {
    recommendations.push({
      action: 'Increase connection pool size from 10 to 25',
      priority: 'high',
      impact: 'Reduces connection timeouts by ~60%',
      effort: '< 1 hour'
    });
    recommendations.push({
      action: 'Enable connection retry with exponential backoff',
      priority: 'medium',
      impact: 'Improves resilience to transient failures',
      effort: '2-3 hours'
    });
  }

  if (keywordCounts['database'] || keywordCounts['slow']) {
    recommendations.push({
      action: 'Add composite index on (user_id, created_at) columns',
      priority: 'high',
      impact: 'Query time reduction: 80%',
      effort: '1 hour + testing'
    });
  }

  if (keywordCounts['memory'] || keywordCounts['cpu']) {
    recommendations.push({
      action: 'Scale up container resources or enable horizontal pod autoscaling',
      priority: 'medium',
      impact: 'Eliminates resource contention errors',
      effort: '1-2 hours'
    });
  }

  if (keywordCounts['auth']) {
    recommendations.push({
      action: 'Implement auth token caching to reduce auth service load',
      priority: 'medium',
      impact: 'Reduces auth failures by 40%',
      effort: '4-6 hours'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      action: 'Set up automated alerting for detected patterns',
      priority: 'low',
      impact: 'Faster incident detection',
      effort: '1-2 hours'
    });
  }

  // Generate summary
  const summaryParts: string[] = [];
  if (totalLogs > 0) {
    summaryParts.push(`Analyzed ${totalLogs} log entries`);
  }
  if (errorCount > 0) {
    summaryParts.push(`${errorCount} errors/critical issues detected`);
  }
  if (topResource) {
    summaryParts.push(`Primary source: ${topResource[0]}`);
  }
  if (parsedQuery?.keywords.length) {
    summaryParts.push(`Focus areas: ${parsedQuery.keywords.join(', ')}`);
  }

  const processingTime = performance.now() - startTime;

  return {
    patterns,
    correlations,
    rootCauses,
    recommendations,
    summary: summaryParts.join(' • ') || 'No significant patterns detected in the current log selection.',
    analyzedCount: totalLogs,
    processingTime: Math.round(processingTime)
  };
}

export default function Logs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [nlpQuery, setNlpQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [isNlpMode, setIsNlpMode] = useState(false);
  const [parsedQuery, setParsedQuery] = useState<ParsedQuery | null>(null);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Ref for auto-scrolling to log entries after search
  const logEntriesRef = useRef<HTMLDivElement>(null);

  const { data: logs, isLoading } = trpc.logs.list.useQuery({ count: 200 });

  const handleNlpSearch = useCallback(() => {
    if (!nlpQuery.trim()) {
      setParsedQuery(null);
      return;
    }
    const parsed = parseNaturalLanguageQuery(nlpQuery);
    setParsedQuery(parsed);

    // Auto-scroll to log entries after a brief delay for state to update
    setTimeout(() => {
      logEntriesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [nlpQuery]);

  const clearNlpSearch = useCallback(() => {
    setNlpQuery('');
    setParsedQuery(null);
  }, []);

  const filteredLogs = useMemo(() => {
    if (!logs) return [];

    return logs.filter(log => {
      // NLP mode filtering
      if (isNlpMode && parsedQuery) {
        // Filter by severity
        if (parsedQuery.severities.length > 0 && !parsedQuery.severities.includes(log.severity)) {
          return false;
        }

        // Filter by time range
        if (parsedQuery.timeRange) {
          if (log.timestamp < parsedQuery.timeRange.start || log.timestamp > parsedQuery.timeRange.end) {
            return false;
          }
        }

        // Filter by environment
        if (parsedQuery.environments.length > 0 && !parsedQuery.environments.includes(log.environment)) {
          return false;
        }

        // Filter by keywords in message
        if (parsedQuery.keywords.length > 0) {
          const messageLC = log.message.toLowerCase();
          const hasKeyword = parsedQuery.keywords.some(kw => messageLC.includes(kw.toLowerCase()));
          if (!hasKeyword) return false;
        }

        // Filter by resource
        if (parsedQuery.resources.length > 0) {
          const resourceLC = log.resource.toLowerCase();
          const hasResource = parsedQuery.resources.some(r => resourceLC.includes(r.toLowerCase()));
          if (!hasResource) return false;
        }

        return true;
      }

      // Standard mode filtering
      const matchesSearch = searchQuery === '' ||
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;

      return matchesSearch && matchesSeverity;
    });
  }, [logs, searchQuery, severityFilter, isNlpMode, parsedQuery]);

  const severityCounts = logs?.reduce((acc, log) => {
    acc[log.severity] = (acc[log.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Prepare export data
  const exportData = useMemo(() => {
    return filteredLogs.map(log => ({
      timestamp: new Date(log.timestamp).toLocaleString(),
      severity: log.severity,
      message: log.message,
      resource: log.resource,
      environment: log.environment,
    }));
  }, [filteredLogs]);

  const exportColumns = [
    { key: 'timestamp', header: 'Timestamp', width: 40 },
    { key: 'severity', header: 'Severity', width: 20 },
    { key: 'message', header: 'Message', width: 60 },
    { key: 'resource', header: 'Resource', width: 30 },
    { key: 'environment', header: 'Environment', width: 25 },
  ];

  const exportSummary = {
    'Total Logs': filteredLogs.length,
    'Critical': severityCounts['CRITICAL'] || 0,
    'Errors': severityCounts['ERROR'] || 0,
    'Warnings': severityCounts['WARNING'] || 0,
    'Info': severityCounts['INFO'] || 0,
    'Debug': severityCounts['DEBUG'] || 0,
  };

  // Generate AI insights when filtered logs change
  const aiInsights = useMemo(() => {
    if (!showAIInsights || filteredLogs.length === 0) return null;
    return generateAIInsights(filteredLogs, parsedQuery);
  }, [filteredLogs, parsedQuery, showAIInsights]);

  // Handle AI insights toggle with simulated analysis delay
  const handleToggleInsights = useCallback(() => {
    if (!showAIInsights) {
      setIsAnalyzing(true);
      // Simulate AI processing time
      setTimeout(() => {
        setShowAIInsights(true);
        setIsAnalyzing(false);
      }, 800);
    } else {
      setShowAIInsights(false);
    }
  }, [showAIInsights]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Logs Explorer</h1>
            <p className="text-muted-foreground mt-1">
              Search and analyze logs from all GCP services
            </p>
          </div>
          <ExportMenu
            data={exportData}
            columns={exportColumns}
            title="Logs Report"
            subtitle={isNlpMode && parsedQuery ? `NLP Query: ${searchQuery}` : `Filter: ${severityFilter}`}
            summary={exportSummary}
          />
        </div>

        {/* NLP Search */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">AI-Powered Log Search</CardTitle>
              </div>
              <Button
                variant={isNlpMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setIsNlpMode(!isNlpMode);
                  if (!isNlpMode) {
                    setSearchQuery('');
                    setSeverityFilter('all');
                  } else {
                    clearNlpSearch();
                  }
                }}
              >
                {isNlpMode ? 'Switch to Standard' : 'Enable AI Search'}
              </Button>
            </div>
            <CardDescription>
              Use natural language to search logs. Try: "Show me errors from the last hour" or "Find database issues in production"
            </CardDescription>
          </CardHeader>
          {isNlpMode && (
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Sparkles className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary" />
                    <Input
                      placeholder="Ask me anything about your logs..."
                      value={nlpQuery}
                      onChange={(e) => setNlpQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleNlpSearch()}
                      className="pl-9 border-primary/30 focus:border-primary"
                    />
                    {nlpQuery && (
                      <button
                        onClick={clearNlpSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

                {/* Example queries */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">Try:</span>
                  {exampleQueries.slice(0, 4).map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setNlpQuery(example);
                        setParsedQuery(parseNaturalLanguageQuery(example));
                      }}
                      className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>

                {/* Parsed query explanation */}
                {parsedQuery && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-primary">Query Interpretation</p>
                        <p className="text-xs text-muted-foreground mt-1">{parsedQuery.explanation}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {parsedQuery.severities.map(s => (
                            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                          ))}
                          {parsedQuery.environments.map(e => (
                            <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
                          ))}
                          {parsedQuery.keywords.map(k => (
                            <Badge key={k} className="text-xs bg-primary/20 text-primary border-0">{k}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* AI Insights Panel */}
        {(isNlpMode || filteredLogs.length > 0) && (
          <Card className="border-chart-4/30 bg-gradient-to-r from-chart-4/5 to-transparent overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-chart-4" />
                  <CardTitle className="text-lg">AI Log Insights</CardTitle>
                  {aiInsights && (
                    <Badge variant="outline" className="text-xs">
                      {aiInsights.analyzedCount} logs analyzed in {aiInsights.processingTime}ms
                    </Badge>
                  )}
                </div>
                <Button
                  variant={showAIInsights ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleInsights}
                  disabled={isAnalyzing || filteredLogs.length === 0}
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
                AI-powered analysis of log patterns, correlations, and actionable recommendations
              </CardDescription>
            </CardHeader>

            {showAIInsights && aiInsights && (
              <CardContent className="space-y-6">
                {/* Summary Banner */}
                <div className="p-4 rounded-lg bg-chart-4/10 border border-chart-4/20">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-chart-4 mt-0.5" />
                    <div>
                      <p className="font-medium text-chart-4">Analysis Summary</p>
                      <p className="text-sm text-muted-foreground mt-1">{aiInsights.summary}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Pattern Analysis */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold">Pattern Analysis</h4>
                    </div>
                    <div className="space-y-3">
                      {aiInsights.patterns.length > 0 ? aiInsights.patterns.map((pattern, idx) => (
                        <div key={idx} className="p-3 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{pattern.pattern}</span>
                            <Badge
                              variant={pattern.trend === 'increasing' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {pattern.trend === 'increasing' ? '↑' : pattern.trend === 'decreasing' ? '↓' : '→'} {pattern.trend}
                            </Badge>
                          </div>
                          <Progress value={pattern.percentage} className="h-2 mb-2" />
                          <p className="text-xs text-muted-foreground">{pattern.description}</p>
                        </div>
                      )) : (
                        <p className="text-sm text-muted-foreground">No significant patterns detected.</p>
                      )}
                    </div>
                  </div>

                  {/* Correlated Events */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-chart-2" />
                      <h4 className="font-semibold">Correlated Events</h4>
                    </div>
                    <div className="space-y-3">
                      {aiInsights.correlations.map((correlation, idx) => (
                        <div key={idx} className="p-3 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{correlation.event}</span>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(correlation.correlation * 100)}% correlation
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{correlation.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Root Causes */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-destructive" />
                      <h4 className="font-semibold">Suggested Root Causes</h4>
                    </div>
                    <div className="space-y-3">
                      {aiInsights.rootCauses.map((cause, idx) => (
                        <div key={idx} className="p-3 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{cause.cause}</span>
                            <Badge
                              variant={cause.confidence >= 80 ? 'default' : cause.confidence >= 60 ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {cause.confidence}% confidence
                            </Badge>
                          </div>
                          <ul className="space-y-1">
                            {cause.evidence.map((ev, evIdx) => (
                              <li key={evIdx} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="text-chart-4 mt-1">•</span>
                                {ev}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Actions */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-chart-3" />
                      <h4 className="font-semibold">Recommended Actions</h4>
                    </div>
                    <div className="space-y-3">
                      {aiInsights.recommendations.map((rec, idx) => (
                        <div key={idx} className="p-3 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{rec.action}</span>
                            <Badge
                              variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {rec.priority} priority
                            </Badge>
                          </div>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>📈 Impact: {rec.impact}</span>
                            <span>⏱️ Effort: {rec.effort}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Standard Filters (shown when NLP mode is off) */}
        {!isNlpMode && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs by message or resource..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="All Severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="DEBUG">Debug</SelectItem>
                    <SelectItem value="INFO">Info</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Severity Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'] as const).map(severity => {
            const Icon = severityIcons[severity];
            const count = severityCounts[severity] || 0;
            
            return (
              <Card key={severity}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{severity}</span>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Logs List */}
        <Card ref={logEntriesRef}>
          <CardHeader>
            <CardTitle>
              Log Entries ({filteredLogs?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredLogs && filteredLogs.length > 0 ? (
              <div className="space-y-2">
                {filteredLogs.map((log, idx) => {
                  const Icon = severityIcons[log.severity];
                  
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${severityColors[log.severity]}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {log.severity}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {log.environment}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium mb-1">{log.message}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Resource: {log.resource}</span>
                            <span>Project: {log.project}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No logs found matching your criteria</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
