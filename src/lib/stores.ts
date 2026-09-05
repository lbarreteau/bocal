export type StoreId = "intermarche" | "leclerc";

export type StoreConfig = {
  id: StoreId;
  name: string;
  shortName: string;
  hint: string;
  searchUrl: (query: string) => string;
};

export const STORES: StoreConfig[] = [
  {
    id: "intermarche",
    name: "Intermarché",
    shortName: "Intermarché",
    hint: "Ouvre la recherche produits Intermarché dans un nouvel onglet.",
    searchUrl: (query) =>
      `https://www.intermarche.com/recherche/produits?q=${encodeURIComponent(query)}`,
  },
  {
    id: "leclerc",
    name: "E.Leclerc",
    shortName: "Leclerc",
    hint: "Ouvre la recherche E.Leclerc. Choisis ton Drive si demandé.",
    searchUrl: (query) =>
      `https://www.e.leclerc/recherche?q=${encodeURIComponent(query)}`,
  },
];
