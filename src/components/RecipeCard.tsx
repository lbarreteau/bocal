"use client";

import Link from "next/link";
import { useSelection } from "./SelectionProvider";
import type { RecipeSummary } from "@/lib/types";

function difficultyLabel(value: number | null) {
  if (value == null) return null;
  if (value <= 1) return "Facile";
  if (value === 2) return "Moyen";
  return "Ambitieux";
}

export function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  const { isSelected, toggle } = useSelection();
  const selected = isSelected(recipe.id);
  const difficulty = difficultyLabel(recipe.difficulty);

  return (
    <article className={`recipe-card ${selected ? "is-selected" : ""}`}>
      <Link
        href={`/recette/${recipe.id}`}
        className="recipe-card-media"
        aria-label={`Voir ${recipe.name}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={recipe.image}
          alt=""
          className="recipe-card-image"
          loading="lazy"
          decoding="async"
        />
      </Link>
      <div className="recipe-card-body">
        <div className="meta-row">
          {recipe.prepMinutes ? <span>{recipe.prepMinutes} min</span> : null}
          {difficulty ? <span>{difficulty}</span> : null}
        </div>
        <h3>
          <Link href={`/recette/${recipe.id}`}>{recipe.name}</Link>
        </h3>
        {recipe.headline ? <p className="card-subtitle">{recipe.headline}</p> : null}
        <div className="recipe-card-actions">
          <button
            type="button"
            className={selected ? "btn btn-selected" : "btn btn-primary"}
            onClick={() => toggle(recipe)}
            aria-pressed={selected}
          >
            {selected ? "Ajoutée" : "Ajouter"}
          </button>
          <Link href={`/recette/${recipe.id}`} className="btn btn-secondary">
            Voir
          </Link>
        </div>
      </div>
    </article>
  );
}
