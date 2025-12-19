import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // GCP Projects
  projects: router({
    list: publicProcedure.query(async () => {
      const { getAllProjects } = await import('./queries');
      return getAllProjects();
    }),
    byEnvironment: publicProcedure
      .input(z.object({ environment: z.enum(['dev', 'staging', 'prod']) }))
      .query(async ({ input }) => {
        const { getProjectsByEnvironment } = await import('./queries');
        return getProjectsByEnvironment(input.environment);
      }),
  }),

  // Alerts and Incidents
  alerts: router({
    active: publicProcedure
      .input(z.object({ projectId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        const { getActiveAlerts } = await import('./queries');
        return getActiveAlerts(input?.projectId);
      }),
    bySeverity: publicProcedure
      .input(z.object({ severity: z.enum(['critical', 'warning', 'info']) }))
      .query(async ({ input }) => {
        const { getAlertsBySeverity } = await import('./queries');
        return getAlertsBySeverity(input.severity);
      }),
    statistics: publicProcedure
      .input(z.object({ projectId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        const { getAlertStatistics } = await import('./queries');
        return getAlertStatistics(input?.projectId);
      }),
    acknowledge: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { acknowledgeAlert } = await import('./queries');
        return acknowledgeAlert(input.alertId, ctx.user.id);
      }),
    resolve: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ input }) => {
        const { resolveAlert } = await import('./queries');
        return resolveAlert(input.alertId);
      }),
  }),

  // Metrics
  metrics: router({
    query: publicProcedure
      .input(z.object({
        measurement: z.string(),
        timeRange: z.string().default('-1h'),
        filters: z.record(z.string(), z.string()).optional(),
      }))
      .query(async ({ input }) => {
        const { queryMetrics } = await import('./influxdb');
        return queryMetrics(input.measurement, input.timeRange, input.filters as Record<string, string> | undefined);
      }),
    latest: publicProcedure
      .input(z.object({
        metricType: z.string(),
        projectId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { getLatestMetrics } = await import('./queries');
        return getLatestMetrics(input.metricType, input.projectId);
      }),
    snapshots: publicProcedure
      .input(z.object({
        metricType: z.string(),
        resourceName: z.string(),
        startTime: z.date(),
        endTime: z.date(),
      }))
      .query(async ({ input }) => {
        const { getMetricSnapshots } = await import('./queries');
        return getMetricSnapshots(input.metricType, input.resourceName, input.startTime, input.endTime);
      }),
  }),

  // Logs
  logs: router({
    list: publicProcedure
      .input(z.object({ count: z.number().default(100) }).optional())
      .query(async ({ input }) => {
        const { generateMockLogs } = await import('./mockData');
        return generateMockLogs(input?.count || 100);
      }),
  }),

  // Traces
  traces: router({
    list: publicProcedure
      .input(z.object({ count: z.number().default(20) }).optional())
      .query(async ({ input }) => {
        const { generateMockTraces } = await import('./mockData');
        return generateMockTraces(input?.count || 20);
      }),
  }),

  // Costs
  costs: router({
    records: publicProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
        projectId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { getCostRecords } = await import('./queries');
        return getCostRecords(input.startDate, input.endDate, input.projectId);
      }),
    summaryByService: publicProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        const { getCostSummaryByService } = await import('./queries');
        return getCostSummaryByService(input.startDate, input.endDate);
      }),
  }),

  // Mock Data Management
  mockData: router({
    seedAll: protectedProcedure.mutation(async () => {
      const { seedAllMockData } = await import('./mockData');
      await seedAllMockData();
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
