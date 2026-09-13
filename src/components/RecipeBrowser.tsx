"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { RecipeCard } from "./RecipeCard";
import {
  CALORIE_OPTIONS,
  CUISINE_OPTIONS,
  DEFAULT_FILTERS,
  FILTER_TAG_GROUPS,
  PREP_OPTIONS,
  filtersAreActive,
  type CalorieFilter,
  type PrepFilter,
  type RecipeFilters,
} from "@/lib/recipeFilters";
import type { RecipeSummary } from "@/lib/types";

type RecipesResponse = {
  items: RecipeSummary[];
  total: number;
  filtered?: boolean;
  error?: string;
};

export function RecipeBrowser() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [filters, setFilters] = useState<RecipeFilters>(DEFAULT_FILTERS);
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
        if (filters.prep !== "all") params.set("prep", filters.prep);
        if (filters.calories !== "all") {
          params.set("calories", filters.calories);
        }
        if (filters.cuisine) params.set("cuisine", filters.cuisine);
        if (filters.tags.length > 0) params.set("tags", filters.tags.join("|"));

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
    [submittedQuery, filters],
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

  function setPrep(prep: PrepFilter) {
    setFilters((prev) => ({ ...prev, prep }));
  }

  function setCalories(calories: CalorieFilter) {
    setFilters((prev) => ({ ...prev, calories }));
  }

  function setCuisine(cuisine: string | null) {
    setFilters((prev) => ({ ...prev, cuisine }));
  }

  function toggleTag(tag: string) {
    setFilters((prev) => {
      const exists = prev.tags.includes(tag);
      return {
        ...prev,
        tags: exists
          ? prev.tags.filter((entry) => entry !== tag)
          : [...prev.tags, tag],
      };
    });
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  const active = filtersAreActive(filters);

  return (
    <section id="recettes" className="section">
      <div className="section-header">
        <p className="eyebrow">Recettes HelloFresh</p>
        <h2>Compose ta semaine</h2>
        <p className="lede">
          Filtre par durée, calories, cuisine, régime ou style — comme sur
          HelloFresh.
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
          placeholder="Poulet, pâtes, curry…"
        />
        <button type="submit" className="btn btn-primary">
          Chercher
        </button>
      </form>

      <div className="filter-panel" aria-label="Filtres recettes">
        <div className="filter-row">
          <p className="filter-label">Durée</p>
          <div className="segmented" role="group" aria-label="Durée max">
            {PREP_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={filters.prep === option.id ? "is-active" : ""}
                aria-pressed={filters.prep === option.id}
                onClick={() => setPrep(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-row">
          <p className="filter-label">Calories</p>
          <div className="segmented" role="group" aria-label="Calories max">
            {CALORIE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={filters.calories === option.id ? "is-active" : ""}
                aria-pressed={filters.calories === option.id}
                onClick={() => setCalories(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-row">
          <p className="filter-label">Cuisine</p>
          <div
            className="filter-chips"
            role="group"
            aria-label="Cuisine HelloFresh"
          >
            {CUISINE_OPTIONS.map((option) => {
              const selected = filters.cuisine === option.id;
              return (
                <button
                  key={option.id ?? "all"}
                  type="button"
                  className={`filter-chip${selected ? " is-active" : ""}`}
                  aria-pressed={selected}
                  onClick={() => setCuisine(option.id)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {FILTER_TAG_GROUPS.map((group) => (
          <div key={group.id} className="filter-row">
            <p className="filter-label">{group.label}</p>
            <div
              className="filter-chips"
              role="group"
              aria-label={group.label}
            >
              {group.tags.map((tag) => {
                const selected = filters.tags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    className={`filter-chip${selected ? " is-active" : ""}`}
                    aria-pressed={selected}
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {active ? (
          <div className="filter-actions">
            <button
              type="button"
              className="btn btn-secondary btn-compact"
              onClick={resetFilters}
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : null}
      </div>

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
        <p className="meta-line">
          {total.toLocaleString("fr-FR")} recette{total > 1 ? "s" : ""}
          {active ? " (filtrées)" : ""}
        </p>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <div className="empty-state">
          <h3>Aucune recette trouvée</h3>
          <p>Essaie d’élargir la durée, les calories ou de retirer un filtre.</p>
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
