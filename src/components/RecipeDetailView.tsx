"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSelection } from "@/components/SelectionProvider";
import { formatAmount } from "@/lib/shopping";
import type { RecipeDetail, RecipeSummary } from "@/lib/types";

export function RecipeDetailView({ recipeId }: { recipeId: string }) {
  const { isSelected, toggle } = useSelection();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/recipes/${encodeURIComponent(recipeId)}?servings=2`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as RecipeDetail & { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Recette introuvable");
        }
        setRecipe(data);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Erreur réseau");
      } finally {
        setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [recipeId]);

  if (loading) {
    return (
      <section className="section">
        <p className="status-text">Chargement de la recette…</p>
      </section>
    );
  }

  if (error || !recipe) {
    return (
      <section className="section">
        <div className="empty-state">
          <h1>Recette introuvable</h1>
          <p>{error ?? "Cette fiche n’est pas disponible."}</p>
          <Link href="/#recettes" className="btn btn-primary">
            Retour aux recettes
          </Link>
        </div>
      </section>
    );
  }

  const selected = isSelected(recipe.id);
  const summary: RecipeSummary = recipe;

  return (
    <section className="section recipe-detail">
      <Link href="/#recettes" className="text-link">
        ← Recettes
      </Link>

      <div className="detail-layout">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={recipe.image}
          alt=""
          className="detail-image"
        />
        <div className="detail-copy">
          <p className="eyebrow">HelloFresh</p>
          <h1>{recipe.name}</h1>
          {recipe.headline ? <p className="lede">{recipe.headline}</p> : null}
          <div className="meta-row">
            {recipe.prepMinutes ? <span>{recipe.prepMinutes} min</span> : null}
            {recipe.difficulty != null ? (
              <span>
                {recipe.difficulty <= 1
                  ? "Facile"
                  : recipe.difficulty === 2
                    ? "Moyen"
                    : "Ambitieux"}
              </span>
            ) : null}
          </div>
          {recipe.description ? (
            <p className="body-text">{recipe.description}</p>
          ) : null}
          <div className="inline-actions">
            <button
              type="button"
              className={selected ? "btn btn-selected" : "btn btn-primary"}
              onClick={() => toggle(summary)}
              aria-pressed={selected}
            >
              {selected ? "Ajoutée à ma semaine" : "Ajouter à ma semaine"}
            </button>
            <Link href="/liste" className="btn btn-secondary">
              Voir ma liste
            </Link>
          </div>
        </div>
      </div>

      <div className="ingredient-panel">
        <h2>Ingrédients</h2>
        <p className="meta-line">Pour 2 portions</p>
        <ul className="ingredient-list">
          {recipe.ingredients.map((ingredient) => (
            <li key={ingredient.id}>
              <span>{ingredient.name}</span>
              <strong>{formatAmount(ingredient.amount, ingredient.unit)}</strong>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
