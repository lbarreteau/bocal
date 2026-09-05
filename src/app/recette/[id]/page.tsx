import { RecipeDetailView } from "@/components/RecipeDetailView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecettePage({ params }: PageProps) {
  const { id } = await params;
  return <RecipeDetailView recipeId={id} />;
}
