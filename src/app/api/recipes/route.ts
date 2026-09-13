import { NextResponse } from "next/server";
import { searchRecipes } from "@/lib/hellofresh";
import {
  applyRecipeFilters,
  filtersAreActive,
  type CalorieFilter,
  type PrepFilter,
  type RecipeFilters,
} from "@/lib/recipeFilters";

const PREP_VALUES = new Set(["all", "15", "20", "30", "45"]);
const CALORIE_VALUES = new Set(["all", "650", "800", "1000"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? "24");
  const offset = Number(searchParams.get("offset") ?? "0");
  const prepRaw = searchParams.get("prep") ?? "all";
  const caloriesRaw = searchParams.get("calories") ?? "all";
  const cuisine = searchParams.get("cuisine");
  const tags = (searchParams.get("tags") ?? "")
    .split("|")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const filters: RecipeFilters = {
    prep: PREP_VALUES.has(prepRaw) ? (prepRaw as PrepFilter) : "all",
    calories: CALORIE_VALUES.has(caloriesRaw)
      ? (caloriesRaw as CalorieFilter)
      : "all",
    cuisine: cuisine?.trim() ? cuisine.trim() : null,
    tags,
  };

  const vegetarian = filters.tags.some((tag) =>
    /vegetarien/i.test(
      tag
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase(),
    ),
  );

  const needsExtra = filtersAreActive(filters);
  const fetchLimit = needsExtra
    ? Math.min(Math.max(Number.isFinite(limit) ? limit * 4 : 96, 72), 120)
    : Number.isFinite(limit)
      ? limit
      : 24;

  try {
    const data = await searchRecipes({
      q,
      limit: fetchLimit,
      offset: Number.isFinite(offset) ? offset : 0,
      vegetarian,
      cuisine: filters.cuisine,
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
