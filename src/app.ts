import express, { type Application, type RequestHandler } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { buildTrustedPeers, resolveClientIp, toRateLimitKey } from './utils/clientIp.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { configRouter } from './routes/config.js';
import { artworksRouter } from './routes/artworks.js';
import { commissionsRouter } from './routes/commissions.js';
import { faqsRouter } from './routes/faqs.js';
import { tosRouter } from './routes/tos.js';
import { portfolioRouter } from './routes/portfolio.js';
import { uploadRouter } from './routes/upload.js';
import { NotFoundError } from './utils/errors.js';

// Mirrors the relay's configuration: forwarding headers are believed only when
// the socket peer is a trusted proxy. Behind the Cloudflare Tunnel that is
// cloudflared on loopback, and CF-Connecting-IP is authoritative.
const trustedPeers = buildTrustedPeers(process.env.TRUSTED_PROXIES?.trim() || 'loopback');

function clientKey(req: Parameters<typeof resolveClientIp>[0]): string {
  const address = resolveClientIp(req, { source: 'auto', trustedPeers });
  return address === 'unknown' ? 'unknown' : toRateLimitKey(address);
}

export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);

  // This process serves JSON only — no HTML, no inline scripts — so a strict
  // CSP costs nothing here and the browser-facing headers are cheap insurance.
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
  }));

  /**
   * Rate limits, keyed on the resolved client address rather than the raw
   * X-Forwarded-For header (see utils/clientIp.ts).
   *
   * Two tiers: a broad ceiling for the read-heavy public endpoints, and a much
   * tighter one on the auth routes, where the expensive path is the Discord
   * token exchange and the interesting attack is login brute-forcing.
   */
  const limiterOptions = {
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: clientKey,
    validate: {
      // The library flags any custom keyGenerator whose source mentions req.ip,
      // by heuristic, without being able to see what it does with it. clientKey
      // passes its result through the library's own ipKeyGenerator, so IPv6 is
      // masked to /64 exactly as the default generator would. Silencing only
      // this one check keeps the remaining validations active.
      keyGeneratorIpFallback: false,
    },
  } as const;

  const generalLimiter = rateLimit({
    ...limiterOptions,
    windowMs: 60 * 1000,
    limit: 120,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' } },
  });

  const authLimiter = rateLimit({
    ...limiterOptions,
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts. Please try again later.' } },
  });

  const uploadLimiter = rateLimit({
    ...limiterOptions,
    windowMs: 60 * 1000,
    limit: 20,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many uploads. Please slow down.' } },
  });

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || env.ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Responses are JSON and compress well — /api/portfolio is ~7 KB raw and
  // ~2.3 KB gzipped, and it is fetched by every visitor to the public site.
  app.use(compression());

  app.use(cookieParser());
  /**
   * JSON bodies are small: the largest legitimate one is a full config PUT at
   * roughly 7 KB. Images do not travel this path — they are multipart and
   * bounded separately by multer.
   *
   * The previous 10 MB ceiling let any caller make the process buffer 10 MB per
   * request before a route or auth check ran, which at the general rate limit
   * is over a gigabyte a minute from a single client.
   */
  app.use(express.json({ limit: '256kb' }));
  app.use(express.urlencoded({ extended: true, limit: '256kb' }));

  // Health checks are exempt so monitoring cannot be throttled out.
  //
  // The strict tier covers only the OAuth entry points — the expensive path
  // (Discord token exchange) and the one worth brute-forcing. /auth/me is a
  // session check the dashboard performs on every load, so throttling it at the
  // same rate would break normal use across a few tabs.
  app.use('/api/auth/discord', authLimiter);
  app.use('/api/auth', generalLimiter);
  app.use('/api/upload', uploadLimiter);

  /**
   * Reports readiness, not just liveness.
   *
   * This previously returned `healthy` unconditionally, so it could not detect
   * a database outage — which is the failure a health check most needs to
   * catch. A degraded response returns 503 so a load balancer or deploy gate
   * can act on it, while still describing what is wrong.
   */
  const DB_STATES: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  app.get('/api/health', async (_req, res) => {
    const readyState = mongoose.connection.readyState;
    const database = DB_STATES[readyState] ?? 'unknown';

    // readyState alone only says a socket exists; a ping confirms the server
    // is actually answering.
    let reachable = false;
    if (readyState === 1) {
      try {
        await mongoose.connection.db?.admin().ping();
        reachable = true;
      } catch {
        reachable = false;
      }
    }

    const healthy = readyState === 1 && reachable;

    res.status(healthy ? 200 : 503).json({
      success: healthy,
      data: {
        status: healthy ? 'healthy' : 'degraded',
        environment: env.NODE_ENV,
        database,
        databaseReachable: reachable,
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.use('/api/auth', authRouter);
  /**
   * Public content is identical for every visitor and changes only when the
   * admin publishes, so it is safe to cache. Express already emits an ETag, but
   * without Cache-Control a browser revalidates on every navigation and an edge
   * cache will not store the response at all.
   *
   * `stale-while-revalidate` lets Cloudflare keep serving the cached copy while
   * it refreshes in the background, so a publish shows up quickly without every
   * visitor waiting on the origin.
   */
  const publicCache: RequestHandler = (req, res, next) => {
    // HEAD is cacheable on the same terms as GET — it is what CDNs and uptime
    // checks use to revalidate — so gating on GET alone left those responses
    // uncacheable.
    if (req.method === 'GET' || req.method === 'HEAD') {
      res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    }
    next();
  };

  app.use('/api/config', generalLimiter, publicCache, configRouter);
  app.use('/api/artworks', generalLimiter, publicCache, artworksRouter);
  app.use('/api/commissions', generalLimiter, publicCache, commissionsRouter);
  app.use('/api/faqs', generalLimiter, publicCache, faqsRouter);
  app.use('/api/tos', generalLimiter, publicCache, tosRouter);
  app.use('/api/portfolio', generalLimiter, publicCache, portfolioRouter);
  app.use('/api/upload', uploadRouter);

  app.use((req, _res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
  });

  app.use(errorHandler);

  return app;
}

