# Bocal

App web pour choisir des recettes HelloFresh (catalogue public FR) et générer une liste de courses avec liens vers Intermarché et Leclerc.

## Fonctionnalités

1. Parcourir / chercher les recettes HelloFresh France
2. Sélectionner plusieurs recettes (stockées dans le navigateur)
3. Fusionner les ingrédients en une liste unique
4. Ouvrir chaque produit dans Intermarché ou Leclerc (liens de recherche)

> Pas de remplissage automatique du panier Drive : les enseignes n’exposent pas d’API consommateur fiable pour ça.

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

Les données recettes passent par l’API publique HelloFresh (jeton extrait de la page `/recipes`). Si HelloFresh change son front, l’extraction du jeton peut nécessiter un ajustement.
