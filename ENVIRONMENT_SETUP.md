# Environment Variables Setup Guide

This document explains all environment variables needed for the ADP GCP Observability Dashboard.

## 📋 Required Variables

### Database Configuration

#### `DATABASE_URL` (Required)
PostgreSQL connection string for persistent data storage.

**Format**: `postgresql://username:password@host:port/database`

**Example**: `postgresql://admin:mypassword@db.example.com:5432/adp_observability`

**How to add**:
1. Go to Management UI → Settings → Secrets
2. Click "Add Secret"
3. Key: `DATABASE_URL`
4. Value: Your PostgreSQL connection string
5. Click "Save"

---

## 🔧 Optional Variables

### InfluxDB Configuration (Time-Series Metrics)

If not configured, the application will use mock data for metrics.

#### `INFLUXDB_URL`
InfluxDB instance URL (also known as INFLUXDB_HOST)

**Example**: `https://us-east-1-1.aws.cloud2.influxdata.com`

#### `INFLUXDB_TOKEN`
Authentication token for InfluxDB

**Example**: `OXPJ8LExajb4SDBequmLJ3gFjDgsKDGR-0SEwZYwYpuD35NDukwKvEIvt-T5O-_hpLARcnDx_03oCnSmMVHchA==`

#### `INFLUXDB_ORG`
InfluxDB organization name

**Example**: `GluNet`

#### `INFLUXDB_BUCKET`
Bucket name for storing metrics

**Example**: `CLOUD`

**How to add all InfluxDB variables**:
1. Go to Management UI → Settings → Secrets
2. Add each variable separately using the "Add Secret" button

---

### Google Cloud Platform API Configuration

If not configured, the application will use mock data for GCP resources.

#### `GCP_PROJECT_ID`
Your GCP project ID

**Example**: `adp-production-12345`

#### `GCP_SERVICE_ACCOUNT_JSON`
Complete service account JSON key as a string

**Example**:
```json
{"type":"service_account","project_id":"adp-production-12345","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\n...","client_email":"adp-observability@adp-production-12345.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/adp-observability%40adp-production-12345.iam.gserviceaccount.com"}
```

**How to get GCP Service Account JSON**:
1. Go to GCP Console → IAM & Admin → Service Accounts
2. Create new service account or select existing one
3. Grant required roles:
   - `roles/monitoring.viewer` - For Cloud Monitoring
   - `roles/logging.viewer` - For Cloud Logging
   - `roles/cloudtrace.user` - For Cloud Trace
4. Click "Keys" → "Add Key" → "Create New Key" → JSON
5. Download the JSON file
6. Copy the entire JSON content as a single line

#### `GCP_MONITORING_ENABLED`
Enable/disable GCP Monitoring API integration

**Values**: `true` or `false`
**Default**: `true`

#### `GCP_LOGGING_ENABLED`
Enable/disable GCP Logging API integration

**Values**: `true` or `false`
**Default**: `true`

#### `GCP_TRACE_ENABLED`
Enable/disable GCP Trace API integration

**Values**: `true` or `false`
**Default**: `true`

---

## 🔔 Optional Notification Integrations

### Slack Notifications

#### `SLACK_WEBHOOK_URL`
Slack webhook URL for sending alert notifications

**Example**: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX`

**How to get**:
1. Go to https://api.slack.com/apps
2. Create new app or select existing
3. Enable "Incoming Webhooks"
4. Add new webhook to workspace
5. Copy webhook URL

---

### Email Notifications (SMTP)

#### `SMTP_HOST`
SMTP server hostname

**Example**: `smtp.gmail.com`

#### `SMTP_PORT`
SMTP server port

**Example**: `587` (TLS) or `465` (SSL)

#### `SMTP_USER`
SMTP authentication username

**Example**: `notifications@adp.com`

#### `SMTP_PASSWORD`
SMTP authentication password

**Example**: `your-app-specific-password`

#### `SMTP_FROM`
From email address for notifications

**Example**: `noreply@adp.com`

---

## 🔒 Security Variables (Optional)

### Rate Limiting

#### `RATE_LIMIT_ENABLED`
Enable API rate limiting

**Values**: `true` or `false`
**Default**: `false`

#### `RATE_LIMIT_MAX_REQUESTS`
Maximum requests per window

**Example**: `100`

#### `RATE_LIMIT_WINDOW_MS`
Time window in milliseconds

**Example**: `900000` (15 minutes)

---

### CORS Configuration

#### `CORS_ORIGINS`
Comma-separated list of allowed origins

**Example**: `https://adp.com,https://www.adp.com,https://admin.adp.com`

---

## 🎯 System Variables

These variables are used for application configuration:

- `JWT_SECRET` - Session signing secret (generate a secure random string for production)
- `PORT` - Backend server port (default: 5442)
- `SSL_KEY_PATH` - Path to SSL private key
- `SSL_CERT_PATH` - Path to SSL certificate
- `USE_MOCK_DATA` - Enable mock data mode (default: true)
- `DEMO_USERNAME` - Demo login username (default: admin)
- `DEMO_PASSWORD` - Demo login password (default: admin)

---

## 📝 Quick Setup Checklist

### Minimum Setup (Demo with Mock Data)
- [ ] No configuration needed! Application works with mock data out of the box

### Basic Setup (Persistent Storage)
- [ ] Add `DATABASE_URL` for PostgreSQL

### Full Setup (Real GCP Data)
- [ ] Add `DATABASE_URL` for PostgreSQL
- [ ] Add `GCP_PROJECT_ID`
- [ ] Add `GCP_SERVICE_ACCOUNT_JSON`
- [ ] Optional: Add InfluxDB credentials for time-series storage
- [ ] Optional: Add notification integrations (Slack, Email)

---

## 🔧 Local Development Setup

For local development:

1. Copy `.env` template with placeholder values
2. Fill in required values or use mock data mode
3. Run `pnpm install`
4. Run `pnpm db:push` to setup database (if using PostgreSQL)
5. Run `pnpm dev` to start development server
6. Run `pnpm build` to build for production

---

## 🆘 Troubleshooting

### Database Connection Issues

**Error**: "Connection refused" or "Unable to connect to database"

**Solution**: 
- Verify your DATABASE_URL connection string is correctly formatted
- Check firewall rules allow connection from your IP
- Ensure the database host is accessible from your network
- For Vercel deployments, ensure DATABASE_URL is set in environment variables

### GCP API Authentication Issues

**Error**: "Could not load the default credentials"

**Solution**:
- Verify `GCP_SERVICE_ACCOUNT_JSON` is valid JSON
- Ensure service account has required IAM roles
- Check that required APIs are enabled in GCP Console

### InfluxDB Connection Issues

**Error**: "Failed to connect to InfluxDB"

**Solution**:
- Verify `INFLUXDB_URL` is correct
- Check `INFLUXDB_TOKEN` is valid and not expired
- Ensure organization and bucket names are correct
- Verify network connectivity to InfluxDB instance

---

## 📚 Additional Resources

- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [InfluxDB Cloud Setup](https://docs.influxdata.com/influxdb/cloud/)
- [GCP Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [Slack Webhooks](https://api.slack.com/messaging/webhooks)

---

**Last Updated**: November 26, 2025
