"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { RecipeCard } from "./RecipeCard";
import type { RecipeSummary } from "@/lib/types";

type RecipesResponse = {
  items: RecipeSummary[];
  total: number;
  error?: string;
};

export function RecipeBrowser() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [items, setItems] = useState<RecipeSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const loadRecipes = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ limit: "24", offset: "0" });
        if (submittedQuery.trim()) params.set("q", submittedQuery.trim());

        const timeout = window.setTimeout(() => {
          if (!signal.aborted) {
            setError(
              "Le chargement prend trop de temps. Vérifie que le serveur tourne, puis réessaie.",
            );
            setLoading(false);
          }
        }, 25_000);

        const response = await fetch(`/api/recipes?${params}`, { signal });
        window.clearTimeout(timeout);
        if (signal.aborted) return;

        const data = (await response.json()) as RecipesResponse;
        if (!response.ok) {
          throw new Error(data.error ?? "Chargement impossible");
        }

        setItems(Array.isArray(data.items) ? data.items : []);
        setTotal(typeof data.total === "number" ? data.total : 0);
        setLoading(false);
      } catch (err) {
        if (signal.aborted || (err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Erreur réseau");
        setLoading(false);
      }
    },
    [submittedQuery],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadRecipes(controller.signal);
    return () => controller.abort();
  }, [loadRecipes, reloadKey]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query);
  }

  return (
    <section id="recettes" className="section">
      <div className="section-header">
        <p className="eyebrow">Recettes HelloFresh</p>
        <h2>Compose ta semaine</h2>
        <p className="lede">
          Choisis quelques plats. On fusionne les ingrédients par rayon, prêts
          pour Notes ou Rappels.
        </p>
      </div>

      <form className="search-bar" onSubmit={onSubmit} role="search">
        <label className="sr-only" htmlFor="recipe-search">
          Rechercher une recette
        </label>
        <input
          id="recipe-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Poulet, pâtes, végétarien…"
        />
        <button type="submit" className="btn btn-primary">
          Chercher
        </button>
      </form>

      {loading ? (
        <div className="status-panel" aria-busy="true">
          <p className="status-text">Chargement des recettes…</p>
          <p className="status-hint">
            Premier chargement un peu plus long (connexion HelloFresh).
          </p>
          <div className="recipe-grid" aria-hidden>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skeleton-card" />
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="status-panel" role="alert">
          <p className="status-text status-error">{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Réessayer
          </button>
        </div>
      ) : null}

      {!loading && !error ? (
        <p className="meta-line">{total.toLocaleString("fr-FR")} recettes</p>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <div className="empty-state">
          <h3>Aucune recette trouvée</h3>
          <p>Essaie un autre mot-clé, ou efface la recherche.</p>
        </div>
      ) : null}

      <div className="recipe-grid">
        {items.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </section>
  );
}
