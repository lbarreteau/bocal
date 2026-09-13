import type { RecipeDetail, RecipeIngredient, RecipeSummary } from "./types";

const HF_ORIGIN = "https://www.hellofresh.fr";
const HF_API = "https://gw.hellofresh.com/api";
const IMAGE_CDN = "https://img.hellofresh.com";

let tokenCache: { token: string; expiresAt: number } | null = null;

function parseIsoDurationMinutes(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!match) return null;
  const total = Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0);
  return total > 0 ? total : null;
}

function extractImagePath(value: string): string | null {
  const marker = value.indexOf("/image/");
  if (marker >= 0) return value.slice(marker);
  if (value.startsWith("/")) return value;
  return null;
}

function absoluteImage(pathOrUrl: unknown, fallback?: unknown): string {
  const raw =
    typeof pathOrUrl === "string" && pathOrUrl.length > 0
      ? pathOrUrl
      : typeof fallback === "string"
        ? fallback
        : "";

  if (!raw) {
    return `${IMAGE_CDN}/hellofresh_s3/image/placeholder.jpg`;
  }

  // CloudFront 0,0/... URLs often 502 from browsers; img.hellofresh.com/hellofresh_s3 works.
  if (raw.includes("img.hellofresh.com/hellofresh_s3/")) {
    return raw;
  }

  const path = extractImagePath(raw);
  if (path) {
    return `${IMAGE_CDN}/hellofresh_s3${path.startsWith("/") ? path : `/${path}`}`;
  }

  if (raw.startsWith("http")) return raw;
  return `${IMAGE_CDN}/hellofresh_s3/${raw}`;
}

async function fetchAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.token;
  }

  // Homepage embeds the same public token and is much lighter than /recipes (~1.5MB vs ~6MB).
  const response = await fetch(`${HF_ORIGIN}/`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "fr-FR,fr;q=0.9",
    },
    signal: AbortSignal.timeout(20_000),
    next: { revalidate: 1800 },
  });

  if (!response.ok) {
    throw new Error(`Impossible de récupérer le jeton HelloFresh (${response.status})`);
  }

  const html = await response.text();
  const match = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (!match?.[1]) {
    throw new Error("Données HelloFresh introuvables");
  }

  const nextData = JSON.parse(match[1]) as {
    props?: {
      pageProps?: {
        ssrPayload?: {
          serverAuth?: {
            access_token?: string;
            expires_in?: number;
          };
        };
      };
    };
  };

  const auth = nextData.props?.pageProps?.ssrPayload?.serverAuth;
  if (!auth?.access_token) {
    throw new Error("Jeton HelloFresh manquant");
  }

  tokenCache = {
    token: auth.access_token,
    expiresAt: now + (auth.expires_in ?? 3600) * 1000,
  };
  return auth.access_token;
}

