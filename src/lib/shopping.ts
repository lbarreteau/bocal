import type { RecipeDetail, SelectedRecipe, ShoppingItem } from "./types";

function roundAmount(value: number): number {
  if (Number.isInteger(value)) return value;
  if (value >= 100) return Math.round(value);
  if (value >= 10) return Math.round(value * 10) / 10;
  return Math.round(value * 100) / 100;
}

export function formatAmount(amount: number | null, unit: string | null): string {
  if (amount == null) return unit ? `selon besoin (${unit})` : "selon besoin";
  const rounded = roundAmount(amount);
  return unit ? `${rounded} ${unit}` : String(rounded);
}

export function mergeIngredients(
  recipes: Array<RecipeDetail & { servings: number }>,
): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>();

  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const key = `${ingredient.id}::${ingredient.unit ?? ""}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          key,
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
          image: ingredient.image,
          recipeIds: [recipe.id],
          recipeNames: [recipe.name],
        });
        continue;
      }

      if (existing.amount != null && ingredient.amount != null) {
        existing.amount = roundAmount(existing.amount + ingredient.amount);
      } else if (existing.amount == null && ingredient.amount != null) {
        existing.amount = ingredient.amount;
      }

      if (!existing.recipeIds.includes(recipe.id)) {
        existing.recipeIds.push(recipe.id);
        existing.recipeNames.push(recipe.name);
      }
      if (!existing.image && ingredient.image) existing.image = ingredient.image;
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "fr"),
  );
}

export function normalizeSelection(raw: unknown): SelectedRecipe[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const id = "id" in entry ? String((entry as { id: unknown }).id) : "";
      const servingsRaw =
        "servings" in entry
          ? Number((entry as { servings: unknown }).servings)
          : 2;
      const servings =
        Number.isFinite(servingsRaw) && servingsRaw > 0 ? servingsRaw : 2;
      if (!id) return null;
      return { id, servings };
    })
    .filter((entry): entry is SelectedRecipe => entry !== null);
}
