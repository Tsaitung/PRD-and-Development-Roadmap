import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redis: Redis;

export const connectRedis = async (): Promise<void> => {
  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    redis.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    redis.on('error', (err) => {
      logger.error('❌ Redis error:', err);
    });

    // Test the connection
    await redis.ping();
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    // Don't throw error for Redis as it's optional for basic functionality
    logger.warn('⚠️ Running without Redis cache');
  }
};

export const getRedis = (): Redis | null => {
  return redis || null;
};

export const cache = {
  get: async (key: string): Promise<any> => {
    if (!redis) return null;
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },

  set: async (key: string, value: any, ttl?: number): Promise<void> => {
    if (!redis) return;
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redis.setex(key, ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  },

  del: async (key: string): Promise<void> => {
    if (!redis) return;
    try {
      await redis.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  },

  flush: async (): Promise<void> => {
    if (!redis) return;
    try {
      await redis.flushdb();
    } catch (error) {
      logger.error('Cache flush error:', error);
    }
  }
};