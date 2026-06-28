export interface ICacheProvider {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttlSeconds?: number): void;
  remove(key: string): void;
  clear(): void;
}

export class InMemoryCacheProvider implements ICacheProvider {
  private cache: Map<string, { value: any; expiry: number | null }> = new Map();

  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  public set<T>(key: string, value: T, ttlSeconds?: number): void {
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, { value, expiry });
  }

  public remove(key: string): void {
    this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }
}

/**
 * Centrally managed Cache Service for high-scale enterprise operations.
 * Supports hot swapping the provider (e.g., Redis, LocalStorage, Memory)
 */
export class CacheService {
  private static instance: CacheService;
  private provider: ICacheProvider;

  private constructor() {
    this.provider = new InMemoryCacheProvider();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  public setProvider(newProvider: ICacheProvider): void {
    this.provider = newProvider;
  }

  public get<T>(key: string): T | null {
    return this.provider.get<T>(key);
  }

  public set<T>(key: string, value: T, ttlSeconds?: number): void {
    this.provider.set<T>(key, value, ttlSeconds);
  }

  public remove(key: string): void {
    this.provider.remove(key);
  }

  public clear(): void {
    this.provider.clear();
  }
}
