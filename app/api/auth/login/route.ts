import { NextResponse } from "next/server";

const APP_PASSWORD = process.env.APP_PASSWORD ?? "Codeace@#2026";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (password !== APP_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("codeace_auth", "granted", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
