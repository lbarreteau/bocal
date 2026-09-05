import { NextResponse } from "next/server";
import { getRecipeDetail } from "@/lib/hellofresh";
import { mergeIngredients, normalizeSelection } from "@/lib/shopping";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const selection = normalizeSelection(
      body && typeof body === "object" && "recipes" in body
        ? (body as { recipes: unknown }).recipes
        : body,
    );

    if (selection.length === 0) {
      return NextResponse.json({ items: [], recipes: [] });
    }

    const recipes = await Promise.all(
      selection.map(async (entry) => {
        const detail = await getRecipeDetail(entry.id, entry.servings);
        return { ...detail, servings: entry.servings };
      }),
    );

    return NextResponse.json({
      items: mergeIngredients(recipes),
      recipes: recipes.map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        image: recipe.image,
        servings: recipe.servings,
        websiteUrl: recipe.websiteUrl,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
