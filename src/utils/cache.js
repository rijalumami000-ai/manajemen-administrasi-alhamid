const NodeCache = require('node-cache');

/**
 * Cache Manager
 * In-memory caching for API responses
 */
class CacheManager {
  constructor() {
    // Initialize cache with default TTL of 5 minutes
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes default
      checkperiod: 60, // Check for expired keys every 60 seconds
      useClones: false, // Don't clone objects (better performance)
    });

    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
    };
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {*} Cached value or undefined
   */
  get(key) {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.stats.hits++;
      console.log(`[Cache HIT] ${key}`);
    } else {
      this.stats.misses++;
      console.log(`[Cache MISS] ${key}`);
    }
    return value;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {boolean} Success
   */
  set(key, value, ttl) {
    this.stats.sets++;
    const success = this.cache.set(key, value, ttl);
    if (success) {
      console.log(`[Cache SET] ${key} (TTL: ${ttl || 'default'}s)`);
    }
    return success;
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {number} Number of deleted entries
   */
  del(key) {
    const deleted = this.cache.del(key);
    if (deleted > 0) {
      console.log(`[Cache DEL] ${key}`);
    }
    return deleted;
  }

  /**
   * Delete multiple keys matching pattern
   * @param {string} pattern - Pattern to match (e.g., 'santri:*')
   * @returns {number} Number of deleted entries
   */
  delPattern(pattern) {
    const keys = this.cache.keys();
    const regex = new RegExp(pattern.replace('*', '.*'));
    const matchingKeys = keys.filter(key => regex.test(key));

    if (matchingKeys.length > 0) {
      const deleted = this.cache.del(matchingKeys);
      console.log(`[Cache DEL Pattern] ${pattern} (${deleted} keys)`);
      return deleted;
    }
    return 0;
  }

  /**
   * Clear all cache
   */
  flush() {
    this.cache.flushAll();
    console.log('[Cache FLUSH] All cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getStats() {
    const cacheStats = this.cache.getStats();
    return {
      ...this.stats,
      keys: cacheStats.keys,
      hits: cacheStats.hits,
      misses: cacheStats.misses,
      ksize: cacheStats.ksize,
      vsize: cacheStats.vsize,
    };
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {boolean} True if exists
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Get TTL for key
   * @param {string} key - Cache key
   * @returns {number} TTL in seconds or undefined
   */
  getTtl(key) {
    return this.cache.getTtl(key);
  }

  /**
   * Get all keys
   * @returns {string[]} Array of keys
   */
  keys() {
    return this.cache.keys();
  }
}

// Export singleton instance
const cacheManager = new CacheManager();

module.exports = cacheManager;
