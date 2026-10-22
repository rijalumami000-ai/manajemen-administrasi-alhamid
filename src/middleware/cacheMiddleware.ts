import { Request, Response, NextFunction } from 'express';
import cache from '../utils/cache';

/**
 * Cache middleware for API responses
 */
export function cacheMiddleware(ttl = 300, keyGenerator: ((req: Request) => string) | null = null) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : `${req.originalUrl || req.url}`;

    // Try to get from cache
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse) {
      // Cache hit - return cached response
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedResponse);
    }

    // Cache miss - continue to route handler
    res.setHeader('X-Cache', 'MISS');

    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json to cache the response
    res.json = function(data: any) {
      // Cache the response
      cache.set(cacheKey, data, ttl);

      // Call original json method
      return originalJson(data);
    };

    next();
  };
}

/**
 * Invalidate cache for specific pattern
 */
export function invalidateCache(pattern: string): void {
  cache.delPattern(pattern);
}

/**
 * Invalidate cache middleware
 * Use after POST, PUT, DELETE operations
 */
export function invalidateCacheMiddleware(pattern: string) {
  return (_req: Request, res: Response, next: NextFunction) => {
    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json to invalidate cache after successful response
    res.json = function(data: any) {
      // Only invalidate on successful responses (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        invalidateCache(pattern);
      }

      // Call original json method
      return originalJson(data);
    };

    next();
  };
}

/**
 * Cache key generators for different routes
 */
export const cacheKeyGenerators = {
  // Summary: cache by user role
  summary: (req: Request) => {
    const user = (req.user || {}) as any;
    return `summary:${user.role || 'guest'}`;
  },

  // List endpoints: cache by query params
  list: (req: Request) => {
    const query = new URLSearchParams(req.query as Record<string, string>).toString();
    return `${req.path}:${query}`;
  },

  // Detail endpoints: cache by ID
  detail: (req: Request) => {
    return `${req.path}:${req.params.id}`;
  },

  // Tahun ajaran: cache by ID or 'all'
  tahunAjaran: (req: Request) => {
    const id = req.params.id || 'all';
    return `tahun-ajaran:${id}`;
  },
};

const mod = {
  cacheMiddleware,
  invalidateCache,
  invalidateCacheMiddleware,
  cacheKeyGenerators,
};

module.exports = mod;
export default mod;
