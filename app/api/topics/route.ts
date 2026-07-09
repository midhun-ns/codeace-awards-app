import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTopicSchema } from "@/lib/validators";
import { savePresenterPhoto } from "@/lib/save-presenter-photo";

export async function GET() {
  try {
    const topics = await prisma.topic.findMany({
      orderBy: { order: "asc" },
      include: {
        presenters: {
          include: { scores: { select: { rating: true } } },
        },
      },
    });

    const mapped = topics.map((topic) => {
      const allRatings = topic.presenters.flatMap((presenter) =>
        presenter.scores.map((score) => score.rating)
      );

      return {
        id: topic.id,
        title: topic.title,
        order: topic.order,
        presenters: topic.presenters.map((presenter) => ({
          id: presenter.id,
          name: presenter.name,
          photo: presenter.photo,
          totalVotes: presenter.scores.length,
          averageScore:
            presenter.scores.length > 0
              ? Number(
                  (
                    presenter.scores.reduce((sum, score) => sum + score.rating, 0) /
                    presenter.scores.length
                  ).toFixed(2)
                )
              : 0,
        })),
        totalVotes: allRatings.length,
        averageScore:
          allRatings.length > 0
            ? Number(
                (allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length).toFixed(2)
              )
            : 0,
      };
    });

    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const presenterCount = Number(formData.get("presenterCount")) || 0;

    const presenterNames: string[] = [];
    const presenterPhotos: (File | null)[] = [];
    for (let index = 0; index < presenterCount; index++) {
      presenterNames.push(String(formData.get(`presenterName-${index}`) ?? ""));
      const photo = formData.get(`presenterPhoto-${index}`);
      presenterPhotos.push(photo instanceof File && photo.size > 0 ? photo : null);
    }

    const validated = createTopicSchema.parse({
      title: formData.get("title"),
      presenterNames,
    });

    const order = (await prisma.topic.count()) + 1;

    const topic = await prisma.$transaction(async (tx) => {
      return tx.topic.create({
        data: {
          title: validated.title,
          order,
          presenters: {
            create: validated.presenterNames.map((name) => ({ name })),
          },
        },
        include: { presenters: true },
      });
    });

    for (let index = 0; index < topic.presenters.length; index++) {
      const photo = presenterPhotos[index];
      if (!photo) {
        continue;
      }
      const presenter = topic.presenters[index];
      const photoPath = await savePresenterPhoto(presenter.id, presenter.name, photo);
      await prisma.presenter.update({
        where: { id: presenter.id },
        data: { photo: photoPath },
      });
    }

    return NextResponse.json({ id: topic.id, title: topic.title }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("image")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "ZodError"
    ) {
      return NextResponse.json({ error: "Invalid topic details" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create topic" }, { status: 500 });
  }
}
