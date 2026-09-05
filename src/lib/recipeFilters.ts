import type { RecipeSummary } from "./types";

export type PrepFilter = "all" | "20" | "30" | "45";

export type RecipeFilters = {
  prep: PrepFilter;
  vegetarian: boolean;
  tags: string[];
};

/** Tags HelloFresh FR les plus utiles à filtrer. */
export const FILTER_TAGS = [
  "Rapide",
  "Famille",
  "Healthy",
  "Calorie Smart",
  "Peu de vaisselle",
  "Épicé",
  "Riche en protéines",
  "Le plein de légumes",
] as const;

export const PREP_OPTIONS: Array<{ id: PrepFilter; label: string }> = [
  { id: "all", label: "Toutes" },
  { id: "20", label: "≤ 20 min" },
  { id: "30", label: "≤ 30 min" },
  { id: "45", label: "≤ 45 min" },
];

export const DEFAULT_FILTERS: RecipeFilters = {
  prep: "all",
  vegetarian: false,
  tags: [],
};

function normalizeTag(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function recipeHasTag(recipe: RecipeSummary, tag: string): boolean {
  const target = normalizeTag(tag);
  return recipe.tags.some((entry) => normalizeTag(entry) === target);
}

export function applyRecipeFilters(
  items: RecipeSummary[],
  filters: RecipeFilters,
): RecipeSummary[] {
  const maxPrep = filters.prep === "all" ? null : Number(filters.prep);

  return items.filter((recipe) => {
    if (maxPrep != null) {
      if (recipe.prepMinutes == null || recipe.prepMinutes > maxPrep) {
        return false;
      }
    }

    if (filters.vegetarian && !recipeHasTag(recipe, "Végétarien")) {
      return false;
    }

    if (filters.tags.length > 0) {
      const ok = filters.tags.every((tag) => recipeHasTag(recipe, tag));
      if (!ok) return false;
    }

    return true;
  });
}

export function filtersAreActive(filters: RecipeFilters): boolean {
  return (
    filters.prep !== "all" || filters.vegetarian || filters.tags.length > 0
  );
}
