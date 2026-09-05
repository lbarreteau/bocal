import { NextResponse } from "next/server";
import { searchRecipes } from "@/lib/hellofresh";
import {
  applyRecipeFilters,
  filtersAreActive,
  type PrepFilter,
  type RecipeFilters,
} from "@/lib/recipeFilters";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? "24");
  const offset = Number(searchParams.get("offset") ?? "0");
  const vegetarian = searchParams.get("vegetarian") === "1";
  const prep = (searchParams.get("prep") ?? "all") as PrepFilter;
  const tags = (searchParams.get("tags") ?? "")
    .split("|")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const filters: RecipeFilters = {
    prep: ["all", "20", "30", "45"].includes(prep) ? prep : "all",
    vegetarian,
    tags,
  };

  const needsExtra = filtersAreActive(filters);
  const fetchLimit = needsExtra
    ? Math.min(Math.max(Number.isFinite(limit) ? limit * 3 : 72, 48), 96)
    : Number.isFinite(limit)
      ? limit
      : 24;

  try {
    const data = await searchRecipes({
      q,
      limit: fetchLimit,
      offset: Number.isFinite(offset) ? offset : 0,
      vegetarian,
    });

    const items = needsExtra
      ? applyRecipeFilters(data.items, filters).slice(
          0,
          Number.isFinite(limit) ? limit : 24,
        )
      : data.items;

    return NextResponse.json({
      items,
      total: needsExtra ? items.length : data.total,
      filtered: needsExtra,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