async function hfFetch<T>(path: string, query: Record<string, string>): Promise<T> {
  const token = await fetchAccessToken();
  const url = new URL(`${HF_API}${path}`);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(20_000),
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HelloFresh API ${response.status}: ${body.slice(0, 200)}`);
  }

  return (await response.json()) as T;
}

type HfNutrition = {
  type?: string;
  name?: string;
  amount?: number;
  unit?: string;
};

type HfSearchItem = {
  id: string;
  name: string;
  headline?: string;
  description?: string;
  imageLink?: string;
  imagePath?: string;
  websiteUrl?: string;
  prepTime?: string;
  difficulty?: number;
  slug?: string;
  tags?: Array<{ name?: string; slug?: string }>;
  cuisines?: Array<{ name?: string; slug?: string; type?: string }>;
  nutrition?: HfNutrition[];
};

type HfRecipeDetail = HfSearchItem & {
  ingredients?: Array<{
    id: string;
    name: string;
    shipped?: boolean;
    imageLink?: string;
    imagePath?: string;
  }>;
  yields?: Array<{
    yields: number;
    ingredients: Array<{ id: string; amount: number | null; unit: string | null }>;
  }>;
};

function extractCalories(nutrition: HfNutrition[] | undefined): number | null {
  if (!Array.isArray(nutrition) || nutrition.length === 0) return null;

  const kcalEntry =
    nutrition.find(
      (entry) =>
        entry.unit?.toLowerCase() === "kcal" ||
        /kcal/i.test(entry.name ?? ""),
    ) ?? null;

  if (kcalEntry == null || typeof kcalEntry.amount !== "number") return null;
  if (!Number.isFinite(kcalEntry.amount) || kcalEntry.amount <= 0) return null;

  return Math.round(kcalEntry.amount);
}

function mapSummary(item: HfSearchItem): RecipeSummary {
  const tagNames = (item.tags ?? [])
    .flatMap((tag) => [tag.name, tag.slug])
    .filter((name): name is string => Boolean(name));

  const cuisineNames = (item.cuisines ?? [])
    .flatMap((cuisine) => [cuisine.name, cuisine.slug, cuisine.type])
    .filter((name): name is string => Boolean(name));

  return {
    id: item.id,
    name: item.name,
    headline: item.headline ?? "",
    description: item.description ?? "",
    image: absoluteImage(item.imageLink, item.imagePath),
    websiteUrl:
      item.websiteUrl ??
      `${HF_ORIGIN}/recipes/${item.slug ?? item.id}-${item.id}`,
    prepMinutes: parseIsoDurationMinutes(item.prepTime),
    difficulty: typeof item.difficulty === "number" ? item.difficulty : null,
    calories: extractCalories(item.nutrition),
    tags: [...new Set(tagNames)].slice(0, 24),
    cuisines: [...new Set(cuisineNames)].slice(0, 12),
  };
}

export async function searchRecipes(options: {
  q?: string;
  limit?: number;
  offset?: number;
  vegetarian?: boolean;
  cuisine?: string | null;
}): Promise<{ items: RecipeSummary[]; total: number }> {
  const query: Record<string, string> = {
    country: "fr",
    locale: "fr-FR",
    limit: String(options.limit ?? 24),
    offset: String(options.offset ?? 0),
    products: "classic-box|veggie-box|meal-plan",
  };

  if (options.cuisine?.trim()) {
    query.cuisine = options.cuisine.trim();
  }

  // La recherche texte "végétarien" est plus fiable que products=veggie-box
  // (qui renvoie parfois des recettes non végétariennes).
  if (options.vegetarian) {
    const base = options.q?.trim() ?? "";
    query.q = base ? `${base} végétarien` : "végétarien";
  } else if (options.q?.trim()) {
    query.q = options.q.trim();
  }

  const data = await hfFetch<{ items: HfSearchItem[]; total: number }>(
    "/recipes/search",
    query,
  );

  return {
    items: (data.items ?? []).map(mapSummary),
    total: data.total ?? 0,
  };
}

export async function getRecipeDetail(
  id: string,
  servings = 2,
): Promise<RecipeDetail> {
  const data = await hfFetch<HfRecipeDetail>(`/recipes/${id}`, {
    country: "fr",
    locale: "fr-FR",
  });

  const summary = mapSummary(data);
  const yieldsAvailable = (data.yields ?? [])
    .map((entry) => entry.yields)
    .filter((value) => typeof value === "number")
    .sort((a, b) => a - b);

  const chosenYield =
    data.yields?.find((entry) => entry.yields === servings) ??
    data.yields?.find((entry) => entry.yields === 2) ??
    data.yields?.[0];

  const amountsById = new Map(
    (chosenYield?.ingredients ?? []).map((entry) => [entry.id, entry]),
  );

  const ingredients: RecipeIngredient[] = (data.ingredients ?? []).map((ing) => {
    const amountEntry = amountsById.get(ing.id);
    return {
      id: ing.id,
      name: ing.name,
      amount: amountEntry?.amount ?? null,
      unit: amountEntry?.unit ?? null,
      shipped: Boolean(ing.shipped),
      image:
        ing.imageLink || ing.imagePath
          ? absoluteImage(ing.imageLink, ing.imagePath)
          : null,
    };
  });

  return {
    ...summary,
    ingredients,
    yieldsAvailable: yieldsAvailable.length ? yieldsAvailable : [2],
  };
}
