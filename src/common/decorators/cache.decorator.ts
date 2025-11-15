import { SetMetadata } from '@nestjs/common';

export const CACHE_TTL_KEY = 'cache_ttl';
export const CACHE_KEY_KEY = 'cache_key';
export const INVALIDATE_CACHE_KEY = 'invalidate_cache';

export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_KEY, ttl);

export const CacheKey = (key: string) => SetMetadata(CACHE_KEY_KEY, key);

export const InvalidateCache = (...keys: string[]) => SetMetadata(INVALIDATE_CACHE_KEY, keys);

