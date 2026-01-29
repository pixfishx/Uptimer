import { Hono } from 'hono';

import type { Env } from './env';
import { handleError, handleNotFound } from './middleware/errors';
import { adminRoutes } from './routes/admin';
import { publicRoutes } from './routes/public';

const app = new Hono<{ Bindings: Env }>();

app.onError(handleError);
app.notFound(handleNotFound);

app.get('/', (c) => c.text('ok'));

app.route('/api/v1/public', publicRoutes);
app.route('/api/v1/admin', adminRoutes);

export default app;
