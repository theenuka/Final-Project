type CacheEntry = {
  timestamp: number;
  payload: any;
};

const SEARCH_CACHE_ENABLED = process.env.SEARCH_CACHE_ENABLED !== "false";
const SEARCH_CACHE_TTL_MS = Number(process.env.SEARCH_CACHE_TTL_MS || 60_000);
const SEARCH_CACHE_MAX = Number(process.env.SEARCH_CACHE_MAX || 250);
const cacheStore = new Map<string, CacheEntry>();

export const stableKey = (params: Record<string, unknown>) => {
  const sorted: Record<string, unknown> = {};
  Object.keys(params)
    .sort()
    .forEach((key) => {
      const value = params[key];
      if (Array.isArray(value)) {
        sorted[key] = [...value].sort();
      } else if (value && typeof value === "object") {
        sorted[key] = stableKey(value as Record<string, unknown>);
      } else {
        sorted[key] = value;
      }
    });
  return JSON.stringify(sorted);
};

export const getCached = (key: string) => {
  if (!SEARCH_CACHE_ENABLED) return undefined;
  const entry = cacheStore.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > SEARCH_CACHE_TTL_MS) {
    cacheStore.delete(key);
    return undefined;
  }
  return entry.payload;
};

export const setCache = (key: string, payload: any) => {
  if (!SEARCH_CACHE_ENABLED) return;
  if (cacheStore.size >= SEARCH_CACHE_MAX) {
    const firstKey = cacheStore.keys().next().value;
    if (firstKey) cacheStore.delete(firstKey);
  }
  cacheStore.set(key, { timestamp: Date.now(), payload });
};
