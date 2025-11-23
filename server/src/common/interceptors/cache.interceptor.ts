import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import {
  CACHE_TTL_KEY,
  CACHE_KEY_KEY,
  INVALIDATE_CACHE_KEY,
} from '../decorators/cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();

    const ttl = this.reflector.get<number>(CACHE_TTL_KEY, handler);
    const customKey = this.reflector.get<string>(CACHE_KEY_KEY, handler);
    const invalidateKeys = this.reflector.get<string[]>(
      INVALIDATE_CACHE_KEY,
      handler,
    );

    if (invalidateKeys && invalidateKeys.length > 0) {
      await Promise.all(
        invalidateKeys.map(async (key) => {
          const builtKey = this.buildKey(key, request);
          if (builtKey.includes('*')) {
            await this.redis.keys(builtKey).then((keys) => {
              if (keys.length > 0) {
                return this.redis.del(...keys);
              }
            });
          } else {
            await this.redis.del(builtKey);
          }
        }),
      );
      return next.handle();
    }

    if (!ttl) {
      return next.handle();
    }

    const cacheKey = customKey
      ? this.buildKey(customKey, request)
      : this.buildDefaultKey(controller.name, handler.name, request);

    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return of(JSON.parse(cached));
    }

    return next.handle().pipe(
      tap(async (data) => {
        await this.redis.setex(cacheKey, ttl, JSON.stringify(data));
      }),
    );
  }

  private buildKey(key: string, request: any): string {
    const params = request.params || {};
    const query = request.query || {};
    const user = request.user || {};

    let finalKey = key;
    const processedQueryKeys = new Set<string>();

    Object.keys(params).forEach((param) => {
      const beforeReplace = finalKey;
      finalKey = finalKey.replace(`::${param}`, params[param]);
      finalKey = finalKey.replace(`:${param}`, params[param]);
    });

    Object.keys(query).forEach((q) => {
      const beforeReplace = finalKey;
      finalKey = finalKey.replace(`::${q}`, query[q]);
      if (finalKey !== beforeReplace) {
        processedQueryKeys.add(q);
      } else {
        finalKey = finalKey.replace(`:${q}`, query[q]);
        if (finalKey !== beforeReplace) {
          processedQueryKeys.add(q);
        }
      }
    });

    if (user.id) {
      finalKey = finalKey.replace(`::user`, user.id);
      finalKey = finalKey.replace(`:user`, user.id);
    }

    const remainingQueryKeys = Object.keys(query).filter(
      (q) => !processedQueryKeys.has(q),
    );

    if (remainingQueryKeys.length > 0) {
      const querySuffix = remainingQueryKeys
        .sort()
        .map((q) => `${q}:${query[q]}`)
        .join(':');
      finalKey += `:query:${querySuffix}`;
    }

    return finalKey;
  }

  private buildDefaultKey(
    controller: string,
    handler: string,
    request: any,
  ): string {
    const params = request.params || {};
    const query = request.query || {};
    const paramsStr = Object.keys(params).length
      ? `:${Object.values(params).join(':')}`
      : '';
    const queryStr = Object.keys(query).length
      ? `:${JSON.stringify(query)}`
      : '';

    return `cache:${controller}:${handler}${paramsStr}${queryStr}`;
  }
}
