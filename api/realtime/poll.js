// Bundled for Vercel Serverless
import { createRequire } from 'module';
const require = createRequire(import.meta.url);


// api/realtime/poll.ts
function generateMetricUpdate() {
  const metrics = ["cpu_usage", "memory_usage", "network_throughput", "disk_io", "request_latency", "error_rate"];
  const metric = metrics[Math.floor(Math.random() * metrics.length)];
  const baseValues = {
    cpu_usage: 45,
    memory_usage: 62,
    network_throughput: 150,
    disk_io: 450,
    request_latency: 125,
    error_rate: 0.5
  };
  return {
    type: "metric_update",
    data: {
      measurement: metric,
      value: baseValues[metric] + (Math.random() - 0.5) * baseValues[metric] * 0.4,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      tags: {
        environment: Math.random() > 0.5 ? "production" : "staging",
        region: ["us-central1", "us-east1", "europe-west1"][Math.floor(Math.random() * 3)]
      }
    }
  };
}
function generateSystemStatus() {
  const services = ["api-gateway", "auth-service", "data-processor", "cache-service", "db-primary"];
  return {
    type: "system_status",
    data: {
      services: services.map((name) => ({
        name,
        status: Math.random() > 0.9 ? "warning" : "healthy",
        latency: Math.floor(Math.random() * 50) + 10
      })),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
}
function generateAlert() {
  if (Math.random() > 0.3) {
    return null;
  }
  const alerts = [
    { severity: "warning", message: "CPU usage approaching threshold", metric: "cpu_usage", value: 78, threshold: 80 },
    { severity: "warning", message: "Memory usage elevated", metric: "memory_usage", value: 82, threshold: 85 },
    { severity: "info", message: "Scaling event triggered", metric: "request_count", value: 1500, threshold: 1e3 },
    { severity: "critical", message: "Error rate spike detected", metric: "error_rate", value: 5.2, threshold: 5 }
  ];
  const alert = alerts[Math.floor(Math.random() * alerts.length)];
  return {
    type: "alert",
    data: {
      ...alert,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }
  };
}
async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const includeMetrics = req.query.metrics !== "false";
  const includeStatus = req.query.status !== "false";
  const includeAlerts = req.query.alerts !== "false";
  const updates = [];
  if (includeMetrics) {
    const metricCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < metricCount; i++) {
      updates.push(generateMetricUpdate());
    }
  }
  if (includeStatus) {
    updates.push(generateSystemStatus());
  }
  if (includeAlerts) {
    const alert = generateAlert();
    if (alert) {
      updates.push(alert);
    }
  }
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  return res.json({
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    updates
  });
}
export {
  handler as default
};
