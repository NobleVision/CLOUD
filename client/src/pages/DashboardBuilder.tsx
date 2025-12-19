import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  LayoutGrid, 
  Plus,
  Save,
  Share2,
  Copy,
  Trash2,
  Settings,
  BarChart3,
  LineChart,
  PieChart,
  Table2,
  Activity,
  AlertTriangle,
  Clock,
  Gauge,
  Map,
  List,
  GripVertical,
  Maximize2,
  Edit,
  Eye,
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

interface Widget {
  id: string;
  type: 'line_chart' | 'bar_chart' | 'pie_chart' | 'metric' | 'table' | 'alert_list' | 'gauge';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { row: number; col: number };
  config: Record<string, unknown>;
}

interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  widgets: number;
  author: string;
  isPublic: boolean;
  createdAt: Date;
}

const sampleWidgets: Widget[] = [
  { id: '1', type: 'line_chart', title: 'Request Rate', size: 'large', position: { row: 0, col: 0 }, config: {} },
  { id: '2', type: 'metric', title: 'Active Users', size: 'small', position: { row: 0, col: 2 }, config: { value: 1234 } },
  { id: '3', type: 'metric', title: 'Error Rate', size: 'small', position: { row: 0, col: 3 }, config: { value: '0.5%' } },
  { id: '4', type: 'bar_chart', title: 'Latency by Service', size: 'medium', position: { row: 1, col: 0 }, config: {} },
  { id: '5', type: 'pie_chart', title: 'Traffic Distribution', size: 'medium', position: { row: 1, col: 2 }, config: {} },
  { id: '6', type: 'alert_list', title: 'Recent Alerts', size: 'large', position: { row: 2, col: 0 }, config: {} },
];

const templates: DashboardTemplate[] = [
  { id: '1', name: 'Infrastructure Overview', description: 'CPU, memory, disk, and network metrics across all services', widgets: 8, author: 'Platform Team', isPublic: true, createdAt: new Date(Date.now() - 2592000000) },
  { id: '2', name: 'Application Performance', description: 'Request rates, latencies, and error tracking', widgets: 12, author: 'SRE Team', isPublic: true, createdAt: new Date(Date.now() - 1296000000) },
  { id: '3', name: 'Cost Analysis', description: 'Cloud spend, budgets, and optimization opportunities', widgets: 6, author: 'FinOps', isPublic: true, createdAt: new Date(Date.now() - 604800000) },
  { id: '4', name: 'Security Monitoring', description: 'Security events, compliance status, and threat detection', widgets: 10, author: 'Security Team', isPublic: false, createdAt: new Date(Date.now() - 259200000) },
  { id: '5', name: 'Database Performance', description: 'Query latencies, connection pools, and replication lag', widgets: 7, author: 'DBA Team', isPublic: true, createdAt: new Date(Date.now() - 86400000) },
];

const widgetTypes = [
  { type: 'line_chart', icon: LineChart, label: 'Line Chart', description: 'Time series data visualization' },
  { type: 'bar_chart', icon: BarChart3, label: 'Bar Chart', description: 'Categorical comparisons' },
  { type: 'pie_chart', icon: PieChart, label: 'Pie Chart', description: 'Distribution breakdown' },
  { type: 'metric', icon: Gauge, label: 'Metric Card', description: 'Single value display' },
  { type: 'table', icon: Table2, label: 'Data Table', description: 'Tabular data view' },
  { type: 'alert_list', icon: AlertTriangle, label: 'Alert List', description: 'Recent alerts feed' },
  { type: 'gauge', icon: Activity, label: 'Gauge', description: 'Progress indicator' },
];

const sampleLineData = {
  labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
  datasets: [{ label: 'Requests/sec', data: [120, 150, 280, 320, 290, 180], borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.4 }],
};

const sampleBarData = {
  labels: ['API', 'Auth', 'Order', 'Payment', 'Search'],
  datasets: [{ label: 'P95 Latency (ms)', data: [45, 32, 85, 120, 65], backgroundColor: 'rgba(59, 130, 246, 0.8)' }],
};

