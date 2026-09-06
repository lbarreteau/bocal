import type { ShoppingItem } from "./types";
import { formatAmount } from "./shopping";

export type AisleId =
  | "menager"
  | "surgeles"
  | "frais"
  | "boucherie"
  | "poisson"
  | "fruits-legumes"
  | "boulangerie"
  | "herbes"
  | "epicerie-salee"
  | "epicerie-sucree"
  | "boissons"
  | "autres";

export type Aisle = {
  id: AisleId;
  label: string;
  emoji: string;
};

/** Ordre type parcours magasin / Apple Reminders. */
export const AISLES: Aisle[] = [
  { id: "menager", label: "Produits ménagers", emoji: "🧹" },
  { id: "surgeles", label: "Surgelés", emoji: "🧊" },
  { id: "frais", label: "Frais & crèmerie", emoji: "🥛" },
  { id: "boucherie", label: "Boucherie & charcuterie", emoji: "🥩" },
  { id: "poisson", label: "Poissonnerie", emoji: "🐟" },
  { id: "fruits-legumes", label: "Fruits & légumes", emoji: "🥬" },
  { id: "boulangerie", label: "Boulangerie", emoji: "🥖" },
  { id: "herbes", label: "Herbes fraîches", emoji: "🌿" },
  { id: "epicerie-salee", label: "Épicerie salée", emoji: "🫙" },
  { id: "epicerie-sucree", label: "Épicerie sucrée", emoji: "🍯" },
  { id: "boissons", label: "Boissons", emoji: "🧃" },
  { id: "autres", label: "Autres", emoji: "🛒" },
];

const AISLE_BY_ID = Object.fromEntries(AISLES.map((a) => [a.id, a])) as Record<
  AisleId,
  Aisle
>;

/** Minuscules + sans accents pour matcher robustement. */
function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/['’]/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasWord(text: string, word: string): boolean {
  return new RegExp(`(?:^|\\s)${word}(?:s)?(?:\\s|$)`).test(text);
}

function hasAnyWord(text: string, words: string[]): boolean {
  return words.some((word) => hasWord(text, word));
}

function hasPhrase(text: string, phrase: string): boolean {
  return text.includes(phrase);
}

function hasAnyPhrase(text: string, phrases: string[]): boolean {
  return phrases.some((phrase) => hasPhrase(text, phrase));
}

/**
 * Classement par priorité :
 * 1. indices explicites (surgelé, conserve, jus…)
 * 2. rayons « forts »
 * 3. vocabulaire large
 */
