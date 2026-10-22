import NodeCache from 'node-cache';

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  keys: number;
  ksize: number;
  vsize: number;
}

/**
 * Cache Manager
 * In-memory caching for API responses
 */
export class CacheManager {
  private cache: NodeCache;
  private stats: { hits: number; misses: number; sets: number };

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
   */
  get<T = any>(key: string): T | undefined {
    const value = this.cache.get<T>(key);
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
   */
  set<T = any>(key: string, value: T, ttl?: number | string): boolean {
    this.stats.sets++;
    const success = ttl ? this.cache.set(key, value, ttl as number) : this.cache.set(key, value);
    if (success) {
      console.log(`[Cache SET] ${key} (TTL: ${ttl || 'default'}s)`);
    }
    return success;
  }

  /**
   * Delete value from cache
   */
  del(key: string | string[]): number {
    const deleted = this.cache.del(key);
    if (deleted > 0) {
      console.log(`[Cache DEL] ${key}`);
    }
    return deleted;
  }

  /**
   * Delete multiple keys matching pattern
   */
  delPattern(pattern: string): number {
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
  flush(): void {
    this.cache.flushAll();
    console.log('[Cache FLUSH] All cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
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
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get TTL for key
   */
  getTtl(key: string): number | undefined {
    return this.cache.getTtl(key);
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return this.cache.keys();
  }
}

// Export singleton instance
const cacheManager = new CacheManager();

module.exports = cacheManager;
export default cacheManager;
