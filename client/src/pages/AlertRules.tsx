import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Bell, Plus, Trash2, Edit2, CheckCircle, XCircle, Clock, Zap, Activity, HardDrive, Wifi, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  notifyEmail: boolean;
  notifySlack: boolean;
  cooldownMinutes: number;
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

const metricOptions = [
  { value: 'cpu_usage', label: 'CPU Usage', unit: '%', icon: Activity },
  { value: 'memory_usage', label: 'Memory Usage', unit: '%', icon: HardDrive },
  { value: 'disk_usage', label: 'Disk Usage', unit: '%', icon: HardDrive },
  { value: 'network_in', label: 'Network In', unit: 'MB/s', icon: Wifi },
  { value: 'network_out', label: 'Network Out', unit: 'MB/s', icon: Wifi },
  { value: 'error_rate', label: 'Error Rate', unit: '%', icon: AlertTriangle },
  { value: 'latency_p95', label: 'Latency P95', unit: 'ms', icon: Clock },
  { value: 'latency_p99', label: 'Latency P99', unit: 'ms', icon: Clock },
  { value: 'request_rate', label: 'Request Rate', unit: 'req/s', icon: Zap },
  { value: 'cost_daily', label: 'Daily Cost', unit: '$', icon: DollarSign },
];

const conditionOptions = [
  { value: 'gt', label: 'Greater than', symbol: '>' },
  { value: 'gte', label: 'Greater than or equal', symbol: '≥' },
  { value: 'lt', label: 'Less than', symbol: '<' },
  { value: 'lte', label: 'Less than or equal', symbol: '≤' },
  { value: 'eq', label: 'Equal to', symbol: '=' },
];

