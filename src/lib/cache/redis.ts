import Redis from 'ioredis';

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  family: 4,
  keyPrefix: 'appfounders:',
};

// Create Redis client
export const redis = new Redis(redisConfig);

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

// Cache key patterns
export const CACHE_KEYS = {
  USER: (id: string) => `user:${id}`,
  APP: (id: string) => `app:${id}`,
  APPS_LIST: (filters: string) => `apps:list:${filters}`,
  REVIEWS: (appId: string) => `reviews:${appId}`,
  SEARCH: (query: string) => `search:${query}`,
  ANALYTICS: (type: string, period: string) => `analytics:${type}:${period}`,
  SESSION: (sessionId: string) => `session:${sessionId}`,
  RATE_LIMIT: (identifier: string) => `rate_limit:${identifier}`,
  API_RESPONSE: (endpoint: string, params: string) => `api:${endpoint}:${params}`,
} as const;

// Generic cache operations
export class CacheService {
  // Get cached value
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Set cached value with TTL
  static async set(
    key: string,
    value: any,
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<boolean> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Delete cached value
  static async del(key: string): Promise<boolean> {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Delete multiple keys by pattern
  static async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        return await redis.del(...keys);
      }
      return 0;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  // Check if key exists
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // Get TTL of a key
  static async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key);
    } catch (error) {
      console.error('Cache TTL error:', error);
      return -1;
    }
  }

  // Increment counter
  static async incr(key: string, ttl?: number): Promise<number> {
    try {
      const value = await redis.incr(key);
      if (ttl && value === 1) {
        await redis.expire(key, ttl);
      }
      return value;
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }

  // Cache with fallback to database
  static async getOrSet<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Fallback to database
      const data = await fallback();
      
      // Cache the result
      await this.set(key, data, ttl);
      
      return data;
    } catch (error) {
      console.error('Cache getOrSet error:', error);
      // If cache fails, still return the fallback data
      return await fallback();
    }
  }
}

// Specialized cache services
export class UserCache {
  static async getUser(userId: string) {
    return CacheService.get(CACHE_KEYS.USER(userId));
  }

  static async setUser(userId: string, userData: any) {
    return CacheService.set(CACHE_KEYS.USER(userId), userData, CACHE_TTL.LONG);
  }

  static async invalidateUser(userId: string) {
    return CacheService.del(CACHE_KEYS.USER(userId));
  }
}

export class AppCache {
  static async getApp(appId: string) {
    return CacheService.get(CACHE_KEYS.APP(appId));
  }

  static async setApp(appId: string, appData: any) {
    return CacheService.set(CACHE_KEYS.APP(appId), appData, CACHE_TTL.LONG);
  }

  static async invalidateApp(appId: string) {
    await CacheService.del(CACHE_KEYS.APP(appId));
    // Also invalidate related caches
    await CacheService.delPattern(`apps:list:*`);
    await CacheService.delPattern(`search:*`);
  }

  static async getAppsList(filters: string) {
    return CacheService.get(CACHE_KEYS.APPS_LIST(filters));
  }

  static async setAppsList(filters: string, appsData: any) {
    return CacheService.set(CACHE_KEYS.APPS_LIST(filters), appsData, CACHE_TTL.MEDIUM);
  }
}

export class SearchCache {
  static async getSearchResults(query: string) {
    return CacheService.get(CACHE_KEYS.SEARCH(query));
  }

  static async setSearchResults(query: string, results: any) {
    return CacheService.set(CACHE_KEYS.SEARCH(query), results, CACHE_TTL.MEDIUM);
  }

  static async invalidateSearchCache() {
    return CacheService.delPattern(`search:*`);
  }
}

export class SessionCache {
  static async getSession(sessionId: string) {
    return CacheService.get(CACHE_KEYS.SESSION(sessionId));
  }

  static async setSession(sessionId: string, sessionData: any, ttl: number = 86400) {
    return CacheService.set(CACHE_KEYS.SESSION(sessionId), sessionData, ttl);
  }

  static async deleteSession(sessionId: string) {
    return CacheService.del(CACHE_KEYS.SESSION(sessionId));
  }
}

export class RateLimitCache {
  static async checkRateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = CACHE_KEYS.RATE_LIMIT(identifier);
    
    try {
      const current = await CacheService.incr(key, windowSeconds);
      
      if (current > limit) {
        const ttl = await CacheService.ttl(key);
        return {
          allowed: false,
          remaining: 0,
          resetTime: Date.now() + (ttl * 1000),
        };
      }
      
      const ttl = await CacheService.ttl(key);
      return {
        allowed: true,
        remaining: limit - current,
        resetTime: Date.now() + (ttl * 1000),
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow the request if cache is down
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: Date.now() + (windowSeconds * 1000),
      };
    }
  }
}

export class AnalyticsCache {
  static async getAnalytics(type: string, period: string) {
    return CacheService.get(CACHE_KEYS.ANALYTICS(type, period));
  }

  static async setAnalytics(type: string, period: string, data: any) {
    // Analytics data can be cached for longer periods
    const ttl = period === 'realtime' ? CACHE_TTL.SHORT : CACHE_TTL.VERY_LONG;
    return CacheService.set(CACHE_KEYS.ANALYTICS(type, period), data, ttl);
  }

  static async invalidateAnalytics(type?: string) {
    const pattern = type ? `analytics:${type}:*` : `analytics:*`;
    return CacheService.delPattern(pattern);
  }
}

// Cache warming utilities
export class CacheWarmer {
  static async warmUserCache(userIds: string[]) {
    // Implementation would fetch user data and cache it
    console.log('Warming user cache for:', userIds.length, 'users');
  }

  static async warmAppCache(appIds: string[]) {
    // Implementation would fetch app data and cache it
    console.log('Warming app cache for:', appIds.length, 'apps');
  }

  static async warmPopularContent() {
    // Implementation would cache frequently accessed content
    console.log('Warming popular content cache');
  }
}

// Cache monitoring
export class CacheMonitor {
  static async getStats() {
    try {
      const info = await redis.info('memory');
      const keyspace = await redis.info('keyspace');
      
      return {
        memory: info,
        keyspace: keyspace,
        connected: redis.status === 'ready',
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      await redis.ping();
      return true;
    } catch (error) {
      console.error('Cache health check failed:', error);
      return false;
    }
  }
}

// Export default redis client
export default redis;
