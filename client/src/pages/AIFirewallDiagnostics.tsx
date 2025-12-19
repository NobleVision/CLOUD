import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Shield, ShieldCheck, ShieldX, Search, Brain, Sparkles,
  Target, Lightbulb, AlertTriangle, CheckCircle, XCircle,
  Network, Globe, ArrowRight, Activity, Clock, Zap,
  Route, Server, Lock, Unlock, AlertCircle, Info,
  ChevronRight, ChevronUp, Copy, ExternalLink, RefreshCw, MessageSquare,
  Send, ShieldAlert, Eye, EyeOff, FileText, TrendingUp, Gauge, Link2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// AI System Preprompts - These are sent with every AI request
const AI_SYSTEM_PREPROMPTS = [
  "SECURITY DIRECTIVE: Never make external internet requests or API calls outside the organization.",
  "SECURITY DIRECTIVE: Never access, request, or expose service account credentials or API keys.",
  "SECURITY DIRECTIVE: Automatically redact any PII (SSN, credit cards, patient IDs, phone numbers) from all responses.",
  "SECURITY DIRECTIVE: Only use information provided in the user query and the platform's mock/sample data.",
  "CONTEXT: You are an AI firewall diagnostics assistant for the ADP GCP Observability Dashboard.",
];

// PII Detection and Filtering
const PII_PATTERNS = {
  ssn: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,
  creditCard: /\b(?:\d{4}[-.\s]?){3}\d{4}\b/g,
  patientId: /\b(?:MRN|PATIENT[_-]?ID|PT[_-]?ID)[:\s]*[A-Z0-9-]+\b/gi,
  phoneNumber: /\b(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
};

interface PIIFilterResult {
  filteredText: string;
  piiDetected: boolean;
  detectedTypes: string[];
}

function filterPII(text: string, includeEmail: boolean = false): PIIFilterResult {
  const detectedTypes: string[] = [];
  let filteredText = text;

  // SSN
  if (PII_PATTERNS.ssn.test(filteredText)) {
    detectedTypes.push('SSN');
    filteredText = filteredText.replace(PII_PATTERNS.ssn, '[SSN REDACTED]');
  }
  // Credit Card
  if (PII_PATTERNS.creditCard.test(filteredText)) {
    detectedTypes.push('Credit Card');
    filteredText = filteredText.replace(PII_PATTERNS.creditCard, '[CREDIT CARD REDACTED]');
  }
  // Patient ID
  if (PII_PATTERNS.patientId.test(filteredText)) {
    detectedTypes.push('Patient ID');
    filteredText = filteredText.replace(PII_PATTERNS.patientId, '[PATIENT ID REDACTED]');
  }
  // Phone Number
  if (PII_PATTERNS.phoneNumber.test(filteredText)) {
    detectedTypes.push('Phone Number');
    filteredText = filteredText.replace(PII_PATTERNS.phoneNumber, '[PHONE REDACTED]');
  }
  // Email (optional - sometimes needed for troubleshooting)
  if (includeEmail && PII_PATTERNS.email.test(filteredText)) {
    detectedTypes.push('Email');
    filteredText = filteredText.replace(PII_PATTERNS.email, '[EMAIL REDACTED]');
  }

  return {
    filteredText,
    piiDetected: detectedTypes.length > 0,
    detectedTypes,
  };
}

// Chat message type
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  piiFiltered?: boolean;
  originalHadPII?: boolean;
}

// Types
interface FirewallRule {
  id: string;
  name: string;
  priority: number;
  action: 'allow' | 'deny';
  direction: 'ingress' | 'egress';
  protocol: string;
  ports: string;
  sourceRange: string;
  destinationRange: string;
  vpc: string;
  status: 'matched' | 'not_matched' | 'partial';
  matchReason?: string;
  portMatch?: 'exact' | 'range' | 'any' | 'none';
}

interface RouteHop {
  id: string;
  name: string;
  type: 'source' | 'router' | 'firewall' | 'nat' | 'destination';
  ip: string;
  latency?: number;
  status: 'reachable' | 'unreachable' | 'timeout' | 'filtered';
  details?: string;
}

interface LogPattern {
  id: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error';
  message: string;
  count: number;
  source: string;
}

interface DiagnosticResult {
  overallStatus: 'success' | 'partial' | 'blocked' | 'unknown';
  connectivity: {
    reachable: boolean;
    latency?: number;
    packetLoss?: number;
  };
  matchedRules: FirewallRule[];
  routePath: RouteHop[];
  logPatterns: LogPattern[];
  aiInsights: string[];
  recommendations: {
    id: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    action?: string;
  }[];
}

// AI Firewall Insights Types
interface SecurityVulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedRules: string[];
  remediation: string;
}

interface OptimizationOpportunity {
  id: string;
  type: 'redundant' | 'overly_permissive' | 'consolidation' | 'ordering';
  title: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  rules: string[];
  suggestion: string;
}

interface BestPracticeViolation {
  id: string;
  category: 'naming' | 'segmentation' | 'logging' | 'default_deny' | 'least_privilege';
  title: string;
  description: string;
  recommendation: string;
}

interface CommonIssue {
  id: string;
  pattern: string;
  occurrences: number;
  description: string;
  solution: string;
}

interface FirewallInsights {
  summary: string;
  score: number; // 0-100 security score
  vulnerabilities: SecurityVulnerability[];
  optimizations: OptimizationOpportunity[];
  bestPractices: BestPracticeViolation[];
  commonIssues: CommonIssue[];
  analyzedRules: number;
  processingTime: number;
}

