import type { RecipeSummary } from "./types";

export type PrepFilter = "all" | "15" | "20" | "30" | "45";
export type CalorieFilter = "all" | "650" | "800" | "1000";

export type RecipeFilters = {
  prep: PrepFilter;
  calories: CalorieFilter;
  /** Slug cuisine HelloFresh, ex. "italian". */
  cuisine: string | null;
  tags: string[];
};

export type FilterChip = {
  /** Valeur exacte du tag HelloFresh (ou clé stable). */
  id: string;
  label: string;
};

export type CuisineOption = {
  id: string | null;
  label: string;
};

export const PREP_OPTIONS: Array<{ id: PrepFilter; label: string }> = [
  { id: "all", label: "Toutes" },
  { id: "15", label: "≤ 15 min" },
  { id: "20", label: "≤ 20 min" },
  { id: "30", label: "≤ 30 min" },
  { id: "45", label: "≤ 45 min" },
];

export const CALORIE_OPTIONS: Array<{ id: CalorieFilter; label: string }> = [
  { id: "all", label: "Toutes" },
  { id: "650", label: "≤ 650 kcal" },
  { id: "800", label: "≤ 800 kcal" },
  { id: "1000", label: "≤ 1000 kcal" },
];

export const CUISINE_OPTIONS: CuisineOption[] = [
  { id: null, label: "Toutes" },
  { id: "french", label: "Française" },
  { id: "italian", label: "Italienne" },
  { id: "asian", label: "Asiatique" },
  { id: "thai", label: "Thaï" },
  { id: "japanese", label: "Japonaise" },
  { id: "chinese", label: "Chinoise" },
  { id: "korean", label: "Coréenne" },
  { id: "indian", label: "Indienne" },
  { id: "mexican", label: "Mexicaine" },
  { id: "lebanese", label: "Libanaise" },
  { id: "mediterranean", label: "Méditerranéenne" },
  { id: "moroccan", label: "Marocaine" },
  { id: "vietnamese", label: "Vietnamienne" },
  { id: "spanish", label: "Espagnole" },
  { id: "american", label: "Américaine" },
  { id: "african", label: "Africaine" },
];

/** Groupes de tags HelloFresh FR (id = nom/slug réel côté API). */
export const FILTER_TAG_GROUPS: Array<{
  id: string;
  label: string;
  tags: FilterChip[];
}> = [
  {
    id: "diet",
    label: "Régime",
    tags: [
      { id: "Végétarien", label: "Végétarien" },
      { id: "pescatarian", label: "Pescétarien" },
      { id: "pork-free", label: "Sans porc" },
      { id: "Œufs non inclus", label: "Sans œufs" },
    ],
  },
  {
    id: "style",
    label: "Style",
    tags: [
      { id: "Rapide", label: "Rapide" },
      { id: "Famille", label: "Famille" },
      { id: "Healthy", label: "Healthy" },
      { id: "Calorie Smart", label: "Calorie Smart" },
      { id: "Faible en calories", label: "Faible en calories" },
      { id: "Peu de vaisselle", label: "Peu de vaisselle" },
      { id: "One Pot", label: "One pot" },
      { id: "Compatible Air Fryer", label: "Air fryer" },
      { id: "Épicé", label: "Épicé" },
      { id: "Riche en protéines", label: "Riche en protéines" },
      { id: "Le plein de légumes", label: "Plein de légumes" },
      { id: "Source de fibres", label: "Source de fibres" },
      { id: "<40 g glucides", label: "Faible en glucides" },
    ],
  },
  {
    id: "plates",
    label: "Type de plat",
    tags: [
      { id: "pasta-noodles", label: "Pâtes" },
      { id: "dinner-bowls", label: "Bowls" },
      { id: "Curries", label: "Curries" },
      { id: "soup-stew", label: "Soupes & mijotés" },
      { id: "Bistrot", label: "Bistrot" },
      { id: "Mediterranee", label: "Méditerranée" },
      { id: "Worldwide", label: "Saveurs du monde" },
      { id: "pan-asian-plates", label: "Asie" },
      { id: "handhelds", label: "Street food" },
    ],
  },
];

/** Liste plate pour les boucles API / parsing. */
export const ALL_FILTER_TAGS: FilterChip[] = FILTER_TAG_GROUPS.flatMap(
  (group) => group.tags,
);

export const DEFAULT_FILTERS: RecipeFilters = {
  prep: "all",
  calories: "all",
  cuisine: null,
  tags: [],
};

function normalizeTag(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function recipeHasTag(recipe: RecipeSummary, tag: string): boolean {
  const target = normalizeTag(tag);
  return recipe.tags.some((entry) => {
    const normalized = normalizeTag(entry);
    return (
      normalized === target ||
      normalized.includes(target) ||
      target.includes(normalized)
    );
  });
}

export function applyRecipeFilters(
  items: RecipeSummary[],
  filters: RecipeFilters,
): RecipeSummary[] {
  const maxPrep = filters.prep === "all" ? null : Number(filters.prep);
  const maxCalories =
    filters.calories === "all" ? null : Number(filters.calories);

  return items.filter((recipe) => {
    if (maxPrep != null) {
      if (recipe.prepMinutes == null || recipe.prepMinutes > maxPrep) {
        return false;
      }
    }

    if (maxCalories != null) {
      if (recipe.calories == null || recipe.calories > maxCalories) {
        return false;
      }
    }

    if (filters.cuisine) {
      const wanted = normalizeTag(filters.cuisine);
      const cuisines = recipe.cuisines ?? [];
      const ok = cuisines.some((cuisine) => {
        const normalized = normalizeTag(cuisine);
        return (
          normalized === wanted ||
          normalized.includes(wanted) ||
          wanted.includes(normalized)
        );
      });
      // Si l’API a déjà filtré par cuisine, la liste cuisines peut être vide
      // sur certains items : on ne bloque alors pas.
      if (cuisines.length > 0 && !ok) return false;
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
    filters.prep !== "all" ||
    filters.calories !== "all" ||
    filters.cuisine != null ||
    filters.tags.length > 0
  );
}

export function tagLabel(tagId: string): string {
  return ALL_FILTER_TAGS.find((tag) => tag.id === tagId)?.label ?? tagId;
}
