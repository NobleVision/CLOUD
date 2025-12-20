import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/useMobile";
import { useTheme } from "@/contexts/ThemeContext";
import { ChatAssistant } from "@/components/ChatAssistant";
import { NotificationCenter } from "@/components/NotificationCenter";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Activity,
  FileText,
  GitBranch,
  Bell,
  BellRing,
  DollarSign,
  TrendingUp,
  Settings,
  Server,
  Sun,
  Moon,
  Link2,
  Sparkles,
  Shield,
  ShieldAlert,
  Layers,
  Network,
  Flame,
  Share2,
  Presentation,
  GitCompare,
  Gauge,
  Target,
  Tag,
  ShieldCheck,
  Building2,
  BookOpen,
  Zap,
  LayoutGrid,
  GitMerge,
  Brain,
  PieChart,
  FolderTree,
  ChevronRight,
  Eye,
  AlertTriangle,
  Cpu,
  BarChart3,
  Wrench,
  LucideIcon,
  Database,
  Loader2,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Types for menu structure
interface MenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: MenuItem[];
}

// Standalone items (always visible at top level)
const standaloneItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
];

// Grouped menu items by category
const menuGroups: MenuGroup[] = [
  {
    id: "observability",
    label: "Observability",
    icon: Eye,
    items: [
      { icon: Activity, label: "Metrics", path: "/dashboard/metrics" },
      { icon: FileText, label: "Logs", path: "/dashboard/logs" },
      { icon: GitBranch, label: "Traces", path: "/dashboard/traces" },
    ],
  },
  {
    id: "alerts",
    label: "Alerts & Incidents",
    icon: AlertTriangle,
    items: [
      { icon: Bell, label: "Alerts", path: "/dashboard/alerts" },
      { icon: BellRing, label: "Alert Rules", path: "/dashboard/alert-rules" },
      { icon: Flame, label: "Incidents", path: "/dashboard/incidents" },
    ],
  },
  {
    id: "network",
    label: "Network & Security",
    icon: Network,
    items: [
      { icon: Network, label: "Network Analysis", path: "/dashboard/network" },
      { icon: Server, label: "Subnets", path: "/dashboard/subnets" },
      { icon: PieChart, label: "Subnet Utilization", path: "/dashboard/subnet-utilization" },
      { icon: Share2, label: "Topology", path: "/dashboard/topology" },
      { icon: ShieldAlert, label: "Firewall", path: "/dashboard/firewall" },
      { icon: Brain, label: "AI Firewall Diagnostics", path: "/dashboard/ai-firewall-diagnostics" },
    ],
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    icon: Cpu,
    items: [
      { icon: Layers, label: "Drill-Down", path: "/dashboard/drill-down" },
      { icon: FolderTree, label: "Infrastructure Hierarchy", path: "/dashboard/infrastructure-hierarchy" },
    ],
  },
  {
    id: "analytics",
    label: "Analytics & AI",
    icon: BarChart3,
    items: [
      { icon: Presentation, label: "Executive Summary", path: "/dashboard/executive-summary" },
      { icon: GitCompare, label: "Comparison", path: "/dashboard/comparison" },
      { icon: Link2, label: "Correlation", path: "/dashboard/correlation" },
      { icon: Sparkles, label: "Root Cause", path: "/dashboard/root-cause" },
      { icon: TrendingUp, label: "Analytics", path: "/dashboard/analytics" },
      { icon: GitMerge, label: "Correlation Engine", path: "/dashboard/correlation-engine" },
    ],
  },
  {
    id: "cost",
    label: "Cost Management",
    icon: DollarSign,
    items: [
      { icon: DollarSign, label: "Cost Optimization", path: "/dashboard/cost-optimization" },
      { icon: Building2, label: "Cost Chargeback", path: "/dashboard/cost-chargeback" },
      { icon: Tag, label: "Resource Tagging", path: "/dashboard/resource-tagging" },
    ],
  },
  {
    id: "operations",
    label: "Operations & SRE",
    icon: Wrench,
    items: [
      { icon: Gauge, label: "API Health", path: "/dashboard/api-health" },
      { icon: Target, label: "SRE Workbench", path: "/dashboard/sre-workbench" },
      { icon: TrendingUp, label: "Capacity Planning", path: "/dashboard/capacity-planning" },
      { icon: Shield, label: "SLA Tracking", path: "/dashboard/sla-tracking" },
      { icon: ShieldCheck, label: "Compliance", path: "/dashboard/compliance" },
      { icon: BookOpen, label: "Runbooks", path: "/dashboard/runbooks" },
      { icon: Zap, label: "Chaos Engineering", path: "/dashboard/chaos-engineering" },
    ],
  },
  {
    id: "settings",
    label: "Settings & Tools",
    icon: Settings,
    items: [
      { icon: LayoutGrid, label: "Dashboard Builder", path: "/dashboard/dashboard-builder" },
      { icon: Settings, label: "Settings", path: "/dashboard/settings" },
    ],
  },
];