const samplePieData = {
  labels: ['US-East', 'US-West', 'EU', 'Asia'],
  datasets: [{ data: [40, 25, 20, 15], backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(34, 197, 94, 0.8)', 'rgba(251, 191, 36, 0.8)', 'rgba(168, 85, 247, 0.8)'] }],
};

const sampleAlerts = [
  { id: '1', title: 'High CPU on api-gateway', severity: 'warning', time: '5m ago' },
  { id: '2', title: 'Database connection errors', severity: 'critical', time: '12m ago' },
  { id: '3', title: 'Elevated latency in payment-service', severity: 'warning', time: '25m ago' },
];

export default function DashboardBuilder() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgets, setWidgets] = useState(sampleWidgets);
  const [dashboardName, setDashboardName] = useState('My Custom Dashboard');
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'line_chart':
        return <div className="h-full"><Line data={sampleLineData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>;
      case 'bar_chart':
        return <div className="h-full"><Bar data={sampleBarData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>;
      case 'pie_chart':
        return <div className="h-full flex items-center justify-center"><Doughnut data={samplePieData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /></div>;
      case 'metric':
        return (
          <div className="h-full flex flex-col items-center justify-center">
            <p className="text-4xl font-bold">{String(widget.config.value || '0')}</p>
            <p className="text-sm text-muted-foreground mt-1">{widget.title}</p>
          </div>
        );
      case 'alert_list':
        return (
          <div className="space-y-2 p-2">
            {sampleAlerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`} />
                  <span className="text-sm">{alert.title}</span>
                </div>
                <Badge variant="outline" className="text-xs">{alert.time}</Badge>
              </div>
            ))}
          </div>
        );
      default:
        return <div className="h-full flex items-center justify-center text-muted-foreground">Widget Preview</div>;
    }
  };

  const getWidgetSize = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1 row-span-1';
      case 'medium': return 'col-span-2 row-span-1';
      case 'large': return 'col-span-2 row-span-2';
      default: return 'col-span-1 row-span-1';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <LayoutGrid className="h-8 w-8 text-indigo-500" />
            <div>
              {isEditMode ? (
                <Input value={dashboardName} onChange={(e) => setDashboardName(e.target.value)} className="text-2xl font-bold h-auto py-1 px-2" />
              ) : (
                <h1 className="text-3xl font-bold tracking-tight">{dashboardName}</h1>
              )}
              <p className="text-muted-foreground">Drag-and-drop widget placement with shareable templates</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={isEditMode ? 'default' : 'outline'} onClick={() => setIsEditMode(!isEditMode)}>
              {isEditMode ? <><Eye className="h-4 w-4 mr-2" />Preview</> : <><Edit className="h-4 w-4 mr-2" />Edit</>}
            </Button>
            {isEditMode && (
              <>
                <Button variant="outline"><Plus className="h-4 w-4 mr-2" />Add Widget</Button>
                <Button><Save className="h-4 w-4 mr-2" />Save</Button>
              </>
            )}
            <Button variant="outline"><Share2 className="h-4 w-4 mr-2" />Share</Button>
          </div>
        </div>

        <Tabs defaultValue="canvas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="canvas">Dashboard Canvas</TabsTrigger>
            <TabsTrigger value="widgets">Widget Library</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="canvas" className="space-y-4">
            <div className="grid grid-cols-4 gap-4 auto-rows-[200px]">
              {widgets.map((widget) => (
                <Card key={widget.id} className={`${getWidgetSize(widget.size)} ${isEditMode ? 'border-dashed border-2 cursor-move' : ''} ${selectedWidget === widget.id ? 'ring-2 ring-primary' : ''}`} onClick={() => isEditMode && setSelectedWidget(widget.id)}>
                  <CardHeader className="p-3 pb-0 flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
                    {isEditMode && (
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6"><GripVertical className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6"><Maximize2 className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="p-3 h-[calc(100%-48px)]">
                    {renderWidget(widget)}
                  </CardContent>
                </Card>
              ))}
              {isEditMode && (
                <Card className="col-span-1 row-span-1 border-dashed border-2 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="widgets" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {widgetTypes.map((widget) => (
                <Card key={widget.type} className="cursor-pointer hover:border-primary transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-4 rounded-lg bg-muted mb-4">
                        <widget.icon className="h-8 w-8" />
                      </div>
                      <h3 className="font-semibold">{widget.label}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{widget.description}</p>
                      <Button size="sm" className="mt-4"><Plus className="h-4 w-4 mr-2" />Add to Dashboard</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.isPublic ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Public</Badge>
                      ) : (
                        <Badge variant="outline">Private</Badge>
                      )}
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span>{template.widgets} widgets</span>
                      <span>by {template.author}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1"><Copy className="h-4 w-4 mr-2" />Use Template</Button>
                      <Button size="sm" variant="outline"><Eye className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