// Generate AI Firewall Insights mock data
function generateFirewallInsights(): FirewallInsights {
  const startTime = performance.now();

  const vulnerabilities: SecurityVulnerability[] = [
    {
      id: 'vuln-1',
      severity: 'high',
      title: 'Overly permissive ingress rule detected',
      description: 'Rule "allow-all-internal" permits traffic from 0.0.0.0/0 on ports 1-65535, exposing services to potential attacks.',
      affectedRules: ['adp-prod-vpc-allow-all-internal', 'adp-staging-vpc-allow-all-internal'],
      remediation: 'Restrict source ranges to specific internal CIDR blocks (e.g., 10.0.0.0/8) and limit port ranges.'
    },
    {
      id: 'vuln-2',
      severity: 'medium',
      title: 'SSH access from broad IP range',
      description: 'SSH (port 22) is accessible from 10.0.0.0/8 without additional restrictions like IAP or bastion hosts.',
      affectedRules: ['adp-dev-vpc-allow-ssh'],
      remediation: 'Implement Identity-Aware Proxy (IAP) for SSH access or restrict to bastion host IPs only.'
    },
    {
      id: 'vuln-3',
      severity: 'low',
      title: 'Database ports exposed to application tier',
      description: 'PostgreSQL (5432) and Redis (6379) are accessible from the entire application subnet.',
      affectedRules: ['adp-prod-vpc-allow-db'],
      remediation: 'Implement micro-segmentation to allow only specific application server IPs.'
    }
  ];

  const optimizations: OptimizationOpportunity[] = [
    {
      id: 'opt-1',
      type: 'redundant',
      title: 'Duplicate firewall rules detected',
      impact: 'Simplifies rule management and reduces evaluation time',
      effort: 'low',
      rules: ['allow-http-traffic', 'allow-web-traffic'],
      suggestion: 'Consolidate duplicate rules into a single rule with combined port ranges.'
    },
    {
      id: 'opt-2',
      type: 'ordering',
      title: 'Suboptimal rule priority ordering',
      impact: 'Improves packet processing performance by 15-20%',
      effort: 'medium',
      rules: ['deny-malicious-ips', 'allow-internal-all'],
      suggestion: 'Move deny rules to higher priority (lower number) to reject malicious traffic earlier.'
    },
    {
      id: 'opt-3',
      type: 'consolidation',
      title: 'Multiple rules can be merged',
      impact: 'Reduces total rule count by 40%, improving manageability',
      effort: 'medium',
      rules: ['allow-port-80', 'allow-port-443', 'allow-port-8080'],
      suggestion: 'Create single rule with port list: 80,443,8080 instead of three separate rules.'
    }
  ];

  const bestPractices: BestPracticeViolation[] = [
    {
      id: 'bp-1',
      category: 'default_deny',
      title: 'Missing explicit default deny rule',
      description: 'While GCP has implicit deny, an explicit default-deny rule at lowest priority improves visibility and logging.',
      recommendation: 'Add explicit deny-all rule at priority 65534 with logging enabled.'
    },
    {
      id: 'bp-2',
      category: 'logging',
      title: 'Firewall logging not enabled on 12 rules',
      description: 'Several firewall rules do not have logging enabled, limiting troubleshooting capability.',
      recommendation: 'Enable firewall logging on all rules, use sampling for high-traffic rules.'
    },
    {
      id: 'bp-3',
      category: 'naming',
      title: 'Inconsistent naming convention',
      description: 'Some rules use dashes, others use underscores. Mixed case and abbreviations found.',
      recommendation: 'Adopt consistent naming: {vpc}-{direction}-{service}-{action} (e.g., prod-ingress-web-allow)'
    },
    {
      id: 'bp-4',
      category: 'segmentation',
      title: 'Network segmentation gaps identified',
      description: 'Production and staging VPCs have overly permissive cross-VPC communication.',
      recommendation: 'Implement strict VPC peering rules and use network tags for isolation.'
    }
  ];

  const commonIssues: CommonIssue[] = [
    {
      id: 'issue-1',
      pattern: 'Health check source ranges outdated',
      occurrences: 3,
      description: 'Some health check rules use deprecated Google IP ranges.',
      solution: 'Update to current ranges: 35.191.0.0/16 and 130.211.0.0/22'
    },
    {
      id: 'issue-2',
      pattern: 'Missing egress rules for external APIs',
      occurrences: 5,
      description: 'Applications may fail to reach external APIs due to missing egress rules.',
      solution: 'Add explicit egress rules for required external API destinations.'
    },
    {
      id: 'issue-3',
      pattern: 'Stale rules referencing deleted resources',
      occurrences: 2,
      description: 'Found rules targeting network tags that no longer exist in the project.',
      solution: 'Audit and remove rules referencing non-existent tags or instances.'
    }
  ];

  const processingTime = Math.round(performance.now() - startTime) + Math.floor(Math.random() * 100) + 200;

  // Calculate security score
  const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
  const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
  const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;
  const bpViolations = bestPractices.length;

  const score = Math.max(0, Math.min(100,
    100 - (criticalCount * 25) - (highCount * 15) - (mediumCount * 8) - (bpViolations * 3)
  ));

  return {
    summary: `Analyzed 47 firewall rules across 3 VPCs. Found ${vulnerabilities.length} security vulnerabilities, ${optimizations.length} optimization opportunities, and ${bestPractices.length} best practice violations. Security score: ${score}/100.`,
    score,
    vulnerabilities,
    optimizations,
    bestPractices,
    commonIssues,
    analyzedRules: 47,
    processingTime
  };
}

