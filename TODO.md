# ADP GCP Observability Dashboard - TODO

## Current Status
The application is deployed and running with mock data. The following items need to be completed for full production readiness.

---

## 🚀 GCP POC Deployment - Action Items (Dec 4, 2025 Meeting)

> **Meeting Date**: December 4, 2025 (2:30 PM ET)
> **Participants**: Greg, Ian, Matt, Jesse, Broccoli Team, Taxi Team
> **Next Phase**: Deploy to GCP non-production environment to capture live, real-world data

### Architecture Updates

- [ ] **[ARCHITECTURE]** Update production-gcp-bigtable.md: Replace Cloud Run with Compute Engine VMs, remove Memorystore/Cloud Functions/Dataflow
  - **Owner**: Ian
  - **Priority**: 🔴 HIGH
  - **Due**: ASAP
  - **Status**: ✅ COMPLETE (Dec 4, 2025)

### Infrastructure Setup

- [ ] **[INFRASTRUCTURE]** Create cloud intake request for architecture review and POC database setup approval
  - **Owner**: Matt
  - **Priority**: 🔴 HIGH
  - **Due**: TBD

- [ ] **[DATABASE]** Contact Broccoli team to confirm access/feasibility of using "Broc API Test" Bigtable instance
  - **Owner**: Ian/Matt
  - **Priority**: 🔴 HIGH
  - **Due**: ASAP
  - **Link**: [broc-api-test-ns-delete](https://console.cloud.google.com/bigtable/instances/broc-api-test-ns-delete/overview?project=anbc-dev-scratch-two)

- [ ] **[INFRASTRUCTURE]** Create dedicated POC GCP project separate from non-prod/prod environments
  - **Owner**: Matt
  - **Priority**: 🟡 MEDIUM
  - **Due**: TBD

- [ ] **[INFRASTRUCTURE]** Configure initial VM for POC deployment with vertical scaling
  - **Owner**: Greg
  - **Priority**: 🟡 MEDIUM
  - **Due**: TBD
  - **Notes**: Single VM with n2-standard-4 (4 vCPU, 16 GB RAM) recommended

### New Features

- [ ] **[FEATURE]** Implement AI-powered firewall rule diagnostics feature
  - **Owner**: Ian
  - **Priority**: 🟡 MEDIUM
  - **Due**: TBD
  - **Description**: Input source/dest IPs, output connectivity diagnostics without manual log inspection

- [ ] **[FEATURE]** Add subnet utilization reporting and IP allocation tracking to dashboard
  - **Owner**: Ian
  - **Priority**: 🟡 MEDIUM
  - **Due**: TBD
  - **Description**: View remaining IPs per subnet, VPC usage analysis

- [ ] **[FEATURE]** Implement infrastructure hierarchy drill-down visualization
  - **Owner**: Ian
  - **Priority**: 🟢 LOW
  - **Due**: TBD
  - **Description**: VPC → Subnet → VM → metrics (CPU/Memory/Network)

### Security & Compliance

- [ ] **[SECURITY]** Coordinate with cloud security team for container image scanning via JFrog
  - **Owner**: Greg/Ian
  - **Priority**: 🟡 MEDIUM
  - **Due**: Before production deployment
  - **Notes**: All container images must go through cloud security scans

### Documentation

- [ ] **[DOCUMENTATION]** Add DNS configuration and A-record setup documentation for private IP endpoint
  - **Owner**: Ian
  - **Priority**: 🟢 LOW
  - **Due**: TBD
  - **Notes**: DNS name for private IP endpoint (no load balancer for POC)

### Risks & Blockers

| Risk | Impact | Mitigation |
|------|--------|------------|
| Bigtable access dependency on Broccoli team | May delay POC | Early coordination, backup plan for new instance |
| Single VM scalability concerns | May not handle production load | Monitor utilization, plan MIG migration path |
| Firewall complexity (GCP-to-on-prem via Cisco FTD) | Connectivity debugging | Document external firewall requirements |
| Cost model sustainability | Unknown at scale | Monitor and project based on POC data |

---

## 🔴 Critical - Required for Production

### Authentication & Security
- [ ] Replace static demo login with proper authentication (OAuth, LDAP, or SSO)
- [ ] Implement role-based access control (RBAC) for viewer/editor/admin roles
- [ ] Add session timeout and refresh token mechanism
- [ ] Implement audit logging for user actions
- [ ] Add CSRF protection for API endpoints

### Database Configuration
- [ ] Configure PostgreSQL connection with production credentials
- [ ] Run database migrations (`pnpm db:push`)
- [ ] Set up database backup and recovery procedures
- [ ] Configure connection pooling for high availability

### InfluxDB Integration
- [ ] Configure InfluxDB connection with user-provided credentials
- [ ] Create InfluxDB client for time-series queries
- [ ] Design data models for metrics storage in InfluxDB
- [ ] Add mock data generator for InfluxDB time-series metrics

### GCP Integration
- [ ] Add GCP service account credentials
- [ ] Implement GCP Monitoring API integration for real metrics
- [ ] Implement GCP Logging API integration for real logs
- [ ] Implement GCP Trace API integration for real traces
- [ ] Configure multi-project scope support

---

## 🟡 High Priority - Core Features

### Metrics Monitoring
- [ ] Integrate with GCP Cloud Monitoring API
- [ ] Add support for 5,000+ built-in GCP metrics
- [ ] Implement Prometheus metrics collection for GKE/GCE
- [ ] Add OpenTelemetry agent-based monitoring
- [ ] Create in-context visualizations with alerts
- [ ] Support custom metrics ingestion

### Logs Management
- [ ] Integrate with GCP Cloud Logging API
- [ ] Implement Error Reporting aggregation
- [ ] Add Log Explorer with query interface
- [ ] Implement Log Analytics with SQL-based queries
- [ ] Add log routing and sink configuration
- [ ] Support audit logs (Admin Activity, Data Access, System Event)

### Tracing
- [ ] Integrate with GCP Cloud Trace API
- [ ] Implement OpenTelemetry trace collection
- [ ] Add latency analysis and bottleneck detection
- [ ] Create trace visualization with span details
- [ ] Auto-collect traces from Cloud Functions/Cloud Run

### Core Dashboard Screens
- [ ] Distributed Tracing Dashboard - request trace visualization
- [ ] Cost Management Dashboard - resource cost tracking
- [ ] Predictive Analytics Dashboard - ML-based forecasting
- [ ] Settings & Administration - user and system configuration

### Alerting System
- [ ] Implement metric-based alerting policies
- [ ] Add log-based alerting for near-real-time notifications
- [ ] Create notification channels (email, Slack, PagerDuty, webhooks)
- [ ] Add alert snooze and acknowledgment features
- [ ] Implement budget alerts for cost tracking
- [ ] Support PromQL-based alert queries

---

## 🟢 Medium Priority - Enhanced Features

### Dashboards
- [ ] Add predefined service-specific dashboards
- [ ] Implement custom dashboard builder with drag-and-drop
- [ ] Add more widget types (heatmaps, scorecards, gauges)
- [ ] Enable dashboard sharing across projects
- [ ] Implement SLO monitoring dashboards with error budgets

### Visualizations & Charts
- [ ] Build trace timeline visualization
- [ ] Add cost breakdown charts and graphs
- [ ] Implement predictive analytics visualizations
- [ ] Create service dependency maps

### Cost Monitoring
- [ ] Track ingestion, storage, and retention costs
- [ ] Display billing reports and optimization scenarios
- [ ] Add cost alerts for budget thresholds
- [ ] Show free tier usage and remaining allotments

### Predictive Analysis
- [ ] Implement ML-based resource growth predictions
- [ ] Add usage trend analysis
- [ ] Create capacity planning visualizations
- [ ] Predict potential bottlenecks

### Environment Management
- [ ] Add environment-specific views (dev, staging, prod)
- [ ] Implement resource grouping by labels/regions
- [ ] Support hybrid/multi-cloud monitoring (AWS, Azure)
- [ ] Add BindPlane integration for on-premises resources

---

## 🔵 Low Priority - Nice to Have

### UI/UX Improvements
- [x] Add dark/light theme toggle ✅ (Phase 1.1)
- [ ] Implement responsive mobile design
- [ ] Add keyboard shortcuts for power users
- [ ] Create guided onboarding experience
- [x] Add export functionality for reports (PDF, CSV) ✅ (Phase 1.3)

### Animations & Polish
- [ ] Add smooth page transitions
- [ ] Implement loading states and skeletons
- [ ] Add hover effects and micro-interactions
- [ ] Polish responsive design
- [ ] Optimize performance and animations

### Performance Optimization
- [ ] Implement data caching layer (Redis)
- [x] Add WebSocket support for real-time updates ✅ (Phase 1.2)
- [ ] Optimize large dataset pagination
- [ ] Add query result caching

### Integrations
- [ ] Add third-party app monitoring (Apache, MySQL, etc.)
- [ ] Implement Pub/Sub notification channel
- [ ] Add Google Cloud Mobile App integration
- [ ] Support custom webhook integrations

---

## 🛠️ Technical Debt

### Code Quality
- [ ] Add comprehensive unit tests (target: 80% coverage)
- [ ] Add integration tests for API endpoints
- [ ] Add end-to-end tests for critical user flows
- [ ] Remove unused OAuth code from sdk.ts
- [ ] Clean up deprecated Manus-related code

### Documentation
- [ ] Create API documentation (OpenAPI/Swagger)
- [ ] Write user guide for dashboard features
- [ ] Document deployment procedures
- [ ] Add troubleshooting guide

### Infrastructure
- [ ] Set up CI/CD pipeline
- [ ] Configure log rotation for application logs
- [ ] Add health check endpoints
- [ ] Implement graceful shutdown handling
- [ ] Set up monitoring for the application itself

### Mock Data System
- [ ] Create comprehensive mock data generators for all dashboards
- [ ] Generate realistic GCP project and environment data
- [ ] Create mock metrics data (CPU, memory, network, etc.)
- [ ] Generate mock log entries with various severity levels
- [ ] Create mock trace data for distributed tracing
- [ ] Generate mock alert and incident data
- [ ] Create mock cost data with trends
- [ ] Add seed script to populate database with mock data
- [ ] Design architecture for easy transition to real GCP APIs

---

## 📝 Notes

### Current Limitations
1. Application runs with mock data only (no real GCP integration)
2. Static authentication (admin/admin) - not suitable for production
3. No persistent storage without PostgreSQL configuration
4. InfluxDB integration requires separate setup

### Environment Variables Required for Production
See `.env` file for complete list. Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `GCP_PROJECT_ID` - GCP project for monitoring
- `GCP_SERVICE_ACCOUNT_JSON` - Service account credentials
- `INFLUXDB_*` - InfluxDB configuration (optional)
- `JWT_SECRET` - Secure session signing key

### Deployment Checklist
1. [ ] Configure production environment variables
2. [ ] Set up PostgreSQL database
3. [ ] Run database migrations
4. [ ] Configure GCP service account
5. [x] Update SSL certificates (replace self-signed) ✅ (Dec 1, 2025)
   - Official DigiCert certificate installed from PFX (password stored in `.env` file as `PFX_PASSWORD`)
   - Certificate extracted to: `/opt/Scripts/Observability/certs/eri2appdl12v.crt`
   - Private key extracted to: `/opt/Scripts/Observability/certs/eri2appdl12v.key`
   - X9 Financial PKI root certificate downloaded and converted to PEM
   - Full certificate chain created: `/opt/Scripts/Observability/certs/fullchain.crt`
   - Certificates copied to `/etc/nginx/ssl/` (resolved SELinux permissions)
   - NGINX configured with SSL on port 443 (for future CNAME: observability.corp.cvscaremark.com)
   - Frontend application serving official certificates on port 5443 ✅
   - Backend application serving official certificates on port 5442 ✅
   - Certificate valid until Nov 29, 2027
   - All services (frontend, backend, NGINX) running successfully with HTTPS
   - **Direct access URLs (working now):**
     - Frontend: `https://eri2appdl12v.corp.cvscaremark.com:5443/`
     - Backend API: `https://eri2appdl12v.corp.cvscaremark.com:5442/`
   - **CNAME URL (pending DNS setup):**
     - CNAME: `https://observability.corp.cvscaremark.com/` (port 443 via NGINX)
6. [x] Enable systemd services ✅
   - observability-frontend.service: active
   - observability-backend.service: active
   - nginx.service: active and enabled
7. [ ] Configure firewall rules for ports 5442/5443
8. [ ] Set up log aggregation
9. [ ] Configure backup procedures
10. [ ] **PENDING**: Test HTTPS access via CNAME `observability.corp.cvscaremark.com` (waiting for DNS propagation)

---

## 🌟 Wow Factor Features (Demo Enhancements)

### Priority 1 - Complete ✅
- [x] **AI Log Insights Generator** - AI-generated summaries, pattern detection, recommendations ✅
- [x] **Conversational AI Assistant** - ChatGPT-style chat interface for infrastructure queries ✅

### Priority 2 - COMPLETE ✅
- [x] **Incident Timeline with Blast Radius** - Visual incident story with affected services ✅
- [x] **Live Topology Map** - Interactive network visualization with react-flow ✅
- [x] **Smart Notification Center** - Slide-out panel with intelligent alert grouping ✅
- [x] **Executive Summary Dashboard** - One-click presentation-ready briefing ✅
- [x] **Animated Transitions** - Framer Motion for page transitions and micro-interactions ✅
- [x] **Comparison Mode** - Side-by-side analysis for time periods/environments ✅

### Priority 3 - COMPLETE ✅
- [x] **Capacity Planning Forecaster** - ML-based resource usage predictions with proactive scaling recommendations ✅
- [x] **Automated Runbook Executor** - One-click remediation actions with pre-defined runbooks for common issues ✅
- [x] **Multi-Tenant Cost Chargeback** - Department/team-level cost allocation with showback reports and budget alerts ✅
- [x] **Chaos Engineering Dashboard** - Controlled failure injection with resilience scoring and recovery metrics ✅
- [x] **Compliance & Audit Trail** - SOC2/HIPAA compliance monitoring with automated audit report generation ✅
- [x] **Custom Dashboard Builder** - Drag-and-drop widget placement with shareable dashboard templates ✅
- [x] **Intelligent Correlation Engine** - Cross-service anomaly correlation using graph-based dependency analysis ✅
- [x] **SRE Workbench** - Error budget tracking, incident postmortems, and reliability scorecards ✅
- [x] **API Health Monitor** - Endpoint-level latency, error rates, and SLA tracking with OpenAPI integration ✅
- [x] **Resource Tagging Governance** - Tag compliance scoring, missing tag detection, and policy enforcement ✅

### Priority 4 - NEW ✅
- [x] **GCP Firewall Dashboard** - Comprehensive firewall rule monitoring with AI-powered search, security insights, rule efficiency scoring, traffic analytics, and cross-dashboard integration ✅

### Priority 3 Routes (Dashboard URLs)
| Feature | Dashboard Route |
|---------|-----------------|
| API Health Monitor | `/dashboard/api-health` |
| SRE Workbench | `/dashboard/sre-workbench` |
| Capacity Planning Forecaster | `/dashboard/capacity-planning` |
| Resource Tagging Governance | `/dashboard/resource-tagging` |
| Compliance & Audit Trail | `/dashboard/compliance` |
| Multi-Tenant Cost Chargeback | `/dashboard/cost-chargeback` |
| Automated Runbook Executor | `/dashboard/runbooks` |
| Chaos Engineering Dashboard | `/dashboard/chaos-engineering` |
| Custom Dashboard Builder | `/dashboard/dashboard-builder` |
| Intelligent Correlation Engine | `/dashboard/correlation-engine` |
| **GCP Firewall Dashboard** | `/dashboard/firewall` |

### Documentation
- [x] **Feature Documentation** - Comprehensive README updates for all Priority 1 & 2 features ✅
- [ ] **Render Mermaid Diagrams** - Preview architecture diagrams from README.md

---

## ✅ Completed Demo Features

### Initial Features (4)
- [x] **NLP Search for Logs** - Natural language query parsing (severities, time ranges, keywords)
- [x] **Anomaly Detection** - Z-score based detection with chart visualization
- [x] **Grafana-Style Analytics** - Multi-panel dashboard with KPIs and heatmaps
- [x] **Trend Analysis & Predictive Alerting** - Linear regression forecasting

### Phase 1: Enhanced Features (8)
- [x] **1.1 Dark Mode Toggle** - Header toggle with system preference detection
- [x] **1.2 Real-time WebSocket Updates** - Live metric streaming every 3 seconds
- [x] **1.3 Export to PDF/CSV** - Reports, data, charts, and JSON export
- [x] **1.4 Custom Alert Rules** - CRUD interface for threshold-based alerting
- [x] **1.5 Correlation Analysis** - Scatter plots and correlation matrix
- [x] **1.6 Root Cause Analysis** - AI-powered with confidence scores
- [x] **1.7 Cost Optimization** - Usage analysis with recommendations
- [x] **1.8 SLA Tracking Dashboard** - Uptime and compliance monitoring

### Phase 2: Meeting Requirements (6)
- [x] **2.1 Overview Enhancements** - 70% threshold alerts, Notable Events, Health Status
- [x] **2.2 Drill-Down Level 1** - Infrastructure categories (Compute, GKE, Storage, etc.)
- [x] **2.3 Drill-Down Level 2** - Projects/VPCs with NCC connectivity
- [x] **2.4 Drill-Down Level 3** - Individual resources with metrics
- [x] **2.5 Network Analysis** - Top talkers, bandwidth, NCC monitoring
- [x] **2.6 Subnet Monitoring** - IP utilization, capacity planning alerts
