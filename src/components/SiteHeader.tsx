"use client";

import Link from "next/link";
import { useSelection } from "./SelectionProvider";

export function SiteHeader() {
  const { count } = useSelection();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="Bocal, accueil">
          <span className="brand-mark" aria-hidden>
            Bo
          </span>
          <span className="brand-name">Bocal</span>
        </Link>
        <nav className="site-nav" aria-label="Principal">
          <Link href="/#recettes" className="nav-link">
            Recettes
          </Link>
          <Link
            href="/liste"
            className={`nav-link${count > 0 ? " nav-link-emphasis" : ""}`}
          >
            Ma liste
            {count > 0 ? (
              <span className="badge" aria-label={`${count} sélectionnées`}>
                {count}
              </span>
            ) : null}
          </Link>
        </nav>
      </div>
    </header>
  );
}
