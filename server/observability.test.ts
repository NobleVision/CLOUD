import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@cvs.com",
    name: "Test User",
    loginMethod: "test",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Projects API", () => {
  it("should list all projects", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const projects = await caller.projects.list();
    
    expect(Array.isArray(projects)).toBe(true);
    // Projects may be empty initially, that's ok
  });

  it("should filter projects by environment", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const prodProjects = await caller.projects.byEnvironment({ environment: 'prod' });
    
    expect(Array.isArray(prodProjects)).toBe(true);
    // All returned projects should be prod environment
    prodProjects.forEach(project => {
      expect(project.environment).toBe('prod');
    });
  });
});

describe("Alerts API", () => {
  it("should get active alerts", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const alerts = await caller.alerts.active();
    
    expect(Array.isArray(alerts)).toBe(true);
  });

  it("should get alert statistics", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.alerts.statistics();
    
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('critical');
    expect(stats).toHaveProperty('warning');
    expect(stats).toHaveProperty('info');
    expect(stats).toHaveProperty('active');
    
    expect(typeof stats.total).toBe('number');
    expect(typeof stats.critical).toBe('number');
    expect(typeof stats.warning).toBe('number');
    expect(typeof stats.info).toBe('number');
    expect(typeof stats.active).toBe('number');
  });

  it("should filter alerts by severity", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const criticalAlerts = await caller.alerts.bySeverity({ severity: 'critical' });
    
    expect(Array.isArray(criticalAlerts)).toBe(true);
    criticalAlerts.forEach(alert => {
      expect(alert.severity).toBe('critical');
    });
  });
});

describe("Metrics API", () => {
  it("should query metrics with default time range", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const metrics = await caller.metrics.query({
      measurement: 'cpu_usage',
      timeRange: '-1h',
    });
    
    expect(Array.isArray(metrics)).toBe(true);
    
    // Check mock data structure
    if (metrics.length > 0) {
      const firstMetric = metrics[0];
      expect(firstMetric).toHaveProperty('_time');
      expect(firstMetric).toHaveProperty('_measurement');
      expect(firstMetric).toHaveProperty('_value');
    }
  });

  it("should query metrics with custom time range", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const metrics = await caller.metrics.query({
      measurement: 'memory_usage',
      timeRange: '-24h',
    });
    
    expect(Array.isArray(metrics)).toBe(true);
  });

  it("should query metrics with filters", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const metrics = await caller.metrics.query({
      measurement: 'cpu_usage',
      timeRange: '-1h',
      filters: {
        environment: 'prod',
        project: 'cvs-main',
      },
    });
    
    expect(Array.isArray(metrics)).toBe(true);
  });
});

describe("Logs API", () => {
  it("should list logs with default count", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const logs = await caller.logs.list();
    
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.length).toBeLessThanOrEqual(100);
    
    // Check log structure
    const firstLog = logs[0];
    expect(firstLog).toHaveProperty('timestamp');
    expect(firstLog).toHaveProperty('severity');
    expect(firstLog).toHaveProperty('message');
    expect(firstLog).toHaveProperty('resource');
    expect(firstLog).toHaveProperty('project');
    expect(firstLog).toHaveProperty('environment');
  });

  it("should list logs with custom count", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const logs = await caller.logs.list({ count: 50 });
    
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeLessThanOrEqual(50);
  });
});

describe("Traces API", () => {
  it("should list traces with default count", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const traces = await caller.traces.list();
    
    expect(Array.isArray(traces)).toBe(true);
    expect(traces.length).toBeGreaterThan(0);
    
    // Check trace structure
    const firstTrace = traces[0];
    expect(firstTrace).toHaveProperty('traceId');
    expect(firstTrace).toHaveProperty('spanId');
    expect(firstTrace).toHaveProperty('name');
    expect(firstTrace).toHaveProperty('startTime');
    expect(firstTrace).toHaveProperty('duration');
    expect(firstTrace).toHaveProperty('status');
    expect(firstTrace).toHaveProperty('service');
  });

  it("should list traces with custom count", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const traces = await caller.traces.list({ count: 10 });
    
    expect(Array.isArray(traces)).toBe(true);
    expect(traces.length).toBeGreaterThan(0);
  });
});

describe("Costs API", () => {
  it("should get cost records for date range", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    const costs = await caller.costs.records({
      startDate,
      endDate,
    });
    
    expect(Array.isArray(costs)).toBe(true);
  });

  it("should get cost summary by service", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    const summary = await caller.costs.summaryByService({
      startDate,
      endDate,
    });
    
    expect(Array.isArray(summary)).toBe(true);
  });
});

describe("Mock Data Seeding", () => {
  it("should seed all mock data successfully", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.mockData.seedAll();
    
    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);
  });
});

describe("Authentication", () => {
  it("should return current user info", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();
    
    expect(user).toBeDefined();
    expect(user?.email).toBe('test@cvs.com');
    expect(user?.role).toBe('admin');
  });

  it("should logout successfully", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();
    
    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);
  });
});
