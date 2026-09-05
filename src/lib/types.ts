export type RecipeSummary = {
  id: string;
  name: string;
  headline: string;
  description: string;
  image: string;
  websiteUrl: string;
  prepMinutes: number | null;
  difficulty: number | null;
  tags: string[];
};

export type RecipeIngredient = {
  id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  shipped: boolean;
  image: string | null;
};

export type RecipeDetail = RecipeSummary & {
  ingredients: RecipeIngredient[];
  yieldsAvailable: number[];
};

export type ShoppingItem = {
  key: string;
  name: string;
  amount: number | null;
  unit: string | null;
  image: string | null;
  recipeIds: string[];
  recipeNames: string[];
};

export type SelectedRecipe = {
  id: string;
  servings: number;
};