// Mock data generators
function generateMockDiagnostics(sourceIP: string, destIP: string, port?: number): DiagnosticResult {
  const isBlocked = Math.random() > 0.6;
  const isPartial = !isBlocked && Math.random() > 0.5;
  const portNum = port || 443;
  const isCommonPort = [22, 80, 443, 8080, 3306, 5432, 6379].includes(portNum);

  const vpcs = ['adp-prod-vpc', 'adp-staging-vpc', 'adp-dev-vpc'];
  const selectedVpc = vpcs[Math.floor(Math.random() * vpcs.length)];

  // Determine port matching
  const getPortMatch = (rulePorts: string): 'exact' | 'range' | 'any' | 'none' => {
    if (rulePorts === 'all') return 'any';
    const ports = rulePorts.split(',').map(p => p.trim());
    if (ports.includes(portNum.toString())) return 'exact';
    for (const p of ports) {
      if (p.includes('-')) {
        const [start, end] = p.split('-').map(Number);
        if (portNum >= start && portNum <= end) return 'range';
      }
    }
    return 'none';
  };

  const matchedRules: FirewallRule[] = [
    {
      id: 'rule-1',
      name: `${selectedVpc}-allow-internal`,
      priority: 1000,
      action: 'allow',
      direction: 'ingress',
      protocol: 'tcp',
      ports: '80,443,8080',
      sourceRange: '10.0.0.0/8',
      destinationRange: '0.0.0.0/0',
      vpc: selectedVpc,
      status: 'matched',
      matchReason: `Source IP falls within allowed range, port ${portNum} ${getPortMatch('80,443,8080') !== 'none' ? 'matches' : 'does not match'} rule`,
      portMatch: getPortMatch('80,443,8080'),
    },
    {
      id: 'rule-2',
      name: `${selectedVpc}-deny-external-ssh`,
      priority: 500,
      action: 'deny',
      direction: 'ingress',
      protocol: 'tcp',
      ports: '22',
      sourceRange: '0.0.0.0/0',
      destinationRange: '0.0.0.0/0',
      vpc: selectedVpc,
      status: isBlocked && portNum === 22 ? 'matched' : 'not_matched',
      matchReason: isBlocked && portNum === 22 ? `SSH access (port ${portNum}) from external IPs is blocked` : undefined,
      portMatch: getPortMatch('22'),
    },
    {
      id: 'rule-3',
      name: `${selectedVpc}-allow-healthcheck`,
      priority: 1100,
      action: 'allow',
      direction: 'ingress',
      protocol: 'tcp',
      ports: '80,443',
      sourceRange: '35.191.0.0/16,130.211.0.0/22',
      destinationRange: '0.0.0.0/0',
      vpc: selectedVpc,
      status: 'partial',
      matchReason: `Health check ranges partially match, port ${portNum}`,
      portMatch: getPortMatch('80,443'),
    },
    {
      id: 'rule-4',
      name: `${selectedVpc}-allow-database`,
      priority: 1200,
      action: 'allow',
      direction: 'ingress',
      protocol: 'tcp',
      ports: '3306,5432,6379',
      sourceRange: '10.128.0.0/16',
      destinationRange: '10.130.0.0/16',
      vpc: selectedVpc,
      status: [3306, 5432, 6379].includes(portNum) ? 'matched' : 'not_matched',
      matchReason: [3306, 5432, 6379].includes(portNum) ? `Database port ${portNum} allowed from internal subnet` : undefined,
      portMatch: getPortMatch('3306,5432,6379'),
    },
  ];

  const routePath: RouteHop[] = [
    { id: 'hop-1', name: 'Source', type: 'source', ip: sourceIP, status: 'reachable', latency: 0 },
    { id: 'hop-2', name: 'VPC Router', type: 'router', ip: '10.128.0.1', status: 'reachable', latency: 1, details: `Routing traffic for port ${portNum}` },
    { id: 'hop-3', name: 'Cloud NAT', type: 'nat', ip: '35.192.x.x', status: 'reachable', latency: 3, details: 'NAT translation applied' },
    { id: 'hop-4', name: 'Firewall', type: 'firewall', ip: 'FW-Prod-01', status: isBlocked ? 'filtered' : 'reachable', latency: isBlocked ? undefined : 5, details: isBlocked ? `Port ${portNum} blocked` : `Port ${portNum} allowed` },
    { id: 'hop-5', name: 'Destination', type: 'destination', ip: `${destIP}:${portNum}`, status: isBlocked ? 'unreachable' : 'reachable', latency: isBlocked ? undefined : 12 },
  ];

  const logPatterns: LogPattern[] = [
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 300000),
      severity: isBlocked ? 'error' : 'info',
      message: isBlocked ? `Connection denied from ${sourceIP} to ${destIP}:${portNum}` : `Connection established from ${sourceIP} to ${destIP}:${portNum}`,
      count: isBlocked ? 47 : 1523,
      source: 'vpc-flow-logs',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 600000),
      severity: 'warning',
      message: `High latency detected on route to ${destIP}:${portNum}`,
      count: 23,
      source: 'network-monitoring',
    },
    {
      id: 'log-3',
      timestamp: new Date(Date.now() - 900000),
      severity: isBlocked ? 'error' : 'info',
      message: isBlocked ? `Firewall rule evaluation: port ${portNum} denied by policy` : `Firewall rule evaluation: port ${portNum} allowed by policy`,
      count: isBlocked ? 156 : 3421,
      source: 'firewall-logs',
    },
  ];

  const aiInsights = isBlocked ? [
    `Traffic from ${sourceIP} to ${destIP}:${portNum} is being blocked by firewall rule`,
    `Port ${portNum} ${portNum === 22 ? '(SSH)' : portNum === 3306 ? '(MySQL)' : portNum === 5432 ? '(PostgreSQL)' : portNum === 443 ? '(HTTPS)' : ''} is not allowed from the source IP range`,
    'Similar connection attempts have been blocked 47 times in the last hour',
    portNum === 22 ? 'Consider using IAP (Identity-Aware Proxy) for secure SSH access instead' : `Consider creating a firewall rule to allow port ${portNum} from trusted sources`,
  ] : [
    `Traffic from ${sourceIP} to ${destIP}:${portNum} is allowed through the current firewall configuration`,
    `Port ${portNum} matches the allowed port range in firewall rule "${selectedVpc}-allow-internal"`,
    `Route traverses ${routePath.length - 2} intermediate hops with an average latency of ${Math.floor(Math.random() * 20 + 5)}ms`,
    isCommonPort ? `Connection using standard service port ${portNum}` : `Using non-standard port ${portNum} - ensure this is intentional`,
  ];

  const recommendations = isBlocked ? [
    { id: 'rec-1', priority: 'high' as const, title: portNum === 22 ? 'Use IAP for SSH Access' : `Create Firewall Rule for Port ${portNum}`, description: portNum === 22 ? 'Configure Identity-Aware Proxy for secure SSH tunneling without exposing ports' : `Create a specific firewall rule to allow port ${portNum} from authorized sources`, action: portNum === 22 ? 'gcloud compute ssh --tunnel-through-iap' : `gcloud compute firewall-rules create allow-port-${portNum} --allow tcp:${portNum} --source-ranges=10.0.0.0/8` },
    { id: 'rec-2', priority: 'medium' as const, title: 'Create Specific Allow Rule', description: 'If access is required, create a firewall rule with specific source IP ranges', action: `gcloud compute firewall-rules create custom-rule --allow tcp:${portNum} --source-ranges=${sourceIP}/32` },
    { id: 'rec-3', priority: 'low' as const, title: 'Review Network Tags', description: 'Ensure target VMs have correct network tags for firewall rule matching' },
  ] : [
    { id: 'rec-1', priority: 'low' as const, title: 'Enable Flow Logs', description: 'Consider enabling VPC flow logs for better visibility', action: 'gcloud compute networks subnets update ...' },
    { id: 'rec-2', priority: 'medium' as const, title: 'Review Rule Priority', description: 'Current rule priorities are optimal, but consider consolidating overlapping rules' },
  ];

  return {
    overallStatus: isBlocked ? 'blocked' : isPartial ? 'partial' : 'success',
    connectivity: {
      reachable: !isBlocked,
      latency: isBlocked ? undefined : Math.floor(Math.random() * 50 + 10),
      packetLoss: isBlocked ? 100 : Math.random() * 2,
    },
    matchedRules,
    routePath,
    logPatterns,
    aiInsights,
    recommendations,
  };
}

