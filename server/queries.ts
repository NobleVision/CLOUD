/**
 * Database query helpers for GCP observability data
 */

import { desc, eq, and, gte, lte, sql } from 'drizzle-orm';
import { getDb } from './db';
import { gcpProjects, alerts, costRecords, metricSnapshots } from '../drizzle/schema';

/**
 * Get all GCP projects
 */
export async function getAllProjects() {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(gcpProjects).orderBy(gcpProjects.environment, gcpProjects.projectName);
  } catch (error) {
    console.error('[Queries] Failed to get projects:', error);
    return [];
  }
}

/**
 * Get projects by environment
 */
export async function getProjectsByEnvironment(environment: 'dev' | 'staging' | 'prod') {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(gcpProjects).where(eq(gcpProjects.environment, environment));
  } catch (error) {
    console.error('[Queries] Failed to get projects by environment:', error);
    return [];
  }
}

/**
 * Get active alerts
 */
export async function getActiveAlerts(projectId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const conditions = [eq(alerts.status, 'active')];
    if (projectId) {
      conditions.push(eq(alerts.projectId, projectId));
    }
    
    return await db
      .select()
      .from(alerts)
      .where(and(...conditions))
      .orderBy(desc(alerts.triggeredAt))
      .limit(100);
  } catch (error) {
    console.error('[Queries] Failed to get active alerts:', error);
    return [];
  }
}

/**
 * Get alerts by severity
 */
export async function getAlertsBySeverity(severity: 'critical' | 'warning' | 'info') {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.severity, severity))
      .orderBy(desc(alerts.triggeredAt))
      .limit(50);
  } catch (error) {
    console.error('[Queries] Failed to get alerts by severity:', error);
    return [];
  }
}

/**
 * Get cost records for a time range
 */
export async function getCostRecords(startDate: Date, endDate: Date, projectId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const conditions = [
      gte(costRecords.recordDate, startDate),
      lte(costRecords.recordDate, endDate),
    ];
    
    if (projectId) {
      conditions.push(eq(costRecords.projectId, projectId));
    }
    
    return await db
      .select()
      .from(costRecords)
      .where(and(...conditions))
      .orderBy(desc(costRecords.recordDate));
  } catch (error) {
    console.error('[Queries] Failed to get cost records:', error);
    return [];
  }
}

/**
 * Get cost summary by service
 */
export async function getCostSummaryByService(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db
      .select({
        serviceType: costRecords.serviceType,
        totalCost: sql<number>`sum(${costRecords.cost})`,
        recordCount: sql<number>`count(*)`,
      })
      .from(costRecords)
      .where(and(
        gte(costRecords.recordDate, startDate),
        lte(costRecords.recordDate, endDate)
      ))
      .groupBy(costRecords.serviceType)
      .orderBy(desc(sql`sum(${costRecords.cost})`));
  } catch (error) {
    console.error('[Queries] Failed to get cost summary:', error);
    return [];
  }
}

/**
 * Get metric snapshots for a resource
 */
export async function getMetricSnapshots(
  metricType: string,
  resourceName: string,
  startTime: Date,
  endTime: Date
) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db
      .select()
      .from(metricSnapshots)
      .where(and(
        eq(metricSnapshots.metricType, metricType),
        eq(metricSnapshots.resourceName, resourceName),
        gte(metricSnapshots.timestamp, startTime),
        lte(metricSnapshots.timestamp, endTime)
      ))
      .orderBy(metricSnapshots.timestamp);
  } catch (error) {
    console.error('[Queries] Failed to get metric snapshots:', error);
    return [];
  }
}

/**
 * Get latest metrics for all resources
 */
export async function getLatestMetrics(metricType: string, projectId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const conditions = [eq(metricSnapshots.metricType, metricType)];
    if (projectId) {
      conditions.push(eq(metricSnapshots.projectId, projectId));
    }
    
    // Get the latest snapshot for each resource
    return await db
      .select({
        resourceName: metricSnapshots.resourceName,
        value: metricSnapshots.value,
        timestamp: metricSnapshots.timestamp,
        projectId: metricSnapshots.projectId,
      })
      .from(metricSnapshots)
      .where(and(...conditions))
      .groupBy(metricSnapshots.resourceName)
      .orderBy(desc(metricSnapshots.timestamp));
  } catch (error) {
    console.error('[Queries] Failed to get latest metrics:', error);
    return [];
  }
}

/**
 * Get alert statistics
 */
export async function getAlertStatistics(projectId?: number) {
  const db = await getDb();
  if (!db) return { total: 0, critical: 0, warning: 0, info: 0, active: 0 };
  
  try {
    const conditions = projectId ? [eq(alerts.projectId, projectId)] : [];
    
    const stats = await db
      .select({
        severity: alerts.severity,
        status: alerts.status,
        count: sql<number>`count(*)`,
      })
      .from(alerts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(alerts.severity, alerts.status);
    
    const result = {
      total: 0,
      critical: 0,
      warning: 0,
      info: 0,
      active: 0,
    };
    
    stats.forEach(stat => {
      result.total += Number(stat.count);
      if (stat.status === 'active') {
        result.active += Number(stat.count);
      }
      if (stat.severity === 'critical') {
        result.critical += Number(stat.count);
      } else if (stat.severity === 'warning') {
        result.warning += Number(stat.count);
      } else if (stat.severity === 'info') {
        result.info += Number(stat.count);
      }
    });
    
    return result;
  } catch (error) {
    console.error('[Queries] Failed to get alert statistics:', error);
    return { total: 0, critical: 0, warning: 0, info: 0, active: 0 };
  }
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(alertId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  
  try {
    await db
      .update(alerts)
      .set({
        status: 'acknowledged',
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
      })
      .where(eq(alerts.id, alertId));
    
    return true;
  } catch (error) {
    console.error('[Queries] Failed to acknowledge alert:', error);
    return false;
  }
}

/**
 * Resolve an alert
 */
export async function resolveAlert(alertId: number) {
  const db = await getDb();
  if (!db) return false;
  
  try {
    await db
      .update(alerts)
      .set({
        status: 'resolved',
        resolvedAt: new Date(),
      })
      .where(eq(alerts.id, alertId));
    
    return true;
  } catch (error) {
    console.error('[Queries] Failed to resolve alert:', error);
    return false;
  }
}
