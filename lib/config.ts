import { z } from "zod";

/**
 * Server-only runtime configuration.
 * All values have safe defaults so `pnpm dev` works with zero setup;
 * override via environment in production (see .env.example).
 */
const configSchema = z.object({
  /** Upstream request timeout (ms). */
  upstreamTimeoutMs: z.coerce.number().int().positive().default(20000),
  /** Read-through cache TTL for SKU reports (ms). */
  cacheTtlMs: z.coerce.number().int().positive().default(3 * 60 * 1000),
  /** Max entries kept in the read-through cache. */
  cacheMaxEntries: z.coerce.number().int().positive().default(50),
  /** Max SKUs per compare request. */
  maxSkus: z.coerce.number().int().min(1).max(10).default(4),
  /** User-Agent sent to the upstream shop. */
  userAgent: z.string().min(1).default("Mozilla/5.0"),
  /** Simple per-IP rate limit: requests per rolling minute on /api/check. */
  rateLimitPerMinute: z.coerce.number().int().positive().default(30),
});

export const config = configSchema.parse({
  upstreamTimeoutMs: process.env.DSSF_UPSTREAM_TIMEOUT_MS,
  cacheTtlMs: process.env.DSSF_CACHE_TTL_MS,
  cacheMaxEntries: process.env.DSSF_CACHE_MAX_ENTRIES,
  maxSkus: process.env.DSSF_MAX_SKUS,
  userAgent: process.env.DSSF_USER_AGENT,
  rateLimitPerMinute: process.env.DSSF_RATE_LIMIT_PER_MINUTE,
});

export type AppConfig = z.infer<typeof configSchema>;
