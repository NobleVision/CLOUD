import { useState, useMemo, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Presentation,
  TrendingUp,
  TrendingDown,
  Activity,
  Server,
  Database,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Zap,
  Shield,
  ArrowRight,
  Download,
  Share2,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Flame,
  Network,
  Cpu,
  HardDrive,
  Globe,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Loader2,
  Printer,
} from 'lucide-react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Title, ChartTooltip, Legend);

// Executive Summary Data Types
interface HealthScore {
  overall: number;
  availability: number;
  performance: number;
  security: number;
  cost: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

interface KeyMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  target: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  change: number;
  icon: React.ComponentType<{ className?: string }>;
}

interface IncidentSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  resolved: number;
  mttr: number; // Mean Time to Resolution in minutes
  trending: 'improving' | 'stable' | 'worsening';
}

interface CostSummary {
  monthlySpend: number;
  budget: number;
  forecast: number;
  savings: number;
  topServices: { name: string; cost: number; change: number }[];
}

interface RecommendationItem {
  id: string;
  category: 'cost' | 'performance' | 'security' | 'reliability';
  priority: 'high' | 'medium' | 'low';
  title: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
}

// Mock data
const healthScore: HealthScore = {
  overall: 94,
  availability: 99.97,
  performance: 92,
  security: 96,
  cost: 88,
  trend: 'up',
  change: 2.3,
};

const keyMetrics: KeyMetric[] = [
  { id: 'uptime', name: 'System Uptime', value: 99.97, unit: '%', target: 99.9, status: 'excellent', trend: 'stable', change: 0.02, icon: CheckCircle },
  { id: 'latency', name: 'Avg Latency (P95)', value: 124, unit: 'ms', target: 150, status: 'good', trend: 'down', change: -8.5, icon: Zap },
  { id: 'throughput', name: 'Throughput', value: 12500, unit: 'req/s', target: 10000, status: 'excellent', trend: 'up', change: 15.2, icon: Activity },
  { id: 'errors', name: 'Error Rate', value: 0.12, unit: '%', target: 0.5, status: 'excellent', trend: 'down', change: -45, icon: AlertTriangle },
  { id: 'cpu', name: 'CPU Utilization', value: 68, unit: '%', target: 80, status: 'good', trend: 'up', change: 5.2, icon: Cpu },
  { id: 'memory', name: 'Memory Usage', value: 72, unit: '%', target: 85, status: 'good', trend: 'stable', change: 1.1, icon: HardDrive },
];

const incidentSummary: IncidentSummary = {
  total: 23,
  critical: 1,
  high: 4,
  medium: 8,
  resolved: 18,
  mttr: 42,
  trending: 'improving',
};

const costSummary: CostSummary = {
  monthlySpend: 847520,
  budget: 950000,
  forecast: 892450,
  savings: 45230,
  topServices: [
    { name: 'Compute Engine', cost: 312500, change: 8.2 },
    { name: 'Cloud Storage', cost: 145800, change: -3.5 },
    { name: 'BigQuery', cost: 128400, change: 15.8 },
    { name: 'Cloud SQL', cost: 98200, change: 2.1 },
    { name: 'GKE', cost: 87500, change: 12.4 },
  ],
};

const recommendations: RecommendationItem[] = [
  { id: '1', category: 'cost', priority: 'high', title: 'Right-size underutilized VMs', impact: 'Save $12,500/month', effort: 'low' },
  { id: '2', category: 'performance', priority: 'high', title: 'Enable CDN for static assets', impact: 'Reduce latency by 40%', effort: 'medium' },
  { id: '3', category: 'security', priority: 'medium', title: 'Rotate service account keys', impact: 'Reduce security risk', effort: 'low' },
  { id: '4', category: 'reliability', priority: 'medium', title: 'Add read replicas to Cloud SQL', impact: 'Improve availability', effort: 'high' },
];

// Helper functions
const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent': return { bg: 'bg-green-500', text: 'text-green-500', border: 'border-green-500' };
    case 'good': return { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' };
    case 'warning': return { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500' };
    case 'critical': return { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' };
    default: return { bg: 'bg-gray-500', text: 'text-gray-500', border: 'border-gray-500' };
  }
};

const getTrendIcon = (trend: string, change: number) => {
  if (trend === 'up' || change > 0) return <ArrowUpRight className="h-4 w-4 text-green-500" />;
  if (trend === 'down' || change < 0) return <ArrowDownRight className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-gray-500" />;
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-500/10 text-red-500 border-red-500/30';
    case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
    case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
    default: return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'cost': return DollarSign;
    case 'performance': return Zap;
    case 'security': return Shield;
    case 'reliability': return Server;
    default: return Lightbulb;
  }
};

