import { NextResponse } from "next/server";
import { getRecipeDetail } from "@/lib/hellofresh";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const servings = Number(
    new URL(request.url).searchParams.get("servings") ?? "2",
  );

  try {
    const recipe = await getRecipeDetail(
      id,
      Number.isFinite(servings) && servings > 0 ? servings : 2,
    );
    return NextResponse.json(recipe);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
