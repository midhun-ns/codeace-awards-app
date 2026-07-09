import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPresenterSchema } from "@/lib/validators";
import { savePresenterPhoto } from "@/lib/save-presenter-photo";

function mapPresenter(p: {
  id: number;
  name: string;
  title: string;
  department: string;
  avatar: string | null;
  order: number;
  scores: { rating: number }[];
  _count: { scores: number };
}) {
  const averageScore =
    p.scores.length > 0
      ? Number(
          (p.scores.reduce((sum, score) => sum + score.rating, 0) / p.scores.length).toFixed(
            2
          )
        )
      : 0;

  return {
    id: p.id,
    name: p.name,
    title: p.title,
    department: p.department,
    avatar: p.avatar,
    order: p.order,
    averageScore,
    totalVotes: p._count.scores,
  };
}

export async function GET() {
  try {
    const presenters = await prisma.presenter.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: { select: { scores: true } },
        scores: { select: { rating: true } },
      },
    });

    return NextResponse.json(presenters.map(mapPresenter));
  } catch {
    return NextResponse.json({ error: "Failed to fetch presenters" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const validated = createPresenterSchema.parse({
      name: formData.get("name"),
      title: formData.get("title"),
    });

    const photo = formData.get("photo");
    if (!(photo instanceof File) || photo.size === 0) {
      return NextResponse.json({ error: "Presenter photo is required" }, { status: 400 });
    }

    const order = (await prisma.presenter.count()) + 1;

    const presenter = await prisma.presenter.create({
      data: {
        name: validated.name,
        title: validated.title,
        order,
      },
    });

    const avatar = await savePresenterPhoto(presenter.id, presenter.name, photo);

    const updatedPresenter = await prisma.presenter.update({
      where: { id: presenter.id },
      data: { avatar },
      include: {
        _count: { select: { scores: true } },
        scores: { select: { rating: true } },
      },
    });

    return NextResponse.json(mapPresenter(updatedPresenter), { status: 201 });
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
      return NextResponse.json({ error: "Invalid presenter details" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create presenter" }, { status: 500 });
  }
}
