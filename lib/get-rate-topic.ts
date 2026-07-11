import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

async function fetchTopicForRate(topicId: number) {
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

export function getRateTopic(topicId: number) {
  return unstable_cache(
    () => fetchTopicForRate(topicId),
    [`rate-topic-${topicId}`],
    { revalidate: 60, tags: [`rate-topic-${topicId}`] }
  )();
}
