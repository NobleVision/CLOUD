import { useRoute } from 'wouter';
import Dashboard from './Dashboard';
import Metrics from './Metrics';
import Logs from './Logs';
import Alerts from './Alerts';
import Environments from './Environments';
import Analytics from './Analytics';
import AlertRules from './AlertRules';
import Correlation from './Correlation';
import RootCause from './RootCause';
import CostOptimization from './CostOptimization';
import SLATracking from './SLATracking';
import DrillDownMetrics from './DrillDownMetrics';
import NetworkAnalysis from './NetworkAnalysis';
import SubnetMonitoring from './SubnetMonitoring';
import IncidentTimeline from './IncidentTimeline';
import TopologyMap from './TopologyMap';
import ExecutiveSummary from './ExecutiveSummary';
import ComparisonMode from './ComparisonMode';
import NotFound from './NotFound';
// Priority 3 Feature Pages
import APIHealthMonitor from './APIHealthMonitor';
import SREWorkbench from './SREWorkbench';
import CapacityPlanning from './CapacityPlanning';
import ResourceTagging from './ResourceTagging';
import Compliance from './Compliance';
import CostChargeback from './CostChargeback';
import Runbooks from './Runbooks';
import ChaosEngineering from './ChaosEngineering';
import DashboardBuilder from './DashboardBuilder';
import CorrelationEngine from './CorrelationEngine';
import FirewallDashboard from './FirewallDashboard';
// New AI-Powered Features (December 2025)
import AIFirewallDiagnostics from './AIFirewallDiagnostics';
import SubnetUtilization from './SubnetUtilization';
import InfrastructureHierarchy from './InfrastructureHierarchy';

/**
 * Router for dashboard sub-pages
 */
export default function DashboardRouter() {
  const [, params] = useRoute('/dashboard/:page');

  if (!params) {
    return <Dashboard />;
  }

  switch (params.page) {
    case 'metrics':
      return <Metrics />;
    case 'logs':
      return <Logs />;
    case 'alerts':
      return <Alerts />;
    case 'alert-rules':
      return <AlertRules />;
    case 'correlation':
      return <Correlation />;
    case 'root-cause':
      return <RootCause />;
    case 'cost-optimization':
      return <CostOptimization />;
    case 'sla-tracking':
      return <SLATracking />;
    case 'drill-down':
      return <DrillDownMetrics />;
    case 'network':
      return <NetworkAnalysis />;
    case 'subnets':
      return <SubnetMonitoring />;
    case 'environments':
      return <Environments />;
    case 'analytics':
      return <Analytics />;
    case 'incidents':
      return <IncidentTimeline />;
    case 'topology':
      return <TopologyMap />;
    case 'executive-summary':
      return <ExecutiveSummary />;
    case 'comparison':
      return <ComparisonMode />;
    // Priority 3 Features
    case 'api-health':
      return <APIHealthMonitor />;
    case 'sre-workbench':
      return <SREWorkbench />;
    case 'capacity-planning':
      return <CapacityPlanning />;
    case 'resource-tagging':
      return <ResourceTagging />;
    case 'compliance':
      return <Compliance />;
    case 'cost-chargeback':
      return <CostChargeback />;
    case 'runbooks':
      return <Runbooks />;
    case 'chaos-engineering':
      return <ChaosEngineering />;
    case 'dashboard-builder':
      return <DashboardBuilder />;
    case 'correlation-engine':
      return <CorrelationEngine />;
    case 'firewall':
      return <FirewallDashboard />;
    // New AI-Powered Features (December 2025)
    case 'ai-firewall-diagnostics':
      return <AIFirewallDiagnostics />;
    case 'subnet-utilization':
      return <SubnetUtilization />;
    case 'infrastructure-hierarchy':
      return <InfrastructureHierarchy />;
    case 'traces':
    case 'costs':
    case 'settings':
      // Placeholder for future pages
      return <Dashboard />;
    default:
      return <NotFound />;
  }
}