const severityOptions = [
  { value: 'info', label: 'Info', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'warning', label: 'Warning', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
];

// Mock initial rules
const initialRules: AlertRule[] = [
  { id: '1', name: 'High CPU Alert', metric: 'cpu_usage', condition: 'gt', threshold: 80, severity: 'warning', enabled: true, notifyEmail: true, notifySlack: true, cooldownMinutes: 5, createdAt: new Date('2024-01-15'), lastTriggered: new Date('2024-01-20'), triggerCount: 12 },
  { id: '2', name: 'Critical Memory', metric: 'memory_usage', condition: 'gt', threshold: 90, severity: 'critical', enabled: true, notifyEmail: true, notifySlack: true, cooldownMinutes: 2, createdAt: new Date('2024-01-10'), lastTriggered: new Date('2024-01-19'), triggerCount: 5 },
  { id: '3', name: 'High Error Rate', metric: 'error_rate', condition: 'gt', threshold: 1, severity: 'critical', enabled: true, notifyEmail: true, notifySlack: false, cooldownMinutes: 1, createdAt: new Date('2024-01-12'), triggerCount: 0 },
  { id: '4', name: 'Slow Response Time', metric: 'latency_p95', condition: 'gt', threshold: 500, severity: 'warning', enabled: false, notifyEmail: false, notifySlack: true, cooldownMinutes: 10, createdAt: new Date('2024-01-08'), triggerCount: 28 },
  { id: '5', name: 'Cost Threshold', metric: 'cost_daily', condition: 'gt', threshold: 1000, severity: 'info', enabled: true, notifyEmail: true, notifySlack: false, cooldownMinutes: 60, createdAt: new Date('2024-01-05'), triggerCount: 3 },
];

export default function AlertRules() {
  const [rules, setRules] = useState<AlertRule[]>(initialRules);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [formData, setFormData] = useState({
    name: '', metric: 'cpu_usage', condition: 'gt' as const, threshold: 80,
    severity: 'warning' as const, notifyEmail: true, notifySlack: false, cooldownMinutes: 5,
  });

  const resetForm = () => {
    setFormData({ name: '', metric: 'cpu_usage', condition: 'gt', threshold: 80, severity: 'warning', notifyEmail: true, notifySlack: false, cooldownMinutes: 5 });
    setEditingRule(null);
  };

  const handleSave = () => {
    if (!formData.name.trim()) { toast.error('Please enter a rule name'); return; }
    if (editingRule) {
      setRules(rules.map(r => r.id === editingRule.id ? { ...r, ...formData } : r));
      toast.success('Alert rule updated');
    } else {
      const newRule: AlertRule = { id: Date.now().toString(), ...formData, enabled: true, createdAt: new Date(), triggerCount: 0 };
      setRules([...rules, newRule]);
      toast.success('Alert rule created');
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (rule: AlertRule) => {
    setEditingRule(rule);
    setFormData({ name: rule.name, metric: rule.metric, condition: rule.condition, threshold: rule.threshold, severity: rule.severity, notifyEmail: rule.notifyEmail, notifySlack: rule.notifySlack, cooldownMinutes: rule.cooldownMinutes });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => { setRules(rules.filter(r => r.id !== id)); toast.success('Alert rule deleted'); };
  const handleToggle = (id: string) => { setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)); };

  const getMetricInfo = (metric: string) => metricOptions.find(m => m.value === metric);
  const getConditionSymbol = (condition: string) => conditionOptions.find(c => c.value === condition)?.symbol || condition;
  const getSeverityStyle = (severity: string) => severityOptions.find(s => s.value === severity)?.color || '';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Custom Alert Rules</h1>
            <p className="text-muted-foreground mt-1">Define and manage threshold-based alerting rules</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Create Rule</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}</DialogTitle>
                <DialogDescription>Configure when and how you want to be alerted</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Rule Name</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., High CPU Alert" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Metric</Label>
                    <Select value={formData.metric} onValueChange={(v) => setFormData({ ...formData, metric: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{metricOptions.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Condition</Label>
                    <Select value={formData.condition} onValueChange={(v: any) => setFormData({ ...formData, condition: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{conditionOptions.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="threshold">Threshold ({getMetricInfo(formData.metric)?.unit})</Label>
                    <Input id="threshold" type="number" value={formData.threshold} onChange={(e) => setFormData({ ...formData, threshold: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Severity</Label>
                    <Select value={formData.severity} onValueChange={(v: any) => setFormData({ ...formData, severity: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{severityOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cooldown">Cooldown (minutes)</Label>
                  <Input id="cooldown" type="number" value={formData.cooldownMinutes} onChange={(e) => setFormData({ ...formData, cooldownMinutes: parseInt(e.target.value) || 1 })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email">Email Notifications</Label>
                  <Switch id="email" checked={formData.notifyEmail} onCheckedChange={(c) => setFormData({ ...formData, notifyEmail: c })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="slack">Slack Notifications</Label>
                  <Switch id="slack" checked={formData.notifySlack} onCheckedChange={(c) => setFormData({ ...formData, notifySlack: c })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancel</Button>
                <Button onClick={handleSave}>{editingRule ? 'Update' : 'Create'} Rule</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Bell className="h-5 w-5 text-blue-600" /></div>
                <div><p className="text-2xl font-bold">{rules.length}</p><p className="text-xs text-muted-foreground">Total Rules</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><CheckCircle className="h-5 w-5 text-green-600" /></div>
                <div><p className="text-2xl font-bold">{rules.filter(r => r.enabled).length}</p><p className="text-xs text-muted-foreground">Active Rules</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
                <div><p className="text-2xl font-bold">{rules.filter(r => r.severity === 'critical').length}</p><p className="text-xs text-muted-foreground">Critical Rules</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30"><Zap className="h-5 w-5 text-purple-600" /></div>
                <div><p className="text-2xl font-bold">{rules.reduce((sum, r) => sum + r.triggerCount, 0)}</p><p className="text-xs text-muted-foreground">Total Triggers</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rules List */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Rules</CardTitle>
            <CardDescription>Manage your custom alerting rules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rules.map((rule) => {
                const metricInfo = getMetricInfo(rule.metric);
                const MetricIcon = metricInfo?.icon || Activity;
                return (
                  <div key={rule.id} className={`p-4 rounded-lg border transition-all ${rule.enabled ? 'bg-card hover:bg-accent/50' : 'bg-muted/50 opacity-60'}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Switch checked={rule.enabled} onCheckedChange={() => handleToggle(rule.id)} />
                        <div className="p-2 rounded-lg bg-primary/10"><MetricIcon className="h-5 w-5 text-primary" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold truncate">{rule.name}</h3>
                            <Badge className={getSeverityStyle(rule.severity)}>{rule.severity}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {metricInfo?.label} {getConditionSymbol(rule.condition)} {rule.threshold}{metricInfo?.unit}
                            <span className="mx-2">•</span>
                            Cooldown: {rule.cooldownMinutes}m
                            {rule.lastTriggered && (<><span className="mx-2">•</span>Last: {rule.lastTriggered.toLocaleDateString()}</>)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{rule.triggerCount} triggers</Badge>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(rule.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {rules.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No alert rules configured</p>
                  <p className="text-sm">Create your first rule to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