// Health Score Ring Component
function HealthScoreRing({ score, size = 180 }: { score: number; size?: number }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 90) return '#22c55e';
    if (score >= 70) return '#3b82f6';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getScoreColor()}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold">{score}</span>
        <span className="text-sm text-muted-foreground">Health Score</span>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ metric }: { metric: KeyMetric }) {
  const Icon = metric.icon;
  const colors = getStatusColor(metric.status);

  return (
    <div className="p-4 rounded-xl border bg-card hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2 rounded-lg", `${colors.bg}/10`)}>
          <Icon className={cn("h-5 w-5", colors.text)} />
        </div>
        <div className="flex items-center gap-1 text-xs">
          {getTrendIcon(metric.trend, metric.change)}
          <span className={metric.change > 0 ? "text-green-500" : metric.change < 0 ? "text-red-500" : "text-gray-500"}>
            {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold">
          {metric.value.toLocaleString()}<span className="text-sm font-normal text-muted-foreground ml-1">{metric.unit}</span>
        </p>
        <p className="text-sm text-muted-foreground">{metric.name}</p>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Target: {metric.target}{metric.unit}</span>
          <Badge variant="outline" className={cn("text-xs", colors.border, colors.text)}>
            {metric.status}
          </Badge>
        </div>
        <Progress
          value={Math.min((metric.value / metric.target) * 100, 100)}
          className="h-1.5"
        />
      </div>
    </div>
  );
}