export function categorizeIngredient(name: string): AisleId {
  const text = normalize(name);
  if (!text) return "autres";

  // --- Surgelés ---
  if (
    hasAnyPhrase(text, [
      "surgel",
      "frozen",
      "congel",
      "frites surgel",
      "petits pois surgel",
      "epinards surgel",
      "legumes surgel",
      "fruits surgel",
    ]) ||
    hasWord(text, "sorbet") ||
    (hasWord(text, "glace") && !hasPhrase(text, "eau de"))
  ) {
    return "surgeles";
  }

  // --- Boissons (avant fruits : jus d'orange, etc.) ---
  if (
    hasAnyPhrase(text, [
      "jus d",
      "jus de",
      "eau gazeuse",
      "eau minerale",
      "eau petillante",
      "sirop de menthe",
      "sirop de grenadine",
      "lait de coco",
      "lait d amande",
      "lait d avoine",
      "lait de soja",
      "lait de riz",
      "boisson vegetale",
    ]) ||
    hasAnyWord(text, [
      "biere",
      "vin",
      "cidre",
      "cola",
      "soda",
      "limonade",
      "sprite",
      "the",
      "cafe",
      "espresso",
      "smoothie",
      "nectar",
    ])
  ) {
    // lait végétal → plutôt épicerie (cuisine HF)
    if (
      hasAnyPhrase(text, [
        "lait de coco",
        "lait d amande",
        "lait d avoine",
        "lait de soja",
        "lait de riz",
        "boisson vegetale",
      ])
    ) {
      return "epicerie-salee";
    }
    return "boissons";
  }

  // --- Conserves / sec (avant poisson/fruits) ---
  if (
    hasAnyPhrase(text, [
      "concentre de tomate",
      "tomates pelees",
      "tomate pelee",
      "coulis de tomate",
      "passata",
      "sauce tomate",
      "puree de tomate",
      "thon au naturel",
      "thon a l huile",
      "thon en conserve",
      "sardines en conserve",
      "pois chiches",
      "pois chiche",
      "haricots rouges",
      "haricots blancs",
      "haricot rouge",
      "haricot blanc",
      "lentilles corail",
      "sauce soja",
      "sauce poisson",
      "cube de bouillon",
      "bouillon cube",
      "fond de veau",
      "fond de volaille",
      "herbes de provence",
      "melange d epices",
      "quatre epices",
      "cinq epices",
      "ail en poudre",
      "oignon en poudre",
      "gingembre en poudre",
      "basilic seche",
      "origan seche",
      "persil seche",
      "thym seche",
    ]) ||
    (hasWord(text, "conserve") &&
      hasAnyWord(text, [
        "thon",
        "sardine",
        "mais",
        "haricot",
        "pois",
        "tomate",
      ])) ||
    (hasWord(text, "epice") && !hasPhrase(text, "frais"))
  ) {
    return "epicerie-salee";
  }

  // --- Ménager ---
  if (
    hasAnyWord(text, [
      "lessive",
      "javel",
      "detartrant",
      "nettoyant",
      "eponge",
      "aluminium",
    ]) ||
    hasAnyPhrase(text, [
      "liquide vaisselle",
      "papier toilette",
      "papier absorbant",
      "essuie tout",
      "sac poubelle",
      "sacs poubelle",
      "film alimentaire",
      "papier alu",
      "papier sulfurise",
    ])
  ) {
    return "menager";
  }

  // --- Herbes fraîches (avant fruits/légumes) ---
  if (
    !hasAnyPhrase(text, ["seche", "seches", "en poudre", "de provence"]) &&
    (hasAnyWord(text, [
      "persil",
      "coriandre",
      "menthe",
      "basilic",
      "ciboulette",
      "aneth",
      "estragon",
      "cerfeuil",
      "oseille",
    ]) ||
      hasAnyPhrase(text, [
        "herbes fraiches",
        "herbe fraiche",
        "romarin frais",
        "thym frais",
        "origan frais",
        "laurier frais",
      ]))
  ) {
    return "herbes";
  }

  // --- Boucherie / charcuterie ---
  if (
    hasAnyWord(text, [
      "poulet",
      "dinde",
      "canard",
      "boeuf",
      "veau",
      "porc",
      "agneau",
      "jambon",
      "lardon",
      "bacon",
      "saucisse",
      "chorizo",
      "steak",
      "hache",
      "escalope",
      "merguez",
      "chipolata",
      "prosciutto",
      "pancetta",
      "guanciale",
      "ribs",
      "travers",
      "magret",
      "andouillette",
      "boudin",
      "terrine",
      "rosette",
      "coppa",
      "mortadelle",
      "pepperoni",
      "salami",
      "speck",
      "saucisson",
      "rillette",
    ]) ||
    hasAnyPhrase(text, [
      "filet mignon",
      "blanc de poulet",
      "blanc de dinde",
      "cuisse de",
      "haut de cuisse",
      "araignee de",
      "rumsteck",
      "entrecote",
      "faux filet",
      "cote de boeuf",
      "cote de porc",
      "roti de",
      "emince de",
      "pate de campagne",
      "pate en croute",
      "confit de canard",
    ])
  ) {
    return "boucherie";
  }

  // --- Poissonnerie ---
  if (
    hasAnyWord(text, [
      "saumon",
      "cabillaud",
      "colin",
      "merlu",
      "sole",
      "truite",
      "dorade",
      "daurade",
      "bar",
      "loup",
      "sardine",
      "anchois",
      "maquereau",
      "crevette",
      "gambas",
      "moule",
      "calamar",
      "encornet",
      "seiche",
      "crabe",
      "homard",
      "scampi",
      "surimi",
      "poisson",
      "bulot",
      "tourteau",
      "huitre",
    ]) ||
    hasAnyPhrase(text, [
      "filet de poisson",
      "pave de saumon",
      "pave de cabillaud",
      "darne de",
      "queue de lotte",
      "fruits de mer",
      "noix de st",
      "coquille saint",
      "lieu noir",
      "lieu jaune",
    ])
  ) {
    return "poisson";
  }

  // --- Frais & crèmerie ---
  if (
    hasAnyWord(text, [
      "lait",
      "creme",
      "yaourt",
      "yogourt",
      "yogurt",
      "fromage",
      "beurre",
      "margarine",
      "oeuf",
      "mozzarella",
      "parmesan",
      "feta",
      "ricotta",
      "mascarpone",
      "skyr",
      "faisselle",
      "emmental",
      "comte",
      "cheddar",
      "gouda",
      "gruyere",
      "raclette",
      "reblochon",
      "camembert",
      "brie",
      "chevre",
      "burrata",
      "halloumi",
      "paneer",
      "kefir",
    ]) ||
    hasAnyPhrase(text, [
      "creme fraiche",
      "creme liquide",
      "creme epaisse",
      "creme fleurette",
      "fromage blanc",
      "fromage rape",
      "fromage frais",
      "petit suisse",
      "blanc d oeuf",
      "jaune d oeuf",
    ])
  ) {
    return "frais";
  }

  // --- Boulangerie ---
  if (
    hasAnyWord(text, [
      "pain",
      "baguette",
      "brioche",
      "tortilla",
      "wrap",
      "pita",
      "naan",
      "ciabatta",
      "croissant",
      "bun",
      "burger",
      "muffin",
      "bagel",
      "focaccia",
    ]) ||
    hasAnyPhrase(text, [
      "pain de mie",
      "pain burger",
      "pain hot dog",
      "galette de sarrasin",
    ])
  ) {
    return "boulangerie";
  }

  // --- Fruits & légumes (pomme de terre AVANT pomme) ---
  if (
    hasAnyPhrase(text, [
      "pomme de terre",
      "patate douce",
      "oignon rouge",
      "oignon jaune",
      "oignon nouveau",
      "citron vert",
      "citron jaune",
      "tomate cerise",
      "tomates cerises",
      "haricot vert",
      "haricots verts",
      "petit pois",
      "petits pois",
      "pois gourmand",
      "champignon de paris",
      "champignons de paris",
      "chou fleur",
      "chou rouge",
      "chou kale",
      "chou chinois",
      "jeune pousse",
      "jeunes pousses",
      "gingembre frais",
      "curcuma frais",
    ]) ||
    hasAnyWord(text, [
      "tomate",
      "oignon",
      "echalote",
      "ail",
      "carotte",
      "courgette",
      "aubergine",
      "poivron",
      "salade",
      "laitue",
      "epinard",
      "brocoli",
      "chou",
      "concombre",
      "avocat",
      "citron",
      "lime",
      "orange",
      "clementine",
      "mandarine",
      "pamplemousse",
      "pomme",
      "banane",
      "fraise",
      "framboise",
      "myrtille",
      "mure",
      "raisin",
      "poire",
      "peche",
      "nectarine",
      "abricot",
      "cerise",
      "kiwi",
      "mangue",
      "ananas",
      "melon",
      "pasteque",
      "figue",
      "grenade",
      "fruit",
      "legume",
      "champignon",
      "pleurote",
      "shiitake",
      "celeri",
      "poireau",
      "navet",
      "radis",
      "betterave",
      "mais",
      "gingembre",
      "fenouil",
      "courge",
      "potiron",
      "butternut",
      "potimarron",
      "igname",
      "patate",
      "asperge",
      "artichaut",
      "endive",
      "mache",
      "roquette",
      "cresson",
      "blette",
      "scarole",
      "chicoree",
      "panais",
      "rutabaga",
      "topinambour",
      "ciboule",
    ])
  ) {
    return "fruits-legumes";
  }

  // --- Épicerie sucrée ---
  if (
    hasAnyWord(text, [
      "sucre",
      "miel",
      "chocolat",
      "cacao",
      "vanille",
      "confiture",
      "compote",
      "biscuit",
      "cookie",
      "cereale",
      "granola",
      "amande",
      "noix",
      "noisette",
      "cacahuete",
      "pistache",
      "cajou",
      "datte",
      "canneberge",
      "cranberry",
      "nougat",
      "caramel",
      "nutella",
    ]) ||
    hasAnyPhrase(text, [
      "sucre en poudre",
      "sucre glace",
      "sucre roux",
      "sirop d erable",
      "sirop d agave",
      "extrait de vanille",
      "fleur d oranger",
      "raisins secs",
      "abricots secs",
      "fruits secs",
      "pepites de chocolat",
      "pate a tartiner",
    ])
  ) {
    return "epicerie-sucree";
  }

  // --- Épicerie salée (filet large) ---
  if (
    hasAnyWord(text, [
      "huile",
      "vinaigre",
      "moutarde",
      "mayonnaise",
      "ketchup",
      "soja",
      "bouillon",
      "cube",
      "pate",
      "riz",
      "quinoa",
      "couscous",
      "semoule",
      "lentille",
      "farine",
      "chapelure",
      "levure",
      "sel",
      "poivre",
      "paprika",
      "cumin",
      "curry",
      "curcuma",
      "cannelle",
      "muscade",
      "piment",
      "chipotle",
      "harissa",
      "tahini",
      "miso",
      "nouille",
      "spaghetti",
      "penne",
      "fusilli",
      "tagliatelle",
      "gnocchi",
      "tortellini",
      "ravioli",
      "olive",
      "capre",
      "cornichon",
      "pickle",
      "polenta",
      "boulgour",
      "orge",
      "avoine",
      "flocons",
      "fecule",
      "maizena",
      "sauce",
      "pesto",
      "tapenade",
      "hummus",
      "houmous",
      "sambal",
      "sriracha",
      "tabasco",
      "dashi",
      "nori",
      "wakame",
      "algue",
      "sesame",
      "thon",
    ]) ||
    hasAnyPhrase(text, [
      "huile d olive",
      "huile de tournesol",
      "huile de sesame",
      "vinaigre balsamique",
      "vinaigre de",
      "sauce soja",
      "pate de curry",
      "pate de tomate",
      "concentre de",
      "tomates pelees",
      "pois chiches",
      "haricots secs",
      "feuilles de brick",
      "feuille de riz",
      "galette de riz",
      "vermicelle",
      "nouilles de riz",
      "tortillas de mais",
      "nuoc mam",
      "nam pla",
      "graines de",
    ])
  ) {
    return "epicerie-salee";
  }

  // --- Boissons restantes ---
  if (hasAnyWord(text, ["eau", "jus", "boisson"])) {
    return "boissons";
  }

  return "autres";
}

