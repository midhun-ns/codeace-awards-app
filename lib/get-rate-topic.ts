import { prisma } from "@/lib/prisma";
import {
  getCachedRateTopic,
  setCachedRateTopic,
  type RateTopic,
} from "@/lib/rate-topic-cache";

async function fetchTopicForRate(topicId: number): Promise<RateTopic | null> {
  return prisma.topic.findUnique({
    where: { id: topicId },
    select: {
      id: true,
      title: true,
      presenters: {
        select: {
          id: true,
          name: true,
          photo: true,
        },
      },
    },
  });
}

export async function getRateTopic(topicId: number): Promise<RateTopic | null> {
  const cached = getCachedRateTopic(topicId);
  if (cached) return cached;

  const topic = await fetchTopicForRate(topicId);
  if (topic) {
    setCachedRateTopic(topicId, topic);
  }

  return topic;
}
