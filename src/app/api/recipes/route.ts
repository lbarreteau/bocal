import { NextResponse } from "next/server";
import { searchRecipes } from "@/lib/hellofresh";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? "24");
  const offset = Number(searchParams.get("offset") ?? "0");

  try {
    const data = await searchRecipes({
      q,
      limit: Number.isFinite(limit) ? limit : 24,
      offset: Number.isFinite(offset) ? offset : 0,
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
