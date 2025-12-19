import { useState, useMemo, useCallback } from 'react';
import { useLocation } from 'wouter';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Bell,
  BellRing,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  X,
  Check,
  CheckCheck,
  Clock,
  Server,
  Database,
  Cpu,
  Network,
  Shield,
  Zap,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Filter,
  Settings,
  Trash2,
} from 'lucide-react';

// Notification types
type NotificationSeverity = 'critical' | 'warning' | 'info' | 'success';
type NotificationCategory = 'infrastructure' | 'security' | 'performance' | 'cost' | 'deployment';

interface Notification {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  category: NotificationCategory;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  source: string;
  groupId?: string;
}

// Mock notifications data
const generateMockNotifications = (): Notification[] => {
  const now = new Date();
  return [
    {
      id: '1',
      title: 'High CPU Usage Alert',
      message: 'order-service pod is experiencing 92% CPU utilization for the past 15 minutes',
      severity: 'critical',
      category: 'infrastructure',
      timestamp: new Date(now.getTime() - 5 * 60000),
      read: false,
      actionUrl: '/dashboard/metrics',
      actionLabel: 'View Metrics',
      source: 'GKE Cluster',
      groupId: 'cpu-alerts',
    },
    {
      id: '2',
      title: 'Database Connection Pool Exhausted',
      message: 'PostgreSQL primary has reached 95% connection pool capacity',
      severity: 'critical',
      category: 'infrastructure',
      timestamp: new Date(now.getTime() - 8 * 60000),
      read: false,
      actionUrl: '/dashboard/metrics',
      actionLabel: 'View Database',
      source: 'Cloud SQL',
      groupId: 'db-alerts',
    },
    {
      id: '3',
      title: 'Unusual Login Pattern Detected',
      message: 'Multiple failed login attempts from IP 203.0.113.42',
      severity: 'warning',
      category: 'security',
      timestamp: new Date(now.getTime() - 12 * 60000),
      read: false,
      actionUrl: '/dashboard/security',
      actionLabel: 'Review Security',
      source: 'Cloud Armor',
    },
    {
      id: '4',
      title: 'API Latency Spike',
      message: 'P99 latency for /api/orders endpoint increased to 850ms',
      severity: 'warning',
      category: 'performance',
      timestamp: new Date(now.getTime() - 18 * 60000),
      read: false,
      actionUrl: '/dashboard/traces',
      actionLabel: 'View Traces',
      source: 'API Gateway',
      groupId: 'latency-alerts',
    },
    {
      id: '5',
      title: 'Cost Anomaly Detected',
      message: 'BigQuery costs increased 45% compared to last week',
      severity: 'warning',
      category: 'cost',
      timestamp: new Date(now.getTime() - 25 * 60000),
      read: true,
      actionUrl: '/dashboard/cost',
      actionLabel: 'View Costs',
      source: 'Cost Management',
    },
    {
      id: '6',
      title: 'Deployment Successful',
      message: 'auth-service v2.4.1 deployed to production successfully',
      severity: 'success',
      category: 'deployment',
      timestamp: new Date(now.getTime() - 35 * 60000),
      read: true,
      actionUrl: '/dashboard/deployments',
      actionLabel: 'View Deployment',
      source: 'Cloud Build',
    },
    {
      id: '7',
      title: 'SSL Certificate Expiring',
      message: 'Certificate for api.example.com expires in 14 days',
      severity: 'info',
      category: 'security',
      timestamp: new Date(now.getTime() - 45 * 60000),
      read: true,
      source: 'Certificate Manager',
    },
    {
      id: '8',
      title: 'Memory Usage Warning',
      message: 'payment-service memory usage at 78%, approaching threshold',
      severity: 'warning',
      category: 'infrastructure',
      timestamp: new Date(now.getTime() - 55 * 60000),
      read: true,
      actionUrl: '/dashboard/metrics',
      actionLabel: 'View Metrics',
      source: 'GKE Cluster',
      groupId: 'memory-alerts',
    },
    {
      id: '9',
      title: 'Auto-scaling Triggered',
      message: 'user-service scaled from 3 to 5 replicas due to increased load',
      severity: 'info',
      category: 'infrastructure',
      timestamp: new Date(now.getTime() - 65 * 60000),
      read: true,
      source: 'GKE Autoscaler',
    },
    {
      id: '10',
      title: 'Backup Completed',
      message: 'Daily backup of production database completed successfully',
      severity: 'success',
      category: 'infrastructure',
      timestamp: new Date(now.getTime() - 120 * 60000),
      read: true,
      source: 'Cloud SQL',
    },
  ];
};

