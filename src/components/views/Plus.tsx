"use client";

import { Building2, ChevronRight, Settings, Users, Wallet } from "lucide-react";
import type { Aller, Vue } from "../AppShell";

const entrees: { vue: Vue; titre: string; detail: string; Icone: typeof Users; fond: string }[] = [
  { vue: "cabinets", titre: "Cabinets", detail: "Créer, modifier et sélectionner vos cabinets", Icone: Building2, fond: "bg-bleu-100 text-bleu-700" },
  { vue: "patients", titre: "Patients", detail: "Fiches fictives, recherche et filtres", Icone: Users, fond: "bg-vert-100 text-vert-700" },
  { vue: "finances", titre: "Finances", detail: "Jours travaillés, km et rétrocessions", Icone: Wallet, fond: "bg-amber-100 text-amber-800" },
  { vue: "reglages", titre: "Réglages & données", detail: "Réinitialiser la démo, avertissements", Icone: Settings, fond: "bg-slate-200 text-slate-700" },
];

export default function Plus({ aller }: { aller: Aller }) {
  return (
    <ul className="mt-2 space-y-3" role="list">
      {entrees.map(({ vue, titre, detail, Icone, fond }) => (
        <li key={vue}>
          <a
            href={`#/${vue}`}
            onClick={(e) => {
              e.preventDefault();
              aller(vue);
            }}
            className="flex min-h-20 items-center gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
          >
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${fond}`}>
              <Icone aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block text-lg font-bold">{titre}</span>
              <span className="block text-sm text-doux">{detail}</span>
            </span>
            <ChevronRight className="text-slate-400" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}
