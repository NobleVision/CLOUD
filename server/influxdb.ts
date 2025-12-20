import { InfluxDB, Point } from '@influxdata/influxdb-client';

let _influxClient: InfluxDB | null = null;

/**
 * Get or create InfluxDB client instance
 * Credentials should be provided via environment variables:
 * - INFLUXDB_URL: InfluxDB server URL (e.g., https://us-east-1-1.aws.cloud2.influxdata.com)
 * - INFLUXDB_TOKEN: Authentication token
 * - INFLUXDB_ORG: Organization name (e.g., GluNet)
 * - INFLUXDB_BUCKET: Default bucket name (e.g., CLOUD)
 */
export function getInfluxClient(): InfluxDB | null {
  if (_influxClient) {
    return _influxClient;
  }

  const url = process.env.INFLUXDB_URL;
  const token = process.env.INFLUXDB_TOKEN;

  if (!url || !token) {
    console.warn('[InfluxDB] Missing credentials. Set INFLUXDB_URL and INFLUXDB_TOKEN environment variables.');
    return null;
  }

  try {
    _influxClient = new InfluxDB({ url, token });
    console.log('[InfluxDB] Client initialized successfully');
    return _influxClient;
  } catch (error) {
    console.error('[InfluxDB] Failed to initialize client:', error);
    return null;
  }
}

/**
 * Query metrics from InfluxDB
 * Falls back to mock data if InfluxDB is not configured
 */
export async function queryMetrics(
  measurement: string,
  timeRange: string = '-1h',
  filters?: Record<string, string>
): Promise<any[]> {
  const client = getInfluxClient();
  
  if (!client) {
    const mockData = generateMockMetrics(measurement, timeRange);
    console.log(`[InfluxDB] Using mock data for ${measurement}, timeRange=${timeRange}, points=${mockData.length}`);
    return mockData;
  }

  const org = process.env.INFLUXDB_ORG || '';
  const bucket = process.env.INFLUXDB_BUCKET || '';

  if (!org || !bucket) {
    console.warn('[InfluxDB] Missing INFLUXDB_ORG or INFLUXDB_BUCKET');
    return generateMockMetrics(measurement, timeRange);
  }

  try {
    const queryApi = client.getQueryApi(org);
    
    let filterClause = '';
    if (filters) {
      const filterParts = Object.entries(filters).map(([key, value]) => `r["${key}"] == "${value}"`);
      filterClause = filterParts.length > 0 ? `|> filter(fn: (r) => ${filterParts.join(' and ')})` : '';
    }

    const query = `
      from(bucket: "${bucket}")
        |> range(start: ${timeRange})
        |> filter(fn: (r) => r["_measurement"] == "${measurement}")
        ${filterClause}
    `;

    const results: any[] = [];
    
    return new Promise((resolve, reject) => {
      queryApi.queryRows(query, {
        next(row, tableMeta) {
          const record = tableMeta.toObject(row);
          results.push(record);
        },
        error(error) {
          console.error('[InfluxDB] Query error:', error);
          reject(error);
        },
        complete() {
          resolve(results);
        },
      });
    });
  } catch (error) {
    console.error('[InfluxDB] Query failed:', error);
    return generateMockMetrics(measurement, timeRange);
  }
}

/**
 * Write metrics to InfluxDB
 * Silently fails if InfluxDB is not configured (for demo mode)
 */
export async function writeMetrics(
  measurement: string,
  tags: Record<string, string>,
  fields: Record<string, number>,
  timestamp?: Date
): Promise<boolean> {
  const client = getInfluxClient();
  
  if (!client) {
    console.log('[InfluxDB] Write skipped (client not configured)');
    return false;
  }

  const org = process.env.INFLUXDB_ORG || '';
  const bucket = process.env.INFLUXDB_BUCKET || '';

  if (!org || !bucket) {
    console.warn('[InfluxDB] Missing INFLUXDB_ORG or INFLUXDB_BUCKET');
    return false;
  }

  try {
    const writeApi = client.getWriteApi(org, bucket);
    
    const point = new Point(measurement);
    
    Object.entries(tags).forEach(([key, value]) => {
      point.tag(key, value);
    });
    
    Object.entries(fields).forEach(([key, value]) => {
      point.floatField(key, value);
    });
    
    if (timestamp) {
      point.timestamp(timestamp);
    }
    
    writeApi.writePoint(point);
    await writeApi.close();
    
    return true;
  } catch (error) {
    console.error('[InfluxDB] Write failed:', error);
    return false;
  }
}

/**
 * Generate mock metrics data for demo purposes
 */
function generateMockMetrics(measurement: string, timeRange: string): any[] {
  const now = Date.now();
  const points: any[] = [];
  
  // Parse time range (e.g., "-1h", "-24h", "-7d")
  const match = timeRange.match(/^-(\d+)([hmd])$/);
  if (!match) {
    return points;
  }
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  let intervalMs = 60000; // 1 minute default
  let numPoints = 60;
  
  switch (unit) {
    case 'h':
      intervalMs = value * 60 * 1000 / 60; // 60 points per hour range
      numPoints = 60;
      break;
    case 'd':
      intervalMs = value * 24 * 60 * 1000 / 100; // 100 points per day range
      numPoints = 100;
      break;
    case 'm':
      intervalMs = value * 60 * 1000 / 60; // 60 points per minute range
      numPoints = 60;
      break;
  }
  
  for (let i = 0; i < numPoints; i++) {
    const timestamp = new Date(now - (numPoints - i) * intervalMs);
    
    let value = 0;
    switch (measurement) {
      case 'cpu_usage':
        value = 40 + Math.random() * 30 + Math.sin(i / 10) * 15;
        break;
      case 'memory_usage':
        value = 60 + Math.random() * 20 + Math.sin(i / 8) * 10;
        break;
      case 'network_throughput':
        value = 1000 + Math.random() * 500 + Math.sin(i / 5) * 300;
        break;
      case 'disk_io':
        value = 200 + Math.random() * 100;
        break;
      case 'request_latency':
        value = 50 + Math.random() * 100 + (Math.random() > 0.95 ? 200 : 0);
        break;
      case 'error_rate':
        value = Math.random() * 5 + (Math.random() > 0.9 ? 10 : 0);
        break;
      default:
        value = Math.random() * 100;
    }
    
    points.push({
      _time: timestamp.toISOString(),
      _measurement: measurement,
      _field: 'value',
      _value: value,
      environment: 'prod',
      project: 'adp-main',
    });
  }
  
  return points;
}
