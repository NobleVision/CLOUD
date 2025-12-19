# ADP GCP Observability Dashboard

A comprehensive, full-stack observability platform for monitoring Google Cloud Platform infrastructure with ADP branding, advanced AI-powered analytics, and professional design.

![Dashboard Preview](https://img.shields.io/badge/Status-Demo%20Ready-brightgreen) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## 🚀 Features Overview

### Core Dashboards
| Dashboard | Route | Description |
|-----------|-------|-------------|
| **Overview** | `/dashboard` | Executive summary with 70% threshold alerts, Notable Events, Service Health Status |
| **Executive Summary** | `/dashboard/executive-summary` | One-click presentation-ready briefing with PDF export |
| **Comparison Mode** | `/dashboard/comparison` | Side-by-side analysis for time periods and environments |
| **Metrics** | `/dashboard/metrics` | Real-time metrics with anomaly detection and predictive alerting |
| **Drill-Down** | `/dashboard/drill-down` | 3-level hierarchical navigation (Infrastructure → Projects → Resources) |
| **Network** | `/dashboard/network` | Top talkers, bandwidth analysis, NCC connectivity monitoring, **AI-Powered Search & Insights** |
| **Subnets** | `/dashboard/subnets` | IP utilization, subnet health, capacity planning alerts, **AI-Powered Search & Insights** |
| **Logs** | `/dashboard/logs` | NLP-powered log search with AI query parsing, **AI-Powered Search & Insights** |
| **Alerts** | `/dashboard/alerts` | Active alert management with acknowledge/resolve workflows |
| **Alert Rules** | `/dashboard/alert-rules` | Custom threshold-based alerting rules CRUD interface |
| **Incidents** | `/dashboard/incidents` | Visual incident timeline with blast radius visualization |
| **Topology** | `/dashboard/topology` | Live interactive network topology map with multiple layouts |
| **Correlation** | `/dashboard/correlation` | Metric relationship analysis with scatter plots and correlation matrix |
| **Root Cause** | `/dashboard/root-cause` | AI-powered anomaly investigation with confidence scores |
| **Cost Optimization** | `/dashboard/cost-optimization` | Usage analysis with actionable cost-saving recommendations |
| **SLA Tracking** | `/dashboard/sla-tracking` | Service level agreement monitoring with uptime metrics |
| **Analytics** | `/dashboard/analytics` | Grafana-style dashboard with KPIs, heatmaps, and trend analysis |
| **Environments** | `/dashboard/environments` | Multi-environment project monitoring (dev/staging/prod) |
| **Firewall** | `/dashboard/firewall` | 🔥 GCP Firewall rule monitoring with interactive topology map |

### 🌟 Priority 3 Advanced Dashboards
| Dashboard | Route | Description |
|-----------|-------|-------------|
| **API Health Monitor** | `/dashboard/api-health` | Endpoint-level latency, error rates, SLA tracking with OpenAPI integration |
| **SRE Workbench** | `/dashboard/sre-workbench` | Error budget tracking, incident postmortems, reliability scorecards |
| **Capacity Planning** | `/dashboard/capacity-planning` | ML-based resource usage predictions with proactive scaling recommendations |
| **Resource Tagging** | `/dashboard/resource-tagging` | Tag compliance scoring, missing tag detection, policy enforcement |
| **Compliance** | `/dashboard/compliance` | SOC2/HIPAA/PCI-DSS compliance monitoring with automated audit reports |
| **Cost Chargeback** | `/dashboard/cost-chargeback` | Department/team-level cost allocation with showback reports and budget alerts |
| **Runbooks** | `/dashboard/runbooks` | One-click remediation actions with pre-defined runbooks for common issues |
| **Chaos Engineering** | `/dashboard/chaos-engineering` | Controlled failure injection with resilience scoring and recovery metrics |
| **Dashboard Builder** | `/dashboard/dashboard-builder` | Drag-and-drop widget placement with shareable dashboard templates |
| **Correlation Engine** | `/dashboard/correlation-engine` | Cross-service anomaly correlation using graph-based dependency analysis |

---

## ✨ Feature Highlights

### 🔍 AI-Powered NLP Search
Natural language query parsing available across multiple dashboards. See the comprehensive [AI-Powered Features](#-ai-powered-features) section below for complete documentation.

**Quick Examples:**
- Logs: "Show me errors from the last hour"
- Subnets: "Find production subnets with high utilization"
- Network: "Show external connections trending up"

### 📊 Anomaly Detection
Statistical anomaly detection using z-score methodology:
- Calculates mean, standard deviation, and moving averages
- Highlights anomalies on charts with colored indicators
- Configurable threshold sensitivity (default: 2σ)

### 📈 Trend Analysis & Predictive Alerting
- Linear regression-based trend forecasting
- Automatic alerts when metrics approach thresholds (70%, 80%, 90%)
- Predicted peak values and time-to-threshold calculations

### 🌐 Network Connectivity Center (NCC) Monitoring
- VPN tunnel status and latency
- Cloud Interconnect utilization
- Cross-cloud peering connections
- Packet loss and bandwidth metrics

### 🔄 Real-Time Updates
- WebSocket-based live data streaming
- 3-second update intervals
- Connection status indicator
- Automatic reconnection handling

### 📤 Export Capabilities
- PDF report generation with charts
- CSV data export
- JSON format for API integration
- Chart image download (PNG)

### 🌙 Dark Mode
- System preference detection
- Manual toggle in header
- Persisted preference in localStorage

---

## 🤖 AI-Powered Features

The observability platform includes advanced AI-powered capabilities across multiple dashboards, providing intelligent search, pattern analysis, and actionable recommendations.

### AI-Powered Search

Natural language query parsing is available in three dashboards, allowing users to search using conversational queries instead of complex filter combinations.

#### Logs Dashboard (`/dashboard/logs`)

| Feature | Description |
|---------|-------------|
| **Query Input** | Free-form text input for natural language queries |
| **Query Interpretation** | Visual display of how the query was parsed |
| **Auto-Scroll** | Automatically scrolls to log results after search |
| **Toggle Mode** | Enable/disable AI search mode with one click |

**Supported Query Patterns:**
- **Severity:** "Show errors", "Find warnings", "Critical logs only"
- **Time Range:** "Last hour", "Past 24 hours", "Last 7 days"
- **Environment:** "Production logs", "Staging errors", "Development warnings"
- **Keywords:** "Authentication failures", "Database timeout", "API errors"
- **Resources:** "GCE instances", "Cloud Functions", "App Engine"

**Example Queries:**
```
"Show me errors from the last hour"
"Find all warnings related to authentication"
"Display critical logs from production"
"Database connection errors in the last 24 hours"
```

#### Subnet Monitoring Dashboard (`/dashboard/subnets`)

| Feature | Description |
|---------|-------------|
| **Query Input** | Natural language search for subnet data |
| **Query Interpretation** | Shows parsed filters (status, VPC, region, utilization) |
| **Auto-Scroll** | Scrolls to subnet details after search |
| **Quick Examples** | One-click example query buttons |

**Supported Query Patterns:**
- **Status:** "Critical subnets", "Warning status", "Healthy subnets"
- **Purpose:** "GKE subnets", "Production VMs", "Database pools"
- **VPC:** "Production VPC", "Shared services", "Management network"
- **Region:** "us-central1", "us-east4", "europe-west1"
- **Utilization:** "High utilization", "Above 80%", "Capacity issues"

**Example Queries:**
```
"Show critical subnets"
"Find production subnets with high utilization"
"GKE pods subnet capacity"
"Subnets in us-central1"
```

#### Network Analysis Dashboard (`/dashboard/network`)

| Feature | Description |
|---------|-------------|
| **Query Input** | Search across endpoints and NCC connections |
| **Query Interpretation** | Displays parsed type, status, trend, traffic filters |
| **Smart Auto-Scroll** | Scrolls to relevant section (Top Talkers or NCC) based on query |
| **Match Badges** | Shows "X of Y match" when filtering |

**Supported Query Patterns:**
- **Entity Types:** "VMs", "Services", "External connections"
- **Connection Types:** "VPN tunnels", "Interconnect", "Peering"
- **Status:** "Active connections", "Degraded", "Down"
- **Trends:** "Trending up", "Decreasing traffic", "Stable"
- **Traffic:** "High bandwidth", "Top talkers", ">2000 MB"

**Example Queries:**
```
"Show external connections"
"Find VPN with degraded status"
"High traffic services"
"Top talkers trending up"
```

---

### AI Insights

Each dashboard features an AI Insights panel that provides intelligent analysis of the current data, including pattern detection, correlations, root causes, and actionable recommendations.

#### AI Log Insights (`/dashboard/logs`)

| Analysis Type | Description |
|---------------|-------------|
| **Pattern Detection** | Identifies recurring error patterns, error spikes, and anomalous log volumes |
| **Correlated Events** | Groups related log entries across services and time windows |
| **Root Causes** | AI-generated hypotheses for issue sources with confidence scores |
| **Recommendations** | Prioritized remediation actions with impact and effort estimates |

**Detected Patterns Include:**
- Error concentration by severity and service
- Authentication failure spikes
- Database connectivity issues
- Resource exhaustion warnings
- Deployment-related log patterns

#### AI Subnet Insights (`/dashboard/subnets`)

| Analysis Type | Description |
|---------------|-------------|
| **Pattern Detection** | Identifies critical utilization, growth trends, production environment load |
| **Correlated Events** | Links high utilization to IP exhaustion risk, GKE scaling to subnet pressure |
| **Root Causes** | Identifies capacity constraints, misconfigured allocations, rapid growth |
| **Recommendations** | Suggests subnet expansion, CIDR optimization, capacity monitoring |

**Detected Patterns Include:**
- Subnets approaching IP exhaustion
- Uneven utilization across VPCs
- Production vs non-production capacity imbalance
- Growth trajectory analysis

#### AI Network Insights (`/dashboard/network`)

| Analysis Type | Description |
|---------------|-------------|
| **Pattern Detection** | Detects traffic growth, external traffic flow, high utilization links |
| **Correlated Events** | Links latency spikes to degradation, traffic growth to link saturation |
| **Root Causes** | Identifies specific degraded connections, bandwidth constraints |
| **Recommendations** | Suggests bandwidth upgrades, traffic shaping, monitoring improvements |

**Detected Patterns Include:**
- Multiple endpoints with increasing traffic
- VPN tunnel performance degradation
- Link capacity approaching saturation
- External traffic security considerations

---

### How AI Features Work

#### Query Interpretation Process

![Query Interpretation Process](docs/images/query-interpretation-process.png)

*Diagram source available in [docs/mermaid/mermaid-diagrams.md](docs/mermaid/mermaid-diagrams.md#1-query-interpretation-process)*

1. **User Input:** Enter a natural language query in the search box
2. **NLP Parsing:** The query is analyzed to extract filters (severity, time, keywords, etc.)
3. **Interpretation Display:** A visual breakdown shows how the query was understood
4. **Data Filtering:** Results are filtered based on extracted criteria
5. **Auto-Scroll:** The page automatically scrolls to show the filtered results

#### AI Insights Generation

![AI Insights Generation](docs/images/ai-insights-generation.png)

*Diagram source available in [docs/mermaid/mermaid-diagrams.md](docs/mermaid/mermaid-diagrams.md#2-ai-insights-generation)*

1. **Click "Generate Insights"** to trigger AI analysis
2. **Pattern Analysis:** Scans data for recurring patterns and anomalies
3. **Correlation Detection:** Identifies relationships between events
4. **Root Cause Analysis:** Generates hypotheses with confidence scores
5. **Recommendations:** Provides prioritized actions with impact/effort estimates
6. **Processing Time:** Displays analysis duration in milliseconds

---

### AI Features Summary

| Dashboard | AI Search | AI Insights | Auto-Scroll | Query Examples |
|-----------|-----------|-------------|-------------|----------------|
| **Logs** | ✅ | ✅ | ✅ | Severity, time, environment, keywords |
| **Subnets** | ✅ | ✅ | ✅ | Status, VPC, region, utilization |
| **Network** | ✅ | ✅ | ✅ | Type, connection, status, traffic |

All AI features use the same consistent UI patterns:
- **Toggle Button:** Enable/disable AI search mode
- **Gradient Card Design:** Visual distinction for AI panels
- **Processing Indicators:** Shows "Analyzing..." state during insights generation
- **Match Count Badges:** Displays filtered results count
- **Sparkles Icon:** Indicates AI-powered functionality

---

## 🌟 Wow Factor Features

### 🤖 AI Insights & Search (Multi-Dashboard)
**Routes:** `/dashboard/logs`, `/dashboard/subnets`, `/dashboard/network`

AI-powered analysis and natural language search available across three key dashboards. Each dashboard features:

| Feature | Logs | Subnets | Network |
|---------|------|---------|---------|
| **AI Search** | ✅ Severity, time, keywords | ✅ Status, VPC, utilization | ✅ Type, status, traffic |
| **Pattern Detection** | ✅ Error patterns | ✅ Capacity trends | ✅ Traffic growth |
| **Correlations** | ✅ Cross-service events | ✅ IP exhaustion risk | ✅ Latency impacts |
| **Root Causes** | ✅ Issue hypotheses | ✅ Capacity constraints | ✅ Connection issues |
| **Recommendations** | ✅ Remediation actions | ✅ Expansion plans | ✅ Bandwidth upgrades |
| **Auto-Scroll** | ✅ To log entries | ✅ To subnet details | ✅ To relevant section |

📖 See the comprehensive [AI-Powered Features](#-ai-powered-features) section above for complete documentation including example queries, supported patterns, and technical details.

**Technologies:** Custom NLP query parsers, pattern analysis engine, React hooks (useMemo, useCallback, useRef)

---

### 💬 Conversational AI Assistant
**Route:** Floating chat interface (accessible from all pages)

ChatGPT-style conversational interface for infrastructure queries:

| Capability | Examples |
|------------|----------|
| **Infrastructure Status** | "What's the current health of production?" |
| **Metric Queries** | "Show me CPU usage trends for the last hour" |
| **Incident Investigation** | "Why did latency spike at 2pm?" |
| **Recommendations** | "How can I optimize my cloud costs?" |

**Features:**
- Floating chat button with unread message indicator
- Full-screen expandable chat panel
- Message history with timestamps
- Copy to clipboard functionality
- Markdown rendering with syntax highlighting
- Typing indicators and smooth animations

**Technologies:** Framer Motion, Streamdown, shadcn/ui Sheet component

---

### 🔥 Incident Timeline with Blast Radius
**Route:** `/dashboard/incidents`

Visual incident storytelling with cascading impact visualization:

| Component | Description |
|-----------|-------------|
| **Timeline View** | Chronological incident progression with severity indicators |
| **Blast Radius Map** | Interactive visualization of affected services |
| **Impact Metrics** | Users affected, services down, revenue impact |
| **Resolution Steps** | Documented remediation actions with timestamps |

**Features:**
- Interactive node-based blast radius visualization
- Severity color coding (critical/warning/info)
- Time-based filtering
- Incident details modal with full investigation data
- Auto-refresh with live status updates

**Technologies:** @xyflow/react, Framer Motion, Chart.js

---

### 🗺️ Live Topology Map
**Route:** `/dashboard/topology`

Interactive network topology visualization with real-time updates:

#### Layout Options
| Layout | Algorithm | Use Case |
|--------|-----------|----------|
| **Manual** | Free-form | Custom arrangements |
| **Hierarchical** | BFS-based tree | Dependency visualization |
| **Circular** | Radial placement | Equal prominence view |
| **Grid** | Row/column | Organized overview |
| **Force-Directed** | Physics simulation | Automatic clustering |

#### Interactive Features
| Feature | Description |
|---------|-------------|
| **Live Updates Toggle** | Real-time metric and status changes |
| **Environment Selector** | Production (15 nodes), Staging (9), Development (4) |
| **Node Interactions** | Click for details, hover for metrics |
| **Edge Metrics** | Latency, throughput, error rates on connections |
| **Zoom & Pan** | Full canvas navigation controls |

**Node Types:** API Gateway, Microservices, Databases, Cache (Redis), Message Queues, Load Balancers

**Technologies:** @xyflow/react, Framer Motion, Custom edge components

---

### 🔔 Smart Notification Center
**Route:** Slide-out panel (bell icon in header)

Intelligent alert grouping and notification management:

| Feature | Description |
|---------|-------------|
| **Intelligent Grouping** | Related alerts collapsed with expand/collapse |
| **Priority Sorting** | Critical → Warning → Info automatic ordering |
| **Category Tabs** | All, Unread, Infrastructure, Security filters |
| **Quick Actions** | Mark read, dismiss, navigate to source |
| **Time Display** | Relative timestamps ("5m ago", "2h ago") |

**Alert Categories:** Performance, Security, Cost, Availability, Compliance

**Technologies:** Framer Motion, shadcn/ui Sheet, Badge components

---

### 📊 Executive Summary Dashboard
**Route:** `/dashboard/executive-summary`

One-click presentation-ready briefing for stakeholders:

#### Dashboard Sections
| Section | Content |
|---------|---------|
| **Health Score Ring** | Overall infrastructure health percentage |
| **Key Metrics Grid** | Uptime, MTTR, Active Alerts, Cost Efficiency |
| **Trend Charts** | 7-day performance and cost trends |
| **Incident Summary** | Active incidents by severity |
| **Cost Breakdown** | Top 3 services by spend |
| **AI Recommendations** | Prioritized action items |

#### Export Features
| Feature | Implementation |
|---------|---------------|
| **Present Button** | Print-optimized view with CSS @media print |
| **Export PDF** | html2canvas + jsPDF generation |
| **Quick Navigation** | Direct links to Analytics, SLA, Topology, Incidents |

**Technologies:** Chart.js (Doughnut, Line), html2canvas, jsPDF, Framer Motion

---

### ✨ Animated Transitions
**Route:** Global (all pages)

Framer Motion integration for smooth page transitions and micro-interactions:

#### Animation Components
| Component | Animation Type |
|-----------|---------------|
| **PageTransition** | Fade + slide on route changes |
| **FadeTransition** | Simple opacity transitions |
| **AnimatedCard** | Entrance with optional hover lift |
| **StaggerContainer/Item** | Sequential child animations |
| **AnimatedButton** | Scale on hover/tap |

#### Applied Animations
| Location | Effect |
|----------|--------|
| **Login Page** | Card entrance, logo rotation, staggered inputs |
| **Sidebar Menu** | Staggered load, hover slide, active icon wiggle |
| **Dashboard Pages** | Page content fade transitions |
| **Cards & Buttons** | Hover lift, tap feedback |

**Technologies:** Framer Motion, CSS transitions

---

### 🛡️ GCP Firewall Dashboard
**Route:** `/dashboard/firewall`

Comprehensive firewall rule monitoring and analysis with interactive topology visualization:

#### Dashboard Tabs
| Tab | Description |
|-----|-------------|
| **Rules** | Hierarchical view of firewall rules organized by VPC with filters |
| **Traffic** | Hit count analytics with charts showing rule distribution |
| **Topology Map** | Interactive @xyflow/react visualization of firewall topology |
| **Timeline** | Rule change history with 30-day event log |
| **Links** | Cross-dashboard navigation to related dashboards |

#### Rules Tab Features
| Feature | Description |
|---------|-------------|
| **VPC Filter** | Filter rules by VPC (prod, staging, dev, shared) |
| **Action Filter** | Filter by allow/deny rules |
| **Direction Filter** | Filter by ingress/egress |
| **Rule Cards** | Display name, priority, protocols, hit counts |
| **Visual Indicators** | Green (allow) / Red (deny) badges |

#### Firewall Topology Map
| Feature | Description |
|---------|-------------|
| **Custom Nodes** | VPCs, Firewalls, Services (Web/API/DB), Internet Gateway |
| **Dynamic Edges** | Width varies based on traffic utilization |
| **Color Coding** | Green (allow/healthy), Red (deny/critical), Amber (warning) |
| **Live Updates** | Toggle real-time metric simulation |
| **Node Details Panel** | Click nodes for CPU, latency, connections, rule counts |
| **Edge Details Panel** | Click edges for throughput, utilization, error rates |

#### Layout Options (5 algorithms)
| Layout | Algorithm | Use Case |
|--------|-----------|----------|
| **Manual** | Free-form dragging | Custom arrangements |
| **Hierarchical** | BFS-based tree | Internet → VPC → Firewall → Services |
| **Circular** | Radial placement | Equal prominence view |
| **Grid** | Row/column | Organized overview |
| **Force-Directed** | Physics simulation | Automatic clustering |

#### Traffic Analytics
| Chart | Description |
|-------|-------------|
| **Hit Count Over Time** | 24-hour line chart of rule hits |
| **Rule Distribution** | Doughnut chart (allow vs deny) |
| **Rules by VPC** | Bar chart showing rule count per VPC |

#### Integration Points
- Export to PDF/CSV via ExportMenu
- Cross-links to Logs, Incidents, Network Analysis, Topology, Subnets, Compliance
- Dark mode support
- Responsive design

**Technologies:** @xyflow/react, Chart.js (Line, Bar, Doughnut), Framer Motion, Custom layout algorithms

---

### 📈 Comparison Mode
**Route:** `/dashboard/comparison`

Side-by-side analysis for time periods and environments:

#### Time Period Comparison
| Feature | Description |
|---------|-------------|
| **Period Selectors** | Today, Yesterday, Last Week, Last Month, Last Quarter |
| **Metric Cards** | 10 key metrics with change indicators |
| **Trend Charts** | Latency and Throughput comparison graphs |
| **Summary Stats** | Total metrics, improvements, regressions count |

#### Environment Comparison
| Feature | Description |
|---------|-------------|
| **Multi-Environment** | Production vs Staging vs Development |
| **Visual Bars** | Animated horizontal comparison bars |
| **Resource Utilization** | CPU, Memory, Disk, Network side-by-side |

**Metrics Compared:** Uptime, Latency, Error Rate, Throughput, CPU, Memory, DB Connections, Cache Hit Rate, Daily Cost, Active Users

**Technologies:** Chart.js (Line, Bar), Framer Motion, Tailwind CSS

---

## 🏗️ Architecture

### System Overview

![System Overview](docs/images/system-overview.png)

*Diagram source available in [docs/mermaid/mermaid-diagrams.md](docs/mermaid/mermaid-diagrams.md#3-system-overview)*

### Component Hierarchy

![Component Hierarchy](docs/images/component-hierarchy.png)

*Diagram source available in [docs/mermaid/mermaid-diagrams.md](docs/mermaid/mermaid-diagrams.md#4-component-hierarchy)*

### Navigation Routes

![Navigation Routes](docs/images/navigation-routes.png)

*Diagram source available in [docs/mermaid/mermaid-diagrams.md](docs/mermaid/mermaid-diagrams.md#5-navigation-routes)*

### Wow Feature Architecture

![Wow Feature Architecture](docs/images/wow-feature-architecture.png)

*Diagram source available in [docs/mermaid/mermaid-diagrams.md](docs/mermaid/mermaid-diagrams.md#6-wow-feature-architecture)*

### Data Flow

![Data Flow](docs/images/data-flow.png)

*Diagram source available in [docs/mermaid/mermaid-diagrams.md](docs/mermaid/mermaid-diagrams.md#7-data-flow)*

### WebSocket Real-Time Updates

![WebSocket Real-Time Updates](docs/images/websocket-updates.png)

*Diagram source available in [docs/mermaid/mermaid-diagrams.md](docs/mermaid/mermaid-diagrams.md#8-websocket-real-time-updates)*

---

## 🛠️ Technical Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Frontend Framework** | React | 19.0 |
| **Language** | TypeScript | 5.0+ |
| **Build Tool** | Vite | 7.x |
| **Styling** | Tailwind CSS | 4.x |
| **UI Components** | shadcn/ui | Latest |
| **Routing** | Wouter | 3.x |
| **Charts** | Chart.js + react-chartjs-2 | 4.x |
| **Graph Visualization** | @xyflow/react | Latest |
| **Animations** | Framer Motion | Latest |
| **Markdown Rendering** | Streamdown | Latest |
| **API Layer** | tRPC | 11.x |
| **Backend** | Express.js | 4.x |
| **WebSocket** | ws | 8.x |
| **Database ORM** | Drizzle | Latest |
| **Time-Series DB** | InfluxDB | 2.x |
| **PDF Generation** | jsPDF + html2canvas | Latest |

---

## 📁 Project Structure

```
/opt/Scripts/Observability/
├── client/                              # Frontend application
│   └── src/
│       ├── pages/                       # Page components
│       │   ├── Dashboard.tsx            # Overview with health status
│       │   ├── ExecutiveSummary.tsx     # 🌟 Presentation-ready briefing
│       │   ├── ComparisonMode.tsx       # 🌟 Side-by-side analysis
│       │   ├── IncidentTimeline.tsx     # 🌟 Incident blast radius
│       │   ├── TopologyMap.tsx          # 🌟 Live network topology
│       │   ├── Metrics.tsx              # Anomaly detection metrics
│       │   ├── DrillDownMetrics.tsx     # 3-level drill-down
│       │   ├── NetworkAnalysis.tsx      # Network monitoring + 🤖 AI Search & Insights
│       │   ├── SubnetMonitoring.tsx     # Subnet utilization + 🤖 AI Search & Insights
│       │   ├── Logs.tsx                 # NLP-powered log search + 🤖 AI Search & Insights
│       │   ├── Alerts.tsx               # Alert management
│       │   ├── AlertRules.tsx           # Custom alert rules
│       │   ├── Correlation.tsx          # Metric correlation
│       │   ├── RootCause.tsx            # AI root cause analysis
│       │   ├── CostOptimization.tsx     # Cost recommendations
│       │   ├── SLATracking.tsx          # SLA compliance
│       │   ├── Analytics.tsx            # Grafana-style dashboard
│       │   ├── FirewallDashboard.tsx    # 🛡️ GCP Firewall monitoring + topology
│       │   ├── Login.tsx                # Animated login page
│       │   └── DashboardRouter.tsx      # Route management
│       ├── components/
│       │   ├── DashboardLayout.tsx      # Main layout + sidebar
│       │   ├── ChatAssistant.tsx        # 🌟 AI chat interface
│       │   ├── NotificationCenter.tsx   # 🌟 Smart notifications
│       │   ├── PageTransition.tsx       # 🌟 Framer Motion animations
│       │   ├── ExportMenu.tsx           # PDF/CSV/JSON export
│       │   ├── RealTimeIndicator.tsx    # WebSocket status
│       │   └── ui/                      # shadcn/ui components
│       ├── hooks/
│       │   └── useWebSocket.ts          # WebSocket connection hook
│       ├── lib/
│       │   ├── trpc.ts                  # tRPC client setup
│       │   └── export.ts                # Export utilities
│       └── contexts/
│           └── ThemeContext.tsx         # Dark mode context
├── server/
│   ├── _core/
│   │   ├── index.ts                     # Express server entry
│   │   └── websocket.ts                 # WebSocket server
│   ├── routers.ts                       # tRPC API routes
│   ├── mockData.ts                      # Mock data generators
│   └── db.ts                            # Database helpers
├── drizzle/
│   └── schema.ts                        # Database schema
├── certs/                               # SSL certificates
│   ├── server.crt
│   └── server.key
└── docs/                                # Documentation
```

---

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd Observability

# Install dependencies
pnpm install

# Push database schema (optional - works with mock data)
pnpm db:push

# Run development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

---

## ⚙️ Configuration

### Port Configuration

| Service | Port | Protocol |
|---------|------|----------|
| Frontend | 5443 | HTTPS |
| Backend API | 5442 | HTTPS |
| WebSocket | 5442 | WSS |

### SSL Certificates

The application uses DigiCert-issued SSL certificates for HTTPS. All certificate files are located in `/certs/`.

#### Certificate Files

| File | Description |
|------|-------------|
| `eri2appdl12v.corp.cvscaremark.com.pfx` | Original PFX bundle (password protected) |
| `eri2appdl12v.crt` | Server certificate (extracted from PFX) |
| `eri2appdl12v.key` | Private key (extracted from PFX) |
| `fullchain.crt` | Complete certificate chain for TLS |
| `intermediate.crt` | DigiCert intermediate CA certificates |

#### Certificate Details

| Property | Value |
|----------|-------|
| **Subject** | CN=eri2appdl12v.corp.cvscaremark.com, O=CVS Pharmacy Inc |
| **Issuer** | DigiCert Global G2 TLS RSA SHA256 2020 CA1 |
| **Valid From** | December 1, 2025 |
| **Valid Until** | November 30, 2026 |
| **Key Usage** | TLS Web Server Authentication, TLS Web Client Authentication |

#### Subject Alternative Names (SANs)

The certificate is valid for the following hostnames:
- `eri2appdl12v.corp.cvscaremark.com`
- `bmaas.corp.cvscaremark.com`
- `intake.corp.cvscaremark.com`
- `vibe.corp.cvscaremark.com`
- `agent.corp.cvscaremark.com`
- `observability.corp.cvscaremark.com`
- `lucidmcp.bmaas.corp.cvscaremark.com`
- `confluencemcp.bmaas.corp.cvscaremark.com`

#### Certificate Trust Chain

![Certificate Trust Chain](docs/images/certificate-trust-chain.png)

*Diagram source available in [docs/mermaid/mermaid-diagrams.md](docs/mermaid/mermaid-diagrams.md#9-certificate-trust-chain)*

#### Certificate Deployment Architecture

![Certificate Deployment Architecture](docs/images/certificate-deployment-architecture.png)

*Diagram source available in [docs/mermaid/mermaid-diagrams.md](docs/mermaid/mermaid-diagrams.md#10-certificate-deployment-architecture)*

> **Note:** The PFX password is stored securely in the `.env` file as `PFX_PASSWORD`. Never commit passwords to version control.

#### SSL Certificate Deployment Procedure

Follow these steps to deploy or update SSL certificates from a new PFX file:

**Step 1: Upload the PFX file**
```bash
# Place the new PFX file in the certs directory
# Example: /opt/Scripts/Observability/certs/eri2appdl12v.corp.cvscaremark.com.pfx
```

**Step 2: Extract the private key**
```bash
cd /opt/Scripts/Observability/certs

# Extract private key (password from .env PFX_PASSWORD)
openssl pkcs12 -in eri2appdl12v.corp.cvscaremark.com.pfx \
  -nocerts -nodes -passin pass:$PFX_PASSWORD 2>/dev/null | \
  openssl rsa -out eri2appdl12v.key 2>/dev/null

# Set secure permissions
chmod 600 eri2appdl12v.key
```

**Step 3: Extract the server certificate**
```bash
# Extract server certificate
openssl pkcs12 -in eri2appdl12v.corp.cvscaremark.com.pfx \
  -clcerts -nokeys -passin pass:$PFX_PASSWORD 2>/dev/null | \
  sed -n '/-----BEGIN CERTIFICATE-----/,/-----END CERTIFICATE-----/p' > eri2appdl12v.crt

chmod 600 eri2appdl12v.crt
```

**Step 4: Extract intermediate certificates**
```bash
# Extract CA chain (intermediate certificates)
openssl pkcs12 -in eri2appdl12v.corp.cvscaremark.com.pfx \
  -cacerts -nokeys -passin pass:$PFX_PASSWORD 2>/dev/null | \
  sed -n '/-----BEGIN CERTIFICATE-----/,/-----END CERTIFICATE-----/p' > intermediate.crt

chmod 644 intermediate.crt
```

**Step 5: Create the full certificate chain**
```bash
# Combine server cert + intermediate certs
cat eri2appdl12v.crt intermediate.crt > fullchain.crt
chmod 644 fullchain.crt
```

**Step 6: Verify the certificate chain**
```bash
# Verify the certificate chain is complete
openssl crl2pkcs7 -nocrl -certfile fullchain.crt | \
  openssl pkcs7 -print_certs -noout

# Expected output:
# subject=CN=eri2appdl12v.corp.cvscaremark.com...
# issuer=CN=DigiCert Global G2 TLS RSA SHA256 2020 CA1...
#
# subject=CN=DigiCert Global G2 TLS RSA SHA256 2020 CA1...
# issuer=CN=DigiCert Global Root G2...
#
# subject=CN=DigiCert Global Root G2...
# issuer=CN=DigiCert Global Root G2...
```

**Step 7: Verify Extended Key Usage (EKU)**
```bash
# Ensure certificate has TLS Web Server Authentication
openssl x509 -in eri2appdl12v.crt -noout -text | grep -A3 "Extended Key Usage"

# Expected output should include:
# X509v3 Extended Key Usage:
#     TLS Web Server Authentication, TLS Web Client Authentication
```

**Step 8: Restart services**
```bash
sudo systemctl restart observability-frontend observability-backend
```

**Step 9: Verify deployment**
```bash
# Check certificate is being served correctly
echo | openssl s_client -connect localhost:5443 \
  -servername eri2appdl12v.corp.cvscaremark.com 2>&1 | \
  grep -E "(Verify return|issuer=)"

# Expected output:
# issuer=C=US, O=DigiCert Inc, CN=DigiCert Global G2 TLS RSA SHA256 2020 CA1
# Verify return code: 0 (ok)
```

![SSL Certificate Deployment Steps](docs/images/ssl-deployment-steps.png)

*Diagram source available in [docs/mermaid/mermaid-diagrams.md](docs/mermaid/mermaid-diagrams.md#11-ssl-certificate-deployment-steps)*

### Systemd Services

```bash
# Enable and start services
sudo systemctl enable observability-frontend observability-backend
sudo systemctl start observability-frontend observability-backend

# Check status
sudo systemctl status observability-frontend
sudo systemctl status observability-backend

# View logs
journalctl -u observability-backend -f
journalctl -u observability-frontend -f
```

### Environment Variables

Create a `.env` file with the following:

```env
# Application
NODE_ENV=production
JWT_SECRET=your-secure-jwt-secret

# PostgreSQL (optional - uses mock data if not configured)
DATABASE_URL=postgresql://user:password@host:5432/observability

# InfluxDB (optional - uses mock data if not configured)
INFLUXDB_URL=https://your-influxdb.com
INFLUXDB_TOKEN=your-token
INFLUXDB_ORG=your-org
INFLUXDB_BUCKET=metrics

# GCP (for production integration)
GCP_PROJECT_ID=your-project-id
GCP_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

---

## 🎨 Design & Branding

| Aspect | Value |
|--------|-------|
| **Primary Color** | ADP Red (#d0271d) |
| **Dark Mode** | Full support with toggle |
| **Layout** | Collapsible sidebar + responsive |
| **Components** | shadcn/ui with ADP theming |
| **Icons** | Lucide React |
| **Charts** | Chart.js with custom styling |

---

## 🔐 Demo Credentials

For demonstration purposes:

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | `admin` |

---

## 📊 Mock Data

Comprehensive mock data generators for all features:

| Data Type | Description |
|-----------|-------------|
| **GCP Projects** | 4 projects (dev, staging, 2x prod) |
| **Metrics** | CPU, memory, network, disk, latency, error rates |
| **Logs** | 100+ entries with DEBUG/INFO/WARNING/ERROR/CRITICAL |
| **Alerts** | Critical, warning, and info alerts with scenarios |
| **Traces** | Distributed traces with span relationships |
| **Costs** | 30 days across 8 GCP services |
| **Subnets** | 8 subnets across 4 VPCs |
| **NCC Connections** | VPN tunnels, interconnects, peering |

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Test coverage includes:
# - Projects API (list, filter by environment)
# - Alerts API (active, severity, statistics, acknowledge, resolve)
# - Metrics API (query with time ranges and filters)
# - Logs API (list with severity filtering)
# - Traces API (distributed trace queries)
# - Costs API (records, summary by service)
# - Authentication (login, logout, session)
# - Mock data seeding
```

All 18 tests passing ✅

---

## 🚀 Deployment

### Quick Start

```bash
# Build the application
pnpm build

# Start with systemd (production)
sudo systemctl start observability-frontend observability-backend

# Or run directly
node dist/index.js
```

### Access URLs

| Service | URL |
|---------|-----|
| Dashboard | `https://localhost:5443/dashboard` |
| Login | `https://localhost:5443/` |
| API | `https://localhost:5442/api/trpc/*` |

---

## 📋 Feature Implementation Status

### ✅ Completed Features

#### Initial Features (4)
- [x] **NLP Search for Logs** - Natural language query parsing
- [x] **Anomaly Detection** - Z-score based detection with visualization
- [x] **Grafana-Style Analytics** - Multi-panel dashboard with KPIs
- [x] **Trend Analysis** - Predictive alerting with forecasting

#### Phase 1: Enhanced Features (8)
- [x] **Dark Mode Toggle** - System preference + manual toggle
- [x] **Real-time WebSocket** - Live metric streaming every 3s
- [x] **Export to PDF/CSV** - Reports, data, and chart images
- [x] **Custom Alert Rules** - CRUD interface for thresholds
- [x] **Correlation Analysis** - Scatter plots + correlation matrix
- [x] **Root Cause Analysis** - AI-powered with confidence scores
- [x] **Cost Optimization** - Usage analysis + recommendations
- [x] **SLA Tracking** - Uptime and compliance monitoring

#### Phase 2: Meeting Requirements (6)
- [x] **Overview Enhancements** - 70% alerts, Notable Events, Health Status
- [x] **Drill-Down Level 1** - Infrastructure categories
- [x] **Drill-Down Level 2** - Projects/VPCs with NCC
- [x] **Drill-Down Level 3** - Individual resources
- [x] **Network Analysis** - Top talkers, bandwidth, NCC
- [x] **Subnet Monitoring** - IP utilization, capacity planning

#### 🌟 Wow Factor Features - Priority 1 (2)
- [x] **AI Log Insights Generator** - Pattern detection, correlated events, root cause suggestions
- [x] **Conversational AI Assistant** - ChatGPT-style interface for infrastructure queries

#### 🤖 AI-Powered Dashboard Features (3)
- [x] **AI-Powered Log Search** - NLP query parsing with auto-scroll to results
- [x] **AI-Powered Subnet Search & Insights** - Natural language search + pattern/correlation/recommendation analysis
- [x] **AI-Powered Network Search & Insights** - Traffic analysis, connection health, performance recommendations

#### 🌟 Wow Factor Features - Priority 2 (6)
- [x] **Incident Timeline with Blast Radius** - Visual incident story with affected services
- [x] **Live Topology Map** - Interactive network visualization with multiple layouts
- [x] **Smart Notification Center** - Slide-out panel with intelligent alert grouping
- [x] **Executive Summary Dashboard** - One-click presentation-ready briefing with PDF export
- [x] **Animated Transitions** - Framer Motion for page transitions and micro-interactions
- [x] **Comparison Mode** - Side-by-side analysis for time periods/environments

### 🚧 Production Readiness (See TODO.md)
- [ ] Real GCP API integration
- [ ] Production authentication (OAuth/SSO)
- [ ] Database configuration
- [ ] CI/CD pipeline

#### 🌟 Wow Factor Features - Priority 3 (10)
- [x] **API Health Monitor** - Endpoint-level latency, error rates, SLA tracking with OpenAPI integration
- [x] **SRE Workbench** - Error budget tracking, incident postmortems, reliability scorecards
- [x] **Capacity Planning Forecaster** - ML-based resource usage predictions with scaling recommendations
- [x] **Resource Tagging Governance** - Tag compliance scoring, missing tag detection, policy enforcement
- [x] **Compliance & Audit Trail** - SOC2/HIPAA/PCI-DSS monitoring with automated audit reports
- [x] **Multi-Tenant Cost Chargeback** - Department/team-level cost allocation with budget alerts
- [x] **Automated Runbook Executor** - One-click remediation actions with pre-defined runbooks
- [x] **Chaos Engineering Dashboard** - Controlled failure injection with resilience scoring
- [x] **Custom Dashboard Builder** - Drag-and-drop widget placement with shareable templates
- [x] **Intelligent Correlation Engine** - Cross-service anomaly correlation using graph-based analysis

#### 🛡️ Operations Dashboards (1)
- [x] **GCP Firewall Dashboard** - Rule monitoring, traffic analytics, interactive topology with 5 layout algorithms, rule change timeline, cross-dashboard links

---

## 🔄 GCP API Integration

To transition from mock data to real GCP data:

```typescript
// server/gcp-client.ts
import { MetricServiceClient } from '@google-cloud/monitoring';

const client = new MetricServiceClient({
  keyFilename: process.env.GCP_SERVICE_ACCOUNT_KEY,
});

export async function fetchRealMetrics(projectId: string, metricType: string) {
  const request = {
    name: client.projectPath(projectId),
    filter: `metric.type="${metricType}"`,
    interval: {
      endTime: { seconds: Date.now() / 1000 },
      startTime: { seconds: (Date.now() - 3600000) / 1000 },
    },
  };

  const [timeSeries] = await client.listTimeSeries(request);
  return timeSeries;
}
```

Required packages:
```bash
pnpm add @google-cloud/monitoring @google-cloud/logging @google-cloud/trace
```

---

## 🆘 Support & Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| SSL Certificate Error | Accept self-signed cert or replace with valid CA |
| WebSocket Disconnected | Check backend is running on port 5442 |
| Blank Dashboard | Login with admin/admin credentials first |
| Charts Not Loading | Ensure mock data is seeded |

### Log Files

```bash
# Backend logs
journalctl -u observability-backend -f

# Frontend logs
journalctl -u observability-frontend -f

# Application logs
tail -f /var/log/observability/*.log
```

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 🏢 About

**ADP GCP Observability Dashboard**

A comprehensive observability platform designed for monitoring Google Cloud Platform infrastructure at enterprise scale. Built with modern technologies and ADP branding.

| | |
|---|---|
| **Organization** | ADP |
| **Platform** | Google Cloud Platform |
| **Purpose** | Infrastructure Observability |
| **Status** | Demo Ready |

---

**Built for ADP** | **GCP Observability Platform** | **© 2024**
