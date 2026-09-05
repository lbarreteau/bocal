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
  | "epicerie-salee"
  | "epicerie-sucree"
  | "boissons"
  | "herbes"
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
  { id: "herbes", label: "Herbes & aromates", emoji: "🌿" },
  { id: "epicerie-salee", label: "Épicerie salée", emoji: "🫙" },
  { id: "epicerie-sucree", label: "Épicerie sucrée", emoji: "🍯" },
  { id: "boissons", label: "Boissons", emoji: "🧃" },
  { id: "autres", label: "Autres", emoji: "🛒" },
];

const AISLE_BY_ID = Object.fromEntries(AISLES.map((a) => [a.id, a])) as Record<
  AisleId,
  Aisle
>;

type Rule = { aisle: AisleId; patterns: RegExp[] };

const RULES: Rule[] = [
  {
    aisle: "menager",
    patterns: [
      /\b(lessive|liquide\s+vaisselle|éponge|éponges|papier\s+toilette|essuie[-\s]?tout|sacs?\s+(poubelle|congélation)|film\s+alimentaire|aluminium|nettoyant|javel|détartrant)\b/i,
    ],
  },
  {
    aisle: "surgeles",
    patterns: [
      /\b(surgelé|surgelés|frozen|glace|glaces|sorbet|frites\s+surgel)/i,
    ],
  },
  {
    aisle: "frais",
    patterns: [
      /\b(lait|crème|creme|yaourt|yogourt|fromage|beurre|margarine|œufs?|oeufs?|mozzarella|parmesan|feta|ricotta|mascarpone|crème\s+fraîche|creme\s+fraiche|skyr|faisselle|fromage\s+blanc|emmental|comté|cheddar|gouda)\b/i,
    ],
  },
  {
    aisle: "boucherie",
    patterns: [
      /\b(poulet|dinde|boeuf|bœuf|veau|porc|agneau|canard|jambon|lardons?|bacon|saucisse|chorizo|steak|haché|hache|escalope|filet\s+mignon|merguez|chipolata|prosciutto|pancetta|guanciale|bacon)\b/i,
    ],
  },
  {
    aisle: "poisson",
    patterns: [
      /\b(saumon|cabillaud|lieu|thon|crevette|crevettes|moule|moules|poisson|truite|bar\b|dorade|sardine|anchois|calamar|encornet|crabe|homard|scampi|surimi)\b/i,
    ],
  },
  {
    aisle: "fruits-legumes",
    patterns: [
      /\b(tomate|tomates|oignon|oignons|échalote|echalote|ail|carotte|carottes|pomme\s+de\s+terre|patate|courgette|aubergine|poivron|poivrons|salade|laitue|épinard|epinard|brocoli|chou|concombre|avocat|citron|citron\s+vert|lime|orange|pomme|banane|fraise|fruits?|légume|legume|champignon|champignons|céleri|celeri|poireau|poireaux|navet|radis|betterave|haricot\s+vert|petit\s+pois|mais\b|maïs|gingembre|échalotes|fenouil|courge|potiron|patate\s+douce|igname|mangue|ananas|myrtille|framboise|raisin|poire|pêche|peche|kiwi|basilic\s+frais)\b/i,
    ],
  },
  {
    aisle: "boulangerie",
    patterns: [
      /\b(pain|baguette|brioche|tortilla|wrap|pita|naan|ciabatta|pain\s+de\s+mie|croissant|bun|buns|burger)\b/i,
    ],
  },
  {
    aisle: "herbes",
    patterns: [
      /\b(persil|coriandre|menthe|basilic|thym|romarin|ciboulette|aneth|estragon|laurier|origan\s+frais|herbes?\s+de\s+provence|herbes?\s+fraîches|herbes?\s+fraiches)\b/i,
    ],
  },
  {
    aisle: "epicerie-salee",
    patterns: [
      /\b(huile|vinaigre|moutarde|mayonnaise|ketchup|sauce\s+soja|soja|bouillon|cube|pâtes?|pates?|riz|quinoa|couscous|semoule|lentille|pois\s+chiche|haricot|conserve|tomates?\s+pelées|concentré\s+de\s+tomate|passata|farine|chapelure|levure|sel|poivre|paprika|cumin|curry|curcuma|cannelle|muscade|piment|chipotle|harissa|tahini|miso|nouilles|spaghetti|penne|fusilli|tagliatelle|gnocchi|tortellini|ravioli|olive|olives|câpre|capre|cornichon|pickles|tortillas?\s+de\s+maïs)\b/i,
    ],
  },
  {
    aisle: "epicerie-sucree",
    patterns: [
      /\b(sucre|miel|sirop|chocolat|cacao|vanille|confiture|compote|biscuit|cookies?|céréales|cereales|granola|amande|amandes|noix|noisette|noisettes|cacahuète|cacahuete|raisins?\s+secs|dattes?|abricots?\s+secs)\b/i,
    ],
  },
  {
    aisle: "boissons",
    patterns: [
      /\b(eau|jus|soda|bière|biere|vin|lait\s+de\s+(amande|avoine|soja|coco)|boisson|thé|the\b|café|cafe|limonade|cola)\b/i,
    ],
  },
];

export function categorizeIngredient(name: string): AisleId {
  const normalized = name.normalize("NFC").trim();
  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) {
      return rule.aisle;
    }
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

/** Texte prêt à coller dans Notes / Rappels Apple. */
export function formatListForApple(
  items: ShoppingItem[],
  options?: { title?: string },
): string {
  const title = options?.title ?? "Courses — Bocal";
  const groups = groupItemsByAisle(items);
  const lines: string[] = [title, ""];

  for (const group of groups) {
    lines.push(`${group.aisle.emoji} ${group.aisle.label}`);
    for (const item of group.items) {
      const amount = formatAmount(item.amount, item.unit);
      lines.push(`☐ ${item.name} — ${amount}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}

export function aisleLabelFor(name: string): string {
  return AISLE_BY_ID[categorizeIngredient(name)].label;
}