// Flatten all items for active page lookup
const allMenuItems = [
  ...standaloneItems,
  ...menuGroups.flatMap(group => group.items),
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const EXPANDED_GROUPS_KEY = "nav-expanded-groups";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

// Admin Actions Dropdown Component
function AdminActionsDropdown() {
  const seedMutation = trpc.mockData.seedAll.useMutation({
    onSuccess: () => {
      toast.success("Mock data seeded successfully!", {
        description: "The database has been populated with sample data.",
      });
    },
    onError: (error) => {
      toast.error("Failed to seed mock data", {
        description: error.message,
      });
    },
  });

  const handleSeedData = () => {
    seedMutation.mutate();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
          aria-label="Admin actions"
        >
          <Database className="h-5 w-5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={handleSeedData}
          disabled={seedMutation.isPending}
          className="cursor-pointer"
        >
          {seedMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Database className="mr-2 h-4 w-4" />
          )}
          <span>{seedMutation.isPending ? "Seeding..." : "Seed Mock Data"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });

  // Check for demo user session
  const demoUser = JSON.parse(localStorage.getItem('demo_user') || '{}');
  const [, setLocation] = useLocation();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  // Redirect to login if no demo user
  useEffect(() => {
    if (!demoUser.username) {
      setLocation('/login');
    }
  }, [demoUser.username, setLocation]);

  if (!demoUser.username) {
    return null;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth} demoUser={demoUser}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
  demoUser: any;
};

