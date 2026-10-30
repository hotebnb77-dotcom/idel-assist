"use client";

import type { Aller } from "../AppShell";
import { rubriques } from "../rubriques";
import { IconeApp } from "../IconeApp";

/** Écran « Menu » : toutes les rubriques sous forme d'icônes d'application. */
export default function Plus({ aller }: { aller: Aller }) {
  return (
    <div className="mt-2">
      <ul className="grid grid-cols-3 gap-x-3 gap-y-5 rounded-[2rem] bg-white p-5 shadow-[0_2px_12px_rgba(30,42,59,0.06)] ring-1 ring-slate-100" role="list">
        {rubriques.map((r) => (
          <li key={r.vue}>
            <IconeApp rubrique={r} aller={aller} taille="grande" />
          </li>
        ))}
      </ul>
      <p className="mt-4 text-center text-xs text-doux">Touchez une rubrique pour l'ouvrir</p>
    </div>
  );
}
