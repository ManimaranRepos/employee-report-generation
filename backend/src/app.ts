import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { config } from './config.js';
import employeesRouter from './routes/employees.js';

export function createApp() {
  const app = express();

  // Disable CSP so the React SPA and PDF iframe load correctly
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(compression());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '256kb' }));
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

  app.use('/api/', rateLimit({
    windowMs: 60_000,
    max: 240,
    standardHeaders: true,
    legacyHeaders: false,
  }));

  app.use('/api/employees', employeesRouter);

  // API 404 — must appear before the frontend static handler
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found', path: req.path }));

  if (config.env === 'production') {
    const frontendDist = path.join(process.cwd(), '../frontend/dist');
    app.use(express.static(frontendDist));
    // SPA fallback: any non-API GET returns index.html for client-side routing
    app.get('*', (_req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
  } else {
    app.get('/', (_req, res) => res.json({
      service: 'employee-report-backend',
      status: 'ok',
      docs: '/api/employees/health',
    }));
    app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.path }));
  }

  return app;
}