// Helper functions
const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
    case 'reachable':
    case 'matched':
      return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    case 'partial':
    case 'timeout':
      return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400';
    case 'blocked':
    case 'unreachable':
    case 'filtered':
      return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    case 'medium': return 'border-amber-500 bg-amber-50 dark:bg-amber-900/20';
    case 'low': return 'border-green-500 bg-green-50 dark:bg-green-900/20';
    default: return 'border-gray-300';
  }
};

const getHopIcon = (type: RouteHop['type']) => {
  switch (type) {
    case 'source': return Globe;
    case 'router': return Network;
    case 'firewall': return Shield;
    case 'nat': return ArrowRight;
    case 'destination': return Server;
    default: return Network;
  }
};

// Chat prompt templates
const PROMPT_TEMPLATES = [
  {
    id: 'connection-blocked',
    label: 'Connection Blocked',
    icon: ShieldX,
    template: "This is the error I'm getting: connection refused. Source IP is 10.128.0.50, destination is 10.132.0.100, port 443 - tell me what is blocking the connection",
  },
  {
    id: 'timeout-issue',
    label: 'Connection Timeout',
    icon: Clock,
    template: "I'm seeing connection timeouts from 10.128.5.20 to 10.130.2.50 on port 3306. The MySQL database is not responding.",
  },
  {
    id: 'ssh-blocked',
    label: 'SSH Access Denied',
    icon: Lock,
    template: "Why can't 35.192.45.100 reach 10.128.0.50 on port 22? I need SSH access to this VM for debugging.",
  },
  {
    id: 'web-traffic',
    label: 'Web Traffic Issue',
    icon: Globe,
    template: "Web traffic from external IP 203.0.113.50 to our load balancer at 10.128.1.100:443 is being dropped. Error: no route to host",
  },
  {
    id: 'database-connection',
    label: 'Database Connection',
    icon: Server,
    template: "Our API server at 10.128.3.25 cannot connect to PostgreSQL at 10.130.5.10:5432. Getting connection refused errors.",
  },
  {
    id: 'redis-cache',
    label: 'Cache Connection',
    icon: Activity,
    template: "Redis cache connection failing from 10.128.2.15 to 10.130.1.5:6379. Need to check if firewall is blocking Redis traffic.",
  },
  {
    id: 'health-check',
    label: 'Health Check Failure',
    icon: AlertCircle,
    template: "GCP health checks from 35.191.0.0/16 are failing to reach our backend VMs on port 8080. Load balancer shows unhealthy instances.",
  },
];