// Navigation Group Component with collapsible functionality
function NavGroup({
  group,
  location,
  setLocation,
  isExpanded,
  onToggle,
  index,
  isCollapsed,
}: {
  group: MenuGroup;
  location: string;
  setLocation: (path: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
  isCollapsed: boolean;
}) {
  const hasActiveChild = group.items.some(
    item => location === item.path || (item.path !== '/dashboard' && location.startsWith(item.path))
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.2,
        delay: index * 0.03,
        ease: [0.25, 0.1, 0.25, 1]
      }}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <motion.button
            whileHover={{ x: isCollapsed ? 0 : 4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={`
              flex items-center w-full gap-2 px-2 h-10 rounded-lg text-sm font-medium
              transition-colors cursor-pointer
              ${hasActiveChild 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
              }
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? group.label : undefined}
          >
            <group.icon className={`h-4 w-4 shrink-0 ${hasActiveChild ? 'text-primary' : ''}`} />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left truncate">{group.label}</span>
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </>
            )}
          </motion.button>
        </CollapsibleTrigger>
        
        {!isCollapsed && (
          <CollapsibleContent>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  className="overflow-hidden"
                >
                  <div className="ml-2 pl-2 border-l border-border/50 mt-1 space-y-0.5">
                    {group.items.map((item, itemIndex) => {
                      const isActive = location === item.path || (item.path !== '/dashboard' && location.startsWith(item.path));
                      return (
                        <motion.div
                          key={item.path}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.15,
                            delay: itemIndex * 0.02,
                            ease: [0.25, 0.1, 0.25, 1]
                          }}
                        >
                          <SidebarMenuItem>
                            <motion.div
                              whileHover={{ x: 4 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.15 }}
                            >
                              <SidebarMenuButton
                                isActive={isActive}
                                onClick={() => setLocation(item.path)}
                                tooltip={item.label}
                                className="h-9 text-sm"
                              >
                                <motion.div
                                  animate={isActive ? { rotate: [0, -10, 10, 0] } : {}}
                                  transition={{ duration: 0.3 }}
                                >
                                  <item.icon
                                    className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                                  />
                                </motion.div>
                                <span className="truncate">{item.label}</span>
                              </SidebarMenuButton>
                            </motion.div>
                          </SidebarMenuItem>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CollapsibleContent>
        )}
      </Collapsible>
    </motion.div>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
  demoUser,
}: DashboardLayoutContentProps) {
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Find active menu item from all items
  const activeMenuItem = allMenuItems.find(item => 
    item.path === location || (item.path !== '/dashboard' && location.startsWith(item.path))
  );

  // Find which group contains the active path
  const activeGroupId = useMemo(() => {
    for (const group of menuGroups) {
      if (group.items.some(item => 
        location === item.path || (item.path !== '/dashboard' && location.startsWith(item.path))
      )) {
        return group.id;
      }
    }
    return null;
  }, [location]);

  // Initialize expanded groups from localStorage or auto-expand active group
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(EXPANDED_GROUPS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const groups = new Set<string>(parsed);
        // Also expand the active group if not already expanded
        if (activeGroupId) {
          groups.add(activeGroupId);
        }
        return groups;
      } catch {
        return activeGroupId ? new Set([activeGroupId]) : new Set();
      }
    }
    return activeGroupId ? new Set([activeGroupId]) : new Set();
  });

  // Auto-expand group when navigating to a new page
  useEffect(() => {
    if (activeGroupId && !expandedGroups.has(activeGroupId)) {
      setExpandedGroups(prev => {
        const arr = Array.from(prev);
        arr.push(activeGroupId);
        return new Set(arr);
      });
    }
  }, [activeGroupId]);

  // Persist expanded groups to localStorage
  useEffect(() => {
    localStorage.setItem(EXPANDED_GROUPS_KEY, JSON.stringify(Array.from(expandedGroups)));
  }, [expandedGroups]);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('demo_user');
    setLocation('/login');
  };

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="font-semibold tracking-tight truncate">
                    ADP Ops
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1 space-y-0.5">
              {/* Standalone items (Overview) */}
              {standaloneItems.map((item, index) => {
                const isActive = location === item.path;
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: index * 0.02,
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                  >
                    <SidebarMenuItem>
                      <motion.div
                        whileHover={{ x: isCollapsed ? 0 : 4 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                      >
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className="h-10 transition-all font-normal"
                        >
                          <motion.div
                            animate={isActive ? { rotate: [0, -10, 10, 0] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            <item.icon
                              className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                            />
                          </motion.div>
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </motion.div>
                    </SidebarMenuItem>
                  </motion.div>
                );
              })}

              {/* Divider */}
              {!isCollapsed && (
                <div className="my-2 mx-2 border-t border-border/50" />
              )}

              {/* Grouped menu items */}
              {menuGroups.map((group, groupIndex) => (
                <NavGroup
                  key={group.id}
                  group={group}
                  location={location}
                  setLocation={setLocation}
                  isExpanded={expandedGroups.has(group.id)}
                  onToggle={() => toggleGroup(group.id)}
                  index={groupIndex + standaloneItems.length}
                  isCollapsed={isCollapsed}
                />
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 space-y-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-muted-foreground shrink-0" />
              ) : (
                <Sun className="h-5 w-5 text-yellow-500 shrink-0" />
              )}
              <span className="text-sm group-data-[collapsible=icon]:hidden">
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
                      {demoUser.name?.charAt(0).toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {demoUser.name || "Admin"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {demoUser.role || "admin"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={toggleTheme}
                  className="cursor-pointer"
                >
                  {theme === 'light' ? (
                    <Moon className="mr-2 h-4 w-4" />
                  ) : (
                    <Sun className="mr-2 h-4 w-4" />
                  )}
                  <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Header bar with notifications */}
        <div className="flex border-b h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-2">
            {isMobile && <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />}
            <div className="flex items-center gap-3">
              <span className="tracking-tight text-foreground font-medium">
                {activeMenuItem?.label ?? "Dashboard"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Admin Actions Dropdown */}
            <AdminActionsDropdown />
            {/* Notification Center */}
            <NotificationCenter />
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-yellow-500" />
              )}
            </button>
          </div>
        </div>
        <main className="flex-1 p-4 lg:p-6">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </SidebarInset>

      {/* AI Chat Assistant */}
      <ChatAssistant />
    </>
  );
}
