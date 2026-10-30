"use client";

import type { Aller } from "./AppShell";
import type { Rubrique } from "./rubriques";
import { cx } from "./ui";

/** Une icône de rubrique façon écran d'accueil de téléphone. */
export function IconeApp({ rubrique, aller, taille = "normale" }: { rubrique: Rubrique; aller: Aller; taille?: "normale" | "grande" }) {
  const { vue, libelle, Icone, degrade } = rubrique;
  const grande = taille === "grande";
  return (
    <a
      href={`#/${vue}`}
      onClick={(e) => {
        e.preventDefault();
        aller(vue);
      }}
      className="flex flex-col items-center gap-1.5 transition-transform active:scale-95"
    >
      <span
        className={cx(
          "flex items-center justify-center bg-gradient-to-br text-white shadow-md",
          degrade,
          grande ? "h-16 w-16 rounded-[1.25rem]" : "h-14 w-14 rounded-2xl",
        )}
      >
        <Icone size={grande ? 30 : 26} aria-hidden strokeWidth={2.1} />
      </span>
      <span className={cx("max-w-full truncate font-medium text-encre", grande ? "text-[13px]" : "text-xs")}>{libelle}</span>
    </a>
  );
}
