import Redis from 'ioredis';
import { logger } from '../utils/logger';

export class CacheService {
    private redis: Redis;
    private defaultTTL: number = 3600; // 1 hour in seconds

    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });

        this.redis.on('error', (error) => {
            logger.error('Redis connection error:', error);
        });
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.redis.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error('Cache get error:', error);
            return null;
        }
    }

    async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
        try {
            await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
        } catch (error) {
            logger.error('Cache set error:', error);
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.redis.del(key);
        } catch (error) {
            logger.error('Cache delete error:', error);
        }
    }

    async getOrSet<T>(
        key: string,
        fetchFn: () => Promise<T>,
        ttl: number = this.defaultTTL
    ): Promise<T | null> {
        try {
            const cached = await this.get<T>(key);
            if (cached) return cached;

            const fresh = await fetchFn();
            await this.set(key, fresh, ttl);
            return fresh;
        } catch (error) {
            logger.error('Cache getOrSet error:', error);
            return null;
        }
    }

    async invalidatePattern(pattern: string): Promise<void> {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } catch (error) {
            logger.error('Cache invalidate pattern error:', error);
        }
    }
} 