# Mermaid Diagram Source Files

This document contains the original Mermaid diagram source code used in the README.md file.
These diagrams have been converted to static PNG images in the main documentation but are preserved here for future maintenance and updates.

---

## 1. Query Interpretation Process

**Image Location:** `docs/images/query-interpretation-process.png`

```mermaid
flowchart LR
    Input["Natural Language<br/>Query"] --> Parser["NLP Query<br/>Parser"]
    Parser --> Filters["Extracted<br/>Filters"]
    Filters --> Display["Query<br/>Interpretation<br/>Display"]
    Filters --> Data["Filtered<br/>Results"]
    Data --> Scroll["Auto-Scroll<br/>to Results"]
```

---

## 2. AI Insights Generation

**Image Location:** `docs/images/ai-insights-generation.png`

```mermaid
flowchart TB
    Data["Current<br/>Dataset"] --> Analyze["Pattern<br/>Analysis"]
    Analyze --> Patterns["Detected<br/>Patterns"]
    Analyze --> Correlations["Event<br/>Correlations"]
    Analyze --> RootCauses["Root Cause<br/>Analysis"]
    Patterns --> Summary["AI Summary"]
    Correlations --> Summary
    RootCauses --> Summary
    Summary --> Recommendations["Actionable<br/>Recommendations"]
```

---

## 3. System Overview

**Image Location:** `docs/images/system-overview.png`

```mermaid
flowchart TB
    subgraph Client["Frontend (Port 5443)"]
        React["React 19 + TypeScript"]
        Router["Wouter Router"]
        Charts["Chart.js / Recharts"]
        UI["shadcn/ui Components"]
        WS_Client["WebSocket Client"]
        FramerMotion["Framer Motion"]
        XYFlow["@xyflow/react"]
    end

    subgraph Server["Backend (Port 5442)"]
        Express["Express.js"]
        tRPC["tRPC Router"]
        WS_Server["WebSocket Server"]
        MockData["Mock Data Generator"]
    end

    subgraph DataStores["Data Layer"]
        PostgreSQL[(PostgreSQL)]
        InfluxDB[(InfluxDB)]
        Memory["In-Memory Cache"]
    end

    subgraph AILayer["AI Features"]
        AIInsights["AI Log Insights"]
        ChatAssistant["Chat Assistant"]
        RootCauseAI["Root Cause AI"]
    end

    React --> tRPC
    WS_Client <-.->|Real-time| WS_Server
    tRPC --> Express
    Express --> MockData
    MockData --> Memory
    Express -.-> PostgreSQL
    Express -.-> InfluxDB
    React --> AILayer
    AILayer --> Express
```

---

## 4. Component Hierarchy

**Image Location:** `docs/images/component-hierarchy.png`

```mermaid
flowchart TB
    App["App.tsx"] --> ThemeProvider["ThemeProvider"]
    ThemeProvider --> QueryProvider["QueryClientProvider"]
    QueryProvider --> Router["Router"]

    Router --> Login["Login Page<br/>(Animated)"]
    Router --> DashboardRouter["DashboardRouter"]

    DashboardRouter --> Layout["DashboardLayout"]
    Layout --> Sidebar["Sidebar Navigation<br/>(Animated Menu)"]
    Layout --> Header["Header + Dark Mode"]
    Layout --> NotificationCenter["NotificationCenter<br/>(Smart Alerts)"]
    Layout --> ChatAssistant["ChatAssistant<br/>(AI Interface)"]
    Layout --> PageTransition["PageTransition<br/>(Framer Motion)"]
    PageTransition --> Pages["Page Components"]

    subgraph CorePages["Core Pages"]
        Dashboard["Dashboard"]
        Metrics["Metrics"]
        DrillDown["DrillDownMetrics"]
        Network["NetworkAnalysis"]
        Subnets["SubnetMonitoring"]
        Logs["Logs + AI Insights"]
        Alerts["Alerts"]
        AlertRules["AlertRules"]
    end

    subgraph WowPages["Wow Factor Pages"]
        ExecutiveSummary["ExecutiveSummary<br/>(PDF Export)"]
        ComparisonMode["ComparisonMode<br/>(Side-by-Side)"]
        IncidentTimeline["IncidentTimeline<br/>(Blast Radius)"]
        TopologyMap["TopologyMap<br/>(Live Network)"]
    end

    subgraph AnalyticsPages["Analytics Pages"]
        Correlation["Correlation"]
        RootCause["RootCause"]
        CostOptimization["CostOptimization"]
        SLATracking["SLATracking"]
        Analytics["Analytics"]
    end

    Pages --> CorePages
    Pages --> WowPages
    Pages --> AnalyticsPages
```

