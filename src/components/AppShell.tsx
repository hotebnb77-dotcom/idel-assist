"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, ChevronDown, Ellipsis, House, MessageSquareText, Route as RouteIcon, ShieldAlert } from "lucide-react";
import { useCabinetSelectionne, useStore } from "@/lib/store";
import { transmissionsNonLues } from "@/lib/logic";
import { Feuille, Pastille, cx } from "./ui";
import Accueil from "./views/Accueil";
import Planning from "./views/Planning";
import Tournee from "./views/Tournee";
import Transmissions from "./views/Transmissions";
import Plus from "./views/Plus";
import Cabinets from "./views/Cabinets";
import Patients from "./views/Patients";
import Finances from "./views/Finances";
import Reglages from "./views/Reglages";

export type Vue =
  | "accueil"
  | "planning"
  | "tournee"
  | "transmissions"
  | "plus"
  | "cabinets"
  | "patients"
  | "finances"
  | "reglages";

const VUES: Vue[] = ["accueil", "planning", "tournee", "transmissions", "plus", "cabinets", "patients", "finances", "reglages"];

const titres: Record<Vue, string> = {
  accueil: "Accueil",
  planning: "Planning",
  tournee: "Tournée",
  transmissions: "Transmissions",
  plus: "Plus",
  cabinets: "Cabinets",
  patients: "Patients",
  finances: "Finances",
  reglages: "Réglages",
};

const ongletParent: Partial<Record<Vue, Vue>> = { cabinets: "plus", patients: "plus", finances: "plus", reglages: "plus" };

function lireVue(): Vue {
  const h = window.location.hash.replace(/^#\/?/, "") as Vue;
  return VUES.includes(h) ? h : "accueil";
}

/** Navigation par « # » dans l'adresse : simple, fonctionne hors-ligne et avec le bouton retour. */
export function useNavigation() {
  const [vue, setVue] = useState<Vue>("accueil");
  useEffect(() => {
    setVue(lireVue());
    const onHash = () => {
      setVue(lireVue());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const aller = useCallback((v: Vue) => {
    if (window.location.hash !== `#/${v}`) window.location.hash = `/${v}`;
    else setVue(v);
  }, []);
  return { vue, aller };
}

export type Aller = (v: Vue) => void;

const onglets: { vue: Vue; libelle: string; Icone: typeof House }[] = [
  { vue: "accueil", libelle: "Accueil", Icone: House },
  { vue: "planning", libelle: "Planning", Icone: CalendarDays },
  { vue: "tournee", libelle: "Tournée", Icone: RouteIcon },
  { vue: "transmissions", libelle: "Transmissions", Icone: MessageSquareText },
  { vue: "plus", libelle: "Plus", Icone: Ellipsis },
];

export function SelecteurCabinet() {
  const { state, dispatch } = useStore();
  const cabinet = useCabinetSelectionne();
  const [ouvert, setOuvert] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="inline-flex min-h-11 max-w-[60vw] items-center gap-2 rounded-full bg-white px-3 text-sm font-semibold shadow-sm ring-1 ring-slate-200"
        aria-label={`Cabinet sélectionné : ${cabinet.nom}. Changer de cabinet`}
      >
        <Pastille couleur={cabinet.couleur} />
        <span className="truncate">{cabinet.nom}</span>
        <ChevronDown size={16} aria-hidden />
      </button>
      <Feuille ouverte={ouvert} onFermer={() => setOuvert(false)} titre="Choisir le cabinet">
        <ul className="space-y-2" role="list">
          {state.cabinets.map((c) => {
            const actif = c.id === cabinet.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  aria-pressed={actif}
                  onClick={() => {
                    dispatch({ type: "cabinet/selectionner", id: c.id });
                    setOuvert(false);
                  }}
                  className={cx(
                    "flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 text-left ring-1",
                    actif ? "bg-bleu-50 ring-bleu-200" : "bg-white ring-slate-200",
                  )}
                >
                  <Pastille couleur={c.couleur} />
                  <span className="flex-1">
                    <span className="block font-semibold">{c.nom}</span>
                    <span className="block text-sm text-doux">{c.ville}</span>
                  </span>
                  {actif && <span className="text-sm font-semibold text-bleu-700">Sélectionné</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </Feuille>
    </>
  );
}

export default function AppShell() {
  const { vue, aller } = useNavigation();
  const { state } = useStore();
  const cabinet = useCabinetSelectionne();
  const nonLues = transmissionsNonLues(state.transmissions, cabinet.id).length;
  const ongletActif = ongletParent[vue] ?? vue;

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <header className="pt-safe sticky top-0 z-20 bg-fond/90 px-4 pb-2 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-vert-600">IDEL Assist · démo</p>
            <h1 className="truncate text-2xl font-bold">{titres[vue]}</h1>
          </div>
          <SelecteurCabinet />
        </div>
        <p className="mt-2 flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-200">
          <ShieldAlert size={14} aria-hidden />
          Prototype · données fictives uniquement · ne saisissez aucune donnée réelle
        </p>
      </header>

      <main id="contenu" className="flex-1 px-4 pb-32 pt-2">
        {vue === "accueil" && <Accueil aller={aller} />}
        {vue === "planning" && <Planning />}
        {vue === "tournee" && <Tournee />}
        {vue === "transmissions" && <Transmissions />}
        {vue === "plus" && <Plus aller={aller} />}
        {vue === "cabinets" && <Cabinets />}
        {vue === "patients" && <Patients />}
        {vue === "finances" && <Finances />}
        {vue === "reglages" && <Reglages />}
      </main>

      <nav
        aria-label="Navigation principale"
        className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur"
      >
        <ul className="mx-auto grid max-w-xl grid-cols-5" role="list">
          {onglets.map(({ vue: v, libelle, Icone }) => {
            const actif = ongletActif === v;
            return (
              <li key={v}>
                <a
                  href={`#/${v}`}
                  onClick={(e) => {
                    e.preventDefault();
                    aller(v);
                  }}
                  aria-current={actif ? "page" : undefined}
                  className={cx(
                    "relative flex min-h-16 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-semibold",
                    actif ? "text-bleu-700" : "text-slate-500",
                  )}
                >
                  <span className={cx("flex h-8 w-14 items-center justify-center rounded-full", actif && "bg-bleu-100")}>
                    <Icone size={22} aria-hidden strokeWidth={actif ? 2.4 : 2} />
                  </span>
                  <span className="truncate">{libelle}</span>
                  {v === "transmissions" && nonLues > 0 && (
                    <span className="absolute right-[18%] top-1.5 min-w-5 rounded-full bg-vert-600 px-1.5 text-center text-[11px] font-bold text-white">
                      {nonLues}
                      <span className="sr-only"> non lues</span>
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
