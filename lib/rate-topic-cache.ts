export interface RateTopic {
  id: number;
  title: string;
  presenters: { id: number; name: string; photo: string | null }[];
}

const CACHE_TTL_MS = 60_000;

const cache = new Map<number, { topic: RateTopic; cachedAt: number }>();

export function getCachedRateTopic(topicId: number): RateTopic | null {
  const entry = cache.get(topicId);
  if (!entry) return null;

  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    cache.delete(topicId);
    return null;
  }

  return entry.topic;
}

export function setCachedRateTopic(topicId: number, topic: RateTopic) {
  cache.set(topicId, { topic, cachedAt: Date.now() });
}

export function invalidateRateTopicCache(topicId: number) {
  cache.delete(topicId);
}