---

## 5. Navigation Routes

**Image Location:** `docs/images/navigation-routes.png`

```mermaid
flowchart LR
    subgraph MainNav["Main Navigation"]
        Overview["/dashboard"]
        ExecSummary["/dashboard/executive-summary"]
        Comparison["/dashboard/comparison"]
    end

    subgraph Monitoring["Monitoring"]
        Metrics["/dashboard/metrics"]
        DrillDown["/dashboard/drill-down"]
        Network["/dashboard/network"]
        Subnets["/dashboard/subnets"]
    end

    subgraph Operations["Operations"]
        Logs["/dashboard/logs"]
        Alerts["/dashboard/alerts"]
        AlertRules["/dashboard/alert-rules"]
        Incidents["/dashboard/incidents"]
        Topology["/dashboard/topology"]
    end

    subgraph Analysis["Analysis"]
        Correlation["/dashboard/correlation"]
        RootCause["/dashboard/root-cause"]
        Cost["/dashboard/cost-optimization"]
        SLA["/dashboard/sla-tracking"]
        Analytics["/dashboard/analytics"]
    end

    Overview --> ExecSummary
    ExecSummary --> Comparison
    Comparison --> Metrics
```

---

## 6. Wow Feature Architecture

**Image Location:** `docs/images/wow-feature-architecture.png`

```mermaid
flowchart TB
    subgraph TopologySystem["Live Topology Map"]
        XYFlow["@xyflow/react"]
        Layouts["Layout Engine<br/>(Manual, Hierarchical,<br/>Circular, Grid, Force)"]
        NodeTypes["Custom Nodes<br/>(Gateway, Service,<br/>Database, Cache)"]
        EdgeTypes["Interactive Edges<br/>(Metrics, Health)"]
        EnvSelector["Environment Selector<br/>(Prod, Staging, Dev)"]
        LiveUpdates["Live Updates<br/>(Status, Metrics)"]
    end

    subgraph IncidentSystem["Incident Timeline"]
        Timeline["Chronological View"]
        BlastRadius["Blast Radius Map"]
        ImpactMetrics["Impact Analysis"]
        ResolutionSteps["Resolution Tracking"]
    end

    subgraph NotificationSystem["Smart Notifications"]
        AlertGrouping["Intelligent Grouping"]
        PrioritySort["Priority Sorting"]
        CategoryFilter["Category Filtering"]
        QuickActions["Quick Actions"]
    end

    subgraph ExecSystem["Executive Summary"]
        HealthScore["Health Score Ring"]
        KeyMetrics["Key Metrics Grid"]
        TrendCharts["Trend Charts"]
        PDFExport["PDF Export<br/>(html2canvas + jsPDF)"]
        PrintView["Print View<br/>(@media print)"]
    end

    subgraph ComparisonSystem["Comparison Mode"]
        TimePeriod["Time Period<br/>Comparison"]
        EnvCompare["Environment<br/>Comparison"]
        ChangeIndicators["Change Indicators<br/>(+/- Badges)"]
        TrendCompare["Trend Charts"]
    end
```

---

## 7. Data Flow

**Image Location:** `docs/images/data-flow.png`

```mermaid
sequenceDiagram
    participant User
    participant React as React App
    participant tRPC as tRPC Client
    participant Express as Express Server
    participant Mock as Mock Data
    participant WS as WebSocket

    User->>React: Navigate to Dashboard
    React->>tRPC: Query metrics/logs/alerts
    tRPC->>Express: HTTP Request
    Express->>Mock: Generate data
    Mock-->>Express: Return mock data
    Express-->>tRPC: JSON Response
    tRPC-->>React: Typed data
    React-->>User: Render UI

    loop Every 3 seconds
        WS->>React: Push metric updates
        React-->>User: Update charts
    end
```

---

## 8. WebSocket Real-Time Updates

**Image Location:** `docs/images/websocket-updates.png`

