"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { RecipeSummary, SelectedRecipe } from "@/lib/types";

const STORAGE_KEY = "bocal-selection-v1";

type SelectionContextValue = {
  selected: SelectedRecipe[];
  recipesById: Record<string, RecipeSummary>;
  count: number;
  isSelected: (id: string) => boolean;
  toggle: (recipe: RecipeSummary, servings?: number) => void;
  setServings: (id: string, servings: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<SelectedRecipe[]>([]);
  const [recipesById, setRecipesById] = useState<Record<string, RecipeSummary>>(
    {},
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          selected?: SelectedRecipe[];
          recipesById?: Record<string, RecipeSummary>;
        };
        if (Array.isArray(parsed.selected)) setSelected(parsed.selected);
        if (parsed.recipesById) setRecipesById(parsed.recipesById);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ selected, recipesById }),
    );
  }, [selected, recipesById, hydrated]);

  const toggle = useCallback((recipe: RecipeSummary, servings = 2) => {
    setRecipesById((prev) => ({ ...prev, [recipe.id]: recipe }));
    setSelected((prev) => {
      if (prev.some((entry) => entry.id === recipe.id)) {
        return prev.filter((entry) => entry.id !== recipe.id);
      }
      return [...prev, { id: recipe.id, servings }];
    });
  }, []);

  const setServings = useCallback((id: string, servings: number) => {
    setSelected((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, servings: Math.max(1, servings) } : entry,
      ),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setSelected((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const clear = useCallback(() => setSelected([]), []);

  const value = useMemo(
    () => ({
      selected,
      recipesById,
      count: selected.length,
      isSelected: (id: string) => selected.some((entry) => entry.id === id),
      toggle,
      setServings,
      remove,
      clear,
    }),
    [selected, recipesById, toggle, setServings, remove, clear],
  );

  return (
    <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>
  );
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection must be used within SelectionProvider");
  return ctx;
}
