import { Hono } from 'hono';
import { z } from 'zod';

import {
  expectedStatusJsonSchema,
  getDb,
  httpHeadersJsonSchema,
  monitors,
  parseDbJsonNullable,
  serializeDbJsonNullable,
} from '@uptimer/db';

import type { Env } from '../env';
import { requireAdmin } from '../middleware/auth';
import { AppError } from '../middleware/errors';
import { createMonitorInputSchema } from '../schemas/monitors';

export const adminRoutes = new Hono<{ Bindings: Env }>();

adminRoutes.use('*', requireAdmin);

function monitorRowToApi(row: typeof monitors.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    target: row.target,
    interval_sec: row.intervalSec,
    timeout_ms: row.timeoutMs,
    http_method: row.httpMethod,
    http_headers_json: parseDbJsonNullable(httpHeadersJsonSchema, row.httpHeadersJson, {
      field: 'http_headers_json',
    }),
    http_body: row.httpBody,
    expected_status_json: parseDbJsonNullable(expectedStatusJsonSchema, row.expectedStatusJson, {
      field: 'expected_status_json',
    }),
    response_keyword: row.responseKeyword,
    response_forbidden_keyword: row.responseForbiddenKeyword,
    is_active: row.isActive,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

adminRoutes.get('/monitors', async (c) => {
  const limit = z.coerce.number().int().min(1).max(200).optional().default(50).parse(c.req.query('limit'));
  const db = getDb(c.env);
  const rows = await db.select().from(monitors).orderBy(monitors.id).limit(limit).all();
  return c.json({ monitors: rows.map(monitorRowToApi) });
});

adminRoutes.post('/monitors', async (c) => {
  const rawBody = await c.req.json().catch(() => {
    throw new AppError(400, 'INVALID_ARGUMENT', 'Invalid JSON body');
  });
  const input = createMonitorInputSchema.parse(rawBody);

  const db = getDb(c.env);
  const now = Math.floor(Date.now() / 1000);

  const inserted = await db
    .insert(monitors)
    .values({
      name: input.name,
      type: input.type,
      target: input.target,
      intervalSec: input.interval_sec ?? 60,
      timeoutMs: input.timeout_ms ?? 10000,

      httpMethod: input.type === 'http' ? (input.http_method ?? null) : null,
      httpHeadersJson:
        input.type === 'http'
          ? serializeDbJsonNullable(httpHeadersJsonSchema, input.http_headers_json ?? null, {
              field: 'http_headers_json',
            })
          : null,
      httpBody: input.type === 'http' ? (input.http_body ?? null) : null,
      expectedStatusJson:
        input.type === 'http'
          ? serializeDbJsonNullable(expectedStatusJsonSchema, input.expected_status_json ?? null, {
              field: 'expected_status_json',
            })
          : null,
      responseKeyword: input.type === 'http' ? (input.response_keyword ?? null) : null,
      responseForbiddenKeyword: input.type === 'http' ? (input.response_forbidden_keyword ?? null) : null,

      isActive: input.is_active ?? true,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  return c.json({ monitor: monitorRowToApi(inserted) }, 201);
});