// Generate AI response for chat
function generateAIChatResponse(userMessage: string): string {
  // Extract IPs and ports from the message
  const ipPattern = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g;
  const portPattern = /port\s*(\d+)/gi;

  const ips = userMessage.match(ipPattern) || [];
  const portMatches = [...userMessage.matchAll(portPattern)];
  const port = portMatches.length > 0 ? parseInt(portMatches[0][1]) : 443;

  const sourceIP = ips[0] || '10.128.0.50';
  const destIP = ips[1] || '10.132.0.100';

  // Simulate different responses based on content
  if (userMessage.toLowerCase().includes('ssh') || port === 22) {
    return `🔍 **Analysis Complete**

Based on the connectivity request from **${sourceIP}** to **${destIP}:22** (SSH):

**Issue Identified:** SSH traffic is blocked by firewall rule \`adp-prod-vpc-deny-external-ssh\`

**Root Cause:**
- Priority 500 deny rule blocks all SSH (port 22) traffic from external sources
- This is a security best practice to prevent unauthorized SSH access

**Recommendations:**
1. **Use IAP Tunneling (Recommended):** \`gcloud compute ssh --tunnel-through-iap VM_NAME\`
2. **Create a bastion host** with IAP enabled for secure access
3. If direct SSH is required, create a specific allow rule with source IP restrictions

⚠️ Note: AI features never access service account keys or PII data.`;
  }

  if (userMessage.toLowerCase().includes('timeout') || userMessage.toLowerCase().includes('database') || port === 3306 || port === 5432) {
    return `🔍 **Analysis Complete**

Based on the connectivity request from **${sourceIP}** to **${destIP}:${port}** (${port === 3306 ? 'MySQL' : port === 5432 ? 'PostgreSQL' : 'Database'}):

**Issue Identified:** Database traffic may be blocked or experiencing latency

**Firewall Rules Checked:**
- \`adp-prod-vpc-allow-database\` - Status: Partially matched
- Source subnet 10.128.0.0/16 → Destination 10.130.0.0/16

**Possible Causes:**
1. Source IP not in allowed subnet range
2. Network tags not properly applied to database VM
3. Cloud SQL proxy configuration issue

**Recommendations:**
1. Verify VM network tags: \`gcloud compute instances describe VM_NAME --format='get(tags.items)'\`
2. Check firewall rule: \`gcloud compute firewall-rules describe adp-prod-vpc-allow-database\`
3. Test connectivity: \`nc -zv ${destIP} ${port}\`

⚠️ Note: AI features never access service account keys or PII data.`;
  }

  return `🔍 **Analysis Complete**

Based on the connectivity request from **${sourceIP}** to **${destIP}:${port}**:

**Connectivity Status:** Analyzing firewall rules and network path...

**Firewall Rules Evaluated:**
- \`adp-prod-vpc-allow-internal\` (Priority 1000) - ✅ Matches internal traffic
- \`adp-prod-vpc-allow-healthcheck\` (Priority 1100) - Partially matches

**Network Path:**
1. Source (${sourceIP}) → VPC Router → Cloud NAT → Firewall → Destination (${destIP}:${port})

**AI Insights:**
- Traffic appears to be ${ips[0]?.startsWith('10.') ? 'internal' : 'external'} to ${ips[1]?.startsWith('10.') ? 'internal' : 'external'}
- Port ${port} is ${[80, 443, 8080].includes(port) ? 'commonly allowed for web traffic' : 'a custom port that may need explicit rules'}

**Next Steps:**
1. Review VPC flow logs for detailed traffic analysis
2. Check if destination VM has appropriate network tags
3. Verify no overlapping deny rules with higher priority

⚠️ Note: AI features never access service account keys or PII data.`;
}

