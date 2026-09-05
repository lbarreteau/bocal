import { RecipeBrowser } from "@/components/RecipeBrowser";
import { SelectionDock } from "@/components/SelectionDock";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Bocal</p>
          <h1>
            Des recettes HelloFresh,
            <span className="hero-accent"> une liste pour ton Drive.</span>
          </h1>
          <p className="lede">
            Sélectionne tes plats de la semaine. On regroupe les ingrédients,
            puis tu ouvres Intermarché ou Leclerc pour remplir ton panier.
          </p>
          <div className="hero-actions">
            <a href="#recettes" className="btn btn-primary">
              Choisir des recettes
            </a>
            <a href="/liste" className="btn btn-secondary">
              Voir ma liste
            </a>
          </div>
        </div>
      </section>
      <RecipeBrowser />
      <SelectionDock />
    </>
  );
}