// Main Executive Summary Component
export default function ExecutiveSummary() {
  const [timeRange, setTimeRange] = useState('7d');
  const [lastUpdated] = useState(new Date());
  const [isExporting, setIsExporting] = useState(false);
  const [, setLocation] = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);

  // Navigation handlers
  const navigateTo = useCallback((path: string) => {
    setLocation(path);
  }, [setLocation]);

  // Print/Present handler
  const handlePresent = useCallback(() => {
    window.print();
  }, []);

  // Export to PDF handler
  const handleExportPDF = useCallback(async () => {
    if (!contentRef.current || isExporting) return;

    setIsExporting(true);
    try {
      const element = contentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`executive-summary-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  // Chart data for trends
  const trendLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];

  const uptimeTrendData = {
    labels: trendLabels,
    datasets: [{
      label: 'Uptime',
      data: [99.95, 99.98, 99.97, 99.99, 99.96, 99.97, 99.97],
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const costTrendData = {
    labels: trendLabels,
    datasets: [{
      label: 'Daily Spend',
      data: [28500, 27200, 29100, 28800, 27500, 25200, 28100],
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderRadius: 4,
    }],
  };

  const incidentTrendData = {
    labels: trendLabels,
    datasets: [{
      label: 'Incidents',
      data: [5, 3, 4, 2, 4, 2, 3],
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 } } },
    },
  };

  return (
    <DashboardLayout>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          .print-content .card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
      <div className="space-y-6 print-content" ref={contentRef}>
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <Presentation className="h-7 w-7 text-purple-500" />
              </div>
              Executive Summary
            </h1>
            <p className="text-muted-foreground mt-1">
              One-click presentation-ready briefing • Last updated {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-3 no-print">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleExportPDF}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export as PDF</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button className="gap-2" onClick={handlePresent}>
              <Printer className="h-4 w-4" />
              Present
            </Button>
          </div>
        </div>

        {/* Health Score & Key Stats Row */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Health Score */}
          <Card className="lg:col-span-3">
            <CardContent className="pt-6 flex flex-col items-center">
              <HealthScoreRing score={healthScore.overall} />
              <div className="flex items-center gap-2 mt-4">
                {healthScore.trend === 'up' ? (
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{healthScore.change}% this week
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/10 text-red-500 border-red-500/30">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {healthScore.change}% this week
                  </Badge>
                )}
              </div>
              <div className="w-full mt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Availability</span>
                  <span className="font-medium">{healthScore.availability}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Performance</span>
                  <span className="font-medium">{healthScore.performance}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Security</span>
                  <span className="font-medium">{healthScore.security}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cost Efficiency</span>
                  <span className="font-medium">{healthScore.cost}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics Grid */}
          <div className="lg:col-span-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {keyMetrics.map(metric => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>
        </div>

        {/* Trend Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Uptime Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                System Availability
              </CardTitle>
              <CardDescription className="text-xs">7-day uptime trend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32">
                <Line data={uptimeTrendData} options={{...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 99.9, max: 100 } }}} />
              </div>
            </CardContent>
          </Card>

          {/* Cost Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                Daily Spend
              </CardTitle>
              <CardDescription className="text-xs">7-day cost trend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32">
                <Bar data={costTrendData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          {/* Incident Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-500" />
                Incident Volume
              </CardTitle>
              <CardDescription className="text-xs">7-day incident trend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32">
                <Line data={incidentTrendData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Incidents & Cost Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Incident Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Incident Summary
              </CardTitle>
              <CardDescription>Current period overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{incidentSummary.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-500/10">
                  <p className="text-2xl font-bold text-red-500">{incidentSummary.critical}</p>
                  <p className="text-xs text-muted-foreground">Critical</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-500/10">
                  <p className="text-2xl font-bold text-amber-500">{incidentSummary.high}</p>
                  <p className="text-xs text-muted-foreground">High</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-500/10">
                  <p className="text-2xl font-bold text-green-500">{incidentSummary.resolved}</p>
                  <p className="text-xs text-muted-foreground">Resolved</p>
                </div>
              </div>
              <Separator className="mb-4" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mean Time to Resolution</p>
                  <p className="text-2xl font-bold">{incidentSummary.mttr} <span className="text-sm font-normal">minutes</span></p>
                </div>
                <Badge className={cn(
                  incidentSummary.trending === 'improving' ? 'bg-green-500/10 text-green-500' :
                  incidentSummary.trending === 'worsening' ? 'bg-red-500/10 text-red-500' : 'bg-gray-500/10 text-gray-500'
                )}>
                  {incidentSummary.trending === 'improving' && <TrendingDown className="h-3 w-3 mr-1" />}
                  {incidentSummary.trending === 'worsening' && <TrendingUp className="h-3 w-3 mr-1" />}
                  {incidentSummary.trending}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Cost Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Cost Summary
              </CardTitle>
              <CardDescription>Monthly budget and spend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Monthly Spend</span>
                    <span className="font-medium">${costSummary.monthlySpend.toLocaleString()} / ${costSummary.budget.toLocaleString()}</span>
                  </div>
                  <Progress value={(costSummary.monthlySpend / costSummary.budget) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {((costSummary.monthlySpend / costSummary.budget) * 100).toFixed(1)}% of budget used
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Forecast</p>
                    <p className="text-lg font-bold">${costSummary.forecast.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <p className="text-xs text-muted-foreground">Potential Savings</p>
                    <p className="text-lg font-bold text-green-500">${costSummary.savings.toLocaleString()}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Top Services by Cost</p>
                  {costSummary.topServices.slice(0, 3).map((service, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{service.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">${service.cost.toLocaleString()}</span>
                        <span className={service.change > 0 ? 'text-red-500' : 'text-green-500'}>
                          {service.change > 0 ? '+' : ''}{service.change}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              AI-Powered Recommendations
            </CardTitle>
            <CardDescription>Prioritized actions for optimization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {recommendations.map((rec) => {
                const CategoryIcon = getCategoryIcon(rec.category);
                return (
                  <div key={rec.id} className="p-4 rounded-xl border hover:shadow-md transition-all group cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn("p-2 rounded-lg", `bg-${rec.category === 'cost' ? 'green' : rec.category === 'performance' ? 'blue' : rec.category === 'security' ? 'purple' : 'orange'}-500/10`)}>
                        <CategoryIcon className={cn("h-4 w-4", `text-${rec.category === 'cost' ? 'green' : rec.category === 'performance' ? 'blue' : rec.category === 'security' ? 'purple' : 'orange'}-500`)} />
                      </div>
                      <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm mb-1">{rec.title}</h4>
                    <p className="text-xs text-muted-foreground mb-3">{rec.impact}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        Effort: {rec.effort}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Footer */}
        <div className="flex items-center justify-center gap-4 py-4 flex-wrap no-print">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigateTo('/dashboard/analytics')}
          >
            <BarChart3 className="h-4 w-4" />
            View Detailed Analytics
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigateTo('/dashboard/sla-tracking')}
          >
            <Target className="h-4 w-4" />
            SLA Dashboard
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigateTo('/dashboard/topology')}
          >
            <Network className="h-4 w-4" />
            Topology Map
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigateTo('/dashboard/incidents')}
          >
            <Flame className="h-4 w-4" />
            Incident Timeline
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}