// Helper functions
const getSeverityIcon = (severity: NotificationSeverity) => {
  switch (severity) {
    case 'critical': return AlertCircle;
    case 'warning': return AlertTriangle;
    case 'info': return Info;
    case 'success': return CheckCircle2;
  }
};

const getSeverityColor = (severity: NotificationSeverity) => {
  switch (severity) {
    case 'critical': return { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500/30', bgLight: 'bg-red-500/10' };
    case 'warning': return { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500/30', bgLight: 'bg-amber-500/10' };
    case 'info': return { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500/30', bgLight: 'bg-blue-500/10' };
    case 'success': return { bg: 'bg-green-500', text: 'text-green-500', border: 'border-green-500/30', bgLight: 'bg-green-500/10' };
  }
};

const getCategoryIcon = (category: NotificationCategory) => {
  switch (category) {
    case 'infrastructure': return Server;
    case 'security': return Shield;
    case 'performance': return Zap;
    case 'cost': return TrendingUp;
    case 'deployment': return Network;
  }
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

// Notification Item Component
function NotificationItem({
  notification,
  onMarkRead,
  onDismiss,
  onNavigate
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onNavigate: (url: string) => void;
}) {
  const SeverityIcon = getSeverityIcon(notification.severity);
  const colors = getSeverityColor(notification.severity);
  const CategoryIcon = getCategoryIcon(notification.category);

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all hover:shadow-md group",
        notification.read ? "bg-muted/30 border-border" : `${colors.bgLight} ${colors.border}`,
      )}
    >
      <div className="flex gap-3">
        <div className={cn("p-2 rounded-lg shrink-0 h-fit", colors.bgLight)}>
          <SeverityIcon className={cn("h-4 w-4", colors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className={cn("font-medium text-sm truncate", !notification.read && "font-semibold")}>
                {notification.title}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {notification.message}
              </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.read && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMarkRead(notification.id)}>
                        <Check className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Mark as read</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDismiss(notification.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Dismiss</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CategoryIcon className="h-3 w-3" />
              <span>{notification.source}</span>
              <span>•</span>
              <Clock className="h-3 w-3" />
              <span>{formatTimeAgo(notification.timestamp)}</span>
            </div>
            {notification.actionUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => onNavigate(notification.actionUrl!)}
              >
                {notification.actionLabel || 'View'}
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Grouped Notifications Component
function GroupedNotifications({
  notifications,
  groupId,
  onMarkRead,
  onDismiss,
  onNavigate
}: {
  notifications: Notification[];
  groupId: string;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onNavigate: (url: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const firstNotification = notifications[0];
  const colors = getSeverityColor(firstNotification.severity);
  const SeverityIcon = getSeverityIcon(firstNotification.severity);

  if (notifications.length === 1) {
    return <NotificationItem notification={firstNotification} onMarkRead={onMarkRead} onDismiss={onDismiss} onNavigate={onNavigate} />;
  }

  return (
    <div className={cn("rounded-lg border", colors.border, colors.bgLight)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center gap-3 text-left hover:bg-muted/50 rounded-lg transition-colors"
      >
        <div className={cn("p-2 rounded-lg shrink-0", colors.bgLight)}>
          <SeverityIcon className={cn("h-4 w-4", colors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">{notifications.length} similar alerts</h4>
          <p className="text-xs text-muted-foreground truncate">{firstNotification.title}</p>
        </div>
        <Badge variant="secondary" className="shrink-0">{notifications.length}</Badge>
        <ChevronRight className={cn("h-4 w-4 transition-transform", expanded && "rotate-90")} />
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {notifications.map(n => (
            <NotificationItem key={n.id} notification={n} onMarkRead={onMarkRead} onDismiss={onDismiss} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

// Main NotificationCenter Component
export function NotificationCenter() {
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(generateMockNotifications);
  const [activeTab, setActiveTab] = useState('all');

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const criticalCount = useMemo(() => notifications.filter(n => n.severity === 'critical' && !n.read).length, [notifications]);

  const handleMarkRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleClearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const handleNavigate = useCallback((url: string) => {
    setIsOpen(false);
    navigate(url);
  }, [navigate]);

  // Filter and group notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;
    if (activeTab === 'unread') {
      filtered = notifications.filter(n => !n.read);
    } else if (activeTab !== 'all') {
      filtered = notifications.filter(n => n.category === activeTab);
    }
    return filtered;
  }, [notifications, activeTab]);

  // Group notifications by groupId
  const groupedNotifications = useMemo(() => {
    const groups: Map<string, Notification[]> = new Map();
    const ungrouped: Notification[] = [];

    filteredNotifications.forEach(n => {
      if (n.groupId) {
        const existing = groups.get(n.groupId) || [];
        groups.set(n.groupId, [...existing, n]);
      } else {
        ungrouped.push(n);
      }
    });

    return { groups, ungrouped };
  }, [filteredNotifications]);

  return (
    <>
      {/* Notification Bell Trigger */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
              onClick={() => setIsOpen(true)}
            >
              {unreadCount > 0 ? (
                <BellRing className={cn("h-5 w-5", criticalCount > 0 && "text-red-500 animate-pulse")} />
              ) : (
                <Bell className="h-5 w-5 text-muted-foreground" />
              )}
              {unreadCount > 0 && (
                <span className={cn(
                  "absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white",
                  criticalCount > 0 ? "bg-red-500" : "bg-primary"
                )}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'No new notifications'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Notification Panel */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="p-4 pb-2 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SheetTitle className="flex items-center gap-2">
                  <BellRing className="h-5 w-5 text-primary" />
                  Notifications
                </SheetTitle>
                {unreadCount > 0 && (
                  <Badge variant="secondary">{unreadCount} new</Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Mark all as read</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClearAll} disabled={notifications.length === 0}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Clear all</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <SheetDescription className="sr-only">View and manage your notifications</SheetDescription>
          </SheetHeader>

          {/* Category Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-4 pt-2">
              <TabsList className="w-full grid grid-cols-4 h-8">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </TabsTrigger>
                <TabsTrigger value="infrastructure" className="text-xs">Infra</TabsTrigger>
                <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="flex-1 mt-0">
              <ScrollArea className="h-[calc(100vh-180px)]">
                <div className="p-4 space-y-3">
                  {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="p-4 rounded-full bg-muted mb-4">
                        <Bell className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium">No notifications</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activeTab === 'unread' ? "You're all caught up!" : "No notifications in this category"}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Render grouped notifications */}
                      {Array.from(groupedNotifications.groups.entries()).map(([groupId, groupNotifs]) => (
                        <GroupedNotifications
                          key={groupId}
                          notifications={groupNotifs}
                          groupId={groupId}
                          onMarkRead={handleMarkRead}
                          onDismiss={handleDismiss}
                          onNavigate={handleNavigate}
                        />
                      ))}
                      {/* Render ungrouped notifications */}
                      {groupedNotifications.ungrouped.map(notification => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkRead={handleMarkRead}
                          onDismiss={handleDismiss}
                          onNavigate={handleNavigate}
                        />
                      ))}
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="p-4 border-t">
            <Button variant="outline" className="w-full" onClick={() => handleNavigate('/dashboard/alerts')}>
              <Settings className="h-4 w-4 mr-2" />
              Manage Alert Settings
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
