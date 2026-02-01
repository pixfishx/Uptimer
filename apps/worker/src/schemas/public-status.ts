import { z } from 'zod';

const monitorStatusSchema = z.enum(['up', 'down', 'maintenance', 'paused', 'unknown']);
const checkStatusSchema = z.enum(['up', 'down', 'maintenance', 'unknown']);

const incidentStatusSchema = z.enum(['investigating', 'identified', 'monitoring', 'resolved']);
const incidentImpactSchema = z.enum(['none', 'minor', 'major', 'critical']);

const incidentUpdateSchema = z.object({
  id: z.number().int().positive(),
  incident_id: z.number().int().positive(),
  status: incidentStatusSchema.nullable(),
  message: z.string(),
  created_at: z.number().int().nonnegative(),
});

const incidentSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  status: incidentStatusSchema,
  impact: incidentImpactSchema,
  message: z.string().nullable(),
  started_at: z.number().int().nonnegative(),
  resolved_at: z.number().int().nonnegative().nullable(),
  monitor_ids: z.array(z.number().int().positive()),
  updates: z.array(incidentUpdateSchema),
});

const maintenanceWindowSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  message: z.string().nullable(),
  starts_at: z.number().int().nonnegative(),
  ends_at: z.number().int().nonnegative(),
  created_at: z.number().int().nonnegative(),
  monitor_ids: z.array(z.number().int().positive()),
});

const heartbeatSchema = z.object({
  checked_at: z.number().int().nonnegative(),
  status: checkStatusSchema,
  latency_ms: z.number().int().nonnegative().nullable(),
});

const publicMonitorSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  type: z.enum(['http', 'tcp']),
  status: monitorStatusSchema,
  is_stale: z.boolean(),
  last_checked_at: z.number().int().nonnegative().nullable(),
  last_latency_ms: z.number().int().nonnegative().nullable(),
  heartbeats: z.array(heartbeatSchema),
});

const bannerSchema = z.discriminatedUnion('source', [
  z.object({
    source: z.literal('incident'),
    status: z.enum(['operational', 'partial_outage', 'major_outage', 'maintenance', 'unknown']),
    title: z.string(),
    incident: z
      .object({
        id: z.number().int().positive(),
        title: z.string(),
        status: incidentStatusSchema,
        impact: incidentImpactSchema,
      })
      .nullable(),
  }),
  z.object({
    source: z.literal('maintenance'),
    status: z.enum(['operational', 'partial_outage', 'major_outage', 'maintenance', 'unknown']),
    title: z.string(),
    maintenance_window: z
      .object({
        id: z.number().int().positive(),
        title: z.string(),
        starts_at: z.number().int().nonnegative(),
        ends_at: z.number().int().nonnegative(),
      })
      .nullable(),
  }),
  z.object({
    source: z.literal('monitors'),
    status: z.enum(['operational', 'partial_outage', 'major_outage', 'maintenance', 'unknown']),
    title: z.string(),
    down_ratio: z.number().nullable().optional(),
  }),
]);

export const publicStatusResponseSchema = z.object({
  generated_at: z.number().int().nonnegative(),
  overall_status: monitorStatusSchema,
  banner: bannerSchema,
  summary: z.object({
    up: z.number().int().nonnegative(),
    down: z.number().int().nonnegative(),
    maintenance: z.number().int().nonnegative(),
    paused: z.number().int().nonnegative(),
    unknown: z.number().int().nonnegative(),
  }),
  monitors: z.array(publicMonitorSchema),
  active_incidents: z.array(incidentSchema),
  maintenance_windows: z.object({
    active: z.array(maintenanceWindowSchema),
    upcoming: z.array(maintenanceWindowSchema),
  }),
});

export type PublicStatusResponse = z.infer<typeof publicStatusResponseSchema>;
