"use client";

import Link from "next/link";
import { useSelection } from "./SelectionProvider";

export function SelectionDock() {
  const { count, clear } = useSelection();
  if (count === 0) return null;

  return (
    <div className="selection-dock" role="status" aria-live="polite">
      <div className="selection-dock-inner">
        <p className="selection-dock-label">
          <strong>
            {count} recette{count > 1 ? "s" : ""}
          </strong>{" "}
          sélectionnée{count > 1 ? "s" : ""}
        </p>
        <div className="selection-dock-actions">
          <button
            type="button"
            className="btn btn-secondary btn-compact"
            onClick={clear}
          >
            Tout retirer
          </button>
          <Link href="/liste" className="btn btn-primary btn-compact">
            Continuer
          </Link>
        </div>
      </div>
    </div>
  );
}
