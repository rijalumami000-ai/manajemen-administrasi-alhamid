const cache = require('../utils/cache');

/**
 * Cache middleware for API responses
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @param {function} keyGenerator - Function to generate cache key from request
 * @returns {function} Express middleware
 */
function cacheMiddleware(ttl = 300, keyGenerator = null) {
  return (req, res, next) => {
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
    res.json = function(data) {
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
 * @param {string} pattern - Pattern to match (e.g., 'santri:*')
 */
function invalidateCache(pattern) {
  cache.delPattern(pattern);
}

/**
 * Invalidate cache middleware
 * Use after POST, PUT, DELETE operations
 * @param {string} pattern - Pattern to invalidate
 * @returns {function} Express middleware
 */
function invalidateCacheMiddleware(pattern) {
  return (req, res, next) => {
    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json to invalidate cache after successful response
    res.json = function(data) {
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
const cacheKeyGenerators = {
  // Summary: cache by user role
  summary: (req) => {
    const user = req.user || {};
    return `summary:${user.role || 'guest'}`;
  },

  // List endpoints: cache by query params
  list: (req) => {
    const query = new URLSearchParams(req.query).toString();
    return `${req.path}:${query}`;
  },

  // Detail endpoints: cache by ID
  detail: (req) => {
    return `${req.path}:${req.params.id}`;
  },

  // Tahun ajaran: cache by ID or 'all'
  tahunAjaran: (req) => {
    const id = req.params.id || 'all';
    return `tahun-ajaran:${id}`;
  },
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  invalidateCacheMiddleware,
  cacheKeyGenerators,
};
