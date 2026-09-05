# Bocal

App web pour choisir des recettes HelloFresh (catalogue public FR) et générer une liste de courses triée par rayon, exportable vers Apple Notes / Rappels.

## Fonctionnalités

1. Parcourir / chercher les recettes HelloFresh France
2. Sélectionner plusieurs recettes (stockées dans le navigateur)
3. Fusionner les ingrédients en une liste unique triée par rayon
4. Exporter vers Notes ou Rappels (partage / presse-papiers)

## Démarrage

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js (App Router)
- TypeScript
- CSS custom

## Notes

Les données recettes passent par l’API publique HelloFresh (jeton extrait de la page d’accueil). Si HelloFresh change son front, l’extraction du jeton peut nécessiter un ajustement.
