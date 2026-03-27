import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { pool, dbHealthCheck } from './config/database';
import { logger } from './utils/logger';
import { globalErrorHandler, notFound } from './middlewares/error.middleware';

// Routes
import authRoutes from './routes/auth.routes';
import reportsRoutes from './routes/reports.routes';
import techniciansRoutes from './routes/technicians.routes';

// ---------------------------------------------------------------------------
// Application Factory
// ---------------------------------------------------------------------------
const app = express();

// ---------------------------------------------------------------------------
// Security Headers (Helmet sets sensible defaults)
// ---------------------------------------------------------------------------
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images to be loaded cross-origin
}));

// ---------------------------------------------------------------------------
// CORS — Allow configured origins only
// ---------------------------------------------------------------------------
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ---------------------------------------------------------------------------
// Request Parsing
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(compression());

// ---------------------------------------------------------------------------
// Request Logging
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) },
  }));
}

// ---------------------------------------------------------------------------
// Rate Limiting
// ---------------------------------------------------------------------------
// Two different limiters are used:
// - `apiLimiter` for all API calls to reduce abuse/spam
// - `authLimiter` stricter limits on login/register to slow brute-force attempts
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
});

// Stricter limit on auth endpoints to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many authentication attempts.', code: 'RATE_LIMITED' },
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ---------------------------------------------------------------------------
// Static File Serving (local uploads fallback)
// ---------------------------------------------------------------------------
// When using local storage (development), uploaded images may be served from `/uploads`.
// In production/supabase, uploads are typically served via the storage provider URLs.
app.use('/uploads', express.static(path.resolve(process.env.LOCAL_UPLOAD_PATH || './uploads')));

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------
app.get('/health', async (_req, res) => {
  const dbOk = await dbHealthCheck();
  const status = dbOk ? 200 : 503;
  res.status(status).json({
    status: dbOk ? 'healthy' : 'degraded',
    service: 'maji-watch-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: dbOk ? 'connected' : 'unreachable',
  });
});

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/technicians', techniciansRoutes);

// ---------------------------------------------------------------------------
// 404 and Global Error Handler (must be last)
// ---------------------------------------------------------------------------
app.use(notFound);
app.use(globalErrorHandler);

// ---------------------------------------------------------------------------
// Server Bootstrap
// ---------------------------------------------------------------------------
const PORT = parseInt(process.env.PORT || '3000');

async function startServer(): Promise<void> {
  try {
    // Verify DB connection before accepting traffic
    const dbOk = await dbHealthCheck();
    if (!dbOk) {
      throw new Error('Cannot connect to database. Check DATABASE_URL.');
    }
    logger.info('Database connection established.');

    // Start listening only after DB is healthy; avoids "half-deployed" behavior.
    app.listen(PORT, () => {
      logger.info(`Maji Watch API running on port ${PORT}`, {
        env: process.env.NODE_ENV,
        port: PORT,
      });
    });
  } catch (err) {
    logger.error('Server startup failed', { error: (err as Error).message });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

startServer();

export default app;