export type GroupedAisle = {
  aisle: Aisle;
  items: ShoppingItem[];
};

export function groupItemsByAisle(items: ShoppingItem[]): GroupedAisle[] {
  const buckets = new Map<AisleId, ShoppingItem[]>();
  for (const item of items) {
    const aisleId = categorizeIngredient(item.name);
    const list = buckets.get(aisleId) ?? [];
    list.push(item);
    buckets.set(aisleId, list);
  }

  return AISLES.map((aisle) => {
    const list = buckets.get(aisle.id);
    if (!list?.length) return null;
    return {
      aisle,
      items: [...list].sort((a, b) => a.name.localeCompare(b.name, "fr")),
    };
  }).filter((group): group is GroupedAisle => group !== null);
}

export type ExportRecipe = {
  name: string;
  servings?: number;
};

/**
 * Texte prêt pour Notes / Rappels Apple.
 * Les produits sont en lignes simples (sans ☐) : dans Notes, sélectionne-les
 * puis appuie sur le bouton checklist pour des cases vraiment cliquables.
 */
export function formatListForApple(
  items: ShoppingItem[],
  options?: { title?: string; recipes?: ExportRecipe[]; includeTip?: boolean },
): string {
  const title = options?.title ?? "Courses — Bocal";
  const groups = groupItemsByAisle(items);
  const lines: string[] = [title, ""];

  const recipes = options?.recipes?.filter((recipe) => recipe.name.trim()) ?? [];
  if (recipes.length > 0) {
    lines.push("Recettes");
    for (const recipe of recipes) {
      const servings =
        typeof recipe.servings === "number" && recipe.servings > 0
          ? ` — ${recipe.servings} pers.`
          : "";
      lines.push(`• ${recipe.name}${servings}`);
    }
    lines.push("");
  }

  for (const group of groups) {
    lines.push(group.aisle.label);
    for (const item of group.items) {
      const amount = formatAmount(item.amount, item.unit);
      // Ligne simple : Notes convertit mieux en checklist native que les ☐ unicode
      lines.push(`${item.name} — ${amount}`);
    }
    lines.push("");
  }

  if (options?.includeTip !== false) {
    lines.push(
      "Astuce Notes : sélectionne les lignes de produits ci-dessus, puis appuie sur le bouton checklist (cercle ✓) au-dessus du clavier.",
    );
  }

  return lines.join("\n").trimEnd() + "\n";
}

export function aisleLabelFor(name: string): string {
  return AISLE_BY_ID[categorizeIngredient(name)].label;
}
