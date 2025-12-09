import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const stringValue = JSON.stringify(value);
    if (ttl) {
      await this.redis.setex(key, ttl, stringValue);
    } else {
      await this.redis.set(key, stringValue);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const stream = this.redis.scanStream({
      match: pattern,
      count: 100,
    });

    const deletePromises: Promise<number>[] = [];

    stream.on('data', (resultKeys: string[]) => {
      if (resultKeys.length > 0) {
        deletePromises.push(this.redis.del(...resultKeys));
      }
    });

    await new Promise<void>((resolve, reject) => {
      stream.on('end', async () => {
        await Promise.all(deletePromises);
        resolve();
      });
      stream.on('error', reject);
    });
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    return await this.redis.ttl(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }

  private async delPatternFiltered(
    pattern: string,
    excludePatterns: string[] = [],
  ): Promise<void> {
    const stream = this.redis.scanStream({
      match: pattern,
      count: 100,
    });

    const deletePromises: Promise<number>[] = [];

    stream.on('data', (resultKeys: string[]) => {
      const keysToDelete = resultKeys.filter((key) => {
        return !excludePatterns.some((exclude) => {
          if (exclude.includes('*')) {
            const regex = new RegExp('^' + exclude.replace(/\*/g, '.*') + '$');
            return regex.test(key);
          }
          return key.startsWith(exclude);
        });
      });

      if (keysToDelete.length > 0) {
        deletePromises.push(this.redis.del(...keysToDelete));
      }
    });

    await new Promise<void>((resolve, reject) => {
      stream.on('end', async () => {
        await Promise.all(deletePromises);
        resolve();
      });
      stream.on('error', reject);
    });
  }

  async invalidateUserCaches(userId?: number): Promise<void> {
    const excludePatterns = ['user:rating:*'];
    const patterns = ['user:attackable:*', 'user:event-history:*'];
    if (userId) {
      patterns.push(
        `user:attackable:${userId}`,
        `user:event-history:${userId}`,
      );
    }
    await Promise.all(
      patterns.map((pattern) =>
        this.delPatternFiltered(pattern, excludePatterns),
      ),
    );
  }

  async invalidateClanCaches(clanId?: number, userId?: number): Promise<void> {
    const excludePatterns = ['clan:rating:*', 'clan:find:*'];
    const patterns = [
      'clan:me:*',
      'clan:public-list:*',
      'clan:me:wars:*',
      'clan:me:enemy-clans:*',
      'clan:me:enemy-clan:*',
      'clan:me:enemy-clan:members:*',
    ];
    if (userId) {
      patterns.push(`clan:me:${userId}`, `clan:me:wars:${userId}`);
      patterns.push(`clan:me:enemy-clans:${userId}`);
      if (clanId) {
        patterns.push(`clan:me:enemy-clan:${userId}:${clanId}`);
        patterns.push(`clan:me:enemy-clan:members:${userId}:${clanId}`);
      }
    }
    await Promise.all(
      patterns.map((pattern) =>
        this.delPatternFiltered(pattern, excludePatterns),
      ),
    );
  }
}