// Main component
export default function AIFirewallDiagnostics() {
  const [sourceIP, setSourceIP] = useState('');
  const [destIP, setDestIP] = useState('');
  const [port, setPort] = useState('443');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [mainView, setMainView] = useState<'form' | 'chat'>('form');

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatProcessing, setIsChatProcessing] = useState(false);
  const [piiWarning, setPiiWarning] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // AI Insights state
  const [showInsights, setShowInsights] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [firewallInsights, setFirewallInsights] = useState<FirewallInsights | null>(null);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Example IPs for quick testing
  const exampleIPs = [
    { source: '10.128.0.50', dest: '10.132.0.100', port: '443', label: 'Internal to Internal' },
    { source: '35.192.45.100', dest: '10.128.0.50', port: '22', label: 'External to Internal' },
    { source: '10.128.0.50', dest: '8.8.8.8', port: '80', label: 'Internal to Internet' },
  ];

  const validateIP = (ip: string) => {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipRegex.test(ip);
  };

  const validatePort = (portStr: string) => {
    const portNum = parseInt(portStr);
    return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
  };

  const handleAnalyze = async () => {
    if (!validateIP(sourceIP) || !validateIP(destIP) || !validatePort(port)) {
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const diagnosticResult = generateMockDiagnostics(sourceIP, destIP, parseInt(port));
    setResult(diagnosticResult);
    setIsAnalyzing(false);
  };

  const handleExampleClick = (source: string, dest: string, portNum: string) => {
    setSourceIP(source);
    setDestIP(dest);
    setPort(portNum);
  };

  // AI Insights handler
  const handleToggleInsights = useCallback(() => {
    if (showInsights) {
      setShowInsights(false);
      return;
    }

    setIsGeneratingInsights(true);
    // Simulate AI processing delay
    setTimeout(() => {
      const insights = generateFirewallInsights();
      setFirewallInsights(insights);
      setShowInsights(true);
      setIsGeneratingInsights(false);
    }, 1200);
  }, [showInsights]);

  // Chat handlers
  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    // Filter PII from user input
    const piiResult = filterPII(chatInput, false);

    if (piiResult.piiDetected) {
      setPiiWarning(`Potential PII detected and redacted: ${piiResult.detectedTypes.join(', ')}`);
    } else {
      setPiiWarning(null);
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: piiResult.filteredText,
      timestamp: new Date(),
      piiFiltered: piiResult.piiDetected,
      originalHadPII: piiResult.piiDetected,
    };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatProcessing(true);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate and add AI response
    const aiResponse = generateAIChatResponse(piiResult.filteredText);
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, assistantMessage]);
    setIsChatProcessing(false);
  };

  const handlePromptTemplate = (template: string) => {
    setChatInput(template);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              AI Firewall Diagnostics
            </h1>
            <p className="text-muted-foreground mt-1">
              Analyze connectivity between IP addresses with AI-powered insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI-Powered
            </Badge>
          </div>
        </div>

        {/* Security Notice */}
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <ShieldAlert className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 dark:text-blue-300">AI Security & Privacy</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            AI features never access service account keys or PII data. All sensitive information is automatically filtered before processing.
          </AlertDescription>
        </Alert>

        {/* AI Firewall Insights Panel */}
        <Card className="border-purple-200/50 bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-900/10 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">AI Firewall Insights</CardTitle>
                {firewallInsights && (
                  <Badge variant="outline" className="text-xs">
                    {firewallInsights.analyzedRules} rules analyzed in {firewallInsights.processingTime}ms
                  </Badge>
                )}
              </div>
              <Button
                variant={showInsights ? "default" : "outline"}
                size="sm"
                onClick={handleToggleInsights}
                disabled={isGeneratingInsights}
                className="gap-2"
              >
                {isGeneratingInsights ? (
                  <>
                    <Activity className="h-4 w-4 animate-pulse" />
                    Analyzing...
                  </>
                ) : showInsights ? (
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
              AI-powered analysis of firewall configurations, security vulnerabilities, and optimization opportunities
            </CardDescription>
          </CardHeader>
          <AnimatePresence>
            {showInsights && firewallInsights && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardContent className="pt-0">
                  <div className="space-y-6">
                    {/* Summary and Score */}
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 p-4 rounded-lg bg-purple-100/50 dark:bg-purple-900/20 border border-purple-200/50">
                        <p className="text-sm font-medium text-purple-800 dark:text-purple-200">{firewallInsights.summary}</p>
                      </div>
                      <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-background border min-w-[120px]">
                        <Gauge className="h-6 w-6 text-muted-foreground mb-1" />
                        <span className={cn(
                          "text-3xl font-bold",
                          firewallInsights.score >= 80 ? "text-green-600" :
                          firewallInsights.score >= 60 ? "text-yellow-600" :
                          firewallInsights.score >= 40 ? "text-orange-600" : "text-red-600"
                        )}>
                          {firewallInsights.score}
                        </span>
                        <span className="text-xs text-muted-foreground">Security Score</span>
                      </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Security Vulnerabilities */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <ShieldX className="h-4 w-4 text-red-500" />
                          Security Vulnerabilities ({firewallInsights.vulnerabilities.length})
                        </h4>
                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                          {firewallInsights.vulnerabilities.map((vuln) => (
                            <div key={vuln.id} className={cn(
                              "p-3 rounded-lg border bg-background",
                              vuln.severity === 'critical' ? 'border-red-500' :
                              vuln.severity === 'high' ? 'border-orange-400' :
                              vuln.severity === 'medium' ? 'border-yellow-400' : 'border-gray-300'
                            )}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{vuln.title}</span>
                                <Badge variant={
                                  vuln.severity === 'critical' ? 'destructive' :
                                  vuln.severity === 'high' ? 'default' : 'secondary'
                                } className="text-xs capitalize">
                                  {vuln.severity}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">{vuln.description}</p>
                              <div className="text-xs text-green-600 dark:text-green-400 flex items-start gap-1">
                                <Lightbulb className="h-3 w-3 mt-0.5 shrink-0" />
                                <span>{vuln.remediation}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Optimization Opportunities */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          Optimization Opportunities ({firewallInsights.optimizations.length})
                        </h4>
                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                          {firewallInsights.optimizations.map((opt) => (
                            <div key={opt.id} className="p-3 rounded-lg border bg-background">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{opt.title}</span>
                                <Badge variant="outline" className="text-xs capitalize">{opt.type.replace('_', ' ')}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">Impact: {opt.impact}</p>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-blue-600 dark:text-blue-400">{opt.suggestion}</span>
                                <Badge variant="secondary" className="text-xs">Effort: {opt.effort}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Best Practice Violations */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          Best Practice Violations ({firewallInsights.bestPractices.length})
                        </h4>
                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                          {firewallInsights.bestPractices.map((bp) => (
                            <div key={bp.id} className="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-background">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{bp.title}</span>
                                <Badge variant="outline" className="text-xs capitalize">{bp.category.replace('_', ' ')}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">{bp.description}</p>
                              <div className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
                                <Target className="h-3 w-3 mt-0.5 shrink-0" />
                                <span>{bp.recommendation}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Common Issues */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-purple-500" />
                          Common Issues Detected ({firewallInsights.commonIssues.length})
                        </h4>
                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                          {firewallInsights.commonIssues.map((issue) => (
                            <div key={issue.id} className="p-3 rounded-lg border bg-background">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{issue.pattern}</span>
                                <Badge variant="secondary" className="text-xs">{issue.occurrences} occurrences</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">{issue.description}</p>
                              <div className="text-xs text-green-600 dark:text-green-400 flex items-start gap-1">
                                <CheckCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                <span>{issue.solution}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Mode Selector */}
        <div className="flex gap-2">
          <Button
            variant={mainView === 'form' ? 'default' : 'outline'}
            onClick={() => setMainView('form')}
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            Quick Analysis
          </Button>
          <Button
            variant={mainView === 'chat' ? 'default' : 'outline'}
            onClick={() => setMainView('chat')}
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            AI Chat Assistant
          </Button>
        </div>

        {/* Form View */}
        {mainView === 'form' && (
          <>
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Connectivity Analysis
                </CardTitle>
                <CardDescription>
                  Enter source IP, destination IP, and port number to analyze firewall rules and connectivity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="sourceIP">Source IP Address</Label>
                    <Input
                      id="sourceIP"
                      placeholder="e.g., 10.128.0.50"
                      value={sourceIP}
                      onChange={(e) => setSourceIP(e.target.value)}
                      className={!sourceIP || validateIP(sourceIP) ? '' : 'border-red-500'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destIP">Destination IP Address</Label>
                    <Input
                      id="destIP"
                      placeholder="e.g., 10.132.0.100"
                      value={destIP}
                      onChange={(e) => setDestIP(e.target.value)}
                      className={!destIP || validateIP(destIP) ? '' : 'border-red-500'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port">Port Number</Label>
                    <Input
                      id="port"
                      type="number"
                      min="1"
                      max="65535"
                      placeholder="e.g., 443"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      className={!port || validatePort(port) ? '' : 'border-red-500'}
                    />
                    {port && !validatePort(port) && (
                      <p className="text-xs text-red-500">Port must be 1-65535</p>
                    )}
                  </div>
                  <Button
                    onClick={handleAnalyze}
                    disabled={!validateIP(sourceIP) || !validateIP(destIP) || !validatePort(port) || isAnalyzing}
                    className="gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Analyze
                      </>
                    )}
                  </Button>
                </div>

                {/* Quick Examples */}
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Quick examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {exampleIPs.map((example, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => handleExampleClick(example.source, example.dest, example.port)}
                      >
                        {example.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Chat View */}
        {mainView === 'chat' && (
          <Card className="flex flex-col h-[600px]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                AI Chat Assistant
              </CardTitle>
              <CardDescription>
                Describe your firewall issue in natural language. The AI will analyze and provide recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              {/* PII Warning */}
              {piiWarning && (
                <Alert className="mb-3 border-amber-500 bg-amber-50 dark:bg-amber-900/20">
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 dark:text-amber-400">
                    {piiWarning}
                  </AlertDescription>
                </Alert>
              )}

              {/* Prompt Templates */}
              {chatMessages.length === 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Try one of these examples:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {PROMPT_TEMPLATES.map((template) => {
                      const Icon = template.icon;
                      return (
                        <Button
                          key={template.id}
                          variant="outline"
                          size="sm"
                          className="h-auto py-2 px-3 justify-start text-left"
                          onClick={() => handlePromptTemplate(template.template)}
                        >
                          <Icon className="h-4 w-4 mr-2 shrink-0" />
                          <span className="truncate">{template.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-3",
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Brain className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-4 py-2",
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        {message.originalHadPII && (
                          <Badge variant="outline" className="mb-2 text-xs border-amber-500 text-amber-600">
                            <ShieldAlert className="h-3 w-3 mr-1" />
                            PII Redacted
                          </Badge>
                        )}
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                        <p className="text-xs opacity-60 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <span className="text-xs font-medium text-primary-foreground">You</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {isChatProcessing && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Brain className="h-4 w-4 text-primary animate-pulse" />
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <div className="mt-4 flex gap-2">
                <Textarea
                  placeholder="Describe your firewall issue... e.g., 'Why can't 10.128.0.50 reach 10.132.0.100 on port 443?'"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSubmit();
                    }
                  }}
                  className="min-h-[60px] resize-none"
                />
                <Button
                  onClick={handleChatSubmit}
                  disabled={!chatInput.trim() || isChatProcessing}
                  size="icon"
                  className="h-[60px] w-[60px]"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <Brain className="h-16 w-16 text-primary animate-pulse" />
                      <div className="absolute -bottom-1 -right-1">
                        <span className="relative flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-primary" />
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">AI is analyzing connectivity...</p>
                      <p className="text-sm text-muted-foreground">
                        Checking firewall rules, route paths, and log patterns
                      </p>
                    </div>
                    <Progress value={66} className="w-64" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Status Banner */}
              <Alert className={cn(
                result.overallStatus === 'success' && 'border-green-500 bg-green-50 dark:bg-green-900/20',
                result.overallStatus === 'partial' && 'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
                result.overallStatus === 'blocked' && 'border-red-500 bg-red-50 dark:bg-red-900/20',
              )}>
                {result.overallStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                {result.overallStatus === 'partial' && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                {result.overallStatus === 'blocked' && <XCircle className="h-5 w-5 text-red-600" />}
                <AlertTitle className="ml-2">
                  {result.overallStatus === 'success' && 'Connection Allowed'}
                  {result.overallStatus === 'partial' && 'Partial Connectivity'}
                  {result.overallStatus === 'blocked' && 'Connection Blocked'}
                </AlertTitle>
                <AlertDescription className="ml-2">
                  {result.overallStatus === 'success' && `Traffic from ${sourceIP} to ${destIP} is allowed. Latency: ${result.connectivity.latency}ms`}
                  {result.overallStatus === 'partial' && `Some traffic may be restricted between ${sourceIP} and ${destIP}`}
                  {result.overallStatus === 'blocked' && `Traffic from ${sourceIP} to ${destIP} is being blocked by firewall rules`}
                </AlertDescription>
              </Alert>

              {/* Tabs for detailed results */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 w-full max-w-2xl">
                  <TabsTrigger value="overview" className="gap-2">
                    <Activity className="h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="rules" className="gap-2">
                    <Shield className="h-4 w-4" />
                    Rules
                  </TabsTrigger>
                  <TabsTrigger value="path" className="gap-2">
                    <Route className="h-4 w-4" />
                    Path
                  </TabsTrigger>
                  <TabsTrigger value="recommendations" className="gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Actions
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* AI Insights */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Sparkles className="h-5 w-5 text-primary" />
                          AI Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {result.aiInsights.map((insight, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Brain className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                              <span className="text-sm">{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Log Patterns */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Activity className="h-5 w-5" />
                          Log Patterns
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-3">
                            {result.logPatterns.map((log) => (
                              <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                                {log.severity === 'error' && <XCircle className="h-4 w-4 text-red-500 mt-0.5" />}
                                {log.severity === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />}
                                {log.severity === 'info' && <Info className="h-4 w-4 text-blue-500 mt-0.5" />}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate">{log.message}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">{log.count} occurrences</Badge>
                                    <span className="text-xs text-muted-foreground">{log.source}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Rules Tab */}
                <TabsContent value="rules" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Matched Firewall Rules</CardTitle>
                      <CardDescription>Rules evaluated for traffic from {sourceIP} to {destIP}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {result.matchedRules.map((rule) => (
                          <div
                            key={rule.id}
                            className={cn(
                              "p-4 rounded-lg border-2",
                              rule.action === 'allow' ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20' : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/20'
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {rule.action === 'allow' ? (
                                  <ShieldCheck className="h-5 w-5 text-green-600" />
                                ) : (
                                  <ShieldX className="h-5 w-5 text-red-600" />
                                )}
                                <span className="font-medium">{rule.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Priority: {rule.priority}</Badge>
                                <Badge className={getStatusColor(rule.status)}>{rule.status}</Badge>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                              <div><span className="font-medium">Direction:</span> {rule.direction}</div>
                              <div><span className="font-medium">Protocol:</span> {rule.protocol}</div>
                              <div><span className="font-medium">Ports:</span> {rule.ports}</div>
                              <div><span className="font-medium">VPC:</span> {rule.vpc}</div>
                            </div>
                            {rule.matchReason && (
                              <p className="mt-2 text-sm text-muted-foreground italic">
                                → {rule.matchReason}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Path Tab */}
                <TabsContent value="path" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Route Path Analysis</CardTitle>
                      <CardDescription>Network path from source to destination</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative">
                        {result.routePath.map((hop, idx) => {
                          const Icon = getHopIcon(hop.type);
                          return (
                            <div key={hop.id} className="flex items-center gap-4 mb-4">
                              <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center border-2",
                                hop.status === 'reachable' && 'border-green-500 bg-green-100 dark:bg-green-900/30',
                                hop.status === 'filtered' && 'border-amber-500 bg-amber-100 dark:bg-amber-900/30',
                                hop.status === 'unreachable' && 'border-red-500 bg-red-100 dark:bg-red-900/30',
                              )}>
                                <Icon className={cn(
                                  "h-6 w-6",
                                  hop.status === 'reachable' && 'text-green-600',
                                  hop.status === 'filtered' && 'text-amber-600',
                                  hop.status === 'unreachable' && 'text-red-600',
                                )} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{hop.name}</span>
                                  <Badge variant="outline" className="text-xs">{hop.ip}</Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className={cn(
                                    hop.status === 'reachable' && 'text-green-600',
                                    hop.status === 'filtered' && 'text-amber-600',
                                    hop.status === 'unreachable' && 'text-red-600',
                                  )}>
                                    {hop.status === 'reachable' ? '✓ Reachable' : hop.status === 'filtered' ? '⚠ Filtered' : '✗ Unreachable'}
                                  </span>
                                  {hop.latency !== undefined && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {hop.latency}ms
                                    </span>
                                  )}
                                </div>
                              </div>
                              {idx < result.routePath.length - 1 && (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Recommendations Tab */}
                <TabsContent value="recommendations" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recommended Actions</CardTitle>
                      <CardDescription>AI-generated recommendations to resolve issues</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {result.recommendations.map((rec) => (
                          <div
                            key={rec.id}
                            className={cn("p-4 rounded-lg border-l-4", getPriorityColor(rec.priority))}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                <span className="font-medium">{rec.title}</span>
                              </div>
                              <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                                {rec.priority} priority
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                            {rec.action && (
                              <div className="flex items-center gap-2 mt-2">
                                <code className="flex-1 px-3 py-2 bg-muted rounded text-xs font-mono">
                                  {rec.action}
                                </code>
                                <Button variant="ghost" size="icon-sm" onClick={() => navigator.clipboard.writeText(rec.action!)}>
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