```mermaid
flowchart LR
    subgraph Backend
        Generator["Metric Generator"]
        WSServer["WebSocket Server"]
    end

    subgraph Frontend
        Hook["useWebSocket Hook"]
        State["React State"]
        Charts["Chart Components"]
    end

    Generator -->|Every 3s| WSServer
    WSServer -->|Broadcast| Hook
    Hook -->|Update| State
    State -->|Re-render| Charts
```

---

## 9. Certificate Trust Chain

**Image Location:** `docs/images/certificate-trust-chain.png`

```mermaid
flowchart TB
    subgraph TrustChain["Certificate Trust Chain"]
        direction TB
        Root["🔐 DigiCert Global Root G2<br/><i>Self-Signed Root CA</i><br/><small>Trusted by all major browsers</small>"]
        Intermediate["📜 DigiCert Global G2 TLS RSA SHA256 2020 CA1<br/><i>Intermediate CA</i>"]
        Server["🌐 eri2appdl12v.corp.cvscaremark.com<br/><i>Server Certificate</i><br/><small>Valid: Dec 2025 - Nov 2026</small>"]

        Root -->|"Signs"| Intermediate
        Intermediate -->|"Signs"| Server
    end

    subgraph Browser["Browser Verification"]
        direction LR
        B1["1️⃣ Browser receives<br/>server certificate"]
        B2["2️⃣ Validates against<br/>intermediate CA"]
        B3["3️⃣ Traces to<br/>trusted root"]
        B4["✅ Connection<br/>Secure"]

        B1 --> B2 --> B3 --> B4
    end

    Server -.->|"Presented to"| B1
```

---

## 10. Certificate Deployment Architecture

**Image Location:** `docs/images/certificate-deployment-architecture.png`

```mermaid
flowchart LR
    subgraph PFX["PFX Bundle"]
        P1["🔒 eri2appdl12v.corp.cvscaremark.com.pfx<br/><small>Password protected</small>"]
    end

    subgraph Extract["Extraction Process"]
        E1["openssl pkcs12<br/>-nocerts -nodes"]
        E2["openssl pkcs12<br/>-clcerts -nokeys"]
        E3["openssl pkcs12<br/>-cacerts -nokeys"]
    end

    subgraph Files["Certificate Files"]
        F1["🔑 eri2appdl12v.key<br/><small>Private Key</small>"]
        F2["📄 eri2appdl12v.crt<br/><small>Server Cert</small>"]
        F3["📋 intermediate.crt<br/><small>CA Chain</small>"]
    end

    subgraph Chain["Full Chain"]
        C1["📦 fullchain.crt<br/><small>Server + Intermediates</small>"]
    end

    subgraph Services["HTTPS Services"]
        S1["🖥️ Frontend<br/>Port 5443"]
        S2["⚙️ Backend<br/>Port 5442"]
    end

    P1 --> E1 --> F1
    P1 --> E2 --> F2
    P1 --> E3 --> F3

    F2 --> C1
    F3 --> C1

    C1 --> S1
    C1 --> S2
    F1 --> S1
    F1 --> S2
```

---

## 11. SSL Certificate Deployment Steps

**Image Location:** `docs/images/ssl-deployment-steps.png`

```mermaid
flowchart TD
    subgraph Deployment["SSL Certificate Deployment Steps"]
        S1["📤 Step 1: Upload PFX"]
        S2["🔑 Step 2: Extract Private Key"]
        S3["📄 Step 3: Extract Server Cert"]
        S4["📋 Step 4: Extract Intermediates"]
        S5["📦 Step 5: Create Fullchain"]
        S6["✅ Step 6: Verify Chain"]
        S7["🔍 Step 7: Verify EKU"]
        S8["🔄 Step 8: Restart Services"]
        S9["🧪 Step 9: Test Connection"]

        S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7 --> S8 --> S9
    end

    subgraph Verification["Verification Checks"]
        V1["Chain Complete?"]
        V2["EKU = Server Auth?"]
        V3["Return Code = 0?"]

        S6 --> V1
        S7 --> V2
        S9 --> V3
    end

    V1 -->|"Yes"| S7
    V2 -->|"Yes"| S8
    V3 -->|"Yes"| Done["✅ Deployment Complete"]

    V1 -->|"No"| Fix1["Fix: Check PFX contents"]
    V2 -->|"No"| Fix2["Fix: Request new cert with correct EKU"]
    V3 -->|"No"| Fix3["Fix: Check service logs"]
```

