import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export type MonitorType = 'http' | 'tcp';
export type MonitorStatus = 'up' | 'down' | 'maintenance' | 'paused' | 'unknown';
export type CheckStatus = 'up' | 'down' | 'maintenance' | 'unknown';
export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';
export type IncidentImpact = 'none' | 'minor' | 'major' | 'critical';
export type NotificationChannelType = 'webhook';
export type NotificationDeliveryStatus = 'success' | 'failed';

export const monitors = sqliteTable('monitors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').$type<MonitorType>().notNull(),
  target: text('target').notNull(),

  intervalSec: integer('interval_sec').notNull().default(60),
  timeoutMs: integer('timeout_ms').notNull().default(10000),

  httpMethod: text('http_method'),
  httpHeadersJson: text('http_headers_json'),
  httpBody: text('http_body'),
  expectedStatusJson: text('expected_status_json'),
  responseKeyword: text('response_keyword'),
  responseForbiddenKeyword: text('response_forbidden_keyword'),

  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(CAST(strftime('%s','now') AS INTEGER))`),
  updatedAt: integer('updated_at')
    .notNull()
    .default(sql`(CAST(strftime('%s','now') AS INTEGER))`),
});

export const monitorState = sqliteTable('monitor_state', {
  monitorId: integer('monitor_id').primaryKey(),
  status: text('status').$type<MonitorStatus>().notNull(),
  lastCheckedAt: integer('last_checked_at'),
  lastChangedAt: integer('last_changed_at'),
  lastLatencyMs: integer('last_latency_ms'),
  lastError: text('last_error'),
  consecutiveFailures: integer('consecutive_failures').notNull().default(0),
  consecutiveSuccesses: integer('consecutive_successes').notNull().default(0),
});

export const checkResults = sqliteTable(
  'check_results',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    monitorId: integer('monitor_id').notNull(),
    checkedAt: integer('checked_at').notNull(),
    status: text('status').$type<CheckStatus>().notNull(),
    latencyMs: integer('latency_ms'),
    httpStatus: integer('http_status'),
    error: text('error'),
    location: text('location'),
    attempt: integer('attempt').notNull().default(1),
  },
  (t) => ({
    monitorTimeIdx: index('idx_check_results_monitor_time').on(t.monitorId, t.checkedAt),
  })
);

export const outages = sqliteTable(
  'outages',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    monitorId: integer('monitor_id').notNull(),
    startedAt: integer('started_at').notNull(),
    endedAt: integer('ended_at'),
    initialError: text('initial_error'),
    lastError: text('last_error'),
  },
  (t) => ({
    monitorStartIdx: index('idx_outages_monitor_start').on(t.monitorId, t.startedAt),
  })
);

export const incidents = sqliteTable('incidents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  status: text('status').$type<IncidentStatus>().notNull(),
  impact: text('impact').$type<IncidentImpact>().notNull().default('minor'),
  message: text('message'),
  startedAt: integer('started_at')
    .notNull()
    .default(sql`(CAST(strftime('%s','now') AS INTEGER))`),
  resolvedAt: integer('resolved_at'),
});

export const incidentUpdates = sqliteTable(
  'incident_updates',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    incidentId: integer('incident_id').notNull(),
    status: text('status').$type<IncidentStatus>(),
    message: text('message').notNull(),
    createdAt: integer('created_at')
      .notNull()
      .default(sql`(CAST(strftime('%s','now') AS INTEGER))`),
  },
  (t) => ({
    incidentTimeIdx: index('idx_incident_updates_incident_time').on(t.incidentId, t.createdAt),
  })
);

export const maintenanceWindows = sqliteTable('maintenance_windows', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  message: text('message'),
  startsAt: integer('starts_at').notNull(),
  endsAt: integer('ends_at').notNull(),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(CAST(strftime('%s','now') AS INTEGER))`),
});

export const notificationChannels = sqliteTable('notification_channels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').$type<NotificationChannelType>().notNull(),
  configJson: text('config_json').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(CAST(strftime('%s','now') AS INTEGER))`),
});

export const notificationDeliveries = sqliteTable(
  'notification_deliveries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    eventKey: text('event_key').notNull(),
    channelId: integer('channel_id').notNull(),
    status: text('status').$type<NotificationDeliveryStatus>().notNull(),
    httpStatus: integer('http_status'),
    error: text('error'),
    createdAt: integer('created_at')
      .notNull()
      .default(sql`(CAST(strftime('%s','now') AS INTEGER))`),
  },
  (t) => ({
    eventChannelUniq: uniqueIndex('uq_notification_event_channel').on(t.eventKey, t.channelId),
  })
);

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const locks = sqliteTable('locks', {
  name: text('name').primaryKey(),
  expiresAt: integer('expires_at').notNull(),
});

