"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSelection } from "./SelectionProvider";
import { formatListForApple, groupItemsByAisle } from "@/lib/categories";
import { formatAmount } from "@/lib/shopping";
import type { ShoppingItem } from "@/lib/types";

type ListResponse = {
  items: ShoppingItem[];
  recipes: Array<{
    id: string;
    name: string;
    image: string;
    servings: number;
    websiteUrl: string;
  }>;
  error?: string;
};

export function ShoppingListView() {
  const { selected, recipesById, setServings, remove, clear } = useSelection();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (selected.length === 0) {
      setData({ items: [], recipes: [] });
      return;
    }

    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/shopping-list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipes: selected }),
          signal: controller.signal,
        });
        const json = (await response.json()) as ListResponse;
        if (!response.ok) throw new Error(json.error ?? "Liste indisponible");
        setData(json);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Erreur réseau");
      } finally {
        setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [selected]);

  const items = data?.items ?? [];
  const remaining = items.filter((item) => !checked[item.key]);
  const grouped = useMemo(() => groupItemsByAisle(items), [items]);

  async function exportForApple() {
    const source = remaining.length > 0 ? remaining : items;
    if (source.length === 0) return;

    const text = formatListForApple(source, {
      title: `Courses — Bocal (${source.length})`,
    });

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: "Courses — Bocal",
          text,
        });
        setExportStatus("Partagé — choisis Notes ou Rappels");
      } else {
        await navigator.clipboard.writeText(text);
        setExportStatus("Liste copiée — colle-la dans Notes ou Rappels");
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(text);
        setExportStatus("Liste copiée — colle-la dans Notes ou Rappels");
      } catch {
        setExportStatus("Impossible d’exporter automatiquement");
      }
    }

    window.setTimeout(() => setExportStatus(null), 4000);
  }

  if (selected.length === 0) {
    return (
      <section className="section">
        <div className="empty-state">
          <h1>Liste vide</h1>
          <p>Ajoute d’abord quelques recettes HelloFresh.</p>
          <Link href="/#recettes" className="btn btn-primary">
            Parcourir les recettes
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="section-header">
        <p className="eyebrow">Courses</p>
        <h1>Liste fusionnée</h1>
        <p className="lede">
          {selected.length} recette{selected.length > 1 ? "s" : ""} · triée par
          rayon, prête pour Notes ou Rappels.
        </p>
      </div>

      <div className="toolbar">
        <div className="toolbar-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void exportForApple()}
            disabled={items.length === 0}
          >
            Exporter
          </button>
          <button type="button" className="btn btn-secondary" onClick={clear}>
            Tout retirer
          </button>
        </div>
      </div>
      {exportStatus ? (
        <p className="status-text status-ok" role="status">
          {exportStatus}
        </p>
      ) : null}

      <div className="selected-panel">
        {selected.map((entry) => {
          const meta =
            recipesById[entry.id] ??
            data?.recipes.find((recipe) => recipe.id === entry.id);
          return (
            <div key={entry.id} className="selected-row">
              <div className="selected-main">
                {meta?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={meta.image} alt="" width={48} height={48} />
                ) : null}
                <div>
                  <strong>{meta?.name ?? entry.id}</strong>
                  <label className="servings-label">
                    Portions
                    <select
                      value={entry.servings}
                      onChange={(event) =>
                        setServings(entry.id, Number(event.target.value))
                      }
                    >
                      {[1, 2, 3, 4, 5, 6].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-compact"
                onClick={() => remove(entry.id)}
              >
                Retirer
              </button>
            </div>
          );
        })}
      </div>

      {loading ? <p className="status-text">Préparation de la liste…</p> : null}
      {error ? (
        <p className="status-text status-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="aisle-groups">
        {grouped.map((group) => (
          <section key={group.aisle.id} className="aisle-group">
            <h2 className="aisle-title">{group.aisle.label}</h2>
            <ul className="shopping-list">
              {group.items.map((item) => {
                const isChecked = Boolean(checked[item.key]);
                return (
                  <li key={item.key} className={isChecked ? "is-checked" : ""}>
                    <label className="shopping-item">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          setChecked((prev) => ({
                            ...prev,
                            [item.key]: !prev[item.key],
                          }))
                        }
                      />
                      <span>
                        <strong>{item.name}</strong>
                        <em>{formatAmount(item.amount, item.unit)}</em>
                        <small>{item.recipeNames.join(" · ")}</small>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
